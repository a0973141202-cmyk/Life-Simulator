/**
 * Trauma tagging and cost application.
 * Does not glorify injury. Does not clear trauma on a good week.
 */

import { TRAUMA_TAG_INDEX } from "./data/trauma-tags-database.js";
import { TRAUMA_COST_NOTE } from "./data/trauma-writing-rules.js";
import { addCharacterTag } from "./tag-system.js";

export function emptyTraumaState() {
  return {
    intensity: 0,
    domains: { home: 0, school: 0, labor: 0, authority: 0 },
    log: [],
  };
}

export function ensureTraumaState(character) {
  if (!character.traumaState) character.traumaState = emptyTraumaState();
  if (!character.traumaState.domains) {
    character.traumaState.domains = { home: 0, school: 0, labor: 0, authority: 0 };
  }
  return character.traumaState;
}

export function applyTrauma(character, spec = {}, time = {}) {
  if (!character || !spec || !(spec.tags || []).length) {
    return { applied: [], notes: [] };
  }
  const state = ensureTraumaState(character);
  const intensity = Math.max(1, Number(spec.intensity || 6));
  state.intensity = Math.min(100, state.intensity + intensity);
  const domain = spec.domain || "home";
  if (state.domains[domain] != null) state.domains[domain] += intensity;
  else state.domains[domain] = intensity;

  const tagIds = [...new Set(spec.tags || [])];
  if (state.intensity >= 28) tagIds.push("trauma_cannot_ask_help");

  const applied = [];
  for (const id of [...new Set(tagIds)]) {
    const def = TRAUMA_TAG_INDEX[id];
    if (!def) continue;
    const added = addCharacterTag(character, {
      id: def.id,
      category: "trauma",
      label: def.label,
      source: "trauma",
      reason: def.reason,
      hooks: def.hooks,
      valence: "contextual",
      advantageIn: def.advantageIn,
      strainIn: def.strainIn,
      temporary: false,
    });
    if (added) applied.push({ id: def.id, label: def.label });
  }

  state.log.push({
    year: time.year ?? null,
    iso: time.iso ?? null,
    domain,
    intensity,
    tags: [...new Set(tagIds)],
  });
  if (state.log.length > 40) state.log.splice(0, state.log.length - 40);

  const notes = applied.map((row) => (
    `${row.label}留下了痕跡。`
  ));
  if (applied.length) {
    notes.push("這一週的傷不會自己散掉。");
  }
  return { applied, notes, intensity: state.intensity };
}

export function modifyResolutionForTrauma(character, option, effects, texts) {
  const records = (character?.tagRecords || []).filter((item) => item.category === "trauma" || (item.id || "").startsWith("trauma_"));
  if (!records.length) return { effects, extraRisk: 0 };

  const hooks = option.hooks || [];
  let extraRisk = 0;
  const next = { ...effects };

  const strained = records.some((item) => (item.strainIn || []).some((hook) => hooks.includes(hook)));
  const vigil = records.some((item) => item.id === "trauma_hypervigilance");
  const disso = records.some((item) => item.id === "trauma_dissociation");
  const rage = records.some((item) => item.id === "trauma_rage_leak" || item.id === "trauma_cruelty_rehearsal");
  const noAsk = records.some((item) => item.id === "trauma_cannot_ask_help");

  if (strained) {
    for (const key of Object.keys(next)) {
      if (typeof next[key] === "number" && next[key] > 0) next[key] = Math.max(0, next[key] - 1);
      if (key === "mood" && typeof next[key] === "number") next[key] -= 1;
    }
    extraRisk += 0.08;
    texts.push("舊傷口或舊巴掌一碰上類似的場面就先痛：原本能緩一口氣的飯、藥或讓路沒了。");
  }

  if (vigil && hooks.some((hook) => ["hide", "survival", "night"].includes(hook))) {
    texts.push("過度警戒讓你少挨一次現在的打。它也讓你更難被普通的語氣安慰。");
  }

  if (disso) {
    extraRisk += 0.05;
    if (next.intelligence > 0) next.intelligence = Math.max(0, next.intelligence - 1);
    texts.push("有一段時間你不在場。作業、對話或判斷在空白裡掉了一截。");
  }

  if (rage && (option.path === "crime" || hooks.includes("crime") || hooks.includes("street"))) {
    extraRisk += 0.12;
    next.mood = (next.mood || 0) - 2;
    texts.push("怒意一上來，你出手的方式和家裏打人的人一樣。這不讓你變強，只讓後面的罰更重。");
  }

  if (noAsk && hooks.some((hook) => ["ask", "official", "social"].includes(hook))) {
    next.charm = (next.charm || 0) - 1;
    next.mood = (next.mood || 0) - 1;
    extraRisk += 0.06;
    texts.push("求助的肌肉萎縮了。你把該開口的話嚥回去，然後獨自承擔後果。");
  }

  return { effects: next, extraRisk };
}

export function weeklyTraumaPressure(character) {
  const state = character?.traumaState;
  if (!state?.intensity) return { moodDelta: 0, healthChance: 0, note: "" };
  if (state.intensity < 18) return { moodDelta: 0, healthChance: 0, note: "" };
  return {
    moodDelta: -1,
    healthChance: Math.min(0.12, state.intensity * 0.0015),
    note: "積壓的創傷在沒有事件的日子裡仍收取睡眠與胃口。",
  };
}

export { TRAUMA_TAG_DATABASE, TRAUMA_TAG_INDEX } from "./data/trauma-tags-database.js";
export { TRAUMA_COST_NOTE };
export { emptyTraumaState as defaultTraumaState };
