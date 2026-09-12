import { FIGURES_POLITICIANS_ASIA } from "./politicians-asia.js";
import { FIGURES_POLITICIANS_WEST } from "./politicians-west.js";
import { FIGURES_MILITARY } from "./military.js";
import { FIGURES_SCIENCE } from "./science.js";
import { FIGURES_ARTS_SOCIAL } from "./arts-social.js";
import { FIGURES_CRIME } from "./crime.js";

/**
 * Historical figures catalog 1920–2025.
 * Add a pack, export the array, append here. Engine imports only this file.
 */

export const FIGURES = Object.freeze([
  ...FIGURES_POLITICIANS_ASIA,
  ...FIGURES_POLITICIANS_WEST,
  ...FIGURES_MILITARY,
  ...FIGURES_SCIENCE,
  ...FIGURES_ARTS_SOCIAL,
  ...FIGURES_CRIME,
]);

export const FIGURE_INDEX = Object.freeze(
  Object.fromEntries(FIGURES.map((row) => [row.id, row])),
);

export {
  FIGURES_POLITICIANS_ASIA,
  FIGURES_POLITICIANS_WEST,
  FIGURES_MILITARY,
  FIGURES_SCIENCE,
  FIGURES_ARTS_SOCIAL,
  FIGURES_CRIME,
};
