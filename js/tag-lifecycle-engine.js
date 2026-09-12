/**
 * Weekly tag decay, forgetting, and crisis evolution.
 * Runs once per fortnight against the live tag set — O(tags + rules).
 */
import { getLifeStage } from "./constants.js";
import {
  DECAY_RULES,
  ENV_BANDS,
  EVOLUTION_RULES,
  LEDGER_ACQUIRED_LOCK,
  NEVER_DECAY_PREFIXES,
  emptyTagLifecycle,
} from "./data/tag-lifecycle-rules.js";
import { publicTagLabel } from "./data/ui-zh.js";
import {
  addCharacterTag,
  characterHasTag,
  patchCharacterTag,
  removeCharacterTag,
} from "./tag-system.js";

const LOCKED_ACQUIRED = new Set(LEDGER_ACQUIRED_LOCK);

export function ensureTagLifecycle(character) {
  if (!character) return emptyTagLifecycle();
  if (!character.tagLifecycle) character.tagLifecycle = emptyTagLifecycle();
  const state = character.tagLifecycle;
  if (!state.touched) state.touched = {};
  if (!state.idle) state.idle = {};
  if (!state.evolved) state.evolved = {};
  if (!state.dormant) state.dormant = {};
  return state;
}

export function seedTagLifecycle(character, turn = 0) {
  const state = ensureTagLifecycle(character);
  state.turn = Number(turn) || 0;
  for (const record of character.tagRecords || []) {
    if (!record?.id) continue;
    if (state.touched[record.id] == null) state.touched[record.id] = state.turn;
    if (state.idle[record.id] == null) state.idle[record.id] = 0;
  }
  return state;
}

function recordsOf(character) {
  return character?.tagRecords || character?.tagStore?.records || [];
}

function neverDecay(record) {
  const id = String(record?.id || "");
  if (!id) return true;
  if (LOCKED_ACQUIRED.has(id)) return true;
  return NEVER_DECAY_PREFIXES.some((prefix) => id.startsWith(prefix));
}

function harvestNeedles(option = {}, ctx = {}) {
  const needles = new Set();
  const push = (value) => {
    const raw = String(value || "").trim();
    if (raw) needles.add(raw);
  };
  for (const hook of option.hooks || []) push(hook);
  push(option.situation);
  push(option.childTheme);
  push(option.lane);
  push(option.worldKind);
  push(option.lock);
  for (const tag of option.addTags || []) push(typeof tag === "string" ? tag : tag?.id);
  const env = ctx.environment || {};
  for (const tag of env.tags || []) push(tag);
  for (const record of env.records || []) {
    push(record.id);
    for (const hook of record.hooks || []) push(hook);
  }
  push(ctx.climate || ctx.settlement?.climate || ctx.character?.climate);
  push(ctx.region || ctx.character?.region);
  push(ctx.geoBand);
  return needles;
}

function bandActive(bandId, needles, ctx = {}) {
  const band = ENV_BANDS[bandId];
  if (!band) return false;
  const climate = String(ctx.climate || ctx.settlement?.climate || ctx.character?.climate || "");
  if (band.climates.includes(climate)) return true;
  for (const hook of band.hooks) {
    if (needles.has(hook)) return true;
  }
  const hay = [...needles].join(" ");
  return band.envNeedles.some((needle) => hay.includes(needle));
}

function recordMatchesNeedles(record, needles) {
  if (!record || !needles.size) return false;
  if (needles.has(record.id)) return true;
  for (const hook of record.hooks || []) {
    if (needles.has(hook)) return true;
  }
  for (const hook of record.advantageIn || []) {
    if (needles.has(hook)) return true;
  }
  for (const hook of record.strainIn || []) {
    if (needles.has(hook)) return true;
  }
  return false;
}

function decayRuleFor(record) {
  if (!record || neverDecay(record)) return null;
  for (const rule of DECAY_RULES) {
    if (rule.skipIds?.includes(record.id)) continue;
    if (rule.skipCategories?.includes(record.category)) continue;
    if (rule.matchIds?.includes(record.id)) return rule;
    if (rule.matchPrefixes?.some((prefix) => record.id.startsWith(prefix))) return rule;
    if (rule.matchHooks && (record.hooks || []).some((hook) => rule.matchHooks.includes(hook))) {
      return rule;
    }
    if (rule.matchTemporary && record.temporary) return rule;
  }
  return null;
}

function fadeRecord(character, record, state) {
  const data = { ...(record.data || {}), dormant: true, fadedAtTurn: state.turn, wasHidden: Boolean(record.hidden) };
  patchCharacterTag(character, record.id, { hidden: true, data });
  state.dormant[record.id] = true;
}

function restoreRecord(character, record, state) {
  const data = { ...(record.data || {}) };
  const wasHidden = Boolean(data.wasHidden);
  delete data.dormant;
  delete data.fadedAtTurn;
  delete data.wasHidden;
  patchCharacterTag(character, record.id, { hidden: wasHidden, data: Object.keys(data).length ? data : null });
  delete state.dormant[record.id];
}

function isDormant(record, state) {
  return Boolean(record?.data?.dormant || state.dormant[record.id]);
}

