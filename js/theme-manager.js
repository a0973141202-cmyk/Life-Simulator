/**
 * ThemeManager — adaptive archive chrome.
 * Applies semantic CSS classes on #app / body. Never mutates layout geometry.
 */
import { CLASS_SKINS, ERA_SKINS, STAGE_SKINS, VOCATION_SKINS } from "./data/ui-themes.js";

const DEFAULT_THEME = Object.freeze({
  id: "archive-default",
  stageSkin: "archive",
  vocationSkin: "archive",
  eraSkin: "archive",
  crisisSkin: "none",
  ornament: "archive",
  stageClass: "stage-archive",
  vocationClass: "vocation-archive",
  eraClass: "era-archive",
  crisisClass: "crisis-none",
  ornamentClass: "ornament-archive",
});

const STAGE_CLASS = Object.freeze({
  childhood: "stage-childhood",
  academic: "stage-student",
  urban: "stage-worker",
  faded: "stage-elder",
  archive: "stage-archive",
});

const VOCATION_CLASS = Object.freeze({
  labor: "vocation-worker",
  rural: "vocation-worker",
  academic: "vocation-student",
  military: "vocation-military",
  commerce: "vocation-commerce",
  urban: "vocation-worker",
  underworld: "vocation-underworld",
  faded: "vocation-elder",
  archive: "vocation-archive",
});

const ERA_CLASS = Object.freeze({
  depression: "era-depression",
  wartime: "era-wartime",
  coldwar: "era-coldwar",
  contemporary: "era-contemporary",
  archive: "era-archive",
});

const CRISIS_CLASS = Object.freeze({
  none: "crisis-none",
  watch: "crisis-watch",
  crisis: "stage-crisis",
  war: "stage-crisis",
});

const ORNAMENT_CLASS = Object.freeze({
  childhood: "ornament-childhood",
  academic: "ornament-student",
  military: "ornament-military",
  wartime: "ornament-military",
  depression: "ornament-depression",
  labor: "ornament-worker",
  rural: "ornament-worker",
  coldwar: "ornament-coldwar",
  contemporary: "ornament-contemporary",
  archive: "ornament-archive",
});

const THEME_CLASS_RE = /^(stage-|vocation-|era-|crisis-|ornament-|theme-ready|theme-crisis)/;

function threadsOf(state) {
  return state?.upheaval?.threads || state?.character?.upheavalState?.threads || [];
}

function stageSkinOf(state) {
  const id = state?.stage?.id || state?.lifeProgress?.stageId || "";
  return STAGE_SKINS[id] || "archive";
}

function vocationSkinOf(state) {
  const character = state?.character || {};
  const sector = state?.career?.sector || character.careerState?.sector || "";
  if (VOCATION_SKINS[sector]) return VOCATION_SKINS[sector];
  const occ = `${character.occupation || ""}`;
  if (/軍|兵|行伍/.test(occ)) return "military";
  if (/讀書|教職|稿/.test(occ)) return "academic";
  if (/工|匠|學徒/.test(occ)) return "labor";
  if (/商|鋪|舖/.test(occ)) return "commerce";
  if (/務農|田/.test(occ)) return "rural";
  return CLASS_SKINS[character.familyClassId] || "archive";
}

function eraSkinOf(state) {
  const year = Number(state?.time?.year || state?.era?.from || 0);
  const live = threadsOf(state);
  if (live.includes("war") || live.includes("conscription") || live.includes("occupation")) {
    return "wartime";
  }
  if (live.includes("unemployment") || live.includes("famine")) return "depression";
  const row = ERA_SKINS.find((band) => year >= band.years[0] && year <= band.years[1]);
  return row?.skin || "archive";
}

function crisisSkinOf(state) {
  const level = state?.pressure?.level || "";
  const tier = Number(state?.upheaval?.tier || 0);
  const live = threadsOf(state);
  const band = state?.character?.geoBand || "";
  if (live.includes("war") || band === "warzone" || /戰/.test(state?.upheaval?.label || "")) {
    return "war";
  }
  if (level === "ruin" || level === "crisis" || tier >= 3) return "crisis";
  if (tier >= 2 || level === "watch") return "watch";
  return "none";
}

function ornamentOf(stageSkin, vocationSkin, eraSkin, crisisSkin) {
  if (vocationSkin === "military" || crisisSkin === "war") return "military";
  if (eraSkin === "wartime") return "wartime";
  if (eraSkin === "depression") return "depression";
  if (vocationSkin === "labor" || vocationSkin === "rural") return vocationSkin;
  if (vocationSkin === "academic" || stageSkin === "academic") return "academic";
  if (eraSkin === "coldwar") return "coldwar";
  if (eraSkin === "contemporary") return "contemporary";
  if (stageSkin === "childhood") return "childhood";
  return "archive";
}

export function resolveTheme(state) {
  if (!state?.ready) return { ...DEFAULT_THEME };
  const stageSkin = stageSkinOf(state);
  const vocationSkin = vocationSkinOf(state);
  const eraSkin = eraSkinOf(state);
  const crisisSkin = crisisSkinOf(state);
  const ornament = ornamentOf(stageSkin, vocationSkin, eraSkin, crisisSkin);
  return {
    id: [stageSkin, vocationSkin, eraSkin, crisisSkin].join("-"),
    stageSkin,
    vocationSkin,
    eraSkin,
    crisisSkin,
    ornament,
    stageClass: STAGE_CLASS[stageSkin] || STAGE_CLASS.archive,
    vocationClass: VOCATION_CLASS[vocationSkin] || VOCATION_CLASS.archive,
    eraClass: ERA_CLASS[eraSkin] || ERA_CLASS.archive,
    crisisClass: CRISIS_CLASS[crisisSkin] || CRISIS_CLASS.none,
    ornamentClass: ORNAMENT_CLASS[ornament] || ORNAMENT_CLASS.archive,
  };
}

function clearThemeClasses(node) {
  if (!node?.classList) return;
  for (const name of [...node.classList]) {
    if (THEME_CLASS_RE.test(name)) node.classList.remove(name);
  }
}

function writeThemeClasses(node, theme, ready) {
  if (!node?.classList) return;
  clearThemeClasses(node);
  node.classList.add(
    theme.stageClass,
    theme.vocationClass,
    theme.eraClass,
    theme.crisisClass,
    theme.ornamentClass,
  );
  if (ready) node.classList.add("theme-ready");
  if (theme.crisisSkin === "crisis" || theme.crisisSkin === "war") {
    node.classList.add("theme-crisis");
  }
}

function writeDataset(node, theme) {
  if (!node?.dataset) return;
  node.dataset.themeId = theme.id;
  node.dataset.themeStage = theme.stageSkin;
  node.dataset.themeVocation = theme.vocationSkin;
  node.dataset.themeEra = theme.eraSkin;
  node.dataset.themeCrisis = theme.crisisSkin;
  node.dataset.themeOrnament = theme.ornament;
}

export function applyTheme(state) {
  const theme = resolveTheme(state);
  const ready = Boolean(state?.ready);
  const body = typeof document !== "undefined" ? document.body : null;
  const app = typeof document !== "undefined" ? document.getElementById("app") : null;
  writeThemeClasses(body, theme, ready);
  writeThemeClasses(app, theme, ready);
  writeDataset(body, theme);
  writeDataset(app, theme);
  return theme;
}

export function clearTheme() {
  return applyTheme({ ready: false });
}

export { DEFAULT_THEME, STAGE_CLASS, VOCATION_CLASS, ERA_CLASS, CRISIS_CLASS };
