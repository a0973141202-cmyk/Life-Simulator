import { YEAR_MAX, YEAR_MIN } from "./constants.js";
import { isValidGregorianDate } from "./data/calendar.js";
import { isDateInSettlementWindow } from "./data/date-lock.js";
import { SETTLEMENT_CATALOG, SETTLEMENT_PACKS } from "./data/settlements/index.js";
import {
  getSettlementCountry,
  getSettlementDisplayName,
  getSettlementEthnicities,
  localizeSettlement,
} from "./data/settlements/schema.js";

export { SETTLEMENT_PACKS };
export {
  getSettlementCountry,
  getSettlementDisplayName,
  getSettlementEthnicities,
  localizeSettlement,
};

/**
 * Completely closed, uncontacted, or interaction-impossible places.
 * These must never enter the birth pool — including aliases.
 */
export const FORBIDDEN_SETTLEMENT_IDS = Object.freeze([
  "north_sentinel",
  "north_sentinel_island",
  "northsentinel",
  "north_sentinelese",
  "sentinelese",
  "sentinel_island",
  "south_sentinel",
  "south_sentinel_island",
  "andaman_sentinel",
  "jarawa_uncontacted",
  "mashco_piro",
]);

export const FORBIDDEN_NAME_RE = /北哨兵|north\s*sentinel|south\s*sentinel|sentinelese|sentinel\s*island|mashco[\s-]?piro|closed_uncontacted|完全無法接觸|北センチネル/i;

export const SETTLEMENT_KINDS = Object.freeze([
  "metropolis",
  "city",
  "port",
  "industrial",
  "village",
  "slum",
  "arctic",
  "underground",
  "warzone",
  "camp",
  "planned_capital",
]);

/**
 * Global settlement catalog. `availableFrom` / `availableTo` are inclusive
 * civil-habitation windows. A place cannot be rolled if the birth year
 * falls outside that window. Name, country, and local peoples resolve
 * through localizeSettlement(year).
 */
export const SETTLEMENTS = SETTLEMENT_CATALOG;

export function isForbiddenSettlement(settlement) {
  if (!settlement) return true;
  if (settlement.isolatedClosed) return true;
  if (settlement.contact === "closed_uncontacted") return true;
  if (FORBIDDEN_SETTLEMENT_IDS.includes(settlement.id)) return true;
  const blob = `${settlement.id} ${(settlement.names || []).map((n) => n.name).join(" ")}`;
  return FORBIDDEN_NAME_RE.test(blob);
}

export function isSettlementAvailable(settlement, year, month, day) {
  if (isForbiddenSettlement(settlement)) return false;
  if (!Number.isFinite(year)) return false;
  if (year < settlement.availableFrom || year > settlement.availableTo) return false;
  if (month == null || day == null) return true;
  if (!isValidGregorianDate(year, month, day)) return false;
  return isDateInSettlementWindow(settlement, year, month, day);
}

export function getEligibleSettlements(year, catalog = SETTLEMENTS, date) {
  if (date?.year && date?.month && date?.day) {
    return catalog.filter((item) => isSettlementAvailable(item, date.year, date.month, date.day));
  }
  return catalog.filter((item) => isSettlementAvailable(item, year));
}

export function findSettlement(id, catalog = SETTLEMENTS) {
  return catalog.find((item) => item.id === id);
}

export function assertSettlementLegal(settlement, year, month, day) {
  if (isForbiddenSettlement(settlement)) {
    throw new Error(`Settlement blocked by isolation/exclusion rule: ${settlement?.id}`);
  }
  if (!isSettlementAvailable(settlement, year, month, day)) {
    const stamp = month && day ? `${year}-${month}-${day}` : String(year);
    throw new Error(`Settlement ${settlement?.id} is not historically available on ${stamp}`);
  }
  return true;
}

export { YEAR_MIN, YEAR_MAX };
