/**
 * Derived constitution from bloodline: zygosity, tolerances, minority status.
 * Does not replace genesis inheritance — it snapshots what already rolled.
 */

import { getSettlementEthnicities } from "./settlements.js";

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function hookHits(hooks, needles) {
  const set = new Set(hooks || []);
  return needles.reduce((sum, needle) => sum + (set.has(needle) ? 1 : 0), 0);
}

export function localEthnicityIds(settlement, year) {
  return (getSettlementEthnicities(settlement, year) || []).map((item) => (
    typeof item === "string" ? item : item?.id
  )).filter(Boolean);
}

export function isLocalMinority(character, settlement = null, year = null) {
  const bloodline = character?.bloodline || {};
  const primary = bloodline.primaryEthnicityId;
  const local = localEthnicityIds(settlement || { ethnicities: character?.settlementEthnicities }, year ?? character?.birthYear);
  if (bloodline.mixed) return true;
  if (!primary) return false;
  if (!local.length) return false;
  if (!local.includes(primary)) return true;
  return local[0] !== primary;
}

export function buildConstitution(character, settlement = null, year = null) {
  const bloodline = character?.bloodline || {};
  const traits = bloodline.traits || character?.traitDetails || [];
  const conditions = bloodline.conditions || character?.conditions || [];
  const aptitudes = bloodline.parentTraits || character?.parentTraits || [];
  const genes = [];

  for (const cond of conditions) {
    genes.push({
      id: cond.id,
      kind: "condition",
      zygosity: cond.expressed ? "expressed" : "carrier",
      inheritMode: cond.inheritMode || "polygenic",
      dominant: cond.inheritMode === "autosomal_dominant" || Boolean(cond.dominant),
      recessive: cond.inheritMode === "autosomal_recessive" && !cond.expressed,
      latent: Boolean(cond.carrier && !cond.expressed),
      advantageIn: (cond.advantageIn || []).slice(),
      strainIn: (cond.strainIn || []).slice(),
      hooks: (cond.hooks || []).slice(),
    });
  }

  for (const trait of traits) {
    const both = trait.inheritedFrom === "both";
    genes.push({
      id: trait.id,
      kind: "trait",
      zygosity: trait.zygosity || (both ? "homozygous" : "heterozygous"),
      inheritMode: "autosomal_dominant",
      dominant: true,
      recessive: false,
      latent: false,
      advantageIn: (trait.hooks || []).slice(),
      strainIn: [],
      hooks: (trait.hooks || []).slice(),
    });
  }

  for (const apt of aptitudes) {
    genes.push({
      id: apt.id,
      kind: "aptitude",
      zygosity: "expressed",
      inheritMode: "polygenic",
      dominant: false,
      recessive: false,
      latent: false,
      advantageIn: (apt.hooks || []).slice(),
      strainIn: [],
      hooks: (apt.hooks || []).slice(),
    });
  }

  const hooks = [
    ...(bloodline.hooks || []),
    ...genes.flatMap((row) => row.hooks),
  ];
  const strain = genes.flatMap((row) => row.strainIn);
  const advantage = genes.flatMap((row) => row.advantageIn);
  const expressedWeak = genes.some((row) => row.kind === "condition" && row.zygosity === "expressed");
  const hardyLabor = hookHits(hooks, ["labor", "health"]) + (aptitudes.some((row) => row.id === "athletic_endurance" || row.id === "pain_stoic") ? 2 : 0);

  return {
    genes,
    mixed: Boolean(bloodline.mixed),
    minority: isLocalMinority(character, settlement, year),
    primaryEthnicityId: bloodline.primaryEthnicityId || null,
    culturalHooks: [...new Set(hooks)],
    tolerance: {
      cold: clamp(50 + hookHits(hooks, ["arctic"]) * 14 - (strain.includes("cold") ? 12 : 0)),
      heat: clamp(50 + hookHits(hooks, ["desert"]) * 12 - (strain.includes("industrial") ? 6 : 0)),
      altitude: clamp(50 + hookHits(hooks, ["altitude"]) * 16 - (strain.includes("altitude") || strain.includes("hypoxia") ? 18 : 0)),
      labor: clamp(48 + hardyLabor * 8 - (strain.includes("labor") ? 16 : 0) - (expressedWeak ? 8 : 0)),
      famine: clamp(50 + (advantage.includes("famine") || advantage.includes("scarcity") ? 14 : 0) - (expressedWeak ? 6 : 0)),
      infection: clamp(50 + (advantage.includes("malaria") || hooks.includes("malaria") ? 12 : 0) - (expressedWeak ? 10 : 0)),
      hypoxia: clamp(50 + hookHits(hooks, ["altitude", "sea"]) * 8 - (strain.includes("hypoxia") ? 20 : 0)),
    },
    hardy: hardyLabor >= 2 && !expressedWeak,
  };
}

export function ensureConstitution(character, settlement = null, year = null) {
  if (!character) return buildConstitution({}, settlement, year);
  if (!character.constitution) {
    character.constitution = buildConstitution(character, settlement, year);
  }
  return character.constitution;
}
