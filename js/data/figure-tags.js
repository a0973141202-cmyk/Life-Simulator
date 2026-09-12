/**
 * Figure / butterfly tags. Positions on a rewritten timeline, not assigned feelings.
 */

export const FIGURE_TAG_DATABASE = Object.freeze([
  {
    id: "figure_witness",
    label: "歷史現場目擊者",
    hooks: ["historical", "hide"],
    advantageIn: ["historical", "hide"],
    strainIn: ["official", "politics"],
    reason: "你與一個公開的歷史身體共用過半徑。這是在場紀錄。",
  },
  {
    id: "figure_orbit",
    label: "進入巨物軌道",
    hooks: ["politics", "historical", "social"],
    advantageIn: ["politics", "historical"],
    strainIn: ["hide", "trust"],
    reason: "你被一個還在運轉的歷史機器看見。被看見會收費。",
  },
  {
    id: "figure_ally",
    label: "與歷史人物結盟",
    hooks: ["politics", "historical"],
    advantageIn: ["politics", "historical"],
    strainIn: ["official", "trust"],
    reason: "合作被寫進兩邊的名單。名單比友誼長。",
  },
  {
    id: "figure_enemy",
    label: "與歷史人物敵對",
    hooks: ["politics", "historical", "crime"],
    advantageIn: [],
    strainIn: ["official", "survival", "politics"],
    reason: "敵對不是個性。它是清算隊列裡的一個位置。",
  },
  {
    id: "figure_client",
    label: "為其機器辦事",
    hooks: ["politics", "crime", "work"],
    advantageIn: ["politics", "crime"],
    strainIn: ["trust", "official"],
    reason: "你被用成手續。手續在清算時最先被交出去。",
  },
  {
    id: "figure_hunted",
    label: "歷史反噬通緝",
    hooks: ["hide", "official", "survival"],
    advantageIn: ["hide"],
    strainIn: ["travel", "official", "health"],
    reason: "國家機器或權力集團開始用你的臉辦公。",
  },
  {
    id: "figure_butterfly",
    label: "年表被改過",
    hooks: ["historical", "politics", "crime"],
    advantageIn: ["historical"],
    strainIn: ["official", "survival", "trust"],
    reason: "這條街之後的說法開始跟以前不一樣。",
  },
  {
    id: "figure_failed_hand",
    label: "干預未遂",
    hooks: ["historical", "crime", "hide"],
    advantageIn: [],
    strainIn: ["official", "survival"],
    reason: "企圖被記錄。失敗比成功更常留下可被指認的手。",
  },
]);

export const FIGURE_TAG_INDEX = Object.freeze(
  Object.fromEntries(FIGURE_TAG_DATABASE.map((row) => [row.id, row])),
);
