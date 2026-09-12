/**
 * Decay / forget / evolve rules for live tags.
 * Identity, trauma, and ledger meters are never auto-erased here.
 */

export const NEVER_DECAY_PREFIXES = Object.freeze([
  "ethnicity_",
  "parent_",
  "parent_trait_",
  "lineage_",
  "class_",
  "settlement_",
  "region_",
  "date_",
  "hemisphere_",
  "condition_",
  "risk_",
  "socio_",
  "trauma_",
  "household_",
  "path_",
  "crime_",
  "politics_",
  "ledger_",
]);

export const LEDGER_ACQUIRED_LOCK = Object.freeze([
  "acquired_wanted",
  "acquired_high_heat",
  "acquired_low_trust",
  "acquired_infamy",
  "acquired_low_opinion",
  "acquired_low_credit",
  "acquired_imprisoned",
  "acquired_underworld",
  "acquired_fugitive",
]);

export const ENV_BANDS = Object.freeze({
  cold: {
    climates: ["arctic", "cold", "polar", "subpolar"],
    hooks: ["arctic", "cold", "polar"],
    envNeedles: ["extreme_cold", "polar_night", "polar", "arctic"],
  },
  heat: {
    climates: ["tropical", "tropical_savanna", "arid", "mediterranean"],
    hooks: ["heat", "desert"],
    envNeedles: ["extreme_heat", "dust_dry", "desert"],
  },
  altitude: {
    climates: ["highland"],
    hooks: ["altitude"],
    envNeedles: ["thin_air", "altitude"],
  },
});

const COLD_TRAITS = [
  "trait_polar_thermogenesis",
  "trait_cold_hands_craft",
  "trait_ice_acoustic_read",
];
const HEAT_TRAITS = [
  "trait_heat_slender_build",
  "trait_humidity_pace",
  "trait_desert_thrift",
];
const ALTITUDE_TRAITS = [
  "trait_altitude_epas1",
  "trait_altitude_hemoglobin",
  "trait_mountain_foot",
];

export const DECAY_RULES = Object.freeze([
  {
    id: "cold_adapt",
    matchIds: [...COLD_TRAITS, "hook_arctic", "world_arctic_exposure"],
    matchHooks: ["arctic"],
    requireMismatch: "cold",
    fadeWeeks: 72,
    removeWeeks: 144,
    noteFade: "暖地住久了，從前扛得住的冷，身子先忘了。",
    noteRemove: "極寒那一套已經從日常裡退掉。",
  },
  {
    id: "heat_adapt",
    matchIds: [...HEAT_TRAITS, "hook_desert", "hook_heat"],
    matchHooks: ["heat", "desert"],
    requireMismatch: "heat",
    fadeWeeks: 72,
    removeWeeks: 144,
    noteFade: "陰涼處待久了，熱浪裡那套省力的走法開始生疏。",
    noteRemove: "耐熱的節奏已經從步距裡退掉。",
  },
  {
    id: "altitude_adapt",
    matchIds: [...ALTITUDE_TRAITS, "hook_altitude"],
    matchHooks: ["altitude"],
    requireMismatch: "altitude",
    fadeWeeks: 72,
    removeWeeks: 144,
    noteFade: "平地的空氣太足，稀薄處的步法開始對不上。",
    noteRemove: "高處那口氣已經不再自動來到。",
  },
  {
    id: "skill_use",
    matchIds: ["acquired_diligent_study", "acquired_exam_economy"],
    matchHooks: ["study", "craft", "art", "navigation"],
    matchPrefixes: ["daily_"],
    skipIds: LEDGER_ACQUIRED_LOCK,
    fadeWeeks: 48,
    removeWeeks: 72,
    noteFade: "很久沒再用過的手藝，指節已對不上。",
    noteRemove: "那門本事退成偶爾的肌肉記憶。",
  },
  {
    id: "temporary_state",
    matchTemporary: true,
    skipCategories: ["mood", "social", "ledger", "path"],
    skipIds: LEDGER_ACQUIRED_LOCK,
    fadeWeeks: 6,
    removeWeeks: 8,
    noteFade: "暫時壓在身上的記號開始鬆開。",
    noteRemove: "一時的狀態沒再被這兩週喚起，便退了。",
  },
]);

