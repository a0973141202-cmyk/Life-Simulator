/**
 * Historical figures & butterfly-effect writing spec.
 *
 * A figure is a dated public body, not a destiny. They appear only inside
 * their visibility window and geography. Canonical history is the default
 * program; it is not sacred. A player who can pay the price may rewrite it.
 *
 * Never: sexual harm of anyone under 18, CSAM, assassination recipes,
 * converting intervention into heroism, or a plot-armor save of the century.
 */

export const FIGURE_STANCE_NOTE =
  "系統只陳述此人此刻在此地的公開位置。結盟、旁觀或干預由三選一決定；心境不代寫。";

export const FIGURE_COST_NOTE =
  "干預歷史會寫入獨立的歷史狀態，並以國家機器、權力集團與歷史慣性計價。成功不是解脫，是改寫後的新帳。";

export const FIGURE_PROSE_NOTE =
  "文風：主體敘述直白清晰、拒絕謎語人。點出此人此刻的公開位置與利害。他們怎麼對你說話看身份與態度；系統仍點明利害。";

export const FIGURE_ROLES = Object.freeze([
  "politician",
  "military",
  "scientist",
  "artist",
  "socialite",
  "crime",
]);

export const FIGURE_VENUES = Object.freeze([
  "street",
  "politics",
  "warzone",
  "underworld",
  "school",
  "work",
  "lab",
  "salon",
  "media",
]);

export const FIGURE_PROXIMITY = Object.freeze(["city", "country", "region", "global"]);

export const FIGURE_STATUS_LABEL = Object.freeze({
  rising: "尚未掌權／正在發跡",
  power: "權力高峰",
  war: "戰爭職能",
  fallen: "失勢／退場中",
  departed: "已故或已退出公開程序",
  rewritten: "被改寫後的位置",
});

export const RELATION_LABEL = Object.freeze({
  witness: "在場目擊者",
  ally: "結盟／合作",
  client: "被其機器使用",
  enemy: "敵對",
  hunted: "被其體系追捕",
});
