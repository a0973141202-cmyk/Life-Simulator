/**
 * Perpetrator-caste writing spec (adult prison / underworld only).
 *
 * This module is about a legal-social caste: people convicted of sexual
 * crimes against minors. It is not a tutorial, not a romance, not a path
 * the player can choose to walk as offender.
 *
 * Never generate:
 *   - sexual acts, bodies, ages, or scenes involving anyone under 18
 *   - CSAM, grooming methods, victim descriptions
 *   - the offender's sexual interiority, attraction, or "motivation" toward children
 *   - options to commit sexual harm against minors
 *   - praise, tragic-hero framing, "misunderstood love", orientation-as-excuse
 *
 * Allowed, 18+ only, cost-heavy:
 *   - caste management (protective custody, isolation, last in line)
 *   - inmate / public ostracism and extra-legal violence as documented ecology
 *   - the convict's public speech as denial/minimization ("誤會", "律師害我")
 *     billed as pollution, never as a case for the player to accept
 *   - tags on the player for adjacency, witnessing, or joining the beating
 *
 * Security level does not cancel the caste. Maximum-security still has a despised
 * bottom; minimum-security still has a rumor mill and a beating behind the shed.
 */

export const PERP_CASTE_ROMANTICIZE_PATTERNS = Object.freeze([
  /被誤解的愛|真感情只是|取向應被尊重/,
  /可憐的加害者|悲劇英雄|愛情不分年齡/,
  /那只是愛|他其實很溫柔|因禍得福/,
]);

/** Always blocked, including inside caste-ecology modules. */
export const SEXUAL_MINOR_ACT_PATTERNS = Object.freeze([
  /兒童色情|兒童性剝削|CSAM|child\s*porn/i,
  /猥褻.{0,10}(兒童|幼童|幼女|學生)/,
  /對.{0,8}(兒童|幼童|幼女|未成年).{0,10}(性交|性器官|裸|猥褻)/,
  /引誘.{0,8}(兒童|幼童).{0,8}性|grooming/i,
  /如何.{0,12}(性侵|猥褻).{0,8}(兒童|幼|未成年)/,
  /描述.{0,10}(兒童|幼童).{0,8}性/,
]);

export const PERP_CASTE_COST_NOTE =
  "這不是酷，也不是正義高光。靠近這一種姓會留下汙染、厭惡與聲譽帳單；參與私刑同樣進帳。";

export const PERP_CASTE_STANCE_NOTE =
  "系統只陳述獄內／社會種姓如何運作。不代寫你的同情，也不把否認當成事實。";
