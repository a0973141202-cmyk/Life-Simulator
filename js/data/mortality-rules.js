/**
 * Mortality writing spec.
 *
 * Weekly survival is a historical/geographic invoice, not a narrative privilege.
 * No floor, no pity reroll, no protagonist halo. High natal talent, charm, or
 * intelligence does not buy a second chance against infection, hunger, stray
 * fire, or exposure. A character may die in the first week of play at age 5.
 *
 * Tags and class modify weights because they change access to food, shelter,
 * and medical care — not because the engine likes the player.
 * Environmental adaptations (cold, altitude, malaria-belt) only cut matching
 * environmental/disease hazards, never violence.
 *
 * Ages 5–9 apply a 0.5 coefficient to all external cause rates after geo,
 * history, and tags are stacked. Age 10+ uses 1.0. This is resilience, not a
 * floor: neglect, famine overlays, and war still raise the pre-coefficient bill.
 */

export const MORTALITY_COST_NOTE =
  "生存檢定沒有保底。戰亂、疫區、饑荒與惡劣環境按歷史與地理收費；天賦與主角身分不入帳。";

export const MORTALITY_HALO_FORBIDDEN = Object.freeze([
  /主角光環/,
  /保底/,
  /幸運復活/,
  /因為是玩家而/,
]);
