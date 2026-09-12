/**
 * Canonical player meters. Data files may still author legacy keys
 * (mood / wealth / intelligence / charm); those never become HUD stats
 * and never print on choice buttons.
 *
 * Core: health, sanity. Hidden: reputation / notoriety / crisis (ledger) + tags.
 */

import { STAT_KEYS, clampStat, emptyStats } from "./constants.js";
import { stripChoiceSpoilers } from "./data/public-text.js";

export const CORE_STAT_KEYS = STAT_KEYS;
export const LEGACY_STAT_KEYS = Object.freeze(["intelligence", "wealth", "charm", "mood"]);

export { stripChoiceSpoilers };

export function canonicalizeEffects(raw = {}) {
  const stats = emptyStats();
  const hidden = {
    means: 0,
    reputation: 0,
    notoriety: 0,
    heat: 0,
    opinion: 0,
    trust: 0,
  };
  stats.health += Number(raw.health || 0);
  stats.sanity += Number(raw.sanity || 0) + Number(raw.mood || 0);

  const wealth = Number(raw.wealth || 0);
  hidden.means += wealth;
  if (wealth < 0) hidden.heat += Math.min(8, Math.abs(wealth));

  const charm = Number(raw.charm || 0);
  if (charm > 0) {
    hidden.reputation += charm;
    hidden.opinion += Math.round(charm * 0.5);
  } else if (charm < 0) {
    hidden.notoriety += Math.abs(charm);
    hidden.reputation += charm;
    hidden.trust += charm;
  }

  return { stats, hidden };
}

export function canonicalizeStats(raw = {}) {
  const next = emptyStats();
  next.health = clampStat("health", raw.health ?? 50);
  next.sanity = clampStat("sanity", raw.sanity ?? raw.mood ?? 50);
  return next;
}

export function gateStatValue(ctx, key) {
  if (key === "health") return ctx.stats?.health ?? 50;
  if (key === "sanity" || key === "mood") return ctx.stats?.sanity ?? ctx.stats?.mood ?? 50;
  if (key === "wealth") return ctx.character?.means ?? 50;
  if (key === "intelligence" || key === "charm") return null;
  return ctx.stats?.[key];
}

export function actionOnlyText(option) {
  const raw = option?.trueText || option?.text || "";
  return stripChoiceSpoilers(raw);
}

export function hiddenHasDelta(hidden) {
  if (!hidden) return false;
  return Object.values(hidden).some((value) => Number(value) !== 0);
}
