export { PLAY_AGE_MAX, PLAY_AGE_MIN, PLAY_PHASE, SOCIETY_ENTRY_AGE } from "./data/play-range.js";

export const YEAR_MIN = 1920;
export const YEAR_MAX = 2025;
export const WEEKS_PER_YEAR = 52;
export const TURNS_PER_YEAR = 24;
export const DAYS_PER_TURN = 14;
export const TURNS_TO_AGE_18 = 18 * TURNS_PER_YEAR;
export const MAX_AGE = 120;

export const STAT_KEYS = Object.freeze(["health", "sanity"]);

export const STAT_LABELS = Object.freeze({
  health: "健康",
  sanity: "神智",
});

export const STAT_MIN = Object.freeze({
  health: 0,
  sanity: 0,
});

export const STAT_MAX = Object.freeze({
  health: 100,
  sanity: 100,
});

export const LIFE_STAGES = Object.freeze({
  infant: { id: "infant", label: "嬰幼兒", minAge: 0, maxAge: 2 },
  toddler: { id: "toddler", label: "幼童", minAge: 3, maxAge: 4 },
  awakening: { id: "awakening", label: "意識萌芽", minAge: 5, maxAge: 7 },
  child: { id: "child", label: "童年", minAge: 8, maxAge: 12 },
  teen: { id: "teen", label: "少年", minAge: 13, maxAge: 17 },
  youth: { id: "youth", label: "青年", minAge: 18, maxAge: 25 },
  adult: { id: "adult", label: "壯年", minAge: 26, maxAge: 44 },
  middle: { id: "middle", label: "中年", minAge: 45, maxAge: 64 },
  senior: { id: "senior", label: "老年", minAge: 65, maxAge: 79 },
  elder: { id: "elder", label: "暮年", minAge: 80, maxAge: MAX_AGE },
});

export function getLifeStage(ageYears) {
  const age = Math.max(0, ageYears);
  if (age <= 2) return LIFE_STAGES.infant;
  if (age <= 4) return LIFE_STAGES.toddler;
  if (age <= 7) return LIFE_STAGES.awakening;
  if (age <= 12) return LIFE_STAGES.child;
  if (age <= 17) return LIFE_STAGES.teen;
  if (age <= 25) return LIFE_STAGES.youth;
  if (age <= 44) return LIFE_STAGES.adult;
  if (age <= 64) return LIFE_STAGES.middle;
  if (age <= 79) return LIFE_STAGES.senior;
  return LIFE_STAGES.elder;
}

export function clampStat(key, value) {
  const min = STAT_MIN[key] ?? 0;
  const max = STAT_MAX[key] ?? 100;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function emptyStats() {
  return {
    health: 0,
    sanity: 0,
  };
}
