/**
 * World-event catalog. Engines import only this file.
 *
 * To expand: add a pack module, export an array of worldEvent(...), append below.
 * Keep `when` strict. Do not put year-wrong or geo-wrong facts into a universal pack.
 */

import { WORLD_MUNDANE_EVENTS } from "./mundane.js";
import { WORLD_AFFLUENT_EVENTS } from "./geo-affluent.js";
import { WORLD_SLUM_EVENTS } from "./geo-slum.js";
import { WORLD_WAR_EVENTS } from "./geo-war.js";
import { WORLD_ARCTIC_EVENTS } from "./geo-arctic.js";
import { WORLD_DISASTER_EVENTS } from "./geo-disaster.js";
import { WORLD_PLAGUE_EVENTS } from "./survival-plague.js";
import { WORLD_HOUSEHOLD_EVENTS } from "./household.js";
import { WORLD_DARK_EVENTS } from "./dark-street.js";
import { WORLD_HISTORICAL_EVENTS } from "./historical.js";
import { WORLD_SOCIAL_UPHEAVAL_EVENTS } from "./social-upheaval.js";
import { WORLD_ASYMMETRIC_BIAS_EVENTS } from "./asymmetric-bias.js";

export const WORLD_EVENTS = Object.freeze([
  ...WORLD_MUNDANE_EVENTS,
  ...WORLD_AFFLUENT_EVENTS,
  ...WORLD_SLUM_EVENTS,
  ...WORLD_WAR_EVENTS,
  ...WORLD_ARCTIC_EVENTS,
  ...WORLD_DISASTER_EVENTS,
  ...WORLD_PLAGUE_EVENTS,
  ...WORLD_HOUSEHOLD_EVENTS,
  ...WORLD_DARK_EVENTS,
  ...WORLD_HISTORICAL_EVENTS,
  ...WORLD_SOCIAL_UPHEAVAL_EVENTS,
  ...WORLD_ASYMMETRIC_BIAS_EVENTS,
]);

export {
  WORLD_MUNDANE_EVENTS,
  WORLD_AFFLUENT_EVENTS,
  WORLD_SLUM_EVENTS,
  WORLD_WAR_EVENTS,
  WORLD_ARCTIC_EVENTS,
  WORLD_DISASTER_EVENTS,
  WORLD_PLAGUE_EVENTS,
  WORLD_HOUSEHOLD_EVENTS,
  WORLD_DARK_EVENTS,
  WORLD_HISTORICAL_EVENTS,
  WORLD_SOCIAL_UPHEAVAL_EVENTS,
  WORLD_ASYMMETRIC_BIAS_EVENTS,
};
