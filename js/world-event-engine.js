/**
 * Global Contextual Random Event Engine.
 * Data stays in js/data/world-events/**. This file only filters, locks a triad, and invoices tags.
 *
 * Matching is strict: year, settlement, geo-band, climate, env tags, and optional
 * mortality-history shock ids. An event that did not exist in that year or place
 * must not enter the pool.
 */

import { WORLD_EVENTS } from "./data/world-events/catalog.js";
import { WORLD_COST_NOTE, WORLD_STANCE_NOTE } from "./data/world-event-rules.js";
import { composeWorldBeat } from "./dynamic-prose.js";
import { WORLD_TAG_INDEX } from "./data/world-event-tags.js";
import { DISASTER_TAGS, geoBandFor } from "./data/mortality-geo.js";
import { MORTALITY_HISTORY } from "./data/mortality-history.js";
import { filterShockRow } from "./history-engine.js";
import { addCharacterTag } from "./tag-system.js";
import { chance, pickWeighted } from "./rng.js";
import { attachNpcSpeech } from "./npc-voice.js";
import { getSettlementCountry } from "./settlements.js";
import { ctxHasTag } from "./choice-pool.js";
import { incidentAllowed } from "./age-gate.js";
import { attachUpheaval } from "./upheaval-engine.js";
import { socialStanding } from "./social-feedback.js";
import { eventOutline, filterCooledPool } from "./event-memory.js";
import { eraPlaceAllows } from "./event-engine.js";

const SEASONAL_ENV_NEEDLES = [
  "extreme_cold",
  "extreme_heat",
  "monsoon",
  "polar_night",
  "dust_dry",
];

export function emptyWorldEventState() {
  return {
    pressure: 0,
    lastIncidentId: null,
    lastStance: null,
    lastKind: null,
    log: [],
  };
}

export function ensureWorldEventState(character) {
  if (!character.worldEventState) character.worldEventState = emptyWorldEventState();
  return character.worldEventState;
}

function hasTag(ctx, id) {
  return ctxHasTag(ctx, id);
}

function haystack(ctx) {
  return [
    ...(ctx.tags || []),
    ...(ctx.currentTags || []),
    ...(ctx.settlementTags || []),
    ...(ctx.character?.tags || []),
  ];
}

function seasonalDisasterFrom(ctx) {
  const tags = haystack(ctx);
  if (tags.some((tag) => SEASONAL_ENV_NEEDLES.some((needle) => String(tag).includes(needle)))) {
    return true;
  }
  return (ctx.settlementTags || []).some((tag) => DISASTER_TAGS.includes(tag) && tag !== "戰亂區")
    && tags.some((tag) => String(tag).includes("monsoon") || String(tag).includes("extreme"));
}

function shockMatches(row, ctx) {
  const year = ctx.year;
  if (year < row.years[0] || year > row.years[1]) return false;
  if (row.regions && !row.regions.includes(ctx.region)) return false;
  if (row.countriesAny && !row.countriesAny.some((item) => (ctx.country || "").includes(item))) return false;
  if (row.kinds && !row.kinds.includes(ctx.kind)) return false;
  if (row.settlementIds && !row.settlementIds.includes(ctx.cityId)) return false;
  if (row.tagsAny) {
    const hay = [...(ctx.settlementTags || []), ...(ctx.tags || [])];
    if (!row.tagsAny.some((tag) => hay.includes(tag))) return false;
  }
  if (row.classes && !row.classes.includes(ctx.familyClassId)) return false;
  return true;
}

export function activeHistoryShocks(ctx) {
  const state = ctx.character?.historyState;
  return MORTALITY_HISTORY.filter((row) => {
    const filtered = filterShockRow(row, state, ctx.year);
    if (!filtered.active) return false;
    return shockMatches(filtered.row, ctx);
  }).map((row) => {
    const filtered = filterShockRow(row, state, ctx.year);
    return filtered.row;
  });
}

