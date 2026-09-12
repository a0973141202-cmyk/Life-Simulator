/**
 * Adult society writing spec (ages 18+).
 *
 * After the character is legally adult and enters society, occupations, labor,
 * commerce, politics, gangs, crime, and other anti-social facts follow real-world
 * mechanics: class, cash, paperwork, violence, and reprisal. The engine states
 * facts. It does not sermonize, redeem, or assign a heart.
 *
 * Player may take a lawful path (wage labor, office, commerce, politics) or a
 * dark path (underworld, crime, authoritarian machinery). The triad is the heart.
 *
 * Every dark / violent / betrayal choice raises crisis and is billed: wanted,
 * heat, liquidation, breakdown, legal sanction. No protagonist halo.
 *
 * Never: sexual harm of anyone under 18, CSAM, grooming, a playable CSA path,
 * or converting crime/injury into cool, family, or destiny.
 *
 * Occupation and dark-ecology databases stay modular so later work can fill
 * real operating details slowly and precisely.
 */

export const ADULT_ROMANTICIZE_PATTERNS = Object.freeze([
  /犯罪讓人自由|黑道是家|江湖義氣成就了你/,
  /主角光環|法律奈何不了你|作惡無代價/,
  /腐敗是智慧|出賣是格局|暴力是浪漫/,
]);

export const ADULT_COST_NOTE =
  "社會選擇沒有主角光環。犯罪、背叛、暴力與極端路線會拉高危機係數，並以通緝、反噬、清算、崩潰或法辦計價。";

export const ADULT_STANCE_NOTE =
  "系統只提供事件、環境事實與選項。心境轉折與站隊由三選一決定，不代寫。";

export const ADULT_REALISM_NOTE =
  "步入社會後，各行各業、基層勞動、商場、政商、地下社會與犯罪按現實規律與殘酷本質處理，不做道德美化或過度審查。";

export const ADULT_PROSE_NOTE =
  "文風：主體敘述直白清晰、拒絕謎語人。點出利害後立刻給門。NPC 口吻跟個性與對你的態度走；系統仍點明他要什麼。";
