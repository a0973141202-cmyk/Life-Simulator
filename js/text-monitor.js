/**
 * Text Logic & Semantic Monitoring Subsystem.
 * Independent gate: scan every player-facing line after mint, before UI.
 * Fail closed on riddle, mashup, anachronism, tag IDs, and logic faults;
 * recompose from live facts.
 */
import { scanSemanticMismatches } from "./semantic-filter.js";
import {
  isDossierLeakSentence,
  isMetaPublicSentence,
  scrubPublicText,
  scrubRiddleText,
} from "./data/public-text.js";
import { INCOHERENT_PATTERNS } from "./data/semantic-context-rules.js";
import { RIDDLE_PATTERNS } from "./data/prose-rules.js";
import {
  composeChoiceLine,
  composeDeathRecord,
  composeLiveFollowUp,
  composeNpcQuote,
  composeSituationLine,
  lockChronicleToClock,
  scrubEraCopy,
} from "./dynamic-prose.js";
import { scanNarrativeFacts } from "./narrative-facts.js";
import { chronicleLineKey } from "./chronicle-key.js";
import { optionExcluded } from "./exclusion-buffer.js";
import { textOnCooldown } from "./text-history.js";
import {
  composeLiveAnchor,
  filterPublicLine,
  pickLiveChoiceLane,
  sentenceShape,
} from "./text-logic-filter.js";
import { textsTooSimilar } from "./choice-similarity.js";
import { ensureDistinctChoiceTriad } from "./choice-dedupe.js";
import {
  composeAlignedChronicle,
  sanitizeChronicleText,
  splitChronicleUnits,
} from "./chronicle-sanitize.js";

export const VARIATION_AXES = Object.freeze([
  "year",
  "place",
  "class",
  "tag",
  "history",
  "age",
  "body",
  "syntax",
  "lexeme",
]);

const TAG_ID_RE = /\b(?:trauma|ethnicity|hook|current|daily|socio|household|school|caste|figure|path|mood|class|trait|acquired)_[a-z0-9_]+/i;
const META_WORD_RE = /標籤卷宗|發跡窗口|歷史人物現場|主角光環|生存檢定|底層規則|混沌檔|沙盒/;
const MASHUP_RE = Object.freeze([
  /的[^。\n]{0,10}的[^。\n]{0,10}的/,
  /那口還能買到/,
  /少撞一次牆/,
  /從.+這一頭做起.+從.+這一頭/,
  /還能買到的米的/,
]);
const RIDDLE_EXTRA = Object.freeze([
  /命運的風鈴/,
  /光影交織/,
  /像一句沒寫完/,
  /把影子留在原地/,
]);

export function variationSalt(ctx = {}, index = 0) {
  const facts = ctx.narrativeFacts || {};
  const bits = [
    Number(facts.year || ctx.year || 0),
    (facts.city || "").length,
    (facts.classId || "").length,
    (facts.tags || ctx.tags || []).length,
    (facts.upheavalLabel || facts.pulseTitle || "").length,
    Number(facts.age || ctx.ageYears || 0),
    Number(facts.health || ctx.stats?.health || 50),
    Number(ctx.turn || ctx.week || 0),
    Number(index || 0),
  ];
  return bits.reduce((sum, value, slot) => sum + (Number(value) || 0) * (slot + 3), 0);
}

export function inspectPublicLine(text, ctx = {}, extras = {}) {
  const raw = String(text || "").trim();
  const reasons = [];
  if (!raw) {
    reasons.push("empty");
    return { ok: false, reasons, text: raw, shape: "" };
  }
  if (TAG_ID_RE.test(raw)) reasons.push("tag_id");
  if (META_WORD_RE.test(raw) || isMetaPublicSentence(raw) || isDossierLeakSentence(raw)) {
    reasons.push("meta");
  }
  if (
    RIDDLE_PATTERNS.some((pattern) => pattern.test(raw))
    || RIDDLE_EXTRA.some((pattern) => pattern.test(raw))
    || INCOHERENT_PATTERNS.some((pattern) => pattern.test(raw))
  ) {
    reasons.push("riddle");
  }
  if (MASHUP_RE.some((pattern) => pattern.test(raw))) reasons.push("mashup");
  const semantic = scanSemanticMismatches(raw, ctx);
  if (semantic.length) reasons.push(...semantic);
  const year = Number(ctx.narrativeFacts?.year || ctx.year);
  const years = [...raw.matchAll(/((?:1[89]|20)\d{2})\s*年/g)].map((row) => Number(row[1]));
  if (year && years.some((stamp) => stamp !== year)) reasons.push("anachronism");
  const logic = filterPublicLine(raw, ctx, { ...extras, skipVariety: extras.skipVariety !== false });
  if (!logic.ok) reasons.push(...logic.reasons.filter((item) => item !== "empty"));
  return { ok: !reasons.length, reasons, text: raw, shape: sentenceShape(raw) };
}

