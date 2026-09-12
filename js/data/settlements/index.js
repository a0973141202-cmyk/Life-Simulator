/**
 * Modular settlement catalog. Add a pack file and list it here —
 * engines keep importing SETTLEMENTS from js/settlements.js.
 */
import { EAST_ASIA } from "./east-asia.js";
import { SOUTHEAST_ASIA } from "./southeast-asia.js";
import { SOUTH_ASIA } from "./south-asia.js";
import { INNER_ASIA } from "./inner-asia.js";
import { MIDDLE_EAST } from "./middle-east.js";
import { EUROPE } from "./europe.js";
import { AFRICA } from "./africa.js";
import { AMERICAS } from "./americas.js";
import { OCEANIA } from "./oceania.js";
import { ARCTIC } from "./arctic.js";

export const SETTLEMENT_PACKS = {
  eastAsia: EAST_ASIA,
  southeastAsia: SOUTHEAST_ASIA,
  southAsia: SOUTH_ASIA,
  innerAsia: INNER_ASIA,
  middleEast: MIDDLE_EAST,
  europe: EUROPE,
  africa: AFRICA,
  americas: AMERICAS,
  oceania: OCEANIA,
  arctic: ARCTIC,
};

function assemble(packs) {
  const seen = new Set();
  const out = [];
  for (const pack of Object.values(packs)) {
    for (const item of pack) {
      if (seen.has(item.id)) {
        throw new Error(`Duplicate settlement id: ${item.id}`);
      }
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

export const SETTLEMENT_CATALOG = assemble(SETTLEMENT_PACKS);
