/**
 * Adult society / occupation / consequence engine (18+).
 * Picks a factual beat, exposes three stances, bills crisis without writing the heart.
 * Occupation and dark-ecology data stay in js/data/**; this file only selects and invoices.
 */

import { ADULT_INCIDENTS } from "./data/adult-incidents/catalog.js";
import { ADULT_COST_NOTE, ADULT_STANCE_NOTE } from "./data/adult-writing-rules.js";
import { composeAdultBeat } from "./dynamic-prose.js";
import { ADULT_TAG_INDEX } from "./data/adult-tags-database.js";
import {
  OCCUPATION_DATABASE,
  OCCUPATION_INDEX,
  occupationByLabel,
} from "./data/occupations-database.js";
import { DAILY_AUDIENCE } from "./data/daily/schema.js";
import { SOCIETY_ENTRY_AGE } from "./constants.js";
import { progressAllowsIncident } from "./life-stage-manager.js";
import { addCharacterTag } from "./tag-system.js";
import { chance, pickWeighted } from "./rng.js";
import { socialStanding } from "./social-feedback.js";
import { attachNpcSpeech } from "./npc-voice.js";
import { ctxHasTag } from "./choice-pool.js";
import { incidentAllowed } from "./age-gate.js";
import { eventOutline, filterCooledPool } from "./event-memory.js";

export function emptyCareerState() {
  return {
    occupationId: null,
    sector: null,
    crisis: 0,
    burnout: 0,
    lastIncidentId: null,
    lastStance: null,
    log: [],
  };
}

export function ensureCareerState(character) {
  if (!character.careerState) character.careerState = emptyCareerState();
  if (character.occupationId && !character.careerState.occupationId) {
    character.careerState.occupationId = character.occupationId;
    character.careerState.sector = OCCUPATION_INDEX[character.occupationId]?.sector || null;
  }
  return character.careerState;
}

function audienceAllowed(audience, age) {
  if (!audience || audience === "span") return true;
  const gate = DAILY_AUDIENCE[audience] || { minAge: 18, maxAge: 120 };
  return age >= gate.minAge && age <= gate.maxAge;
}

function hasTag(ctx, id) {
  return ctxHasTag(ctx, id);
}

function pathXp(ctx, key) {
  return ctx.ledger?.paths?.[key] || 0;
}

function currentSector(ctx) {
  return ctx.character?.careerState?.sector
    || OCCUPATION_INDEX[ctx.character?.occupationId]?.sector
    || occupationByLabel(ctx.character?.occupation)?.sector
    || null;
}

function incidentMatches(incident, ctx) {
  const when = incident.when || {};
  const age = ctx.ageYears ?? 0;
  if (when.age) {
    if (age < when.age[0] || age > when.age[1]) return false;
  } else if (!audienceAllowed(incident.audience, age)) {
    return false;
  }
  if (when.year && (ctx.year < when.year[0] || ctx.year > when.year[1])) return false;
  if (when.regions && !when.regions.includes(ctx.region)) return false;
  if (when.countriesAny) {
    const country = ctx.character?.country || ctx.settlement?.country || "";
    if (!when.countriesAny.some((item) => country.includes(item))) return false;
  }
  if (when.classes && !when.classes.includes(ctx.familyClassId)) return false;
  if (when.settlementKinds) {
    const kind = ctx.settlement?.kind || ctx.character?.settlementKind;
    if (!when.settlementKinds.includes(kind)) return false;
  }
  if (when.tagsAny && !when.tagsAny.some((tag) => hasTag(ctx, tag))) return false;
  if (when.tagsAll && !when.tagsAll.every((tag) => hasTag(ctx, tag))) return false;
  if (when.tagsNone && when.tagsNone.some((tag) => hasTag(ctx, tag))) return false;
  if (when.pathsAny && !when.pathsAny.some((path) => pathXp(ctx, path) >= 1)) return false;
  if (when.occupationAny) {
    const occId = ctx.character?.occupationId || "";
    const occLabel = ctx.character?.occupation || "";
    const ok = when.occupationAny.some((item) => (
      occId === item || occLabel === item || occLabel.includes(item)
    ));
    if (!ok) return false;
  }
  return incidentAllowed(incident, ctx);
}

export function adultIncidentChance(ctx) {
  const age = ctx.ageYears ?? 0;
  if (age < SOCIETY_ENTRY_AGE) return 0;
  if (ctx.character?.socialPhase && ctx.character.socialPhase !== "adult") return 0;
  const tags = ctx.tags || [];
  const crisis = ctx.character?.careerState?.crisis || 0;
  const heat = ctx.ledger?.heat || 0;
  const dark = tags.some((tag) => tag.startsWith("adult_underworld") || tag === "path_crime" || tag === "adult_gang_rank");
  let p = 0.2;
  if (crisis >= 20) p += 0.12;
  if (heat >= 30) p += 0.08;
  if (dark) p += 0.1;
  if (tags.includes("adult_burnout") || tags.includes("adult_debt")) p += 0.06;
  return Math.min(0.48, p);
}

