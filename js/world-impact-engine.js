/**
 * Contextual Industry Impact + live world-event triad mint.
 * Catalog incidents supply when/threads/fact seeds only.
 * Player-facing options & effects are computed from live state.
 */

import { composeChoiceLine, composeLiveFollowUp } from "./dynamic-prose.js";
import { scanNarrativeFacts } from "./narrative-facts.js";
import { occupationSector } from "./data/occupations-database.js";
import {
  IMPACT_OUTCOME_TAGS,
  IMPACT_TAG_TILTS,
  THREAD_SECTOR_POLARITY,
  mergePolarity,
  polarityScore,
} from "./data/world-industry-impact.js";
import { ensureCausalState, causalIncidentWeight } from "./causal-feedback-engine.js";
import { textsTooSimilar } from "./choice-similarity.js";
import { filterPublicLine } from "./text-logic-filter.js";
import { publicTagLabel } from "./data/ui-zh.js";

function liveTags(ctx = {}) {
  const character = ctx.character || {};
  const fromRecords = (character.tagRecords || []).map((row) => row.id).filter(Boolean);
  return [...new Set([
    ...(ctx.tags || []),
    ...(character.tags || []),
    ...fromRecords,
    ...(character.permanentTagIds || []),
  ].map((tag) => String(tag || "")).filter(Boolean))];
}

export function resolveCareerSector(ctx = {}) {
  const character = ctx.character || {};
  const career = character.careerState || {};
  if (career.sector) return career.sector;
  if (character.occupationId) {
    const sector = occupationSector(character.occupationId);
    if (sector) return sector;
  }
  if (character.occupation) {
    const sector = occupationSector(character.occupation);
    if (sector) return sector;
  }
  const classId = ctx.familyClassId || character.familyClassId || "worker";
  if (classId === "merchant" || classId === "capitalist") return "commerce";
  if (classId === "official" || classId === "elite") return "politics";
  if (classId === "soldier") return "military";
  if (classId === "peasant" || classId === "worker" || classId === "artisan" || classId === "immigrant") {
    return "labor";
  }
  return "neet";
}

function tagTiltFor(tags, threads) {
  let benefit = 0;
  let harm = 0;
  let shield = 0;
  const matched = [];
  for (const rule of IMPACT_TAG_TILTS) {
    const hitTag = rule.tags.find((tag) => tags.includes(tag));
    if (!hitTag) continue;
    if (!rule.threads.some((thread) => threads.includes(thread))) continue;
    matched.push(hitTag);
    const w = rule.weight || 1;
    if (rule.tilt === "benefit") benefit += w;
    else if (rule.tilt === "harm") harm += w;
    else if (rule.tilt === "shield") shield += w;
  }
  return { benefit, harm, shield, matched };
}

/**
 * Evaluate whether the live protagonist rides or absorbs the shock.
 */
export function evaluateIndustryImpact(ctx = {}, incident = null) {
  const threads = [
    ...(incident?.threads || []),
    ...(ctx.upheaval?.threads || []),
  ].filter(Boolean);
  const uniqueThreads = [...new Set(threads)];
  const sector = resolveCareerSector(ctx);
  const tags = liveTags(ctx);
  const causal = ensureCausalState(ctx.character || {});

  let score = 0;
  const threadPolarities = {};
  for (const thread of uniqueThreads) {
    const table = THREAD_SECTOR_POLARITY[thread];
    const base = table?.[sector] || "neutral";
    threadPolarities[thread] = base;
    score += polarityScore(base);
    score += (causal.threadBias?.[thread] || 0) * 1.2;
  }

  const tilt = tagTiltFor(tags, uniqueThreads.length ? uniqueThreads : ["unemployment"]);
  score += tilt.benefit * 0.9;
  score -= tilt.harm * 0.9;
  score += tilt.shield * 0.55;

  const wealth = Number(ctx.narrativeFacts?.wealth ?? ctx.character?.wealth?.liquid ?? ctx.character?.means?.cash ?? 0);
  if (wealth >= 40 && uniqueThreads.some((t) => t === "devaluation" || t === "unemployment")) {
    score += 0.35;
  }
  if (wealth <= 8 && uniqueThreads.some((t) => t === "unemployment" || t === "flight" || t === "war")) {
    score -= 0.45;
  }

  let polarity = "neutral";
  if (score >= 0.85) polarity = "benefit";
  else if (score <= -0.55) polarity = "harm";

  // Shield tags can soften harm into neutral / weak benefit slot availability.
  const canRide = polarity === "benefit" || (tilt.benefit > 0 && polarity !== "harm");
  const mustAbsorb = polarity === "harm" && tilt.shield < 0.8;
  const braced = tilt.shield > 0 && polarity !== "benefit";

  return {
    polarity,
    score,
    sector,
    threads: uniqueThreads,
    threadPolarities,
    matchedTags: tilt.matched,
    canRide,
    mustAbsorb,
    braced,
    rideWaveXp: causal.rideWaveXp || 0,
    survivorXp: causal.survivorXp || 0,
  };
}

