/**
 * Persistent crime / politics ledger. Independent from weekly stat effects.
 */

import {
  LEDGER_LOG_LIMIT,
  LEDGER_MAX,
  LEDGER_METERS,
  LEDGER_MIN,
  LEDGER_PATHS,
  PATH_XP_MAX,
  TRUST_BY_CLASS,
} from "./data/ledger-schema.js";
import { LEDGER_TAG_RULES } from "./data/path-tags-database.js";
import { SHOW_REPUTATION_UI } from "./data/ui-config.js";
import { addCharacterTag, characterHasTag, removeCharacterTag } from "./tag-system.js";
import { exposeSocialMeters, followSocialMeters, syncSocialTags } from "./social-feedback.js";
import { applyWealthDelta, ensureWealth } from "./wealth-engine.js";

// #region agent log
fetch("http://127.0.0.1:7279/ingest/ef06ca9d-d21b-4fa2-ab19-0a6f383a196a",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"7687e1"},body:JSON.stringify({sessionId:"7687e1",location:"ledger.js:import",message:"ledger-module-evaluating",data:{ok:true},timestamp:Date.now(),hypothesisId:"A"})}).catch(()=>{});
// #endregion

function clampMeter(value) {
  return Math.max(LEDGER_MIN, Math.min(LEDGER_MAX, Math.round(value)));
}

function clampXp(value) {
  return Math.max(0, Math.min(PATH_XP_MAX, Math.round(value)));
}

function emptyPaths() {
  const paths = {};
  for (const key of LEDGER_PATHS) paths[key] = 0;
  return paths;
}

export function createLedger(options = {}) {
  const trust = options.trust ?? TRUST_BY_CLASS[options.familyClassId] ?? 50;
  return {
    wanted: clampMeter(options.wanted ?? 0),
    heat: clampMeter(options.heat ?? 0),
    trust: clampMeter(trust),
    opinion: clampMeter(options.opinion ?? 50),
    notoriety: clampMeter(options.notoriety ?? 0),
    politicalCapital: clampMeter(options.politicalCapital ?? 0),
    infamy: clampMeter(options.infamy ?? 0),
    healthRisk: clampMeter(options.healthRisk ?? 0),
    reputation: clampMeter(options.reputation ?? options.opinion ?? 50),
    socialCredit: clampMeter(options.socialCredit ?? options.trust ?? trust),
    paths: { ...emptyPaths(), ...(options.paths || {}) },
    log: Array.isArray(options.log) ? options.log.slice(-LEDGER_LOG_LIMIT) : [],
    lastCrimeWeek: options.lastCrimeWeek ?? null,
    lastPoliticsWeek: options.lastPoliticsWeek ?? null,
    flags: Array.isArray(options.flags) ? options.flags.slice() : [],
  };
}

export function ensureLedger(character) {
  if (!character) return createLedger();
  if (!character.ledger) {
    character.ledger = createLedger({ familyClassId: character.familyClassId });
  } else {
    character.ledger = createLedger({
      ...character.ledger,
      familyClassId: character.familyClassId,
      paths: { ...emptyPaths(), ...(character.ledger.paths || {}) },
    });
  }
  exposeSocialMeters(character, character.ledger);
  return character.ledger;
}

export function applyLedgerDeltas(ledger, deltas = {}, time = {}, note = "") {
  const applied = {};
  for (const key of LEDGER_METERS) {
    const delta = Number(deltas[key] || 0);
    if (!delta) continue;
    const before = ledger[key] ?? 0;
    ledger[key] = clampMeter(before + delta);
    applied[key] = ledger[key] - before;
  }
  followSocialMeters(ledger, applied);

  const pathKey = deltas.path;
  if (pathKey && LEDGER_PATHS.includes(pathKey)) {
    const xp = Number(deltas.pathXp ?? 1);
    const before = ledger.paths[pathKey] || 0;
    ledger.paths[pathKey] = clampXp(before + xp);
    applied.path = pathKey;
    applied.pathXp = ledger.paths[pathKey] - before;
    if (pathKey === "crime" || pathKey === "narcotics" || pathKey === "militant") {
      ledger.lastCrimeWeek = time.totalWeeksLived ?? time.week ?? null;
    }
    if (pathKey === "politics" || pathKey === "historical" || pathKey === "lawful") {
      ledger.lastPoliticsWeek = time.totalWeeksLived ?? time.week ?? null;
    }
  }

  if (Object.keys(applied).length) {
    ledger.log.push({
      year: time.year ?? null,
      month: time.month ?? null,
      day: time.day ?? null,
      iso: time.iso ?? null,
      week: time.week ?? null,
      note: note || deltas.eventLabel || pathKey || "ledger",
      applied,
    });
    if (ledger.log.length > LEDGER_LOG_LIMIT) {
      ledger.log.splice(0, ledger.log.length - LEDGER_LOG_LIMIT);
    }
  }

  return applied;
}

