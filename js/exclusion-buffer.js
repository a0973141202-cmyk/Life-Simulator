/**
 * Turn-based exclusion for every option/event that appeared on screen.
 * Offered stems stay out for EXCLUSION_TURNS fortnights.
 * Unused (shown but not chosen) stems stay out for the rest of this life.
 */

import { normalizeChoiceText, textsTooSimilar } from "./choice-similarity.js";

export const EXCLUSION_TURNS = 8;
export const EXCLUSION_CAP = 120;
export const NEVER_STEM_CAP = 160;
export const NEVER_ID_CAP = 100;

function stemOf(text) {
  return normalizeChoiceText(text).slice(0, 40);
}

function bareId(id) {
  return String(id || "").replace(/__\d+$/, "").replace(/^fog_/, "");
}

export function emptyExclusion() {
  return { turn: 0, items: [], never: [], neverIds: [] };
}

export function ensureExclusionBuffer(character) {
  if (!character) return emptyExclusion();
  if (!character.exclusionBuffer) character.exclusionBuffer = emptyExclusion();
  const buf = character.exclusionBuffer;
  if (!Array.isArray(buf.never)) buf.never = [];
  if (!Array.isArray(buf.neverIds)) buf.neverIds = [];
  return buf;
}

export function beginExclusionTurn(character) {
  const buf = ensureExclusionBuffer(character);
  buf.turn = (buf.turn || 0) + 1;
  const cutoff = buf.turn - EXCLUSION_TURNS;
  buf.items = (buf.items || [])
    .filter((item) => (item.turn || 0) > cutoff)
    .slice(-EXCLUSION_CAP);
  if (character) character.exclusionBuffer = buf;
  return buf;
}

export function rememberExcluded(character, choices = [], extras = {}) {
  if (!character) return emptyExclusion();
  const buf = ensureExclusionBuffer(character);
  const turn = buf.turn || 1;
  const seen = new Set((buf.items || []).map((item) => `${item.id}|${item.stem}`));
  for (const choice of choices) {
    const id = bareId(choice?.id);
    const stem = stemOf(choice?.trueText || choice?.text);
    const template = extras.templates?.[choice?.id] || stemOf(choice?.text) || stem;
    const key = `${id}|${stem}`;
    if (!id && !stem) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    buf.items.push({ turn, id, stem, template });
  }
  for (const eventId of extras.eventIds || []) {
    if (!eventId) continue;
    const key = `${eventId}|`;
    if (seen.has(key)) continue;
    seen.add(key);
    buf.items.push({ turn, id: eventId, stem: "", template: eventId });
  }
  buf.items = buf.items.slice(-EXCLUSION_CAP);
  character.exclusionBuffer = buf;
  return buf;
}

export function rememberUnpicked(character, options = [], chosenIndex = -1) {
  if (!character) return emptyExclusion();
  const buf = ensureExclusionBuffer(character);
  (options || []).forEach((opt, index) => {
    if (index === chosenIndex) return;
    const stem = stemOf(opt?.trueText || opt?.text);
    const id = bareId(opt?.id);
    if (stem && !buf.never.some((row) => textsTooSimilar(row, stem))) {
      buf.never.push(stem);
    }
    if (id && !buf.neverIds.includes(id)) buf.neverIds.push(id);
  });
  buf.never = buf.never.slice(-NEVER_STEM_CAP);
  buf.neverIds = buf.neverIds.slice(-NEVER_ID_CAP);
  character.exclusionBuffer = buf;
  return buf;
}

export function optionExcluded(character, id, stem) {
  const buf = character?.exclusionBuffer || emptyExclusion();
  const items = buf.items || [];
  const bare = bareId(id);
  if (bare && items.some((item) => item.id === bare)) return true;
  if (bare && (buf.neverIds || []).includes(bare)) return true;
  const norm = stem ? stemOf(stem) : "";
  if (norm && (buf.never || []).some((row) => textsTooSimilar(row, norm))) return true;
  if (norm && items.some((item) => textsTooSimilar(item.stem, norm) || textsTooSimilar(item.template, norm))) {
    return true;
  }
  return false;
}

export function filterExcludedPool(pool, character) {
  return (pool || []).filter((action) => !optionExcluded(character, action?.id, action?.trueText || action?.text));
}

export function eventExcluded(character, eventId) {
  if (!eventId) return false;
  return (character?.exclusionBuffer?.items || []).some((item) => item.id === eventId);
}
