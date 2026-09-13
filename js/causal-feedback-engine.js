/**
 * Causal Feedback Loop — early choices & tags reshape later macro exposure.
 * Does not invent parallel timelines; biases personal shock weight + NPC climate,
 * and can intensify / soften still-active history shocks via shockOverrides.
 */

import { ensureHistoryState } from "./history-engine.js";
import { ensureNpcNetwork } from "./npc-social-engine.js";
import { IMPACT_TAG_TILTS } from "./data/world-industry-impact.js";

const ECHO_LIMIT = 64;
const THREADS = Object.freeze([
  "war",
  "conscription",
  "unemployment",
  "devaluation",
  "flight",
  "purge",
]);

const TAG_THREAD_SEEDS = Object.freeze({
  persona_high_roller: { devaluation: 0.18, unemployment: 0.08 },
  persona_quit_ahead: { devaluation: 0.12, unemployment: 0.06 },
  persona_hardy: { unemployment: -0.1, war: -0.06, flight: -0.05 },
  persona_absolute_freedom: { unemployment: 0.1, flight: 0.08, purge: -0.05 },
  persona_banana_legend: { unemployment: 0.08, devaluation: 0.06 },
  persona_meme_dancer: { unemployment: 0.07, devaluation: 0.05 },
  persona_aniki_wrestle: { war: -0.08, conscription: -0.05 },
  persona_loyal_bond: { war: -0.05, purge: -0.04 },
  persona_shimokita_labor: { unemployment: -0.08 },
  persona_beast_senpai: { unemployment: 0.05, purge: 0.04 },
  world_informant: { purge: 0.12, war: 0.06 },
  world_mass_layoff: { unemployment: 0.14 },
  world_devaluation: { devaluation: 0.14 },
  world_ride_wave: { devaluation: 0.06, unemployment: 0.04 },
  world_shock_scar: { unemployment: 0.1, war: 0.08, flight: 0.08 },
});

const STANCE_THREAD_DELTA = Object.freeze({
  ride_wave: { devaluation: 0.1, unemployment: 0.08 },
  hustle: { unemployment: 0.06, devaluation: 0.04 },
  cut_loss: { unemployment: -0.05, devaluation: -0.04, flight: 0.06 },
  endure: { unemployment: -0.03, war: -0.02 },
  flee: { flight: 0.1, war: 0.04 },
  resist: { purge: 0.06, war: 0.05 },
  name: { purge: 0.12 },
  convert: { devaluation: 0.08 },
  guard: { war: -0.03, flight: -0.02 },
});

export function emptyCausalState() {
  return {
    threadBias: Object.fromEntries(THREADS.map((t) => [t, 0])),
    npcClimate: 0,
    rideWaveXp: 0,
    survivorXp: 0,
    echoes: [],
    lastEchoYear: null,
  };
}

export function ensureCausalState(character) {
  if (!character) return emptyCausalState();
  if (!character.causalState) character.causalState = emptyCausalState();
  const state = character.causalState;
  if (!state.threadBias) state.threadBias = Object.fromEntries(THREADS.map((t) => [t, 0]));
  if (!Array.isArray(state.echoes)) state.echoes = [];
  if (state.npcClimate == null) state.npcClimate = 0;
  if (state.rideWaveXp == null) state.rideWaveXp = 0;
  if (state.survivorXp == null) state.survivorXp = 0;
  return state;
}

function clampBias(value) {
  return Math.max(-0.85, Math.min(0.95, Number(value) || 0));
}

function bumpThread(state, thread, delta) {
  if (!THREADS.includes(thread)) return;
  state.threadBias[thread] = clampBias((state.threadBias[thread] || 0) + delta);
}

function liveTagIds(character = {}) {
  const fromRecords = (character.tagRecords || []).map((row) => row.id).filter(Boolean);
  return [...new Set([
    ...(character.tags || []),
    ...fromRecords,
    ...(character.permanentTagIds || []),
  ].map(String).filter(Boolean))];
}

/** Recompute soft bias from permanent + live tags (idempotent weekly refresh). */
export function refreshCausalTagBias(character) {
  const state = ensureCausalState(character);
  const tags = new Set(liveTagIds(character));
  const next = Object.fromEntries(THREADS.map((t) => [t, 0]));
  for (const [tag, deltas] of Object.entries(TAG_THREAD_SEEDS)) {
    if (!tags.has(tag)) continue;
    for (const [thread, delta] of Object.entries(deltas)) {
      next[thread] = (next[thread] || 0) + delta;
    }
  }
  for (const rule of IMPACT_TAG_TILTS) {
    if (!rule.tags.some((tag) => tags.has(tag))) continue;
    const sign = rule.tilt === "harm" ? 0.08 : rule.tilt === "shield" ? -0.06 : 0.07;
    for (const thread of rule.threads) {
      next[thread] = (next[thread] || 0) + sign * (rule.weight || 1);
    }
  }
  // Blend: keep 55% echo-learned bias, 45% tag seed.
  for (const thread of THREADS) {
    const learned = state.threadBias[thread] || 0;
    state.threadBias[thread] = clampBias(learned * 0.55 + (next[thread] || 0) * 0.45);
  }
  return state;
}

/**
 * Record a player choice into the causal loop (world / high-stakes only).
 * Mutates NPC affection climate so decade-later shocks meet a different street.
 */
