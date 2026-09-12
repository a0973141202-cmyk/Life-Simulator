/**
 * Risk calculation module.
 * Turns year, opinion, tags, and ledger into success / backlash numbers.
 * No moral veto: extreme attempts are allowed; they are just expensive.
 */

import { eraWindowForYear, TAG_RISK_MODIFIERS } from "./data/era-risk.js";
import { socialAttemptMod } from "./social-feedback.js";
import { evaluateEraCrisis } from "./history-crisis-engine.js";
import { findSettlement, getSettlementCountry } from "./settlements.js";
import { canonicalizeCountry } from "./demographics-engine.js";

function clamp01(value, min = 0.01, max = 0.92) {
  return Math.max(min, Math.min(max, value));
}

function hasAnyTag(tags, wanted) {
  const set = new Set(tags || []);
  return wanted.some((id) => set.has(id));
}

export function collectRiskModifiers(ctx) {
  const year = ctx.year ?? ctx.time?.year ?? 1920;
  const window = eraWindowForYear(year);
  const tags = ctx.tags || ctx.character?.tags || [];
  const merged = {
    politics: 0,
    historical: 0,
    militant: 0,
    crime: 0,
    narcotics: 0,
    commerce: 0,
    backlash: 0,
    wantedMult: 1,
    attemptBonus: 0,
    trustBonus: 0,
    healthRisk: 0,
    window,
  };

  if (window) {
    for (const [key, value] of Object.entries(window.modifiers || {})) {
      if (key === "wantedMult") merged.wantedMult *= value;
      else merged[key] = (merged[key] || 0) + value;
    }
  }

  for (const row of TAG_RISK_MODIFIERS) {
    if (!hasAnyTag(tags, row.tags)) continue;
    for (const [key, value] of Object.entries(row)) {
      if (key === "tags") continue;
      if (key === "wantedMult") merged.wantedMult *= value;
      else merged[key] = (merged[key] || 0) + value;
    }
  }

  return merged;
}

export function pathKeyForAttempt(attempt = {}) {
  return attempt.path || attempt.kind?.split("_")[0] || "politics";
}

/**
 * Probability that a political / historical / militant / crime attempt lands.
 * Backlash is computed even on success when the attempt asks for it.
 */
