/**
 * Procedural narrative layer. Generic week / choice copy is composed
 * from the four-pillar fact sheet — not filled from sentence frames.
 */
import { VARIATOR_KINDS } from "./data/variator-lexicon.js";
import { composeChoiceLine, composeHistoryPulse, composePeriodChronicle, composeSituationLine, scrubEraCopy } from "./dynamic-prose.js";
import { composeEncounterChoice } from "./week-encounter.js";
import { rememberTextSnippet, textOnCooldown } from "./text-history.js";
import { optionExcluded } from "./exclusion-buffer.js";

export function tagValence(ctx = {}) {
  const tags = ctx.tags || ctx.character?.tags || [];
  const neg = tags.some((tag) => (
    String(tag).startsWith("trauma_")
    || String(tag).startsWith("household_")
    || tag === "acquired_wanted"
    || tag === "socio_extreme_poverty"
    || tag === "socio_war_displacement"
    || tag === "mood_depressed"
    || tag === "path_crime"
    || tag === "school_bullied"
  ));
  const pos = tags.some((tag) => (
    tag === "mood_euphoric"
    || tag === "勤學"
    || tag === "acquired_勤學"
    || String(tag).startsWith("trait_")
    || ctx.character?.familyClassId === "official"
    || ctx.character?.familyClassId === "merchant"
  ));
  if (neg && pos) return "mixed";
  if (neg) return "neg";
  if (pos) return "pos";
  return "plain";
}

export function inferVariatorKind(ctx = {}) {
  const tags = ctx.tags || [];
  const climate = ctx.childClimate || {};
  const age = ctx.ageYears ?? ctx.time?.ageYears ?? 0;
  if (climate.famine || climate.depression || tags.includes("socio_extreme_poverty") || tags.includes("world_famine_witness")) {
    return "hunger";
  }
  if ((ctx.stats?.health ?? 50) <= 36 || tags.some((tag) => String(tag).startsWith("condition_") || String(tag).startsWith("risk_"))) {
    return "illness";
  }
  if (ctx.upheaval?.threads?.includes("unemployment") || tags.includes("path_commerce")) return "money";
  if (tags.some((tag) => String(tag).startsWith("household_"))) return "family";
  if (age <= 12 && !climate.harsh && !climate.wartime) return "play";
  if (age <= 12) return "family";
  return "labor";
}

export function kindFromAction(action = {}, ctx = {}) {
  const sit = action.situation || action.childTheme || "";
  if (VARIATOR_KINDS.includes(sit)) return sit;
  const hooks = action.hooks || action.when?.hooksAny || [];
  if (hooks.includes("hunger") || hooks.includes("scarcity")) return "hunger";
  if (hooks.includes("health") || sit === "illness" || action.breakdownIncident) return "illness";
  if (hooks.includes("family") || sit === "confinement" || action.schoolIncident) return "family";
  if (hooks.includes("labor") || action.adultIncident) {
    return action.adultKind === "commerce" ? "money" : "labor";
  }
  if (hooks.includes("play") || sit === "play") return "play";
  if (hooks.includes("trade") || sit === "money") return "money";
  if (action.worldEvent) {
    const threads = action.threads || ctx.upheaval?.threads || [];
    if (threads.includes("famine") || threads.includes("unemployment")) return "hunger";
    if (threads.includes("war") || threads.includes("conscription")) return "family";
    return "labor";
  }
  if (action.figureEncounter) return "family";
  return inferVariatorKind(ctx);
}

export function varyGenericNarrative(rng, kind, ctx = {}, character = null) {
  const next = { ...ctx, character: character || ctx.character };
  const useKind = VARIATOR_KINDS.includes(kind) ? kind : inferVariatorKind(next);
  const text = useKind === "hunger" || useKind === "illness"
    ? composePeriodChronicle(rng, next)
    : composeSituationLine(rng, next);
  const who = next.character;
  if (who && text) rememberTextSnippet(who, { stem: text, template: `live:${useKind}` });
  return text;
}

function lockedLaneOf(action = {}) {
  if (action.schoolIncident) return "school";
  if (action.worldEvent) return "world";
  if (action.adultIncident) return "adult";
  if (action.figureEncounter) return "figure";
  if (action.breakdownIncident) return "breakdown";
  return "";
}

export function varyGenericChoice(rng, action, ctx = {}, index = 0) {
  const kind = kindFromAction(action, ctx) || inferVariatorKind(ctx);
  const who = ctx.character;
  const dirs = [action.direction, "endure", "seek", "guard", "resist", "flee", "help"].filter(Boolean);
  const extra = { lockedLane: lockedLaneOf(action) };
  let picked = "";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    extra.direction = dirs[attempt % dirs.length];
    const salt = Number(index || 0) + attempt * 5 + String(action.id || kind).length;
    picked = ctx.weekEncounter
      ? composeEncounterChoice(rng, ctx, ctx.weekEncounter, salt)
      : composeChoiceLine(rng, ctx, kind, salt, extra);
    if (!picked) continue;
    if (who && (textOnCooldown(who, picked) || optionExcluded(who, action.id, picked))) continue;
    break;
  }
  if (!picked) {
    picked = composeChoiceLine(rng, ctx, kind, Number(index || 0) + 11, {
      ...extra,
      direction: "endure",
    });
  }
  if (who && picked) rememberTextSnippet(who, { choice: picked, template: `choice:${kind}` });
  return {
    ...action,
    text: picked,
    trueText: picked,
  };
}

export function weaveVariatorLine(rng, ctx, character = null) {
  return composeHistoryPulse(rng, ctx.worldContext || ctx.historyPulse, {
    ...ctx,
    character: character || ctx.character,
  });
}

export function maybeVaryChoice(rng, action, ctx = {}, index = 0) {
  if (!action) return action;
  const next = varyGenericChoice(rng, action, ctx, index);
  const facts = ctx.narrativeFacts;
  if (!facts || !next?.text) return next;
  const text = scrubEraCopy(next.text, facts);
  const trueText = scrubEraCopy(next.trueText || next.text, facts);
  return { ...next, text, trueText };
}

export { VARIATOR_KINDS };
