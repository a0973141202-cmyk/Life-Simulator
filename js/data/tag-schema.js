/**
 * Canonical tag namespaces for the life simulator.
 * All innate, inherited, and acquired flags should be stored as tags.
 *
 * Examples:
 *   ethnicity_inuit
 *   trait_barometric_sense
 *   parent_trait_math_aptitude
 *   parent_father_deceased
 *   lineage_mixed
 *   acquired_diligent_study
 *   hook_weather
 */

export const TAG_PREFIX = Object.freeze({
  ethnicity: "ethnicity_",
  trait: "trait_",
  parentTrait: "parent_trait_",
  parent: "parent_",
  lineage: "lineage_",
  acquired: "acquired_",
  hook: "hook_",
  climate: "climate_",
  class: "class_",
  settlement: "settlement_",
  region: "region_",
  date: "date_",
  env: "env_",
  hemisphere: "hemisphere_",
  current: "current_",
  condition: "condition_",
  risk: "risk_",
  socio: "socio_",
  mood: "mood_",
  path: "path_",
  crime: "crime_",
  politics: "politics_",
  ledger: "ledger_",
  daily: "daily_",
  household: "household_",
  trauma: "trauma_",
  school: "school_",
  caste: "caste_",
  adult: "adult_",
  world: "world_",
  figure: "figure_",
  social: "social_",
  wealth: "wealth_",
  kin: "kin_",
  persona: "persona_",
});

export function ethnicityTag(id) {
  return id.startsWith(TAG_PREFIX.ethnicity) ? id : `${TAG_PREFIX.ethnicity}${id}`;
}

export function traitTag(id) {
  return id.startsWith(TAG_PREFIX.trait) ? id : `${TAG_PREFIX.trait}${id}`;
}

export function parentTraitTag(id) {
  return id.startsWith(TAG_PREFIX.parentTrait) ? id : `${TAG_PREFIX.parentTrait}${id}`;
}

export function hookTag(id) {
  return id.startsWith(TAG_PREFIX.hook) ? id : `${TAG_PREFIX.hook}${id}`;
}

export function acquiredTag(id) {
  return id.startsWith(TAG_PREFIX.acquired) ? id : `${TAG_PREFIX.acquired}${id}`;
}

export function inferCategory(tag) {
  if (!tag) return "misc";
  for (const [category, prefix] of Object.entries(TAG_PREFIX)) {
    if (tag.startsWith(prefix)) return category;
  }
  return "misc";
}

export function stripPrefix(tag) {
  const category = inferCategory(tag);
  const prefix = TAG_PREFIX[category];
  return prefix ? tag.slice(prefix.length) : tag;
}

export function makeTagRecord(partial) {
  const id = partial.id;
  if (!id) throw new Error("Tag record requires id");
  return {
    id,
    category: partial.category || inferCategory(id),
    label: partial.label || id,
    source: partial.source || "system",
    reason: partial.reason || "",
    hooks: partial.hooks ? partial.hooks.slice() : [],
    modifiers: partial.modifiers ? { ...partial.modifiers } : {},
    ethnicityId: partial.ethnicityId || null,
    parentRole: partial.parentRole || null,
    inherited: Boolean(partial.inherited),
    hidden: Boolean(partial.hidden),
    temporary: Boolean(partial.temporary),
    permanent: Boolean(partial.permanent),
    goldCore: Boolean(partial.goldCore),
    valence: partial.valence || "contextual",
    advantageIn: partial.advantageIn ? partial.advantageIn.slice() : [],
    strainIn: partial.strainIn ? partial.strainIn.slice() : [],
    data: partial.data || null,
  };
}
