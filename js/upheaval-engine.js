/**
 * Year-aligned social upheaval engine.
 * Raises crisis coefficients and records threads (draft, layoff, fx, flight).
 * Does not print hidden reputation scores. Butterfly-suppressed history ids stay dark.
 */

import { SOCIAL_UPHEAVALS, upheavalTier } from "./data/social-upheaval.js";
import { getActiveHistory } from "./data.js";
import { narrativePulseAllowed } from "./history-engine.js";
import { ctxHasTag } from "./choice-pool.js";
import { chance } from "./rng.js";
import { applyLedgerDeltas, ensureLedger } from "./ledger.js";
import { ensureConstitution } from "./constitution.js";

function emptyUpheaval() {
  return {
    id: null,
    label: "",
    threads: [],
    score: 0,
    tier: 0,
    heat: 0,
    trust: 0,
    worldPressure: 0,
    crisisBoost: 0,
    matches: [],
  };
}

export function emptyUpheavalState() {
  return {
    id: null,
    label: "",
    threads: [],
    score: 0,
    tier: 0,
    lastYear: null,
  };
}

export function ensureUpheavalState(character) {
  if (!character.upheavalState) character.upheavalState = emptyUpheavalState();
  return character.upheavalState;
}

function countryOf(ctx) {
  return String(ctx.country || ctx.character?.country || "");
}

function narrativeHits(row, ctx) {
  if (!row.narrativeIds?.length) return false;
  const year = ctx.year ?? ctx.time?.year;
  const week = ctx.week ?? ctx.time?.week ?? 1;
  const region = ctx.region || ctx.character?.region;
  const pulses = getActiveHistory(year, week, region);
  const historyState = ctx.character?.historyState;
  return row.narrativeIds.some((id) => (
    pulses.some((pulse) => pulse.id === id)
    && narrativePulseAllowed(id, historyState)
  ));
}

function historyHits(row, ctx) {
  if (!row.historyIds?.length) return false;
  const active = new Set(ctx.historyIds || []);
  return row.historyIds.some((id) => active.has(id));
}

export function upheavalRowMatches(row, ctx = {}) {
  const year = ctx.year ?? ctx.time?.year;
  if (year == null || year < row.years[0] || year > row.years[1]) return false;
  if (row.regions && !row.regions.includes(ctx.region || ctx.character?.region)) return false;
  if (row.countriesAny && !row.countriesAny.some((item) => countryOf(ctx).includes(item))) return false;

  if (row.historyIds?.length) {
    if (ctx.historyIds) return historyHits(row, ctx);
    return narrativeHits(row, ctx);
  }
  if (row.narrativeIds?.length) return narrativeHits(row, ctx);
  return true;
}

export function evaluateUpheaval(ctx = {}) {
  const matches = SOCIAL_UPHEAVALS.filter((row) => upheavalRowMatches(row, ctx));
  if (!matches.length) return emptyUpheaval();

  let score = 0;
  let heat = 0;
  let trust = 0;
  let worldPressure = 0;
  let crisisBoost = 0;
  const threads = [];
  let top = matches[0];
  for (const row of matches) {
    if (row.score >= score) {
      score = row.score;
      top = row;
    }
    heat = Math.max(heat, row.heat);
    trust = Math.min(trust, row.trust);
    worldPressure = Math.max(worldPressure, row.worldPressure);
    crisisBoost = Math.max(crisisBoost, row.crisisBoost);
    for (const thread of row.threads) {
      if (!threads.includes(thread)) threads.push(thread);
    }
  }

  return {
    id: top.id,
    label: top.label,
    threads,
    score,
    tier: upheavalTier(score),
    heat,
    trust,
    worldPressure,
    crisisBoost,
    matches: matches.map((row) => row.id),
  };
}

export function publicUpheavalView(snap) {
  if (!snap?.id) return null;
  return {
    id: snap.id,
    label: snap.label,
    threads: (snap.threads || []).slice(),
    tier: snap.tier || 0,
  };
}

