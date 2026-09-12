/**
 * Full-tag linkage: every live canonical prefix can unlock / lock options.
 * Asymmetric grafts swap one mainstream locked-triad slot when bloodline
 * or adversity tags match.
 */
import { TAG_PREFIX } from "./data/tag-schema.js";
import { PREFIX_LINK_POOL } from "./data/tag-link-actions.js";
import { ASYMMETRIC_SURVIVAL_POOL } from "./data/asymmetric-survival-actions.js";
import { chance, pickWeighted } from "./rng.js";
import { isTagGated, whenTagsMatch } from "./choice-pool.js";
import { optionExcluded } from "./exclusion-buffer.js";
import {
  MAX_TAGGED_TRIAD_SLOTS,
  MAX_TAGS_PER_CHOICE,
  candidateInterveningTags,
  isUntaggedBaseline,
  selectInterveningTags,
  stampTagInfluence,
  taggedRoomLeft,
} from "./tag-influence.js";

export const LIVE_TAG_PREFIXES = Object.freeze(Object.values(TAG_PREFIX));

export function liveTagPrefixes(ctx = {}) {
  const tags = (ctx.tags || []).map((tag) => String(tag || ""));
  return LIVE_TAG_PREFIXES.filter((prefix) => tags.some((tag) => tag.startsWith(prefix)));
}

export function actionCoversPrefix(action, prefix) {
  if (!action || !prefix) return false;
  const when = action.when || {};
  if ((when.tagPrefixesAny || []).some((item) => prefix.startsWith(item) || item.startsWith(prefix))) {
    return true;
  }
  if ((when.tagsAny || []).some((tag) => String(tag).startsWith(prefix))) return true;
  if ((when.tagsAll || []).some((tag) => String(tag).startsWith(prefix))) return true;
  return false;
}

function ageFits(action, ctx) {
  const range = action?.when?.age;
  if (!Array.isArray(range) || range.length < 2) return true;
  const age = Number(ctx.ageYears) || 0;
  return age >= range[0] && age <= range[1];
}

export function uncoveredLivePrefixes(ctx, actions = []) {
  return liveTagPrefixes(ctx).filter((prefix) => !actions.some((action) => actionCoversPrefix(action, prefix)));
}

export function specializedAsymmetricOptions(ctx) {
  return ASYMMETRIC_SURVIVAL_POOL.filter((action) => (
    action.asymmetric === "specialized"
    && whenTagsMatch(action.when || {}, ctx)
    && candidateInterveningTags(action, ctx).length > 0
  )).map((action) => stampTagInfluence({ ...action }, ctx));
}

export function ensureTagCoverage(rng, ctx, picked, matchedCatalog = []) {
  const next = (picked || []).slice();
  const missing = uncoveredLivePrefixes(ctx, next);
  if (!missing.length || !taggedRoomLeft(next)) {
    return { picked: next, livePrefixes: liveTagPrefixes(ctx), covered: liveTagPrefixes(ctx), missing };
  }
  const pool = [
    ...matchedCatalog.filter((action) => action.tagLink || isTagGated(action)),
    ...PREFIX_LINK_POOL,
  ];
  for (const prefix of missing) {
    if (!taggedRoomLeft(next) || next.length >= 3) break;
    const filler = pool.find((action) => (
      actionCoversPrefix(action, prefix)
      && ageFits(action, ctx)
      && whenTagsMatch(action.when || {}, ctx)
      && !next.some((row) => row.id === action.id || row.text === action.text)
      && !isUntaggedBaseline(action)
      && !optionExcluded(ctx.character, action.id, action.text)
    ));
    if (!filler) continue;
    next.push(stampTagInfluence({ ...filler }, ctx, rng));
  }
  return {
    picked: next,
    livePrefixes: liveTagPrefixes(ctx),
    covered: liveTagPrefixes(ctx).filter((prefix) => next.some((action) => actionCoversPrefix(action, prefix))),
    missing: uncoveredLivePrefixes(ctx, next),
    taggedSlots: next.filter((action) => !isUntaggedBaseline(action)).length,
    taggedCap: MAX_TAGGED_TRIAD_SLOTS,
  };
}

export function graftAsymmetricOptions(rng, ctx, incident) {
  if (!incident?.options?.length) return incident;
  const specialized = specializedAsymmetricOptions(ctx).filter((action) => (
    !incident.options.some((row) => row.id === action.id || row.text === action.text)
    && !optionExcluded(ctx.character, action.id, action.text)
  ));
  if (!specialized.length) return incident;
  const minority = Boolean(
    ctx.constitution?.minority
    || ctx.constitution?.mixed
    || ctx.organic?.minority
    || ctx.character?.bloodline?.mixed
    || (ctx.tags || []).some((tag) => tag === "lineage_mixed" || String(tag).startsWith("socio_war_")),
  );
  const fireChance = minority ? 0.52 : 0.3;
  if (!chance(rng, fireChance)) return incident;
  const pick = pickWeighted(rng, specialized, (action) => 1 + Math.min(MAX_TAGS_PER_CHOICE, (action.interveningTags || selectInterveningTags(action, ctx)).length) * 0.2);
  if (!pick) return incident;
  const options = incident.options.slice();
  let slot = options.findIndex((row) => row.asymmetric === "mainstream" || row.stance === "talk" || row.stance === "look");
  if (slot < 0) slot = options.findIndex((row) => isUntaggedBaseline(row) || (!row.asymmetric && !row.tagDriven));
  if (slot < 0) return incident;
  options[slot] = {
    ...pick,
    index: options[slot]?.index ?? slot,
    lane: pick.lane || "survival",
    worldEvent: Boolean(options[slot]?.worldEvent || pick.worldEvent),
    worldEventId: options[slot]?.worldEventId || pick.worldEventId || null,
    schoolIncident: Boolean(options[slot]?.schoolIncident),
    adultIncident: Boolean(options[slot]?.adultIncident),
    figureEncounter: Boolean(options[slot]?.figureEncounter),
    asymmetric: "specialized",
    tagDriven: true,
  };
  stampTagInfluence(options[slot], ctx, rng);
  return { ...incident, options, asymmetricGraft: pick.id };
}

export { PREFIX_LINK_POOL, ASYMMETRIC_SURVIVAL_POOL };
