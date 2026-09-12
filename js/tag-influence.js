/**
 * Cap how many live tags may boost or bind one option, and keep a tag-free
 * weekly slot so history / age / chance still write part of the triad.
 */
import {
  ADVANTAGE_PREFIXES,
  ADVANTAGE_TAG_IDS,
  MAX_TAGGED_TRIAD_SLOTS,
  MAX_TAGS_PER_CHOICE,
  MIN_UNTAGGED_TRIAD_SLOTS,
  STRAIN_PREFIXES,
  STRAIN_TAG_IDS,
} from "./data/tag-influence-rules.js";
import { pick, pickWeighted } from "./rng.js";
import { TAG_PREFIX } from "./data/tag-schema.js";
import { optionExcluded } from "./exclusion-buffer.js";

const CANONICAL_PREFIXES = Object.freeze(Object.values(TAG_PREFIX));

function liveTagIds(ctx = {}) {
  return (ctx.tags || []).map((tag) => String(tag || "")).filter(Boolean);
}

function resolveWanted(wanted, live) {
  if (!wanted) return null;
  if (live.includes(wanted)) return wanted;
  const aliases = [
    `ethnicity_${wanted}`,
    `trait_${wanted}`,
    `parent_trait_${wanted}`,
    `hook_${wanted}`,
    `acquired_${wanted}`,
    `socio_${wanted}`,
    `risk_${wanted}`,
    `condition_${wanted}`,
    `mood_${wanted}`,
    `path_${wanted}`,
    `trauma_${wanted}`,
    `household_${wanted}`,
    `school_${wanted}`,
    `caste_${wanted}`,
    `adult_${wanted}`,
    `world_${wanted}`,
    `figure_${wanted}`,
    `social_${wanted}`,
    `current_${wanted}`,
    `current_env_${wanted}`,
    `current_date_${wanted}`,
  ];
  const aliasHit = aliases.find((id) => live.includes(id));
  if (aliasHit) return aliasHit;
  return live.find((tag) => tag.endsWith(`_${wanted}`) || tag.endsWith(`:${wanted}`)) || null;
}

function recordOf(tag, ctx) {
  return (ctx.character?.tagRecords || []).find((row) => row.id === tag) || null;
}

export function tagValence(tag, ctx = {}) {
  const rec = recordOf(tag, ctx);
  if (rec?.valence === "advantage" || rec?.valence === "strain") return rec.valence;
  if (ADVANTAGE_TAG_IDS.includes(tag)) return "advantage";
  if (STRAIN_TAG_IDS.includes(tag)) return "strain";
  if (ADVANTAGE_PREFIXES.some((prefix) => tag.startsWith(prefix))) return "advantage";
  if (STRAIN_PREFIXES.some((prefix) => tag.startsWith(prefix))) return "strain";
  if (tag.startsWith("social_trusted") || tag.startsWith("social_courted")) return "advantage";
  if (tag.startsWith("social_feared") || tag.startsWith("social_shunned") || tag.startsWith("social_cold")) {
    return "strain";
  }
  if (tag.startsWith("mood_depressed")) return "strain";
  return "contextual";
}

export function isUntaggedBaseline(action) {
  const when = action?.when || {};
  return !action?.tagDriven
    && !action?.organic
    && !action?.tagLink
    && action?.asymmetric !== "specialized"
    && !when.tagsAny
    && !when.tagsAll
    && !when.tagPrefixesAny
    && !when.tagsNone
    && !when.tagPrefixesNone
    && !when.hooksAny;
}

export function taggedTriadCount(actions = []) {
  return (actions || []).filter((action) => !isUntaggedBaseline(action)).length;
}

export function taggedRoomLeft(actions = [], max = MAX_TAGGED_TRIAD_SLOTS) {
  return Math.max(0, max - taggedTriadCount(actions));
}

export function candidateInterveningTags(action, ctx = {}) {
  const live = liveTagIds(ctx);
  const when = action?.when || {};
  const hits = new Set();
  for (const wanted of when.tagsAny || []) {
    const hit = resolveWanted(wanted, live);
    if (hit) hits.add(hit);
  }
  for (const wanted of when.tagsAll || []) {
    const hit = resolveWanted(wanted, live);
    if (hit) hits.add(hit);
  }
  for (const prefix of when.tagPrefixesAny || []) {
    for (const tag of live) {
      if (tag.startsWith(prefix)) hits.add(tag);
    }
  }
  for (const hook of when.hooksAny || []) {
    const hit = live.find((tag) => tag === `hook_${hook}` || tag.endsWith(`_${hook}`));
    if (hit) hits.add(hit);
  }
  if (action?.organic === "ethnicity") {
    for (const tag of live) {
      if (tag.startsWith("ethnicity_") || tag === "lineage_mixed") hits.add(tag);
    }
  }
  if (action?.organic === "gene") {
    for (const tag of live) {
      if (tag.startsWith("trait_") || tag.startsWith("condition_") || tag.startsWith("risk_")) hits.add(tag);
    }
  }
  return [...hits];
}

