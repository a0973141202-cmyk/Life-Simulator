/**
 * Tag-driven weekly choices + uniqueness filter.
 * Tags unlock/lock options; the triad must differ in direction, risk, and situation.
 */

import { chance, pickWeighted } from "./rng.js";
import { uniqueTags } from "./tag-system.js";
import { organicContextsActive, organicWeight } from "./organic-trigger.js";
import { TAG_PREFIX } from "./data/tag-schema.js";
import {
  MAX_TAGGED_TRIAD_SLOTS,
  MAX_TAGS_PER_CHOICE,
  ensureUntaggedBaseline,
  influenceWeightMultiplier,
  isUntaggedBaseline,
  stampTagInfluence,
  taggedRoomLeft,
} from "./tag-influence.js";
import { optionExcluded, rememberExcluded } from "./exclusion-buffer.js";
import { normalizeChoiceText, textsTooSimilar } from "./choice-similarity.js";

export { normalizeChoiceText, textsTooSimilar };

const CANONICAL_PREFIXES = Object.freeze(Object.values(TAG_PREFIX));

export function hasLiveCanonicalTag(ctx = {}) {
  return (ctx.tags || []).some((tag) => (
    CANONICAL_PREFIXES.some((prefix) => String(tag).startsWith(prefix))
  ));
}

const OFFERED_CAP = 36;
const CHOSEN_CAP = 18;
const STAGE_CAP = 48;

const DIRECTION_HOOKS = Object.freeze({
  survive: ["survival", "hide", "tracking", "sea", "arctic", "desert", "weather", "malaria", "tropics"],
  seek: ["study", "navigation", "ask"],
  bind: ["family", "empathy", "care"],
  transact: ["trade", "urban", "scarcity"],
  perform: ["art", "social"],
  defy: ["crime", "risk", "militant", "street", "war"],
  tend: ["health", "body", "craft"],
  confront: ["official", "politics", "leadership"],
  withdraw: ["night", "wait"],
});

const TEXT_DIRECTION = Object.freeze([
  [/躲|避開|退後|咽回|缺席|關進|不解釋/, "withdraw"],
  [/對峙|硬碰|頂回去|報復|砸/, "confront"],
  [/照顧|抱緊|幫家|弟妹|喂/, "bind"],
  [/讀|寫|問|數一遍|理清/, "seek"],
  [/帳|錢|配給|商號|買賣/, "transact"],
  [/過完|平安|早睡|什麼都不/, "endure"],
  [/逃|退路|求生|水裡|足跡|燃料/, "survive"],
  [/唱|旋律|節奏|名字介紹/, "perform"],
]);

export function emptyChoiceMemory() {
  return {
    stageId: "",
    recentIds: [],
    recentStems: [],
    chosenIds: [],
    chosenStems: [],
    stageIds: [],
    stageStems: [],
  };
}

export function ensureChoiceMemory(character, stageId = "") {
  if (!character) return emptyChoiceMemory();
  if (!character.choiceMemory) character.choiceMemory = emptyChoiceMemory();
  const memory = character.choiceMemory;
  if (stageId && memory.stageId && memory.stageId !== stageId) {
    memory.stageId = stageId;
    memory.stageIds = [];
    memory.stageStems = [];
  } else if (stageId && !memory.stageId) {
    memory.stageId = stageId;
  }
  return memory;
}

/**
 * Force option-generator age weights onto the live life stage (legendary 24+ spawn).
 * Clears childhood stage stems so the first triad cannot inherit awakening pools.
 */
export function resetOptionAgeWeights(character, ageYears = 0, stageId = "") {
  if (!character) return emptyChoiceMemory();
  const stage = stageId || `age_${Math.max(0, Math.floor(Number(ageYears) || 0))}`;
  character.choiceMemory = {
    ...emptyChoiceMemory(),
    stageId: stage,
    ageAnchor: Math.max(0, Math.floor(Number(ageYears) || 0)),
  };
  character.optionAgeAnchor = Math.max(0, Math.floor(Number(ageYears) || 0));
  return character.choiceMemory;
}

function pushUnique(list, value, cap) {
  if (!value) return;
  const at = list.indexOf(value);
  if (at >= 0) list.splice(at, 1);
  list.push(value);
  if (list.length > cap) list.splice(0, list.length - cap);
}

export function baseActionId(id) {
  return String(id || "").replace(/__\d+$/, "").replace(/^fog_/, "");
}

