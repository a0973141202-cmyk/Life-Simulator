/**
 * Daily catalog. To extend: add a file, export SLICES, append here.
 * GameEngine and eventGenerator should import only this module + daily-engine.
 */

import { HOME_CHILD_SLICES } from "./home-family.js";
import { HOME_SURVIVAL_SLICES } from "./home-survival.js";
import { LABOR_LEGAL_SLICES } from "./labor-legal.js";
import { MILITANT_WAIT_SLICES } from "./militant-wait.js";
import { NEET_DEPEND_SLICES } from "./neet-depend.js";
import { OFFICE_WHITE_SLICES } from "./office-white.js";
import { COMMERCE_FLOOR_SLICES } from "./commerce-floor.js";
import { POLITICS_MACHINE_SLICES } from "./politics-machine.js";
import { PRISON_SLICES } from "./prison.js";
import { PRISON_CASTE_SLICES } from "./prison-caste.js";
import { SOCIETY_CASTE_SLICES } from "./society-caste.js";
import { SCHOOL_CHILD_SLICES } from "./school-child.js";
import { SCHOOL_TEEN_SLICES } from "./school-teen.js";
import { TRAUMA_AUTHORITY_SLICES } from "./trauma-authority.js";
import { TRAUMA_HOME_SLICES } from "./trauma-home.js";
import { TRAUMA_LABOR_SLICES } from "./trauma-labor.js";
import { UNDERWORLD_COVER_SLICES } from "./underworld-cover.js";
import { DAILY_STATES } from "./states.js";

export const DAILY_SLICES = Object.freeze([
  ...HOME_CHILD_SLICES,
  ...HOME_SURVIVAL_SLICES,
  ...SCHOOL_CHILD_SLICES,
  ...SCHOOL_TEEN_SLICES,
  ...LABOR_LEGAL_SLICES,
  ...OFFICE_WHITE_SLICES,
  ...COMMERCE_FLOOR_SLICES,
  ...NEET_DEPEND_SLICES,
  ...POLITICS_MACHINE_SLICES,
  ...UNDERWORLD_COVER_SLICES,
  ...PRISON_SLICES,
  ...PRISON_CASTE_SLICES,
  ...SOCIETY_CASTE_SLICES,
  ...MILITANT_WAIT_SLICES,
  ...TRAUMA_HOME_SLICES,
  ...TRAUMA_AUTHORITY_SLICES,
  ...TRAUMA_LABOR_SLICES,
]);

export function slicesForState(stateId) {
  return DAILY_SLICES.filter((slice) => slice.state === stateId);
}

export function dailyActionsFromSlices() {
  return DAILY_SLICES.map((slice) => slice.action).filter(Boolean);
}

export { DAILY_STATES };
