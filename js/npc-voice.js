/**
 * NPC speech layer.
 *
 * System narration stays plain. Quoted speech follows the speaker's class,
 * temper, and how they presently like / dislike / fear the protagonist.
 * Slang and stammering are character. The gloss names the actual demand.
 */

import { NPC_VOICES } from "./data/npc-voices.js";
import { NPC_GLOSS_NOTE } from "./data/prose-rules.js";
import { socialStanding } from "./social-feedback.js";
import { pick } from "./rng.js";
import { ctxHasTag } from "./choice-pool.js";

export { NPC_VOICES };
export { NPC_GLOSS_NOTE };

const FIGURE_SPEAKER = Object.freeze({
  politician: "orator",
  military: "officer",
  scientist: "scholar",
  artist: "orator",
  socialite: "orator",
  crime: "gangster",
});

function tagsOf(ctx) {
  return ctx?.tags || ctx?.character?.tags || [];
}

function hasTag(ctx, id) {
  return ctxHasTag({ ...ctx, tags: tagsOf(ctx) }, id);
}

function upheavalOf(ctx) {
  return ctx?.upheaval || ctx?.character?.upheavalState || {};
}

function minorityMarked(ctx) {
  const constitution = ctx?.constitution || ctx?.character?.constitution;
  if (constitution?.minority || constitution?.mixed) return true;
  if (hasTag(ctx, "lineage_mixed") || hasTag(ctx, "socio_war_displacement") || hasTag(ctx, "world_listed")) return true;
  return (tagsOf(ctx) || []).some((tag) => String(tag).startsWith("ethnicity_"));
}

function saltOf(ctx, incident) {
  const time = ctx?.time || {};
  const year = time.year ?? ctx?.year ?? 0;
  const week = time.week ?? ctx?.week ?? 0;
  const lived = time.totalWeeksLived ?? ctx?.totalWeeksLived ?? 0;
  const name = ctx?.character?.name || "";
  const classId = ctx?.character?.familyClassId || ctx?.familyClassId || "";
  return (
    year * 53 +
    week * 9 +
    lived +
    String(incident?.id || incident?.kind || "").length * 3 +
    name.length +
    (classId === "peasant" || classId === "worker" || classId === "immigrant" ? 1 : 0)
  );
}

function pickRow(rows, rng, salt) {
  if (!rows?.length) return null;
  if (typeof rng === "function") return pick(rng, rows) || rows[0];
  return rows[Math.abs(Math.trunc(salt)) % rows.length];
}

export function resolveNpcSpeaker(ctx = {}, incident = {}) {
  if (incident.speaker) return incident.speaker;

  const role = incident.figureRole || incident.figure?.roles?.[0];
  if (incident.figureName || incident.figureEncounter || incident.figureId || role) {
    return FIGURE_SPEAKER[role] || "orator";
  }

  const worldKind = incident.worldKind || incident.kind;
  if (incident.worldEvent || incident.worldEventId) {
    const threads = incident.threads || upheavalOf(ctx).threads || [];
    if (threads.includes("conscription") || threads.includes("war")) return "officer";
    if (threads.includes("unemployment")) return "foreman";
    if (threads.includes("devaluation")) return "merchant";
    if (threads.includes("flight")) return "officer";
    if (threads.includes("purge")) return "authority";
    if (worldKind === "dark") return "gangster";
    if (worldKind === "household") return "household";
    if (worldKind === "historical") return "orator";
    if (worldKind === "labor") return "foreman";
    if (worldKind === "survival") {
      const id = String(incident.id || incident.worldEventId || "");
      if (ctx?.geoBand === "warzone" || /war|shell|raid|strafe|checkpoint|curfew|draft|border/.test(id)) return "officer";
      if (/flu|plague|sars|covid|quarantine|pox/.test(id)) return "clerk";
      return "civilian";
    }
    return "civilian";
  }

  if (incident.adultIncident || incident.adultIncidentId) {
    const sector = incident.adultSector || incident.sector;
    const kind = incident.adultKind || incident.kind;
    if (sector === "underworld" || kind === "crime" || kind === "gang") return "gangster";
    if (sector === "politics" || kind === "politics") return "orator";
    if (sector === "office") return "clerk";
    if (sector === "commerce") return "merchant";
    if (sector === "labor" || kind === "labor" || kind === "burnout") return "foreman";
    if (sector === "neet") return "civilian";
    return "clerk";
  }

  if (incident.schoolIncident || incident.schoolIncidentId) {
    const kind = incident.schoolKind || incident.kind;
    if (kind === "power") return "authority";
    const playerAggressor = hasTag(ctx, "school_bully") || hasTag(ctx, "school_ringleader");
    if (playerAggressor) return "civilian";
    if (kind === "gang" || kind === "extreme" || kind === "bullying") return "bully";
    return "bully";
  }

  if (incident.daily || incident.phase === "social" || incident.trauma) {
    if (incident.trauma || String(incident.id || "").includes("trauma")) return "household";
    if (hasTag(ctx, "path_crime") || hasTag(ctx, "adult_underworld_base")) return "gangster";
    if (incident.state === "office_white" || incident.state === "politics_machine") return "clerk";
    if (incident.state === "commerce_floor") return "merchant";
    if (incident.state === "labor_legal") return "foreman";
    if (incident.state === "school_child" || incident.state === "school_teen") {
      return hasTag(ctx, "school_bully") || hasTag(ctx, "school_ringleader") ? "civilian" : "bully";
    }
    if (incident.state === "home_child" || incident.state === "home_family") return "household";
    if (incident.state === "prison" || incident.state === "prison_caste") return "authority";
    if (incident.state === "underworld_cover") return "gangster";
    return "civilian";
  }

  if (hasTag(ctx, "path_crime") || hasTag(ctx, "acquired_wanted")) return "authority";
  return "civilian";
}

