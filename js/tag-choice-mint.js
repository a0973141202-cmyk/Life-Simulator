/**
 * Tag-driven live triad mint.
 * Player-facing choice text is assembled from live tags + four-pillar facts.
 * Static action catalogs are not used for display copy.
 */
import { TAG_PREFIX } from "./data/tag-schema.js";
import { composeChoiceLine, composeLiveFollowUp } from "./dynamic-prose.js";
import { scanNarrativeFacts } from "./narrative-facts.js";
import { optionExcluded } from "./exclusion-buffer.js";
import { textOnCooldown } from "./text-history.js";
import { textsTooSimilar } from "./choice-similarity.js";
import { ensureDistinctChoiceTriad } from "./choice-dedupe.js";
import { tagValence } from "./tag-influence.js";
import { filterPublicLine } from "./text-logic-filter.js";
import { publicTagLabel } from "./data/ui-zh.js";
import { weavePersonaOptions } from "./persona-engine.js";

const PREFIX_KIND = Object.freeze({
  trauma: { kind: "family", dirs: ["endure", "flee", "resist"], risk: "high", effects: { sanity: -1, health: -1 } },
  household: { kind: "family", dirs: ["guard", "resist", "help"], risk: "mid", effects: { mood: -1 } },
  kin: { kind: "family", dirs: ["help", "endure", "resist"], risk: "mid", effects: { mood: 1, sanity: -1 } },
  parent: { kind: "family", dirs: ["help", "endure", "guard"], risk: "low", effects: { mood: -1 } },
  wealth: { kind: "money", dirs: ["seek", "guard", "resist"], risk: "high", effects: { wealth: -1, mood: -1 } },
  socio: { kind: "hunger", dirs: ["seek", "guard", "endure"], risk: "mid", effects: { health: 1, mood: -1 } },
  school: { kind: "family", dirs: ["endure", "resist", "flee"], risk: "mid", effects: { mood: -1 } },
  caste: { kind: "labor", dirs: ["endure", "resist", "flee"], risk: "high", effects: { health: -1 } },
  adult: { kind: "labor", dirs: ["endure", "seek", "resist"], risk: "mid", effects: { energy: -1 } },
  path: { kind: "money", dirs: ["seek", "resist", "flee"], risk: "high", effects: { mood: -1 } },
  crime: { kind: "family", dirs: ["flee", "guard", "resist"], risk: "high", effects: { sanity: -1 } },
  mood: { kind: "illness", dirs: ["endure", "flee", "seek"], risk: "mid", effects: { sanity: 1, mood: 1 } },
  condition: { kind: "illness", dirs: ["endure", "guard", "help"], risk: "mid", effects: { health: 1 } },
  risk: { kind: "illness", dirs: ["endure", "guard", "flee"], risk: "mid", effects: { health: 1 } },
  ethnicity: { kind: "family", dirs: ["endure", "seek", "withdraw"], risk: "low", effects: { mood: 1 } },
  trait: { kind: "labor", dirs: ["endure", "help", "seek"], risk: "low", effects: { health: 1 } },
  parentTrait: { kind: "family", dirs: ["help", "endure", "tend"], risk: "low", effects: { intelligence: 1 } },
  climate: { kind: "labor", dirs: ["endure", "seek", "guard"], risk: "low", effects: { health: 1 } },
  env: { kind: "labor", dirs: ["endure", "flee", "seek"], risk: "mid", effects: { health: 1 } },
  current: { kind: "family", dirs: ["endure", "seek", "guard"], risk: "low", effects: { mood: -1 } },
  class: { kind: "labor", dirs: ["endure", "seek", "resist"], risk: "mid", effects: { mood: -1 } },
  world: { kind: "family", dirs: ["flee", "guard", "endure"], risk: "high", effects: { sanity: -1 } },
  figure: { kind: "family", dirs: ["seek", "guard", "flee"], risk: "mid", effects: { mood: 1 } },
  social: { kind: "family", dirs: ["endure", "withdraw", "seek"], risk: "mid", effects: { charm: -1 } },
  acquired: { kind: "labor", dirs: ["seek", "endure", "resist"], risk: "mid", effects: { intelligence: 1 } },
  hook: { kind: "labor", dirs: ["seek", "flee", "endure"], risk: "mid", effects: { health: 1 } },
  lineage: { kind: "family", dirs: ["endure", "withdraw", "resist"], risk: "mid", effects: { charm: -1 } },
  politics: { kind: "family", dirs: ["endure", "resist", "flee"], risk: "high", effects: { mood: -1 } },
  ledger: { kind: "money", dirs: ["guard", "flee", "endure"], risk: "high", effects: { mood: -1 } },
  persona: { kind: "family", dirs: ["help", "endure", "seek"], risk: "low", effects: { mood: 1, charm: 1 } },
});

