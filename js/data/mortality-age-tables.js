/**
 * Age × year-band annual cause rates (qx-like).
 * Ordinary-urban baseline before geography, class, tags, and historical shocks.
 * Play starts at 5; infant/toddler rows exist so the table stays complete.
 *
 * Values are annual probabilities. The engine converts to weekly.
 * Sources are UN/WHO/historical demography ballparks for 1920–2025, not a
 * claim of census precision for every city.
 */

export const MORTALITY_AGE_BANDS = Object.freeze([
  { id: "infant", min: 0, max: 1, label: "嬰兒" },
  { id: "toddler", min: 2, max: 4, label: "幼兒" },
  { id: "child_early", min: 5, max: 9, label: "童年前期" },
  { id: "child_late", min: 10, max: 12, label: "童年後期" },
  { id: "teen", min: 13, max: 17, label: "青少年" },
  { id: "youth", min: 18, max: 24, label: "青年" },
  { id: "adult", min: 25, max: 44, label: "壯年" },
  { id: "middle", min: 45, max: 64, label: "中年" },
  { id: "senior", min: 65, max: 79, label: "老年" },
  { id: "elder", min: 80, max: 120, label: "暮年" },
]);

export const MORTALITY_YEAR_BANDS = Object.freeze([
  { id: "y1920s", years: [1920, 1929], label: "二〇年代：傳染病與產傷仍主導" },
  { id: "y1930s", years: [1930, 1939], label: "三〇年代：蕭條疊加高感染" },
  { id: "y1940s", years: [1940, 1945], label: "四〇年代前半：總力戰前的底線（戰爭另計）" },
  { id: "y1950s", years: [1946, 1959], label: "戰後重建：抗生素開始改寫兒童死亡" },
  { id: "y1960s", years: [1960, 1974], label: "疫苗擴張與嬰兒死亡下降" },
  { id: "y1980s", years: [1975, 1989], label: "初級衛生與口服補液推廣" },
  { id: "y1990s", years: [1990, 2004], label: "全球化醫療落差仍大" },
  { id: "y2010s", years: [2005, 2019], label: "低感染底線（局部衝突另計）" },
  { id: "y2020s", years: [2020, 2025], label: "疫後底線（大流行另計）" },
]);

function row(disease, accident, violence, hunger, environment, senescence) {
  return Object.freeze({ disease, accident, violence, hunger, environment, senescence });
}