export const resolveSpeakerKind = resolveNpcSpeaker;

export function attitudeTowardPlayer(ctx = {}, speaker = "civilian") {
  const ledger = ctx.ledger || ctx.character?.ledger || {};
  const standing = socialStanding(ledger);
  const band = standing.band;
  const wanted = ledger.wanted || 0;
  const heat = ledger.heat || 0;
  const upheaval = upheavalOf(ctx);
  const tier = upheaval.tier || 0;
  const othered = minorityMarked(ctx);
  const official = speaker === "authority" || speaker === "officer" || speaker === "clerk";

  if (official && (wanted >= 36 || heat >= 48)) {
    return "hunt";
  }
  if (speaker === "gangster" && wanted >= 55 && band === "feared") return "hunt";
  if (band === "feared") {
    if (speaker === "gangster" || speaker === "bully") return "probe";
    return "fear";
  }
  if (tier >= 2 && official && othered && band !== "trusted" && band !== "courted") {
    return band === "feared" ? "fear" : "disdain";
  }
  if (tier >= 2 && speaker === "civilian" && (band === "shunned" || band === "cold")) {
    return "disdain";
  }
  if (tier >= 2 && (band === "trusted" || band === "courted") && (speaker === "civilian" || speaker === "household" || speaker === "merchant" || speaker === "foreman")) {
    return "trust";
  }
  if (band === "shunned") return "disdain";
  if (band === "cold") return speaker === "civilian" ? "fear" : "disdain";
  if (band === "trusted") return "trust";
  if (band === "courted") return speaker === "gangster" || speaker === "merchant" ? "probe" : "trust";
  if (speaker === "bully" && (hasTag(ctx, "school_bullied") || hasTag(ctx, "school_hated"))) return "disdain";
  return "ordinary";
}

export function speakNpc(ctx = {}, incident = {}, rng = null) {
  if (incident?.muteNpc || incident?.npcSpeech === false) return null;
  const speaker = resolveNpcSpeaker(ctx, incident);
  const attitude = attitudeTowardPlayer(ctx, speaker);
  const pack = NPC_VOICES[speaker] || NPC_VOICES.civilian;
  const rows = pack[attitude] || pack.ordinary || [];
  const row = pickRow(rows, rng, saltOf(ctx, incident));
  if (!row) return null;
  const who = incident.figureName || row.who || pack.label;
  return {
    speaker,
    attitude,
    who,
    quote: row.quote,
    gloss: row.gloss,
  };
}

export function formatNpcSpeech(speech) {
  if (!speech?.quote) return "";
  const who = speech.who ? `——${speech.who}。` : "。";
  return `「${speech.quote}」${who}${speech.gloss}`;
}

export function attachNpcSpeech(systemText, ctx = {}, incident = {}, rng = null) {
  const body = String(systemText || "").trim();
  if (!body) return "";
  const speech = speakNpc(ctx, incident, rng);
  const line = formatNpcSpeech(speech);
  if (!line) return body;
  return `${body}\n${line}`;
}
