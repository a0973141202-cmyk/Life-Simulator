/**
 * Geographic hazard: settlement kind, climate, class, seasonal extremes.
 * Named bands match the spec: affluent/safe, slum, warzone, arctic, disaster.
 */

export const GEO_BANDS = Object.freeze({
  affluent_safe: { id: "affluent_safe", label: "富裕安全區域" },
  ordinary: { id: "ordinary", label: "普通城市／鄉鎮" },
  industrial: { id: "industrial", label: "工業傷害帶" },
  rural: { id: "rural", label: "醫療稀薄農村" },
  slum: { id: "slum", label: "極度貧民窟" },
  camp: { id: "camp", label: "難民／收容營" },
  warzone: { id: "warzone", label: "戰亂交織區" },
  arctic: { id: "arctic", label: "極地／惡劣自然環境" },
  underground: { id: "underground", label: "地下／礦坑環境" },
  disaster: { id: "disaster", label: "極端氣候災難週" },
});

export const KIND_MULT = Object.freeze({
  planned_capital: { band: "affluent_safe", disease: 0.68, accident: 0.82, violence: 0.7, hunger: 0.62, environment: 0.7, senescence: 0.92 },
  metropolis: { band: "ordinary", disease: 0.88, accident: 1.05, violence: 0.95, hunger: 0.78, environment: 0.75, senescence: 0.95 },
  city: { band: "ordinary", disease: 1, accident: 1, violence: 1, hunger: 1, environment: 1, senescence: 1 },
  port: { band: "ordinary", disease: 1.08, accident: 1.12, violence: 1.08, hunger: 0.92, environment: 0.95, senescence: 1 },
  industrial: { band: "industrial", disease: 1.22, accident: 1.55, violence: 1.05, hunger: 1.08, environment: 1.25, senescence: 1.05 },
  village: { band: "rural", disease: 1.28, accident: 1.12, violence: 0.82, hunger: 1.35, environment: 1.2, senescence: 1.08 },
  slum: { band: "slum", disease: 2.55, accident: 1.85, violence: 2.35, hunger: 2.7, environment: 1.45, senescence: 1.12 },
  camp: { band: "camp", disease: 2.7, accident: 1.7, violence: 2.5, hunger: 2.9, environment: 1.7, senescence: 1.15 },
  warzone: { band: "warzone", disease: 1.85, accident: 1.65, violence: 6.2, hunger: 2.4, environment: 1.5, senescence: 1.1 },
  arctic: { band: "arctic", disease: 1.35, accident: 1.75, violence: 0.85, hunger: 1.55, environment: 3.4, senescence: 1.12 },
  underground: { band: "underground", disease: 1.45, accident: 2.15, violence: 1.1, hunger: 1.25, environment: 1.9, senescence: 1.08 },
});

export const CLASS_MULT = Object.freeze({
  gentry: { disease: 0.72, accident: 0.85, violence: 0.92, hunger: 0.58, environment: 0.8, senescence: 0.9 },
  official: { disease: 0.74, accident: 0.88, violence: 0.95, hunger: 0.62, environment: 0.82, senescence: 0.92 },
  merchant: { disease: 0.82, accident: 0.95, violence: 1, hunger: 0.75, environment: 0.9, senescence: 0.95 },
  intellectual: { disease: 0.84, accident: 0.92, violence: 0.98, hunger: 0.8, environment: 0.92, senescence: 0.94 },
  artisan: { disease: 1, accident: 1.08, violence: 1, hunger: 1.02, environment: 1, senescence: 1 },
  military: { disease: 1.05, accident: 1.25, violence: 1.55, hunger: 1.05, environment: 1.1, senescence: 1.02 },
  worker: { disease: 1.12, accident: 1.22, violence: 1.08, hunger: 1.15, environment: 1.08, senescence: 1.04 },
  peasant: { disease: 1.28, accident: 1.18, violence: 1.05, hunger: 1.45, environment: 1.2, senescence: 1.06 },
  immigrant: { disease: 1.32, accident: 1.2, violence: 1.22, hunger: 1.4, environment: 1.18, senescence: 1.05 },
});

export const CLIMATE_MULT = Object.freeze({
  polar: { disease: 1.1, accident: 1.25, violence: 1, hunger: 1.2, environment: 2.4, senescence: 1.08 },
  cold: { disease: 1.08, accident: 1.12, violence: 1, hunger: 1.1, environment: 1.45, senescence: 1.04 },
  continental: { disease: 1.05, accident: 1.05, violence: 1, hunger: 1.05, environment: 1.2, senescence: 1.02 },
  temperate: { disease: 1, accident: 1, violence: 1, hunger: 1, environment: 1, senescence: 1 },
  subtropical: { disease: 1.12, accident: 1.05, violence: 1, hunger: 1.05, environment: 1.1, senescence: 1 },
  tropical: { disease: 1.35, accident: 1.08, violence: 1.02, hunger: 1.12, environment: 1.25, senescence: 1.02 },
  tropical_savanna: { disease: 1.28, accident: 1.08, violence: 1.02, hunger: 1.18, environment: 1.3, senescence: 1.02 },
  arid: { disease: 1.1, accident: 1.12, violence: 1.02, hunger: 1.35, environment: 1.55, senescence: 1.03 },
  highland: { disease: 1.08, accident: 1.2, violence: 1.05, hunger: 1.15, environment: 1.7, senescence: 1.04 },
  mediterranean: { disease: 0.95, accident: 1, violence: 1, hunger: 0.95, environment: 1.05, senescence: 0.98 },
});

export const SEASON_ENV_ADD = Object.freeze({
  current_env_extreme_cold: { environment: 0.012, accident: 0.002, disease: 0.003 },
  current_env_extreme_heat: { environment: 0.008, disease: 0.002, hunger: 0.001 },
  current_env_polar_night: { environment: 0.006, accident: 0.002, disease: 0.001 },
  current_env_monsoon: { disease: 0.004, accident: 0.003, environment: 0.002 },
  current_env_dust_dry: { hunger: 0.003, environment: 0.004, disease: 0.001 },
  current_env_thin_air: { environment: 0.003, disease: 0.001 },
});

export const WAR_TAG_VIOLENCE = 1.85;
export const DISASTER_TAGS = Object.freeze(["颱風", "地震", "洪水", "戰亂區"]);

export function kindMult(kind) {
  return KIND_MULT[kind] || KIND_MULT.city;
}

export function classMult(classId) {
  return CLASS_MULT[classId] || CLASS_MULT.artisan;
}

export function climateMult(climate) {
  return CLIMATE_MULT[climate] || CLIMATE_MULT.temperate;
}

export function geoBandFor(kind, settlementTags = [], seasonalDisaster = false) {
  if (seasonalDisaster) return GEO_BANDS.disaster;
  const row = kindMult(kind);
  if ((settlementTags || []).includes("戰亂區") && kind !== "warzone") return GEO_BANDS.warzone;
  return GEO_BANDS[row.band] || GEO_BANDS.ordinary;
}
