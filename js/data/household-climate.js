/**
 * Household climate tags rolled at genesis. Not every family is violent.
 * Poverty raises odds; it does not equal abuse.
 */

export const HOUSEHOLD_CLIMATE_TAGS = Object.freeze([
  {
    id: "household_volatile",
    label: "家中易爆",
    chance: { default: 0.11, peasant: 0.16, worker: 0.15, immigrant: 0.17, gentry: 0.07, official: 0.08 },
    reason: "開局家庭被標為情緒與暴力不穩定。這不是宿命，是較高的遭遇權重。",
    advantageIn: ["hide", "survival"],
    strainIn: ["family", "social", "health"],
  },
  {
    id: "household_alcohol",
    label: "酒精失格的照護者",
    chance: { default: 0.09, peasant: 0.13, worker: 0.14, immigrant: 0.12, gentry: 0.08 },
    reason: "家中至少一名主要照護者的酒改變了夜晚的物理規則。",
    advantageIn: ["hide", "night"],
    strainIn: ["family", "health", "study"],
  },
  {
    id: "household_neglect",
    label: "嚴重疏忽",
    chance: { default: 0.1, peasant: 0.14, worker: 0.13, immigrant: 0.16, gentry: 0.05 },
    reason: "溫飽、就醫、在場都不被當成義務。孩子學會自己當基礎設施。",
    advantageIn: ["survival"],
    strainIn: ["health", "study", "family"],
  },
  {
    id: "household_extractive",
    label: "抽取式家庭",
    chance: { default: 0.1, peasant: 0.18, worker: 0.16, artisan: 0.14, immigrant: 0.17, merchant: 0.08 },
    reason: "兒童的時間與工資被當成家產。這是剝削，不是勤勞教育。",
    advantageIn: ["labor"],
    strainIn: ["study", "health", "social"],
  },
  {
    id: "household_step_tension",
    label: "繼親張力",
    chance: { default: 0.06, worker: 0.08, immigrant: 0.09, peasant: 0.07 },
    reason: "家中有一個以「不是親生所以更需立威」運作的大人。立威通常是手。",
    advantageIn: ["hide"],
    strainIn: ["family", "social"],
  },
]);

export function rollHouseholdClimate(rng, familyClassId, chanceFn) {
  const roll = chanceFn || ((probability) => rng() < probability);
  const out = [];
  for (const row of HOUSEHOLD_CLIMATE_TAGS) {
    const p = row.chance[familyClassId] ?? row.chance.default;
    if (roll(p)) out.push(row);
  }
  return out;
}
