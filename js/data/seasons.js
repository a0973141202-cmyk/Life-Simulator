/**
 * Hemisphere seasons and local environment tags derived from
 * an exact Gregorian date + settlement latitude / climate.
 *
 * Natal tags (stored on the character):
 *   date_winter, date_month_07, hemisphere_south, env_extreme_cold, ...
 *
 * Current-week tags (injected into event context only):
 *   current_season_summer, current_env_heat, ...
 */

import { TAG_PREFIX } from "./tag-schema.js";

export const EQUATOR_BAND = 12;
export const ARCTIC_CIRCLE = 66.5;
export const ANTARCTIC_CIRCLE = -66.5;

const NORTH_SEASON = {
  1: "winter", 2: "winter", 3: "spring", 4: "spring", 5: "spring",
  6: "summer", 7: "summer", 8: "summer", 9: "autumn", 10: "autumn",
  11: "autumn", 12: "winter",
};

const SEASON_LABELS = {
  winter: "冬季",
  spring: "春季",
  summer: "夏季",
  autumn: "秋季",
  wet: "雨季",
  dry: "旱季",
};

export function hemisphereFromLat(lat) {
  if (lat > EQUATOR_BAND) return "north";
  if (lat < -EQUATOR_BAND) return "south";
  return "equatorial";
}

export function meteorologicalSeason(month, hemisphere) {
  if (hemisphere === "equatorial") return null;
  const north = NORTH_SEASON[month];
  if (hemisphere === "south") {
    if (north === "winter") return "summer";
    if (north === "summer") return "winter";
    if (north === "spring") return "autumn";
    return "spring";
  }
  return north;
}

export function tropicalSeason(month, lat) {
  const northish = lat >= 0;
  const wetMonths = northish ? [5, 6, 7, 8, 9, 10] : [11, 12, 1, 2, 3, 4];
  return wetMonths.includes(month) ? "wet" : "dry";
}

function polarDaylight(lat, month) {
  if (lat >= ARCTIC_CIRCLE) {
    if ([11, 12, 1].includes(month)) return "polar_night";
    if ([5, 6, 7].includes(month)) return "midnight_sun";
  }
  if (lat <= ANTARCTIC_CIRCLE) {
    if ([5, 6, 7].includes(month)) return "polar_night";
    if ([11, 12, 1].includes(month)) return "midnight_sun";
  }
  return null;
}

export function describeEnvironment(date, settlement = {}) {
  const lat = Number.isFinite(settlement.lat) ? settlement.lat : 30;
  const climate = settlement.climate || "temperate";
  const hemisphere = settlement.hemisphere || hemisphereFromLat(lat);
  const season = meteorologicalSeason(date.month, hemisphere);
  const tropic = (climate === "tropical" || climate === "tropical_savanna" || Math.abs(lat) < 23.5)
    ? tropicalSeason(date.month, lat)
    : null;
  const polar = polarDaylight(lat, date.month);
  const records = [];
  const seen = new Set();

  const push = (id, label, reason, hooks = [], category) => {
    if (seen.has(id)) return;
    seen.add(id);
    records.push({
      id,
      category: category || (id.startsWith("date_") ? "date" : id.startsWith("env_") ? "env" : id.startsWith("hemisphere_") ? "hemisphere" : "misc"),
      label,
      reason,
      hooks,
      source: "calendar",
    });
  };

  if (season) {
    push(`date_${season}`, SEASON_LABELS[season], `${date.year}年${date.month}月於${hemisphere === "south" ? "南" : "北"}半球為${SEASON_LABELS[season]}。`, ["weather"]);
  }
  if (tropic) {
    push(`date_${tropic}_season`, tropic === "wet" ? "雨季" : "旱季", `低緯／熱帶氣候在此月進入${tropic === "wet" ? "雨季" : "旱季"}。`, ["weather"]);
  }
  push(`date_month_${String(date.month).padStart(2, "0")}`, date.monthLabel, `出生／當日曆月為${date.monthLabel}。`);
  push(`date_weekday_${date.weekday}`, date.weekdayLabel, `當日為${date.weekdayLabel}。`);
  push(`hemisphere_${hemisphere}`, hemisphere === "south" ? "南半球" : hemisphere === "north" ? "北半球" : "赤道帶", `緯度約 ${lat.toFixed(1)}°，屬${hemisphere === "south" ? "南半球" : hemisphere === "north" ? "北半球" : "赤道帶"}。`);
  if (date.leapDay) {
    push("date_leap_day", "閏日出生", `${date.year} 年 2 月 29 日（閏年才存在的日期）。`);
  }
  if (date.leapYear) push("date_leap_year", "閏年", `${date.year} 年為格里曆閏年。`);

  if (polar === "polar_night") {
    push("env_polar_night", "極夜", "北極／南極圈內，此月日照極短或連續黑夜。", ["arctic", "weather"]);
    push("env_extreme_cold", "極寒", "高緯冬季的極端低溫作為出生／當下環境。", ["arctic", "survival"]);
  }
  if (polar === "midnight_sun") {
    push("env_midnight_sun", "極晝", "高緯夏季的午夜太陽。", ["arctic", "weather"]);
  }

  if (season === "winter" && (climate === "cold" || climate === "polar" || climate === "continental" || climate === "subpolar")) {
    push("env_extreme_cold", "嚴寒", "冷帶／極地／大陸型氣候的冬天。", ["weather", "survival"]);
  }
  if (season === "summer" && (climate === "arid" || climate === "tropical" || climate === "tropical_savanna" || climate === "mediterranean")) {
    push("env_extreme_heat", "酷熱", "旱地或熱帶／地中海夏季的高熱。", ["weather", "health"]);
  }
  if (tropic === "wet" && (climate === "tropical" || climate === "subtropical" || climate === "tropical_savanna")) {
    push("env_monsoon", "季風／雨季濕熱", "季風帶雨季的潮濕與暴雨。", ["weather"]);
  }
  if (climate === "highland") {
    push("env_thin_air", "稀薄空氣", "高海拔聚落終年氣壓較低。", ["altitude"]);
  }
  if (climate === "arid" && tropic === "dry") {
    push("env_dust_dry", "乾旱揚塵", "旱季的沙塵與缺水。", ["desert", "survival"]);
  }
  if (settlement.kind === "underground") {
    push("env_underground", "地下環境", "出生或居於洞穴／地下街，季節溫差被岩層緩衝。", ["underground"]);
  }
  if (settlement.kind === "arctic" || climate === "polar") {
    push("env_high_latitude", "高緯極地", "北極圈或近北極圈聚落。", ["arctic"]);
  }

  return {
    lat,
    hemisphere,
    season,
    seasonLabel: SEASON_LABELS[season] || SEASON_LABELS[tropic] || "無明顯四季",
    tropicalSeason: tropic,
    polar,
    records,
    tags: records.map((item) => item.id),
  };
}

export function natalEnvironmentTags(date, settlement) {
  return describeEnvironment(date, settlement);
}

export function currentEnvironmentTags(date, settlement) {
  const env = describeEnvironment(date, settlement);
  const current = env.records.map((item) => ({
    ...item,
    id: item.id.startsWith("current_") ? item.id : `current_${item.id}`,
    category: "current",
  }));
  return {
    ...env,
    records: current,
    tags: current.map((item) => item.id),
  };
}

export { TAG_PREFIX };
