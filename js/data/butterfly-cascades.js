/**
 * Butterfly cascades: if a keyed figure exits early, which world programs rewrite.
 * Speculative utopia is not written. The invoice is a different subsequent procedure.
 *
 * Each rule: if figure dies/exits before `beforeYear`, apply shockOverrides.
 */

export const BUTTERFLY_CASCADES = Object.freeze([
  {
    figureId: "hitler",
    beforeYear: 1933,
    inertia: 48,
    label: "未掌權即退出",
    note: "此人在掌權窗口前退出公開程序。歐陸總體戰的 canon 時間表不再被當成必然。後續年份改讀改寫後的死亡與敘事表。",
    suppress: ["ww2_europe"],
    narrativeSuppress: ["ww2_europe", "war_full"],
  },
  {
    figureId: "hitler",
    beforeYear: 1939,
    inertia: 42,
    label: "開戰前退出",
    note: "掌權之後、全面戰爭之前的退出，把 1939 年起的歐陸總體戰程序改成不確定。慣性仍向戰爭傾斜，但不再按原表逐週收取。",
    suppress: ["ww2_europe"],
    intensify: {},
    narrativeSuppress: ["ww2_europe"],
  },
  {
    figureId: "stalin",
    beforeYear: 1932,
    inertia: 44,
    label: "集體化高峰前退出",
    note: "此人在集體化高峰前退出。基輔地圖上的 1932–33 饑荒程序被標為改寫，不保證被取消，只保證不再按原表自動開徵。",
    suppress: ["holodomor"],
    narrativeSuppress: [],
  },
  {
    figureId: "stalin",
    beforeYear: 1941,
    inertia: 36,
    label: "蘇德戰爭前退出",
    note: "戰爭職能的名字被提前拿掉。圍城與歐陸戰場的表仍可能被其他人填上，但 scale 與時間不再神聖。",
    yearShift: { ww2_europe: 1, leningrad_siege: 1 },
  },
  {
    figureId: "mao_zedong",
    beforeYear: 1949,
    inertia: 46,
    label: "建政前退出",
    note: "此人在建政窗口前退出。內戰末期與後續運動的程序被標為改寫。",
    suppress: ["china_civil_end", "great_leap_early", "great_leap_peak", "great_leap_tail", "cultural_rev_violence"],
    narrativeSuppress: ["china_1949", "great_leap", "cultural_rev"],
  },
  {
    figureId: "mao_zedong",
    beforeYear: 1958,
    inertia: 40,
    label: "大躍進前退出",
    note: "建政已發生，高指標程序被從後續年表拿掉或降權。這不是豐收保證，是另一套徵糧機器尚未被寫死。",
    suppress: ["great_leap_early", "great_leap_peak", "great_leap_tail", "cultural_rev_violence"],
    narrativeSuppress: ["great_leap", "cultural_rev"],
  },
  {
    figureId: "chiang_kai_shek",
    beforeYear: 1947,
    inertia: 34,
    label: "二二八窗口前退出",
    note: "此人在 1947 年窗口前退出。島上那一春的鎮壓程序被標為改寫。",
    suppress: ["taiwan_228"],
    narrativeSuppress: ["taiwan_228"],
  },
  {
    figureId: "churchill",
    beforeYear: 1941,
    inertia: 32,
    label: "戰時首相窗口中斷",
    note: "戰時英國的公開指揮名字提前消失。歐陸戰爭不因此自動停火；西線的死亡加權被標為更不穩定。",
    intensify: { ww2_europe: 1.15 },
  },
  {
    figureId: "fdr",
    beforeYear: 1941,
    inertia: 33,
    label: "美國參戰窗口前退出",
    note: "新政與戰時總統的名字提前消失。太平洋與歐陸程序改為改寫態，不保證孤立也不保證提前參戰。",
    yearShift: { pacific_war: 1 },
  },
  {
    figureId: "ho_chi_minh",
    beforeYear: 1954,
    inertia: 30,
    label: "獨立戰爭高峰前退出",
    note: "越南長期戰爭的公開建國名字提前消失。後續戰爭表被標為改寫。",
    suppress: ["vietnam_war"],
  },
  {
    figureId: "kim_il_sung",
    beforeYear: 1950,
    inertia: 36,
    label: "韓戰窗口前退出",
    note: "北韓國家程序的名字在開戰前消失。韓戰加權被標為改寫。",
    suppress: ["korean_war"],
    narrativeSuppress: ["korean_war"],
  },
  {
    figureId: "gandhi",
    beforeYear: 1947,
    inertia: 28,
    label: "分治窗口前退出",
    note: "獨立運動的公開身體提前消失。分治暴力不因此自動消失，只不再按同一張人臉組織敘事。",
    intensify: { partition_1947: 1.1 },
  },
  {
    figureId: "lenin",
    beforeYear: 1924,
    inertia: 22,
    label: "接班窗口提前合上",
    note: "1924 年前的退出把接班鬥爭提前。史達林軌道可能加速，不是被取消。",
  },
  {
    figureId: "al_capone",
    beforeYear: 1931,
    inertia: 18,
    label: "芝加哥禁酒秩序換人",
    note: "這個名字從巷弄秩序裡被拿掉。城市的地下稅改由別人收。沒有世界大戰被改寫。",
  },
  {
    figureId: "du_yuesheng",
    beforeYear: 1937,
    inertia: 16,
    label: "上海青幫窗口換人",
    note: "租界與幫派的中介名字提前消失。口岸的地下秩序改讀其他人。",
  },
]);

export const NARRATIVE_TO_SHOCK = Object.freeze({
  ww2_europe: "ww2_europe",
  war_full: "sino_japan_full",
  pacific_war: "pacific_war",
  great_leap: "great_leap_peak",
  cultural_rev: "cultural_rev_violence",
  china_1949: "china_civil_end",
  taiwan_228: "taiwan_228",
  korean_war: "korean_war",
  covid: "covid_2020",
  sars: "sars_2003",
  crash_1929: "depression_1930s",
  xiagang: "china_layoff_1990s",
  asian_crisis: "asian_crisis_1997",
  gfc_2008: "gfc_2008",
});

export function cascadesFor(figureId, deathYear) {
  return BUTTERFLY_CASCADES.filter((row) => (
    row.figureId === figureId && deathYear < row.beforeYear
  ));
}
