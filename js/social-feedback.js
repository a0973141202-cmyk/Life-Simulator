/**
 * Hidden reputation / notoriety / social-credit facing.
 *
 * Meters live on Character.ledger (and mirrored on Character).
 * The HUD must not print scores unless SHOW_REPUTATION_UI is true.
 * Players read standing from NPC attitude, weekly copy, and hidden tags.
 */

import { SHOW_REPUTATION_UI } from "./data/ui-config.js";
import { LEDGER_MAX, LEDGER_MIN } from "./data/ledger-schema.js";
import { addCharacterTag, characterHasTag, removeCharacterTag } from "./tag-system.js";

export { SHOW_REPUTATION_UI };

export const SOCIAL_METER_KEYS = Object.freeze([
  "reputation",
  "notoriety",
  "socialCredit",
  "opinion",
  "infamy",
  "trust",
]);

export const SOCIAL_BANDS = Object.freeze([
  "feared",
  "shunned",
  "cold",
  "ordinary",
  "trusted",
  "courted",
]);

const BAND_TAGS = Object.freeze({
  feared: {
    id: "social_feared",
    label: "被人怕",
    reason: "惡名與恐懼已寫進路人的身體反應，不寫進你的自我評估。",
  },
  shunned: {
    id: "social_shunned",
    label: "被排開",
    reason: "排隊、租屋、介紹都在少你一個位子。",
  },
  cold: {
    id: "social_cold",
    label: "被冷遇",
    reason: "招呼變短。沒人解釋為什麼。",
  },
  ordinary: {
    id: "social_ordinary",
    label: "路人級",
    reason: "沒人特別記得你。這本身也是一種評價。",
  },
  trusted: {
    id: "social_trusted",
    label: "還被肯認",
    reason: "有人肯把名字和你放在同一張桌上。",
  },
  courted: {
    id: "social_courted",
    label: "被人靠近",
    reason: "門開得比較快。靠近你的人通常有自己的帳。",
  },
});

const FEEDBACK_LINES = Object.freeze({
  feared: [
    "路人先把視線挪開。不是禮貌，是不想被認成跟你一夥。",
    "櫃檯的手停半秒，再把找零放在桌沿。距離是他們給你的評語。",
    "有人過馬路。沒有人叫你的名字。恐懼比辱罵更安靜。",
  ],
  shunned: [
    "排隊時有人往旁邊讓出半步。位子空著，解釋不來。",
    "介紹停在姓氏之前。房間裡的椅子少了一張，剛好是你的。",
    "鄰桌把話壓低。不是密謀，是不想讓你聽見自己被怎麼歸類。",
  ],
  cold: [
    "招呼變短。找零放在桌上，不放進你手心。",
    "門開了，沒人幫你扶。這不是敵意，是你已經不在優先名單上。",
    "問事的人看完你，改問旁邊那個。答案一樣，對象換了。",
  ],
  ordinary: [
    "沒人特別記得你。街聲把你當成路的一部分。",
    "這一週沒有額外的笑，也沒有額外的避開。普通本身就是評價。",
    "店員按流程收錢。你的臉還沒被寫進他們的分類裡。",
  ],
  trusted: [
    "有人把椅子往你這邊挪。不是奉承，是還肯把名字跟你放在同一張桌上。",
    "問事的人先看你。他們賭你會把話說明白，而不是先把人賣掉。",
    "門開著留給你。這週的信用還沒被用完。",
  ],
  courted: [
    "門為你開得比較快。有人先笑，再看你要什麼。",
    "座位往你讓。靠近你的人通常已經算過自己能換到什麼。",
    "介紹變長。名字被複述時，房間裡的空氣跟著變熱。",
  ],
});

