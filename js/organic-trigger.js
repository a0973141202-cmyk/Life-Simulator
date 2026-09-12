/**
 * Organic gene / ethnicity choice trigger.
 * Options fire by probability × crisis, never as a weekly guarantee.
 */

import { buildConstitution, ensureConstitution } from "./constitution.js";

const CONTEXT_NEEDLES = Object.freeze({
  plague: ["plague", "epidemic", "malaria", "flu", "cholera", "pox", "world_plague", "world_epidemic"],
  famine: ["famine", "hunger", "world_famine", "scarcity"],
  labor: ["labor", "industrial", "extractive", "world_child_labor", "adult_labor", "iron_shift", "world_mass_layoff"],
  climate: ["extreme_cold", "extreme_heat", "polar", "monsoon", "dust_dry", "disaster", "arctic", "midnight_sun"],
  medical: ["condition_", "world_epidemic", "world_plague", "health"],
  discrimination: ["world_listed", "world_checkpoint", "lineage_mixed", "228", "cultural_rev", "purge", "world_draft"],
  enclave: ["ethnicity_", "clan", "diaspora"],
  cultural: ["world_listed", "faith", "language", "world_checkpoint", "figure_hunted"],
  conscription: ["world_draft", "draft", "conscript"],
  unemployment: ["world_mass_layoff", "unemploy", "xiagang"],
  devaluation: ["world_devaluation", "devaluat"],
  flight: ["world_border_run", "displacement", "flight"],
});

function haystack(ctx) {
  return [
    ...(ctx.tags || []),
    ...(ctx.historyIds || []),
    ...(ctx.currentTags || []),
    ctx.geoBand,
    ctx.geoBandBase,
    ctx.climate,
  ].map((item) => String(item || "").toLowerCase());
}

function needlesHit(hay, needles) {
  return needles.some((needle) => hay.some((item) => item.includes(String(needle).toLowerCase())));
}

