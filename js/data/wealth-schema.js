/**
 * Dynamic wealth bands, cash-flow rates, and era shocks.
 * Numbers only. Player-facing sentences are assembled live from facts.
 */

export const CASH_PER_MEANS = 8;
export const WEALTH_CRISIS_COOLDOWN = 10;

export const WEALTH_BANDS = Object.freeze([
  { id: "bankrupt", maxNet: -1, means: 4, label: "破產" },
  { id: "indebted", maxNet: 24, means: 12, label: "負債" },
  { id: "destitute", maxNet: 48, means: 16, label: "赤貧" },
  { id: "poor", maxNet: 120, means: 32, label: "貧困" },
  { id: "getting_by", maxNet: 240, means: 48, label: "餬口" },
  { id: "comfortable", maxNet: 480, means: 68, label: "小康" },
  { id: "affluent", maxNet: Infinity, means: 86, label: "富裕" },
]);

export const CLASS_WEALTH_SEED = Object.freeze({
  peasant: { cashMul: 4, assetMul: 2, debtFloor: 12 },
  worker: { cashMul: 5, assetMul: 2, debtFloor: 8 },
  immigrant: { cashMul: 4, assetMul: 1, debtFloor: 16 },
  artisan: { cashMul: 6, assetMul: 4, debtFloor: 4 },
  intellectual: { cashMul: 6, assetMul: 3, debtFloor: 6 },
  military: { cashMul: 6, assetMul: 3, debtFloor: 4 },
  merchant: { cashMul: 9, assetMul: 8, debtFloor: 0 },
  official: { cashMul: 8, assetMul: 6, debtFloor: 0 },
  gentry: { cashMul: 10, assetMul: 12, debtFloor: 0 },
});

export const CLASS_WEEKLY_INCOME = Object.freeze({
  peasant: 6,
  worker: 8,
  immigrant: 7,
  artisan: 10,
  intellectual: 9,
  military: 10,
  merchant: 16,
  official: 14,
  gentry: 18,
});

export const CLASS_WEEKLY_EXPENSE = Object.freeze({
  peasant: 7,
  worker: 8,
  immigrant: 8,
  artisan: 9,
  intellectual: 10,
  military: 9,
  merchant: 12,
  official: 11,
  gentry: 14,
});

export const INFLATION_WINDOWS = Object.freeze([
  { from: 1929, to: 1933, regions: ["west"], inflation: 0.82, income: 0.48, shock: "depression" },
  { from: 1931, to: 1936, regions: ["russia"], inflation: 1.15, income: 0.7, shock: "collectivization" },
  { from: 1937, to: 1945, regions: ["china", "japan", "taiwan", "korea"], inflation: 1.55, income: 0.62, shock: "war" },
  { from: 1939, to: 1945, regions: ["west", "russia"], inflation: 1.35, income: 0.75, shock: "war" },
  { from: 1948, to: 1949, regions: ["china"], inflation: 2.4, income: 0.55, shock: "hyperinflation" },
  { from: 1958, to: 1962, regions: ["china"], inflation: 1.2, income: 0.28, shock: "famine" },
  { from: 1973, to: 1975, regions: ["west", "middle_east", "japan"], inflation: 1.28, income: 0.85, shock: "oil" },
  { from: 1997, to: 1998, regions: ["se_asia", "korea", "hongkong", "taiwan", "japan"], inflation: 1.18, income: 0.7, shock: "asian_crisis" },
  { from: 2008, to: 2009, regions: ["west", "china", "japan", "hongkong"], inflation: 1.08, income: 0.78, shock: "gfc" },
  { from: 2020, to: 2021, regions: null, inflation: 1.12, income: 0.72, shock: "covid" },
]);

export const WEALTH_TAG_RULES = Object.freeze([
  { id: "wealth_bankrupt", label: "破產", minDebt: 1, maxNet: 0, strain: ["health", "hunger", "family"] },
  { id: "wealth_indebted", label: "負債在身", minDebt: 36, strain: ["family", "commerce"] },
  { id: "wealth_street", label: "流落街頭", crisis: "street", strain: ["health", "hunger", "environment"] },
  { id: "wealth_bonded", label: "抵押勞動", crisis: "bonded", strain: ["labor", "health"] },
  { id: "wealth_collectors", label: "被人追債", crisis: "collectors", strain: ["violence", "family"] },
  { id: "wealth_fire_sale", label: "變賣家產", crisis: "fire_sale", strain: ["family"] },
  { id: "wealth_malnourished", label: "營養崩潰", crisis: "hunger", strain: ["hunger", "health"] },
  { id: "wealth_climber", label: "剛爬上一級", minNet: 280, strain: [] },
  { id: "wealth_ruined_name", label: "身敗名裂", minDebt: 90, strain: ["social", "commerce"] },
]);

export const CRISIS_KINDS = Object.freeze(["street", "fire_sale", "bonded", "collectors", "hunger"]);