export function pickAdultIncident(rng, ctx) {
  const age = ctx.ageYears ?? 0;
  if (age < SOCIETY_ENTRY_AGE) return null;
  if (!progressAllowsIncident("adult", ctx)) return null;
  if (!chance(rng, adultIncidentChance(ctx))) return null;
  const pool = ADULT_INCIDENTS.filter((incident) => incidentMatches(incident, ctx));
  if (!pool.length) return null;
  const state = ctx.character ? ensureCareerState(ctx.character) : null;
  const sector = currentSector(ctx);
  const cooled = filterCooledPool(pool, ctx.character, (incident) => ({
    id: incident.id,
    outline: eventOutline("adult", incident.kind, incident.sector),
  }), ctx);
  const fresh = cooled.filter((incident) => incident.id !== state?.lastIncidentId);
  const source = fresh.length ? fresh : cooled;
  return pickWeighted(rng, source, (incident) => {
    let weight = incident.weight ?? 1;
    if (sector && incident.sector === sector) weight *= 2.2;
    if (incident.kind === "crime" || incident.kind === "gang") {
      weight *= (pathXp(ctx, "crime") >= 2 || hasTag(ctx, "adult_underworld_base")) ? 1.6 : 0.45;
    }
    if (incident.kind === "politics" && (pathXp(ctx, "politics") >= 1 || sector === "politics")) weight *= 1.5;
    if (incident.kind === "burnout" && (state?.burnout || 0) >= 18) weight *= 1.7;
    return weight;
  });
}

export function renderAdultIncident(incident, ctx = null, rng = null) {
  if (!incident) return "";
  const body = composeAdultBeat(typeof rng === "function" ? rng : (() => 0.39), incident, ctx || {});
  if (!ctx) return body;
  return attachNpcSpeech(body, ctx, {
    ...incident,
    adultIncident: true,
    adultIncidentId: incident.id,
    adultKind: incident.kind,
    adultSector: incident.sector,
  }, rng);
}

function addAdultTag(character, id) {
  const def = ADULT_TAG_INDEX[id];
  if (!def) {
    return addCharacterTag(character, { id, label: id, source: "adult", category: "adult" });
  }
  return addCharacterTag(character, {
    id: def.id,
    category: "adult",
    label: def.label,
    source: "adult",
    reason: def.reason,
    hooks: def.hooks,
    valence: "contextual",
    advantageIn: def.advantageIn,
    strainIn: def.strainIn,
    temporary: false,
  });
}

export function stampAdultTags(character, ids = []) {
  const applied = [];
  for (const id of [...new Set(ids || [])]) {
    if (!id || !String(id).startsWith("adult_")) continue;
    if (addAdultTag(character, id)) applied.push(id);
  }
  return applied;
}

export function applyOccupation(character, occupationId) {
  const def = OCCUPATION_INDEX[occupationId];
  if (!character || !def) return null;
  character.occupationId = def.id;
  character.occupation = def.label;
  const state = ensureCareerState(character);
  state.occupationId = def.id;
  state.sector = def.sector;
  stampAdultTags(character, def.tags);
  return def;
}

function occupationWeight(row, character) {
  const classId = character.familyClassId || "worker";
  let weight = (row.weight ?? 1) * (row.classWeights[classId] ?? 0.45);
  const education = character.education || "none";
  if (row.educationAny && !row.educationAny.includes(education)) weight *= 0.35;
  if (education === "university" && (row.sector === "office" || row.sector === "politics")) weight *= 1.6;
  if (education === "none" && row.sector === "office") weight *= 0.25;
  const tags = character.tags || [];
  const crimeXp = character.ledger?.paths?.crime || 0;
  const expelled = tags.includes("school_expelled") || tags.includes("school_gang") || tags.includes("school_weapon");
  if (row.dark) {
    weight *= expelled ? 3.2 : 1;
    weight *= crimeXp >= 2 ? 3.4 : 0.55;
    if (tags.includes("adult_underworld_base") || tags.includes("path_crime")) weight *= 2.2;
  } else if (crimeXp >= 3 && row.sector !== "underworld") {
    weight *= 0.7;
  }
  if (row.sector === "neet" && (character.stats?.wealth || 0) < 28) weight *= 1.4;
  if (row.sector === "politics" && (character.ledger?.paths?.politics || 0) >= 1) weight *= 2.2;
  if (row.sector === "commerce" && (character.ledger?.paths?.commerce || 0) >= 1) weight *= 1.8;
  const standing = socialStanding(character.ledger || character);
  if (row.dark || row.sector === "underworld") weight *= standing.gangHireMult;
  else if (row.sector !== "neet") weight *= standing.jobHireMult;
  return weight;
}

