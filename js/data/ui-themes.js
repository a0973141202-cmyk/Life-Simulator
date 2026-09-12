/**
 * Visual skins for ThemeManager.
 * Tokens only — ThemeManager applies them; GameEngine does not import this file.
 */

export const STAGE_SKINS = Object.freeze({
  infant: "childhood",
  toddler: "childhood",
  awakening: "childhood",
  child: "childhood",
  teen: "academic",
  youth: "urban",
  adult: "urban",
  middle: "urban",
  senior: "faded",
  elder: "faded",
});

export const VOCATION_SKINS = Object.freeze({
  labor: "labor",
  military: "military",
  office: "urban",
  politics: "urban",
  commerce: "commerce",
  underworld: "underworld",
  neet: "faded",
});

export const CLASS_SKINS = Object.freeze({
  peasant: "rural",
  worker: "labor",
  artisan: "labor",
  merchant: "commerce",
  intellectual: "academic",
  official: "urban",
  military: "military",
  gentry: "urban",
  immigrant: "labor",
});

export const ERA_SKINS = Object.freeze([
  { id: "depression", years: [1929, 1939], skin: "depression" },
  { id: "wartime_forties", years: [1937, 1945], skin: "wartime" },
  { id: "coldwar", years: [1947, 1989], skin: "coldwar" },
  { id: "contemporary", years: [1990, 2025], skin: "contemporary" },
]);

export const THEME_PRIORITY = Object.freeze([
  "crisis",
  "vocation",
  "era",
  "stage",
]);