const DIR_ALIASES = Object.freeze({
  withdraw: "flee",
  tend: "help",
  survive: "endure",
});

function normalizeDir(dir) {
  const raw = String(dir || "endure");
  return DIR_ALIASES[raw] || raw;
}

function prefixCategory(tag) {
  const id = String(tag || "");
  for (const [category, prefix] of Object.entries(TAG_PREFIX)) {
    if (id.startsWith(prefix)) return category;
  }
  if (id.startsWith("wealth_")) return "wealth";
  if (id.startsWith("kin_")) return "kin";
  return "misc";
}

function liveTags(ctx = {}) {
  const character = ctx.character || {};
  const fromRecords = (character.tagRecords || []).map((row) => row.id).filter(Boolean);
  const bag = [
    ...(ctx.tags || []),
    ...(character.tags || []),
    ...fromRecords,
    ...(character.socioTags || []),
    ...(character.householdClimate || []),
  ];
  return [...new Set(bag.map((tag) => String(tag || "")).filter(Boolean))];
}

function scoreTag(tag, ctx) {
  const cat = prefixCategory(tag);
  const valence = tagValence(tag, ctx);
  let score = 1;
  if (cat === "trauma" || cat === "wealth" || cat === "kin" || cat === "caste") score += 4;
  if (cat === "persona") score += 5;
  if (cat === "household" || cat === "school" || cat === "mood" || cat === "path") score += 3;
  if (cat === "socio" || cat === "condition" || cat === "adult") score += 2;
  if (valence === "strain") score += 2;
  if (valence === "advantage") score += 1;
  return score;
}

function laneFromTag(tag, ctx, index) {
  const cat = prefixCategory(tag);
  const pack = PREFIX_KIND[cat] || PREFIX_KIND.class;
  const dirs = pack.dirs || ["endure", "seek", "guard"];
  const dir = normalizeDir(dirs[index % dirs.length]);
  let kind = pack.kind;
  const facts = ctx.narrativeFacts || {};
  if (Number(facts.health ?? 50) <= 28) kind = "illness";
  else if (facts.hungry && (kind === "labor" || kind === "play")) kind = "hunger";
  else if ((facts.age || 0) < 7 && kind === "labor") kind = "family";
  return {
    tag,
    category: cat,
    kind,
    dir,
    risk: pack.risk || "mid",
    effects: { ...(pack.effects || {}) },
    valence: tagValence(tag, ctx),
    label: publicTagLabel({ id: tag }) || publicTagLabel(tag) || (
      cat === "lineage" || cat === "ethnicity" ? "出身"
        : cat === "household" ? "家裏的規矩"
          : cat === "trauma" ? "舊傷"
            : cat === "persona" ? "性子"
              : "身上的標記"
    ),
  };
}

export function collectTagLanes(ctx = {}, count = 3) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const tags = liveTags(ctx)
    .filter((tag) => !String(tag).startsWith("current_date_"))
    .sort((a, b) => scoreTag(b, ctx) - scoreTag(a, ctx) || a.localeCompare(b));
  const lanes = [];
  const usedKeys = new Set();
  for (const tag of tags) {
    if (lanes.length >= count) break;
    for (let offset = 0; offset < 3 && lanes.length < count; offset += 1) {
      const lane = laneFromTag(tag, ctx, lanes.length + offset);
      const key = `${lane.kind}:${lane.dir}:${lane.category}`;
      if (usedKeys.has(key)) continue;
      usedKeys.add(key);
      lanes.push(lane);
      break;
    }
  }
  while (lanes.length < count) {
    const fallbackTag = tags[lanes.length] || tags[0] || `class_${facts.classId || "worker"}`;
    const lane = laneFromTag(fallbackTag, ctx, lanes.length);
    lane.dir = normalizeDir(["guard", "seek", "resist"][lanes.length % 3]);
    const key = `${lane.kind}:${lane.dir}:${lane.category}:${lanes.length}`;
    if (!usedKeys.has(key)) {
      usedKeys.add(key);
      lanes.push(lane);
    } else {
      lanes.push({ ...lane, dir: ["help", "flee", "endure"][lanes.length % 3], tag: fallbackTag });
    }
  }
  return lanes.slice(0, count);
}