export function attachWorldContext(ctx) {
  const character = ctx.character || {};
  const settlement = ctx.settlement || {};
  const kind = settlement.kind || character.settlementKind || "city";
  const settlementTags = settlement.tags || character.settlementTags || [];
  const climate = settlement.climate || character.climate || "temperate";
  const year = ctx.year ?? ctx.time?.year;
  const country = getSettlementCountry(settlement, year) || character.country || settlement.country || "";
  const cityId = character.cityId || settlement.id || "";
  const region = ctx.region || character.region || settlement.region || "";
  const familyClassId = ctx.familyClassId || character.familyClassId || "worker";
  const seasonalDisaster = seasonalDisasterFrom(ctx);
  const geoBandBase = geoBandFor(kind, settlementTags, false).id;
  const geoBand = geoBandFor(kind, settlementTags, seasonalDisaster).id;
  const next = ctx;
  next.kind = kind;
  next.settlementTags = settlementTags;
  next.climate = climate;
  next.country = country;
  next.cityId = cityId;
  next.region = region;
  next.familyClassId = familyClassId;
  next.year = year;
  next.geoBand = geoBand;
  next.geoBandBase = geoBandBase;
  next.seasonalDisaster = seasonalDisaster;
  next.historyShocks = activeHistoryShocks(next);
  next.historyIds = next.historyShocks.map((row) => row.id);
  return next;
}

function geoBandAllowed(when, ctx) {
  const current = ctx.geoBand;
  const base = ctx.geoBandBase;
  if (when.geoBands) {
    const onlyDisaster = when.geoBands.length === 1 && when.geoBands[0] === "disaster";
    if (onlyDisaster) {
      if (current !== "disaster") return false;
    } else if (!when.geoBands.some((band) => band === current || band === base)) {
      return false;
    }
  }
  if (when.geoBandsNone) {
    if (when.geoBandsNone.includes(current) || when.geoBandsNone.includes(base)) return false;
  }
  return true;
}

