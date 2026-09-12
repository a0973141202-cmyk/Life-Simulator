/**
 * Hint style engine: fog may hide numbers. Choice buttons never show invoices.
 * The public label is the action only. Settlement happens after the click.
 */

import { FOG_COST_HINTS, FOG_HIDDEN_WEAVES, FOG_TRAPS } from "./data/fog-lexicon.js";
import { FOG_KEEPS_ACTION } from "./data/prose-rules.js";
import { scrubPublicText } from "./data/public-text.js";
import { actionOnlyText } from "./stat-canon.js";
import { chance, pick } from "./rng.js";
import { semanticOptionAllowed } from "./semantic-filter.js";

function hiddenRecords(ctx) {
  const records = ctx.character?.tagRecords || ctx.tagRecords || [];
  return records.filter((item) => item.hidden);
}

function weaveHiddenFog(rng, option, ctx) {
  const hidden = hiddenRecords(ctx);
  const hooks = new Set([...(option.hooks || []), ...((option.when?.hooksAny) || [])]);
  const matches = hidden.filter((item) => {
    const itemHooks = item.hooks || [];
    if (itemHooks.some((hook) => hooks.has(hook))) return true;
    if (hooks.has(item.id) || hooks.has(item.label)) return true;
    return (ctx.hooks || []).some((hook) => itemHooks.includes(hook) || item.id === `hook_${hook}`);
  });
  const weavePool = FOG_HIDDEN_WEAVES.filter((row) => {
    if (row.hooks.some((hook) => hooks.has(hook))) return true;
    return hidden.some((item) => (item.hooks || []).some((hook) => row.hooks.includes(hook)) || row.hooks.some((hook) => item.id.includes(hook)));
  }).filter((row) => semanticOptionAllowed({ text: row.line, hooks: row.hooks }, ctx));
  if (matches.length && chance(rng, 0.7) && weavePool.length) {
    const line = pick(rng, weavePool).line;
    return { text: line, influencedByHidden: true, hiddenHint: true };
  }
  if (hidden.length && chance(rng, 0.35)) {
    const whisper = pick(rng, [
      "你家的出身或舊病這週會讓這一步更貴或更便宜。你要做的事仍是選項上寫的那一句。",
      "舊帳會加重或減輕代價。行動本身仍是這句話寫的那件事：吃、跑、求人、或交出去。",
      "有一件未公開的舊事與這個選項有關。名字不寫出來，帳仍會入。",
    ]);
    return { text: whisper, influencedByHidden: true, hiddenHint: true };
  }
  return null;
}

function publicActionLabel(option, trueText) {
  return actionOnlyText({ ...option, trueText: trueText || option?.text });
}

export function dressOption(rng, option, ctx, profile) {
  const slot = option.chaosSlot;
  const trueText = publicActionLabel(option, option.text);

  const forceFog = slot === "trap" || slot === "foggood" || profile?.id === "trap_week";
  const lockedFact = option.traumaVictim || option.schoolIncident || option.perpCasteEcology
    || option.adultIncident || option.worldEvent || option.figureEncounter;
  const style = (!lockedFact && (forceFog || !chance(rng, 0.5))) ? "fog" : "blunt";

  if (style === "fog") {
    const hiddenWeave = weaveHiddenFog(rng, option, ctx);
    const hint = slot === "trap"
      ? pick(rng, FOG_TRAPS)
      : (hiddenWeave?.text || pick(rng, FOG_COST_HINTS));
    const action = FOG_KEEPS_ACTION ? trueText : hint;
    return {
      ...option,
      trueText,
      style: "fog",
      text: action,
      preview: null,
      fog: {
        influencedByHidden: Boolean(hiddenWeave?.influencedByHidden),
        trap: slot === "trap",
        hint,
      },
      effectsHidden: true,
    };
  }

  return {
    ...option,
    trueText,
    style: "blunt",
    text: trueText,
    preview: null,
    fog: null,
    effectsHidden: true,
  };
}

export function publicOptionView(option) {
  if (!option) return option;
  const text = scrubPublicText(actionOnlyText(option)) || actionOnlyText(option);
  return {
    index: option.index,
    id: option.style === "fog" ? `fog_${option.index}` : option.id,
    text,
    style: option.style || "blunt",
    preview: null,
    sandbox: option.sandbox || false,
    crisis: option.crisis || false,
    effectsHidden: true,
    fog: option.style === "fog"
      ? {
        influencedByHidden: Boolean(option.fog?.influencedByHidden),
        trap: Boolean(option.fog?.trap),
      }
      : undefined,
  };
}

export function publicEventView(event) {
  if (!event) return event;
  return {
    ...event,
    narrative: scrubPublicText(event.narrative || ""),
    options: (event.options || []).map(publicOptionView),
  };
}
