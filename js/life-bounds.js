/**
 * Effective year / age window = core constants, optionally narrowed by BetaConfig.
 * GameEngine and genesis read only these helpers — never the raw beta numbers.
 * Meme-legend presets (24歲全盛) bypass temporary beta play-age caps,
 * but use their own ~13-year legendary playthrough (24 → 37).
 *
 * Meme span constants stay aligned with meme-chronicle.js
 * (MEME_LEGEND_START_AGE / MEME_PLAY_YEARS).
 */
import { YEAR_MAX, YEAR_MIN } from "./constants.js";
import { PLAY_AGE_MAX } from "./data/play-range.js";
import { BETA_CONFIG, isBetaEnabled } from "./data/beta-config.js";
import { MEME_LOCK_PRESET_IDS } from "./data/special-presets.js";

/** Keep in sync with meme-chronicle.js */
const MEME_PLAY_AGE_START = 24;
const MEME_PLAY_AGE_SPAN = 13;

export function isMemeLegendPlayExempt(character = null) {
  if (!character) return false;
  if (character.memeTagLock) return true;
  return MEME_LOCK_PRESET_IDS.includes(character.specialPresetId);
}

function memePlayAgeMaxOf(character = null) {
  // Only the three meme-lock presets get the 13-year window.
  if (!MEME_LOCK_PRESET_IDS.includes(character?.specialPresetId)) return null;
  return MEME_PLAY_AGE_START + MEME_PLAY_AGE_SPAN;
}

export function effectiveGenesisYearRange() {
  if (!isBetaEnabled()) {
    return { min: YEAR_MIN, max: YEAR_MAX };
  }
  const min = Number.isFinite(BETA_CONFIG.birthYearMin) ? BETA_CONFIG.birthYearMin : YEAR_MIN;
  const max = Number.isFinite(BETA_CONFIG.birthYearMax) ? BETA_CONFIG.birthYearMax : YEAR_MAX;
  return {
    min: Math.max(YEAR_MIN, Math.min(min, max)),
    max: Math.min(YEAR_MAX, Math.max(min, max)),
  };
}

export function effectivePlayAgeMax(character = null) {
  const memeMax = memePlayAgeMaxOf(character);
  if (memeMax != null) return memeMax;
  if (!isBetaEnabled() || !Number.isFinite(BETA_CONFIG.playAgeMax)) {
    return PLAY_AGE_MAX;
  }
  return Math.max(1, Math.min(PLAY_AGE_MAX, BETA_CONFIG.playAgeMax));
}

export function isTemporaryPlayCap(character = null) {
  return effectivePlayAgeMax(character) < PLAY_AGE_MAX;
}

export function shouldClosePlayWindow(ageYears, character = null) {
  const age = Math.max(0, Number(ageYears) || 0);
  const max = effectivePlayAgeMax(character);
  // Soft caps (beta childhood window, meme 13-year legend): close when age reaches max.
  if (max < PLAY_AGE_MAX) {
    return age >= max;
  }
  return age > max;
}

export function betaOverlaySnapshot() {
  if (!isBetaEnabled()) {
    return {
      closedBeta: false,
      genesisYearMin: YEAR_MIN,
      genesisYearMax: YEAR_MAX,
      playAgeMaxEffective: PLAY_AGE_MAX,
    };
  }
  const years = effectiveGenesisYearRange();
  return {
    closedBeta: true,
    genesisYearMin: years.min,
    genesisYearMax: years.max,
    playAgeMaxEffective: effectivePlayAgeMax(),
  };
}