const UPHEAVAL_FEEDBACK = Object.freeze({
  feared: [
    "動盪週裡沒人敢挨你。讓路的速度比命令快。",
    "穿制服的人先看你，再決定這次要不要當沒看見。",
  ],
  shunned: [
    "時局一緊，隊伍把你往外擠。沒有人解釋理由。",
    "窗口的人用下巴指旁邊。你這種人這週不收。",
  ],
  cold: [
    "問事被改口成「下一個」。動盪讓冷遇變得理直氣壯。",
    "找零仍放桌上。他們連眼神都不想借給你。",
  ],
  ordinary: [
    "時局一緊，沒人特別害你，也沒人記得讓路。",
    "排隊照舊。只是每個人都把話講得更短。",
  ],
  trusted: [
    "有人把你從檢查的隊伍裡叫進去。不是特權公開，是暫時肯擔保。",
    "熟識的人塞來一句路訊：今晚哪條巷能走、哪張嘴不能信。",
  ],
  courted: [
    "門為你留著。動盪裡靠近你的人，要的是你現在還能換到的位子。",
    "有人把你帶到後門。後門有資訊，也有下次要還的帳。",
  ],
});

function clampMeter(value) {
  return Math.max(LEDGER_MIN, Math.min(LEDGER_MAX, Math.round(Number(value) || 0)));
}

function pickLine(lines, salt = 0) {
  const index = Math.abs(Math.trunc(salt)) % lines.length;
  return lines[index];
}

export function socialStanding(source = {}) {
  const ledger = source.ledger || source;
  const reputation = clampMeter(ledger.reputation ?? ledger.opinion ?? 50);
  const notoriety = clampMeter(ledger.notoriety ?? 0);
  const socialCredit = clampMeter(ledger.socialCredit ?? ledger.trust ?? 50);
  const opinion = clampMeter(ledger.opinion ?? reputation);
  const infamy = clampMeter(ledger.infamy ?? 0);
  const trust = clampMeter(ledger.trust ?? socialCredit);
  const wanted = clampMeter(ledger.wanted ?? 0);

  let band = "ordinary";
  if (notoriety >= 55 || infamy >= 50 || (reputation <= 14 && (notoriety >= 28 || wanted >= 40))) {
    band = "feared";
  } else if (reputation <= 22 || socialCredit <= 22 || (infamy >= 28 && reputation < 42)) {
    band = "shunned";
  } else if (reputation <= 38 || socialCredit <= 35 || opinion <= 32 || trust <= 30) {
    band = "cold";
  } else if (reputation >= 78 && socialCredit >= 70 && notoriety < 18 && infamy < 16) {
    band = "courted";
  } else if (reputation >= 62 && notoriety < 25 && infamy < 22 && socialCredit >= 55) {
    band = "trusted";
  }

  const jobMod =
    (reputation - 50) * 0.0022 +
    (socialCredit - 50) * 0.0026 -
    notoriety * 0.0014 -
    infamy * 0.0018;
  const gangMod =
    notoriety * 0.0024 +
    infamy * 0.0016 -
    Math.max(0, reputation - 55) * 0.0012;
  const policeMod =
    (socialCredit - 50) * 0.0028 -
    wanted * 0.003 -
    notoriety * 0.0022 -
    infamy * 0.0015;

  return {
    reputation,
    notoriety,
    socialCredit,
    opinion,
    infamy,
    trust,
    band,
    jobMod,
    gangMod,
    policeMod,
    jobHireMult: band === "feared" ? 0.42 : band === "shunned" ? 0.55 : band === "cold" ? 0.78 : band === "trusted" ? 1.22 : band === "courted" ? 1.4 : 1,
    gangHireMult: band === "feared" ? 1.55 : band === "shunned" ? 1.22 : band === "cold" ? 1.04 : band === "trusted" ? 0.72 : band === "courted" ? 0.48 : 1,
  };
}

export function describeSocialFeedback(source = {}, options = {}) {
  const standing = socialStanding(source);
  const lines = FEEDBACK_LINES[standing.band] || FEEDBACK_LINES.ordinary;
  const salt = options.salt ?? standing.reputation + standing.notoriety * 3 + standing.socialCredit * 5;
  const base = pickLine(lines, salt);
  const upheaval = options.upheaval;
  if (!upheaval?.id || (upheaval.tier || 0) < 1) return base;
  const extraPack = UPHEAVAL_FEEDBACK[standing.band] || UPHEAVAL_FEEDBACK.ordinary;
  const extra = pickLine(extraPack, salt + String(upheaval.id).length * 7);
  return `${base}\n${extra}`;
}