export const EVOLUTION_RULES = Object.freeze([
  {
    id: "desperate_survival",
    requiresAny: ["socio_extreme_poverty", "socio_working_poor", "socio_arctic_scarcity", "household_extractive"],
    requiresAnySecondary: ["mood_depressed", "trauma_labor_scar", "trauma_attachment_starve", "trauma_cannot_ask_help"],
    crisis: true,
    grant: {
      id: "acquired_desperate_survival",
      category: "acquired",
      label: "絕境求生",
      hidden: false,
      source: "evolution",
      reason: "長期匱乏在極端一週裡被身體改寫成求生本能。",
      hooks: ["survival", "hunger", "hide"],
      advantageIn: ["survival", "hunger", "scarcity"],
    },
    note: "這次沒死成。身體自己記住了一條活路。",
  },
  {
    id: "starvation_thrift",
    requiresAny: ["socio_extreme_poverty", "socio_working_poor"],
    hooksAny: ["hunger", "survival", "scarcity"],
    healthMax: 42,
    grant: {
      id: "acquired_starvation_thrift",
      category: "acquired",
      label: "餓慣了的胃口",
      hidden: false,
      source: "evolution",
      reason: "反覆斷糧把消耗壓到最低。",
      hooks: ["hunger", "survival"],
      advantageIn: ["hunger", "scarcity"],
    },
    note: "空碗變多以後，你學會把力氣留到下一頓。",
  },
  {
    id: "plague_antibody",
    requiresAny: ["world_plague_queue", "socio_slum_density", "socio_refugee_camp", "socio_extreme_poverty"],
    hooksAny: ["plague", "health", "disease"],
    grant: {
      id: "acquired_plague_antibody",
      category: "acquired",
      label: "熱病抗體",
      hidden: true,
      source: "evolution",
      reason: "同一類熱病沒把人收走時，身體留下抵抗。",
      hooks: ["health", "plague"],
      advantageIn: ["plague", "health"],
    },
    note: "燒退後，下一次同類的病來得比較慢。",
  },
  {
    id: "pain_focus",
    requiresAny: ["trauma_flinch_body", "trauma_labor_scar", "trauma_hypervigilance"],
    crisis: true,
    grant: {
      id: "acquired_pain_focus",
      category: "acquired",
      label: "痛裡還能動手",
      hidden: true,
      source: "evolution",
      reason: "反覆的痛把注意釘在下一步，而不是叫聲。",
      hooks: ["survival", "labor"],
      advantageIn: ["survival", "labor"],
    },
    note: "痛還在，可手沒停。",
  },
  {
    id: "cold_forged",
    requiresAny: [...COLD_TRAITS, "hook_arctic", "world_arctic_exposure"],
    requireBand: "cold",
    crisis: true,
    grant: {
      id: "acquired_cold_forged",
      category: "acquired",
      label: "冷裡活下來",
      hidden: false,
      source: "evolution",
      reason: "極寒週把休眠的耐寒重新鍛成可用的本能。",
      hooks: ["arctic", "survival"],
      advantageIn: ["arctic", "survival"],
    },
    note: "這場冷沒把你收走。身體把舊的耐寒又撿了回來。",
  },
  {
    id: "heat_forged",
    requiresAny: [...HEAT_TRAITS, "hook_desert", "hook_heat"],
    requireBand: "heat",
    crisis: true,
    grant: {
      id: "acquired_heat_forged",
      category: "acquired",
      label: "熱裡還能走",
      hidden: false,
      source: "evolution",
      reason: "酷熱週把省水省步的節奏重新叫醒。",
      hooks: ["heat", "desert", "survival"],
      advantageIn: ["heat", "desert", "survival"],
    },
    note: "熱浪裡你還能把路走完。",
  },
]);

export function emptyTagLifecycle() {
  return {
    turn: 0,
    lastStageId: "",
    touched: {},
    idle: {},
    evolved: {},
    dormant: {},
  };
}