function weekIsCrisis(option = {}, ctx = {}, character = {}) {
  if (option.crisis || option.asymmetric || option.trauma || option.lock === "crisis") return true;
  if (option.worldKind === "crisis" || option.worldKind === "dark") return true;
  const pressure = Number(ctx.pressure?.score ?? ctx.pressure ?? 0);
  if (pressure >= 36) return true;
  if ((character.careerState?.crisis || 0) >= 36) return true;
  if ((character.worldEventState?.pressure || 0) >= 36) return true;
  if ((character.traumaState?.intensity || 0) >= 22) return true;
  const health = Number(character.stats?.health ?? 50);
  if (health <= 32) return true;
  const hooks = option.hooks || [];
  return hooks.some((hook) => ["survival", "hunger", "war", "plague", "arctic", "desert"].includes(hook));
}

function evolutionReady(rule, character, needles, ctx, crisis) {
  if (rule.crisis && !crisis) return false;
  if (rule.healthMax != null && Number(character.stats?.health ?? 100) > rule.healthMax) return false;
  if (rule.requireBand && !bandActive(rule.requireBand, needles, ctx)) return false;
  if (rule.hooksAny && !rule.hooksAny.some((hook) => needles.has(hook))) return false;
  if (rule.requiresAny && !rule.requiresAny.some((id) => characterHasTag(character, id))) return false;
  if (rule.requiresAnySecondary && !rule.requiresAnySecondary.some((id) => characterHasTag(character, id))) {
    return false;
  }
  if (rule.requiresAll && !rule.requiresAll.every((id) => characterHasTag(character, id))) return false;
  return true;
}

function grantEvolved(character, rule) {
  const grant = { ...rule.grant };
  grant.label = publicTagLabel(grant) || grant.label;
  grant.source = grant.source || "evolution";
  return addCharacterTag(character, grant);
}

/**
 * One fortnight pass. Touch used tags, idle the rest, fade/forget, then evolve.
 */
export function weeklyTagLifecycle(character, ctx = {}, extras = {}) {
  if (!character) {
    return { changed: [], notes: [], tagsGained: [], tagsLost: [], stageChanged: false };
  }
  const state = seedTagLifecycle(character, extras.turnCount ?? ctx.turnCount ?? stateTurn(character));
  if (!extras.stageOnly) state.turn = Number(state.turn || 0) + 1;
  const option = extras.option || ctx.option || {};
  const needles = harvestNeedles(option, { ...ctx, character });
  const stageId = extras.stageId || ctx.stage?.id || getLifeStage(ctx.ageYears || extras.ageYears || 0).id;
  const stageChanged = Boolean(state.lastStageId && stageId && state.lastStageId !== stageId);
  const crisis = weekIsCrisis(option, ctx, character);
  const changed = [];
  const notes = [];
  const tagsGained = [];
  const tagsLost = [];

  for (const record of recordsOf(character)) {
    if (!record?.id) continue;
    if (recordMatchesNeedles(record, needles)) {
      state.touched[record.id] = state.turn;
      state.idle[record.id] = 0;
      if (isDormant(record, state)) {
        restoreRecord(character, record, state);
        changed.push({ action: "restore", tag: record.id, label: record.label });
      }
    }
  }

  for (const record of recordsOf(character)) {
    if (!record?.id) continue;
    const rule = decayRuleFor(record);
    if (!rule) continue;
    if (state.touched[record.id] === state.turn) continue;
    if (rule.requireMismatch && bandActive(rule.requireMismatch, needles, { ...ctx, character })) continue;
    state.idle[record.id] = (state.idle[record.id] || 0) + (stageChanged ? 8 : 1);
    const idle = state.idle[record.id];
    const inherited = Boolean(record.inherited || record.category === "trait");
    if (idle >= (rule.removeWeeks || Infinity) && !inherited && !isDormant(record, state)) {
      if (removeCharacterTag(character, record.id)) {
        delete state.idle[record.id];
        delete state.touched[record.id];
        delete state.dormant[record.id];
        tagsLost.push(record.id);
        changed.push({ action: "remove", tag: record.id, label: record.label });
        if (rule.noteRemove) notes.push(rule.noteRemove);
      }
      continue;
    }
    if (idle >= (rule.fadeWeeks || Infinity) && !isDormant(record, state)) {
      fadeRecord(character, record, state);
      changed.push({ action: "fade", tag: record.id, label: record.label });
      if (rule.noteFade) notes.push(rule.noteFade);
    }
  }

  for (const rule of EVOLUTION_RULES) {
    if (state.evolved[rule.id] || characterHasTag(character, rule.grant.id)) continue;
    if (!evolutionReady(rule, character, needles, { ...ctx, character }, crisis)) continue;
    if (!grantEvolved(character, rule)) continue;
    state.evolved[rule.id] = rule.grant.id;
    state.touched[rule.grant.id] = state.turn;
    state.idle[rule.grant.id] = 0;
    tagsGained.push(rule.grant.id);
    changed.push({ action: "evolve", tag: rule.grant.id, from: rule.id, label: rule.grant.label });
    if (rule.note) notes.push(rule.note);
  }

  state.lastStageId = stageId || state.lastStageId;
  return {
    changed,
    notes: [...new Set(notes)],
    tagsGained,
    tagsLost,
    stageChanged,
    crisis,
    turn: state.turn,
    tagDecayEngine: true,
    tagForgetting: true,
    tagEvolution: true,
  };
}

function stateTurn(character) {
  return Number(character?.tagLifecycle?.turn || 0);
}

export {
  DECAY_RULES,
  EVOLUTION_RULES,
  emptyTagLifecycle,
};
