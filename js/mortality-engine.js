/**
 * Historical / geographic weekly survival engine.
 * Data lives in js/data/mortality-*.js. GameEngine only rolls and ends.
 *
 * No floor, no reroll, no protagonist halo.
 */

import { ageSurvivalCoefficient, baselineCauseRates } from "./data/mortality-age-tables.js";
import {
  WAR_TAG_VIOLENCE,
  classMult,
  climateMult,
  geoBandFor,
  kindMult,
  SEASON_ENV_ADD,
} from "./data/mortality-geo.js";
import { MORTALITY_HISTORY } from "./data/mortality-history.js";
import { filterShockRow } from "./history-engine.js";
import {
  ADAPTATION_WEIGHTS,
  HEALTH_DISEASE_CURVE,
  MORTALITY_TAG_WEIGHTS,
  WEALTH_HUNGER_CURVE,
} from "./data/mortality-tag-weights.js";
import { MORTALITY_CAUSE_TEXTS } from "./data/mortality-causes.js";
import { MORTALITY_COST_NOTE } from "./data/mortality-rules.js";
import { zhCause } from "./data/ui-zh.js";
import { getSettlementCountry } from "./settlements.js";
import { TURNS_PER_YEAR } from "./constants.js";

export const MORTALITY_CAUSES = Object.freeze([
  "disease",
  "hunger",
  "violence",
  "accident",
  "environment",
  "senescence",
]);

const EMPTY_CAUSES = () => Object.fromEntries(MORTALITY_CAUSES.map((key) => [key, 0]));

export function annualToWeekly(annual) {
  const p = Math.max(0, Math.min(0.999999, Number(annual) || 0));
  return 1 - (1 - p) ** (1 / TURNS_PER_YEAR);
}

export function weeklyToAnnual(weekly) {
  const p = Math.max(0, Math.min(0.999999, Number(weekly) || 0));
  return 1 - (1 - p) ** TURNS_PER_YEAR;
}

function lerpCurve(value, at0, at100) {
  const t = Math.max(0, Math.min(100, Number(value) || 0)) / 100;
  return at0 + (at100 - at0) * t;
}

function hasAny(list, ids) {
  const set = new Set(list || []);
  return (ids || []).some((id) => set.has(id));
}

