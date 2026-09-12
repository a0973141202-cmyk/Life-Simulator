/**
 * Closed-beta overlay. Toggle `enabled` (or delete this module's imports)
 * to restore core 1920–2025 births and a full life through old age.
 *
 * Permanent play-range and calendar live in play-range.js / constants.js.
 * This file must stay the only place that names the temporary caps.
 */

export const BETA_CONFIG = Object.freeze({
  enabled: true,
  birthYearMin: 1920,
  birthYearMax: 1980,
  playAgeMax: 18,
});

export function isBetaEnabled() {
  return BETA_CONFIG.enabled === true;
}
