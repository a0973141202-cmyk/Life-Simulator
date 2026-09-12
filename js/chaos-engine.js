/**
 * Unbalanced weekly triad mixer.
 * Does not moralize. Does not equalize power. Boundary filtering happens before this.
 */

import { CHAOS_PROFILES } from "./data/chaos-profiles.js";
import { STAT_KEYS } from "./constants.js";
import { pick, pickWeighted, randInt, chance } from "./rng.js";

export function pickChaosProfile(rng) {
  return pickWeighted(rng, CHAOS_PROFILES, (row) => row.weight ?? 1) || CHAOS_PROFILES[3];
}

export function pickUniform(rng, pool, count) {
  const remaining = (pool || []).slice();
  const picked = [];
  while (picked.length < count && remaining.length) {
    const item = remaining.splice(Math.floor(rng() * remaining.length), 1)[0];
    if (item) picked.push(item);
  }
  return picked;
}

function clampDelta(value) {
  return Math.max(-18, Math.min(18, Math.round(value)));
}

function invertEffects(effects = {}) {
  const next = {};
  for (const key of STAT_KEYS) {
    const value = effects[key] || 0;
    next[key] = value ? -value : 0;
  }
  return next;
}

function scrambleEffects(rng) {
  const next = {};
  for (const key of STAT_KEYS) {
    if (chance(rng, 0.28)) continue;
    next[key] = clampDelta(randInt(rng, -10, 10));
  }
  if (!STAT_KEYS.some((key) => next[key])) next.sanity = chance(rng, 0.5) ? 2 : -2;
  return next;
}

function blessEffects(rng, effects = {}) {
  const next = { ...effects };
  for (const key of STAT_KEYS) {
    const value = next[key] || 0;
    if (value < 0) next[key] = chance(rng, 0.55) ? -value : 0;
    else next[key] = clampDelta(value + randInt(rng, 1, 5));
  }
  return next;
}

function curseEffects(rng, effects = {}) {
  const next = { ...effects };
  for (const key of STAT_KEYS) {
    const value = next[key] || 0;
    if (value > 0) next[key] = chance(rng, 0.6) ? -value : 0;
    else next[key] = clampDelta(value - randInt(rng, 1, 6));
  }
  return next;
}

export function distortOption(rng, option, slot, ctx = {}) {
  const next = { ...option, effects: { ...option.effects } };
  const age = ctx.ageYears ?? 0;

  // Trauma invoices stay cost-heavy. Chaos may worsen them, never convert injury into a gift.
  if (option.traumaVictim || option.schoolIncident || option.perpCasteEcology || option.adultIncident || option.worldEvent || option.figureEncounter) {
    if (option.schoolIncident || option.perpCasteEcology || option.adultIncident || option.worldEvent || option.figureEncounter) {
      next.chaosSlot = slot || "fact";
      next.trap = false;
      return next;
    }
    if (slot === "bad") {
      next.effects = curseEffects(rng, next.effects);
      next.risk = {
        chance: Math.min(0.9, Math.max(0.28, (next.risk?.chance || 0.22) + 0.18)),
        effects: curseEffects(rng, next.risk?.effects || { health: -3, mood: -3 }),
        text: next.risk?.text || "這一週把代價提前收取。",
      };
    }
    next.chaosSlot = slot;
    next.trap = false;
    return next;
  }

  if (slot === "good") {
    next.effects = blessEffects(rng, next.effects);
    if (next.risk) next.risk = { ...next.risk, chance: Math.min(0.12, (next.risk.chance || 0) * 0.25) };
  } else if (slot === "bad") {
    next.effects = curseEffects(rng, next.effects);
    next.risk = {
      chance: Math.min(0.85, Math.max(0.28, (next.risk?.chance || 0.2) + 0.25)),
      effects: curseEffects(rng, next.risk?.effects || { health: -3, mood: -3 }),
      text: next.risk?.text || "這一週把代價提前收取。",
    };
    if (age >= 16 && chance(rng, 0.35) && next.consequence) {
      next.consequence = {
        ...next.consequence,
        wanted: (next.consequence.wanted || 0) + randInt(rng, 4, 12),
        heat: (next.consequence.heat || 0) + randInt(rng, 4, 10),
        trust: (next.consequence.trust || 0) - randInt(rng, 3, 8),
      };
    }
  } else if (slot === "scramble") {
    next.effects = scrambleEffects(rng);
    if (chance(rng, 0.4)) {
      next.risk = {
        chance: rng() * 0.7,
        effects: scrambleEffects(rng),
        text: "用意是好的，燒、扣飯或被抓住把柄仍可能發生。",
      };
    } else {
      next.risk = null;
    }
    if (age < 16) next.consequence = null;
  } else if (slot === "trap") {
    next.effects = invertEffects(next.effects);
    next.trap = true;
    next.risk = {
      chance: Math.min(0.9, (next.risk?.chance || 0.2) + 0.35),
      effects: curseEffects(rng, next.risk?.effects || { mood: -4, health: -2 }),
      text: next.risk?.text || "字面上像占便宜。做完可能發燒、被人抓住把柄，或白白耗掉半天。",
    };
  } else if (slot === "foggood") {
    next.effects = blessEffects(rng, next.effects);
    next.trap = false;
    next.risk = next.risk ? { ...next.risk, chance: (next.risk.chance || 0) * 0.3 } : null;
  }

  next.chaosSlot = slot;
  return next;
}

export function applyChaosToTriad(rng, options, profile, ctx) {
  const slots = profile?.slots || ["scramble", "scramble", "scramble"];
  return options.map((option, index) => distortOption(rng, option, slots[index] || "scramble", ctx));
}

export function describeChaos(profile) {
  if (!profile) return "";
  return `本期結果可能對不上選項上的字：${profile.label}。`;
}

export { CHAOS_PROFILES };
