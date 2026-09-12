/**
 * Weekly chronicle assembler. One fortnight, one record.
 * Birth / awakening dossiers stay in the journal file, not in 本期紀事.
 */
import {
  composeFortnightRecord,
  composePeriodChronicle,
  composeSituationLine,
  composeStageClause,
  lockChronicleToClock,
} from "./dynamic-prose.js";
import { scanNarrativeFacts } from "./narrative-facts.js";
import { rememberTriggeredEvent } from "./event-memory.js";
import { getSettlementCountry, getSettlementDisplayName } from "./settlements.js";
import { publicTagLabel } from "./data/ui-zh.js";

const PRIOR_LIFE_RE = /落地|第一次分得清|前兩週開始按|意識萌芽|一名[男女]嬰/;

function ancestryLabel(ctx = {}) {
  const row = ctx.character?.bloodline?.ancestries?.[0];
  if (row?.label) return row.label;
  const tag = (ctx.tags || []).find((item) => String(item).startsWith("ethnicity_"));
  if (!tag) return "";
  return publicTagLabel({ id: tag }) || tag.replace(/^ethnicity_/, "");
}

export function chronicleContext(ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const settlement = ctx.settlement || null;
  const year = facts.year || ctx.year || ctx.time?.year || "";
  const city = facts.city || (settlement
    ? getSettlementDisplayName(settlement, year)
    : (ctx.character?.cityName || "此地"));
  const country = facts.country || ctx.country
    || (settlement ? getSettlementCountry(settlement, year) : "")
    || ctx.character?.country
    || "";
  return {
    year: year || "這一",
    city,
    place: country ? `${country}，${city}` : city,
    season: facts.season || ctx.environment?.seasonLabel || ctx.season || "這一季",
    ancestry: ancestryLabel(ctx),
  };
}

export function fillChronicle(template, ctx = {}) {
  const bits = chronicleContext(ctx);
  return String(template || "")
    .replace(/\{year\}/g, String(bits.year))
    .replace(/\{city\}/g, bits.city)
    .replace(/\{place\}/g, bits.place)
    .replace(/\{season\}/g, bits.season)
    .replace(/\{ancestry\}/g, bits.ancestry || "家裏帶來的口音");
}

export function pickFreshLine(rng, _pool, ctx = {}, character = null) {
  const next = { ...ctx, character: character || ctx.character };
  return composeSituationLine(rng, next);
}

export function chronicleOpener(rng, ctx) {
  return composeFortnightRecord(rng, ctx);
}

export function chronicleStageLine(rng, ctx) {
  return composeStageClause(rng, ctx);
}

export function chronicleSituationLine(rng, ctx) {
  return composeSituationLine(rng, ctx);
}

export function chronicleStitch(rng, ctx) {
  return composeSituationLine(rng, ctx);
}

export function dressChronicleParagraph(rng, text, ctx = {}) {
  const raw = String(text || "").trim();
  if (!raw) return composeSituationLine(rng, ctx);
  return raw;
}

export function chronicleLineKey(text) {
  const compact = String(text || "").replace(/\s/g, "");
  if (!compact) return "";
  if (/水腫/.test(compact) && /腿/.test(compact)) return "edema-body";
  if (/冷毛巾/.test(compact) && /燒/.test(compact)) return "fever-body";
  if (/時局/.test(compact)) return `pulse:${compact.slice(0, 22)}`;
  return compact.slice(0, 22);
}

function chronicleFingerprint(text) {
  return chronicleLineKey(text);
}

function currentYearOf(ctx = {}) {
  return Number(ctx.narrativeFacts?.year || ctx.year || ctx.time?.year || 0);
}

function isCurrentFortnightText(text, year) {
  const raw = String(text || "").trim();
  if (!raw || PRIOR_LIFE_RE.test(raw)) return false;
  const years = [...raw.matchAll(/((?:1[89]|20)\d{2})\s*年/g)].map((row) => Number(row[1]));
  if (year && years.some((stamp) => stamp !== year)) return false;
  return true;
}

export function assembleWeeklyChronicle(rng, parts, ctx) {
  if (!ctx.narrativeFacts) ctx.narrativeFacts = scanNarrativeFacts(ctx);
  const facts = ctx.narrativeFacts;
  const year = facts.year || currentYearOf(ctx);
  const seen = new Set();
  const lines = [];
  const push = (part) => {
    for (const chunk of String(part || "").split("\n")) {
      const locked = lockChronicleToClock(chunk.trim(), facts);
      if (!isCurrentFortnightText(locked, year)) continue;
      const key = chronicleLineKey(locked);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      lines.push(locked);
    }
  };
  push(composeFortnightRecord(rng, ctx));
  for (const part of parts || []) push(part);
  const joined = lines.join("\n");
  if (ctx.character && joined) {
    rememberTriggeredEvent(ctx.character, { stem: joined.slice(0, 40) }, ctx);
  }
  return joined;
}

export { composePeriodChronicle, composeFortnightRecord, scanNarrativeFacts };
