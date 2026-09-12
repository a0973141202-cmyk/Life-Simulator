/**
 * Deep survival filter: era × age × environment for early childhood.
 * Fail closed on park / school / social outings at ages 0–6.
 * Harsh years and habitats keep only hunger, fever, confinement, abuse, malnutrition.
 */

import {
  EARLY_CHILD_FRIVOLOUS_PATTERNS,
  EARLY_CHILD_SURVIVAL_THEMES,
  EARLY_CHILD_THEME_PATTERNS,
  childhoodClimate,
} from "./data/early-child-climate.js";
import { EARLY_CHILD_MAX } from "./data/age-gate-rules.js";

export { childhoodClimate, EARLY_CHILD_SURVIVAL_THEMES };

function corpusOf(item = {}) {
  return [
    item.id,
    item.text,
    item.optionText,
    item.fact,
    item.sensory,
    item.procedure,
    item.social,
    item.childTheme,
    item.lane,
    ...(item.followUps || []),
    ...(item.addTags || []),
    ...(item.hooks || []),
  ].filter(Boolean).join("\n");
}

function hits(patterns, text) {
  return patterns.some((pattern) => pattern.test(text));
}

export function earlyChildTheme(item = {}) {
  if (item.childTheme && EARLY_CHILD_THEME_PATTERNS[item.childTheme]) return item.childTheme;
  const text = corpusOf(item);
  for (const [theme, pattern] of Object.entries(EARLY_CHILD_THEME_PATTERNS)) {
    if (pattern.test(text)) return theme;
  }
  if (item.traumaVictim || item.trauma) {
    const tags = item.trauma?.tags || item.addTags || [];
    if (tags.some((tag) => /starve|neglect|alcohol|flinch/.test(String(tag)))) return "abuse";
    return "illness";
  }
  return null;
}

export function earlyChildAllowed(item, ctx = {}) {
  if (!item) return false;
  const age = Math.max(0, Number(ctx.ageYears ?? ctx.character?.ageYears) || 0);
  if (age > EARLY_CHILD_MAX) return true;

  const choiceText = [item.id, item.text, item.optionText].filter(Boolean).join("\n");
  if (hits(EARLY_CHILD_FRIVOLOUS_PATTERNS, choiceText)) return false;
  if (item.schoolIncident || item.schoolPeerHarm || item.audience === "teen") return false;

  const climate = childhoodClimate(ctx);
  const theme = earlyChildTheme(item);
  const survivalish = Boolean(
    (theme && EARLY_CHILD_SURVIVAL_THEMES.includes(theme))
    || item.traumaVictim
    || item.trauma
    || item.organic
    || (item.worldEvent && ["household", "historical", "survival", "mundane"].includes(item.worldKind || item.kind || "")),
  );
  if (item.worldEvent && ["mundane"].includes(item.worldKind || item.kind || "") && /排隊|出門/.test(choiceText) && !climate.harsh) {
    return false;
  }

  if (climate.harsh) {
    if (item.lane === "play") return false;
    if (survivalish) return true;
    if (item.daily && String(item.lifeState || item.state || "") === "home_child") return true;
    return false;
  }

  const hooks = item.hooks || [];
  if (hooks.some((hook) => ["family", "survival", "health", "hide", "hunger"].includes(hook))) return true;
  if (theme === "hunger" || theme === "illness" || theme === "confinement" || theme === "abuse" || theme === "malnutrition") {
    return true;
  }
  if (item.daily || item.lane === "family" || item.lane === "illness" || item.lane === "survival") return true;
  if (item.worldEvent) return survivalish;
  if (item.fallback) return true;
  return false;
}
