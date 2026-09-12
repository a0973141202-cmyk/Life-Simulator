/**
 * Daily-life engine: resolve a realistic life-state, then pull micro-slices.
 * Data stays in js/data/daily/; this file only selects and renders.
 */

import { filterActionsByBoundary } from "./boundary.js";
import { renderSlice } from "./data/daily/schema.js";
import { DAILY_SLICES, DAILY_STATES, dailyActionsFromSlices, slicesForState } from "./data/daily/catalog.js";
import { OCCUPATION_INDEX, occupationByLabel } from "./data/occupations-database.js";
import { pick, shuffle, chance } from "./rng.js";
import { attachNpcSpeech } from "./npc-voice.js";
import { ctxHasTag } from "./choice-pool.js";
import { dailyAudienceAllowed, contentAllowedForAge } from "./age-gate.js";
import { childhoodClimate } from "./early-child-filter.js";
import { filterCooledPool } from "./event-memory.js";
import { composeSituationLine } from "./dynamic-prose.js";

const PHASE_ORDER = ["dawn", "transit", "site", "meal", "paper", "social", "body", "wait", "night"];

function renderSliceLead(slice) {
  if (!slice) return "";
  return slice.social || slice.procedure || slice.sensory || "";
}

function audienceAllowed(audience, age) {
  return dailyAudienceAllowed(audience, age);
}

function hasTag(ctx, id) {
  return ctxHasTag(ctx, id);
}

function pathXp(ctx, key) {
  return ctx.ledger?.paths?.[key] || 0;
}

function occupationSectorOf(ctx) {
  const id = ctx.character?.occupationId;
  if (id && OCCUPATION_INDEX[id]) return OCCUPATION_INDEX[id].sector;
  if (ctx.character?.careerState?.sector) return ctx.character.careerState.sector;
  return occupationByLabel(ctx.character?.occupation)?.sector || null;
}

export function resolveDailyState(ctx) {
  const age = ctx.ageYears ?? 0;
  const occ = ctx.character?.occupation || "";
  const education = ctx.character?.education || "none";
  const sector = occupationSectorOf(ctx);
  const adult = age >= 18 && ctx.character?.socialPhase === "adult";

  if (age >= 18 && (hasTag(ctx, "acquired_imprisoned") || /監|獄|imprison/.test(occ))) {
    return DAILY_STATES.prison;
  }
  if (age >= 18 && (hasTag(ctx, "path_militant") || pathXp(ctx, "militant") >= 2 || sector === "military")) {
    return DAILY_STATES.militant_wait;
  }
  if (age >= 18 && (
    sector === "underworld"
    || hasTag(ctx, "path_crime")
    || hasTag(ctx, "path_narcotics")
    || hasTag(ctx, "acquired_underworld")
    || hasTag(ctx, "acquired_wanted")
    || hasTag(ctx, "adult_underworld_base")
    || pathXp(ctx, "crime") >= 2
    || pathXp(ctx, "narcotics") >= 2
  )) {
    return DAILY_STATES.underworld_cover;
  }
  if (age >= 18 && (
    sector === "politics"
    || hasTag(ctx, "path_politics")
    || hasTag(ctx, "path_historical")
    || pathXp(ctx, "politics") >= 2
    || /政治|官/.test(occ)
  )) {
    return DAILY_STATES.politics_machine;
  }
  if (adult && sector === "office") return DAILY_STATES.office_white;
  if (adult && sector === "commerce") return DAILY_STATES.commerce_floor;
  if (adult && (sector === "neet" || occ === "無業依附" || occ === "無" || occ === "")) {
    return DAILY_STATES.neet_depend;
  }
  if (age >= 13 && age <= 17) return DAILY_STATES.school_teen;
  if (age >= 7 && age <= 12 && education !== "none") return DAILY_STATES.school_child;
  if (age <= 12) return DAILY_STATES.home_child;
  if (adult && (sector === "labor" || /農|工|匠|鋪|商|雜|務農|學徒/.test(occ))) {
    return DAILY_STATES.labor_legal;
  }
  if (adult && sector === "labor") return DAILY_STATES.labor_legal;
  if (adult) return DAILY_STATES.labor_legal;
  return DAILY_STATES.home_child;
}

function sliceMatches(slice, ctx) {
  const when = slice.when || {};
  const age = ctx.ageYears ?? 0;
  if (!audienceAllowed(slice.audience, age)) return false;
  if (!contentAllowedForAge({
    ...slice,
    ...(slice.action || {}),
    when,
    daily: true,
    lifeState: slice.state,
    text: slice.action?.text || slice.optionText || slice.text,
    optionText: slice.optionText,
    trauma: slice.trauma,
    traumaVictim: Boolean(slice.trauma),
  }, ctx)) return false;
  if (when.age && (age < when.age[0] || age > when.age[1])) return false;
  if (when.year && (ctx.year < when.year[0] || ctx.year > when.year[1])) return false;
  if (when.classes && !when.classes.includes(ctx.familyClassId)) return false;
  if (when.regions && !when.regions.includes(ctx.region)) return false;
  if (when.tagsAny && !when.tagsAny.some((tag) => hasTag(ctx, tag))) return false;
  if (when.tagsAll && !when.tagsAll.every((tag) => hasTag(ctx, tag))) return false;
  if (when.tagsNone && when.tagsNone.some((tag) => hasTag(ctx, tag))) return false;
  if (when.pathsAny && !when.pathsAny.some((path) => pathXp(ctx, path) >= 1)) return false;
  if (when.occupationAny) {
    const occId = ctx.character?.occupationId || "";
    const occLabel = ctx.character?.occupation || "";
    if (!when.occupationAny.some((item) => occId === item || occLabel === item || occLabel.includes(item))) {
      return false;
    }
  }
  return true;
}

