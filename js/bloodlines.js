/**
 * Bloodline registry: logic layer over ethnicity / trait / aptitude databases.
 * Data lives in js/data/* — this file only indexes, validates, and extends it.
 */

import { ETHNICITY_DATABASE } from "./data/ethnicities-database.js";
import { FORBIDDEN_NOTE, isForbiddenEthnicity } from "./data/forbidden-groups.js";
import { PARENT_APTITUDE_DATABASE } from "./data/parent-aptitudes-database.js";
import { CONDITION_DATABASE } from "./data/conditions-database.js";
import { ethnicityTag, traitTag } from "./data/tag-schema.js";
import { TRAIT_DATABASE } from "./data/traits-database.js";

function cloneTrait(item) {
  return {
    ...item,
    hooks: item.hooks.slice(),
    tags: (item.tags || item.hooks).slice(),
    statMods: { ...(item.statMods || {}) },
    eventModifiers: { ...(item.eventModifiers || {}) },
  };
}

function cloneEthnicity(item) {
  return {
    ...item,
    tag: item.tag || ethnicityTag(item.id),
    regions: item.regions.slice(),
    traits: item.traits.slice(),
    statBias: { ...(item.statBias || {}) },
    names: item.names
      ? {
        surnames: item.names.surnames.slice(),
        givenM: item.names.givenM.slice(),
        givenF: item.names.givenF.slice(),
        order: item.names.order,
      }
      : item.names,
  };
}

export function createBloodlineRegistry({
  ethnicities = ETHNICITY_DATABASE,
  traits = TRAIT_DATABASE,
  aptitudes = PARENT_APTITUDE_DATABASE,
  conditions = CONDITION_DATABASE,
} = {}) {
  const traitList = traits.map(cloneTrait);
  const aptitudeList = aptitudes.map((item) => ({ ...item, hooks: item.hooks.slice(), statMods: { ...item.statMods } }));
  const conditionList = conditions.map((item) => ({
    ...item,
    hooks: (item.hooks || []).slice(),
    advantageIn: (item.advantageIn || []).slice(),
    strainIn: (item.strainIn || []).slice(),
    ancestryHooks: (item.ancestryHooks || []).slice(),
    statMods: { ...(item.statMods || {}) },
    expressedStatMods: { ...(item.expressedStatMods || {}) },
  }));
  const ethnicityList = ethnicities.filter((item) => !isForbiddenEthnicity(item)).map(cloneEthnicity);

  const traitById = new Map(traitList.map((item) => [item.id, item]));
  const ethnicityById = new Map(ethnicityList.map((item) => [item.id, item]));
  const aptitudeById = new Map(aptitudeList.map((item) => [item.id, item]));
  const conditionById = new Map(conditionList.map((item) => [item.id, item]));

  function reindex() {
    traitById.clear();
    ethnicityById.clear();
    aptitudeById.clear();
    conditionById.clear();
    for (const item of traitList) traitById.set(item.id, item);
    for (const item of ethnicityList) ethnicityById.set(item.id, item);
    for (const item of aptitudeList) aptitudeById.set(item.id, item);
    for (const item of conditionList) conditionById.set(item.id, item);
  }

  return {
    ethnicities: ethnicityList,
    traits: traitList,
    aptitudes: aptitudeList,
    conditions: conditionList,
    forbiddenNote: FORBIDDEN_NOTE,

    getEthnicity(id) {
      return ethnicityById.get(id) ?? ethnicityById.get(id?.replace(/^ethnicity_/, "")) ?? null;
    },
    getTrait(id) {
      const key = id?.replace(/^trait_/, "") || id;
      return traitById.get(key) ?? traitById.get(id) ?? null;
    },
    getAptitude(id) {
      const key = id?.replace(/^parent_trait_/, "") || id;
      return aptitudeById.get(key) ?? aptitudeById.get(id) ?? null;
    },
    getCondition(id) {
      const key = id?.replace(/^risk_/, "").replace(/^condition_/, "") || id;
      return conditionById.get(key) ?? conditionById.get(id) ?? null;
    },

    registerTrait(def) {
      if (!def?.id || !def.label) throw new Error("Trait requires id and label");
      const normalized = cloneTrait({
        tag: traitTag(def.id),
        description: "",
        observation: "",
        hooks: [],
        tags: [],
        statMods: {},
        eventModifiers: {},
        ...def,
      });
      const existing = traitById.get(normalized.id);
      if (existing) Object.assign(existing, normalized);
      else traitList.push(normalized);
      reindex();
      return normalized;
    },

    registerEthnicity(def) {
      if (!def?.id || !def.label) throw new Error("Ethnicity requires id and label");
      if (isForbiddenEthnicity(def)) {
        throw new Error(`Refuse to register forbidden/isolated ethnicity: ${def.id}`);
      }
      const normalized = cloneEthnicity({
        rarity: "uncommon",
        regions: [],
        traits: [],
        statBias: {},
        observation: "",
        contact: "open",
        tag: ethnicityTag(def.id),
        ...def,
        traits: (def.traits || []).filter((id) => traitById.has(id) || def.allowUnknownTraits),
      });
      const existing = ethnicityById.get(normalized.id);
      if (existing) Object.assign(existing, normalized);
      else ethnicityList.push(normalized);
      reindex();
      return normalized;
    },

    registerAptitude(def) {
      if (!def?.id || !def.label) throw new Error("Aptitude requires id and label");
      const normalized = { inheritChance: 0.46, hooks: [], statMods: {}, ...def };
      const existing = aptitudeById.get(normalized.id);
      if (existing) Object.assign(existing, normalized);
      else aptitudeList.push(normalized);
      reindex();
      return normalized;
    },

    registerCondition(def) {
      if (!def?.id || !def.label) throw new Error("Condition requires id and label");
      const normalized = {
        inheritMode: "polygenic",
        hooks: [],
        advantageIn: [],
        strainIn: ["health"],
        ancestryHooks: [],
        carrierChance: 0.35,
        expressedChance: 0.1,
        ...def,
      };
      const existing = conditionById.get(normalized.id);
      if (existing) Object.assign(existing, normalized);
      else conditionList.push(normalized);
      reindex();
      return normalized;
    },

    traitsForEthnicity(id) {
      const eth = this.getEthnicity(id);
      if (!eth) return [];
      return eth.traits.map((traitId) => this.getTrait(traitId)).filter(Boolean);
    },

    ethnicitiesInRegion(region) {
      return ethnicityList.filter((item) => item.regions.includes(region));
    },
  };
}

export const defaultBloodlineRegistry = createBloodlineRegistry();

export const ETHNICITIES = defaultBloodlineRegistry.ethnicities;
export const TRAITS = defaultBloodlineRegistry.traits;
export const PARENT_APTITUDES = defaultBloodlineRegistry.aptitudes;