function normalizeCtx(ctx = {}) {
  const character = ctx.character || {};
  const settlement = ctx.settlement || {};
  const time = ctx.time || {};
  const environment = ctx.environment || {};
  const ageYears = ctx.ageYears ?? time.ageYears ?? 0;
  const year = ctx.year ?? time.year ?? ctx.date?.year ?? 1920;
  const week = ctx.week ?? time.week ?? 1;
  const tags = [
    ...(ctx.tags || character.tags || []),
    ...(ctx.currentTags || environment.tags || []),
  ];
  return {
    character,
    settlement,
    ageYears,
    year,
    week,
    region: ctx.region || character.region || settlement.region || "",
    country: getSettlementCountry(settlement, year) || character.country || settlement.country || "",
    kind: settlement.kind || character.settlementKind || "city",
    climate: settlement.climate || character.climate || "temperate",
    familyClassId: ctx.familyClassId || character.familyClassId || "worker",
    tags,
    settlementTags: settlement.tags || character.settlementTags || [],
    cityId: character.cityId || settlement.id || "",
    stats: ctx.stats || character.stats || {},
    hooks: ctx.hooks || character.bloodline?.hooks || [],
    ledger: ctx.ledger || character.ledger || {},
  };
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

function applyMultMap(target, map, extra = 1) {
  if (!map) return;
  for (const key of MORTALITY_CAUSES) {
    if (map[key] != null) target[key] *= map[key] * extra;
  }
}

function adaptationRelevant(row, ctx) {
  const blob = `${ctx.climate} ${ctx.kind} ${(ctx.tags || []).join(" ")} ${(ctx.settlementTags || []).join(" ")}`;
  return (row.hooks || []).some((hook) => {
    if (hook === "arctic") return ctx.kind === "arctic" || ctx.climate === "polar" || ctx.climate === "cold" || blob.includes("arctic");
    if (hook === "altitude") return ctx.climate === "highland" || blob.includes("altitude") || blob.includes("thin_air");
    if (hook === "desert" || hook === "heat") {
      return ctx.climate === "arid" || blob.includes("extreme_heat") || blob.includes("desert");
    }
    if (hook === "malaria" || hook === "tropics") {
      return ctx.climate === "tropical" || ctx.climate === "subtropical" || ctx.climate === "tropical_savanna";
    }
    if (hook === "war") return ctx.kind === "warzone" || (ctx.settlementTags || []).includes("戰亂區");
    if (hook === "labor") return true;
    return blob.includes(hook);
  });
}

function addMap(target, map, scale = 1) {
  if (!map) return;
  for (const key of MORTALITY_CAUSES) {
    if (map[key]) target[key] += map[key] * scale;
  }
}

export function evaluateWeeklyMortality(ctxInput) {
  const ctx = normalizeCtx(ctxInput);
  const { ageBand, yearBand, rates } = baselineCauseRates(ctx.ageYears, ctx.year);
  const annual = EMPTY_CAUSES();
  for (const key of MORTALITY_CAUSES) annual[key] = rates[key] || 0;

  const geo = kindMult(ctx.kind);
  const klass = classMult(ctx.familyClassId);
  const climate = climateMult(ctx.climate);
  applyMultMap(annual, geo);
  applyMultMap(annual, klass);
  applyMultMap(annual, climate);

  if ((ctx.settlementTags || []).includes("戰亂區") && ctx.kind !== "warzone") {
    annual.violence *= WAR_TAG_VIOLENCE;
  }

  const currentTags = ctx.tags || [];
  let seasonalDisaster = false;
  for (const [tag, add] of Object.entries(SEASON_ENV_ADD)) {
    if (currentTags.includes(tag) || currentTags.includes(`current_${tag}`)) {
      addMap(annual, add);
      seasonalDisaster = tag.includes("extreme") || tag.includes("monsoon") || tag.includes("polar");
    }
  }

  const shocks = [];
  for (const row of MORTALITY_HISTORY) {
    const filtered = filterShockRow(row, ctx.character?.historyState, ctx.year);
    if (!filtered.active) continue;
    const shockRow = filtered.row;
    if (!shockMatches(shockRow, ctx)) continue;
    let scale = filtered.scale || 1;
    if (row.ageMult) scale *= row.ageMult[ageBand.id] ?? 1;
    if (row.classMult) scale *= row.classMult[ctx.familyClassId] ?? 1;
    if (row.kindMult) scale *= row.kindMult[ctx.kind] ?? 1;
    const add = EMPTY_CAUSES();
    addMap(add, row.add, scale);
    addMap(annual, add);
    shocks.push({ id: row.id, label: row.label, add, cause: row.cause });
  }

  const tagDelta = EMPTY_CAUSES();
  for (const row of MORTALITY_TAG_WEIGHTS) {
    if (!hasAny(ctx.tags, row.tags)) continue;
    for (const key of MORTALITY_CAUSES) {
      if (row[key]) tagDelta[key] += row[key];
    }
  }
  for (const key of MORTALITY_CAUSES) {
    annual[key] *= Math.max(0.05, 1 + tagDelta[key]);
  }

  for (const row of ADAPTATION_WEIGHTS) {
    if (!hasAny(ctx.tags, row.tags) && !(row.hooks || []).some((hook) => (ctx.hooks || []).includes(hook))) continue;
    if (!adaptationRelevant(row, ctx)) continue;
    if (row.environment) annual.environment *= Math.max(0.45, 1 + row.environment);
    if (row.disease) annual.disease *= Math.max(0.45, 1 + row.disease);
    if (row.accident) annual.accident *= Math.max(0.55, 1 + row.accident);
    if (row.hunger) annual.hunger *= Math.max(0.55, 1 + row.hunger);
  }

  const health = ctx.stats.health ?? 50;
  const wealth = ctx.character?.means ?? ctx.stats?.means ?? 50;
  const healthMult = lerpCurve(health, HEALTH_DISEASE_CURVE.at0, HEALTH_DISEASE_CURVE.at100);
  const wealthMult = lerpCurve(wealth, WEALTH_HUNGER_CURVE.at0, WEALTH_HUNGER_CURVE.at100);
  for (const key of HEALTH_DISEASE_CURVE.causes) annual[key] *= healthMult;
  for (const key of WEALTH_HUNGER_CURVE.causes) annual[key] *= wealthMult;

  const wanted = ctx.ledger.wanted || 0;
  const heat = ctx.ledger.heat || 0;
  if (wanted >= 40) annual.violence += 0.01 + (wanted - 40) * 0.00045;
  if (heat >= 50) annual.accident += 0.004 + (heat - 50) * 0.0002;

  const ageCoefRow = ageSurvivalCoefficient(ctx.ageYears);
  const ageCoefficient = ageCoefRow.coefficient ?? 1;
  for (const key of MORTALITY_CAUSES) {
    annual[key] *= ageCoefficient;
  }

  for (const key of MORTALITY_CAUSES) {
    annual[key] = Math.min(0.999, Math.max(0, annual[key]));
  }

  let surviveAnnual = 1;
  for (const key of MORTALITY_CAUSES) surviveAnnual *= 1 - annual[key];
  const annualTotal = 1 - surviveAnnual;
  const weekly = annualToWeekly(annualTotal);
  const weeklyCauses = {};
  let causeMass = 0;
  for (const key of MORTALITY_CAUSES) {
    weeklyCauses[key] = annualToWeekly(annual[key]);
    causeMass += weeklyCauses[key];
  }

  const band = geoBandFor(ctx.kind, ctx.settlementTags, seasonalDisaster);
  const ranked = MORTALITY_CAUSES
    .map((id) => ({ id, annual: annual[id], weekly: weeklyCauses[id] }))
    .sort((a, b) => b.annual - a.annual);

  return {
    weekly,
    annual: annualTotal,
    annualCauses: annual,
    weeklyCauses,
    causeMass,
    ranked,
    ageBand,
    yearBand,
    band,
    shocks,
    ageCoefficient,
    ageCoefficientId: ageCoefRow.id,
    ageCoefficientLabel: ageCoefRow.label,
    noHalo: true,
    note: MORTALITY_COST_NOTE,
    year: ctx.year,
    ageYears: ctx.ageYears,
    kind: ctx.kind,
  };
}

function pickCause(rng, invoice) {
  const mass = invoice.causeMass || 0;
  if (mass <= 0) return invoice.ranked[0]?.id || "disease";
  let roll = rng() * mass;
  for (const row of invoice.ranked) {
    roll -= row.weekly;
    if (roll <= 0) return row.id;
  }
  return invoice.ranked[0]?.id || "disease";
}

function causeCopy(cause, rng) {
  const pack = MORTALITY_CAUSE_TEXTS[cause] || MORTALITY_CAUSE_TEXTS.disease;
  const details = pack.details || [pack.reason];
  const detail = typeof rng === "function"
    ? details[Math.floor(rng() * details.length)] || details[0]
    : details[0];
  return { reason: pack.reason, detail };
}

export function describeMortality(invoice) {
  if (!invoice) return "";
  const top = invoice.ranked?.[0]?.id;
  return top ? zhCause(top) : "";
}

function publicDeathCopy(cause, rng) {
  const copy = causeCopy(cause, rng);
  const name = zhCause(cause) || copy.reason;
  return {
    reason: name,
    detail: `${name}。${copy.detail}`,
  };
}

export function rollWeeklySurvival(rng, ctxInput) {
  const invoice = evaluateWeeklyMortality(ctxInput);
  const health = ctxInput?.character?.stats?.health ?? ctxInput?.stats?.health ?? 50;
  if (health <= 0) {
    const copy = publicDeathCopy("collapse", rng);
    return {
      dead: true,
      cause: "collapse",
      reason: copy.reason,
      detail: copy.detail,
      invoice,
    };
  }
  const dead = rng() < invoice.weekly;
  if (!dead) {
    return { dead: false, cause: null, reason: null, detail: null, invoice };
  }
  const cause = pickCause(rng, invoice);
  const copy = publicDeathCopy(cause, rng);
  return {
    dead: true,
    cause,
    reason: copy.reason,
    detail: copy.detail,
    invoice,
  };
}

export { MORTALITY_COST_NOTE, MORTALITY_HISTORY };