function pickFromBucket(rng, bucket) {
  if (!bucket.length) return null;
  if (!rng) return bucket[0];
  return pick(rng, bucket);
}

export function selectInterveningTags(action, ctx = {}, rng = null) {
  const all = candidateInterveningTags(action, ctx);
  if (all.length <= MAX_TAGS_PER_CHOICE) return all.slice();
  const advantage = all.filter((tag) => tagValence(tag, ctx) === "advantage");
  const strain = all.filter((tag) => tagValence(tag, ctx) === "strain");
  const rest = all.filter((tag) => tagValence(tag, ctx) === "contextual");
  const chosen = [];
  const take = (bucket) => {
    const next = pickFromBucket(rng, bucket.filter((tag) => !chosen.includes(tag)));
    if (next) chosen.push(next);
  };
  take(advantage);
  take(strain);
  take(rest.length ? rest : all);
  while (chosen.length < MAX_TAGS_PER_CHOICE) {
    const leftover = all.filter((tag) => !chosen.includes(tag));
    if (!leftover.length) break;
    take(leftover);
  }
  return chosen.slice(0, MAX_TAGS_PER_CHOICE);
}

export function stampTagInfluence(action, ctx = {}, rng = null) {
  if (!action) return action;
  const candidates = candidateInterveningTags(action, ctx);
  const selected = selectInterveningTags(action, ctx, rng);
  action.interveningTags = selected.slice();
  action.tagInfluenceCount = selected.length;
  action.tagInfluenceCapped = candidates.length > MAX_TAGS_PER_CHOICE;
  action.untaggedBaseline = isUntaggedBaseline(action);
  return action;
}

export function influenceWeightMultiplier(action, ctx = {}) {
  if (isUntaggedBaseline(action)) return 1;
  const selected = action.interveningTags || selectInterveningTags(action, ctx);
  const n = Math.min(MAX_TAGS_PER_CHOICE, selected.length);
  if (!n) return action?.tagDriven || action?.organic ? 1.08 : 1;
  const valences = new Set(selected.map((tag) => tagValence(tag, ctx)));
  const cross = valences.has("advantage") && valences.has("strain");
  return 1.22 + n * 0.16 + (cross ? 0.1 : 0);
}

export function ensureUntaggedBaseline(rng, picked, untaggedPool = [], ctx = {}, alreadyIds = []) {
  const next = (picked || []).slice();
  const used = new Set([
    ...alreadyIds,
    ...next.map((row) => row?.id),
    ...next.map((row) => row?.text),
  ]);
  const pool = (untaggedPool || []).filter((action) => (
    isUntaggedBaseline(action)
    && !used.has(action.id)
    && !used.has(action.text)
    && !optionExcluded(ctx.character, action.id, action.text)
  ));
  const fill = () => {
    if (!pool.length) return null;
    const action = pickWeighted(rng, pool, (row) => Number(row.weight) || 1) || pool[0];
    const at = pool.indexOf(action);
    if (at >= 0) pool.splice(at, 1);
    used.add(action.id);
    used.add(action.text);
    return action;
  };
  while (taggedTriadCount(next) > MAX_TAGGED_TRIAD_SLOTS) {
    const slot = next.findIndex((row) => !isUntaggedBaseline(row) && row.asymmetric !== "specialized");
    const fallback = slot >= 0 ? slot : next.findIndex((row) => !isUntaggedBaseline(row));
    const replacement = fill();
    if (fallback < 0 || !replacement) break;
    next[fallback] = replacement;
  }
  if (next.filter(isUntaggedBaseline).length < MIN_UNTAGGED_TRIAD_SLOTS) {
    const replacement = fill();
    if (replacement) {
      if (next.length < 3) next.push(replacement);
      else {
        const slot = next.findIndex((row) => !isUntaggedBaseline(row) && row.asymmetric !== "specialized");
        const fallback = slot >= 0 ? slot : next.findIndex((row) => !isUntaggedBaseline(row));
        if (fallback >= 0) next[fallback] = replacement;
      }
    }
  }
  return next;
}

export function hasLiveCanonicalTag(ctx = {}) {
  return liveTagIds(ctx).some((tag) => CANONICAL_PREFIXES.some((prefix) => tag.startsWith(prefix)));
}

export {
  MAX_TAGS_PER_CHOICE,
  MAX_TAGGED_TRIAD_SLOTS,
  MIN_UNTAGGED_TRIAD_SLOTS,
};
