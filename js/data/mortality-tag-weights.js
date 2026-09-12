/**
 * Tag / trait / condition weights on weekly survival.
 * Positive delta = more death. Multipliers stack by multiplication after sum of deltas.
 * Adaptations never cancel violence.
 */

export const MORTALITY_TAG_WEIGHTS = Object.freeze([
  { tags: ["socio_extreme_poverty"], disease: 0.35, hunger: 0.55, accident: 0.15, violence: 0.12, environment: 0.1 },
  { tags: ["socio_working_poor"], disease: 0.18, hunger: 0.25, accident: 0.08 },
  { tags: ["socio_war_displacement"], violence: 0.28, disease: 0.15, hunger: 0.2, accident: 0.1 },
  { tags: ["socio_gentry_estate", "socio_official_network"], disease: -0.12, hunger: -0.18, environment: -0.05 },
  { tags: ["household_neglect"], disease: 0.22, accident: 0.2, hunger: 0.18, environment: 0.08 },
  { tags: ["household_alcohol"], accident: 0.12, violence: 0.1, disease: 0.06 },
  { tags: ["household_volatile"], violence: 0.12, accident: 0.08 },
  { tags: ["household_extractive"], accident: 0.1, disease: 0.08, hunger: 0.06 },
  { tags: ["trauma_cannot_ask_help", "trauma_flinch_body"], accident: 0.08, violence: 0.06 },
  { tags: ["adult_burnout", "adult_breakdown"], disease: 0.12, accident: 0.1, senescence: 0.08 },
  { tags: ["adult_labor_injury"], accident: 0.18, disease: 0.08 },
  { tags: ["adult_debt"], hunger: 0.1, disease: 0.05, violence: 0.08 },
  { tags: ["adult_liquidated_mark"], violence: 0.45 },
  { tags: ["acquired_wanted", "path_crime"], violence: 0.2, accident: 0.08 },
  { tags: ["acquired_imprisoned"], violence: 0.15, disease: 0.12, accident: 0.1 },
  { tags: ["condition_sickle_trait", "condition_thalassemia_trait"], disease: 0.25, environment: 0.1 },
  { tags: ["condition_g6pd_deficiency"], disease: 0.12 },
  { tags: ["condition_asthma_atopy"], disease: 0.14, environment: 0.08 },
  { tags: ["condition_diabetes_t2_risk"], disease: 0.1, senescence: 0.06 },
  { tags: ["condition_hypertension_risk"], disease: 0.08, senescence: 0.08 },
  { tags: ["condition_hemophilia_carrier"], accident: 0.25, violence: 0.15, disease: 0.08 },
  { tags: ["condition_high_hematocrit"], disease: 0.06, accident: 0.04 },
  { tags: ["school_weapon"], violence: 0.12, accident: 0.08 },
  { tags: ["caste_contaminate"], violence: 0.2, accident: 0.1 },
  { tags: ["world_stray_fire", "world_shelter_line"], violence: 0.22, accident: 0.1 },
  { tags: ["world_famine_witness"], hunger: 0.28, disease: 0.12, accident: 0.04 },
  { tags: ["world_plague_queue", "world_epidemic_mark"], disease: 0.2, accident: 0.04 },
  { tags: ["world_slum_tax", "world_collapse_dust"], accident: 0.12, violence: 0.1, disease: 0.08 },
  { tags: ["world_arctic_exposure"], environment: 0.35, accident: 0.12, disease: 0.08 },
  { tags: ["world_heat_exposure"], environment: 0.28, disease: 0.1, accident: 0.08 },
  { tags: ["world_looter", "world_street_lookout"], violence: 0.16, accident: 0.08 },
  { tags: ["world_raid_night", "world_listed", "world_checkpoint"], violence: 0.1, accident: 0.06 },
  { tags: ["world_extractive_child", "world_child_labor_street"], accident: 0.1, disease: 0.06, hunger: 0.05 },
  { tags: ["figure_hunted", "figure_butterfly"], violence: 0.28, accident: 0.12 },
  { tags: ["figure_failed_hand"], violence: 0.18, accident: 0.08 },
]);

/** Matching environment/disease only. Never applied to violence. */
export const ADAPTATION_WEIGHTS = Object.freeze([
  { tags: ["trait_polar_thermogenesis", "trait_cold_hands_craft", "trait_ice_acoustic_read"], hooks: ["arctic"], environment: -0.4, accident: -0.12, disease: -0.08 },
  { tags: ["trait_altitude_epas1", "trait_altitude_hemoglobin", "trait_mountain_foot"], hooks: ["altitude"], environment: -0.35, disease: -0.08 },
  { tags: ["trait_heat_slender_build", "trait_humidity_pace", "trait_desert_thrift"], hooks: ["desert", "heat"], environment: -0.3, disease: -0.08, hunger: -0.05 },
  { tags: ["trait_malaria_belt"], hooks: ["malaria", "tropics"], disease: -0.18 },
  { tags: ["condition_high_hematocrit", "risk_high_hematocrit"], hooks: ["altitude"], environment: -0.12 },
  { tags: ["trait_conflict_stillness"], hooks: ["war"], accident: -0.08 },
  { tags: ["trait_iron_shift"], hooks: ["labor"], accident: -0.06, environment: -0.05 },
]);

export const HEALTH_DISEASE_CURVE = Object.freeze({
  causes: ["disease", "hunger", "senescence", "accident"],
  /** health 0 → 2.4×, health 100 → 0.82×. Never a zero. Never touches violence. */
  at0: 2.4,
  at100: 0.82,
});

export const WEALTH_HUNGER_CURVE = Object.freeze({
  causes: ["hunger", "disease"],
  at0: 1.55,
  at100: 0.78,
});