export function recordCausalEcho(character, option = {}, time = {}) {
  if (!character || !option) return { notes: [] };
  const state = ensureCausalState(character);
  const year = time.year ?? null;
  const stance = option.stance || option.direction || "endure";
  const polarity = option.industryPolarity || null;
  const threads = option.threads || option.worldThreads || [];
  const notes = [];

  const stanceDelta = STANCE_THREAD_DELTA[stance] || {};
  for (const [thread, delta] of Object.entries(stanceDelta)) {
    bumpThread(state, thread, delta);
  }
  for (const thread of threads) {
    if (polarity === "benefit") bumpThread(state, thread, 0.05);
    if (polarity === "harm") bumpThread(state, thread, 0.07);
  }

  if (polarity === "benefit" || stance === "ride_wave") {
    state.rideWaveXp = Math.min(40, (state.rideWaveXp || 0) + 2);
    state.npcClimate = Math.max(-80, (state.npcClimate || 0) - 2);
  }
  if (polarity === "harm" || stance === "cut_loss" || stance === "endure") {
    state.survivorXp = Math.min(40, (state.survivorXp || 0) + 2);
    state.npcClimate = Math.min(80, (state.npcClimate || 0) + (stance === "cut_loss" ? 1 : 3));
  }
  if (option.dark || option.perpetrator || stance === "name") {
    state.npcClimate = Math.min(90, (state.npcClimate || 0) + 6);
    notes.push("街坊的眼神變硬了一截。十年後的動員名單會記得誰先開口。");
  }

  state.echoes.push({
    year,
    stance,
    polarity,
    threads: threads.slice(0, 4),
    worldEventId: option.worldEventId || null,
  });
  if (state.echoes.length > ECHO_LIMIT) {
    state.echoes.splice(0, state.echoes.length - ECHO_LIMIT);
  }
  state.lastEchoYear = year;

  // Nudge living NPC affection — social environment drifts with the player.
  const network = ensureNpcNetwork(character);
  const climate = state.npcClimate || 0;
  const deltaAff = climate >= 20 ? -2 : climate <= -15 ? 1 : climate >= 8 ? -1 : 0;
  if (deltaAff) {
    for (const npc of network.npcs || []) {
      if (npc.alive === false) continue;
      npc.affection = Math.max(0, Math.min(100, Math.round((npc.affection ?? 50) + deltaAff)));
    }
  }

  return { notes, causal: state };
}

/**
 * Push personal bias into history shockOverrides (intensify only — no inventing eras).
 */
export function applyCausalShockBias(character, year, historyIds = []) {
  if (!character) return { notes: [] };
  const causal = refreshCausalTagBias(character);
  const history = ensureHistoryState(character);
  const notes = [];
  for (const shockId of historyIds) {
    if (!shockId) continue;
    // Map shocks loosely to threads by id tokens.
    let bias = 0;
    const id = String(shockId);
    if (/depression|crash|gfc|fx|layoff|unemploy/i.test(id)) {
      bias = (causal.threadBias.unemployment || 0) + (causal.threadBias.devaluation || 0);
    } else if (/war|draft|conscript|pacific|sino|civil|korea|vietnam/i.test(id)) {
      bias = (causal.threadBias.war || 0) + (causal.threadBias.conscription || 0);
    } else if (/flight|partition|refugee|exile/i.test(id)) {
      bias = causal.threadBias.flight || 0;
    } else if (/purge|228|cultural|list/i.test(id)) {
      bias = causal.threadBias.purge || 0;
    }
    if (Math.abs(bias) < 0.12) continue;
    const prev = history.shockOverrides[shockId] || {};
    if (prev.suppressed) continue;
    const intensify = Math.max(0.55, Math.min(1.85, (prev.intensify || 1) * (1 + bias * 0.35)));
    history.shockOverrides[shockId] = {
      ...prev,
      intensify,
      label: prev.label || "因果回饋",
    };
    if (year != null && !notes.length) {
      notes.push("早年的帳開始改寫這一季宏觀衝擊落到你身上的力道。");
    }
  }
  return { notes, causal };
}

/** Weight multiplier for picking a world incident given causal bias. */
export function causalIncidentWeight(ctx, incident) {
  const causal = ctx.character?.causalState || ctx.causalState;
  if (!causal?.threadBias) return 1;
  const threads = incident?.threads || [];
  if (!threads.length) return 1;
  let sum = 0;
  for (const thread of threads) {
    sum += causal.threadBias[thread] || 0;
  }
  const avg = sum / threads.length;
  // Higher personal exposure → more likely the shock finds this life.
  let weight = 1 + avg * 1.4;
  if ((causal.rideWaveXp || 0) >= 8 && threads.some((t) => t === "devaluation" || t === "unemployment")) {
    weight *= 1.12;
  }
  if ((causal.survivorXp || 0) >= 8 && threads.some((t) => t === "war" || t === "flight")) {
    weight *= 1.1;
  }
  if ((causal.npcClimate || 0) >= 25 && threads.some((t) => t === "purge" || t === "conscription")) {
    weight *= 1.15;
  }
  return Math.max(0.2, Math.min(3.2, weight));
}

export function weeklyCausalTick(character, time = {}) {
  if (!character) return { notes: [], effects: {} };
  const state = refreshCausalTagBias(character);
  // Soft decay toward equilibrium.
  for (const thread of THREADS) {
    state.threadBias[thread] = clampBias((state.threadBias[thread] || 0) * 0.985);
  }
  state.npcClimate = Math.round((state.npcClimate || 0) * 0.97);
  const historyIds = character._lastHistoryIds || [];
  const shock = applyCausalShockBias(character, time.year, historyIds);
  return { notes: shock.notes, effects: {}, causal: state };
}
