/**
 * Seeded RNG helpers for reproducible genesis and event rolls.
 */

export function randomSeed() {
  const a = (Math.random() * 0xffffffff) >>> 0;
  const b = (Date.now() ^ (performance?.now?.() ?? 0) * 1000) >>> 0;
  return (a ^ b) >>> 0;
}

export function createRng(seed, stateValue) {
  let s = ((stateValue ?? seed) >>> 0) || 1;
  function rng() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  rng.getState = () => s;
  rng.setState = (value) => {
    s = (value >>> 0) || 1;
  };
  return rng;
}

export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick(rng, list) {
  if (!list || list.length === 0) return undefined;
  return list[Math.floor(rng() * list.length)];
}

export function pickWeighted(rng, items, getWeight = (item) => item.weight ?? 1) {
  const weighted = items.filter((item) => getWeight(item) > 0);
  if (weighted.length === 0) return undefined;
  const total = weighted.reduce((sum, item) => sum + getWeight(item), 0);
  let roll = rng() * total;
  for (const item of weighted) {
    roll -= getWeight(item);
    if (roll <= 0) return item;
  }
  return weighted[weighted.length - 1];
}

export function chance(rng, probability) {
  return rng() < probability;
}

export function shuffle(rng, list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
