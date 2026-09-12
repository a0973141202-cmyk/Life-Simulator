/**
 * Macro 1920–2025 timeline → personal Crisis Index.
 * Only spikes when the live year, place, class, or extreme habitat matches.
 * Never lowers a score for the player.
 */

import { getActiveHistory } from "./data.js";
import { MORTALITY_HISTORY } from "./data/mortality-history.js";
import { filterShockRow } from "./history-engine.js";
import { getSettlementCountry } from "./settlements.js";

const PULSE_BASE = Object.freeze({
  crash_1929: 22,
  mukden: 16,
  war_full: 34,
  ww2_europe: 34,
  pacific_war: 28,
  china_1949: 20,
  taiwan_228: 30,
  korean_war: 14,
  great_leap: 38,
  cultural_rev: 26,
  oil_shock: 10,
  cold_war_peak: 12,
  cold_war_end: 6,
  xiagang: 18,
  asian_crisis: 16,
  handover_1997: 8,
  dotcom: 6,
  sars: 20,
  gfc_2008: 16,
  covid: 18,
});

const SHOCK_WEIGHT = Object.freeze({
  hunger: 420,
  violence: 480,
  disease: 260,
  accident: 140,
  environment: 220,
});

function countryOf(ctx = {}) {
  const settlement = ctx.settlement;
  const year = ctx.year ?? ctx.time?.year;
  return String(
    ctx.country
    || (settlement && year != null ? getSettlementCountry(settlement, year) : "")
    || ctx.character?.country
    || "",
  );
}

function kindOf(ctx = {}) {
  return String(ctx.settlement?.kind || ctx.character?.settlementKind || ctx.geoBandBase || "");
}

function classOf(ctx = {}) {
  return String(ctx.familyClassId || ctx.character?.familyClassId || "");
}

function tagsOf(ctx = {}) {
  return [
    ...(ctx.tags || []),
    ...(ctx.character?.tags || []),
    ...(ctx.settlement?.tags || []),
    ...(ctx.environment?.tags || []),
  ].map((tag) => String(tag || ""));
}

function habitatBoost(ctx = {}) {
  const kind = kindOf(ctx);
  const geo = String(ctx.geoBand || ctx.geoBandBase || "");
  const tags = tagsOf(ctx);
  const war = kind === "warzone" || geo === "warzone" || tags.includes("戰亂區") || tags.includes("socio_war_displacement");
  const slum = kind === "slum" || geo === "slum" || tags.includes("socio_slum_density");
  const camp = kind === "camp" || geo === "camp" || tags.includes("socio_refugee_camp");
  const arctic = kind === "arctic" || geo === "arctic" || tags.includes("socio_arctic_scarcity");
  const underground = kind === "underground" || geo === "underground";
  let extra = 0;
  if (war) extra += 16;
  if (slum) extra += 10;
  if (camp) extra += 12;
  if (arctic) extra += 10;
  if (underground) extra += 8;
  return extra;
}

function classBiasOf(pulse, familyClassId) {
  const bias = pulse.classBias || {};
  return Number(bias[familyClassId] || 0);
}

function pulseHitsHard(pulse, ctx) {
  const region = ctx.region || ctx.character?.region || "";
  const familyClassId = classOf(ctx);
  const kind = kindOf(ctx);
  const tags = tagsOf(ctx);
  let scale = pulse.regions ? 1 : 0.42;
  if (!pulse.regions && ["west", "japan", "hongkong", "taiwan"].includes(region)) {
    if (pulse.id === "crash_1929" || pulse.id === "gfc_2008" || pulse.id === "oil_shock") scale = 1;
  }
  if (pulse.id === "crash_1929" && (kind === "city" || kind === "port" || familyClassId === "merchant")) scale = Math.max(scale, 0.9);
  if (pulse.id === "great_leap" && (familyClassId === "peasant" || familyClassId === "worker")) scale = 1.15;
  if (pulse.id === "cultural_rev" && (familyClassId === "intellectual" || familyClassId === "gentry" || familyClassId === "official")) {
    scale = 1.12;
  }
  if (pulse.id === "xiagang" && familyClassId === "worker") scale = 1.1;
  if ((pulse.id === "sars" || pulse.id === "covid") && (kind === "slum" || kind === "camp" || kind === "city")) {
    scale = Math.max(scale, 0.95);
  }
  if (tags.includes("socio_extreme_poverty") || tags.includes("socio_working_poor")) scale += 0.08;
  scale += classBiasOf(pulse, familyClassId) * 0.06;
  return Math.max(0, scale);
}

function shockMatches(row, ctx) {
  const year = Number(ctx.year ?? ctx.time?.year ?? 0);
  if (year < row.years[0] || year > row.years[1]) return false;
  if (row.regions && !row.regions.includes(ctx.region || ctx.character?.region)) return false;
  if (row.countriesAny && !row.countriesAny.some((item) => countryOf(ctx).includes(item))) return false;
  if (row.kinds && !row.kinds.includes(kindOf(ctx))) return false;
  if (row.settlementIds && !row.settlementIds.includes(ctx.settlement?.id || ctx.character?.cityId || "")) {
    return false;
  }
  if (row.tagsAny) {
    const hay = tagsOf(ctx);
    if (!row.tagsAny.some((tag) => hay.includes(tag))) return false;
  }
  if (row.classes && !row.classes.includes(classOf(ctx))) return false;
  return true;
}

export function evaluateEraCrisis(ctx = {}) {
  const year = Number(ctx.year ?? ctx.time?.year ?? 0);
  const week = Number(ctx.week ?? ctx.time?.week ?? 1);
  const region = ctx.region || ctx.character?.region;
  const pulses = year
    ? getActiveHistory(year, week, region).filter((pulse) => PULSE_BASE[pulse.id] != null)
    : [];
  const shocks = [];
  let score = 0;
  const matches = [];

  for (const pulse of pulses) {
    const scale = pulseHitsHard(pulse, ctx);
    if (scale <= 0) continue;
    const add = Math.round((PULSE_BASE[pulse.id] || 8) * scale);
    if (add <= 0) continue;
    score += add;
    matches.push({ id: pulse.id, kind: "pulse", add });
  }

  for (const row of MORTALITY_HISTORY) {
    const filtered = filterShockRow(row, ctx.character?.historyState, year);
    if (!filtered.active) continue;
    const shockRow = filtered.row;
    if (!shockMatches(shockRow, ctx)) continue;
    let add = 0;
    for (const [cause, weight] of Object.entries(SHOCK_WEIGHT)) {
      add += (shockRow.add?.[cause] || 0) * weight;
    }
    add = Math.round(add * (filtered.scale || 1));
    if (add <= 0) continue;
    score += add;
    shocks.push({ id: shockRow.id, label: shockRow.label, add });
    matches.push({ id: shockRow.id, kind: "shock", add });
  }

  score += habitatBoost(ctx);
  score = Math.min(96, Math.round(score));
  return {
    score,
    level: score >= 70 ? "ruin" : score >= 42 ? "crisis" : score >= 22 ? "watch" : "calm",
    pulses: pulses.map((row) => row.id),
    shocks: shocks.map((row) => row.id),
    matches,
    noHalo: true,
  };
}

export function attachEraCrisis(ctx = {}) {
  const eraCrisis = evaluateEraCrisis(ctx);
  ctx.eraCrisis = eraCrisis;
  return eraCrisis;
}

export function eraCrisisScore(ctx = {}) {
  return Number(ctx.eraCrisis?.score ?? evaluateEraCrisis(ctx).score ?? 0);
}
