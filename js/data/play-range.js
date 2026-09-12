/**
 * Play window: self-awareness (5) through late life (120).
 * Birth still generates 1920–2025 with a city-locked Gregorian date;
 * the bi-weekly engine skips the pre-verbal years, then keeps going after 18.
 * Age 18 is society entry, not an ending.
 */

export const PLAY_AGE_MIN = 5;
export const PLAY_AGE_MAX = 120;
export const SOCIETY_ENTRY_AGE = 18;

export const PLAY_PHASE = Object.freeze({
  id: "life_5_120",
  label: "成長期＋社會期",
  summary: "從五歲自我意識萌芽打到壽終或高齡收束。十八歲步入社會，職業、政商、地下生態按現實計價；出生仍是盲盒；五歲以前不可選。",
  playAgeMin: PLAY_AGE_MIN,
  playAgeMax: PLAY_AGE_MAX,
  societyEntryAge: SOCIETY_ENTRY_AGE,
});
