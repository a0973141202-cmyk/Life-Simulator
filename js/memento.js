/**
 * Death dossier → a compact memorial card.
 * Weeks are counted from the birth date to the closing date.
 * Street-visible trauma / rare marks only — no designer taxonomy.
 */
import { composeLifeResolution } from "./life-resolution.js";
import { daysBetween } from "./data/calendar.js";
import { publicTagLabel, isDebugCode } from "./data/ui-zh.js";
import { inferCategory } from "./data/tag-schema.js";

const MEMORIAL_PREFIXES = Object.freeze([
  "trauma_",
  "figure_",
  "world_",
  "acquired_",
  "path_",
  "caste_",
  "school_",
  "adult_",
]);

const SKIP_IDS = Object.freeze([
  "acquired_plague_antibody",
]);

function weeksLivedOf(character, time = {}) {
  const birth = character?.birthDate;
  const endYear = Number(time.year);
  const endMonth = Number(time.month);
  const endDay = Number(time.day);
  if (birth?.year && Number.isFinite(endYear) && Number.isFinite(endMonth) && Number.isFinite(endDay)) {
    const days = daysBetween(birth, { year: endYear, month: endMonth, day: endDay });
    if (Number.isFinite(days) && days >= 0) return Math.max(1, Math.round(days / 7));
  }
  const age = Number(time.ageYears ?? character?.ageYears ?? 0);
  return Math.max(1, Math.round(age * 52));
}

export function collectMemorialTags(character = {}) {
  const records = character.tagRecords || [];
  const ids = records.length ? records : (character.tags || []).map((id) => ({ id, category: inferCategory(id) }));
  const picked = [];
  const seen = new Set();
  for (const record of ids) {
    const id = String(record.id || "");
    if (!id || record.hidden || SKIP_IDS.includes(id)) continue;
    if (!MEMORIAL_PREFIXES.some((prefix) => id.startsWith(prefix))) continue;
    const label = publicTagLabel(record) || publicTagLabel({ id, label: record.label });
    if (!label || isDebugCode(label) || seen.has(label)) continue;
    seen.add(label);
    picked.push({
      id,
      label,
      category: record.category || inferCategory(id),
    });
    if (picked.length >= 16) break;
  }
  return picked;
}

export function hallCardId(card = {}) {
  return [
    card.seed ?? "anon",
    card.birthYear ?? "x",
    card.endYear ?? "x",
    card.name || "未名",
    card.weeksLived ?? 0,
  ].join("·");
}

export function composeMementoCard({
  character,
  time,
  ending,
  resolution,
  seed,
  turnCount,
} = {}) {
  const res = resolution || ending?.resolution || composeLifeResolution({
    character,
    time,
    kind: ending?.kind || "death",
    fatal: ending?.fatal !== false,
    reason: ending?.reason || "",
    detail: ending?.detail || "",
  });
  const weeksLived = weeksLivedOf(character, time);
  const fortnightsLived = Math.max(
    0,
    Number(time?.totalTurnsLived ?? time?.totalWeeksLived ?? turnCount ?? 0),
  );
  const card = {
    id: "",
    seed: seed ?? null,
    name: res.name,
    birthplace: res.birthplace,
    birthYear: res.birthYear,
    endYear: res.endYear,
    ageYears: res.ageYears,
    weeksLived,
    fortnightsLived,
    weeksLine: `存活 ${weeksLived} 週`,
    fatal: Boolean(res.fatal ?? ending?.fatal),
    kind: res.kind || ending?.kind || "death",
    title: res.title,
    kicker: res.kicker,
    cause: res.cause,
    eraPressure: res.eraPressure,
    ageLine: res.ageLine,
    yearLine: res.yearLine,
    tags: collectMemorialTags(character),
    savedAt: Date.now(),
  };
  card.id = hallCardId(card);
  return card;
}

export { weeksLivedOf };
