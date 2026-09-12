/**
 * Year / opinion windows used by the risk calculator.
 * Success chance for political or historical attempts is never guaranteed;
 * backlash scales with the same windows.
 */

export const ERA_RISK_WINDOWS = Object.freeze([
  {
    id: "interwar_authoritarian",
    years: [1922, 1938],
    modifiers: { politics: 0.06, historical: 0.09, militant: 0.04, crime: 0.02, backlash: 0.18 },
    note: "兩戰之間的極權窗口：奪權較可能，清洗也更快。",
  },
  {
    id: "total_war",
    years: [1939, 1945],
    modifiers: { militant: 0.1, historical: 0.07, politics: 0.03, backlash: 0.26, wantedMult: 1.15 },
    note: "總動員年代：暴力政治的代價以國家機器計價。",
  },
  {
    id: "early_cold_war",
    years: [1946, 1962],
    modifiers: { politics: 0.05, militant: 0.05, historical: 0.04, backlash: 0.16 },
    note: "陣營對峙讓路線選擇被讀成投誠或叛變。",
  },
  {
    id: "long_sixties",
    years: [1963, 1979],
    modifiers: { militant: 0.07, politics: 0.04, crime: 0.03, backlash: 0.12 },
    note: "街頭與理論同時膨脹；鎮壓與同情並存。",
  },
  {
    id: "cartel_globalization",
    years: [1980, 1999],
    modifiers: { crime: 0.08, narcotics: 0.11, commerce: 0.05, backlash: 0.11 },
    note: "貨流、洗錢與跨境秩序讓地下帝國更像企業。",
  },
  {
    id: "security_state",
    years: [2001, 2025],
    modifiers: { militant: -0.08, politics: 0.03, wantedMult: 1.35, backlash: 0.22 },
    note: "安全國家提高武裝政治的失敗成本與通緝曲線。",
  },
]);

export const TAG_RISK_MODIFIERS = Object.freeze([
  { tags: ["socio_official_network", "class_official"], politics: 0.08, historical: 0.05, crime: -0.02 },
  { tags: ["socio_merchant_capital", "class_merchant"], commerce: 0.07, crime: 0.02, narcotics: 0.02 },
  { tags: ["socio_gentry_estate", "class_gentry"], politics: 0.05, historical: 0.06, trustBonus: 4 },
  { tags: ["socio_extreme_poverty", "socio_working_poor"], crime: 0.05, politics: -0.04, commerce: -0.03 },
  { tags: ["socio_war_displacement", "hook_war"], militant: 0.05, crime: 0.04, backlash: 0.04 },
  { tags: ["mood_euphoric"], attemptBonus: 0.04, backlash: 0.08 },
  { tags: ["mood_depressed"], attemptBonus: -0.03 },
  { tags: ["trauma_ptsd", "trauma_hypervigilance"], backlash: 0.05, attemptBonus: -0.03 },
  { tags: ["trauma_melancholia"], attemptBonus: -0.05, backlash: 0.03, healthRisk: 0.03 },
  { tags: ["trauma_persecution"], backlash: 0.06, politics: -0.04, attemptBonus: -0.04 },
  { tags: ["trauma_persona_crack"], crime: 0.05, militant: 0.03, backlash: 0.07 },
  { tags: ["path_crime", "acquired_wanted"], crime: 0.04, wantedMult: 1.08 },
  { tags: ["path_politics"], politics: 0.06, historical: 0.03 },
  { tags: ["path_militant"], militant: 0.06, backlash: 0.07 },
  { tags: ["path_narcotics"], narcotics: 0.07, healthRisk: 0.04 },
  { tags: ["path_tycoon"], commerce: 0.06, politics: 0.02 },
]);

export function eraWindowForYear(year) {
  return ERA_RISK_WINDOWS.find((row) => year >= row.years[0] && year <= row.years[1]) || null;
}
