/**
 * School incident engine: pick a factual campus beat, expose three stances,
 * bill perpetrator tags and delayed fallout. Does not write the player's heart.
 */

import { SCHOOL_INCIDENTS } from "./data/school-incidents/catalog.js";
import { SCHOOL_CLIMATE_TAGS, SCHOOL_TAG_INDEX } from "./data/school-tags-database.js";
import { SCHOOL_COST_NOTE, SCHOOL_STANCE_NOTE } from "./data/school-dark-rules.js";
import { composeSchoolBeat } from "./dynamic-prose.js";
import { DAILY_AUDIENCE } from "./data/daily/schema.js";
import { addCharacterTag } from "./tag-system.js";
import { chance, pickWeighted } from "./rng.js";
import { attachNpcSpeech } from "./npc-voice.js";
import { ctxHasTag } from "./choice-pool.js";
import { incidentAllowed } from "./age-gate.js";
import { filterCooledPool } from "./event-memory.js";
import { progressAllowsIncident } from "./life-stage-manager.js";

const PERP_STANCES = new Set(["join", "lead", "retaliate", "plunder", "weapon"]);

export function emptySchoolState() {
  return {
    enmity: 0,
    heat: 0,
    lastIncidentId: null,
    lastStance: null,
    log: [],
  };
}

export function ensureSchoolState(character) {
  if (!character.schoolState) character.schoolState = emptySchoolState();
  return character.schoolState;
}

export function rollSchoolClimate(rng, settlementKind, familyClassId, chanceFn) {
  const roll = chanceFn || ((probability) => rng() < probability);
  const out = [];
  for (const row of SCHOOL_CLIMATE_TAGS) {
    const p = row.chance[settlementKind] ?? row.chance[familyClassId] ?? row.chance.default;
    if (roll(p)) out.push(row);
  }
  return out;
}

function audienceAllowed(audience, age) {
  if (age < 7 || age > 17) return false;
  if (!audience || audience === "span") return true;
  if (audience === "child_safe") return age >= 7 && age <= 12;
  if (audience === "teen") return age >= 13 && age <= 17;
  if (audience === "gray") return age >= 16 && age <= 17;
  const gate = DAILY_AUDIENCE[audience] || { minAge: 7, maxAge: 17 };
  return age >= gate.minAge && age <= gate.maxAge;
}

function hasTag(ctx, id) {
  return ctxHasTag(ctx, id);
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
  return incidentAllowed(incident, ctx);
}

export function schoolIncidentChance(ctx) {
  const age = ctx.ageYears ?? 0;
  if (age < 7 || age > 17) return 0;
  if (ctx.character?.socialPhase === "adult") return 0;
  const tags = ctx.tags || [];
  const climate = tags.some((tag) => tag === "school_climate_predatory" || tag.startsWith("school_"));
  const dailyId = ctx.character?.dailyState?.id || "";
  const onCampus = dailyId.startsWith("school") || age >= 7;
  if (!onCampus) return climate ? 0.08 : 0.03;
  if (climate) return 0.38;
  return 0.16;
}

export function pickSchoolIncident(rng, ctx) {
  const age = ctx.ageYears ?? 0;
  if (age < 7 || age > 17) return null;
  if (!progressAllowsIncident("school", ctx)) return null;
  if (!chance(rng, schoolIncidentChance(ctx))) return null;
  const pool = SCHOOL_INCIDENTS.filter((incident) => incidentMatches(incident, ctx));
  if (!pool.length) return null;
  const state = ctx.character ? ensureSchoolState(ctx.character) : null;
  const cooled = filterCooledPool(pool, ctx.character, (incident) => ({
    id: incident.id,
    outline: `school:${incident.kind}`,
  }), ctx);
  const fresh = cooled.filter((incident) => incident.id !== state?.lastIncidentId);
  const source = fresh.length ? fresh : cooled;
  return pickWeighted(rng, source, (incident) => {
    let weight = incident.weight ?? 1;
    if (incident.kind === "extreme") weight *= 0.85;
    if ((ctx.tags || []).includes("school_climate_predatory")) weight *= 1.25;
    if ((ctx.tags || []).includes("school_bully") && incident.kind === "gang") weight *= 1.35;
    if ((ctx.tags || []).includes("school_bullied") && incident.kind === "bullying") weight *= 1.2;
    if ((ctx.tags || []).includes("school_hated") && incident.kind === "extreme") weight *= 1.4;
    return weight;
  });
}