export function attachUpheaval(ctx) {
  if (!ctx) return emptyUpheaval();
  const snap = evaluateUpheaval(ctx);
  ctx.upheaval = snap;
  ctx.upheavalTier = snap.tier;
  const character = ctx.character;
  if (character) {
    const state = ensureUpheavalState(character);
    state.id = snap.id;
    state.label = snap.label;
    state.threads = snap.threads.slice();
    state.score = snap.score;
    state.tier = snap.tier;
    state.lastYear = ctx.year ?? ctx.time?.year ?? state.lastYear;
  }
  return snap;
}

function minorityAtRisk(ctx, snap) {
  const character = ctx.character;
  const constitution = character?.constitution || ctx.constitution || ensureConstitution(character, ctx.settlement, ctx.year);
  const tagged = ctxHasTag(ctx, "lineage_mixed")
    || ctxHasTag(ctx, "socio_war_displacement")
    || ctxHasTag(ctx, "world_listed")
    || (ctx.tags || []).some((tag) => String(tag).startsWith("ethnicity_"));
  const hot = (snap.threads || []).some((thread) => ["conscription", "flight", "purge", "war"].includes(thread));
  return Boolean((constitution?.minority || constitution?.mixed || tagged) && hot);
}

export function weeklyUpheavalTick(rng, character, ctx = {}) {
  if (!character) return { notes: [], consequence: null, pressureDelta: 0 };
  const nextCtx = {
    ...ctx,
    character,
    year: ctx.year ?? ctx.time?.year,
    week: ctx.week ?? ctx.time?.week,
    region: ctx.region || character.region,
    country: ctx.country || character.country,
    tags: ctx.tags || character.tags || [],
    historyIds: ctx.historyIds,
  };
  const snap = attachUpheaval(nextCtx);
  if (!snap.id || snap.tier < 1) {
    return { notes: [], consequence: null, pressureDelta: 0, upheaval: publicUpheavalView(snap) };
  }

  const ledger = ensureLedger(character);
  if (!character.worldEventState) {
    character.worldEventState = { pressure: 0, lastIncidentId: null, lastStance: null, lastKind: null, log: [] };
  }
  const world = character.worldEventState;
  const notes = [];
  const consequence = { heat: 0, trust: 0, eventLabel: snap.label };
  const heatCap = 18 + snap.tier * 8;
  const trustFloor = 22;
  const othered = minorityAtRisk(nextCtx, snap);

  if (ledger.heat < heatCap && chance(rng, snap.tier >= 2 ? 0.42 : 0.28)) {
    consequence.heat += 1;
  }
  if (othered && ledger.heat < heatCap + 6 && chance(rng, 0.22)) {
    consequence.heat += 1;
  }
  if ((ledger.trust ?? 50) > trustFloor && chance(rng, 0.24)) {
    consequence.trust += snap.trust < 0 ? -1 : 0;
  }

  const pressureTarget = Math.min(48, snap.worldPressure * 2);
  let pressureDelta = 0;
  if (world.pressure < pressureTarget && chance(rng, 0.4 + snap.tier * 0.08)) {
    pressureDelta = snap.tier >= 3 ? 2 : 1;
    world.pressure = Math.min(100, world.pressure + pressureDelta);
  }

  if (consequence.heat || consequence.trust) {
    applyLedgerDeltas(ledger, consequence, ctx.time || ctx, snap.label);
  }

  if (snap.tier >= 2) {
    notes.push(`時局是${snap.label}。街上的規則比平常更硬，證件與排隊先於解釋。`);
  } else if (chance(rng, 0.35)) {
    notes.push(`大環境仍是${snap.label}。物價、口令或工作的口徑都比上月緊。`);
  }
  if (othered && snap.tier >= 2 && chance(rng, 0.4)) {
    notes.push("口音、出身或紙在這一週的關卡上比你的解釋先被打開。");
  }

  return {
    notes,
    consequence: (consequence.heat || consequence.trust) ? consequence : null,
    pressureDelta,
    upheaval: publicUpheavalView(snap),
  };
}

export { SOCIAL_UPHEAVALS, upheavalTier };
