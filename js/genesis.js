import { STAT_KEYS, YEAR_MAX, YEAR_MIN, clampStat } from "./constants.js";
import { betaOverlaySnapshot, effectiveGenesisYearRange } from "./life-bounds.js";
import { FAMILY_CLASSES } from "./data.js";
import { dateFromWeek, formatDate, parseDateInput } from "./data/calendar.js";
import { randomBirthDateForSettlement } from "./data/date-lock.js";
import { natalEnvironmentTags } from "./data/seasons.js";
import { socioTagsForOrigin } from "./data/socio-tags-database.js";
import { emptyMoodState } from "./data/mood-tags-database.js";
import { rollHouseholdClimate } from "./data/household-climate.js";
import { ethnicityTag, hookTag, parentTraitTag, traitTag } from "./data/tag-schema.js";
import { FORBIDDEN_NOTE } from "./data/forbidden-groups.js";
import { defaultBloodlineRegistry } from "./bloodlines.js";
import { createLedger } from "./ledger.js";
import { emptyTraumaState } from "./trauma-engine.js";
import { emptySchoolState, rollSchoolClimate } from "./school-engine.js";
import { emptyCasteState } from "./perp-caste-engine.js";
import { emptyCareerState } from "./adult-engine.js";
import { emptyWorldEventState } from "./world-event-engine.js";
import { emptyHistoryState } from "./history-engine.js";
import { emptyLifeProgress } from "./life-stage-manager.js";
import { chance, createRng, pick, pickWeighted, randInt, randomSeed } from "./rng.js";
import { TagStore, uniqueTags } from "./tag-system.js";
import { zhClimate, zhRegion } from "./data/ui-zh.js";
import { formatCulturalName, composeCulturalName, resolveNamingEthnicity } from "./naming-engine.js";
import { buildConstitution } from "./constitution.js";
import {
  FORBIDDEN_SETTLEMENT_IDS,
  SETTLEMENTS,
  assertSettlementLegal,
  getEligibleSettlements,
  getSettlementCountry,
  getSettlementDisplayName,
  getSettlementEthnicities,
  isForbiddenSettlement,
  isSettlementAvailable,
  localizeSettlement,
  SETTLEMENT_PACKS,
} from "./settlements.js";
import {
  assertDocumentedBirthplace,
  ethnicityDemographicWeight,
  formatBirthplace,
  pickSettlementByDemographics,
} from "./demographics-engine.js";
import { composeOpeningDossier } from "./opening-chronicle.js";
import { emptyTextHistory } from "./text-history.js";
import { emptyExclusion } from "./exclusion-buffer.js";

const CLASS_KIND_WEIGHTS = {
  metropolis: { merchant: 1.5, worker: 1.3, intellectual: 1.3, official: 1.2, immigrant: 1.3, peasant: 0.25, gentry: 1.1 },
  city: { artisan: 1.2, worker: 1.2, merchant: 1.1, intellectual: 1.1, peasant: 0.45 },
  port: { merchant: 1.6, worker: 1.3, immigrant: 1.7, artisan: 1.1, peasant: 0.3 },
  industrial: { worker: 2.2, artisan: 1.2, immigrant: 1.2, peasant: 0.25, gentry: 0.4 },
  village: { peasant: 2.4, artisan: 1.3, military: 0.8, merchant: 0.6, official: 0.5, gentry: 0.7 },
  slum: { worker: 1.7, immigrant: 2.0, artisan: 1.1, peasant: 0.5, merchant: 0.6, gentry: 0.08, official: 0.15 },
  arctic: { peasant: 1.4, worker: 1.4, immigrant: 1.3, military: 1.1, artisan: 1.0, merchant: 0.7, gentry: 0.2 },
  underground: { worker: 1.6, artisan: 1.5, peasant: 0.8, immigrant: 1.1, gentry: 0.3 },
  warzone: { military: 1.9, peasant: 1.3, immigrant: 1.4, worker: 1.1, official: 0.7, gentry: 0.4 },
  camp: { immigrant: 2.6, peasant: 1.3, worker: 1.1, artisan: 0.8, gentry: 0.05, official: 0.2 },
  planned_capital: { official: 1.9, intellectual: 1.4, worker: 1.3, merchant: 1.1, peasant: 0.3 },
};

function unique(list) {
  return uniqueTags(list);
}

function rollParentConditions(rng, registry, ancestries) {
  const pool = registry.conditions || [];
  if (!pool.length) return [];
  const ancestryHooks = new Set();
  for (const row of ancestries) {
    const eth = registry.getEthnicity(row.id);
    for (const traitId of eth?.traits || []) {
      const trait = registry.getTrait(traitId);
      for (const hook of trait?.hooks || []) ancestryHooks.add(hook);
      ancestryHooks.add(traitId);
    }
  }
  const weighted = pool.map((item) => {
    let weight = 1;
    for (const hook of item.ancestryHooks || []) {
      if (ancestryHooks.has(hook)) weight += 3;
    }
    return { ...item, weight };
  });
  const count = rng() < 0.55 ? 1 : rng() < 0.35 ? 2 : 0;
  const picked = [];
  const used = new Set();
  let guard = 0;
  while (picked.length < count && used.size < weighted.length && guard < 30) {
    guard += 1;
    const item = pickWeighted(rng, weighted);
    if (!item || used.has(item.id)) continue;
    used.add(item.id);
    const expressed = item.xLinked ? chance(rng, 0.35) : chance(rng, item.expressedChance * 0.5);
    picked.push({
      id: item.id,
      tag: item.tag,
      expressedTag: item.expressedTag,
      label: item.label,
      expressedLabel: item.expressedLabel,
      description: item.description,
      observation: item.observation,
      inheritMode: item.inheritMode,
      xLinked: item.xLinked,
      hooks: (item.hooks || []).slice(),
      advantageIn: (item.advantageIn || []).slice(),
      strainIn: (item.strainIn || []).slice(),
      carrierChance: item.carrierChance,
      expressedChance: item.expressedChance,
      expressed,
      statMods: { ...(expressed ? item.expressedStatMods : item.statMods) },
    });
  }
  return picked;
}

