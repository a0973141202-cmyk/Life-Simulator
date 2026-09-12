/**
 * Public-facing Traditional Chinese labels.
 * Engine IDs stay English; HUD / logs must not print them.
 */

import { scrubPublicText } from "./public-text.js";

export const CLIMATE_ZH = Object.freeze({
  tropical: "熱帶",
  subtropical: "亞熱帶",
  temperate: "溫帶",
  continental: "大陸性",
  cold: "寒帶",
  arid: "乾燥",
  highland: "高原",
  mediterranean: "地中海",
  monsoon: "季風",
  polar: "極地",
  tropical_savanna: "熱帶草原",
  subpolar: "亞寒帶",
});

export const REGION_ZH = Object.freeze({
  china: "中國",
  taiwan: "臺灣",
  hongkong: "港澳",
  japan: "日本",
  korea: "朝鮮半島",
  mongolia: "蒙古",
  se_asia: "東南亞",
  south_asia: "南亞",
  middle_east: "西亞",
  africa: "非洲",
  russia: "俄蘇地帶",
  west: "歐美",
  latin_america: "拉丁美洲",
  oceania: "大洋洲",
  arctic: "極地圈",
});

export const CLASS_ZH = Object.freeze({
  peasant: "貧農",
  artisan: "工匠",
  worker: "工人",
  merchant: "商賈",
  intellectual: "知識分子",
  official: "官員世家",
  military: "軍人家庭",
  gentry: "舊族遺緒",
  immigrant: "移民家庭",
});

export const PATH_ZH = Object.freeze({
  lawful: "體制內",
  commerce: "商界",
  crime: "地下",
  narcotics: "貨流",
  militant: "武裝",
  politics: "政治",
  historical: "時代操盤",
});

export const PRESSURE_ZH = Object.freeze({
  idle: "未點名",
  calm: "尚未被點名",
  watch: "已被注視",
  crisis: "清算中",
  ruin: "毀壞邊緣",
});

export const GEO_BAND_ZH = Object.freeze({
  affluent_safe: "富裕安全區域",
  ordinary: "普通城市／鄉鎮",
  industrial: "工業傷害帶",
  rural: "醫療稀薄農村",
  slum: "極度貧民窟",
  camp: "難民／收容營",
  warzone: "戰亂交織區",
  arctic: "極地／惡劣自然環境",
  underground: "地下／礦坑環境",
  disaster: "極端氣候災難週",
});

export const MORTALITY_CAUSE_ZH = Object.freeze({
  disease: "疫病",
  hunger: "飢餓",
  violence: "戰亂暴力",
  accident: "意外",
  environment: "極端環境",
  senescence: "衰老",
  collapse: "健康歸零",
});

export const TAG_ID_ZH = Object.freeze({
  acquired_wanted: "通緝壓力",
  acquired_high_heat: "風聲正緊",
  acquired_low_trust: "信任破裂",
  acquired_infamy: "惡名遠播",
  acquired_low_opinion: "輿論翻臉",
  acquired_low_credit: "信用見底",
  path_crime: "地下路徑",
  path_narcotics: "貨流帝國",
  path_militant: "武裝政治",
  path_politics: "體制路徑",
  path_historical: "歷史操盤",
  path_tycoon: "資本路徑",
  path_lawful: "合法上升",
  social_feared: "被人怕",
  social_shunned: "被排開",
  social_cold: "被冷遇",
  social_ordinary: "路人級",
  social_trusted: "還被肯認",
  social_courted: "被人靠近",
});

const HAN_RE = /[\u4e00-\u9fff]/;
const DEBUG_ID_RE = /^[A-Za-z][A-Za-z0-9]*(_[A-Za-z0-9]+)+$/;
const DEBUG_WORD_RE = /^(calm|watch|crisis|ruin|idle|lawful|commerce|crime|disease|hunger|accident|violence|environment|senescence|collapse|tropical|subtropical|temperate|continental|polar|arctic)$/i;

export function hasHan(text) {
  return HAN_RE.test(String(text || ""));
}

export function isDebugCode(text) {
  const value = String(text || "").trim();
  if (!value) return true;
  if (hasHan(value)) return false;
  if (DEBUG_ID_RE.test(value)) return true;
  if (DEBUG_WORD_RE.test(value)) return true;
  if (/^[a-z]+\/[a-z]+/i.test(value) && !hasHan(value)) return true;
  return false;
}

function lookupPrefixed(id) {
  if (!id || typeof id !== "string") return "";
  if (TAG_ID_ZH[id]) return TAG_ID_ZH[id];
  if (id.startsWith("climate_")) return CLIMATE_ZH[id.slice(8)] || "";
  if (id.startsWith("region_")) return REGION_ZH[id.slice(7)] || "";
  if (id.startsWith("class_")) return CLASS_ZH[id.slice(6)] || "";
  if (id.startsWith("path_")) return PATH_ZH[id.slice(5)] || "";
  return CLIMATE_ZH[id] || REGION_ZH[id] || CLASS_ZH[id] || PATH_ZH[id] || PRESSURE_ZH[id] || MORTALITY_CAUSE_ZH[id] || "";
}

export function publicTagLabel(record = {}) {
  const raw = record.label || "";
  if (hasHan(raw) && !isDebugCode(raw)) return raw.trim();
  const fromId = lookupPrefixed(record.id);
  if (fromId) return fromId;
  const fromLabel = lookupPrefixed(raw);
  if (fromLabel) return fromLabel;
  return "";
}

export function zhClimate(id) {
  return CLIMATE_ZH[id] || (hasHan(id) ? id : "");
}

export function zhRegion(id) {
  return REGION_ZH[id] || (hasHan(id) ? id : "");
}

export function zhPressure(level) {
  return PRESSURE_ZH[level] || (hasHan(level) ? level : "尚未被點名");
}

export function zhPath(id) {
  return PATH_ZH[id] || (hasHan(id) ? id : "未定");
}

export function zhCause(id) {
  return MORTALITY_CAUSE_ZH[id] || (hasHan(id) ? id : "不明死因");
}

export function sanitizePublicLine(line) {
  let text = String(line || "");
  if (!text) return "";
  text = text.replace(/主要死因通道：([A-Za-z／/\-]+)/g, (_, raw) => {
    const zh = String(raw).split(/[／/]/).map((item) => zhCause(item.trim())).join("／");
    return `主要死因通道：${zh}`;
  });
  text = text.replace(/因果壓力：([a-z]+)（[^）]+）。/g, (_, level) => `公開壓力：${zhPressure(level)}。`);
  text = text.replace(/公開壓力：([a-z]+)。/g, (_, level) => `公開壓力：${zhPressure(level)}。`);
  text = text.replace(/壓力 ([a-z]+)。/g, (_, level) => `壓力 ${zhPressure(level)}。`);
  text = text.replace(/主路徑 ([a-z]+)\(\d+\)/g, (_, id) => `街坊開始把你往${zhPath(id)}那一頭歸類`);
  text = text.replace(/通緝 \d+／熱度 \d+／信任 \d+／輿論 \d+[^\n。]*。/g, "");
  text = text.replace(/【全域事件／([^／]*?)([a-z_]+)／客觀事實】/g, (_, prefix, band) => {
    return `${prefix}${GEO_BAND_ZH[band] || "本地"}。`;
  });
  for (const [id, label] of Object.entries(GEO_BAND_ZH)) {
    text = text.replaceAll(` · ${id}／`, ` · ${label}／`);
  }
  text = text.replace(/Sentinelese/g, "北哨兵島居民");
  return scrubPublicText(text);
}