export function pickDailyTexture(rng, ctx, count = 3) {
  const state = resolveDailyState(ctx);
  const pool = filterCooledPool(
    slicesForState(state.id).filter((slice) => sliceMatches(slice, ctx)),
    ctx.character,
    (slice) => ({ id: `daily:${slice.id}` }),
    ctx,
  );
  const fallback = filterCooledPool(
    DAILY_SLICES.filter((slice) => sliceMatches(slice, ctx) && slice.state === "home_child"),
    ctx.character,
    (slice) => ({ id: `daily:${slice.id}` }),
    ctx,
  );
  const source = pool.length ? pool : fallback;
  const byPhase = new Map();
  for (const slice of shuffle(rng, source)) {
    if (!byPhase.has(slice.phase)) byPhase.set(slice.phase, slice);
  }
  const ordered = PHASE_ORDER.map((phase) => byPhase.get(phase)).filter(Boolean);
  const picked = ordered.slice(0, count);
  while (picked.length < Math.min(count, source.length)) {
    const extra = pick(rng, source);
    if (extra && !picked.includes(extra)) picked.push(extra);
    else break;
  }
  const { kept } = filterActionsByBoundary(
    picked.map((slice) => ({
      id: slice.id,
      text: slice.text,
      followUps: ["你把這一段做完了。日子繼續。"],
      when: slice.when,
      domain: slice.action?.domain,
      traumaVictim: Boolean(slice.trauma),
      traumaNonsexual: true,
      perpCasteEcology: Boolean(slice.perpCasteEcology),
      noSexualMinorActs: true,
    })),
    ctx,
  );
  const allowedIds = new Set(kept.map((item) => item.id));
  let safe = picked.filter((slice) => allowedIds.has(slice.id));

  const climate = (ctx.tags || []).some((tag) => tag.startsWith("household_") || tag.startsWith("trauma_"));
  const traumaPool = DAILY_SLICES.filter((slice) => (
    slice.trauma
    && sliceMatches(slice, ctx)
    && !safe.includes(slice)
  ));
  const childClimate = childhoodClimate(ctx);
  const injectChance = childClimate.age <= 6 && childClimate.harsh
    ? (climate ? 0.72 : 0.4)
    : (climate ? 0.58 : 0.14);
  if ((ctx.ageYears || 0) <= 18 && traumaPool.length && chance(rng, injectChance)) {
    const extra = pick(rng, traumaPool);
    if (extra) {
      const vetted = filterActionsByBoundary([{
        id: extra.id,
        text: extra.text,
        followUps: ["你把這一段做完了。日子繼續。"],
        when: extra.when,
        traumaVictim: true,
        traumaNonsexual: true,
      }], ctx).kept.length;
      if (vetted) safe = [extra, ...safe.filter((slice) => slice.id !== extra.id)].slice(0, Math.max(count, 3));
    }
  }

  const castePool = DAILY_SLICES.filter((slice) => (
    slice.perpCasteEcology
    && sliceMatches(slice, ctx)
    && !safe.includes(slice)
  ));
  const prisonLike = state.id === "prison" || state.id === "underworld_cover";
  if ((ctx.ageYears || 0) >= 18 && castePool.length && chance(rng, prisonLike ? 0.42 : 0.07)) {
    const extra = pick(rng, castePool);
    if (extra) {
      const vetted = filterActionsByBoundary([{
        id: extra.id,
        text: extra.text,
        followUps: ["你把這一段做完了。日子繼續。"],
        when: extra.when,
        perpCasteEcology: true,
        noSexualMinorActs: true,
        traumaVictim: Boolean(extra.trauma),
        traumaNonsexual: true,
      }], ctx).kept.length;
      if (vetted) safe = [extra, ...safe.filter((slice) => slice.id !== extra.id)].slice(0, Math.max(count, 3));
    }
  }

  return {
    state,
    slices: safe,
    paragraphs: safe.map(renderSlice),
  };
}

export function renderDailyNarrative(texture, ctx = null, rng = null) {
  if (!texture?.slices?.length) return "";
  const ranked = texture.slices.slice().sort((a, b) => {
    const weight = (slice) => (slice.trauma ? 3 : 0) + (slice.perpCasteEcology ? 2 : 0);
    return weight(b) - weight(a);
  });
  const lead = ranked[0];
  const roll = typeof rng === "function" ? rng : (() => 0.33);
  const site = texture.state?.label ? `${texture.state.label}。` : "";
  const body = composeSituationLine(roll, ctx || {});
  const system = `${site}${body}`.trim();
  if (!ctx) return system;
  const socialLead = lead.phase === "social" || Boolean(lead.social) || Boolean(lead.trauma);
  if (!socialLead) return system;
  return attachNpcSpeech(system, ctx, {
    daily: true,
    phase: lead.phase,
    state: texture.state?.id,
    id: lead.id,
    trauma: Boolean(lead.trauma),
    kind: lead.phase,
  }, rng);
}

export function collectDailyActions() {
  return dailyActionsFromSlices();
}

export function rememberDailyState(character, texture) {
  if (!character || !texture?.state) return;
  character.dailyState = {
    id: texture.state.id,
    label: texture.state.label,
    audience: texture.state.audience,
    sliceIds: (texture.slices || []).map((slice) => slice.id),
  };
}

export { DAILY_SLICES, DAILY_STATES };
