import { ethnicityTag } from "./tag-schema.js";
import { namesFromKey } from "./name-packs.js";

/**
 * Compact ethnicity factory. `names` can be a pack key or a full names object.
 */
export function eth(id, label, labelEn, rarity, regions, traits, observation, names = "english", statBias = {}, extra = {}) {
  const namesObj = typeof names === "string" ? namesFromKey(names) : names;
  return {
    id,
    tag: ethnicityTag(id),
    label,
    labelEn,
    rarity,
    regions: [].concat(regions),
    traits: [].concat(traits),
    observation,
    names: namesObj,
    namesKey: typeof names === "string" ? names : extra.namesKey || null,
    statBias,
    family: extra.family || null,
    contact: extra.contact || "open",
    isolatedClosed: false,
    ...extra,
  };
}