function wealthBand(ctx) {
  const w = Number(ctx.narrativeFacts?.wealth ?? ctx.character?.wealth?.liquid ?? 0);
  if (w >= 50) return "thick";
  if (w >= 18) return "thin";
  return "broke";
}

function planWorldSlots(impact, ctx) {
  const age = Number(ctx.ageYears ?? ctx.narrativeFacts?.age ?? 24);
  const band = wealthBand(ctx);
  const tags = impact.matchedTags || [];
  const quitAhead = tags.includes("persona_quit_ahead") || liveTags(ctx).includes("persona_quit_ahead");
  const hardy = tags.includes("persona_hardy") || liveTags(ctx).includes("persona_hardy");

  if (impact.canRide && impact.polarity === "benefit") {
    return [
      {
        stance: "ride_wave",
        polarity: "benefit",
        dir: "seek",
        kind: "money",
        risk: "high",
        effects: { wealth: band === "broke" ? 4 : 6, mood: 1, sanity: -2, health: -1 },
        riskSpec: { chance: 0.34, effects: { wealth: -8, health: -3, mood: -3 }, text: "順風車翻覆：槓桿與行情同一週抽走你的底。" },
        addTags: [...IMPACT_OUTCOME_TAGS.benefit],
        hooks: ["trade", "labor", "survival"],
      },
      {
        stance: quitAhead ? "convert" : "guard",
        polarity: "benefit",
        dir: quitAhead ? "guard" : "endure",
        kind: "money",
        risk: "mid",
        effects: { wealth: 2, mood: 1, sanity: -1 },
        riskSpec: { chance: 0.18, effects: { wealth: -3, mood: -2 }, text: "見好就收仍慢半拍，額度在窗口關上門前蒸發。" },
        addTags: [...IMPACT_OUTCOME_TAGS.benefit, ...(quitAhead ? [] : IMPACT_OUTCOME_TAGS.shield)],
        hooks: ["trade", "scarcity"],
      },
      {
        stance: "endure",
        polarity: "neutral",
        dir: "endure",
        kind: "labor",
        risk: "mid",
        effects: { wealth: -1, mood: -1, health: hardy ? 0 : -1 },
        riskSpec: { chance: 0.16, effects: { wealth: -3 }, text: "旁觀也要繳通行費：物價與空缺先碰到你。" },
        addTags: [...IMPACT_OUTCOME_TAGS.shield],
        hooks: ["labor", "wait"],
      },
    ];
  }

  if (impact.mustAbsorb || impact.polarity === "harm") {
    return [
      {
        stance: "cut_loss",
        polarity: "harm",
        dir: "flee",
        kind: age < 16 ? "family" : "labor",
        risk: "high",
        effects: { wealth: -2, health: -1, mood: -2, sanity: -1 },
        riskSpec: { chance: 0.3, effects: { wealth: -5, health: -4 }, text: "停損太慢：名額、船票或糧票在你轉身前收走。" },
        addTags: [...IMPACT_OUTCOME_TAGS.harm],
        hooks: ["survival", "scarcity", "travel"],
      },
      {
        stance: "endure",
        polarity: "harm",
        dir: "endure",
        kind: "labor",
        risk: "mid",
        effects: { wealth: -3, health: hardy ? -1 : -2, mood: -3 },
        riskSpec: { chance: 0.26, effects: { health: -5, wealth: -2 }, text: "硬扛的那一週身體先報銷。" },
        addTags: [...IMPACT_OUTCOME_TAGS.harm, ...(hardy ? IMPACT_OUTCOME_TAGS.shield : [])],
        hooks: ["labor", "scarcity", "wait"],
      },
      {
        stance: impact.braced ? "guard" : "resist",
        polarity: impact.braced ? "neutral" : "harm",
        dir: impact.braced ? "guard" : "resist",
        kind: "family",
        risk: "high",
        effects: { charm: -1, mood: -2, sanity: -2, wealth: band === "thick" ? -1 : -2 },
        riskSpec: { chance: 0.28, effects: { charm: -3, mood: -3 }, text: "頂撞或死守都把你寫進下一輪名單。" },
        addTags: impact.braced ? [...IMPACT_OUTCOME_TAGS.shield] : [...IMPACT_OUTCOME_TAGS.harm],
        hooks: ["official", "survival"],
      },
    ];
  }

  // Mixed / neutral — still three live stances, never a fixed A/B script.
  return [
    {
      stance: "endure",
      polarity: "neutral",
      dir: "endure",
      kind: "labor",
      risk: "mid",
      effects: { wealth: -1, mood: -1 },
      riskSpec: { chance: 0.2, effects: { wealth: -3, mood: -2 }, text: "觀望也有利息：工時與物價先動。" },
      addTags: [...IMPACT_OUTCOME_TAGS.shield],
      hooks: ["labor", "wait"],
    },
    {
      stance: "hustle",
      polarity: "neutral",
      dir: "seek",
      kind: "labor",
      risk: "high",
      effects: { wealth: 1, health: -2, mood: -1 },
      riskSpec: { chance: 0.27, effects: { health: -6 }, text: "臨時活沒有防護，這一週的勞動力被切掉。" },
      addTags: [...IMPACT_OUTCOME_TAGS.shield],
      hooks: ["labor", "survival"],
    },
    {
      stance: impact.canRide ? "ride_wave" : "guard",
      polarity: impact.canRide ? "benefit" : "neutral",
      dir: impact.canRide ? "seek" : "guard",
      kind: "money",
      risk: impact.canRide ? "high" : "mid",
      effects: impact.canRide
        ? { wealth: 3, sanity: -2, mood: 1 }
        : { wealth: -1, mood: -1, charm: 1 },
      riskSpec: impact.canRide
        ? { chance: 0.32, effects: { wealth: -6, mood: -3 }, text: "賭博式翻身失敗，存款與信用同週見底。" }
        : { chance: 0.18, effects: { wealth: -2 }, text: "守成仍被抽走一截通行費。" },
      addTags: impact.canRide ? [...IMPACT_OUTCOME_TAGS.benefit] : [...IMPACT_OUTCOME_TAGS.shield],
      hooks: ["trade", "scarcity"],
    },
  ];
}

