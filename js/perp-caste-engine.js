/**
 * Caste-ecology tagging. Adult adjacency only. Never a playable CSA path.
 */

import { PERP_CASTE_TAG_INDEX } from "./data/perp-caste-tags-database.js";
import { PERP_CASTE_COST_NOTE } from "./data/perp-caste-rules.js";
import { addCharacterTag } from "./tag-system.js";

export function emptyCasteState() {
  return {
    intensity: 0,
    adjacency: 0,
    log: [],
  };
}

export function ensureCasteState(character) {
  if (!character.casteState) character.casteState = emptyCasteState();
  return character.casteState;
}

export function stampCasteTags(character, ids = []) {
  const applied = [];
  for (const id of [...new Set(ids || [])]) {
    if (!id || !String(id).startsWith("caste_")) continue;
    const def = PERP_CASTE_TAG_INDEX[id];
    const added = addCharacterTag(character, def
      ? {
        id: def.id,
        category: "caste",
        label: def.label,
        source: "caste",
        reason: def.reason,
        hooks: def.hooks,
        valence: "contextual",
        advantageIn: def.advantageIn,
        strainIn: def.strainIn,
        temporary: false,
      }
      : { id, label: id, source: "caste", category: "caste" });
    if (added) applied.push(id);
  }
  return applied;
}

export function applyPerpCaste(character, spec = {}, time = {}) {
  if (!character || !spec || !(spec.tags || []).length) {
    return { applied: [], notes: [] };
  }
  const state = ensureCasteState(character);
  const intensity = Math.max(1, Number(spec.intensity || 6));
  state.intensity = Math.min(100, state.intensity + intensity);
  state.adjacency = Math.min(100, state.adjacency + Math.ceil(intensity / 2));
  const applied = stampCasteTags(character, spec.tags);
  state.log.push({
    year: time.year ?? null,
    iso: time.iso ?? null,
    intensity,
    tags: (spec.tags || []).slice(),
  });
  if (state.log.length > 40) state.log.splice(0, state.log.length - 40);

  const notes = applied.map((id) => {
    const def = PERP_CASTE_TAG_INDEX[id];
    return def?.label ? `${def.label}開始改寫誰肯跟你排隊。` : "有人開始核對你是不是「那一掛」。";
  });
  if (applied.length) {
    notes.push("靠近、目擊或動手，都會在後面的日子裡繼續要價。");
  }
  return { applied, notes, intensity: state.intensity };
}

export function modifyResolutionForCaste(character, option, effects, texts) {
  const records = (character?.tagRecords || []).filter((item) => item.category === "caste" || (item.id || "").startsWith("caste_"));
  if (!records.length) return { effects, extraRisk: 0 };
  const next = { ...effects };
  let extraRisk = 0;
  const adjacent = records.some((item) => item.id === "caste_adjacent" || item.id === "caste_reputation");
  const enforcer = records.some((item) => item.id === "caste_enforcer");
  const revulse = records.some((item) => item.id === "caste_revulsion");
  const hooks = option.hooks || [];

  if (adjacent && hooks.some((hook) => ["social", "family", "official", "trade"].includes(hook))) {
    extraRisk += 0.08;
    if (next.charm > 0) next.charm = Math.max(0, next.charm - 1);
    texts.push("株連先發言：有人在核對你是不是「那一掛」。");
  }
  if (enforcer && hooks.some((hook) => ["official", "prison"].includes(hook))) {
    extraRisk += 0.1;
    next.mood = (next.mood || 0) - 1;
  }
  if (revulse && hooks.includes("social")) {
    extraRisk += 0.04;
  }
  return { effects: next, extraRisk };
}

export function weeklyCastePressure(character) {
  const state = character?.casteState;
  if (!state?.intensity) return { moodDelta: 0, note: "" };
  if (state.intensity < 16) return { moodDelta: 0, note: "" };
  return {
    moodDelta: -1,
    note: "種姓汙染在沒有事件的日子裡仍佔用睡眠：否認的句子、或那一場「跌倒」。",
  };
}

export { PERP_CASTE_TAG_DATABASE, PERP_CASTE_TAG_INDEX } from "./data/perp-caste-tags-database.js";
export { PERP_CASTE_COST_NOTE };