export function renderSchoolIncident(incident, ctx = null, rng = null) {
  if (!incident) return "";
  const body = composeSchoolBeat(typeof rng === "function" ? rng : (() => 0.37), incident, ctx || {});
  if (!ctx) return body;
  return attachNpcSpeech(body, ctx, {
    ...incident,
    schoolIncident: true,
    schoolIncidentId: incident.id,
    schoolKind: incident.kind,
  }, rng);
}

function addSchoolTag(character, id) {
  const def = SCHOOL_TAG_INDEX[id];
  if (!def) {
    return addCharacterTag(character, { id, label: id, source: "school", category: "school" });
  }
  return addCharacterTag(character, {
    id: def.id,
    category: "school",
    label: def.label,
    source: "school",
    reason: def.reason,
    hooks: def.hooks,
    valence: "contextual",
    advantageIn: def.advantageIn,
    strainIn: def.strainIn,
    temporary: false,
  });
}

export function stampSchoolTags(character, ids = []) {
  const applied = [];
  for (const id of [...new Set(ids || [])]) {
    if (!id || !String(id).startsWith("school_")) continue;
    if (addSchoolTag(character, id)) applied.push(id);
  }
  return applied;
}

export function applySchoolChoice(character, option, time = {}, rng = null) {
  if (!character || !option?.schoolIncident) {
    return { applied: [], notes: [], enmityDelta: 0, ending: null };
  }
  const state = ensureSchoolState(character);
  const applied = stampSchoolTags(character, option.addTags || []);
  const perp = Boolean(option.perpetrator || PERP_STANCES.has(option.stance));
  let enmityDelta = 0;
  if (perp) {
    enmityDelta = option.stance === "lead" || option.stance === "weapon" ? 14 : 8;
    state.heat = Math.min(100, state.heat + (option.stance === "weapon" ? 18 : 10));
  } else if (option.stance === "report") {
    enmityDelta = 6;
    state.heat = Math.min(100, state.heat + 4);
  } else if (option.addTags?.includes("school_bullied")) {
    enmityDelta = 2;
  }
  state.enmity = Math.min(100, state.enmity + enmityDelta);
  state.lastIncidentId = option.schoolIncidentId || null;
  state.lastStance = option.stance || null;
  state.log.push({
    year: time.year ?? null,
    iso: time.iso ?? null,
    incident: option.schoolIncidentId,
    stance: option.stance,
    perpetrator: perp,
    tags: (option.addTags || []).slice(),
  });
  if (state.log.length > 40) state.log.splice(0, state.log.length - 40);

  const notes = [];
  if (perp) {
    notes.push("這一週之後，有人開始用另一種眼神看你。帳不會自己消失。");
  }
  let ending = null;
  if (option.ending?.reason && (option.ending.force || (option.ending.chance && rng && rng() < option.ending.chance))) {
    ending = { reason: option.ending.reason, detail: option.ending.detail, destructive: true };
  }
  return { applied, notes, enmityDelta, perpetrator: perp, enmity: state.enmity, ending };
}

