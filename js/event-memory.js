/**
 * Recent-event cooldown. Last ~10 firings and the current life-band
 * cannot reappear as the same id or outline until they age out.
 */
import { getLifeStage } from "./constants.js";
import { normalizeChoiceText, textsTooSimilar } from "./choice-pool.js";
import { recentSessionEventOutlines } from "./session-repeat.js";
import { idOnTextHistory, rememberTextSnippet, textOnCooldown } from "./text-history.js";
import { eventExcluded } from "./exclusion-buffer.js";

export const EVENT_COOLDOWN_CAP = 10;
export const STAGE_EVENT_CAP = 12;

export function emptyEventMemory() {
  return {
    recentIds: [],
    recentOutlines: [],
    recentStems: [],
    stageId: "",
    stageIds: [],
    stageOutlines: [],
  };
}

export function ensureEventMemory(character, stageId = "") {
  if (!character) return emptyEventMemory();
  if (!character.eventMemory) character.eventMemory = emptyEventMemory();
  const memory = character.eventMemory;
  if (stageId && memory.stageId && memory.stageId !== stageId) {
    memory.stageId = stageId;
    memory.stageIds = [];
    memory.stageOutlines = [];
  } else if (stageId && !memory.stageId) {
    memory.stageId = stageId;
  }
  return memory;
}

function pushUnique(list, value, cap) {
  if (!value) return;
  const at = list.indexOf(value);
  if (at >= 0) list.splice(at, 1);
  list.push(value);
  if (list.length > cap) list.splice(0, list.length - cap);
}

export function eventOutline(source, kind, extra = "") {
  return [source, kind, extra].filter(Boolean).join(":");
}

export function eventOnCooldown(memory, { id, outline, stem } = {}) {
  if (!memory) return false;
  if (id && (memory.recentIds.includes(id) || memory.stageIds.includes(id))) return true;
  if (outline && (memory.recentOutlines.includes(outline) || memory.stageOutlines.includes(outline))) {
    return true;
  }
  if (stem) {
    const key = normalizeChoiceText(stem);
    if (key && memory.recentStems.some((row) => textsTooSimilar(row, key))) return true;
  }
  return false;
}

export function seedSessionCooldown(character) {
  const memory = ensureEventMemory(character, "awakening");
  for (const outline of recentSessionEventOutlines()) {
    pushUnique(memory.recentOutlines, outline, EVENT_COOLDOWN_CAP);
    pushUnique(memory.stageOutlines, outline, STAGE_EVENT_CAP);
  }
  return memory;
}

export function filterCooledPool(pool, character, getMeta, ctx = {}) {
  const stageId = ctx.stage?.id || getLifeStage(ctx.ageYears || 0).id;
  const memory = ensureEventMemory(character, stageId);
  const metaOf = typeof getMeta === "function"
    ? getMeta
    : (item) => ({ id: item?.id, outline: item?.outline || eventOutline("event", item?.kind, item?.id) });
  const age = ctx.ageYears ?? ctx.time?.ageYears ?? ctx.age;
  const sessionBlocked = age != null && age <= 8 ? new Set(recentSessionEventOutlines()) : null;
  const fresh = (pool || []).filter((item) => {
    const meta = metaOf(item);
    if (eventOnCooldown(memory, meta)) return false;
    if (sessionBlocked && meta.outline && sessionBlocked.has(meta.outline)) return false;
    if (meta.id && idOnTextHistory(character, meta.id)) return false;
    if (meta.stem && textOnCooldown(character, meta.stem)) return false;
    if (eventExcluded(character, meta.id)) return false;
    return true;
  });
  if (fresh.length) return fresh;
  if (ctx.noOptionRecycling) return [];
  const byId = (pool || []).filter((item) => {
    const meta = metaOf(item);
    return !meta.id || (!memory.recentIds.includes(meta.id) && !memory.stageIds.includes(meta.id));
  });
  return byId.length ? byId : (pool || []);
}

export function rememberTriggeredEvent(character, record = {}, ctx = {}) {
  if (!character || !record) return emptyEventMemory();
  const stageId = ctx.stage?.id || getLifeStage(ctx.ageYears || character.ageYears || 0).id;
  const memory = ensureEventMemory(character, stageId);
  if (record.id) {
    pushUnique(memory.recentIds, record.id, EVENT_COOLDOWN_CAP);
    pushUnique(memory.stageIds, record.id, STAGE_EVENT_CAP);
  }
  if (record.outline) {
    pushUnique(memory.recentOutlines, record.outline, EVENT_COOLDOWN_CAP);
    pushUnique(memory.stageOutlines, record.outline, STAGE_EVENT_CAP);
  }
  if (record.stem) {
    pushUnique(memory.recentStems, normalizeChoiceText(record.stem), EVENT_COOLDOWN_CAP);
  }
  rememberTextSnippet(character, {
    id: record.id,
    template: record.template || record.outline,
    stem: record.stem,
  });
  return memory;
}

export function rememberTriggeredMany(character, records = [], ctx = {}) {
  for (const record of records || []) rememberTriggeredEvent(character, record, ctx);
  return ensureEventMemory(character, ctx.stage?.id);
}

export function stemOnCooldown(character, text, ctx = {}) {
  const memory = ensureEventMemory(character, ctx.stage?.id);
  return eventOnCooldown(memory, { stem: text });
}