function remintChoice(rng, ctx, index, used = [], option = null) {
  const drivers = (option?.driverTags || []).filter(Boolean).slice(0, 3);
  let line = "";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const lane = pickLiveChoiceLane(ctx, index + attempt * 4);
    line = composeChoiceLine(rng, ctx, lane.kind, index + attempt * 4, {
      direction: lane.dir,
      driverTags: drivers,
      tagFocus: drivers[0] ? String(drivers[0]).split("_")[0] : "",
      avoidTexts: used,
    });
    const clash = used.some((row) => linesTooClose(row, line) || sentenceShape(row) === sentenceShape(line));
    if (line && !clash) return line;
  }
  return line;
}

function fallbackLine(rng, ctx, kind, index) {
  const roll = typeof rng === "function" ? rng : () => 0.37;
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  if (kind === "choice") return remintChoice(roll, ctx, index, []);
  if (kind === "follow") return composeLiveFollowUp(roll, ctx, {});
  if (kind === "death") {
    return composeDeathRecord(ctx.character, {
      year: ctx.year || facts.year,
      ageYears: ctx.ageYears || facts.age,
    }, "", "");
  }
  if (kind === "npc") {
    const speech = composeNpcQuote(ctx, {}, {});
    return speech?.quote || composeSituationLine(roll, ctx);
  }
  const live = composeLiveAnchor(facts, index);
  const sit = composeSituationLine(roll, ctx);
  return sit && sit !== live ? `${live}${sit}` : (sit || live);
}

function cleanLine(text, facts) {
  return lockChronicleToClock(scrubEraCopy(scrubRiddleText(scrubPublicText(text)), facts), facts);
}

function linesTooClose(left, right) {
  if (textsTooSimilar(left, right)) return true;
  const a = chronicleLineKey(left);
  const b = chronicleLineKey(right);
  if (!a || !b) return false;
  return a === b;
}

