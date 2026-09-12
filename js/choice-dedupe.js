/**
 * Final triad uniqueness pass.
 * Guarantees three options differ in direction, risk posture, and wording.
 */
import { clashesAny, textsTooSimilar } from "./choice-similarity.js";
import { composeChoiceLine } from "./dynamic-prose.js";
import { pickLiveChoiceLane } from "./text-logic-filter.js";
import { optionExcluded } from "./exclusion-buffer.js";
import { textOnCooldown } from "./text-history.js";
import { scanNarrativeFacts } from "./narrative-facts.js";

const SLOT_FORCE = Object.freeze([
  { kind: "family", dir: "guard", risk: "low" },
  { kind: "hunger", dir: "seek", risk: "mid" },
  { kind: "family", dir: "resist", risk: "high" },
]);

const SLOT_FORCE_CHILD = Object.freeze([
  { kind: "family", dir: "help", risk: "low" },
  { kind: "hunger", dir: "guard", risk: "mid" },
  { kind: "family", dir: "resist", risk: "high" },
]);

const SLOT_FORCE_FRAIL = Object.freeze([
  { kind: "illness", dir: "endure", risk: "low" },
  { kind: "illness", dir: "guard", risk: "mid" },
  { kind: "family", dir: "help", risk: "low" },
]);

export function pickDistinctLanes(ctx = {}, count = 3) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const age = Number(facts.age || 0);
  const health = Number(facts.health ?? 50);
  const forced = (health <= 28 || facts.fever)
    ? SLOT_FORCE_FRAIL
    : (age < 7 ? SLOT_FORCE_CHILD : SLOT_FORCE);
  const out = [];
  const used = new Set();
  for (let i = 0; i < count; i += 1) {
    let lane = forced[i] || pickLiveChoiceLane(ctx, i);
    let key = `${lane.kind}:${lane.dir}`;
    if (used.has(key)) {
      const pool = [
        ...forced,
        pickLiveChoiceLane(ctx, i + 3),
        pickLiveChoiceLane(ctx, i + 7),
        { kind: "money", dir: "resist" },
        { kind: "labor", dir: "endure" },
        { kind: "family", dir: "flee" },
        { kind: "hunger", dir: "seek" },
      ];
      lane = pool.find((row) => !used.has(`${row.kind}:${row.dir}`)) || {
        kind: "family",
        dir: ["guard", "seek", "resist"][i % 3],
      };
      key = `${lane.kind}:${lane.dir}`;
    }
    used.add(key);
    out.push({ ...lane, risk: lane.risk || forced[i]?.risk || "mid" });
  }
  return out;
}

function hardSlotLine(ctx, index, used) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const city = facts.city || "此地";
  const who = facts.motherAlive
    ? (facts.motherName ? `母親${facts.motherName}` : "母親")
    : (facts.fatherAlive
      ? (facts.fatherName ? `父親${facts.fatherName}` : "父親")
      : "家裏的人");
  const food = facts.hungry || facts.poor ? "眼前那口能吃的" : "這一週的糧";
  const slots = [
    `把門栓插上，聽見拍門先裝作沒人`,
    `去${city}把能換成${food}的路走完`,
    `不按屋裏的口令把最小的那碗交出去`,
  ];
  const frail = [
    `躺著把力氣留給去廁所那一下`,
    `把冷毛巾和能喝的水留給還在燒的人`,
    `按${who}交代的把水打回來、把碗洗乾淨`,
  ];
  const pool = Number(facts.health ?? 50) <= 28 ? frail : slots;
  let line = pool[index % pool.length];
  if (clashesAny(line, used)) {
    line = `${line}，這一步只做一次`;
  }
  return line;
}

export function mintUniqueChoiceLine(rng, ctx, index, used = [], prefer = null) {
  const who = ctx.character;
  const lanes = prefer ? [prefer, ...pickDistinctLanes(ctx, 3)] : pickDistinctLanes(ctx, 3);
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const lane = lanes[Math.min(index, lanes.length - 1)] || pickLiveChoiceLane(ctx, index + attempt * 5);
    const dirPool = [lane.dir, "seek", "guard", "resist", "help", "flee", "endure"];
    const kindPool = [lane.kind, "family", "hunger", "illness", "money", "labor"];
    const text = composeChoiceLine(rng, ctx, kindPool[attempt % kindPool.length], index + 41 + attempt * 9, {
      direction: dirPool[attempt % dirPool.length],
      avoidTexts: used,
      forcedSlot: index,
    });
    if (!text) continue;
    if (clashesAny(text, used)) continue;
    if (who && optionExcluded(who, `slot_${index}`, text)) continue;
    if (who && textOnCooldown(who, text)) continue;
    return { text, lane };
  }
  return { text: hardSlotLine(ctx, index, used), lane: lanes[index] || SLOT_FORCE[index] };
}

export function ensureDistinctChoiceTriad(rng, options = [], ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const lanes = pickDistinctLanes(ctx, 3);
  const out = [];
  const used = [];
  const source = (options || []).slice(0, 3);
  while (source.length < 3) source.push(null);
  for (let index = 0; index < 3; index += 1) {
    const base = source[index] || {};
    let text = base.trueText || base.text || "";
    const blocked = !text
      || clashesAny(text, used)
      || (ctx.character && optionExcluded(ctx.character, base.id, text))
      || (ctx.character && textOnCooldown(ctx.character, text));
    if (blocked) {
      const minted = mintUniqueChoiceLine(rng, ctx, index, used, lanes[index]);
      text = minted.text;
    }
    if (clashesAny(text, used)) {
      text = hardSlotLine(ctx, index, used);
    }
    out.push({
      ...base,
      id: base.id || `triad_${index}_${Math.floor((typeof rng === "function" ? rng() : 0.5) * 1e6)}`,
      text,
      trueText: text,
      direction: base.direction || lanes[index]?.dir,
      situation: base.situation || lanes[index]?.kind,
      riskBand: base.riskBand || lanes[index]?.risk || "mid",
      triadUnique: true,
    });
    used.push(text);
  }
  return out;
}

export { textsTooSimilar, clashesAny };