export function evaluateAttempt(rng, character, time, attempt = {}) {
  const ledger = character.ledger || {};
  const stats = character.stats || {};
  const ctx = {
    year: time.year,
    tags: character.tags || [],
    character,
    time,
  };
  const mods = collectRiskModifiers(ctx);
  const path = pathKeyForAttempt(attempt);
  const pathBonus = mods[path] || 0;
  const base = attempt.baseChance ?? 0.12;

  const support =
    (stats.health || 0) * 0.0012 +
    (stats.sanity || 0) * 0.0012 +
    (ledger.politicalCapital || 0) * 0.0035 +
    (ledger.notoriety || 0) * (path === "crime" || path === "militant" || path === "narcotics" ? 0.002 : -0.0006) +
    ((ledger.opinion || 50) - 50) * 0.0022 +
    ((ledger.trust || 50) - 50) * 0.0016 +
    (ledger.paths?.[path] || 0) * 0.008 +
    socialAttemptMod(ledger, path) +
    mods.attemptBonus +
    pathBonus;

  const settlement = character.settlement || findSettlement(character.cityId);
  const eraCrisis = evaluateEraCrisis({
    year: time.year,
    week: time.week,
    region: character.region,
    country: canonicalizeCountry(
      getSettlementCountry(settlement, time.year) || character.country || "",
      time.year,
      character.region || settlement?.region,
    ),
    familyClassId: character.familyClassId,
    tags: character.tags,
    character,
    settlement,
  });
  const breakdown = (character.tags || []).some((tag) => String(tag).startsWith("trauma_") && (
    tag === "trauma_ptsd"
    || tag === "trauma_melancholia"
    || tag === "trauma_persecution"
    || tag === "trauma_persona_crack"
  ));
  const drag =
    (ledger.wanted || 0) * 0.0028 +
    (ledger.heat || 0) * 0.0022 +
    Math.max(0, 40 - (ledger.trust || 50)) * 0.002 +
    Math.max(0, 35 - (stats.health || 50)) * 0.001 +
    Math.max(0, 40 - (stats.sanity || 50)) * 0.0018 +
    eraCrisis.score * 0.0009 +
    (breakdown ? 0.045 : 0);

  const chance = clamp01(base + support - drag, 0.015, attempt.maxChance ?? 0.78);
  const roll = rng();
  const success = roll < chance;

  const backlashBase = (attempt.backlashScale ?? 1) * (
    0.18 + (mods.backlash || 0) + (1 - chance) * 0.35
    + (eraCrisis.score >= 42 ? 0.08 : eraCrisis.score >= 22 ? 0.04 : 0)
    + (breakdown ? 0.05 : 0)
  );
  const backlashChance = clamp01(
    attempt.backlashEvenIfSuccess || !success
      ? backlashBase + (success ? 0.08 : 0.22)
      : backlashBase * 0.25,
    0.04,
    0.95,
  );
  const backlash = rng() < backlashChance;

  const severity = Math.round(
    (attempt.severity ?? 1) * (20 + (ledger.wanted || 0) * 0.25 + (ledger.heat || 0) * 0.2 + (1 - chance) * 40),
  );

  let narrative;
  if (success && backlash) {
    narrative = `這一步暫時得手，但${mods.window?.note || "時代"}立刻開始反噬。`;
  } else if (success) {
    narrative = `窗口對準了。以當下年份、輿論與標籤估算，這次嘗試約有 ${Math.round(chance * 100)}% 的機會，而你踩中了。`;
  } else if (backlash) {
    narrative = `失敗被公開（估算成功率 ${Math.round(chance * 100)}%）。對手、國家或街頭不會當沒看見。`;
  } else {
    narrative = `這一週的企圖沒有成型。成功率只有 ${Math.round(chance * 100)}%，風聲卻已經比結果更響。`;
  }

  return {
    kind: attempt.kind || path,
    path,
    chance,
    roll,
    success,
    backlash,
    backlashChance,
    severity: Math.max(8, Math.min(90, severity)),
    wantedMult: mods.wantedMult,
    era: mods.window,
    narrative,
    mods,
  };
}

export function crisisPressure(ledger = {}, extra = {}) {
  const wanted = ledger.wanted || 0;
  const heat = ledger.heat || 0;
  const infamy = ledger.infamy || 0;
  const trustGap = Math.max(0, 45 - (ledger.trust || 50));
  const upheavalScore = extra.upheavalScore ?? extra.upheaval?.score ?? 0;
  const worldPressure = extra.worldPressure ?? 0;
  const eraCrisis = extra.eraCrisis ?? extra.eraCrisisScore ?? 0;
  const sanityGap = extra.sanityGap ?? 0;
  const wealthGap = extra.wealthGap ?? extra.wealthPressure ?? 0;
  const kinGap = extra.kinGap ?? extra.kinPressure ?? 0;
  const score = wanted * 0.45 + heat * 0.35 + infamy * 0.15 + trustGap * 0.2
    + upheavalScore * 0.55 + worldPressure * 0.12
    + eraCrisis * 0.7 + sanityGap * 0.35 + wealthGap * 0.55 + kinGap * 0.5;
  return {
    score,
    level: score >= 70 ? "ruin" : score >= 48 ? "crisis" : score >= 28 ? "watch" : "calm",
    upheavalScore,
    eraCrisis,
    sanityGap,
    wealthGap,
    kinGap,
  };
}

export function weeklyHealthRiskChance(ledger = {}) {
  const extra = (ledger.healthRisk || 0) * 0.004 + (ledger.paths?.narcotics || 0) * 0.006 + (ledger.paths?.militant || 0) * 0.004;
  return clamp01(extra, 0, 0.45);
}

export { eraWindowForYear };
