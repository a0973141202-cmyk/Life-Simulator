/**
 * Shared choice/event stem similarity.
 * One place for "same turn" and "exclusion buffer" clash checks.
 */

export function normalizeChoiceText(text) {
  return String(text || "")
    .replace(/〔[^〕]*〕/g, "")
    .replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, "")
    .slice(0, 48);
}

function bigrams(value) {
  const out = new Set();
  for (let i = 0; i < value.length - 1; i += 1) out.add(value.slice(i, i + 2));
  return out;
}

/**
 * True when two player-facing choice lines are the same action in different clothing.
 * Catches identical cores with a trailing salt, shared long prefixes, and high bigram overlap.
 */
export function textsTooSimilar(left, right) {
  const a = normalizeChoiceText(left);
  const b = normalizeChoiceText(right);
  if (!a || !b) return false;
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (shorter.length >= 5 && longer.includes(shorter)) return true;
  if (shorter.length >= 5 && longer.startsWith(shorter.slice(0, Math.min(12, shorter.length)))) {
    const head = shorter.slice(0, Math.min(10, shorter.length));
    if (longer.startsWith(head) && shorter.length >= 8) return true;
  }
  let prefix = 0;
  while (prefix < shorter.length && shorter[prefix] === longer[prefix]) prefix += 1;
  if (prefix >= 6) return true;
  const ga = bigrams(a);
  const gb = bigrams(b);
  if (!ga.size || !gb.size) return false;
  let inter = 0;
  for (const gram of ga) if (gb.has(gram)) inter += 1;
  const union = ga.size + gb.size - inter;
  if (union > 0 && inter >= 3 && inter / union >= 0.48) return true;
  // Shared action verb + object core (e.g. 還沒扣走的那口…護住)
  const coreRe = /還沒扣走的那口.{2,12}護住|把門栓插上|把水打回來|能換成.{2,10}的路走完|不按屋裏的口令/;
  const ca = a.match(coreRe)?.[0];
  const cb = b.match(coreRe)?.[0];
  if (ca && cb && ca === cb) return true;
  return false;
}

export function clashesAny(text, used = []) {
  return (used || []).some((row) => textsTooSimilar(row, text));
}
