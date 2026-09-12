/**
 * Adult incident catalog. Add a sector file, export the array, append here.
 * Engines should import only this module.
 */

import { ADULT_LABOR_INCIDENTS } from "./labor.js";
import { ADULT_OFFICE_INCIDENTS } from "./office.js";
import { ADULT_COMMERCE_INCIDENTS } from "./commerce.js";
import { ADULT_POLITICS_INCIDENTS } from "./politics.js";
import { ADULT_UNDERWORLD_INCIDENTS } from "./underworld.js";
import { ADULT_GENERIC_INCIDENTS } from "./generic.js";

export const ADULT_INCIDENTS = Object.freeze([
  ...ADULT_LABOR_INCIDENTS,
  ...ADULT_OFFICE_INCIDENTS,
  ...ADULT_COMMERCE_INCIDENTS,
  ...ADULT_POLITICS_INCIDENTS,
  ...ADULT_UNDERWORLD_INCIDENTS,
  ...ADULT_GENERIC_INCIDENTS,
]);

export {
  ADULT_LABOR_INCIDENTS,
  ADULT_OFFICE_INCIDENTS,
  ADULT_COMMERCE_INCIDENTS,
  ADULT_POLITICS_INCIDENTS,
  ADULT_UNDERWORLD_INCIDENTS,
  ADULT_GENERIC_INCIDENTS,
};