export function socialAttemptMod(ledger, kind = "job") {
  const standing = socialStanding(ledger);
  if (kind === "police" || kind === "checkpoint" || kind === "search") return standing.policeMod;
  if (kind === "gang" || kind === "crime" || kind === "narcotics" || kind === "militant") return standing.gangMod;
  if (kind === "job" || kind === "lawful" || kind === "commerce" || kind === "politics" || kind === "historical") {
    return standing.jobMod;
  }
  return standing.jobMod * 0.35;
}

export function exposeSocialMeters(character, ledger) {
  if (!character || !ledger) return ledger;
  character.reputation = ledger.reputation;
  character.notoriety = ledger.notoriety;
  character.socialCredit = ledger.socialCredit;
  return ledger;
}

export function followSocialMeters(ledger, applied = {}) {
  if (!ledger || !applied) return applied;

  if (!("reputation" in applied)) {
    let drift = 0;
    if (applied.opinion) drift += applied.opinion;
    if (applied.infamy) drift -= Math.round(applied.infamy * 0.45);
    if (applied.notoriety) drift -= Math.round(applied.notoriety * 0.2);
    if (drift) {
      const before = ledger.reputation ?? 50;
      ledger.reputation = clampMeter(before + drift);
      applied.reputation = ledger.reputation - before;
    }
  }

  if (!("socialCredit" in applied)) {
    let drift = 0;
    if (applied.trust) drift += Math.round(applied.trust * 0.7);
    if (applied.opinion) drift += Math.round(applied.opinion * 0.35);
    if (applied.infamy) drift -= Math.round(applied.infamy * 0.4);
    if (applied.wanted) drift -= Math.round(applied.wanted * 0.25);
    if (applied.notoriety) drift -= Math.round(applied.notoriety * 0.2);
    if (drift) {
      const before = ledger.socialCredit ?? 50;
      ledger.socialCredit = clampMeter(before + drift);
      applied.socialCredit = ledger.socialCredit - before;
    }
  }

  if (!("notoriety" in applied) && applied.infamy) {
    const before = ledger.notoriety ?? 0;
    ledger.notoriety = clampMeter(before + Math.round(applied.infamy * 0.5));
    if (ledger.notoriety !== before) applied.notoriety = ledger.notoriety - before;
  }

  return applied;
}

export function syncSocialTags(character) {
  if (!character) return { changed: [], standing: socialStanding({}) };
  const standing = socialStanding(character.ledger || character);
  const changed = [];
  const hideChip = !SHOW_REPUTATION_UI;

  for (const [band, meta] of Object.entries(BAND_TAGS)) {
    const has = characterHasTag(character, meta.id);
    const on = standing.band === band;
    if (!has && on) {
      addCharacterTag(character, {
        id: meta.id,
        category: "social",
        label: meta.label,
        source: "social",
        reason: meta.reason,
        valence: "contextual",
        hidden: hideChip,
        temporary: true,
      });
      changed.push({ action: "add", tag: meta.id, label: meta.label, hidden: hideChip });
    } else if (has && !on) {
      removeCharacterTag(character, meta.id);
      changed.push({ action: "remove", tag: meta.id, label: meta.label });
    } else if (has && on) {
      const record = character.tagRecords?.find((item) => item.id === meta.id);
      if (record && record.hidden !== hideChip) {
        record.hidden = hideChip;
        if (character.tagStore?.index?.has(meta.id)) {
          character.tagStore.get(meta.id).hidden = hideChip;
        }
      }
    }
  }

  return { changed, standing };
}

export function describeSocialMeters(ledger) {
  if (!ledger) return "";
  const standing = socialStanding(ledger);
  if (!SHOW_REPUTATION_UI) return describeSocialFeedback(ledger);
  return `聲望 ${standing.reputation}／惡名 ${standing.notoriety}／社會信用 ${standing.socialCredit}。`;
}