export function assignOccupation(rng, character) {
  const existing = OCCUPATION_INDEX[character.occupationId] || occupationByLabel(character.occupation);
  const crimeXp = character.ledger?.paths?.crime || 0;
  const expelled = (character.tags || []).includes("school_expelled")
    || (character.tags || []).includes("school_gang");
  if (existing && !existing.dark && crimeXp < 2 && !expelled) {
    applyOccupation(character, existing.id);
    return existing;
  }
  const picked = pickWeighted(rng, OCCUPATION_DATABASE, (row) => occupationWeight(row, character));
  if (!picked) {
    applyOccupation(character, "factory_hand");
    return OCCUPATION_INDEX.factory_hand;
  }
  applyOccupation(character, picked.id);
  return picked;
}

export function enterSociety(character, time = {}, rng = null) {
  if (!character) return { notes: [], occupation: null };
  if (character.socialPhase === "adult") {
    ensureCareerState(character);
    return { notes: [], occupation: OCCUPATION_INDEX[character.occupationId] || null };
  }
  character.socialPhase = "adult";
  character.societyEnteredAt = {
    year: time.year ?? null,
    iso: time.iso ?? null,
    ageYears: time.ageYears ?? SOCIETY_ENTRY_AGE,
  };
  ensureCareerState(character);
  const occupation = rng ? assignOccupation(rng, character) : applyOccupation(character, character.occupationId || "factory_hand");
  const applied = stampAdultTags(character, ["adult_society_entry", ...(occupation?.tags || [])]);
  const notes = [
    ADULT_REALISM_LINE(character, occupation),
  ].filter(Boolean);
  return { notes, occupation, applied };
}

function ADULT_REALISM_LINE(character, occupation) {
  const label = occupation?.label || character.occupation || "謀生";
  return `${character.name}滿法定成年。戶口與工錢開始按成人的規矩算。目前在做${label}。`;
}

export function applyAdultChoice(character, option, time = {}, rng = null) {
  if (!character || !option?.adultIncident) {
    return { applied: [], notes: [], crisisDelta: 0, ending: null };
  }
  const state = ensureCareerState(character);
  const applied = stampAdultTags(character, option.addTags || []);
  const dark = Boolean(option.dark || option.perpetrator);
  const crisisDelta = option.crisisDelta || (dark ? 12 : 2);
  const burnoutDelta = option.burnoutDelta || 0;
  state.crisis = Math.min(100, Math.max(0, state.crisis + crisisDelta));
  state.burnout = Math.min(100, Math.max(0, state.burnout + burnoutDelta));
  state.lastIncidentId = option.adultIncidentId || null;
  state.lastStance = option.stance || null;
  if (option.occupationId) applyOccupation(character, option.occupationId);
  state.log.push({
    year: time.year ?? null,
    iso: time.iso ?? null,
    incident: option.adultIncidentId,
    stance: option.stance,
    dark,
    tags: (option.addTags || []).slice(),
  });
  if (state.log.length > 48) state.log.splice(0, state.log.length - 48);

  const notes = [];
  if (dark) {
    notes.push("現金若到，風聲與清算也按市場價另計。");
  }
  let ending = null;
  if (option.ending?.reason && (option.ending.force || (option.ending.chance && rng && rng() < option.ending.chance))) {
    ending = { reason: option.ending.reason, detail: option.ending.detail, destructive: true };
  }
  return { applied, notes, crisisDelta, dark, crisis: state.crisis, burnout: state.burnout, ending };
}

