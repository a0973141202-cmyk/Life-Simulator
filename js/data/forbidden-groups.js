/**
 * Groups that must never enter the ethnicity pool:
 * completely isolated peoples with no ongoing interaction with the outside world.
 */
export const FORBIDDEN_ETHNICITY_IDS = Object.freeze([
  "sentinelese",
  "north_sentinel",
  "north_sentinel_islanders",
  "north_sentinelese",
  "sentinel_islanders",
  "jarawa_uncontacted",
  "mashco_piro",
]);

export const FORBIDDEN_ETHNICITY_RE = /north[_\s-]*sentinel|south[_\s-]*sentinel|sentinelese|sentinel_island|mashco[\s-]?piro|北哨兵|北センチネル|完全無法接觸/i;

export function isForbiddenEthnicity(def) {
  if (!def) return true;
  if (def.contact === "closed_uncontacted") return true;
  if (def.isolatedClosed) return true;
  const blob = `${def.id || ""} ${def.tag || ""} ${def.label || ""} ${def.labelEn || ""} ${def.labelJa || ""}`;
  if (FORBIDDEN_ETHNICITY_IDS.includes(def.id) || FORBIDDEN_ETHNICITY_IDS.includes(def.tag)) return true;
  return FORBIDDEN_ETHNICITY_RE.test(blob);
}

export const FORBIDDEN_NOTE = "已排除北哨兵島及其他無戶籍、無公開文獻、現代文明完全無法接觸的極端孤立部落。出生點僅限 1920–2025 年歷史地圖與戶籍可及之城鎮或聚居地。";
