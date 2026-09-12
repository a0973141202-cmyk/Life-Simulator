/**
 * Trauma writing spec. Content modules must follow this; trauma-engine enforces costs.
 *
 * Allowed (player as victim, 5–18): domestic violence, alcoholic/disqualified parents,
 * neglect, child labor extraction, non-sexual predation of labor/time/body-as-property,
 * teacher/authority beating, humiliation, confinement, wage theft.
 *
 * Never: sexual harm, sexual "越界", grooming, CSAM, or options to perpetrate
 * abuse against other children. Those remain hard-blocked.
 *
 * Voice: oppressive, clinical-sensory, no redemption in the same beat.
 * Abuser slogans may appear as quoted speech, then be billed as injury.
 */

export const TRAUMA_ROMANTICIZE_PATTERNS = Object.freeze([
  /因禍得福|打是親罵是愛|愛的管教成就了你/,
  /甜蜜的痛|浪漫化|讓你更堅強(?:的愛|的家)/,
  /暴力讓人成熟|被打過才懂事是好事/,
]);

export const SEXUAL_MINOR_PATTERNS = Object.freeze([
  /兒童色情|兒童性侵|兒童性剝削|性剝削.{0,12}(兒童|幼童|未成年人|學生)/,
  /性侵.{0,10}(孩|童|幼|未成年|學生)/,
  /猥褻.{0,10}(兒童|幼童|幼女|學生)|對.{0,8}(兒童|幼童).{0,8}(性|裸)/,
  /csam|child\s*porn|pedo(?:phil)?|grooming/i,
  /under[- ]?18.{0,20}(sex|rape|molest)/i,
  /性侵犯|性暴力|強姦|迷姦/,
]);

export const TRAUMA_COST_NOTE =
  "創傷不是轉折美談。它留下標籤，並在往後的選擇裡繼續收費。";

export const TRAUMA_PROSE_NOTE =
  "文風：主體敘述直白清晰、拒絕謎語人。壓迫寫成可感知的事實。施壓的人可以傲慢或含糊，系統仍點明傷害與代價。";
