/**
 * School-ecology tags. Social facts and perpetrator records, not assigned feelings.
 * A target mark is a position on the yard map. A bully mark is a bill.
 */

export const SCHOOL_TAG_DATABASE = Object.freeze([
  {
    id: "school_bullied",
    label: "被點名的獵物",
    hooks: ["school", "social", "hide"],
    advantageIn: ["hide"],
    strainIn: ["school", "social", "study"],
    reason: "同學地圖把你標成可下手的人。這是位置，不是性格鑑定。",
  },
  {
    id: "school_bully",
    label: "校園加害者",
    hooks: ["school", "street", "crime"],
    advantageIn: ["street", "crime", "leadership"],
    strainIn: ["study", "official", "trust"],
    reason: "你動手或指揮過對同學的傷害。惡名在院子裡是通貨，在紀錄裡是證物。",
  },
  {
    id: "school_ringleader",
    label: "孩子王／頭目",
    hooks: ["school", "leadership", "crime"],
    advantageIn: ["leadership", "street", "crime"],
    strainIn: ["official", "trust", "family"],
    reason: "你開始分配誰挨打、誰交保護費。權力在未成年人裡一樣會留下名單。",
  },
  {
    id: "school_gang",
    label: "校園幫派份子",
    hooks: ["school", "crime", "street"],
    advantageIn: ["street", "crime"],
    strainIn: ["study", "official", "family"],
    reason: "組織、貢品、放風與報復已寫進你的週課表。",
  },
  {
    id: "school_enforcer",
    label: "校園打手",
    hooks: ["school", "street"],
    advantageIn: ["street"],
    strainIn: ["study", "social", "official"],
    reason: "你的用途是手。頭目用完仍可把你交出。",
  },
  {
    id: "school_hated",
    label: "仇恨標記",
    hooks: ["school", "street"],
    advantageIn: [],
    strainIn: ["school", "social", "health"],
    reason: "有人在等你一個人走。仇恨值不是氣氛，是延遲的動手。",
  },
  {
    id: "school_record",
    label: "校方處分紀錄",
    hooks: ["official", "study"],
    advantageIn: [],
    strainIn: ["study", "official", "family"],
    reason: "記過、處分或約談家長已進檔。檔案比記憶更耐久。",
  },
  {
    id: "school_expelled",
    label: "退學／勒令離開",
    hooks: ["official", "street"],
    advantageIn: ["street"],
    strainIn: ["study", "official", "family"],
    reason: "學籍被切斷。出路變窄，街上的人會先看見你。",
  },
  {
    id: "school_snitch_marked",
    label: "告密者標記",
    hooks: ["school", "social"],
    advantageIn: ["official"],
    strainIn: ["school", "street", "social"],
    reason: "開口換來的保護通常短過報復。",
  },
  {
    id: "school_weapon",
    label: "攜械紀錄",
    hooks: ["crime", "street", "school"],
    advantageIn: ["crime"],
    strainIn: ["official", "health", "trust"],
    reason: "刀、棍或槍進過校園與你的隨身物品。法律與同學都會記得。",
  },
  {
    id: "school_lockdown",
    label: "校園封鎖經歷",
    hooks: ["school", "hide", "survival"],
    advantageIn: ["hide", "survival"],
    strainIn: ["school", "study"],
    reason: "你經歷過封鎖、疏散或走廊上的極端暴力。這是事件紀錄，不是指定情緒。",
  },
  {
    id: "school_climate_predatory",
    label: "掠食性校園氣候",
    hooks: ["school"],
    advantageIn: ["street"],
    strainIn: ["study", "social"],
    reason: "這所學校的院子把傷害當秩序。權重上升，不是宿命。",
  },
]);

export const SCHOOL_TAG_INDEX = Object.freeze(
  Object.fromEntries(SCHOOL_TAG_DATABASE.map((row) => [row.id, row])),
);

export const SCHOOL_CLIMATE_TAGS = Object.freeze([
  {
    id: "school_climate_predatory",
    label: "掠食性校園氣候",
    chance: {
      default: 0.16,
      slum: 0.32,
      warzone: 0.28,
      camp: 0.22,
      industrial: 0.2,
      village: 0.12,
      gentry: 0.1,
    },
    reason: "開局校園被標為傷害密度較高。遭遇權重上升，不是每個孩子都必須當頭目或獵物。",
    advantageIn: ["street"],
    strainIn: ["study", "social"],
  },
]);