export function collectCtxTags(ctx = {}) {
  const character = ctx.character || {};
  const fromRecords = (character.tagRecords || []).map((row) => row.id).filter(Boolean);
  const storeIds = typeof character.tagStore?.ids === "function" ? character.tagStore.ids() : [];
  return uniqueTags([
    ...(ctx.tags || []),
    ...(character.tags || []),
    ...fromRecords,
    ...(Array.isArray(storeIds) ? storeIds : []),
    ...(ctx.environment?.tags || []),
    ...(ctx.currentTags || []),
    ...(ctx.natalTags || []),
    ...(ctx.settlementTags || []),
  ]);
}

export function ctxHasTag(ctx, wanted) {
  const tags = ctx?.tags || [];
  if (!wanted) return false;
  if (tags.includes(wanted)) return true;
  const aliases = [
    wanted,
    `ethnicity_${wanted}`,
    `trait_${wanted}`,
    `parent_trait_${wanted}`,
    `hook_${wanted}`,
    `acquired_${wanted}`,
    `current_${wanted}`,
    `current_date_${wanted}`,
    `current_env_${wanted}`,
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
    `region_${wanted}`,
    `settlement_${wanted}`,
  ];
  if (aliases.some((id) => tags.includes(id))) return true;
  return tags.some((tag) => tag.endsWith(`_${wanted}`) || tag.endsWith(`:${wanted}`));
}

export function whenTagsMatch(when = {}, ctx = {}) {
  if (when.tagsAny || when.tagPrefixesAny) {
    const tagHit = when.tagsAny?.some((tag) => ctxHasTag(ctx, tag));
    const prefixHit = when.tagPrefixesAny?.some((prefix) => (
      (ctx.tags || []).some((tag) => String(tag).startsWith(prefix))
    ));
    if (when.tagsAny && when.tagPrefixesAny) {
      if (!tagHit && !prefixHit) return false;
    } else if (when.tagsAny && !tagHit) {
      return false;
    } else if (when.tagPrefixesAny && !prefixHit) {
      return false;
    }
  }
  if (when.tagsAll && when.tagsAll.length) {
    const have = when.tagsAll.filter((tag) => ctxHasTag(ctx, tag)).length;
    const need = Math.min(when.tagsAll.length, MAX_TAGS_PER_CHOICE);
    if (have < need) return false;
  }
  if (when.tagsNone && when.tagsNone.some((tag) => ctxHasTag(ctx, tag))) return false;
  if (when.tagPrefixesNone) {
    const tags = ctx.tags || [];
    if (when.tagPrefixesNone.some((prefix) => tags.some((tag) => String(tag).startsWith(prefix)))) {
      return false;
    }
  }
  if (when.hooksAny) {
    const hooks = ctx.hooks || [];
    if (!when.hooksAny.some((hook) => hooks.includes(hook) || ctxHasTag(ctx, `hook_${hook}`))) {
      return false;
    }
  }
  if (when.organicContexts && !organicContextsActive(ctx, when.organicContexts)) return false;
  return true;
}

export function isTagGated(action) {
  const when = action?.when || {};
  return Boolean(
    action?.tagDriven
    || action?.organic
    || when.tagsAny
    || when.tagsAll
    || when.tagsNone
    || when.tagPrefixesAny
    || when.tagPrefixesNone
    || when.hooksAny,
  );
}

export function inferDirection(action) {
  if (action?.direction) return action.direction;
  if (action?.stance) return action.stance;
  if (action?.path === "crime" || action?.path === "militant") return "defy";
  if (action?.path === "politics") return "confront";
  if (action?.traumaVictim) return "withdraw";
  if (action?.crisis) return "survive";
  if (action?.daily && action.phase === "night") return "withdraw";
  if (action?.daily && action.phase === "social") return "perform";
  if (action?.fallback) return "endure";
  const hooks = action?.hooks || action?.when?.hooksAny || [];
  for (const [direction, needles] of Object.entries(DIRECTION_HOOKS)) {
    if (hooks.some((hook) => needles.includes(hook))) return direction;
  }
  const text = String(action?.text || "");
  for (const [pattern, direction] of TEXT_DIRECTION) {
    if (pattern.test(text)) return direction;
  }
  if (action?.domain) return action.domain;
  return "endure";
}

