/**
 * Consequence & Karma engine.
 * Applies ledger deltas, historical backlash, and destructive endings.
 * Does not veto choices; it prices them.
 */

import { OCCUPATION_BY_PATH } from "./data/ledger-schema.js";
import { SHOW_REPUTATION_UI } from "./data/ui-config.js";
import { applyLedgerDeltas, dominantPath, ensureLedger, syncLedgerTags } from "./ledger.js";
import { crisisPressure, evaluateAttempt, weeklyHealthRiskChance } from "./risk-calculator.js";
import { chance } from "./rng.js";
import { zhPath, zhPressure } from "./data/ui-zh.js";

function mergeDeltas(...parts) {
  const out = {};
  for (const part of parts) {
    if (!part) continue;
    for (const [key, value] of Object.entries(part)) {
      if (value == null || key === "eventLabel") {
        if (key === "eventLabel" && value) out.eventLabel = value;
        continue;
      }
      if (key === "path") {
        out.path = value;
        continue;
      }
      if (typeof value === "number") out[key] = (out[key] || 0) + value;
      else out[key] = value;
    }
  }
  return out;
}

function occupationFromLedger(character) {
  const { id, xp } = dominantPath(character.ledger);
  if (xp < 3) return;
  const label = OCCUPATION_BY_PATH[id];
  if (!label) return;
  const current = character.occupation;
  if (!current || current === "無" || Object.values(OCCUPATION_BY_PATH).includes(current) || [
    "務農", "學徒/匠人", "工人", "幫鋪/跑商", "讀書/教職", "文書", "行伍", "家業打理", "雜工", "謀生",
  ].includes(current)) {
    character.occupation = label;
  }
}

function backlashDeltas(roll, attempt = {}) {
  const fail = attempt.onFailure || {};
  const extra = attempt.onBacklash || {};
  const scale = (roll.severity || 20) / 40;
  return mergeDeltas(
    {
      wanted: Math.round(12 * scale * (roll.wantedMult || 1)),
      heat: Math.round(14 * scale),
      trust: Math.round(-10 * scale),
      opinion: Math.round(-8 * scale),
      infamy: Math.round(6 * scale),
      healthRisk: Math.round(4 * scale),
    },
    fail,
    extra,
  );
}

export function applyChoiceConsequences(rng, character, option, time) {
  const ledger = ensureLedger(character);
  const consequence = option?.consequence || {};
  const attempt = option?.attempt || consequence.attempt || null;
  const notes = [];
  let roll = null;

  let deltas = mergeDeltas(
    {
      wanted: consequence.wanted,
      heat: consequence.heat,
      trust: consequence.trust,
      opinion: consequence.opinion,
      notoriety: consequence.notoriety,
      politicalCapital: consequence.politicalCapital,
      infamy: consequence.infamy,
      healthRisk: consequence.healthRisk,
      path: consequence.path || option.path,
      pathXp: consequence.pathXp ?? (option.path ? 1 : 0),
      eventLabel: consequence.eventLabel || option.text,
    },
  );

  if (attempt) {
    roll = evaluateAttempt(rng, character, time, attempt);
    notes.push(roll.narrative);
    if (roll.success) {
      deltas = mergeDeltas(deltas, attempt.onSuccess);
    } else {
      deltas = mergeDeltas(deltas, attempt.onFailure, {
        wanted: Math.round(8 * (roll.wantedMult || 1)),
        heat: 10,
        trust: -6,
        opinion: -5,
      });
    }
    if (roll.backlash) {
      deltas = mergeDeltas(deltas, backlashDeltas(roll, attempt));
      notes.push("歷史或國家機器的反噬已經寫進這一週的帳單。");
    }
  }

  if ((deltas.wanted || 0) > 0) {
    deltas.wanted = Math.round((deltas.wanted || 0) * (roll?.wantedMult || 1));
  }

  const applied = applyLedgerDeltas(ledger, deltas, time, option.text);
  const tags = syncLedgerTags(character);
  occupationFromLedger(character);

  const ending = checkDestructiveEnding(rng, character, {
    afterChoice: true,
    option,
    roll,
  });

  return {
    applied,
    deltas,
    roll,
    notes,
    tagsChanged: tags.changed,
    pressure: crisisPressure(ledger),
    ending,
    addTags: consequence.addTags || [],
  };
}

