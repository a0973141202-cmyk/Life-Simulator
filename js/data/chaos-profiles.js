/**
 * Weekly chaos profiles. The triad is not balanced on purpose:
 * a week may be all grace, all ruin, or three unrelated invoices.
 */

export const CHAOS_PROFILES = Object.freeze([
  {
    id: "all_grace",
    label: "全盤順風",
    weight: 1,
    slots: ["good", "good", "good"],
    note: "三扇門看起來都像禮物。禮物仍可能收費。",
  },
  {
    id: "all_ruin",
    label: "全盤惡兆",
    weight: 1,
    slots: ["bad", "bad", "bad"],
    note: "這一週沒有安全選項。不選也是一種選。",
  },
  {
    id: "mixed_split",
    label: "裂開的三路",
    weight: 1.7,
    slots: ["good", "bad", "scramble"],
    note: "好、壞、與完全不對題的第三件事並列。",
  },
  {
    id: "noise",
    label: "毫無邏輯",
    weight: 2.1,
    slots: ["scramble", "scramble", "scramble"],
    note: "選項與後果不必互相解釋。選了仍入帳。",
  },
  {
    id: "trap_week",
    label: "字面陷阱",
    weight: 1.4,
    slots: ["trap", "trap", "foggood"],
    note: "三扇門都寫得出你在做什麼。有的不把數字印出來；有的字面輕、帳重。",
  },
  {
    id: "one_door",
    label: "只有一扇不像門",
    weight: 1.2,
    slots: ["bad", "bad", "good"],
    note: "兩扇代價很重，一扇看起來輕。",
  },
  {
    id: "mirror",
    label: "同一句話的三種讀法",
    weight: 0.9,
    slots: ["good", "trap", "bad"],
    note: "三句話可以像同一件事。帳單不是。",
  },
]);