export function weeklySchoolFallout(rng, character, time = {}) {
  const state = character?.schoolState;
  if (!state) return { notes: [], addTags: [], effects: {}, ending: null, consequence: null };
  const tags = character.tags || [];
  const notes = [];
  const addTags = [];
  const effects = {};
  let consequence = null;
  let ending = null;

  state.heat = Math.max(0, Math.round(state.heat * 0.88) - 1);

  const bully = tags.includes("school_bully") || tags.includes("school_ringleader") || tags.includes("school_gang");
  const hated = tags.includes("school_hated") || state.enmity >= 18;
  const weapon = tags.includes("school_weapon");
  const age = time.ageYears ?? 0;

  if (bully && hated && chance(rng, Math.min(0.28, 0.08 + state.enmity * 0.002))) {
    effects.health = (effects.health || 0) - 4;
    effects.charm = (effects.charm || 0) - 1;
    notes.push("報復落地：有人帶人在校門或廁所等你。這是前幾週帳的利息，不是隨機倒霉。");
    state.enmity = Math.min(100, state.enmity + 2);
  }

  if (bully && state.heat >= 14 && chance(rng, 0.16)) {
    addTags.push("school_record");
    consequence = { trust: -3, opinion: -3, heat: 2, eventLabel: "校方處分" };
    notes.push("校方處分進檔：記過、約談家長或強制轉班程序啟動。");
  }

  if ((bully && state.enmity >= 42 && state.heat >= 22) || (weapon && state.heat >= 28)) {
    if (!tags.includes("school_expelled") && chance(rng, 0.14)) {
      addTags.push("school_expelled");
      addTags.push("school_record");
      if (character.education && character.education !== "none") {
        notes.push("學籍被切斷：退學或勒令離開。出路變窄。");
      }
      consequence = {
        ...(consequence || {}),
        trust: -8,
        opinion: -6,
        infamy: 6,
        heat: 6,
        eventLabel: "退學",
      };
    }
  }

  if (weapon && age >= 16 && chance(rng, 0.12)) {
    consequence = {
      ...(consequence || {}),
      wanted: 10,
      heat: 12,
      infamy: 8,
      trust: -10,
      path: "crime",
      pathXp: 1,
      eventLabel: "校園攜械法辦",
    };
    notes.push("法律制裁啟動：警察到校或傳喚。攜械不是校規題，是刑事案件。");
  }

  if (weapon && age >= 16 && (character.ledger?.wanted || 0) >= 55 && chance(rng, 0.08)) {
    ending = {
      reason: "校園案件收押",
      detail: "攜械與傷害的帳簿疊到足以收押。成長期在看守所門口結束。",
    };
  }

  if (!bully && tags.includes("school_bullied") && chance(rng, 0.1)) {
    effects.health = (effects.health || 0) - 2;
    notes.push("同一批人這一週又找到你。長期群體傷害按週續費，不需要新的理由。");
  }

  return { notes, addTags, effects, ending, consequence, enmity: state.enmity };
}

export function modifyResolutionForSchool(character, option, effects, texts) {
  const records = (character?.tagRecords || []).filter((item) => item.category === "school" || (item.id || "").startsWith("school_"));
  if (!records.length) return { effects, extraRisk: 0 };
  const hooks = option.hooks || [];
  const next = { ...effects };
  let extraRisk = 0;
  const hated = records.some((item) => item.id === "school_hated");
  const record = records.some((item) => item.id === "school_record" || item.id === "school_expelled");
  const strained = records.some((item) => (item.strainIn || []).some((hook) => hooks.includes(hook)));

  if (strained && option.schoolIncident) {
    extraRisk += 0.05;
  }
  if (hated && (hooks.includes("school") || hooks.includes("social") || option.schoolIncident)) {
    extraRisk += 0.1;
    if (next.charm > 0) next.charm = Math.max(0, next.charm - 1);
  }
  if (record && hooks.includes("official")) {
    extraRisk += 0.08;
    texts.push("處分紀錄先被拿出來給人看。這次能少挨的罰、能過的門變少了。");
  }
  return { effects: next, extraRisk };
}

export { SCHOOL_INCIDENTS, SCHOOL_TAG_INDEX, SCHOOL_COST_NOTE, SCHOOL_STANCE_NOTE };
