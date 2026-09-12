/**
 * Socioeconomic origin tags. Neutral: scarcity can train vigilance;
 * capital can isolate; displacement can build language and packing skill.
 */

export const SOCIO_TAG_DATABASE = [
  {
    id: "extreme_poverty",
    tag: "socio_extreme_poverty",
    label: "極度貧困出身",
    reason: "原生家庭幾乎沒有緩衝儲備。",
    advantageIn: ["survival", "scarcity", "war"],
    strainIn: ["study", "health", "urban"],
    classes: ["peasant", "immigrant"],
    kinds: ["slum", "camp"],
    wealthMax: 16,
  },
  {
    id: "working_poor",
    tag: "socio_working_poor",
    label: "勞動貧困",
    reason: "家計貼著工時與糧價，沒有真正的閒錢。",
    advantageIn: ["labor", "craft"],
    strainIn: ["study"],
    classes: ["worker", "artisan", "peasant"],
  },
  {
    id: "merchant_capital",
    tag: "socio_merchant_capital",
    label: "商號資本",
    reason: "帳冊、存貨與人情是家裡的基礎設施。",
    advantageIn: ["trade", "urban"],
    strainIn: ["war", "scarcity"],
    classes: ["merchant"],
  },
  {
    id: "official_network",
    tag: "socio_official_network",
    label: "體制人脈",
    reason: "門檻內外的規矩被當成母語來學。",
    advantageIn: ["urban", "study"],
    strainIn: ["war", "purge"],
    classes: ["official"],
  },
  {
    id: "gentry_estate",
    tag: "socio_gentry_estate",
    label: "舊族體面",
    reason: "禮儀與門楣比現金更先被保住。",
    advantageIn: ["social", "study"],
    strainIn: ["revolution", "scarcity"],
    classes: ["gentry"],
  },
  {
    id: "intellectual_house",
    tag: "socio_intellectual_house",
    label: "書香門第",
    reason: "字被當成出路，也被當成禍根。",
    advantageIn: ["study", "language"],
    strainIn: ["purge", "war"],
    classes: ["intellectual"],
  },
  {
    id: "military_household",
    tag: "socio_military_household",
    label: "軍旅家庭",
    reason: "遷徙、口令與突然的缺席是童年節奏。",
    advantageIn: ["combat", "discipline"],
    strainIn: ["war", "mood"],
    classes: ["military"],
  },
  {
    id: "war_displacement",
    tag: "socio_war_displacement",
    label: "戰亂流離",
    reason: "出生地正在或剛經歷武裝衝突／強制遷徙。",
    advantageIn: ["survival", "diaspora"],
    strainIn: ["health", "study", "mood"],
    kinds: ["warzone", "camp"],
  },
  {
    id: "refugee_camp",
    tag: "socio_refugee_camp",
    label: "營區出身",
    reason: "戶籍是臨時的，水與學校按配給來。",
    advantageIn: ["survival", "language"],
    strainIn: ["wealth", "health"],
    kinds: ["camp"],
  },
  {
    id: "slum_density",
    tag: "socio_slum_density",
    label: "高密度貧民區",
    reason: "巷弄、共用龍頭與非正式經濟構成整個社會。",
    advantageIn: ["urban", "social", "survival"],
    strainIn: ["health"],
    kinds: ["slum"],
  },
  {
    id: "immigrant_insecurity",
    tag: "socio_immigrant_insecurity",
    label: "移民身分不穩",
    reason: "口音、證件與「回去」的假設同時存在。",
    advantageIn: ["language", "trade", "diaspora"],
    strainIn: ["official", "study"],
    classes: ["immigrant"],
  },
  {
    id: "arctic_scarcity",
    tag: "socio_arctic_scarcity",
    label: "極地補給依賴",
    reason: "一年的菜單取決於船班與凍土路。",
    advantageIn: ["arctic", "survival"],
    strainIn: ["scarcity", "health"],
    kinds: ["arctic"],
  },
  {
    id: "underground_life",
    tag: "socio_underground_life",
    label: "地下住居",
    reason: "日光是配給，方向感寫在岩壁與走廊裡。",
    advantageIn: ["underground", "survival"],
    strainIn: ["health", "mood"],
    kinds: ["underground"],
  },
];

export function socioTagsForOrigin({ familyClass, settlement, wealth }) {
  const classId = familyClass?.id;
  const kind = settlement?.kind;
  const out = [];
  const seen = new Set();
  for (const item of SOCIO_TAG_DATABASE) {
    let hit = Boolean(item.kinds?.includes(kind));
    if (item.classes?.includes(classId)) {
      hit = item.wealthMax == null || !Number.isFinite(wealth) || wealth <= item.wealthMax;
    }
    if (!hit) continue;
    if (seen.has(item.tag)) continue;
    seen.add(item.tag);
    out.push({
      ...item,
      valence: "contextual",
      category: "socio",
    });
  }
  return out;
}
