/**
 * Opening dossier: birth, awakening, and first-period lead.
 * Assembled live from the four pillars — year × place × class × tags × history.
 */
import { PLAY_AGE_MIN } from "./constants.js";
import { getActiveHistory, getEraForYear } from "./data.js";
import { formatDate } from "./data/calendar.js";
import {
  composeOpeningAwakening,
  composeOpeningBirth,
  composeOpeningWeekLead,
} from "./dynamic-prose.js";
import { ensureConstitution } from "./constitution.js";
import { eventOutline, seedSessionCooldown } from "./event-memory.js";
import { createRng } from "./rng.js";
import {
  openingComboOnCooldown,
  recentOpeningRecords,
  rememberSessionOpening,
} from "./session-repeat.js";
import { findSettlement } from "./settlements.js";
import { evaluateUpheaval } from "./upheaval-engine.js";
import { attachWorldContext } from "./world-event-engine.js";

function rngFromCharacter(character) {
  const raw = `${character?.id || ""}|${character?.birthIso || character?.birthYear || ""}|${character?.name || ""}|${character?.cityId || ""}`;
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return createRng((hash >>> 0) || 1);
}

function yearBand(year) {
  const y = Number(year) || 0;
  return `${Math.floor(y / 10) * 10}s`;
}

function ancestryKey(character) {
  return (character?.bloodline?.ancestries || [])
    .map((row) => row.id || row.label)
    .filter(Boolean)
    .join("+") || "none";
}

function isDisplaced(character) {
  const tags = character?.tags || [];
  return tags.includes("socio_war_displacement")
    || tags.includes("socio_refugee")
    || (character?.householdClimate || []).includes("household_displaced")
    || character?.familyClassId === "immigrant";
}

function pulseAt(character, year) {
  const history = getActiveHistory(year, 1, character?.region);
  if (!history.length) return null;
  const used = new Set();
  for (const row of recentOpeningRecords()) {
    for (const outline of row.eventOutlines || []) {
      if (String(outline).startsWith("history:")) used.add(String(outline).slice("history:".length));
    }
  }
  return history.find((pulse) => !used.has(pulse.id)) || history[0];
}

function buildWorld(character, year) {
  const settlement = findSettlement(character?.cityId);
  const ctx = {
    character,
    year,
    week: 1,
    region: character?.region,
    country: character?.country,
    familyClassId: character?.familyClassId,
    settlement,
    tags: character?.tags || [],
  };
  attachWorldContext(ctx);
  const upheaval = evaluateUpheaval(ctx);
  ctx.upheaval = upheaval;
  ctx.historyPulse = pulseAt(character, year);
  return { ctx, upheaval, pulse: ctx.historyPulse, settlement };
}

function factIds(character, year, world) {
  const constitution = character.constitution
    || ensureConstitution(character, world.settlement, year);
  const place = character.birthplaceLabel
    || [character.country, character.cityName].filter(Boolean).join(":")
    || "unknown";
  return [
    `place:${place}`,
    `class:${character.familyClassId || "worker"}:${character.familyClassLabel || ""}`,
    `hist:${world.upheaval?.id || "none"}:${world.pulse?.id || "none"}`,
    `blood:${ancestryKey(character)}:${constitution?.minority ? "min" : "maj"}`,
    `house:${isDisplaced(character) ? "disp" : "settled"}`,
  ];
}

function composeCtx(character, year, world, extras = {}) {
  return {
    ...world.ctx,
    character,
    year,
    ageYears: extras.ageYears ?? 0,
    dateLabel: extras.dateLabel || (character.birthDate ? formatDate(character.birthDate) : `${year}年`),
    upheaval: world.upheaval,
    historyPulse: world.pulse,
    settlement: world.settlement,
    tags: character.tags || [],
    stats: character.stats,
  };
}

function assembleOnce(rng, character) {
  const birthYear = Number(character.birthYear);
  const playYear = birthYear + PLAY_AGE_MIN;
  const birthWorld = buildWorld(character, birthYear);
  const playWorld = buildWorld(character, playYear);
  const birthCtx = composeCtx(character, birthYear, birthWorld, {
    ageYears: 0,
    dateLabel: character.birthDate ? formatDate(character.birthDate) : `${birthYear}年`,
  });
  const playCtx = composeCtx(character, playYear, playWorld, {
    ageYears: PLAY_AGE_MIN,
    dateLabel: `${playYear}年`,
  });

  const birth = composeOpeningBirth(rng, birthCtx);
  const awakeningText = composeOpeningAwakening(rng, playCtx);
  const weekText = composeOpeningWeekLead(rng, playCtx);
  const slotIds = factIds(character, birthYear, birthWorld);
  const topUpheaval = playWorld.upheaval?.id || birthWorld.upheaval?.id || "none";
  const pulse = playWorld.pulse || birthWorld.pulse;
  const kind = birthWorld.ctx?.kind || character.settlementKind || "city";
  const classId = character.familyClassId || "worker";
  const minority = Boolean(character.constitution?.minority || character.bloodline?.mixed);
  const outline = [
    yearBand(birthYear),
    kind,
    classId,
    topUpheaval,
    minority ? "min" : "maj",
  ].join(":");

  return {
    birth,
    awakening: awakeningText,
    weekLead: weekText,
    outline,
    slotIds,
    yearBand: yearBand(birthYear),
    kind,
    classId,
    upheavalId: topUpheaval,
    pulseId: pulse?.id || null,
    pulseTitle: pulse?.title || "",
    eraName: (getEraForYear(birthYear) || {}).name || "",
    eventOutlines: [
      eventOutline("opening", yearBand(birthYear), topUpheaval),
      eventOutline("opening-kind", kind, classId),
      pulse ? eventOutline("history", pulse.id) : null,
      playWorld.upheaval?.id
        ? eventOutline("world", "crisis", (playWorld.upheaval.threads || [])[0] || playWorld.upheaval.id)
        : null,
    ].filter(Boolean),
    weekConsumed: false,
    pulseNarrated: false,
  };
}

export function composeOpeningDossier(rng, character, options = {}) {
  if (!character) {
    return { birth: "", awakening: "", weekLead: "", outline: "", slotIds: [] };
  }
  if (character.openingDossier?.birth && options.reuse !== false) {
    return character.openingDossier;
  }
  const roll = typeof rng === "function" ? rng : rngFromCharacter(character);
  const remember = options.remember !== false;
  let best = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = assembleOnce(roll, character);
    if (!openingComboOnCooldown(candidate.outline, candidate.slotIds)) {
      best = candidate;
      break;
    }
    if (!best) best = candidate;
  }
  const dossier = best || assembleOnce(roll, character);
  if (remember) {
    seedSessionCooldown(character);
    rememberSessionOpening({
      outline: dossier.outline,
      slotIds: dossier.slotIds,
      stems: [dossier.birth, dossier.awakening, dossier.weekLead].map((text) => String(text || "").slice(0, 32)),
      eventOutlines: dossier.eventOutlines,
      yearBand: dossier.yearBand,
      kind: dossier.kind,
      classId: dossier.classId,
      upheavalId: dossier.upheavalId,
    });
  }
  character.openingDossier = dossier;
  return dossier;
}

export function consumeOpeningWeekLead(character) {
  const dossier = character?.openingDossier;
  if (!dossier?.weekLead || dossier.weekConsumed) return "";
  dossier.weekConsumed = true;
  return dossier.weekLead;
}

export function describeOpeningBirth(character, rng) {
  const dossier = composeOpeningDossier(rng, character, { remember: false, reuse: true });
  return dossier.birth || "";
}
