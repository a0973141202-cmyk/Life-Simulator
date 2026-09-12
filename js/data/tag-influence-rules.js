/**
 * Weighted tag influence: a choice may be touched by at most three live tags.
 * The weekly triad must keep a tag-free baseline so fate stays unpredictable.
 */

export const MAX_TAGS_PER_CHOICE = 3;
export const MAX_TAGGED_TRIAD_SLOTS = 2;
export const MIN_UNTAGGED_TRIAD_SLOTS = 1;

export const STRAIN_PREFIXES = Object.freeze([
  "trauma_",
  "crime_",
  "condition_",
  "risk_",
  "household_",
  "caste_",
]);

export const ADVANTAGE_PREFIXES = Object.freeze([
  "trait_",
  "parent_trait_",
]);

export const STRAIN_TAG_IDS = Object.freeze([
  "socio_extreme_poverty",
  "socio_working_poor",
  "socio_war_displacement",
  "socio_refugee_camp",
  "socio_slum_density",
  "socio_immigrant_insecurity",
  "social_feared",
  "social_shunned",
  "social_cold",
  "mood_depressed",
  "acquired_wanted",
  "acquired_imprisoned",
  "lineage_mixed",
]);

export const ADVANTAGE_TAG_IDS = Object.freeze([
  "social_trusted",
  "social_courted",
  "socio_merchant_capital",
  "socio_official_network",
  "socio_gentry_estate",
  "socio_intellectual_house",
  "trait_craft_finger",
]);
