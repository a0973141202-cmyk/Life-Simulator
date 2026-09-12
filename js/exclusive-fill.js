/**
 * Mint a never-before-shown option from live four-pillar facts.
 * Never recycle excluded stems. Never fall back to a canned week-closer.
 */

import { composeChoiceLine, composeLiveFollowUp } from "./dynamic-prose.js";
import { composeEncounterChoice } from "./week-encounter.js";
import { inferVariatorKind } from "./narrative-variator.js";
import { optionExcluded } from "./exclusion-buffer.js";
import { textOnCooldown } from "./text-history.js";
import { contextAllowsOption } from "./life-context.js";
import { scrubPublicText } from "./data/public-text.js";
import { semanticOptionAllowed } from "./semantic-filter.js";
import { textsTooSimilar } from "./choice-similarity.js";
import { mintUniqueChoiceLine, pickDistinctLanes } from "./choice-dedupe.js";

const KIND_EFFECTS = Object.freeze({
  hunger: { health: 1, energy: -1 },
  illness: { health: 1 },
  family: { mood: 1 },
  labor: { energy: -1 },
  play: { mood: 1, energy: -1 },
  money: { mood: 0 },
});

function usedBy(already, text) {
  return (already || []).some((row) => textsTooSimilar(row?.trueText || row?.text || row, text));
}

function mintText(rng, ctx, already, character, index) {
  const used = (already || []).map((row) => row?.trueText || row?.text || row).filter(Boolean);
  const lanes = pickDistinctLanes(ctx, 3);
  const kind = inferVariatorKind(ctx);
  const dirs = ["endure", "seek", "guard", "resist", "flee", "help"];
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const lane = lanes[index % lanes.length] || { kind, dir: dirs[attempt % dirs.length] };
    const text = ctx.weekEncounter
      ? composeEncounterChoice(rng, ctx, ctx.weekEncounter, index + attempt, {
        avoidTexts: used,
        forcedLane: { kind: lane.kind || kind, dir: dirs[(index + attempt) % dirs.length] },
      })
      : composeChoiceLine(rng, ctx, lane.kind || kind, index + attempt * 3, {
        direction: dirs[(index + attempt) % dirs.length],
        avoidTexts: used,
      });
    if (!text) continue;
    if (usedBy(already, text)) continue;
    if (optionExcluded(character, `excl_${kind}`, text)) continue;
    if (character && textOnCooldown(character, text)) continue;
    return text;
  }
  return mintUniqueChoiceLine(rng, ctx, index, used, lanes[index % 3]).text;
}

export function composeExclusiveFill(rng, ctx, already = [], character = ctx.character, index = already.length) {
  const kind = inferVariatorKind(ctx);
  const text = scrubPublicText(mintText(rng, ctx, already, character, index));
  const action = {
    id: `excl_${ctx.year || 0}t${ctx.turn || ctx.week || 0}_${index}_${Math.floor((rng() || 0) * 1e6)}`,
    text,
    trueText: text,
    effects: { ...(KIND_EFFECTS[kind] || { mood: 1 }) },
    followUps: [],
    liveFollowUp: composeLiveFollowUp(rng, ctx, { direction: "endure", situation: kind }),
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
    const used = already.map((row) => row?.trueText || row?.text).filter(Boolean);
    const remint = mintUniqueChoiceLine(rng, ctx, index + 3, used).text;
    action.text = remint;
    action.trueText = remint;
    action.hooks = ["survival"];
  }
  return action;
}
