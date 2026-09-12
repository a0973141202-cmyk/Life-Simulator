/**
 * ThemeManager — adaptive archive chrome.
 * Reads life stage, vocation, era, and live history. Does not mutate game logic.
 */
import { CLASS_SKINS, ERA_SKINS, STAGE_SKINS, VOCATION_SKINS } from "./data/ui-themes.js";

const DEFAULT_THEME = Object.freeze({
  id: "archive-default",
  stageSkin: "archive",
  vocationSkin: "archive",
  eraSkin: "archive",
  crisisSkin: "none",
  ornament: "archive",
});

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

export function resolveTheme(state) {
  if (!state?.ready) return { ...DEFAULT_THEME };
  const stageSkin = stageSkinOf(state);
  const vocationSkin = vocationSkinOf(state);
  const eraSkin = eraSkinOf(state);
  const crisisSkin = crisisSkinOf(state);
  let ornament = stageSkin;
  if (vocationSkin === "military" || crisisSkin === "war") ornament = "military";
  else if (eraSkin === "wartime") ornament = "wartime";
  else if (eraSkin === "depression") ornament = "depression";
  else if (vocationSkin === "labor" || vocationSkin === "rural") ornament = vocationSkin;
  else if (vocationSkin === "academic" || stageSkin === "academic") ornament = "academic";
  else if (eraSkin === "coldwar") ornament = "coldwar";
  else if (eraSkin === "contemporary") ornament = "contemporary";
  const id = [stageSkin, vocationSkin, eraSkin, crisisSkin].join("-");
  return {
    id,
    stageSkin,
    vocationSkin,
    eraSkin,
    crisisSkin,
    ornament,
  };
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
  const body = typeof document !== "undefined" ? document.body : null;
  const app = typeof document !== "undefined" ? document.getElementById("app") : null;
  const desk = typeof document !== "undefined" ? document.querySelector(".desk") : null;
  if (body) writeDataset(body, theme);
  if (app) writeDataset(app, theme);
  if (desk) writeDataset(desk, theme);
  return theme;
}

export function clearTheme() {
  return applyTheme({ ready: false });
}

export { DEFAULT_THEME };