function effectsForLane(lane, ctx) {
  const effects = { ...(lane.effects || {}) };
  const age = Number(ctx.narrativeFacts?.age || ctx.ageYears || 0);
  if (age < 7) {
    delete effects.energy;
    if (effects.wealth) delete effects.wealth;
  }
  if (lane.valence === "advantage" && !effects.mood) effects.mood = 1;
  if (lane.valence === "strain" && effects.sanity == null) effects.sanity = -1;
  return effects;
}

function mintLine(rng, ctx, lane, index, used) {
  const who = ctx.character;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const text = composeChoiceLine(rng, ctx, lane.kind, index + attempt * 5, {
      direction: lane.dir,
      kind: lane.kind,
      avoidTexts: used,
      driverTags: [lane.tag, ...(lane.overlap || [])].filter(Boolean),
      tagFocus: lane.category,
      tagLabel: lane.label,
      forcedSlot: index,
    });
    if (!text) continue;
    if (used.some((row) => textsTooSimilar(row, text))) continue;
    if (who && optionExcluded(who, `tag_${lane.tag}_${index}`, text)) continue;
    if (who && textOnCooldown(who, text)) continue;
    const logic = filterPublicLine(text, ctx, { usedLines: used, character: who });
    if (!logic.ok) continue;
    return text;
  }
  return composeChoiceLine(rng, ctx, lane.kind, index + 29, {
    direction: lane.dir,
    driverTags: [lane.tag],
    tagFocus: lane.category,
    avoidTexts: used,
  });
}

/**
 * Mint exactly three tag-driven options. Overlap: secondary tags may ride along.
 */
export function mintTagDrivenTriad(rng, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const lanes = collectTagLanes(ctx, 3);
  const allTags = liveTags(ctx);
  const used = [];
  const options = lanes.map((lane, index) => {
    const overlap = allTags
      .filter((tag) => tag !== lane.tag)
      .filter((tag) => prefixCategory(tag) !== lane.category)
      .slice(0, 2);
    const full = { ...lane, overlap };
    const text = mintLine(rng, ctx, full, index, used);
    used.push(text);
    return {
      id: `tagmint_${lane.category}_${index}_${Math.floor((typeof rng === "function" ? rng() : 0.4) * 1e6)}`,
      text,
      trueText: text,
      effects: effectsForLane(lane, ctx),
      followUps: [],
      liveFollowUp: composeLiveFollowUp(rng, ctx, { direction: lane.dir, situation: lane.kind }),
      when: { age: [5, 120], tagsAny: [lane.tag, ...overlap] },
      tagDriven: true,
      liveTagMint: true,
      zeroHardcodedTemplates: true,
      driverTags: [lane.tag, ...overlap],
      direction: lane.dir,
      situation: lane.kind,
      riskBand: lane.risk,
      hooks: [lane.category, lane.kind === "hunger" ? "scarcity" : "survival"].filter(Boolean),
      untaggedBaseline: false,
    };
  });
  const distinct = ensureDistinctChoiceTriad(rng, options, ctx).map((option, index) => ({
    ...options[index],
    ...option,
    text: option.text,
    trueText: option.trueText || option.text,
    tagDriven: true,
    liveTagMint: true,
  }));
  return weavePersonaOptions(rng, distinct, ctx);
}

/**
 * Keep locked-incident mechanics; replace display text with live tag mint.
 */
export function remintLockedTriadText(rng, options = [], ctx = {}) {
  const lanes = collectTagLanes(ctx, 3);
  const used = [];
  return (options || []).slice(0, 3).map((option, index) => {
    const lane = {
      ...lanes[index],
      dir: normalizeDir(option.direction || option.stance || lanes[index].dir),
      kind: option.situation || lanes[index].kind,
    };
    const text = mintLine(rng, ctx, lane, index + 50, used);
    used.push(text);
    return {
      ...option,
      text,
      trueText: text,
      tagDriven: true,
      liveTagMint: true,
      driverTags: lane.tag ? [lane.tag, ...(option.driverTags || [])] : (option.driverTags || []),
      direction: lane.dir,
    };
  });
}

export { liveTags as liveCharacterTags, prefixCategory as tagPrefixCategory };