export function weeklyConsequenceTick(character, time = {}) {
  const ledger = ensureLedger(character);
  const notes = [];
  const heatBefore = ledger.heat;
  ledger.heat = Math.max(0, Math.round(ledger.heat * 0.82) - 1);
  if (heatBefore >= 20 && ledger.heat < heatBefore) {
    notes.push("風聲略降，但通緝不會自己忘記你。");
  }

  const week = time.totalWeeksLived ?? time.week;
  const crimeThisWeek = week != null && ledger.lastCrimeWeek === week;
  if (ledger.heat < 18 && ledger.wanted > 0 && !crimeThisWeek) {
    ledger.wanted = Math.max(0, ledger.wanted - 1);
  }

  if (ledger.opinion < 50) ledger.opinion = Math.min(50, ledger.opinion + 1);
  if (ledger.opinion > 55) ledger.opinion = Math.max(50, ledger.opinion - 1);

  const tags = syncLedgerTags(character);
  return { notes, pressure: crisisPressure(ledger), tagsChanged: tags.changed };
}

export function rollLifestyleRisk(rng, character) {
  const ledger = ensureLedger(character);
  if (!chance(rng, weeklyHealthRiskChance(ledger))) {
    return { hit: false, healthDelta: 0, text: "" };
  }
  const healthDelta = -Math.max(1, Math.round((ledger.healthRisk || 0) / 25) + 1);
  return {
    hit: true,
    healthDelta,
    text: "累積的風險開始咬身體：逃亡、夜路、或地下貨流的副作用不請自來。",
  };
}

/**
 * Ruin endings. The sandbox does not block the path that got the player here.
 */
export function checkDestructiveEnding(rng, character, { afterChoice = false, option = null, roll = null } = {}) {
  const ledger = character.ledger || {};
  const pressure = crisisPressure(ledger);
  const health = character.stats?.health ?? 50;

  if (option?.ending?.force) {
    return makeEnding(option.ending.reason || "毀滅", option.ending.detail || "這一選擇把故事直接折斷。");
  }

  if (roll && !roll.success && roll.backlash && (roll.kind === "seize_power" || roll.kind === "coup" || roll.kind === "historical_turn")) {
    if (roll.severity >= 55 && rng() < 0.35) {
      return makeEnding("整肅", "奪權失敗被寫成公開的教訓。名字從名冊上被劃掉，比死亡更乾淨。");
    }
  }

  if (roll && roll.kind === "militant_strike" && !roll.success && rng() < 0.28) {
    return makeEnding("鎮壓", "國家機器比口號更快。你的武裝政治在一次清剿裡結束。");
  }

  if (afterChoice && option?.path === "narcotics" && ledger.healthRisk >= 70 && health <= 18 && rng() < 0.2) {
    return makeEnding("貨流反噬", "帝國還在，身體先退出。地下貨流的代價終於收完這一筆。");
  }

  if (pressure.level === "ruin" && ledger.wanted >= 88 && ledger.heat >= 62) {
    const fatal = afterChoice ? 0.22 : 0.08;
    if (rng() < fatal) {
      return makeEnding(
        rng() < 0.5 ? "處決" : "失蹤",
        rng() < 0.5
          ? "通緝值與熱度疊在一起時，公開的結局比逃亡更便宜。"
          : "沒有審判紀錄。只剩下一個不再被問起的名字。",
      );
    }
  }

  if (pressure.level === "ruin" && ledger.wanted >= 78 && rng() < (afterChoice ? 0.18 : 0.05)) {
    return makeEnding("下獄", "社會信任見底之後，牢房比巷子更像歸宿。故事在鐵門後改寫成別人的。");
  }

  if ((ledger.paths?.historical || 0) >= 6 && ledger.opinion <= 12 && ledger.politicalCapital >= 40 && rng() < 0.06) {
    return makeEnding("被推翻", "你短暫改寫了時代。時代用廣場和槍口把筆奪回去。");
  }

  return null;
}

function makeEnding(reason, detail) {
  return { reason, detail, destructive: true };
}

export function describeLedger(ledger, extra = {}) {
  if (!ledger) return "";
  const { id } = dominantPath(ledger);
  const pressure = crisisPressure(ledger, extra);
  if (!SHOW_REPUTATION_UI) {
    return `主路徑仍在${zhPath(id)}一帶。公開壓力：${zhPressure(pressure.level)}。`;
  }
  return `通緝 ${ledger.wanted}／熱度 ${ledger.heat}／信任 ${ledger.trust}／輿論 ${ledger.opinion}／聲望 ${ledger.reputation}／惡名 ${ledger.notoriety}／社會信用 ${ledger.socialCredit}／政治資本 ${ledger.politicalCapital}。主路徑仍在${zhPath(id)}一帶，壓力 ${zhPressure(pressure.level)}。`;
}

export { crisisPressure, evaluateAttempt };
