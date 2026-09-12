/**
 * Strict red-line rules for the sandbox engine.
 * Sexual harm involving anyone under 18 is never generated or resolved.
 * Household / authority trauma may be written as player-as-victim (non-sexual).
 * Peer school violence (bullying, gangs, campus fights) may be victim or perpetrator
 * for ages 5–18 when marked schoolPeerHarm + schoolNonsexual. Still never sexual.
 * Player-as-gunman is gated in data to 16+ firearm-common countries.
 * Adult prison/underworld may depict the social caste of people convicted of
 * sexual crimes against minors (ostracism, extra-legal violence) without
 * describing acts, victims, or a playable path to commit that crime.
 */

export const MINOR_PROTECT_AGE = 12;
export const ADULT_SANDBOX_AGE = 18;
export const TEEN_GRAY_AGE = 16;

/** Domains that must never appear while the player is under 12. */
export const ADULT_ONLY_DOMAINS = Object.freeze([
  "crime",
  "narcotics",
  "militant",
  "historical",
  "politics",
  "commerce_power",
  "sexual",
  "terror",
]);

/** Action flags that always fail closed. */
export const REDLINE_FLAGS = Object.freeze([
  "harms_minors",
  "exploits_minors",
  "child_abuse",
  "child_sexual",
  "child_trafficking",
]);

/**
 * Fail-closed lexical scan. Keep patterns broad; false positives are acceptable,
 * false negatives are not. Ordinary childhood play / study / family care must not match.
 */
export const REDLINE_PATTERNS = Object.freeze([
  /兒童色情|兒童性侵|兒童性剝削|性剝削.{0,12}(兒童|幼童|未成年人)/,
  /虐童|虐待兒童|對.{0,10}(兒童|幼童|未滿十二|12\s*歲以下).{0,12}(性|虐|剝削|凌虐)/,
  /販賣兒童|拐賣兒童|兒童販運|買賣兒童/,
  /幼女|幼童.{0,8}(性|裸|猥褻)|猥褻.{0,8}(兒童|幼童|幼女)/,
  /csam|child\s*porn|pedo(?:phil)?|hebephile|infantophil/i,
  /under[- ]?12.{0,24}(sex|rape|abuse|exploit|porn|traffick)/i,
  /minor.{0,16}(sexual|rape|exploit|traffick|abuse)/i,
  /sexual.{0,16}(child|infant|toddler|preteen)/i,
]);

export const BOUNDARY_BLOCK_MESSAGE =
  "這條路在這一週走不通。現場沒有給出下一步。";
