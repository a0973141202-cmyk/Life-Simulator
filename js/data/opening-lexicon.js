/**
 * Opening slot sentence banks retired.
 * Birth / awakening / first-period copy is composed in js/dynamic-prose.js.
 * YEAR_PRESSURE_SLOTS remains as an empty export for module-surface checks.
 */

function row(id, text, when = {}) {
  return { id, text, ...when };
}

export const BIRTH_PLACE_SLOTS = [];
export const YEAR_PRESSURE_SLOTS = [];
export const CLASS_SLOTS = [];
export const ANCESTRY_SLOTS = [];
export const MICRO_SLOTS = [];
export const AWAKENING_SLOTS = [];
export const WEEK_LEAD_SLOTS = [];

void row;
