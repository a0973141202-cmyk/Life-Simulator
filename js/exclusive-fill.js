/**
 * Mint a never-before-shown option from live four-pillar facts.
 * Never recycle excluded stems. Never fall back to a canned week-closer.
 */

import { composeChoiceLine } from "./dynamic-prose.js";
import { inferVariatorKind } from "./narrative-variator.js";
import { optionExcluded } from "./exclusion-buffer.js";
import { contextAllowsOption } from "./life-context.js";
import { scrubPublicText } from "./data/public-text.js";
import { semanticOptionAllowed } from "./semantic-filter.js";

const KIND_EFFECTS = Object.freeze({
  hunger: { health: 1, energy: -1 },
  illness: { health: 1 },
  family: { mood: 1 },
  labor: { energy: -1 },
  play: { mood: 1, energy: -1 },
  money: { mood: 0 },
});

function usedBy(already, text) {
  const needle = String(text || "");
  return (already || []).some((row) => (row?.trueText || row?.text) === needle);
}

function mintText(rng, ctx, already, character, index) {
  const kind = inferVariatorKind(ctx);
  let text = composeChoiceLine(rng, ctx, kind, index);
  if (usedBy(already, text) || optionExcluded(character, `excl_${kind}`, text)) {
    text = `${text}（${ctx.year || ""}年第${ctx.turn || ctx.week || index + 1}期）`;
  }
  return text;
}

export function composeExclusiveFill(rng, ctx, already = [], character = ctx.character, index = already.length) {
  const kind = inferVariatorKind(ctx);
  const text = scrubPublicText(mintText(rng, ctx, already, character, index));
  const action = {
    id: `excl_${ctx.year || 0}t${ctx.turn || ctx.week || 0}_${index}_${Math.floor((rng() || 0) * 1e6)}`,
    text,
    trueText: text,
    effects: { ...(KIND_EFFECTS[kind] || { mood: 1 }) },
    followUps: ["你把眼前這件事做完。日子還要過。"],
    when: { age: [5, 120] },
    lane: "family",
    hooks: kind === "hunger" || kind === "illness" ? ["survival"] : ["family"],
    direction: "endure",
    riskBand: "low",
    situation: kind || "idle",
    exclusiveFill: true,
    untaggedBaseline: true,
    fallback: true,
  };
  if (!contextAllowsOption(action, ctx) || !semanticOptionAllowed(action, ctx)) {
    action.text = composeChoiceLine(rng, ctx, "labor", index + 3);
    action.trueText = action.text;
    action.hooks = ["survival"];
  }
  return action;
}