export function inferRisk(action) {
  if (action?.riskBand) return action.riskBand;
  const chance = Number(action?.risk?.chance || 0);
  const health = Number(action?.effects?.health || 0);
  const sanity = Number(action?.effects?.sanity ?? action?.effects?.mood ?? 0);
  if (action?.crisis || action?.dark || action?.perpetrator || chance >= 0.28) return "high";
  if (health <= -3 || sanity <= -3 || chance >= 0.16) return "high";
  if (health < 0 || sanity < 0 || chance > 0 || action?.sandbox) return "mid";
  return "low";
}

export function inferSituation(action) {
  if (action?.situation) return action.situation;
  if (action?.lifeState) return action.lifeState;
  if (action?.schoolKind) return `school_${action.schoolKind}`;
  if (action?.adultKind) return `adult_${action.adultKind}`;
  if (action?.worldKind) return `world_${action.worldKind}`;
  if (action?.figureKind) return `figure_${action.figureKind}`;
  if (action?.daily) return `daily_${action.phase || "slice"}`;
  if (action?.traumaVictim || action?.trauma) return "trauma";
  if (action?.crisis) return "crisis";
  if (action?.perpCasteEcology) return "caste";
  if (action?.organic === "gene") return "gene";
  if (action?.organic === "ethnicity") return "lineage";
  const prefix = action?.when?.tagPrefixesAny?.[0] || action?.when?.tagsAny?.[0] || "";
  if (prefix.startsWith("trauma") || prefix === "trauma_") return "trauma";
  if (prefix.startsWith("social") || prefix === "social_") return "standing";
  if (prefix.startsWith("school") || prefix === "school_") return "school";
  if (prefix.startsWith("ethnicity") || prefix === "ethnicity_") return "local";
  if (prefix.startsWith("household") || prefix === "household_") return "home";
  if (prefix.startsWith("current_") || prefix.startsWith("date_")) return "weather";
  const hooks = action?.hooks || action?.when?.hooksAny || [];
  if (hooks.includes("weather") || hooks.includes("arctic")) return "weather";
  if (hooks.includes("family")) return "home";
  if (hooks.includes("study")) return "study";
  if (hooks.includes("trade")) return "market";
  if (hooks.includes("official")) return "official";
  if (action?.fallback) return "idle";
  return "generic";
}

export function fingerprint(action) {
  return {
    direction: inferDirection(action),
    risk: inferRisk(action),
    situation: inferSituation(action),
    stem: normalizeChoiceText(action?.trueText || action?.text),
  };
}

function entropyMix(action, ctx) {
  const salt = Number(ctx?.weekEntropy ?? 0.5);
  const raw = String(action?.id || action?.text || "");
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  return ((hash % 97) / 97 + salt) % 1;
}

export function choiceWeight(action, ctx) {
  let weight = action?.weight ?? 1;
  const ledger = ctx?.ledger || {};
  const pressure = ctx?.pressure?.score || 0;
  if (action?.crisis) weight *= 1 + pressure / 70;
  if (action?.path && (ledger.paths?.[action.path] || 0) > 0) {
    weight *= 1.35 + Math.min(1.8, (ledger.paths[action.path] || 0) * 0.12);
  }
  if (action?.sandbox && (ctx?.ageYears || 0) >= 18 && pressure < 28) {
    weight *= 1.08;
  }
  if (!isUntaggedBaseline(action) && whenTagsMatch(action.when || {}, ctx)) {
    stampTagInfluence(action, ctx);
    weight *= influenceWeightMultiplier(action, ctx);
  }
  if (action?.tagDriven) weight *= 1.1;
  if (action?.organic) weight *= Math.min(1.4, organicWeight(action, ctx));
  const life = ctx?.lifeContext;
  if (life) {
    if ((life.hungry || life.poor) && /survive|hunger|crisis|idle/.test(action?.situation || "")) {
      weight *= 1.22;
    }
    if (life.fatherAlive && /父親|爸爸|爹/.test(action?.text || "")) weight *= 1.12;
    if (life.motherAlive && /母親|媽媽|娘/.test(action?.text || "")) weight *= 1.12;
    if (life.affluent && (action?.hooks || []).includes("trade")) weight *= 1.08;
  }
  weight *= 0.4 + entropyMix(action, ctx) * 1.4;
  return Math.max(0.05, weight);
}