function mintOneLine(rng, ctx, slot, index, used, driverTags) {
  const label = publicTagLabel({ id: driverTags[0] }) || driverTags[0] || "時代";
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const text = composeChoiceLine(rng, ctx, slot.kind, index + attempt * 4, {
      direction: slot.dir,
      kind: slot.kind,
      avoidTexts: used,
      driverTags,
      tagFocus: "world",
      tagLabel: label,
      forcedSlot: index,
      industryPolarity: slot.polarity,
      worldStance: slot.stance,
    });
    if (!text) continue;
    if (used.some((row) => textsTooSimilar(row, text))) continue;
    const logic = filterPublicLine(text, ctx, { usedLines: used, character: ctx.character });
    if (!logic.ok) continue;
    return text;
  }
  return composeChoiceLine(rng, ctx, slot.kind, index + 33, {
    direction: slot.dir,
    driverTags,
    avoidTexts: used,
  });
}

/**
 * Mint a full world-event triad from live industry impact — no catalog option text.
 */
export function mintWorldEventTriad(rng, incident, ctx = {}, impact = null) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const liveImpact = impact || evaluateIndustryImpact(ctx, incident);
  ctx.industryImpact = liveImpact;
  const slots = planWorldSlots(liveImpact, ctx);
  const drivers = [
    ...(liveImpact.matchedTags || []),
    ...(incident?.threads || []).map((t) => `world_thread_${t}`),
    liveImpact.sector ? `sector_${liveImpact.sector}` : null,
  ].filter(Boolean);
  const used = [];
  const threadTags = {
    unemployment: "world_mass_layoff",
    devaluation: "world_devaluation",
    war: "world_stray_fire",
    conscription: "world_curfew",
    flight: "world_listed",
    purge: "world_listed",
  };

  return slots.slice(0, 3).map((slot, index) => {
    const addTags = [...new Set([
      ...(slot.addTags || []),
      ...((incident?.threads || []).map((thread) => threadTags[thread]).filter(Boolean)),
    ])];
    const text = mintOneLine(rng, ctx, slot, index, used, drivers.length ? drivers : ["world"]);
    used.push(text);
    return {
      id: `worldmint_${incident.id}_${slot.stance}_${index}`,
      text,
      trueText: text,
      effects: { ...(slot.effects || {}) },
      followUps: [],
      liveFollowUp: composeLiveFollowUp(rng, ctx, {
        direction: slot.dir,
        situation: slot.kind,
        industryPolarity: slot.polarity,
      }),
      addTags,
      hooks: [...new Set([...(slot.hooks || []), "world", ...(incident?.threads || [])])],
      risk: slot.riskSpec || null,
      riskBand: slot.risk || "mid",
      stance: slot.stance,
      direction: slot.dir,
      situation: slot.kind,
      industryPolarity: slot.polarity,
      industrySector: liveImpact.sector,
      worldEvent: true,
      worldEventId: incident.id,
      worldKind: incident.kind,
      worldLock: incident.lock,
      threads: (incident.threads || []).slice(),
      worldThreads: (incident.threads || []).slice(),
      worldNonsexual: true,
      noSexualMinorActs: true,
      affectChoice: true,
      tagDriven: true,
      liveTagMint: true,
      liveWorldMint: true,
      zeroHardcodedTemplates: true,
      dynamicWorldMint: true,
      driverTags: drivers.slice(0, 4),
      when: incident.when ? { ...incident.when } : { age: [5, 120] },
    };
  });
}