export const AGE_CAUSE_RATES = Object.freeze({
  y1920s: {
    infant: row(0.16, 0.012, 0.001, 0.03, 0.008, 0),
    toddler: row(0.055, 0.008, 0.0008, 0.018, 0.006, 0),
    child_early: row(0.016, 0.005, 0.0007, 0.006, 0.003, 0),
    child_late: row(0.008, 0.004, 0.0006, 0.003, 0.002, 0),
    teen: row(0.007, 0.005, 0.0012, 0.0025, 0.002, 0),
    youth: row(0.009, 0.006, 0.002, 0.002, 0.002, 0),
    adult: row(0.012, 0.005, 0.0018, 0.002, 0.002, 0.001),
    middle: row(0.022, 0.006, 0.0015, 0.003, 0.003, 0.008),
    senior: row(0.055, 0.012, 0.001, 0.008, 0.01, 0.06),
    elder: row(0.1, 0.02, 0.0008, 0.015, 0.02, 0.18),
  },
  y1930s: {
    infant: row(0.15, 0.011, 0.0012, 0.035, 0.008, 0),
    toddler: row(0.05, 0.007, 0.001, 0.02, 0.006, 0),
    child_early: row(0.015, 0.005, 0.0009, 0.008, 0.003, 0),
    child_late: row(0.0075, 0.004, 0.0008, 0.004, 0.002, 0),
    teen: row(0.0065, 0.005, 0.0015, 0.003, 0.002, 0),
    youth: row(0.0085, 0.006, 0.0024, 0.0025, 0.002, 0),
    adult: row(0.011, 0.005, 0.002, 0.0025, 0.002, 0.001),
    middle: row(0.021, 0.006, 0.0016, 0.0035, 0.003, 0.008),
    senior: row(0.052, 0.012, 0.001, 0.01, 0.01, 0.058),
    elder: row(0.095, 0.02, 0.0008, 0.018, 0.02, 0.175),
  },
  y1940s: {
    infant: row(0.14, 0.012, 0.002, 0.03, 0.01, 0),
    toddler: row(0.048, 0.008, 0.0018, 0.018, 0.008, 0),
    child_early: row(0.014, 0.006, 0.0015, 0.007, 0.004, 0),
    child_late: row(0.007, 0.005, 0.0014, 0.004, 0.003, 0),
    teen: row(0.0065, 0.007, 0.003, 0.003, 0.003, 0),
    youth: row(0.009, 0.01, 0.006, 0.003, 0.003, 0),
    adult: row(0.012, 0.008, 0.005, 0.003, 0.003, 0.001),
    middle: row(0.02, 0.007, 0.003, 0.004, 0.004, 0.007),
    senior: row(0.05, 0.014, 0.002, 0.012, 0.014, 0.055),
    elder: row(0.09, 0.022, 0.0015, 0.02, 0.025, 0.17),
  },
  y1950s: {
    infant: row(0.09, 0.008, 0.0008, 0.016, 0.005, 0),
    toddler: row(0.028, 0.005, 0.0006, 0.01, 0.004, 0),
    child_early: row(0.008, 0.0035, 0.0005, 0.003, 0.002, 0),
    child_late: row(0.004, 0.003, 0.0005, 0.0015, 0.0015, 0),
    teen: row(0.0035, 0.004, 0.001, 0.0012, 0.0015, 0),
    youth: row(0.0045, 0.005, 0.0015, 0.001, 0.0015, 0),
    adult: row(0.006, 0.004, 0.0012, 0.001, 0.0015, 0.001),
    middle: row(0.014, 0.005, 0.001, 0.0015, 0.002, 0.006),
    senior: row(0.038, 0.01, 0.0008, 0.004, 0.008, 0.045),
    elder: row(0.075, 0.018, 0.0006, 0.008, 0.015, 0.15),
  },
  y1960s: {
    infant: row(0.055, 0.006, 0.0006, 0.01, 0.004, 0),
    toddler: row(0.016, 0.004, 0.0005, 0.006, 0.003, 0),
    child_early: row(0.0045, 0.0025, 0.0004, 0.0018, 0.0015, 0),
    child_late: row(0.0022, 0.0022, 0.0004, 0.001, 0.0012, 0),
    teen: row(0.002, 0.0035, 0.0009, 0.0008, 0.0012, 0),
    youth: row(0.0025, 0.0045, 0.0014, 0.0007, 0.0012, 0),
    adult: row(0.0038, 0.0035, 0.001, 0.0007, 0.0012, 0.0008),
    middle: row(0.01, 0.004, 0.0008, 0.001, 0.0018, 0.005),
    senior: row(0.03, 0.009, 0.0006, 0.0025, 0.007, 0.038),
    elder: row(0.06, 0.016, 0.0005, 0.005, 0.012, 0.13),
  },
  y1980s: {
    infant: row(0.035, 0.005, 0.0005, 0.007, 0.003, 0),
    toddler: row(0.01, 0.003, 0.0004, 0.004, 0.0025, 0),
    child_early: row(0.0028, 0.002, 0.00035, 0.0012, 0.0012, 0),
    child_late: row(0.0014, 0.0018, 0.00035, 0.0007, 0.001, 0),
    teen: row(0.0013, 0.0032, 0.0009, 0.0005, 0.001, 0),
    youth: row(0.0018, 0.004, 0.0015, 0.0005, 0.001, 0),
    adult: row(0.0028, 0.003, 0.001, 0.0005, 0.001, 0.0007),
    middle: row(0.008, 0.0035, 0.0007, 0.0008, 0.0015, 0.004),
    senior: row(0.024, 0.008, 0.0005, 0.0018, 0.006, 0.032),
    elder: row(0.05, 0.014, 0.0004, 0.0035, 0.01, 0.12),
  },
  y1990s: {
    infant: row(0.025, 0.004, 0.0005, 0.005, 0.0025, 0),
    toddler: row(0.007, 0.0025, 0.0004, 0.003, 0.002, 0),
    child_early: row(0.0018, 0.0016, 0.0003, 0.0008, 0.001, 0),
    child_late: row(0.0009, 0.0015, 0.0003, 0.0005, 0.0008, 0),
    teen: row(0.0009, 0.003, 0.0009, 0.0004, 0.0008, 0),
    youth: row(0.0013, 0.0036, 0.0014, 0.0004, 0.0008, 0),
    adult: row(0.0022, 0.0026, 0.0009, 0.0004, 0.0009, 0.0006),
    middle: row(0.0065, 0.003, 0.0006, 0.0006, 0.0013, 0.0035),
    senior: row(0.02, 0.007, 0.00045, 0.0014, 0.005, 0.028),
    elder: row(0.042, 0.013, 0.00035, 0.0028, 0.009, 0.11),
  },
  y2010s: {
    infant: row(0.012, 0.0025, 0.0003, 0.002, 0.0015, 0),
    toddler: row(0.003, 0.0016, 0.00025, 0.001, 0.0012, 0),
    child_early: row(0.00045, 0.001, 0.0002, 0.00025, 0.0006, 0),
    child_late: row(0.00025, 0.0009, 0.0002, 0.00015, 0.0005, 0),
    teen: row(0.0003, 0.0024, 0.0007, 0.00012, 0.0005, 0),
    youth: row(0.00055, 0.0028, 0.001, 0.00012, 0.0005, 0),
    adult: row(0.0011, 0.002, 0.0007, 0.00015, 0.0006, 0.0004),
    middle: row(0.004, 0.0024, 0.00045, 0.0003, 0.001, 0.0025),
    senior: row(0.014, 0.006, 0.0003, 0.0008, 0.004, 0.022),
    elder: row(0.032, 0.012, 0.00025, 0.0015, 0.007, 0.09),
  },
  y2020s: {
    infant: row(0.01, 0.0022, 0.00028, 0.0018, 0.0014, 0),
    toddler: row(0.0026, 0.0015, 0.00022, 0.0009, 0.0011, 0),
    child_early: row(0.0004, 0.00095, 0.00018, 0.00022, 0.00055, 0),
    child_late: row(0.00022, 0.00085, 0.00018, 0.00012, 0.00045, 0),
    teen: row(0.00028, 0.0022, 0.00065, 0.0001, 0.00045, 0),
    youth: row(0.0005, 0.0026, 0.00095, 0.0001, 0.00045, 0),
    adult: row(0.001, 0.0019, 0.00065, 0.00012, 0.00055, 0.00035),
    middle: row(0.0038, 0.0022, 0.0004, 0.00028, 0.00095, 0.0024),
    senior: row(0.015, 0.0058, 0.00028, 0.0007, 0.0042, 0.024),
    elder: row(0.036, 0.012, 0.00022, 0.0014, 0.0075, 0.095),
  },
});

