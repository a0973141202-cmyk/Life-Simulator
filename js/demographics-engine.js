/**
 * Historical demographic sampling for genesis:
 * world/region/country population weights, ethnicity shares, and
 * a fail-closed 「國家，城市/聚落」 birthplace stamp.
 */
import { pickWeighted } from "./rng.js";
import {
  getSettlementCountry,
  getSettlementDisplayName,
  localizeSettlement,
} from "./data/settlements/schema.js";
import {
  countryPopulationMillions,
  countryTokens,
  interpolateSeries,
  isRuralKind,
  kindPopulationMult,
  LOCAL_ETHNICITY_SHARES,
  RARITY_DEMOGRAPHIC_MULT,
  regionPopulationMillions,
  worldUrbanShare,
} from "./data/historical-demographics.js";

const KIND_ZH = {
  metropolis: "大都會",
  city: "城市",
  port: "港口",
  industrial: "工業聚落",
  village: "農村",
  slum: "貧民窟",
  arctic: "極地聚落",
  underground: "地下聚落",
  warzone: "戰亂區",
  camp: "難民／流離營區",
  planned_capital: "規劃首都",
};

export function canonicalizeCountry(country, year, region) {
  let out = String(country || "").trim();
  const y = Number(year);
  if (!out && region === "china") {
    out = y <= 1948 ? "中華民國" : "中華人民共和國";
  }
  if (out === "中國") {
    out = y <= 1948 ? "中華民國" : "中華人民共和國";
  }
  if (Number.isFinite(y) && y <= 1948) {
    out = out.replace(/(^|／)中國(?=／|$)/g, "$1中華民國");
  } else if (Number.isFinite(y)) {
    out = out.replace(/(^|／)中國(?=／|$)/g, "$1中華人民共和國");
  }
  return out;
}

function alreadyRuralName(city) {
  return /農村|漁村|鄉村|村$|鎮$|聚落$|穴居/.test(city);
}

export function formatPlaceLabel(country, city, fallback = "") {
  const ctry = String(country || "").trim();
  const town = String(city || "").trim();
  if (ctry && town) return `${ctry}，${town}`;
  if (String(fallback || "").trim()) return String(fallback).trim();
  if (ctry) return ctry;
  if (town) return town;
  return "";
}

export function formatBirthplace(settlement, year) {
  if (!settlement) {
    throw new Error("Birthplace requires a documented settlement");
  }
  const loc = localizeSettlement(settlement, year);
  const cityRaw = loc.displayName || getSettlementDisplayName(settlement, year);
  const countryRaw = loc.country || getSettlementCountry(settlement, year) || settlement.country;
  const country = canonicalizeCountry(countryRaw, year, loc.region || settlement.region);
  if (!country || !cityRaw) {
    throw new Error(`Incomplete documented birthplace for ${settlement.id} in ${year}`);
  }
  let city = cityRaw;
  if (settlement.kind === "village" && !alreadyRuralName(city)) {
    city = `${city}農村`;
  }
  const label = formatPlaceLabel(country, city);
  if (!label.includes("，")) {
    throw new Error(`Birthplace must be 國家，城市 for ${settlement.id}`);
  }
  return {
    country,
    city,
    cityOfficial: cityRaw,
    kind: settlement.kind,
    kindLabel: KIND_ZH[settlement.kind] || settlement.kind,
    label,
    documented: true,
  };
}

export function assertDocumentedBirthplace(place, settlement) {
  if (!place?.label || !place.country || !place.city || !String(place.label).includes("，")) {
    throw new Error(`Illegal blank/vague birthplace: ${settlement?.id}`);
  }
  if (/未知|未名地點|模糊|空白/.test(place.label)) {
    throw new Error(`Vague birthplace blocked: ${place.label}`);
  }
  return place;
}

export function settlementDemographicWeight(settlement, year, eligible = null) {
  if (!settlement) return 0;
  const country = canonicalizeCountry(
    getSettlementCountry(settlement, year) || settlement.country,
    year,
    settlement.region,
  );
  const countryPop = countryPopulationMillions(country, year);
  const regionPop = regionPopulationMillions(settlement.region, year);
  const base = countryPop > 0 ? countryPop : regionPop || 1;
  const peers = (eligible || [settlement]).filter((item) => {
    if (countryPop > 0) {
      const other = canonicalizeCountry(
        getSettlementCountry(item, year) || item.country,
        year,
        item.region,
      );
      const tokens = new Set(countryTokens(country));
      return countryTokens(other).some((token) => tokens.has(token)) || other === country;
    }
    return item.region === settlement.region;
  });
  const peerN = Math.max(peers.length, 1);
  const local = Number(settlement.weight) > 0 ? Number(settlement.weight) : 1;
  return (base / peerN) * kindPopulationMult(settlement.kind, year) * (local / 5);
}

export function pickSettlementByDemographics(rng, eligible, year) {
  if (!eligible?.length) return undefined;
  const rural = eligible.filter((item) => isRuralKind(item.kind));
  const urban = eligible.filter((item) => !isRuralKind(item.kind));
  let pool = eligible;
  if (rural.length && urban.length) {
    const ruralMass = rural.reduce((sum, item) => sum + settlementDemographicWeight(item, year, eligible), 0);
    const urbanMass = urban.reduce((sum, item) => sum + settlementDemographicWeight(item, year, eligible), 0);
    const catalogRural = ruralMass / (ruralMass + urbanMass + 1e-9);
    const targetRural = 1 - worldUrbanShare(year);
    const pRural = Math.min(0.82, Math.max(0.08, catalogRural * 0.55 + targetRural * 0.45));
    pool = rng() < pRural ? rural : urban;
  }
  return pickWeighted(rng, pool, (item) => settlementDemographicWeight(item, year, eligible));
}

export function ethnicityDemographicWeight(ethnicity, index, listLength, year) {
  const slot = LOCAL_ETHNICITY_SHARES[index]
    ?? LOCAL_ETHNICITY_SHARES[LOCAL_ETHNICITY_SHARES.length - 1] / Math.max(1, listLength);
  const rarity = RARITY_DEMOGRAPHIC_MULT[ethnicity?.rarity] ?? 0.08;
  const majorityBoost = index === 0 ? 1 : 1;
  // Year is reserved for future census curves; local lists already change via ethnicityBands.
  void year;
  void majorityBoost;
  return Math.max(0.004, slot * rarity);
}

export { interpolateSeries, worldUrbanShare };
