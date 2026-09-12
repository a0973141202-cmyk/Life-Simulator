/**
 * Settlement record factory and year-local geography.
 * Catalog packs live beside this file; core engines stay in js/settlements.js.
 */
import { YEAR_MAX, YEAR_MIN } from "../../constants.js";
import { SETTLEMENT_COORDS, SETTLEMENT_FOUNDING } from "../settlement-geo.js";
import { hemisphereFromLat } from "../seasons.js";

export const REGION_LAT = {
  china: 32, taiwan: 24, hongkong: 22, japan: 36, korea: 37, mongolia: 47,
  se_asia: 8, south_asia: 22, middle_east: 32, russia: 56, west: 48,
  latin_america: -15, africa: 6, oceania: -28, arctic: 70,
};

export function nameBand(from, to, name) {
  return { from, to, name };
}

export function countryBand(from, to, country) {
  return { from, to, country };
}

export function ethnicityBand(from, to, ethnicities) {
  return { from, to, ethnicities };
}

function defaultCountryBands(region, country, from, to) {
  const start = Math.max(from, YEAR_MIN);
  const end = to;
  if (region === "china" && (!country || country === "中國")) {
    const rows = [];
    if (start <= 1948) rows.push({ from: start, to: Math.min(end, 1948), country: "中華民國" });
    if (end >= 1949) rows.push({ from: Math.max(start, 1949), to: end, country: "中華人民共和國" });
    if (rows.length) return rows;
  }
  return [{ from: start, to: end, country: country || "" }];
}

function pickBand(rows, year) {
  if (!rows?.length) return null;
  const y = Number(year);
  if (!Number.isFinite(y)) return rows[rows.length - 1];
  const hit = rows.find((row) => y >= row.from && y <= row.to);
  if (hit) return hit;
  if (y < rows[0].from) return rows[0];
  return rows[rows.length - 1];
}

export function s({
  id,
  name,
  names,
  from = 0,
  to = YEAR_MAX,
  kind = "city",
  region,
  country,
  countries,
  flavor,
  tags = [],
  ethnicities = [],
  ethnicityBands = null,
  weight = 5,
  climate = "temperate",
  contact = "open",
  lat,
  lon,
  fromMonth,
  fromDay,
  toMonth,
  toDay,
}) {
  const geo = SETTLEMENT_COORDS[id] || {};
  const founding = SETTLEMENT_FOUNDING[id] || {};
  const resolvedLat = Number.isFinite(lat) ? lat : (Number.isFinite(geo.lat) ? geo.lat : (REGION_LAT[region] ?? 30));
  const resolvedLon = Number.isFinite(lon) ? lon : (Number.isFinite(geo.lon) ? geo.lon : 0);
  const nameRows = names || [{ from: Math.max(from, YEAR_MIN), to, name }];
  const countryRows = (countries && countries.length)
    ? countries
    : defaultCountryBands(region, country, from, to);
  return {
    id,
    names: nameRows,
    availableFrom: from,
    availableTo: to,
    kind,
    region,
    country,
    countries: countryRows,
    flavor,
    tags,
    ethnicities,
    ethnicityBands,
    weight,
    climate,
    contact,
    isolatedClosed: false,
    lat: resolvedLat,
    lon: resolvedLon,
    hemisphere: hemisphereFromLat(resolvedLat),
    fromMonth: fromMonth ?? founding.fromMonth ?? null,
    fromDay: fromDay ?? founding.fromDay ?? null,
    toMonth: toMonth ?? founding.toMonth ?? null,
    toDay: toDay ?? founding.toDay ?? null,
  };
}

export function getSettlementDisplayName(settlement, year) {
  if (!settlement?.names?.length) return settlement?.id ?? "未知聚落";
  const row = pickBand(settlement.names, year);
  return row?.name ?? settlement.names[settlement.names.length - 1].name;
}

export function getSettlementCountry(settlement, year) {
  if (!settlement) return "";
  const row = pickBand(settlement.countries, year);
  return row?.country || settlement.country || "";
}

export function getSettlementEthnicities(settlement, year) {
  if (!settlement) return [];
  const row = pickBand(settlement.ethnicityBands, year);
  if (row?.ethnicities?.length) return row.ethnicities;
  return settlement.ethnicities || [];
}

/** Snapshot used at birth / move: name, polity, and local peoples for that year. */
export function localizeSettlement(settlement, year) {
  if (!settlement) return settlement;
  return {
    ...settlement,
    country: getSettlementCountry(settlement, year),
    ethnicities: getSettlementEthnicities(settlement, year),
    displayName: getSettlementDisplayName(settlement, year),
  };
}
