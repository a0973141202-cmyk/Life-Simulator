/**
 * Contextual industry polarity for macro shocks.
 * Maps upheaval threads → occupation sector → personal benefit / harm.
 * Protective / ride-wave tags tilt polarity without hardcoded option scripts.
 */

/** @typedef {"benefit"|"harm"|"neutral"} ImpactPolarity */

export const INDUSTRY_SECTORS = Object.freeze([
  "labor",
  "office",
  "commerce",
  "politics",
  "military",
  "neet",
  "underworld",
]);

/**
 * Base polarity by upheaval thread × career sector.
 * Values: benefit | harm | neutral
 */
export const THREAD_SECTOR_POLARITY = Object.freeze({
  unemployment: Object.freeze({
    labor: "harm",
    office: "harm",
    commerce: "harm",
    politics: "neutral",
    military: "neutral",
    neet: "harm",
    underworld: "benefit",
  }),
  devaluation: Object.freeze({
    labor: "harm",
    office: "harm",
    commerce: "benefit",
    politics: "neutral",
    military: "neutral",
    neet: "harm",
    underworld: "benefit",
  }),
  war: Object.freeze({
    labor: "harm",
    office: "harm",
    commerce: "harm",
    politics: "benefit",
    military: "benefit",
    neet: "harm",
    underworld: "benefit",
  }),
  conscription: Object.freeze({
    labor: "harm",
    office: "harm",
    commerce: "harm",
    politics: "neutral",
    military: "benefit",
    neet: "harm",
    underworld: "neutral",
  }),
  flight: Object.freeze({
    labor: "harm",
    office: "harm",
    commerce: "neutral",
    politics: "harm",
    military: "harm",
    neet: "harm",
    underworld: "benefit",
  }),
  purge: Object.freeze({
    labor: "harm",
    office: "harm",
    commerce: "harm",
    politics: "harm",
    military: "neutral",
    neet: "harm",
    underworld: "benefit",
  }),
});

/** Tags that blunt harm or open ride-wave slots under matching threads. */
export const IMPACT_TAG_TILTS = Object.freeze([
  Object.freeze({
    tags: ["persona_quit_ahead", "persona_high_roller"],
    threads: ["devaluation", "unemployment"],
    tilt: "benefit",
    weight: 1.4,
  }),
  Object.freeze({
    tags: ["persona_hardy", "persona_shimokita_labor", "persona_principled"],
    threads: ["unemployment", "war", "flight"],
    tilt: "shield",
    weight: 1.2,
  }),
  Object.freeze({
    tags: ["persona_absolute_freedom", "persona_banana_legend", "persona_meme_dancer", "persona_brazil_samba", "persona_invincible_smile"],
    threads: ["unemployment", "devaluation", "flight"],
    tilt: "benefit",
    weight: 1.35,
  }),
  Object.freeze({
    tags: ["persona_aniki_wrestle", "persona_loyal_bond", "persona_brotherhood", "persona_biochem"],
    threads: ["war", "conscription", "purge"],
    tilt: "shield",
    weight: 1.25,
  }),
  Object.freeze({
    tags: ["persona_beast_senpai", "persona_114514", "persona_onmad_classic"],
    threads: ["unemployment", "devaluation"],
    tilt: "benefit",
    weight: 1.15,
  }),
  Object.freeze({
    tags: ["world_informant", "path_crime", "adult_underworld_base"],
    threads: ["purge", "war", "unemployment"],
    tilt: "benefit",
    weight: 1.1,
  }),
  Object.freeze({
    tags: ["world_mass_layoff", "world_devaluation", "world_listed", "socio_war_displacement"],
    threads: ["unemployment", "devaluation", "flight", "war"],
    tilt: "harm",
    weight: 1.2,
  }),
]);

/** World tags stamped when the player rides or absorbs a shock. */
export const IMPACT_OUTCOME_TAGS = Object.freeze({
  benefit: Object.freeze(["world_ride_wave"]),
  harm: Object.freeze(["world_shock_scar"]),
  shield: Object.freeze(["world_shock_brace"]),
});

export function polarityScore(polarity) {
  if (polarity === "benefit") return 1;
  if (polarity === "harm") return -1;
  return 0;
}

export function mergePolarity(a, b) {
  const sum = polarityScore(a) + polarityScore(b);
  if (sum >= 1) return "benefit";
  if (sum <= -1) return "harm";
  return "neutral";
}
