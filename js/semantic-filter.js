/**
 * Semantic context filter for generated copy and triad options.
 * Fail closed on mature child-tone, frail-body vs violent motion, and
 * leisure options that ignore the week's crisis.
 */

import { childhoodClimate } from "./early-child-filter.js";
import { EARLY_CHILD_MAX } from "./data/age-gate-rules.js";
import {
  CHILD_MATURE_PATTERNS,
  CHILD_TONE_PATTERNS,
  CRISIS_HOOKS,
  EUPHORIC_PATTERNS,
  FRAIL_BODY_PATTERNS,
  INCOHERENT_PATTERNS,
  LEISURE_PATTERNS,
  SATED_PATTERNS,
  SURVIVAL_SITUATIONS,
  VIGOROUS_MOTION_PATTERNS,
} from "./data/semantic-context-rules.js";

function hits(patterns, text) {
  return (patterns || []).some((pattern) => pattern.test(text));
}

function corpusOf(item = {}) {
  return [
    item.id,
    item.text,
    item.trueText,
    item.optionText,
    item.fact,
    ...(item.followUps || []),
    ...(item.hooks || []),
    item.situation,
    item.childTheme,
  ].filter(Boolean).join("\n");
}

function tagsOf(ctx = {}) {
  return ctx.tags || ctx.character?.tags || [];
}

function healthOf(ctx = {}) {
  return Number(ctx.stats?.health ?? ctx.character?.stats?.health ?? 50);
}

export function situationFrame(ctx = {}) {
  const age = Math.max(0, Number(ctx.ageYears ?? ctx.character?.ageYears) || 0);
  const health = healthOf(ctx);
  const tags = tagsOf(ctx);
  const band = ctx.geoBand || ctx.geoBandBase || "";
  const child = childhoodClimate(ctx);
  const threads = ctx.upheaval?.threads || [];
  const organic = ctx.organicContexts || ctx.organic?.contexts || [];
  const crises = [];

  if (child.harsh || child.famine || threads.includes("famine") || organic.includes("famine")) crises.push("hunger");
  if (health <= 28 || organic.includes("plague") || tags.some((tag) => /病|疫/.test(String(tag)))) crises.push("illness");
  if (band === "warzone" || child.wartime || threads.includes("conscription") || organic.includes("conscription")) {
    crises.push("war");
  }
  if (band === "disaster" || child.plague) crises.push("disaster");
  if (child.harsh || tags.some((tag) => String(tag).startsWith("household_"))) crises.push("confinement");
  if (tags.some((tag) => String(tag).startsWith("trauma_"))) crises.push("trauma");
  if (threads.includes("unemployment") || organic.includes("labor")) crises.push("labor");

  const frail = health <= 28 || hits(FRAIL_BODY_PATTERNS, tags.join("\n"))
    || tags.some((tag) => /starve|malnourish|flinch_body/.test(String(tag)));
  const critical = health <= 12 || /癱瘓|昏迷/.test(tags.join("\n"));
  const strict = Boolean(
    (age <= EARLY_CHILD_MAX && child.harsh)
    || crises.includes("hunger")
    || crises.includes("war")
    || crises.includes("disaster")
    || critical
    || (ctx.pressure?.level === "ruin" || ctx.pressure?.level === "crisis"),
  );

  return {
    age,
    health,
    band,
    child,
    crises,
    frail,
    critical,
    hungry: crises.includes("hunger"),
    strict,
    body: critical ? "critical" : (frail ? "frail" : "mobile"),
  };
}