export function ageBandFor(ageYears) {
  const age = Math.max(0, ageYears || 0);
  return MORTALITY_AGE_BANDS.find((band) => age >= band.min && age <= band.max) || MORTALITY_AGE_BANDS[MORTALITY_AGE_BANDS.length - 1];
}

export function yearBandFor(year) {
  const y = year || 1920;
  return MORTALITY_YEAR_BANDS.find((band) => y >= band.years[0] && y <= band.years[1]) || MORTALITY_YEAR_BANDS[MORTALITY_YEAR_BANDS.length - 1];
}

export function baselineCauseRates(ageYears, year) {
  const ageBand = ageBandFor(ageYears);
  const yearBand = yearBandFor(year);
  const table = AGE_CAUSE_RATES[yearBand.id] || AGE_CAUSE_RATES.y1920s;
  return {
    ageBand,
    yearBand,
    rates: table[ageBand.id] || table.child_early,
  };
}

/**
 * Play-window survival coefficient applied AFTER geo, history, and tags.
 * Under 10 (ages 5–9): all external cause rates × 0.5.
 * Age 10+: × 1.0. Not a halo and not immunity — tags and shocks still scale
 * the pre-coefficient invoice.
 */
export const AGE_SURVIVAL_COEFFICIENTS = Object.freeze([
  {
    id: "under_10_resilience",
    minAge: 0,
    maxAge: 9,
    coefficient: 0.5,
    label: "未滿十歲：外在風險減半",
  },
  {
    id: "age_10_standard",
    minAge: 10,
    maxAge: 120,
    coefficient: 1,
    label: "十歲起：標準死亡率",
  },
]);

export function ageSurvivalCoefficient(ageYears) {
  const age = Math.max(0, ageYears || 0);
  const row = AGE_SURVIVAL_COEFFICIENTS.find((item) => age >= item.minAge && age <= item.maxAge);
  return row || AGE_SURVIVAL_COEFFICIENTS[AGE_SURVIVAL_COEFFICIENTS.length - 1];
}