/**
 * Replace catalog options with a live mint; keep incident as fact/when seed.
 */
export function finalizeWorldIncident(rng, incident, ctx = {}) {
  if (!incident) return null;
  const impact = evaluateIndustryImpact(ctx, incident);
  ctx.industryImpact = impact;
  const options = mintWorldEventTriad(rng, incident, ctx, impact);
  if (options.length < 3) return null;
  return {
    ...incident,
    options,
    industryImpact: impact,
    dynamicWorldMint: true,
    // Catalog fact is a seed; prose engine still prefers composeWorldBeat.
    factSeed: incident.fact,
  };
}

export function industryPickWeight(ctx, incident) {
  const impact = evaluateIndustryImpact(ctx, incident);
  let weight = 1;
  if (impact.polarity === "harm") weight *= 1.35;
  if (impact.polarity === "benefit") weight *= 1.2;
  if (impact.matchedTags.length) weight *= 1.15;
  weight *= causalIncidentWeight(ctx, incident);
  return weight;
}

export function modifyResolutionForIndustry(character, option, effects, texts) {
  if (!option?.worldEvent) return { effects, extraRisk: 0 };
  const next = { ...effects };
  let extraRisk = 0;
  const polarity = option.industryPolarity;
  if (polarity === "benefit") {
    if (option.stance === "ride_wave") {
      extraRisk += 0.06;
      if (next.wealth > 0) next.wealth += 1;
    }
    texts.push("你的行業與標籤剛好踩在這波動盪的順風邊上。賺的是行情，也是風險。");
  } else if (polarity === "harm") {
    extraRisk += 0.07;
    if (next.wealth > -1) next.wealth = (next.wealth || 0) - 1;
    if (next.health > 0) next.health = Math.max(0, next.health - 1);
    texts.push("逆風行業與缺少防護標籤讓這一週的宏觀衝擊先打到你。");
  } else if (option.industrySector) {
    texts.push("動盪過境：身分與班表決定你是旁觀、停損，還是伸手。");
  }
  return { effects: next, extraRisk };
}

export function weeklyIndustryFallout(rng, character, time = {}) {
  const tags = character?.tags || [];
  const notes = [];
  const effects = {};
  const sector = character?.careerState?.sector
    || occupationSector(character?.occupationId)
    || occupationSector(character?.occupation)
    || null;

  if (tags.includes("world_ride_wave") && typeof rng === "function" && rng() < 0.12) {
    effects.wealth = (effects.wealth || 0) + 1;
    effects.sanity = (effects.sanity || 0) - 1;
    notes.push("順勢帳週結：多進一截，神經也跟著槓桿抖一下。");
  }
  if (tags.includes("world_shock_scar") && typeof rng === "function" && rng() < 0.14) {
    effects.wealth = (effects.wealth || 0) - 1;
    effects.mood = (effects.mood || 0) - 1;
    if (sector === "labor" || sector === "office" || sector === "neet") {
      effects.health = (effects.health || 0) - 1;
    }
    notes.push("衝擊疤按週抽成：工時、物價或名單繼續扣你的底。");
  }
  if (tags.includes("world_shock_brace") && typeof rng === "function" && rng() < 0.1) {
    effects.mood = (effects.mood || 0) + 1;
    notes.push("早年練出的扛法這一週擋下一截，沒把你從名單上擦掉。");
  }

  void time;
  return { notes, effects, addTags: [], consequence: null };
}

export { liveTags as liveImpactTags };
