/**
 * Sanity tracker and forced mental-collapse lock.
 * Thresholds are mechanical. Recovery is not a weekly gift.
 */

import { BREAKDOWN_INCIDENTS } from "./data/breakdown-incidents.js";
import { composeBreakdownBeat } from "./dynamic-prose.js";
import { incidentAllowed } from "./age-gate.js";
import { filterCooledPool } from "./event-memory.js";
import { pickWeighted } from "./rng.js";

export const SANITY_DANGER = 18;
export const SANITY_CRITICAL = 12;
export const SANITY_REBREAK = 8;
export const TRAUMA_INTENSITY_BREAK = 22;
export const BREAKDOWN_COOLDOWN_TURNS = 24;

export const BREAKDOWN_TAG_IDS = Object.freeze([
  "trauma_ptsd",
  "trauma_melancholia",
  "trauma_persecution",
  "trauma_persona_crack",
]);

export function emptyBreakdownState() {
  return {
    pending: false,
    lastTurn: -999,
    episodes: 0,
    lowStreak: 0,
    lastIncidentId: null,
    tags: [],
  };
}

export function ensureBreakdownState(character) {
  if (!character.breakdownState) character.breakdownState = emptyBreakdownState();
  const state = character.breakdownState;
  if (state.pending == null) state.pending = false;
  if (state.lastTurn == null) state.lastTurn = -999;
  if (state.episodes == null) state.episodes = 0;
  if (state.lowStreak == null) state.lowStreak = 0;
  if (!Array.isArray(state.tags)) state.tags = [];
  return state;
}

export function sanityOf(character) {
  return Number(character?.stats?.sanity ?? character?.stats?.mood ?? 50);
}

function traumaIntensityOf(character) {
  return Number(character?.traumaState?.intensity || 0);
}

function crisisScoreOf(ctx = {}) {
  return Number(ctx.pressure?.score ?? ctx.eraCrisis?.score ?? 0);
}

function onCooldown(state, turnCount) {
  return Number(turnCount || 0) - Number(state.lastTurn || -999) < BREAKDOWN_COOLDOWN_TURNS;
}

export function tickSanityStreak(character) {
  const state = ensureBreakdownState(character);
  const sanity = sanityOf(character);
  if (sanity <= SANITY_DANGER) state.lowStreak = Math.min(48, (state.lowStreak || 0) + 1);
  else state.lowStreak = 0;
  return state.lowStreak;
}

export function shouldForceBreakdown(character, ctx = {}) {
  if (!character) return false;
  const state = ensureBreakdownState(character);
  const sanity = sanityOf(character);
  const intensity = traumaIntensityOf(character);
  const turnCount = ctx.turnCount ?? ctx.character?.turnCount ?? 0;
  const cooling = onCooldown(state, turnCount);
  if (sanity <= SANITY_REBREAK) return true;
  if (state.pending && !cooling) return true;
  if (cooling) return false;
  if (sanity <= SANITY_CRITICAL) return true;
  if (sanity <= SANITY_DANGER && (
    intensity >= TRAUMA_INTENSITY_BREAK
    || crisisScoreOf(ctx) >= 48
    || (state.lowStreak || 0) >= 2
  )) {
    return true;
  }
  return false;
}

export function armBreakdownIfNeeded(character, ctx = {}) {
  const state = ensureBreakdownState(character);
  tickSanityStreak(character);
  if (shouldForceBreakdown(character, ctx)) state.pending = true;
  return state;
}

export function consumeBreakdownLock(character, incident = null, turnCount = 0) {
  const state = ensureBreakdownState(character);
  state.pending = false;
  state.lastTurn = Number(turnCount || 0);
  if (incident?.id) state.lastIncidentId = incident.id;
  return state;
}

function incidentMatches(incident, ctx = {}) {
  const age = ctx.ageYears ?? 0;
  const year = ctx.year ?? ctx.time?.year ?? 1920;
  const when = incident.when || {};
  if (when.age && (age < when.age[0] || age > when.age[1])) return false;
  if (when.year && (year < when.year[0] || year > when.year[1])) return false;
  return incidentAllowed(incident, ctx);
}

export function pickBreakdownIncident(rng, ctx = {}) {
  const character = ctx.character;
  if (!character || !shouldForceBreakdown(character, ctx)) return null;
  const pool = BREAKDOWN_INCIDENTS.filter((incident) => incidentMatches(incident, ctx));
  if (!pool.length) return null;
  const cooled = filterCooledPool(pool, character, (incident) => ({
    id: incident.id,
    outline: `breakdown:${incident.kind}`,
  }), ctx);
  const state = ensureBreakdownState(character);
  const fresh = cooled.filter((incident) => incident.id !== state.lastIncidentId);
  const source = fresh.length ? fresh : (cooled.length ? cooled : pool);
  const picked = pickWeighted(rng, source, (incident) => {
    let weight = incident.weight ?? 1;
    const sanity = sanityOf(character);
    if (sanity <= SANITY_CRITICAL) weight *= 1.35;
    if ((character.traumaState?.intensity || 0) >= 32) weight *= 1.15;
    return weight;
  });
  return picked || null;
}

export function renderBreakdownIncident(incident, ctx = null, rng = null) {
  return composeBreakdownBeat(typeof rng === "function" ? rng : (() => 0.31), incident, ctx || {});
}

export function applyBreakdownChoice(character, option, time = {}) {
  if (!character || !option?.breakdownIncident) {
    return { applied: [], notes: [], tags: [] };
  }
  const state = ensureBreakdownState(character);
  state.episodes = (state.episodes || 0) + 1;
  state.pending = false;
  state.lastTurn = Number(time.turnCount ?? time.turn ?? state.lastTurn ?? 0);
  const tags = [...new Set(option.trauma?.tags || option.addTags || [])]
    .filter((id) => String(id || "").startsWith("trauma_"));
  for (const id of tags) {
    if (!state.tags.includes(id)) state.tags.push(id);
  }
  return {
    applied: tags.map((id) => ({ id })),
    notes: ["神智在這一週先垮了。留下來的不是脾氣，是以後都會跟著走的傷。"],
    tags,
    episodes: state.episodes,
  };
}

export function weeklySanityCrisis(character, ctx = {}) {
  const sanity = sanityOf(character);
  const era = Number(ctx.eraCrisis?.score || 0);
  const pressure = Number(ctx.pressure?.score || 0);
  const intensity = traumaIntensityOf(character);
  let moodDelta = 0;
  const notes = [];
  if (era >= 22) {
    moodDelta -= 1;
    notes.push("時代的壓力按週扣神智，沒有人替你擋。");
  }
  if (era >= 36 || pressure >= 70) {
    moodDelta -= 1;
  }
  if (intensity >= 28 && sanity <= 28) {
    moodDelta -= 1;
  }
  if (!moodDelta) return { moodDelta: 0, note: "" };
  return {
    moodDelta,
    note: notes[0] || "這一週的驚嚇、短缺或清算把神智往下按。",
  };
}

export function hasBreakdownScar(character) {
  const tags = character?.tags || [];
  return BREAKDOWN_TAG_IDS.some((id) => tags.includes(id))
    || (character?.breakdownState?.episodes || 0) > 0;
}

export { BREAKDOWN_INCIDENTS };