export function evaluateOrganicWeek(ctx = {}) {
  const constitution = ctx.constitution || ensureConstitution(ctx.character, ctx.settlement, ctx.year);
  const hay = haystack(ctx);
  const health = ctx.stats?.health ?? ctx.character?.stats?.health ?? 50;
  const pressure = ctx.pressure?.score || 0;
  const weeklyDeath = ctx.mortality?.weekly || 0;
  const contexts = [];

  if (needlesHit(hay, CONTEXT_NEEDLES.plague) || (ctx.geoBand === "slum" && needlesHit(hay, ["disease"]))) {
    contexts.push("plague");
  }
  if (needlesHit(hay, CONTEXT_NEEDLES.famine) || ctx.geoBand === "camp") {
    contexts.push("famine");
  }
  if (needlesHit(hay, CONTEXT_NEEDLES.labor) || ctx.geoBand === "industrial") {
    contexts.push("labor");
  }
  if (needlesHit(hay, CONTEXT_NEEDLES.climate) || ctx.geoBand === "disaster" || ctx.geoBand === "arctic" || ctx.seasonalDisaster) {
    contexts.push("climate");
  }
  if (health <= 38 || needlesHit(hay, ["condition_"]) || needlesHit(hay, ["world_epidemic", "world_plague"])) {
    contexts.push("medical");
  }
  if (needlesHit(hay, CONTEXT_NEEDLES.discrimination) || (constitution.mixed && (pressure >= 28 || needlesHit(hay, ["official", "politics"])))) {
    contexts.push("discrimination");
  }
  if (constitution.minority || constitution.mixed) {
    if (pressure >= 18 || contexts.includes("discrimination") || needlesHit(hay, CONTEXT_NEEDLES.enclave)) {
      contexts.push("enclave");
    }
  }
  if (needlesHit(hay, CONTEXT_NEEDLES.cultural) || contexts.includes("discrimination") || contexts.includes("enclave")) {
    contexts.push("cultural");
  }

  const threads = ctx.upheaval?.threads || ctx.character?.upheavalState?.threads || [];
  if (threads.includes("conscription") || needlesHit(hay, CONTEXT_NEEDLES.conscription)) {
    contexts.push("conscription");
    if (!contexts.includes("discrimination")) contexts.push("discrimination");
  }
  if (threads.includes("unemployment") || needlesHit(hay, CONTEXT_NEEDLES.unemployment)) {
    contexts.push("unemployment");
    if (!contexts.includes("labor")) contexts.push("labor");
  }
  if (threads.includes("devaluation") || needlesHit(hay, CONTEXT_NEEDLES.devaluation)) {
    contexts.push("devaluation");
  }
  if (threads.includes("flight") || needlesHit(hay, CONTEXT_NEEDLES.flight)) {
    contexts.push("flight");
    if (!contexts.includes("discrimination")) contexts.push("discrimination");
    if (constitution.minority || constitution.mixed) contexts.push("enclave");
  }
  if (threads.includes("war") || threads.includes("purge")) {
    if (!contexts.includes("discrimination")) contexts.push("discrimination");
  }
  if (contexts.includes("discrimination") && !contexts.includes("cultural")) {
    contexts.push("cultural");
  }

  const unique = [...new Set(contexts)];
  const geneRelevant = (constitution.genes || []).length > 0;
  const ethnicityRelevant = Boolean(constitution.primaryEthnicityId || constitution.mixed);
  const geneContext = unique.some((key) => ["plague", "famine", "labor", "climate", "medical"].includes(key));
  const ethnicityContext = unique.some((key) => [
    "discrimination", "enclave", "cultural", "famine", "conscription", "flight", "unemployment",
  ].includes(key));
  const crisisBoost = Math.min(0.18, pressure / 280) + Math.min(0.1, weeklyDeath * 10);
  const geneChance = geneRelevant && geneContext
    ? Math.min(0.48, 0.12 + unique.length * 0.06 + crisisBoost + (constitution.hardy ? 0.04 : 0))
    : 0.03;
  const ethnicityChance = ethnicityRelevant && ethnicityContext
    ? Math.min(0.46, 0.1 + unique.length * 0.05 + crisisBoost + (constitution.minority ? 0.08 : 0))
    : 0.03;

  return {
    contexts: unique,
    geneRelevant,
    ethnicityRelevant,
    geneChance,
    ethnicityChance,
    chance: Math.max(geneChance, ethnicityChance),
    shouldFireGene: geneRelevant && geneContext,
    shouldFireEthnicity: ethnicityRelevant && ethnicityContext,
    shouldFire: (geneRelevant && geneContext) || (ethnicityRelevant && ethnicityContext),
    crisisScore: pressure,
    hardy: Boolean(constitution.hardy),
    minority: Boolean(constitution.minority),
  };
}

export function attachOrganicContext(ctx) {
  if (!ctx) return null;
  ctx.constitution = ctx.character?.constitution || buildConstitution(ctx.character, ctx.settlement, ctx.year);
  if (ctx.character && !ctx.character.constitution) ctx.character.constitution = ctx.constitution;
  ctx.organic = evaluateOrganicWeek(ctx);
  return ctx.organic;
}

export function organicContextsActive(ctx, keys = []) {
  if (!keys.length) return true;
  const week = ctx?.organic || evaluateOrganicWeek(ctx);
  return keys.some((key) => week.contexts.includes(key));
}

export function organicWeight(action, ctx) {
  if (!action?.organic) return 1;
  const week = ctx?.organic || evaluateOrganicWeek(ctx);
  const needed = action.organicContexts || action.when?.organicContexts || [];
  const hit = needed.filter((key) => week.contexts.includes(key)).length;
  if (needed.length && !hit) return 0.06;
  const kindBonus = action.organic === "ethnicity" && week.minority ? 0.4 : 0;
  const hardyBonus = action.organic === "gene" && week.hardy && action.valence !== "strain" ? 0.25 : 0;
  const strainBonus = action.valence === "strain" && (ctx.stats?.health ?? 50) <= 42 ? 0.3 : 0;
  return 1.15 + hit * 0.55 + (week.crisisScore || 0) / 110 + kindBonus + hardyBonus + strainBonus;
}
