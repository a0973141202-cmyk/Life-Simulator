/**
 * School reality writing spec (ages 5–18).
 *
 * The engine states facts. It does not moralize, redeem, or assign a heart.
 * Player stance (endure / join / lead / retaliate / report / vanish) is the triad.
 *
 * Allowed: peer bullying, campus gangs, extortion, humiliation, teacher-aligned
 * oppression, rare extreme campus violence (brawls, knives, lockdowns, shootings
 * as regional/era facts). Player may be victim or perpetrator.
 *
 * Never: sexual harm of anyone under 18, CSAM, grooming, romanticizing cruelty,
 * or converting a beating/shooting into a coming-of-age gift.
 *
 * Player-as-gunman is gated to 16+ in firearm-common countries. Younger ages
 * still encounter lockdowns and aftermath as facts, not as a shooter sandbox.
 */

export const SCHOOL_ROMANTICIZE_PATTERNS = Object.freeze([
  /霸凌讓人成長|打出真感情|校園暴力是青春/,
  /幫派是家|惡名即魅力|槍擊成就了你/,
]);

export const FIREARM_SCHOOL_COUNTRY_RE = /美國|加拿大/;

export const SCHOOL_COST_NOTE =
  "校園加害不被寫成酷。它留下標籤、仇恨值與帳簿，並在後續週次引爆報復、紀錄或法辦。";

export const SCHOOL_STANCE_NOTE =
  "系統只陳述發生了什麼。心境、站隊與下一步由三選一決定，不代寫。";

export const SCHOOL_PROSE_NOTE =
  "文風：主體敘述直白清晰、拒絕謎語人。點出利害後立刻給門。同學或老師怎麼說話看個性與對你的態度；系統仍點明他要什麼。";
