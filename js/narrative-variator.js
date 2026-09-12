/**
 * Procedural narrative layer. Generic week / choice copy is composed
 * from the four-pillar fact sheet — not filled from sentence frames.
 */
import { VARIATOR_KINDS } from "./data/variator-lexicon.js";
import { composeChoiceLine, composePeriodChronicle, composeSituationLine } from "./dynamic-prose.js";
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

export function kindFromAction(action = {}) {
  const sit = action.situation || action.childTheme || "";
  if (VARIATOR_KINDS.includes(sit)) return sit;
  const hooks = action.hooks || action.when?.hooksAny || [];
  if (hooks.includes("hunger") || hooks.includes("scarcity")) return "hunger";
  if (hooks.includes("health") || sit === "illness") return "illness";
  if (hooks.includes("family") || sit === "confinement") return "family";
  if (hooks.includes("labor")) return "labor";
  if (hooks.includes("play") || sit === "play") return "play";
  if (hooks.includes("trade") || sit === "money") return "money";
  return "";
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

export function varyGenericChoice(rng, action, ctx = {}) {
  if (!action || action.worldEvent || action.schoolIncident || action.adultIncident || action.figureEncounter) {
    return action;
  }
  const kind = kindFromAction(action);
  if (!kind) return action;
  const who = ctx.character;
  const salt = String(action.id || action.text || kind).length;
  const picked = composeChoiceLine(rng, ctx, kind, salt);
  if (!picked) return action;
  if (who && (textOnCooldown(who, picked) || optionExcluded(who, action.id, picked))) {
    return action;
  }
  rememberTextSnippet(who, { choice: picked, template: `choice:${kind}` });
  return {
    ...action,
    text: picked,
    trueText: picked,
  };
}

export function weaveVariatorLine(rng, ctx, character = null) {
  return composeSituationLine(rng, { ...ctx, character: character || ctx.character });
}

const KEEP_SPECIFIC = /行賄|巡警|開槍|告密|逃兵|當舖|匯款|炸藥|叛國/;

export function maybeVaryChoice(rng, action, ctx = {}) {
  if (!action?.text) return action;
  const who = ctx.character;
  if (KEEP_SPECIFIC.test(action.text) && !textOnCooldown(who, action.text) && !optionExcluded(who, action.id, action.text)) {
    return action;
  }
  return varyGenericChoice(rng, action, ctx);
}

export { VARIATOR_KINDS };