export function eventMatches(incident, ctx) {
  const when = incident.when || {};
  const age = ctx.ageYears ?? 0;
  if (when.age && (age < when.age[0] || age > when.age[1])) return false;
  if (when.year && (ctx.year < when.year[0] || ctx.year > when.year[1])) return false;
  if (when.regions && !when.regions.includes(ctx.region)) return false;
  if (when.countriesAny) {
    if (!when.countriesAny.some((item) => (ctx.country || "").includes(item))) return false;
  }
  if (when.settlementIds && !when.settlementIds.includes(ctx.cityId)) return false;
  if (when.settlementKinds && !when.settlementKinds.includes(ctx.kind)) return false;
  if (!geoBandAllowed(when, ctx)) return false;
  if (when.climates && !when.climates.includes(ctx.climate)) return false;
  if (when.envTagsAny) {
    const hay = haystack(ctx);
    if (!when.envTagsAny.some((tag) => hay.includes(tag))) return false;
  }
  if (when.historyIds) {
    const active = new Set(ctx.historyIds || []);
    if (!when.historyIds.some((id) => active.has(id))) return false;
  }
  if (when.classes && !when.classes.includes(ctx.familyClassId)) return false;
  if (when.tagsAny || when.tagPrefixesAny) {
    const tagHit = when.tagsAny?.some((tag) => hasTag(ctx, tag));
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
  if (when.tagsAll && !when.tagsAll.every((tag) => hasTag(ctx, tag))) return false;
  if (when.tagsNone && when.tagsNone.some((tag) => hasTag(ctx, tag))) return false;
  if (!eraPlaceAllows(incident, ctx)) return false;
  return incidentAllowed(incident, ctx);
}

export function worldCrisisChance(ctx) {
  attachWorldContext(ctx);
  attachUpheaval(ctx);
  const age = ctx.ageYears ?? 0;
  if (age < 5) return 0;
  let p = 0.05;
  if (ctx.geoBand === "warzone" || ctx.geoBandBase === "warzone") p += 0.2;
  if (ctx.geoBand === "slum" || ctx.geoBandBase === "slum" || ctx.geoBand === "camp" || ctx.geoBandBase === "camp") p += 0.1;
  if (ctx.geoBand === "disaster") p += 0.16;
  if (ctx.geoBand === "arctic" || ctx.geoBandBase === "arctic") p += 0.08;
  if ((ctx.historyIds || []).length) p += 0.11;
  const tags = ctx.tags || [];
  if (tags.some((tag) => tag.startsWith("world_stray") || tag.startsWith("world_famine") || tag.startsWith("household_"))) {
    p += 0.07;
  }
  if ((ctx.character?.worldEventState?.pressure || 0) >= 18) p += 0.06;
  const era = Number(ctx.eraCrisis?.score || 0);
  if (era >= 22) p += 0.08;
  if (era >= 36) p += 0.1;
  const tier = ctx.upheaval?.tier || 0;
  if (tier) p += 0.04 * tier;
  const cap = tier >= 2 ? 0.52 : 0.42;
  return Math.min(cap, p);
}

export function worldSceneChance(ctx) {
  attachWorldContext(ctx);
  const age = ctx.ageYears ?? 0;
  if (age < 5) return 0;
  let p = 0.1;
  if (ctx.geoBand === "ordinary" || ctx.geoBand === "affluent_safe" || ctx.geoBandBase === "affluent_safe") p += 0.04;
  if ((ctx.tags || []).some((tag) => tag.startsWith("world_"))) p += 0.04;
  return Math.min(0.26, p);
}

export function pickWorldEvent(rng, ctx, { lock = null } = {}) {
  attachWorldContext(ctx);
  const age = ctx.ageYears ?? 0;
  if (age < 5) return null;
  const p = lock === "crisis" ? worldCrisisChance(ctx) : worldSceneChance(ctx);
  if (!chance(rng, p)) return null;
  const pool = WORLD_EVENTS.filter((incident) => {
    if (lock && incident.lock !== lock) return false;
    return eventMatches(incident, ctx);
  });
  if (!pool.length) return null;
  const state = ctx.character ? ensureWorldEventState(ctx.character) : null;
  const cooled = filterCooledPool(pool, ctx.character, (incident) => ({
    id: incident.id,
    outline: eventOutline("world", incident.kind, (incident.threads || [])[0] || incident.lock),
  }), ctx);
  const fresh = cooled.filter((incident) => incident.id !== state?.lastIncidentId);
  const source = fresh.length ? fresh : cooled;
  return pickWeighted(rng, source, (incident) => {
    let weight = incident.weight ?? 1;
    const when = incident.when || {};
    if (when.settlementIds?.includes(ctx.cityId)) weight *= 3.2;
    if (when.geoBands?.includes(ctx.geoBand)) weight *= 1.8;
    if (when.historyIds?.some((id) => (ctx.historyIds || []).includes(id))) weight *= 1.7;
    if (incident.kind === "dark" && (ctx.ledger?.heat || 0) >= 20) weight *= 1.25;
    if (incident.kind === "household" && (ctx.tags || []).some((tag) => tag.startsWith("household_"))) weight *= 1.6;
    const threads = incident.threads || [];
    const liveThreads = ctx.upheaval?.threads || [];
    if (threads.some((thread) => liveThreads.includes(thread))) weight *= 2.1;
    if ((ctx.upheaval?.tier || 0) >= 2 && (incident.kind === "historical" || incident.lock === "crisis")) weight *= 1.35;
    const constitution = ctx.constitution || ctx.character?.constitution;
    const minority = Boolean(constitution?.minority || constitution?.mixed)
      || (ctx.tags || []).some((tag) => String(tag).startsWith("ethnicity_") || tag === "lineage_mixed");
    if (minority && threads.some((thread) => ["conscription", "flight", "purge"].includes(thread))) weight *= 1.4;
    const band = socialStanding(ctx.ledger || ctx.character?.ledger || {}).band;
    if ((band === "feared" || band === "shunned") && incident.kind === "historical") weight *= 1.12;
    return weight;
  });
}

export function renderWorldEvent(incident, ctx = null, rng = null) {
  if (!incident) return "";
  const roll = typeof rng === "function" ? rng : (() => 0.41);
  const system = composeWorldBeat(roll, incident, ctx || {});
  if (!ctx) return system;
  return attachNpcSpeech(system, ctx, {
    ...incident,
    worldEvent: true,
    worldKind: incident.kind,
    worldEventId: incident.id,
  }, rng);
}

export function stampWorldTags(character, ids = []) {
  const applied = [];
  for (const id of ids) {
    if (!id || !String(id).startsWith("world_")) continue;
    const def = WORLD_TAG_INDEX[id];
    if (!def) {
      addCharacterTag(character, { id, label: id, source: "world", category: "world" });
      applied.push(id);
      continue;
    }
    addCharacterTag(character, {
      id: def.id,
      category: "world",
      label: def.label,
      source: "world",
      reason: def.reason,
      hooks: def.hooks || [],
      advantageIn: def.advantageIn || [],
      strainIn: def.strainIn || [],
      valence: "contextual",
    });
    applied.push(id);
  }
  return applied;
}

function pressureDelta(option, incidentKind) {
  if (option.pressureDelta != null) return option.pressureDelta;
  if (option.dark || option.perpetrator) return 12;
  if (incidentKind === "survival" || incidentKind === "historical") return 8;
  if (incidentKind === "dark") return 10;
  if (incidentKind === "household") return 6;
  return 2;
}

export function applyWorldEventChoice(character, option, time = {}, rng = null) {
  if (!character || !option?.worldEvent) {
    return { applied: [], notes: [], pressureDelta: 0, ending: null };
  }
  const state = ensureWorldEventState(character);
  const applied = stampWorldTags(character, option.addTags || []);
  const dark = Boolean(option.dark || option.perpetrator);
  const delta = pressureDelta(option, option.worldKind);
  state.pressure = Math.min(100, Math.max(0, state.pressure + delta));
  state.lastIncidentId = option.worldEventId || null;
  state.lastStance = option.stance || null;
  state.lastKind = option.worldKind || null;
  state.log.push({
    year: time.year ?? null,
    iso: time.iso ?? null,
    incident: option.worldEventId,
    kind: option.worldKind,
    stance: option.stance,
    dark,
    tags: (option.addTags || []).slice(),
  });
  if (state.log.length > 48) state.log.splice(0, state.log.length - 48);

  const notes = [];
  if (dark) {
    notes.push("這一週的選擇會在後面的日子裡繼續要價。");
  }
  let ending = null;
  if (option.ending?.reason && (option.ending.force || (option.ending.chance && rng && rng() < option.ending.chance))) {
    ending = { reason: option.ending.reason, detail: option.ending.detail, destructive: true };
  }
  return { applied, notes, pressureDelta: delta, dark, pressure: state.pressure, ending };
}

export function weeklyWorldEventFallout(rng, character, time = {}) {
  const state = character?.worldEventState;
  if (!state) return { notes: [], addTags: [], effects: {}, ending: null, consequence: null };
  const tags = character.tags || [];
  const notes = [];
  const addTags = [];
  const effects = {};
  let consequence = null;
  const ending = null;

  state.pressure = Math.max(0, Math.round(state.pressure * 0.9) - 1);

  if (tags.includes("world_stray_fire") && chance(rng, Math.min(0.16, 0.05 + state.pressure * 0.002))) {
    effects.health = (effects.health || 0) - 3;
    notes.push("流彈半徑按週續費：這一週又有一次必須貼牆的聲音。彈道不討論你是不是主角。");
  }
  if (tags.includes("world_famine_witness") && chance(rng, 0.14)) {
    effects.health = (effects.health || 0) - 3;
    effects.wealth = (effects.wealth || 0) - 1;
    notes.push("缺糧按週續費：胃與勞動同時掉件。饑荒不因為你已經看過一遍而結束。");
  }
  if ((tags.includes("world_plague_queue") || tags.includes("world_epidemic_mark")) && chance(rng, 0.12)) {
    effects.health = (effects.health || 0) - 2;
    notes.push("疫季隊列的接觸面還在。體溫與缺席比心情先到。");
  }
  if (tags.includes("world_slum_tax") && chance(rng, 0.14)) {
    effects.wealth = (effects.wealth || 0) - 1;
    notes.push("巷稅又到期。沒有收據。");
  }
  if (tags.includes("world_arctic_exposure") && chance(rng, 0.14)) {
    effects.health = (effects.health || 0) - 3;
    notes.push("極地暴露按週折舊：風與燃料缺口比性格耐久。");
  }
  if (tags.includes("world_heat_exposure") && chance(rng, 0.12)) {
    effects.health = (effects.health || 0) - 2;
    notes.push("熱浪的生理帳還沒結。陰涼不是戶籍福利。");
  }
  if (tags.includes("world_street_lookout") && chance(rng, 0.16)) {
    consequence = { heat: 4, infamy: 2, trust: -2, path: "crime", pathXp: 1, eventLabel: "看場被點名" };
    notes.push("看場的眼睛被兩邊使用。這一週有人問起你昨晚站在哪。");
  }
  if (tags.includes("world_looter") && chance(rng, 0.12)) {
    consequence = {
      ...(consequence || {}),
      heat: (consequence?.heat || 0) + 4,
      infamy: (consequence?.infamy || 0) + 2,
      trust: (consequence?.trust || 0) - 2,
      eventLabel: "災中伸手的利息",
    };
    notes.push("短少開始指向還能走路的人。你的手在傳聞裡出現。");
  }
  if (tags.includes("world_informant") && chance(rng, 0.14)) {
    consequence = {
      ...(consequence || {}),
      trust: (consequence?.trust || 0) - 4,
      heat: (consequence?.heat || 0) + 3,
      eventLabel: "交名回流",
    };
    notes.push("你交出去的名字開始在另一側流通。開口換通行的有效期很短。");
  }
  if (tags.includes("world_listed") && chance(rng, 0.1)) {
    effects.mood = (effects.mood || 0) - 2;
    effects.charm = (effects.charm || 0) - 1;
    notes.push("名單或大字報這一週又被唸到。被點名是位置，不是心情。");
  }

  return { notes, addTags, effects, ending, consequence, pressure: state.pressure };
}

export function modifyResolutionForWorld(character, option, effects, texts) {
  const records = (character?.tagRecords || []).filter((item) => (
    item.category === "world" || (item.id || "").startsWith("world_")
  ));
  if (!records.length) return { effects, extraRisk: 0 };
  const hooks = option.hooks || [];
  const next = { ...effects };
  let extraRisk = 0;
  const strained = records.some((item) => (item.strainIn || []).some((hook) => hooks.includes(hook)));
  const famine = records.some((item) => item.id === "world_famine_witness");
  const listed = records.some((item) => item.id === "world_listed" || item.id === "world_informant");

  if (strained && option.worldEvent) extraRisk += 0.05;
  if (famine && (hooks.includes("survival") || hooks.includes("hunger") || hooks.includes("health"))) {
    extraRisk += 0.08;
    if (next.health > 0) next.health = Math.max(0, next.health - 1);
  }
  if (listed && (hooks.includes("official") || hooks.includes("politics"))) {
    extraRisk += 0.08;
    texts.push("名冊先被打開，還沒輪到你解釋。能領的糧、能走的門變少了。");
  }
  const tags = character.tags || [];
  const minority = Boolean(character.constitution?.minority || character.constitution?.mixed)
    || tags.some((tag) => String(tag).startsWith("ethnicity_") || tag === "lineage_mixed" || tag === "socio_war_displacement");
  if (minority && option.worldEvent && (hooks.includes("official") || hooks.includes("war") || hooks.includes("politics") || hooks.includes("travel"))) {
    extraRisk += 0.07;
    texts.push("出身或口音在這一週的關卡上先於你的解釋被打開。");
  }
  if (option.worldEvent && (option.dark || option.perpetrator) && next.charm > 0) {
    next.charm = Math.max(0, next.charm - 1);
  }
  return { effects: next, extraRisk };
}

export { WORLD_EVENTS, WORLD_TAG_INDEX, WORLD_STANCE_NOTE, WORLD_COST_NOTE };
