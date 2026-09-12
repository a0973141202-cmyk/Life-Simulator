/**
 * Static weekly option catalogs. Daily slices stay live (state-dependent)
 * and are appended by event-engine before the weekly sieve.
 */
import { ACTION_POOL } from "../actions.js";
import { AWAKENING_ACTION_POOL } from "./awakening-actions.js";
import { EARLY_CHILD_SURVIVAL_POOL } from "./early-child-survival-actions.js";
import { TURNING_POINT_POOL } from "./life-stage-catalog.js";
import { TAG_DRIVEN_ACTION_POOL } from "./tag-choice-actions.js";
import { BLOODLINE_CHOICE_POOL } from "./bloodline-choice-actions.js";
import { PREFIX_LINK_POOL } from "./tag-link-actions.js";
import { ASYMMETRIC_SURVIVAL_POOL } from "./asymmetric-survival-actions.js";
import { SANDBOX_ACTION_POOL } from "./sandbox-actions.js";
import { CRISIS_ACTION_POOL } from "./crisis-actions.js";

export const WEEKLY_EVENT_POOL = Object.freeze([
  ...AWAKENING_ACTION_POOL,
  ...EARLY_CHILD_SURVIVAL_POOL,
  ...TURNING_POINT_POOL,
  ...ACTION_POOL,
  ...TAG_DRIVEN_ACTION_POOL,
  ...BLOODLINE_CHOICE_POOL,
  ...PREFIX_LINK_POOL,
  ...ASYMMETRIC_SURVIVAL_POOL,
  ...SANDBOX_ACTION_POOL,
  ...CRISIS_ACTION_POOL,
]);

export const WEEKLY_EVENT_COUNT = WEEKLY_EVENT_POOL.length;
