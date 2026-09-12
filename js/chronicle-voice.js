/**
 * Weekly chronicle assembler. One fortnight, one record.
 * Birth / awakening dossiers stay in the journal file, not in 本期紀事.
 */
import {
  composeFortnightRecord,
  composePeriodChronicle,
  composeSituationLine,
  composeStageClause,
} from "./dynamic-prose.js";
import { scanNarrativeFacts } from "./narrative-facts.js";
import { rememberTriggeredEvent } from "./event-memory.js";
import { getSettlementDisplayName } from "./settlements.js";
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
  const settlement = ctx.settlement || null;
  const year = ctx.year || ctx.time?.year || "";
  const city = settlement
    ? getSettlementDisplayName(settlement, year)
    : (ctx.character?.cityName || "此地");
  const country = ctx.character?.country || "";
  return {
    year: year || "這一",
    city,
    place: country ? `${country}，${city}` : city,
    season: ctx.environment?.seasonLabel || ctx.season || "這一季",
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

function chronicleFingerprint(text) {
  const compact = String(text || "").replace(/\s/g, "");
  if (/水腫/.test(compact) && /腿/.test(compact)) return "edema-body";
  if (/冷毛巾/.test(compact) && /燒/.test(compact)) return "fever-body";
  if (/時局/.test(compact)) return `pulse:${compact.slice(0, 22)}`;
  return compact.slice(0, 22);
}

export function assembleWeeklyChronicle(rng, parts, ctx) {
  if (!ctx.narrativeFacts) ctx.narrativeFacts = scanNarrativeFacts(ctx);
  const seen = new Set();
  const lines = [];
  const push = (part) => {
    const text = String(part || "").trim();
    if (!text) return;
    if (PRIOR_LIFE_RE.test(text) && lines.length) return;
    const key = chronicleFingerprint(text);
    if (seen.has(key)) return;
    seen.add(key);
    lines.push(text);
  };
  push(composeFortnightRecord(rng, ctx));
  for (const part of parts || []) push(part);
  const joined = lines.filter(Boolean).join("\n");
  if (ctx.character && joined) {
    rememberTriggeredEvent(ctx.character, { stem: joined.slice(0, 40) }, ctx);
  }
  return joined;
}

export { composePeriodChronicle, scanNarrativeFacts };