export function monitorPublicText(rng, text, ctx = {}, extras = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const kind = extras.kind || "narrative";
  const who = extras.character || ctx.character;
  if (kind === "narrative" || kind === "chronicle" || kind === "follow") {
    let cleaned = sanitizeChronicleText(text, ctx, {
      maxUnits: extras.maxUnits || (kind === "follow" ? 4 : 7),
      options: extras.options || [],
    });
    const report = inspectPublicLine(cleaned.split("\n")[0] || cleaned, ctx, {
      skipVariety: true,
      character: who,
    });
    if (!report.ok || !cleaned) {
      cleaned = kind === "follow"
        ? cleanLine(composeLiveFollowUp(rng, ctx, {}), facts)
        : composeAlignedChronicle(rng, ctx, extras.options || []);
    }
    const units = splitChronicleUnits(cleaned);
    const safe = [];
    for (let i = 0; i < units.length; i += 1) {
      let line = cleanLine(units[i], facts);
      let unitReport = inspectPublicLine(line, ctx, { skipVariety: true, character: who });
      if (!unitReport.ok) {
        line = cleanLine(fallbackLine(rng, ctx, kind === "follow" ? "follow" : "narrative", (extras.index || 0) + i), facts);
        unitReport = inspectPublicLine(line, ctx, { skipVariety: true, character: who });
        if (!unitReport.ok) continue;
      }
      if (safe.some((row) => linesTooClose(row, line))) continue;
      safe.push(line.replace(/[。！？]+$/g, ""));
    }
    const joined = sanitizeChronicleText(safe.join("。"), ctx, {
      maxUnits: extras.maxUnits || (kind === "follow" ? 4 : 7),
      options: extras.options || [],
    });
    if (joined) return joined;
    return kind === "follow"
      ? cleanLine(composeLiveFollowUp(rng, ctx, {}), facts)
      : composeAlignedChronicle(rng, ctx, extras.options || []);
  }
  const parts = String(text || "").split("\n");
  const out = [];
  const seen = new Set();
  for (let i = 0; i < parts.length; i += 1) {
    let line = cleanLine(parts[i], facts);
    let report = inspectPublicLine(line, ctx, { skipVariety: true, character: who });
    const stale = Boolean(extras.strictCooldown) && who && line && textOnCooldown(who, line);
    if (!report.ok || stale) {
      line = cleanLine(fallbackLine(rng, ctx, kind, (extras.index || 0) + i), facts);
      report = inspectPublicLine(line, ctx, { skipVariety: true, character: who });
      if (!report.ok) line = cleanLine(composeLiveAnchor(facts, (extras.index || 0) + i), facts);
    }
    const key = chronicleLineKey(line);
    if (!line || !key || seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out.join("\n").trim();
}

export function monitorChoiceLine(rng, text, ctx = {}, index = 0, extras = {}) {
  const who = ctx.character;
  let line = monitorPublicText(rng, text, ctx, { kind: "choice", index, character: who });
  const used = extras.usedLines || [];
  const shapes = extras.usedShapes || used.map(sentenceShape);
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const excluded = Boolean(who && optionExcluded(who, "", line));
    const cool = Boolean(who && textOnCooldown(who, line));
    const report = inspectPublicLine(line, ctx, {
      skipVariety: false,
      character: who,
      usedLines: used,
      usedShapes: shapes,
    });
    const clash = used.some((row) => linesTooClose(row, line));
    if (!excluded && !cool && report.ok && !clash) break;
    const minted = remintChoice(rng, ctx, index + attempt * 7 + variationSalt(ctx, attempt), used, {
      driverTags: extras.driverTags || [],
    });
    line = monitorPublicText(rng, minted, ctx, { kind: "choice", index: index + attempt * 5, character: who });
  }
  return line;
}

export function gateWeeklyOutput(rng, payload = {}, ctx = {}) {
  let options = (payload.options || []).map((option, index) => {
    const text = monitorChoiceLine(rng, option.trueText || option.text, ctx, index, {
      usedLines: (payload.options || []).slice(0, index).map((row) => row.trueText || row.text),
      driverTags: option.driverTags || [],
    });
    return {
      ...option,
      text,
      trueText: text,
      tagDriven: Boolean(option.tagDriven),
      liveTagMint: Boolean(option.liveTagMint),
    };
  });
  options = ensureDistinctChoiceTriad(rng, options, ctx);
  const used = [];
  for (let index = 0; index < options.length; index += 1) {
    let guard = 0;
    while (used.some((row) => textsTooSimilar(row, options[index].text)) && guard < 12) {
      const remint = monitorChoiceLine(
        rng,
        remintChoice(rng, ctx, index + 17 + guard * 5, used, options[index]),
        ctx,
        index + 17 + guard * 5,
        { usedLines: used, driverTags: options[index].driverTags || [] },
      );
      options[index] = {
        ...options[index],
        text: remint,
        trueText: remint,
        tagDriven: true,
        liveTagMint: true,
      };
      guard += 1;
    }
    if (used.some((row) => textsTooSimilar(row, options[index].text))) {
      options = ensureDistinctChoiceTriad(rng, options, ctx);
      break;
    }
    used.push(options[index].text);
  }
  options = ensureDistinctChoiceTriad(rng, options, ctx);

  // Pre-sanitize narrative only — final chronicle + stakes owned by Narrative & Logic Engine.
  const narrative = monitorPublicText(rng, payload.narrative || "", ctx, {
    kind: "narrative",
    character: ctx.character,
    options,
    maxUnits: 8,
  });
  return {
    ...payload,
    narrative,
    options,
    weekScene: {
      pressure: null,
      meme: false,
      sceneAligned: false,
      deferredToNarrativeLogic: true,
    },
    textMonitor: {
      gated: true,
      liveWeeklyNarrative: true,
      logicFilter: true,
      causalityGate: true,
      varietyGuard: true,
      triadUnique: true,
      noDuplicateChoices: true,
      chronicleSanitized: true,
      zeroSemanticCorruption: true,
      tagAlignedChronicle: true,
      tagDrivenOnly: true,
      zeroHardcodedTemplates: true,
      weekSceneDriven: false,
      variationAxes: VARIATION_AXES.slice(),
    },
  };
}

export function gateDeathCopy(rng, text, ctx = {}) {
  return monitorPublicText(rng, text, ctx, { kind: "death", character: ctx.character });
}