export function scanSemanticMismatches(text, ctx = {}, option = null) {
  const frame = situationFrame(ctx);
  const raw = String(text || "");
  const hitsFound = [];
  if (!raw.trim()) return hitsFound;

  if (hits(INCOHERENT_PATTERNS, raw)) hitsFound.push("incoherent");
  if (frame.age <= 12 && hits(CHILD_MATURE_PATTERNS, raw)) hitsFound.push("child_mature");
  if (frame.age <= EARLY_CHILD_MAX && hits(CHILD_TONE_PATTERNS, raw)) hitsFound.push("child_tone");
  if ((frame.frail || frame.critical) && hits(VIGOROUS_MOTION_PATTERNS, raw)) hitsFound.push("frail_motion");
  if ((frame.hungry || frame.critical) && hits(EUPHORIC_PATTERNS, raw)) hitsFound.push("euphoria_clash");
  if (frame.hungry && hits(SATED_PATTERNS, raw)) hitsFound.push("sated_clash");
  if (frame.strict && hits(LEISURE_PATTERNS, raw) && !option?.traumaVictim) hitsFound.push("leisure_in_crisis");
  if (frame.age < 7 && /課業、家務與街頭遊戲|學籍|院子裡仍有人/.test(raw)) hitsFound.push("school_tone");
  if (frame.age < 18 && /通緝與地下路徑|政治記錄讓這一週/.test(raw)) hitsFound.push("adult_path_tone");
  return hitsFound;
}

function optionSharesCrisis(option, frame) {
  if (!frame.crises.length) return true;
  if (option?.traumaVictim || option?.trauma || option?.worldEvent || option?.organic) return true;
  if (option?.fallback || option?.childTheme) return true;
  if (SURVIVAL_SITUATIONS.includes(option?.situation)) return true;
  const hooks = option?.hooks || [];
  const allowed = new Set();
  for (const crisis of frame.crises) {
    for (const hook of (CRISIS_HOOKS[crisis] || [])) allowed.add(hook);
  }
  if (hooks.some((hook) => allowed.has(hook))) return true;
  const text = corpusOf(option);
  if (frame.crises.includes("hunger") && /餓|饑|糧|鍋|碗|熱量/.test(text)) return true;
  if (frame.crises.includes("illness") && /燒|病|咳|藥|熱/.test(text)) return true;
  if (frame.crises.includes("war") && /戰|壕|警報|燈火|躲/.test(text)) return true;
  if (frame.crises.includes("confinement") && /門|屋裏|看家|鎖|炕/.test(text)) return true;
  return false;
}

function isLockedIncident(option) {
  return Boolean(
    option?.worldEvent
    || option?.schoolIncident
    || option?.adultIncident
    || option?.figureEncounter
    || option?.perpCasteEcology,
  );
}

export function semanticOptionAllowed(option, ctx = {}) {
  if (!option) return false;
  const frame = situationFrame(ctx);
  const text = corpusOf(option);
  const mismatches = scanSemanticMismatches(text, ctx, option);
  const hard = ["incoherent", "child_mature", "frail_motion", "euphoria_clash", "sated_clash"];
  if (hard.some((hit) => mismatches.includes(hit))) return false;
  if (isLockedIncident(option)) return true;
  if (mismatches.includes("leisure_in_crisis")) return false;
  if (frame.strict && !optionSharesCrisis(option, frame) && hits(LEISURE_PATTERNS, text)) return false;
  if (frame.strict && !optionSharesCrisis(option, frame) && /愛好|應酬|追求一段感情|入股|面試/.test(text)) return false;
  return true;
}

export function scrubSemanticText(raw, ctx = {}) {
  const text = String(raw || "");
  if (!text) return "";
  const parts = text.split(/([。！？\n])/);
  let out = "";
  for (let i = 0; i < parts.length; i += 2) {
    const sentence = parts[i] || "";
    const punct = parts[i + 1] || "";
    if (!sentence.trim()) {
      if (punct === "\n") out += "\n";
      continue;
    }
    if (scanSemanticMismatches(sentence, ctx).length) continue;
    out += sentence + (punct === "\n" ? "\n" : punct || "");
  }
  return out.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").replace(/^[ \n。]+|[ \n]+$/g, "").trim();
}
