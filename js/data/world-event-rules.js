/**
 * Global contextual random-event writing spec.
 *
 * An event is a fact in a year, a settlement, and a geo-band. It is not a
 * mood. Heart and next move stay in the triad.
 *
 * Filtering is strict: a 2020 epidemic does not appear in 1933; a polar
 * whiteout does not appear in a tropical port; a city-specific shock does
 * not appear in the wrong city.
 *
 * Never: sexual harm of anyone under 18, CSAM, grooming, a playable CSA path,
 * methods/recipes for crime, or converting injury into cool / destiny / family.
 */

export const WORLD_STANCE_NOTE =
  "系統只陳述這一週在此地發生了什麼。心境、反抗、沈默、加入或墮落由三選一決定，不代寫。";

export const WORLD_COST_NOTE =
  "選擇會寫入標籤與帳簿，並改變後續生存檢定與危機係數。凡選必有代價。";

export const WORLD_PROSE_NOTE =
  "文風：主體敘述直白清晰、拒絕謎語人。點出此地此年的事實與利害。NPC 口吻跟個性與對你的態度走；系統仍點明他要什麼。";

export const WORLD_CRISIS_KINDS = Object.freeze(["survival", "historical", "dark"]);

export const WORLD_KIND_LOCK = Object.freeze({
  survival: "crisis",
  historical: "crisis",
  dark: "crisis",
  household: "crisis",
  mundane: "scene",
  labor: "scene",
});