export function weeklyCareerFallout(rng, character, time = {}) {
  const state = character?.careerState;
  if (!state) return { notes: [], addTags: [], effects: {}, ending: null, consequence: null };
  const tags = character.tags || [];
  const notes = [];
  const addTags = [];
  const effects = {};
  let consequence = null;
  let ending = null;
  const wanted = character.ledger?.wanted || 0;
  const heat = character.ledger?.heat || 0;

  state.crisis = Math.max(0, Math.round(state.crisis * 0.92) - (tags.includes("adult_underworld_base") ? 0 : 1));
  state.burnout = Math.max(0, Math.round(state.burnout * 0.94));

  if (state.burnout >= 28 && chance(rng, Math.min(0.22, 0.06 + state.burnout * 0.003))) {
    effects.health = (effects.health || 0) - 3;
    effects.mood = (effects.mood || 0) - 2;
    addTags.push("adult_burnout");
    notes.push("過勞按週續費：睡眠與判斷力掉件。班表不討論你累不累。");
  }

  if (state.burnout >= 55 && chance(rng, 0.12)) {
    addTags.push("adult_breakdown");
    effects.health = (effects.health || 0) - 4;
    effects.mood = (effects.mood || 0) - 4;
    notes.push("精神過載落地：你在不該停的地方停住。這是生理帳，不是覺悟。");
  }

  const darkMark = tags.includes("adult_gang_rank")
    || tags.includes("adult_betrayer")
    || tags.includes("adult_liquidated_mark")
    || state.sector === "underworld";

  if (darkMark && state.crisis >= 24 && chance(rng, Math.min(0.26, 0.08 + state.crisis * 0.003))) {
    consequence = {
      wanted: 6,
      heat: 7,
      trust: -4,
      infamy: 3,
      eventLabel: "社會反噬",
    };
    notes.push("反噬到帳：風聲、盯梢或自己人開始對你不完整地笑。這是前幾週選擇的利息。");
  }

  if (tags.includes("adult_betrayer") && chance(rng, 0.16)) {
    addTags.push("adult_liquidated_mark");
    consequence = {
      ...(consequence || {}),
      heat: (consequence?.heat || 0) + 8,
      wanted: (consequence?.wanted || 0) + 4,
      trust: (consequence?.trust || 0) - 6,
      eventLabel: "出賣後的清算天氣",
    };
    notes.push("出賣紀錄開始在兩邊流通。保護承諾比報復短。");
  }

  if (tags.includes("adult_whistle") && (state.sector === "office" || state.sector === "labor") && chance(rng, 0.14)) {
    effects.wealth = (effects.wealth || 0) - 2;
    effects.charm = (effects.charm || 0) - 1;
    notes.push("開口的代價先於保護：班被調走、或走廊突然沒人跟你吃飯。");
  }

  if ((wanted >= 55 || (darkMark && state.crisis >= 48)) && chance(rng, 0.1)) {
    consequence = {
      ...(consequence || {}),
      wanted: (consequence?.wanted || 0) + 8,
      heat: (consequence?.heat || 0) + 8,
      path: "crime",
      pathXp: 1,
      eventLabel: "法辦或通緝推進",
    };
    notes.push("法律制裁推進：傳喚、臨檢或通緝程序不討論你當時怎麼想。");
  }

  if (tags.includes("adult_liquidated_mark") && (state.crisis >= 52 || wanted >= 40) && chance(rng, 0.09)) {
    ending = {
      reason: "組織清算",
      detail: "滅口不必戲劇化。人從班表、戶籍與日常裡同時缺席。",
    };
  }

  if (wanted >= 78 && heat >= 60 && chance(rng, 0.11)) {
    ending = {
      reason: "通緝收押",
      detail: "帳簿疊到足以收押。社會階段在看守所或路邊結束，不在勝利鏡頭裡。",
    };
  }

  if (tags.includes("adult_breakdown") && (character.stats?.health || 0) <= 18 && state.burnout >= 70 && chance(rng, 0.08)) {
    ending = {
      reason: "精神與身體同時過載",
      detail: "崩潰按生理與債務收取。沒有救贖蒙太奇。",
    };
  }

  return { notes, addTags, effects, ending, consequence, crisis: state.crisis, burnout: state.burnout };
}

export function modifyResolutionForAdult(character, option, effects, texts) {
  if (!option?.adultIncident) return { effects, extraRisk: 0 };
  const next = { ...effects };
  let extraRisk = 0;
  const crisis = character?.careerState?.crisis || 0;
  const tags = character?.tags || [];

  if (option.dark || option.perpetrator || option.path === "crime") {
    extraRisk += 0.12 + crisis * 0.002;
    if (next.wealth > 2) next.wealth = 2;
    if (next.charm > 1) next.charm = 1;
    texts.push("現金若到，通緝與清算按市場價另計。");
  }
  if (tags.includes("adult_betrayer")) extraRisk += 0.1;
  if (tags.includes("adult_liquidated_mark")) extraRisk += 0.16;
  if (tags.includes("adult_debt") && (option.hooks || []).includes("commerce")) {
    extraRisk += 0.06;
    if (next.wealth > 0) next.wealth = Math.max(0, next.wealth - 1);
  }
  if ((character?.careerState?.burnout || 0) >= 40 && option.adultIncident) {
    extraRisk += 0.05;
    if (next.health >= 0) next.health = (next.health || 0) - 1;
  }
  return { effects: next, extraRisk };
}

export { ADULT_INCIDENTS, ADULT_TAG_INDEX, ADULT_COST_NOTE, ADULT_STANCE_NOTE };
