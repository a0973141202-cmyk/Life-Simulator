/**
 * Cultural naming engine.
 *
 * Majority groups keep their language pack.
 * Minority / indigenous groups keep a dedicated pack. A dated overlay
 * (forced registry, boarding school, colonial koseki) may replace or hybridize
 * the name — that is a survival trace, not a random majority assignment.
 */

import { namesFromKey, namePackForCountry, packFromEthnicity } from "./data/name-packs.js";
import { eraBandFor, isMinorityNameKey } from "./data/minority-name-rules.js";
import { getSettlementCountry, getSettlementEthnicities } from "./data/settlements/schema.js";
import { chance, pick } from "./rng.js";

export { isMinorityNameKey };

export function resolveNamingEthnicity(registry, settlement, ancestries = [], father = null, mother = null, year = null) {
  const ranked = [...(ancestries || [])].sort((a, b) => (b.share || 0) - (a.share || 0));
  for (const row of ranked) {
    const eth = registry.getEthnicity(row.id);
    if (eth) return eth;
  }
  if (father?.primaryEthnicityId) {
    const eth = registry.getEthnicity(father.primaryEthnicityId);
    if (eth) return eth;
  }
  if (mother?.primaryEthnicityId) {
    const eth = registry.getEthnicity(mother.primaryEthnicityId);
    if (eth) return eth;
  }
  const localId = getSettlementEthnicities(settlement, year)[0] || settlement?.ethnicities?.[0];
  return (localId && registry.getEthnicity(localId)) || null;
}

function traditionalKey(ethnicity, band) {
  return band?.traditional || ethnicity?.namesKey || null;
}

export function resolveEraNamePack(ethnicity, year, rng, settlement = null) {
  const key = ethnicity?.namesKey;
  const country = getSettlementCountry(settlement, year) || settlement?.country;
  const band = eraBandFor(key, ethnicity?.id, year, country);
  const traditional = namesFromKey(traditionalKey(ethnicity, band)) || packFromEthnicity(ethnicity);
  if (!band || !band.overlay) {
    return { pack: traditional, style: "traditional", overlay: null };
  }
  const overlayPack = namesFromKey(band.overlay);
  if (!overlayPack || !traditional) {
    return { pack: traditional || overlayPack, style: "traditional", overlay: null };
  }
  if (typeof rng === "function" && chance(rng, band.overlayChance || 0)) {
    if (band.hybrid === "overlay-given") {
      return {
        pack: {
          surnames: traditional.surnames,
          givenM: overlayPack.givenM,
          givenF: overlayPack.givenF,
          order: overlayPack.order || traditional.order,
        },
        style: "hybrid",
        overlay: band.overlay,
      };
    }
    return { pack: overlayPack, style: "overlay", overlay: band.overlay };
  }
  return { pack: traditional, style: "traditional", overlay: null };
}

function renderName(pack, gender, rng) {
  if (!pack?.surnames?.length) return "無名";
  const surname = pick(rng, pack.surnames);
  const givenPool = gender === "female" ? pack.givenF : pack.givenM;
  const given = pick(rng, givenPool);
  if (pack.order === "given-surname") return `${given}·${surname}`;
  const extra = rng() < 0.35 && pack.order === "surname-given" ? pick(rng, givenPool) : "";
  return `${surname}${given}${extra || ""}`;
}

export function composeCulturalName(ethnicity, gender, rng, settlement = null, year = null) {
  const resolved = resolveEraNamePack(ethnicity, year ?? 1920, rng, settlement);
  const pack = resolved.pack
    || packFromEthnicity(ethnicity)
    || (isMinorityNameKey(ethnicity?.namesKey) ? null : namePackForCountry(getSettlementCountry(settlement, year ?? 1920) || settlement?.country));
  return {
    name: renderName(pack, gender, rng),
    style: resolved.style,
    overlay: resolved.overlay,
    namesKey: ethnicity?.namesKey || null,
    ethnicityId: ethnicity?.id || null,
  };
}

export function formatCulturalName(ethnicity, gender, rng, settlement = null, year = null) {
  return composeCulturalName(ethnicity, gender, rng, settlement, year).name;
}