function canAdd(action, picked, memory, mode, maxTagged, ctx = {}) {
  if (!action) return false;
  if (picked.includes(action)) return false;
  const id = baseActionId(action.id);
  if (picked.some((row) => baseActionId(row.id) === id)) return false;
  if (optionExcluded(ctx.character, id, action.trueText || action.text)) return false;
  if (memory.recentIds.includes(id) || memory.chosenIds.includes(id) || memory.stageIds.includes(id)) {
    return false;
  }
  const stem = fingerprint(action).stem;
  if (stem) {
    if (picked.some((row) => textsTooSimilar(fingerprint(row).stem, stem))) return false;
    if (memory.recentStems.some((row) => textsTooSimilar(row, stem))) return false;
    if (memory.chosenStems.some((row) => textsTooSimilar(row, stem))) return false;
    if (memory.stageStems.some((row) => textsTooSimilar(row, stem))) return false;
  }
  if (!isUntaggedBaseline(action) && picked.filter((row) => !isUntaggedBaseline(row)).length >= maxTagged) {
    return false;
  }
  const next = fingerprint(action);
  const used = picked.map((row) => fingerprint(row));
  if (mode === "strict") {
    if (used.some((row) => row.direction === next.direction)) return false;
    if (next.situation !== "generic" && used.some((row) => row.situation === next.situation)) return false;
    if (used.some((row) => row.risk === next.risk)) return false;
  } else if (mode === "soft") {
    const sameDirection = used.some((row) => row.direction === next.direction);
    const sameSituation = next.situation !== "generic" && used.some((row) => row.situation === next.situation);
    if (sameDirection && sameSituation) return false;
    if (used.length === 2 && used[0].risk === used[1].risk && next.risk === used[0].risk) return false;
  }
  return true;
}

export function pickDiverseTriad(rng, pool, count, ctx, opts = {}) {
  const memory = opts.memory || emptyChoiceMemory();
  const picked = (opts.already || []).slice();
  const maxTagged = opts.maxTagged ?? MAX_TAGGED_TRIAD_SLOTS;
  const source = [];
  const seen = new Set();
  for (const action of pool || []) {
    const key = `${baseActionId(action?.id)}::${normalizeChoiceText(action?.text)}`;
    if (!action || seen.has(key)) continue;
    seen.add(key);
    source.push(action);
  }
  const take = (mode) => {
    const eligible = source.filter((action) => canAdd(action, picked, memory, mode, maxTagged, ctx));
    if (!eligible.length) return false;
    const weigh = opts.getWeight || ctx.getWeight || ((row) => choiceWeight(row, ctx));
    const item = pickWeighted(rng, eligible, weigh);
    if (!item) return false;
    picked.push(item);
    return true;
  };
  while (picked.length < count) {
    if (take("strict")) continue;
    if (take("soft")) continue;
    if (take("loose")) continue;
    break;
  }
  return picked.slice(0, count);
}

