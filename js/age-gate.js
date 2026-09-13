/**
 * Age-gated event and choice filter.
 * Sampling must drop content that does not belong to the current life band.
 * Fail closed for adult-world lanes under 18.
 */

import {
  ADULT_DRINK_PATTERNS,
  ADULT_MIN,
  ADULT_ROMANCE_PATTERNS,
  ADULT_SOCIETY_DOMAINS,
  ADULT_WORK_PATTERNS,
  AGE_BANDS,
  CHILDHOOD_MAX,
  CONTENT_LANES,
  EARLY_CHILD_MAX,
  HOUSEHOLD_ALCOHOL_PATTERNS,
  MATURE_ADULT_MIN,
  MATURE_BANNED_CHILD_VOICE,
  PLAY_PATTERNS,
  SCHOOL_PATTERNS,
  STUDENT_MAX,
  STUDENT_MIN,
  TEEN_MAX,
} from "./data/age-gate-rules.js";
import { earlyChildAllowed } from "./early-child-filter.js";
import { semanticOptionAllowed } from "./semantic-filter.js";

export {
  ADULT_MIN,
  AGE_BANDS,
  CHILDHOOD_MAX,
  CONTENT_LANES,
  EARLY_CHILD_MAX,
  MATURE_ADULT_MIN,
  STUDENT_MAX,
  STUDENT_MIN,
  TEEN_MAX,
};

export function ageBand(ageYears = 0) {
  const age = Math.max(0, Number(ageYears) || 0);
  if (age <= EARLY_CHILD_MAX) return AGE_BANDS.early_child;
  if (age <= CHILDHOOD_MAX) return AGE_BANDS.student;
  if (age <= TEEN_MAX) return AGE_BANDS.teen;
  return AGE_BANDS.adult;
}

/** Option-generation life band used by mint / prose (not career society entry). */
export function optionLifeBand(ageYears = 0) {
  const age = Math.max(0, Number(ageYears) || 0);
  if (age <= CHILDHOOD_MAX) return "childhood";
  if (age <= TEEN_MAX) return "teen";
  return "adult";
}

/**
 * Remap mint prose kinds so adults never draw childhood family/play templates.
 */
export function remapChoiceKindForAge(kind = "labor", ageYears = 0) {
  const age = Math.max(0, Number(ageYears) || 0);
  const raw = String(kind || "labor");
  if (age >= MATURE_ADULT_MIN) {
    if (raw === "family" || raw === "play") return "labor";
    return raw;
  }
  if (age >= 13 && age <= TEEN_MAX && raw === "play") return "family";
  return raw;
}

export function adultChildVoiceForbidden(text = "", ageYears = 0) {
  const age = Math.max(0, Number(ageYears) || 0);
  if (age < MATURE_ADULT_MIN) return false;
  const corpus = String(text || "");
  return MATURE_BANNED_CHILD_VOICE.some((pattern) => pattern.test(corpus));
}

function corpusOf(item = {}) {
  return [
    item.id,
    item.text,
    item.fact,
    item.optionText,
    item.worldKind,
    item.lifeState,
    item.phase,
    item.path,
    item.domain,
    ...(item.followUps || []),
    ...(item.addTags || []),
    ...(item.hooks || []),
    ...(item.threads || []),
  ].filter(Boolean).join("\n");
}

function hits(patterns, text) {
  return patterns.some((pattern) => pattern.test(text));
}

