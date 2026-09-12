/**
 * Crime / politics / heat meters. Separate from life stats (health, mood, …).
 * Tags derived from these meters stay contextual: wanted is pressure, not a moral score.
 */

export const LEDGER_METERS = Object.freeze([
  "wanted",
  "heat",
  "trust",
  "opinion",
  "notoriety",
  "politicalCapital",
  "infamy",
  "healthRisk",
  "reputation",
  "socialCredit",
]);

export const LEDGER_PATHS = Object.freeze([
  "lawful",
  "commerce",
  "crime",
  "narcotics",
  "militant",
  "politics",
  "historical",
]);

export const LEDGER_MIN = 0;
export const LEDGER_MAX = 100;
export const PATH_XP_MAX = 40;
export const LEDGER_LOG_LIMIT = 48;

export const TRUST_BY_CLASS = Object.freeze({
  gentry: 68,
  official: 64,
  merchant: 58,
  intellectual: 56,
  military: 54,
  artisan: 52,
  peasant: 50,
  worker: 48,
  immigrant: 42,
});

export const OCCUPATION_BY_PATH = Object.freeze({
  historical: "時代操盤",
  militant: "武裝政治",
  narcotics: "地下貨流",
  crime: "地下秩序",
  politics: "政治",
  commerce: "商界",
  lawful: "體制內",
});