export function pickWeeklyTriad(rng, ctx, packs, memory) {
  const {
    pressure = {},
    climate = false,
    inCasteHabitat = false,
    crisis = [],
    tagged = [],
    trauma = [],
    daily = [],
    caste = [],
    organic = [],
    tagLink = [],
    asymmetric = [],
    matched = [],
    loose = [],
    fallbacks = [],
  } = packs || {};
  let picked = [];
  const age = ctx.ageYears || 0;
  const liveTags = hasLiveCanonicalTag(ctx);
  const minority = Boolean(
    ctx.constitution?.minority
    || ctx.organic?.minority
    || ctx.character?.bloodline?.mixed
    || (ctx.tags || []).some((tag) => String(tag).startsWith("ethnicity_") || tag === "lineage_mixed"),
  );
  const specialized = (asymmetric || []).filter((action) => action.asymmetric === "specialized");
  const pressureHot = pressure.level === "ruin" || pressure.level === "crisis" || pressure.level === "strain";
  const cap = { memory, maxTagged: MAX_TAGGED_TRIAD_SLOTS };
  const untaggedLoose = (loose || []).filter(isUntaggedBaseline);
  if (untaggedLoose.length) {
    picked = pickDiverseTriad(rng, untaggedLoose, 1, ctx, { ...cap, already: picked, maxTagged: 0 });
  }
  if ((pressure.level === "ruin" || pressure.level === "crisis") && age >= 16 && crisis.length && taggedRoomLeft(picked)) {
    const want = Math.min(taggedRoomLeft(picked), pressure.level === "ruin" ? 2 : 1);
    picked = pickDiverseTriad(rng, crisis, picked.length + want, ctx, { ...cap, already: picked });
  }
  if (specialized.length && taggedRoomLeft(picked) && (pressureHot || climate || minority) && chance(rng, minority ? 0.48 : 0.26)) {
    picked = pickDiverseTriad(rng, specialized, picked.length + 1, ctx, { ...cap, already: picked });
  }
  if (organic.length && taggedRoomLeft(picked) && ctx.organic?.shouldFire && chance(rng, ctx.organic.chance || 0.12)) {
    picked = pickDiverseTriad(rng, organic, picked.length + 1, ctx, { ...cap, already: picked });
  }
  const tagPool = [...tagged, ...tagLink];
  if (tagPool.length && liveTags && taggedRoomLeft(picked)) {
    picked = pickDiverseTriad(rng, tagPool, picked.length + taggedRoomLeft(picked), ctx, { ...cap, already: picked });
  }
  if (trauma.length && taggedRoomLeft(picked) && (climate || (ctx.tags || []).some((tag) => String(tag).startsWith("trauma_")))) {
    picked = pickDiverseTriad(rng, trauma, picked.length + 1, ctx, { ...cap, already: picked });
  }
  if (daily.length && chance(rng, 0.42)) {
    picked = pickDiverseTriad(rng, daily, picked.length + 1, ctx, { ...cap, already: picked });
  }
  if (caste.length && inCasteHabitat && taggedRoomLeft(picked)) {
    picked = pickDiverseTriad(rng, caste, picked.length + 1, ctx, { ...cap, already: picked });
  }
  picked = pickDiverseTriad(rng, matched, 3, ctx, { ...cap, already: picked });
  if (picked.length < 3 || picked.filter(isUntaggedBaseline).length < 1) {
    picked = pickDiverseTriad(rng, untaggedLoose, 3, ctx, { ...cap, already: picked, maxTagged: MAX_TAGGED_TRIAD_SLOTS });
  }
  if (picked.length < 3) {
    picked = pickDiverseTriad(rng, fallbacks.filter(isUntaggedBaseline), 3, ctx, { ...cap, already: picked });
  }
  if (picked.length < 3) {
    picked = pickDiverseTriad(rng, fallbacks, 3, ctx, { ...cap, already: picked });
  }
  return ensureUntaggedBaseline(rng, picked.slice(0, 3), [...untaggedLoose, ...fallbacks], ctx).slice(0, 3);
}

export function rememberOfferedChoices(character, options, stageId) {
  const memory = ensureChoiceMemory(character, stageId);
  for (const option of options || []) {
    const id = baseActionId(option.id);
    const stem = normalizeChoiceText(option.trueText || option.text);
    if (id) {
      pushUnique(memory.recentIds, id, OFFERED_CAP);
      pushUnique(memory.stageIds, id, STAGE_CAP);
    }
    if (stem) {
      pushUnique(memory.recentStems, stem, OFFERED_CAP);
      pushUnique(memory.stageStems, stem, STAGE_CAP);
    }
  }
  rememberExcluded(character, options);
  return memory;
}

export function rememberChosenChoice(character, option, stageId) {
  const memory = ensureChoiceMemory(character, stageId);
  const id = baseActionId(option?.id);
  const stem = normalizeChoiceText(option?.trueText || option?.text);
  if (id) {
    pushUnique(memory.chosenIds, id, CHOSEN_CAP);
    pushUnique(memory.recentIds, id, OFFERED_CAP);
    pushUnique(memory.stageIds, id, STAGE_CAP);
  }
  if (stem) {
    pushUnique(memory.chosenStems, stem, CHOSEN_CAP);
    pushUnique(memory.recentStems, stem, OFFERED_CAP);
    pushUnique(memory.stageStems, stem, STAGE_CAP);
  }
  return memory;
}

export function stampChoiceFingerprint(option) {
  const next = fingerprint(option);
  option.direction = next.direction;
  option.riskBand = next.risk;
  option.situation = next.situation;
  option.tagDriven = Boolean(option.tagDriven || isTagGated(option));
  option.untaggedBaseline = Boolean(option.untaggedBaseline || isUntaggedBaseline(option));
  if (option.interveningTags) {
    option.interveningTags = option.interveningTags.slice(0, MAX_TAGS_PER_CHOICE);
    option.tagInfluenceCount = option.interveningTags.length;
  }
  return option;
}