export function classifyLane(item = {}) {
  if (item.lane && CONTENT_LANES[item.lane]) return item.lane;
  if (item.schoolIncident || item.schoolPeerHarm || item.schoolIncidentId) return "school";
  if (item.adultIncident || item.adultIncidentId) return "adult_work";
  if (item.perpCasteEcology || item.sandbox || item.crisis) return "adult_society";

  const lifeState = String(item.lifeState || item.state || "");
  if (item.daily && lifeState.startsWith("school")) return "school";
  if (item.audience === "teen") return "adolescent";
  if (item.audience === "teen_up") return "adult_work";
  if (item.audience === "adult" || item.audience === "gray") return "adult_society";

  const threads = item.threads || [];
  if (threads.includes("conscription") || threads.includes("unemployment")) return "adult_work";

  const text = corpusOf(item);
  if (hits(ADULT_ROMANCE_PATTERNS, text) || (item.addTags || []).includes("戀愛")) return "adult_romance";
  if (hits(ADULT_DRINK_PATTERNS, text) && !hits(HOUSEHOLD_ALCOHOL_PATTERNS, text)) return "adult_drink";
  if (hits(ADULT_WORK_PATTERNS, text) || item.occupationAny) return "adult_work";
  if (hits(SCHOOL_PATTERNS, text)) return "school";
  if (hits(PLAY_PATTERNS, text)) return "play";
  if (item.audience === "child_safe") return "family";

  const domain = item.domain || item.path;
  const adultActor = Boolean(item.dark || item.perpetrator) && !item.traumaVictim;
  const worldKind = item.worldKind || item.kind || "";

  if (item.figureEncounter) {
    if (item.dark || item.butterfly || domain === "crime" || domain === "politics" || domain === "narcotics") {
      return "adult_society";
    }
    return "survival";
  }

  if (item.worldEvent) {
    if (worldKind === "dark" && adultActor) return "adult_society";
    if (worldKind === "labor") return "adult_work";
    return "survival";
  }

  if (ADULT_SOCIETY_DOMAINS.includes(domain) && !item.traumaVictim && !item.schoolIncident) {
    return "adult_society";
  }

  if (item.traumaVictim) return "survival";
  if (item.daily) return "family";
  if (item.organic) return "survival";

  const minAge = Array.isArray(item.when?.age) ? item.when.age[0] : null;
  if (minAge != null && minAge >= ADULT_MIN) return "adult_society";
  if (minAge != null && minAge >= STUDENT_MIN && minAge <= STUDENT_MAX) return "adolescent";
  return "family";
}

function resolveAgeCtx(ageOrCtx = 0, maybeCtx = null) {
  if (ageOrCtx && typeof ageOrCtx === "object") return ageOrCtx;
  return { ...(maybeCtx || {}), ageYears: Number(ageOrCtx) || 0 };
}

export function contentAllowedForAge(item, ageOrCtx = 0, maybeCtx = null) {
  if (!item) return false;
  const ctx = resolveAgeCtx(ageOrCtx, maybeCtx);
  const age = Math.max(0, Number(ctx.ageYears ?? ctx.character?.ageYears ?? ageOrCtx) || 0);
  const range = item.when?.age;
  if (Array.isArray(range) && range.length >= 2) {
    if (age < range[0] || age > range[1]) return false;
  }
  const lane = classifyLane(item);
  const bounds = CONTENT_LANES[lane] || CONTENT_LANES.family;
  if (age < bounds.min || age > bounds.max) return false;
  if (age <= EARLY_CHILD_MAX && !["family", "play", "illness", "survival"].includes(lane)) return false;
  if (age <= TEEN_MAX && String(lane).startsWith("adult_") && lane !== "adult_work") return false;
  if (age < ADULT_MIN && String(lane).startsWith("adult_")) return false;
  if (age >= MATURE_ADULT_MIN) {
    if (lane === "play" || lane === "school" || lane === "adolescent") return false;
    if (adultChildVoiceForbidden(corpusOf(item), age)) return false;
  }
  if (age <= EARLY_CHILD_MAX && !earlyChildAllowed(item, { ...ctx, ageYears: age })) return false;
  return true;
}

export function filterByAgeGate(items, ctx = {}) {
  const kept = [];
  const blocked = [];
  for (const item of items || []) {
    if (contentAllowedForAge(item, ctx)) kept.push(item);
    else blocked.push({ id: item?.id, lane: classifyLane(item), reason: "age_lane" });
  }
  return { kept, blocked };
}

export function incidentAllowed(incident, ctx = {}) {
  if (!incident) return false;
  if (!contentAllowedForAge(incident, ctx)) return false;
  const options = incident.options || [];
  if (!options.length) return true;
  const playable = options.filter((option) => (
    contentAllowedForAge(option, ctx) && semanticOptionAllowed(option, ctx)
  ));
  return playable.length >= 3;
}

export function dailyAudienceAllowed(audience, ageYears = 0) {
  const age = Math.max(0, Number(ageYears) || 0);
  if (age <= EARLY_CHILD_MAX) return audience === "child_safe";
  if (age <= CHILDHOOD_MAX) return audience === "child_safe";
  if (age <= TEEN_MAX) return audience === "teen" || audience === "teen_up" || !audience || audience === "span";
  if (!audience || audience === "span") return true;
  const bounds = {
    child_safe: { min: 5, max: CHILDHOOD_MAX },
    teen: { min: 13, max: TEEN_MAX },
    teen_up: { min: 18, max: 120 },
    gray: { min: ADULT_MIN, max: 120 },
    adult: { min: ADULT_MIN, max: 120 },
  }[audience] || { min: ADULT_MIN, max: 120 };
  return age >= bounds.min && age <= bounds.max;
}