export function applyHiddenOutcome(character, hidden = {}, time = {}) {
  // #region agent log
  fetch("http://127.0.0.1:7279/ingest/ef06ca9d-d21b-4fa2-ab19-0a6f383a196a",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"7687e1"},body:JSON.stringify({sessionId:"7687e1",location:"ledger.js:applyHiddenOutcome",message:"applyHiddenOutcome-defined",data:{hiddenKeys:Object.keys(hidden||{})},timestamp:Date.now(),hypothesisId:"A"})}).catch(()=>{});
  // #endregion
  if (!character || !hidden) return null;
  const meansDelta = Number(hidden.means || 0);
  if (meansDelta) {
    ensureWealth(character);
    applyWealthDelta(character, { means: meansDelta }, time);
  }
  return applyLedgerDeltas(ensureLedger(character), {
    reputation: hidden.reputation,
    notoriety: hidden.notoriety,
    heat: hidden.heat,
    opinion: hidden.opinion,
    trust: hidden.trust,
  }, time, "");
}

export function dominantPath(ledger) {
  let best = "lawful";
  let score = -1;
  for (const key of LEDGER_PATHS) {
    const value = ledger?.paths?.[key] || 0;
    if (value > score) {
      score = value;
      best = key;
    }
  }
  return { id: best, xp: score };
}

function ruleActive(rule, ledger) {
  if (rule.path) return (ledger.paths?.[rule.path] || 0) >= (rule.minXp ?? 1);
  const value = ledger[rule.meter] ?? 0;
  if (rule.invert) return value <= (rule.max ?? 0);
  return value >= (rule.min ?? 0);
}

function ruleShouldExit(rule, ledger) {
  if (rule.path) return (ledger.paths?.[rule.path] || 0) < (rule.minXp ?? 1);
  const value = ledger[rule.meter] ?? 0;
  if (rule.invert) return value >= (rule.exit ?? rule.max ?? 0);
  return value <= (rule.exit ?? Math.max(0, (rule.min ?? 0) - 12));
}

export function syncLedgerTags(character) {
  const ledger = ensureLedger(character);
  const changed = [];
  for (const rule of LEDGER_TAG_RULES) {
    const has = characterHasTag(character, rule.tag);
    const on = ruleActive(rule, ledger);
    if (!has && on) {
      addCharacterTag(character, {
        id: rule.tag,
        category: rule.tag.startsWith("path_") ? "path" : "acquired",
        label: rule.label,
        source: "ledger",
        reason: rule.reason,
        valence: "contextual",
        advantageIn: rule.advantageIn,
        strainIn: rule.strainIn,
        temporary: Boolean(rule.meter),
        hidden: Boolean(rule.hideUnlessReputationUi && !SHOW_REPUTATION_UI),
      });
      changed.push({ action: "add", tag: rule.tag, label: rule.label });
    } else if (has && on && rule.hideUnlessReputationUi) {
      const record = character.tagRecords?.find((item) => item.id === rule.tag);
      const hide = !SHOW_REPUTATION_UI;
      if (record && record.hidden !== hide) record.hidden = hide;
    } else if (has && ruleShouldExit(rule, ledger) && (rule.meter || rule.path)) {
      if (rule.path && !rule.meter) continue;
      if (rule.meter) {
        removeCharacterTag(character, rule.tag);
        changed.push({ action: "remove", tag: rule.tag, label: rule.label });
      }
    }
  }
  const social = syncSocialTags(character);
  if (social.changed.length) changed.push(...social.changed);
  return { ledger, changed };
}

export {
  LEDGER_METERS,
  LEDGER_PATHS,
  LEDGER_TAG_RULES,
};