function rollParentAptitudes(rng, registry) {
  const pool = registry.aptitudes || [];
  if (!pool.length) return [];
  const count = randInt(rng, 2, 4);
  const picked = [];
  const used = new Set();
  let guard = 0;
  while (picked.length < count && used.size < pool.length && guard < 40) {
    const item = pick(rng, pool);
    guard += 1;
    if (!item || used.has(item.id)) continue;
    used.add(item.id);
    picked.push({
      id: item.id,
      tag: item.tag || parentTraitTag(item.id),
      label: item.label,
      description: item.description,
      hooks: item.hooks.slice(),
      statMods: { ...item.statMods },
      inheritChance: item.inheritChance ?? 0.46,
    });
  }
  return picked;
}

function rollRange(rng, range) {
  const lo = Array.isArray(range) ? range[0] : 40;
  const hi = Array.isArray(range) ? range[1] : 70;
  return randInt(rng, lo, hi);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function countryTokens(country) {
  return String(country || "")
    .split(/[／/、（）()]/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
}

function countriesOverlap(a, b) {
  const left = new Set(countryTokens(a));
  return countryTokens(b).some((token) => left.has(token));
}

function localEthnicityIds(settlement, year) {
  return getSettlementEthnicities(settlement, year).filter(Boolean);
}

function formatName(ethnicity, gender, rng, settlement = null, year = null) {
  return formatCulturalName(ethnicity, gender, rng, settlement, year);
}

function resolveLocalNamingEthnicity(registry, settlement, ancestries = [], father = null, mother = null, year = null) {
  return resolveNamingEthnicity(registry, settlement, ancestries, father, mother, year);
}

function pickParentOrigin(rng, childSettlement, settlements, originYear, familyClass, childBirthYear) {
  const eligible = getEligibleSettlements(Math.max(YEAR_MIN, originYear), settlements)
    .filter((item) => item.id !== childSettlement.id);
  const childCountry = getSettlementCountry(childSettlement, childBirthYear);
  const sameCountry = eligible.filter((item) => countriesOverlap(getSettlementCountry(item, originYear), childCountry));
  const sameRegion = eligible.filter((item) => item.region === childSettlement.region);
  const open = childSettlement.kind === "port"
    || childSettlement.kind === "metropolis"
    || childSettlement.kind === "camp";
  const immigrantHousehold = familyClass?.id === "immigrant";
  const camp = childSettlement.kind === "camp";
  const migrantChance = camp ? 0.4 : immigrantHousehold ? 0.48 : open ? 0.16 : 0.06;
  if (!chance(rng, migrantChance) || !eligible.length) return childSettlement;
  if (sameCountry.length && (!camp && !immigrantHousehold || chance(rng, 0.72))) {
    return pickSettlementByDemographics(rng, sameCountry, originYear) || pickWeighted(rng, sameCountry);
  }
  if ((camp || immigrantHousehold || open) && sameRegion.length) {
    return pickSettlementByDemographics(rng, sameRegion, originYear) || pickWeighted(rng, sameRegion);
  }
  if (sameCountry.length) {
    return pickSettlementByDemographics(rng, sameCountry, originYear) || pickWeighted(rng, sameCountry);
  }
  return childSettlement;
}

function eraTag(year) {
  if (year <= 1935) return "舊世界出身";
  if (year <= 1965) return "戰後一代";
  if (year <= 1985) return "轉型一代";
  if (year <= 2000) return "全球一代";
  return "數位原住民";
}

function pickClass(rng, settlement) {
  const mods = CLASS_KIND_WEIGHTS[settlement.kind] || {};
  return pickWeighted(rng, FAMILY_CLASSES, (item) => item.weight * (mods[item.id] ?? 1));
}

function ethnicityCandidates(registry, settlement, year) {
  const ids = getSettlementEthnicities(settlement, year).filter(Boolean);
  return ids
    .map((id, index) => {
      const item = registry.getEthnicity(id);
      if (!item) return null;
      return { ...item, weight: ethnicityDemographicWeight(item, index, ids.length, year) };
    })
    .filter(Boolean);
}

function pickAncestries(rng, registry, settlement, year) {
  const pool = ethnicityCandidates(registry, settlement, year);
  const regionalFallback = registry.ethnicitiesInRegion(settlement.region)
    .map((item, index, arr) => ({
      ...item,
      weight: ethnicityDemographicWeight(item, index, arr.length, year) * 0.2,
    }));
  const source = pool.length ? pool : regionalFallback;
  const primary = pickWeighted(rng, source);
  if (!primary) return [];
  const ancestries = [{ id: primary.id, share: 1, via: "primary" }];

  if (chance(rng, 0.28)) {
    const secondPool = source.filter((item) => item.id !== primary.id);
    const second = pickWeighted(rng, secondPool);
    if (second) {
      ancestries[0].share = 0.7;
      ancestries.push({ id: second.id, share: 0.3, via: "lineage" });
    }
  }

  return ancestries.map((row) => {
    const eth = registry.getEthnicity(row.id);
    return {
      id: row.id,
      label: eth?.label ?? row.id,
      share: row.share,
      rarity: eth?.rarity ?? "common",
      via: row.via,
    };
  });
}

function parentDeathChance(year, settlement, role) {
  let chanceValue = role === "mother" ? 0.04 : 0.07;
  if (year <= 1945) chanceValue += 0.05;
  else if (year <= 1970) chanceValue += 0.02;
  if (settlement.kind === "warzone") chanceValue += role === "father" ? 0.14 : 0.06;
  if (settlement.kind === "camp") chanceValue += 0.05;
  if (settlement.kind === "slum") chanceValue += 0.03;
  if (settlement.kind === "arctic" || settlement.climate === "polar") chanceValue += 0.03;
  return Math.min(0.4, chanceValue);
}

function buildParent(rng, registry, settlements, {
  role,
  childBirthYear,
  childSettlement,
  familyClass,
}) {
  const gender = role === "father" ? "male" : "female";
  const ageAtBirth = randInt(rng, role === "mother" ? 16 : 18, role === "mother" ? 42 : 54);
  const birthYear = childBirthYear - ageAtBirth;
  const originYear = Math.max(YEAR_MIN - 40, birthYear);
  const origin = pickParentOrigin(rng, childSettlement, settlements, originYear, familyClass, childBirthYear);

  const ancestries = pickAncestries(rng, registry, origin, Math.max(YEAR_MIN, birthYear));
  const primary = registry.getEthnicity(ancestries[0]?.id);
  const aliveAtBirth = !chance(rng, parentDeathChance(childBirthYear, childSettlement, role));
  const deathYear = aliveAtBirth ? null : randInt(rng, Math.max(birthYear + 12, childBirthYear - 8), childBirthYear);
  const aptitudes = rollParentAptitudes(rng, registry);
  const conditions = rollParentConditions(rng, registry, ancestries);
  const ethnicityTags = ancestries.map((row) => ethnicityTag(row.id));

  return {
    role,
    name: formatName(primary, gender, rng, origin, birthYear),
    gender,
    aliveAtBirth,
    deathYear,
    ageAtBirth,
    birthYear,
    originSettlementId: origin.id,
    originSettlementName: getSettlementDisplayName(origin, childBirthYear),
    originRegion: origin.region,
    familyClassId: familyClass.id,
    familyClassLabel: familyClass.label,
    ancestries,
    primaryEthnicityId: ancestries[0]?.id || localEthnicityIds(origin, Math.max(YEAR_MIN, birthYear))[0] || null,
    primaryEthnicityLabel: ancestries[0]?.label || primary?.label || "未名",
    aptitudes,
    conditions,
    tags: unique([
      ...ethnicityTags,
      ...aptitudes.map((item) => item.tag),
      ...conditions.map((item) => item.expressed ? (item.expressedTag || item.tag) : item.tag),
      aliveAtBirth ? `parent_${role}_alive` : `parent_${role}_deceased`,
      `settlement_${origin.id}`,
      `region_${origin.region}`,
    ]),
    notes: aliveAtBirth
      ? `${role === "father" ? "父" : "母"}親在孩子出生時仍在世，於${getSettlementDisplayName(origin, childBirthYear)}一帶討生活。`
      : `${role === "father" ? "父" : "母"}親已於 ${deathYear} 年離世，但其${ancestries.map((a) => a.label).join("、")}血脈仍寫在孩子身上。`,
  };
}

function collectAncestrySources(father, mother) {
  const map = new Map();
  for (const [parent, side] of [[father, "father"], [mother, "mother"]]) {
    for (const row of parent.ancestries) {
      const prev = map.get(row.id) || { id: row.id, label: row.label, share: 0, sources: [], rarity: row.rarity };
      prev.share += row.share * 0.5;
      prev.sources.push(side);
      map.set(row.id, prev);
    }
  }
  return [...map.values()].map((row) => ({
    ...row,
    share: Number(row.share.toFixed(2)),
    source: row.sources.includes("father") && row.sources.includes("mother") ? "both" : row.sources[0],
  })).sort((a, b) => b.share - a.share);
}

function inheritTraits(rng, registry, father, mother) {
  const inherited = [];
  const used = new Set();

  const parentHasEthnicity = (parent, ethnicityId) => parent.ancestries.some((row) => row.id === ethnicityId);

  for (const parent of [father, mother]) {
    for (const ancestry of parent.ancestries) {
      const eth = registry.getEthnicity(ancestry.id);
      if (!eth) continue;
      for (const traitId of eth.traits) {
        if (used.has(traitId)) continue;
        const trait = registry.getTrait(traitId);
        if (!trait) continue;
        const both = parentHasEthnicity(father, ancestry.id) && parentHasEthnicity(mother, ancestry.id);
        const probability = both ? 0.74 : ancestry.via === "primary" ? 0.48 : 0.3;
        if (!chance(rng, probability)) continue;
        const sourceSide = parentHasEthnicity(father, ancestry.id) && parentHasEthnicity(mother, ancestry.id)
          ? "both"
          : parent.role;
        const sourceParent = sourceSide === "both" ? "雙親" : (sourceSide === "father" ? "父系" : "母系");
        const livingNote = (sourceSide === "father" || sourceSide === "both" ? father.aliveAtBirth : true)
          && (sourceSide === "mother" || sourceSide === "both" ? mother.aliveAtBirth : true)
          ? ""
          : "（該系血親在出生時可已離世，不影響遺傳）";
        inherited.push({
          id: trait.id,
          tag: trait.tag || traitTag(trait.id),
          label: trait.label,
          description: trait.description,
          observation: trait.observation || "",
          hooks: trait.hooks.slice(),
          tags: (trait.tags || trait.hooks).slice(),
          statMods: { ...trait.statMods },
          eventModifiers: { ...(trait.eventModifiers || {}) },
          inheritedFrom: sourceSide,
          zygosity: both ? "homozygous" : "heterozygous",
          inheritMode: "autosomal_dominant",
          ethnicityId: eth.id,
          ethnicityLabel: eth.label,
          reason: `${sourceParent}具備${eth.label}血統（${eth.observation || "有對應的適應／感官傳統"}），因而繼承「${trait.label}」。${livingNote}`.trim(),
        });
        used.add(traitId);
        if (inherited.length >= 5) return inherited;
      }
    }
  }

  if (!inherited.length) {
    const primary = registry.getEthnicity(father.primaryEthnicityId) || registry.getEthnicity(mother.primaryEthnicityId);
    const trait = primary ? registry.getTrait(primary.traits[0]) : registry.getTrait("clan_map");
    if (trait && primary) {
      inherited.push({
        id: trait.id,
        tag: trait.tag || traitTag(trait.id),
        label: trait.label,
        description: trait.description,
        observation: trait.observation || "",
        hooks: trait.hooks.slice(),
        tags: (trait.tags || trait.hooks).slice(),
        statMods: { ...trait.statMods },
        eventModifiers: { ...(trait.eventModifiers || {}) },
        inheritedFrom: "father",
        zygosity: "heterozygous",
        inheritMode: "autosomal_dominant",
        ethnicityId: primary.id,
        ethnicityLabel: primary.label,
        reason: `父系或母系至少一方帶有${primary.label}血脈，先天留下「${trait.label}」。即使該系血親已不在世，遺傳標記仍然成立。`,
      });
    }
  }

  return inherited;
}

function inheritConditions(rng, registry, father, mother, childGender) {
  const grouped = new Map();
  for (const [parent, side] of [[father, "father"], [mother, "mother"]]) {
    for (const cond of parent.conditions || []) {
      const prev = grouped.get(cond.id) || { sources: [] };
      prev.sources.push({ side, parent, cond });
      grouped.set(cond.id, prev);
    }
  }

  const inherited = [];
  for (const [id, { sources }] of grouped) {
    const catalog = registry.getCondition(id) || sources[0].cond;
    const fromFather = sources.some((row) => row.side === "father");
    const fromMother = sources.some((row) => row.side === "mother");
    const both = fromFather && fromMother;
    const livingNote = sources.every((row) => row.parent.aliveAtBirth)
      ? ""
      : "（該系血親在出生時可已離世，不影響遺傳標記）";
    let carrier = false;
    let expressed = false;

    if (catalog.xLinked) {
      if (childGender === "male") {
        if (fromMother) {
          expressed = chance(rng, catalog.expressedChance ?? 0.45);
          carrier = expressed;
        }
      } else {
        if (fromMother) carrier = chance(rng, catalog.carrierChance ?? 0.5);
        if (fromFather) carrier = true;
        if (both && chance(rng, 0.08)) expressed = true;
      }
    } else if (catalog.inheritMode === "autosomal_dominant") {
      expressed = chance(rng, both ? Math.min(0.88, (catalog.expressedChance ?? 0.48) + 0.28) : (catalog.expressedChance ?? 0.48));
      carrier = expressed || chance(rng, catalog.carrierChance ?? 0.22);
    } else if (catalog.inheritMode === "autosomal_recessive") {
      if (both) {
        expressed = chance(rng, catalog.expressedChance ?? 0.12);
        carrier = true;
      } else {
        carrier = chance(rng, catalog.carrierChance ?? 0.42);
      }
    } else {
      const p = both ? (catalog.carrierChance ?? 0.4) + 0.18 : (catalog.carrierChance ?? 0.35);
      carrier = chance(rng, Math.min(0.85, p));
      expressed = carrier && chance(rng, catalog.expressedChance ?? 0.15);
    }

    if (!carrier && !expressed) continue;
    const sourceSide = both ? "both" : fromFather ? "father" : "mother";
    const sourceLabel = sourceSide === "both" ? "雙親" : sourceSide === "father" ? "父系" : "母系";
    inherited.push({
      id: catalog.id,
      tag: expressed && catalog.expressedTag ? catalog.expressedTag : catalog.tag,
      riskTag: catalog.tag,
      expressedTag: catalog.expressedTag,
      label: expressed && catalog.expressedLabel ? catalog.expressedLabel : catalog.label,
      description: catalog.description,
      observation: catalog.observation,
      inheritMode: catalog.inheritMode || "polygenic",
      zygosity: expressed ? "expressed" : "carrier",
      dominant: catalog.inheritMode === "autosomal_dominant",
      expressed,
      carrier,
      inheritedFrom: sourceSide,
      hooks: (catalog.hooks || []).slice(),
      advantageIn: (catalog.advantageIn || []).slice(),
      strainIn: (catalog.strainIn || []).slice(),
      valence: "contextual",
      statMods: expressed
        ? { ...(catalog.expressedStatMods || catalog.statMods || {}) }
        : { ...(catalog.statMods || {}) },
      reason: `${sourceLabel}這一支帶著「${catalog.label}」的體質。${catalog.observation || ""} ${expressed ? "這一回已經在孩子身上看得見。" : "這一回還只是家裏知道的風險，不保證會發病。"}在${(catalog.advantageIn || []).join("、") || "某些情境"}它可能成為餘裕，在${(catalog.strainIn || []).join("、") || "另一些情境"}才成為負擔。${livingNote}`.trim(),
    });
  }
  return inherited;
}

function inheritAptitudes(rng, father, mother) {
  const inherited = [];
  const used = new Set();
  for (const [parent, side] of [[father, "father"], [mother, "mother"]]) {
    const sideLabel = side === "father" ? "父" : "母";
    const livingNote = parent.aliveAtBirth ? "" : `（${sideLabel}親在出生時已不在世，但不妨礙這份氣質進入基因與家教記憶）`;
    for (const apt of parent.aptitudes || []) {
      if (used.has(apt.id)) continue;
      if (!chance(rng, apt.inheritChance ?? 0.46)) continue;
      inherited.push({
        id: apt.id,
        tag: apt.tag || parentTraitTag(apt.id),
        label: apt.label,
        description: apt.description,
        hooks: apt.hooks.slice(),
        statMods: { ...apt.statMods },
        inheritedFrom: side,
        parentRole: side,
        parentName: parent.name,
        reason: `${sideLabel}親${parent.name}具有「${apt.label}」（${apt.description}），這份氣質由${sideLabel}系傳入主角。${livingNote}`.trim(),
      });
      used.add(apt.id);
    }
  }
  return inherited;
}

function absorbLegacyMods(target, mods, share = 1) {
  for (const [key, delta] of Object.entries(mods || {})) {
    const n = Math.round(Number(delta) * share);
    if (!n) continue;
    if (key === "health") target.health += n;
    else if (key === "sanity" || key === "mood") target.sanity += n;
    else if (key === "wealth") target.means += n;
  }
}

function rollStats(rng, familyClass, ancestries, traits, registry, aptitudes = [], conditions = []) {
  const bag = familyClass.stats || {};
  const stats = {
    health: clampStat("health", rollRange(rng, bag.health)),
    sanity: clampStat("sanity", rollRange(rng, bag.sanity || bag.mood)),
  };
  let means = clampStat("health", rollRange(rng, bag.wealth || [18, 52]));
  for (const row of ancestries) {
    const eth = registry.getEthnicity(row.id);
    if (!eth?.statBias) continue;
    const acc = { health: 0, sanity: 0, means: 0 };
    absorbLegacyMods(acc, eth.statBias, row.share);
    stats.health = clampStat("health", stats.health + acc.health);
    stats.sanity = clampStat("sanity", stats.sanity + acc.sanity);
    means = clampStat("health", means + acc.means);
  }
  for (const trait of traits) {
    const acc = { health: 0, sanity: 0, means: 0 };
    absorbLegacyMods(acc, trait.statMods);
    stats.health = clampStat("health", stats.health + acc.health);
    stats.sanity = clampStat("sanity", stats.sanity + acc.sanity);
    means = clampStat("health", means + acc.means);
  }
  for (const apt of aptitudes) {
    const acc = { health: 0, sanity: 0, means: 0 };
    absorbLegacyMods(acc, apt.statMods, 0.7);
    stats.health = clampStat("health", stats.health + acc.health);
    stats.sanity = clampStat("sanity", stats.sanity + acc.sanity);
    means = clampStat("health", means + acc.means);
  }
  for (const cond of conditions) {
    const acc = { health: 0, sanity: 0, means: 0 };
    absorbLegacyMods(acc, cond.statMods || cond.expressedStatMods);
    stats.health = clampStat("health", stats.health + acc.health);
    stats.sanity = clampStat("sanity", stats.sanity + acc.sanity);
    means = clampStat("health", means + acc.means);
  }
  return { stats, means };
}

function kindLabel(kind) {
  return {
    metropolis: "大都會",
    city: "城市",
    port: "港口",
    industrial: "工業聚落",
    village: "鄉村聚落",
    slum: "貧民窟",
    arctic: "極地聚落",
    underground: "地下聚落",
    warzone: "戰亂區",
    camp: "難民／流離營區",
    planned_capital: "規劃首都",
  }[kind] || kind;
}

/**
 * Blind-box genesis + parental bloodline engine.
 *
 *   const genesis = new GenesisEngine({ seed: 123 });
 *   const character = genesis.generateCharacter();
 *
 * Extensibility:
 *   genesis.registerTrait({ id, label, hooks, ... })
 *   genesis.registerEthnicity({ id, label, traits, regions, ... })
 *   genesis.registerSettlement({ id, name, availableFrom, ... })
 */
export class GenesisEngine {
  constructor(options = {}) {
    this.seed = options.seed ?? randomSeed();
    this.rng = options.rng ?? createRng(this.seed);
    this.registry = options.registry ?? defaultBloodlineRegistry;
    this.settlements = options.settlements ? options.settlements.slice() : SETTLEMENTS.slice();
  }

  generateRandomCharacter(overrides = {}) {
    const rng = this.rng;
    const requestedDate = parseDateInput(overrides.birthDate || overrides);
    const birthYear = requestedDate?.year ?? this._resolveBirthYear(overrides.birthYear, rng);
    const settlement = localizeSettlement(
      this._resolveSettlement(birthYear, overrides, rng, requestedDate),
      birthYear,
    );
    const birthDate = this._resolveBirthDate(overrides, settlement, birthYear, requestedDate, rng);
    const birthWeek = birthDate.week;
    const familyClass = overrides.familyClass
      ? FAMILY_CLASSES.find((item) => item.id === overrides.familyClass) ?? pickClass(rng, settlement)
      : pickClass(rng, settlement);
    const gender = overrides.gender ?? (rng() < 0.5 ? "female" : "male");

    const father = overrides.parents?.father
      ?? buildParent(rng, this.registry, this.settlements, {
        role: "father",
        childBirthYear: birthYear,
        childSettlement: settlement,
        familyClass,
      });
    const mother = overrides.parents?.mother
      ?? buildParent(rng, this.registry, this.settlements, {
        role: "mother",
        childBirthYear: birthYear,
        childSettlement: settlement,
        familyClass,
      });

    const ancestries = collectAncestrySources(father, mother);
    const traits = overrides.traits
      ? this._hydrateForcedTraits(overrides.traits, ancestries, father, mother)
      : inheritTraits(rng, this.registry, father, mother);
    this._assertTraitsHaveBloodline(traits, father, mother);
    const parentTraits = inheritAptitudes(rng, father, mother);
    const conditions = inheritConditions(rng, this.registry, father, mother, gender);

    const namingEthnicity = resolveLocalNamingEthnicity(this.registry, settlement, ancestries, father, mother, birthYear);
    const named = overrides.name
      ? { name: overrides.name, style: "given", overlay: null, namesKey: namingEthnicity?.namesKey || null, ethnicityId: namingEthnicity?.id || null }
      : composeCulturalName(namingEthnicity, gender, rng, settlement, birthYear);
    const name = named.name;
    const rolled = overrides.stats
      ? {
        stats: STAT_KEYS.reduce((acc, key) => {
          acc[key] = clampStat(key, overrides.stats[key] ?? overrides.stats.mood ?? 40);
          return acc;
        }, {}),
        means: clampStat("health", overrides.stats.wealth ?? overrides.means ?? 40),
      }
      : rollStats(rng, familyClass, ancestries, traits, this.registry, parentTraits, conditions);
    const stats = rolled.stats;
    const means = rolled.means;

    const birthplace = assertDocumentedBirthplace(formatBirthplace(settlement, birthYear), settlement);
    const cityName = birthplace.cityOfficial;
    const natal = natalEnvironmentTags(birthDate, settlement);
    const socioTags = socioTagsForOrigin({
      familyClass,
      settlement,
      wealth: means,
    });
    const householdClimate = rollHouseholdClimate(rng, familyClass.id, (p) => chance(rng, p));
    const schoolClimate = rollSchoolClimate(rng, settlement.kind, familyClass.id, (p) => chance(rng, p));
    const mixed = ancestries.length > 1 || father.primaryEthnicityId !== mother.primaryEthnicityId;
    const tagStore = this._buildTagStore({
      ancestries,
      traits,
      parentTraits,
      conditions,
      socioTags,
      householdClimate,
      schoolClimate,
      father,
      mother,
      settlement,
      familyClass,
      birthYear,
      birthDate,
      natal,
      mixed,
      extra: overrides.tags,
    });

    const character = {
      id: `char_${birthDate.iso}_${Math.floor(rng() * 1e6)}`,
      name,
      namingTrace: {
        ethnicityId: named.ethnicityId,
        namesKey: named.namesKey,
        style: named.style,
        overlay: named.overlay,
      },
      gender,
      birthYear: birthDate.year,
      birthMonth: birthDate.month,
      birthDay: birthDate.day,
      birthWeek,
      birthIso: birthDate.iso,
      birthDate,
      cityId: settlement.id,
      cityName,
      region: settlement.region,
      country: birthplace.country,
      birthCountry: birthplace.country,
      birthCityName: birthplace.city,
      birthplaceLabel: birthplace.label,
      birthplace: birthplace.label,
      cityFlavor: settlement.flavor,
      settlementKind: settlement.kind,
      settlementKindLabel: kindLabel(settlement.kind),
      climate: settlement.climate,
      lat: settlement.lat,
      lon: settlement.lon,
      hemisphere: natal.hemisphere,
      natalEnvironment: {
        hemisphere: natal.hemisphere,
        season: natal.season,
        seasonLabel: natal.seasonLabel,
        tropicalSeason: natal.tropicalSeason,
        polar: natal.polar,
        lat: natal.lat,
        tags: natal.tags.slice(),
      },
      familyClassId: familyClass.id,
      familyClassLabel: familyClass.label,
      familyFlavor: familyClass.flavor,
      tags: unique([...tagStore.ids(), ...tagStore.labels()]),
      tagRecords: tagStore.toJSON(),
      tagsByCategory: {
        ethnicity: tagStore.byPrefix("ethnicity_").map((item) => item.id),
        trait: tagStore.byPrefix("trait_").map((item) => item.id),
        parentTrait: tagStore.byPrefix("parent_trait_").map((item) => item.id),
        acquired: tagStore.byPrefix("acquired_").map((item) => item.id),
        hook: tagStore.byPrefix("hook_").map((item) => item.id),
        date: tagStore.byPrefix("date_").map((item) => item.id),
        env: tagStore.byPrefix("env_").map((item) => item.id),
        hemisphere: tagStore.byPrefix("hemisphere_").map((item) => item.id),
        condition: tagStore.byPrefix("condition_").map((item) => item.id),
        risk: tagStore.byPrefix("risk_").map((item) => item.id),
        socio: tagStore.byPrefix("socio_").map((item) => item.id),
        mood: tagStore.byPrefix("mood_").map((item) => item.id),
        path: tagStore.byPrefix("path_").map((item) => item.id),
        household: tagStore.byPrefix("household_").map((item) => item.id),
        trauma: tagStore.byPrefix("trauma_").map((item) => item.id),
        school: tagStore.byPrefix("school_").map((item) => item.id),
        caste: tagStore.byPrefix("caste_").map((item) => item.id),
        adult: tagStore.byPrefix("adult_").map((item) => item.id),
        world: tagStore.byPrefix("world_").map((item) => item.id),
        figure: tagStore.byPrefix("figure_").map((item) => item.id),
      },
      traits: traits.map((trait) => trait.id),
      traitDetails: traits,
      parentTraits,
      conditions,
      socioTags: socioTags.map((item) => item.tag),
      householdClimate: householdClimate.map((item) => item.id),
      schoolClimate: schoolClimate.map((item) => item.id),
      moodState: emptyMoodState(),
      traumaState: emptyTraumaState(),
      schoolState: emptySchoolState(),
      casteState: emptyCasteState(),
      careerState: emptyCareerState(),
      worldEventState: emptyWorldEventState(),
      historyState: emptyHistoryState(),
      socialPhase: "minor",
      occupationId: null,
      bloodline: {
        primaryEthnicityId: ancestries[0]?.id ?? null,
        primaryEthnicityLabel: ancestries[0]?.label ?? null,
        ancestries,
        traits,
        parentTraits,
        conditions,
        parents: { father, mother },
        hooks: unique([
          ...traits.flatMap((trait) => trait.hooks),
          ...parentTraits.flatMap((item) => item.hooks),
          ...conditions.flatMap((item) => item.hooks || []),
        ]),
        mixed,
      },
      stats,
      means,
      education: "none",
      occupation: "無",
      married: false,
      childrenCount: 0,
      alive: true,
      causeOfDeath: null,
      ledger: createLedger({ familyClassId: familyClass.id }),
      recentTextHistory: emptyTextHistory(),
      exclusionBuffer: emptyExclusion(),
      lifeProgress: emptyLifeProgress(),
      genesisMeta: {
        yearCityLocked: true,
        dateCityLocked: true,
        tagsAreContextual: true,
        isolatedSettlementsExcluded: true,
        isolatedEthnicitiesExcluded: true,
        sandboxChoiceEngine: true,
        strictMinorBoundaryAge: 12,
        choiceFreedom: true,
        playAgeMin: 5,
        playAgeMax: 120,
        playPhase: "life_5_120",
        societyEntryAge: 18,
        chaosTriad: true,
        hintStyles: ["blunt", "fog"],
        traumaEngine: true,
        traumaNonsexualOnly: true,
        schoolEngine: true,
        schoolPeerHarm: true,
        perpCasteEngine: true,
        perpCasteAdultOnly: true,
        adultEngine: true,
        adultRealism: true,
        consequenceNoHalo: true,
        mortalityEngine: true,
        noHaloMortality: true,
        worldEventEngine: true,
        worldEventContextual: true,
        figureEngine: true,
        butterflyEngine: true,
        organicBloodlineChoices: true,
        constitutionEngine: true,
        hiddenReputation: true,
        socialFeedback: true,
        npcVoice: true,
        culturalNameMatching: true,
        indigenousNaming: true,
        historicalGeography: true,
        historicalDemographics: true,
        lifeLockUntilSettlement: true,
        eventCooldown: true,
        chronicleVariance: true,
        dynamicOpeningChronicle: true,
        fourPillarProse: true,
        progressiveLifeStages: true,
        lifeStageManager: true,
        dynamicUiTheme: true,
        themeManager: true,
        dynamicComputationEngine: true,
        explicitDeathPanel: true,
        concreteNarration: true,
        globalTextDedup: true,
        narrativeVariator: true,
        contextAwareRandom: true,
        exclusiveOptions: true,
        noOptionRecycling: true,
        exclusionTurns: 8,
        biweeklyTurns: true,
        turnsPerYear: 24,
        daysPerTurn: 14,
        turnsToAge18: 432,
        ...betaOverlaySnapshot(),
        fullTagLinkage: true,
        asymmetricSurvival: true,
        tagInfluenceCap: true,
        maxTagsPerChoice: 3,
        untaggedBaseline: true,
        birthplaceDocumented: true,
        settlementPackCount: Object.keys(SETTLEMENT_PACKS).length,
        forbiddenNote: FORBIDDEN_NOTE,
        forbiddenIds: FORBIDDEN_SETTLEMENT_IDS.slice(),
        seed: this.seed,
        ethnicityCatalogSize: this.registry.ethnicities.length,
        traitCatalogSize: this.registry.traits.length,
        birthIso: birthDate.iso,
      },
    };

    character.constitution = buildConstitution(character, settlement, birthYear);
    return character;
  }

  generateCharacter(overrides = {}) {
    return this.generateRandomCharacter(overrides);
  }

  getEligibleSettlements(year, date) {
    return getEligibleSettlements(year, this.settlements, date);
  }

  registerSettlement(def) {
    if (isForbiddenSettlement(def)) {
      throw new Error(`Refuse to register forbidden/isolated settlement: ${def?.id}`);
    }
    const normalized = {
      availableFrom: 0,
      availableTo: YEAR_MAX,
      kind: "city",
      tags: [],
      ethnicities: [],
      weight: 3,
      climate: "temperate",
      contact: "open",
      isolatedClosed: false,
      lat: def.lat ?? 30,
      lon: def.lon ?? 0,
      hemisphere: def.hemisphere,
      fromMonth: def.fromMonth ?? null,
      fromDay: def.fromDay ?? null,
      toMonth: def.toMonth ?? null,
      toDay: def.toDay ?? null,
      names: def.names || [{ from: YEAR_MIN, to: YEAR_MAX, name: def.name || def.id }],
      ...def,
    };
    normalized.countries = def.countries || [{
      from: YEAR_MIN,
      to: YEAR_MAX,
      country: def.country || normalized.country || "",
    }];
    if (def.ethnicityBands) normalized.ethnicityBands = def.ethnicityBands;
    const index = this.settlements.findIndex((item) => item.id === normalized.id);
    if (index >= 0) this.settlements[index] = normalized;
    else this.settlements.push(normalized);
    return normalized;
  }

  registerEthnicity(def) {
    return this.registry.registerEthnicity(def);
  }

  registerTrait(def) {
    return this.registry.registerTrait(def);
  }

  registerAptitude(def) {
    return this.registry.registerAptitude(def);
  }

  registerCondition(def) {
    return this.registry.registerCondition(def);
  }

  static isSettlementLegal(settlement, year, month, day) {
    return isSettlementAvailable(settlement, year, month, day);
  }

  static hasTag(character, tag) {
    return Boolean(character?.tags?.includes(tag) || character?.tagRecords?.some((item) => item.id === tag));
  }

  static hasAnyTag(character, tags) {
    return (tags || []).some((tag) => GenesisEngine.hasTag(character, tag));
  }

  static hasTrait(character, traitId) {
    const tag = traitId?.startsWith("trait_") ? traitId : traitTag(traitId);
    return GenesisEngine.hasTag(character, tag) || Boolean(character?.traits?.includes(traitId));
  }

  static getTraitsByHook(character, hook) {
    const fromDetails = (character?.traitDetails || character?.bloodline?.traits || [])
      .filter((trait) => (trait.hooks || []).includes(hook));
    const fromTags = (character?.tagRecords || []).filter((item) => (item.hooks || []).includes(hook));
    return [...fromDetails, ...fromTags];
  }

  static hasAncestry(character, ethnicityId) {
    const tag = ethnicityTag(ethnicityId);
    return GenesisEngine.hasTag(character, tag)
      || Boolean(character?.bloodline?.ancestries?.some((row) => row.id === ethnicityId));
  }

  _buildTagStore({ ancestries, traits, parentTraits, conditions, socioTags, householdClimate, schoolClimate, father, mother, settlement, familyClass, birthYear, birthDate, natal, mixed, extra }) {
    const store = new TagStore();
    for (const row of ancestries) {
      const eth = this.registry.getEthnicity(row.id);
      store.add({
        id: ethnicityTag(row.id),
        category: "ethnicity",
        label: row.label,
        source: row.source,
        inherited: true,
        ethnicityId: row.id,
        valence: "contextual",
        reason: `${row.source === "both" ? "雙親" : row.source === "father" ? "父系" : "母系"}帶有${row.label}血脈（約 ${Math.round(row.share * 100)}%）。${eth?.observation || ""}`.trim(),
      });
    }
    for (const trait of traits) {
      store.add({
        id: trait.tag || traitTag(trait.id),
        category: "trait",
        label: trait.label,
        source: trait.inheritedFrom,
        reason: trait.reason,
        hooks: trait.hooks,
        modifiers: trait.eventModifiers || {},
        ethnicityId: trait.ethnicityId,
        inherited: true,
        valence: "contextual",
      });
      for (const hook of trait.hooks || []) store.add({ id: hookTag(hook), label: hook, category: "hook", hidden: true });
    }
    for (const apt of parentTraits) {
      store.add({
        id: apt.tag || parentTraitTag(apt.id),
        category: "parentTrait",
        label: apt.label,
        source: apt.inheritedFrom,
        reason: apt.reason,
        hooks: apt.hooks,
        parentRole: apt.parentRole,
        inherited: true,
        valence: "contextual",
      });
      for (const hook of apt.hooks || []) store.add({ id: hookTag(hook), label: hook, category: "hook", hidden: true });
    }
    for (const cond of conditions || []) {
      store.add({
        id: cond.tag,
        category: cond.expressed ? "condition" : "risk",
        label: cond.label,
        source: cond.inheritedFrom,
        reason: cond.reason,
        hooks: cond.hooks,
        inherited: true,
        valence: "contextual",
        advantageIn: cond.advantageIn,
        strainIn: cond.strainIn,
        data: { expressed: cond.expressed, carrier: cond.carrier },
        hidden: !cond.expressed,
      });
      if (cond.expressed && cond.riskTag && cond.riskTag !== cond.tag) {
        store.add({
          id: cond.riskTag,
          category: "risk",
          label: cond.label,
          source: cond.inheritedFrom,
          reason: cond.reason,
          inherited: true,
          valence: "contextual",
          hidden: true,
        });
      }
    }
    for (const socio of socioTags || []) {
      store.add({
        id: socio.tag,
        category: "socio",
        label: socio.label,
        source: "origin",
        reason: `${socio.reason}在${(socio.advantageIn || []).join("、") || "某些歷史情境"}可能是優勢，在${(socio.strainIn || []).join("、") || "另一些情境"}才成為約束。`,
        valence: "contextual",
        advantageIn: socio.advantageIn,
        strainIn: socio.strainIn,
      });
    }
    for (const climate of householdClimate || []) {
      store.add({
        id: climate.id,
        category: "household",
        label: climate.label,
        source: "genesis",
        reason: climate.reason,
        valence: "contextual",
        advantageIn: climate.advantageIn,
        strainIn: climate.strainIn,
      });
    }
    for (const climate of schoolClimate || []) {
      store.add({
        id: climate.id,
        category: "school",
        label: climate.label,
        source: "genesis",
        reason: climate.reason,
        valence: "contextual",
        advantageIn: climate.advantageIn,
        strainIn: climate.strainIn,
      });
    }
    store.add({
      id: father.aliveAtBirth ? "parent_father_alive" : "parent_father_deceased",
      category: "parent",
      label: father.aliveAtBirth ? "父親在世" : "父親已故",
      source: "father",
      reason: father.notes,
    });
    store.add({
      id: mother.aliveAtBirth ? "parent_mother_alive" : "parent_mother_deceased",
      category: "parent",
      label: mother.aliveAtBirth ? "母親在世" : "母親已故",
      source: "mother",
      reason: mother.notes,
    });
    store.add({
      id: mixed ? "lineage_mixed" : "lineage_unmixed",
      category: "lineage",
      label: mixed ? "混血開局" : "單一主血脈",
      reason: mixed ? "父系與母系種族標籤不完全相同。" : "雙親主血脈一致。",
    });
    const birthplaceTag = formatBirthplace(settlement, birthYear);
    store.add({
      id: `settlement_${settlement.id}`,
      category: "settlement",
      label: birthplaceTag.label,
      reason: `戶籍出生地為${birthplaceTag.label}。`,
    });
    store.add({ id: `region_${settlement.region}`, category: "region", label: zhRegion(settlement.region) || getSettlementCountry(settlement, birthYear) || settlement.country || "本地" });
    store.add({ id: `class_${familyClass.id}`, category: "class", label: familyClass.label });
    store.add({ id: `climate_${settlement.climate || "temperate"}`, category: "climate", label: zhClimate(settlement.climate) || "溫帶" });
    if (birthDate) {
      store.add({
        id: `date_${birthDate.iso}`,
        category: "date",
        label: formatDate(birthDate),
        reason: `精確出生日期為${formatDate(birthDate)}，且該日${getSettlementDisplayName(settlement, birthYear)}已存在、對外可通達。`,
        data: { iso: birthDate.iso, month: birthDate.month, day: birthDate.day },
      });
    }
    if (natal?.records) {
      for (const record of natal.records) {
        store.add({
          ...record,
          source: "calendar",
          reason: record.reason,
          hidden: false,
        });
      }
    }
    for (const label of settlement.tags || []) store.add({ id: label, label, category: "misc", source: "settlement" });
    for (const label of familyClass.tags || []) store.add({ id: label, label, category: "misc", source: "class" });
    store.add({ id: eraTag(birthYear), label: eraTag(birthYear), category: "misc" });
    store.add({ id: kindLabel(settlement.kind), label: kindLabel(settlement.kind), category: "misc" });
    for (const tag of extra || []) store.add(tag);
    return store;
  }

  _resolveBirthYear(requested, rng) {
    const range = effectiveGenesisYearRange();
    if (requested == null) return randInt(rng, range.min, range.max);
    if (requested < YEAR_MIN || requested > YEAR_MAX) {
      throw new Error(`Birth year must be between ${YEAR_MIN} and ${YEAR_MAX}`);
    }
    return requested;
  }

  _resolveSettlement(birthYear, overrides, rng, date) {
    const eligible = this.getEligibleSettlements(birthYear, date);
    if (!eligible.length) {
      const stamp = date?.iso || String(birthYear);
      throw new Error(`No historically available settlements for ${stamp}`);
    }
    let settlement;
    if (overrides.city || overrides.settlementId) {
      const id = overrides.city || overrides.settlementId;
      settlement = this.settlements.find((item) => item.id === id);
      if (!settlement) throw new Error(`Unknown settlement: ${id}`);
      if (date) assertSettlementLegal(settlement, date.year, date.month, date.day);
      else assertSettlementLegal(settlement, birthYear);
    } else {
      settlement = pickSettlementByDemographics(rng, eligible, birthYear) || pickWeighted(rng, eligible);
    }
    if (isForbiddenSettlement(settlement)) {
      throw new Error(`Illegal settlement roll for ${birthYear}: ${settlement?.id}`);
    }
    if (date) {
      if (!isSettlementAvailable(settlement, date.year, date.month, date.day)) {
        throw new Error(`Illegal settlement roll for ${date.iso}: ${settlement?.id}`);
      }
    } else if (!isSettlementAvailable(settlement, birthYear)) {
      throw new Error(`Illegal settlement roll for ${birthYear}: ${settlement?.id}`);
    }
    return settlement;
  }

  _resolveBirthDate(overrides, settlement, birthYear, requestedDate, rng) {
    if (requestedDate) {
      assertSettlementLegal(settlement, requestedDate.year, requestedDate.month, requestedDate.day);
      return requestedDate;
    }
    if (overrides.birthWeek != null) {
      const fromWeek = dateFromWeek(birthYear, overrides.birthWeek);
      if (isSettlementAvailable(settlement, fromWeek.year, fromWeek.month, fromWeek.day)) {
        return fromWeek;
      }
    }
    return randomBirthDateForSettlement(rng, settlement, birthYear);
  }

  _hydrateForcedTraits(traitIds, ancestries, father, mother) {
    const allowed = new Set([
      ...father.ancestries.map((row) => row.id),
      ...mother.ancestries.map((row) => row.id),
    ]);
    const out = [];
    for (const traitId of traitIds) {
      const trait = this.registry.getTrait(traitId);
      if (!trait) continue;
      const donor = [...father.ancestries, ...mother.ancestries]
        .map((row) => this.registry.getEthnicity(row.id))
        .find((eth) => eth?.traits.includes(traitId) && allowed.has(eth.id));
      if (!donor) {
        throw new Error(`Trait ${traitId} has no parental bloodline to inherit from`);
      }
      out.push({
        id: trait.id,
        tag: trait.tag || traitTag(trait.id),
        label: trait.label,
        description: trait.description,
        observation: trait.observation || "",
        hooks: trait.hooks.slice(),
        tags: (trait.tags || trait.hooks).slice(),
        statMods: { ...trait.statMods },
        eventModifiers: { ...(trait.eventModifiers || {}) },
        inheritedFrom: father.ancestries.some((row) => row.id === donor.id) ? "father" : "mother",
        ethnicityId: donor.id,
        ethnicityLabel: donor.label,
        reason: `指定繼承自${donor.label}血脈。`,
      });
    }
    return out;
  }

  _assertTraitsHaveBloodline(traits, father, mother) {
    const ancestryIds = new Set([
      ...father.ancestries.map((row) => row.id),
      ...mother.ancestries.map((row) => row.id),
    ]);
    for (const trait of traits) {
      const eth = this.registry.getEthnicity(trait.ethnicityId);
      if (!eth || !ancestryIds.has(eth.id) || !eth.traits.includes(trait.id)) {
        throw new Error(`Trait ${trait.id} failed bloodline check`);
      }
    }
  }
}

export function createCharacter(rng, overrides = {}) {
  return new GenesisEngine({ rng }).generateCharacter(overrides);
}

export function describeGenesis(character, rng) {
  if (character?.openingDossier?.birth) return character.openingDossier.birth;
  return composeOpeningDossier(rng, character, { remember: false }).birth;
}

export {
  FORBIDDEN_SETTLEMENT_IDS,
  getEligibleSettlements,
  isSettlementAvailable,
  formatBirthplace,
};
