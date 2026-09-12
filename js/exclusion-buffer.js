/**
 * Turn-based exclusion for every option/event that appeared on screen.
 * Offered-but-unpicked stems cannot return for EXCLUSION_TURNS
 * bi-weekly turns (each turn is one fortnight).
 */

export const EXCLUSION_TURNS = 8;
export const EXCLUSION_CAP = 80;

function stemOf(text) {
  return String(text || "")
    .replace(/〔[^〕]*〕/g, "")
    .replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, "")
    .slice(0, 40);
}

export function emptyExclusion() {
  return { turn: 0, items: [] };
}

export function ensureExclusionBuffer(character) {
  if (!character) return emptyExclusion();
  if (!character.exclusionBuffer) character.exclusionBuffer = emptyExclusion();
  return character.exclusionBuffer;
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
    const id = String(choice?.id || "").replace(/__\d+$/, "").replace(/^fog_/, "");
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

function stemsTooSimilar(left, right) {
  const a = stemOf(left);
  const b = stemOf(right);
  if (!a || !b) return false;
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (shorter.length >= 6 && longer.includes(shorter)) return true;
  let prefix = 0;
  while (prefix < shorter.length && shorter[prefix] === longer[prefix]) prefix += 1;
  return prefix >= 8;
}

export function optionExcluded(character, id, stem) {
  const items = character?.exclusionBuffer?.items || [];
  const bare = String(id || "").replace(/__\d+$/, "").replace(/^fog_/, "");
  if (bare && items.some((item) => item.id === bare)) return true;
  const norm = stem ? stemOf(stem) : "";
  if (norm && items.some((item) => stemsTooSimilar(item.stem, norm) || stemsTooSimilar(item.template, norm))) {
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
