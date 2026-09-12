/**
 * Dynamic Text Validation & Logic Filter.
 * Causality / common-sense scan + recent-shape variety guard.
 * Player-facing copy is reminted from live facts, never from sentence banks.
 */
import { situationFrame } from "./semantic-filter.js";
import { scanNarrativeFacts } from "./narrative-facts.js";
import { chronicleLineKey } from "./chronicle-key.js";
import { ensureTextHistory } from "./text-history.js";
import {
  ABSURD_CAUSE_PATTERNS,
  ADULT_ROLE_PATTERNS,
  INFANT_ROLE_PATTERNS,
  LUXURY_SPEND_PATTERNS,
  SCHOOLYARD_ONLY_PATTERNS,
  STRENUOUS_ACTION_PATTERNS,
} from "./data/logic-filter-rules.js";

function hits(patterns, text) {
  return (patterns || []).some((pattern) => pattern.test(text));
}

function factsOf(ctx = {}) {
  return ctx.narrativeFacts || scanNarrativeFacts(ctx);
}

function tagsOf(ctx = {}, facts = {}) {
  return facts.tags || ctx.tags || ctx.character?.tags || [];
}

function destituteOf(ctx = {}, facts = {}) {
  const tags = tagsOf(ctx, facts);
  return Boolean(
    facts.poor
    || facts.economy === "destitute"
    || Number(facts.means) < 22
    || tags.some((tag) => /socio_extreme_poverty|household_hungry|wealth_bankrupt|wealth_street/.test(String(tag)))
    || /bankrupt|destitute|indebted/.test(String(ctx.character?.wealth?.band || "")),
  );
}

function paralyzedOf(ctx = {}, facts = {}) {
  const tags = tagsOf(ctx, facts).join("\n");
  const frame = situationFrame(ctx);
  return frame.critical || /癱瘓|昏迷|起不了身/.test(tags);
}

export function sentenceShape(text) {
  const raw = String(text || "").replace(/\s/g, "");
  if (!raw) return "";
  const opener = /^(去|把|不|帶|躺|替|先|向|趁|門|手|回|拉|問)/.exec(raw)?.[1] || raw.slice(0, 1);
  return `${opener}${raw.includes("，") ? "c" : "b"}`;
}

export function lexemeBag(text) {
  const han = String(text || "").replace(/[^\u4e00-\u9fff]/g, "");
  const out = [];
  for (let i = 0; i < han.length - 1; i += 1) out.push(han.slice(i, i + 2));
  return out;
}

function stemsTooClose(left, right) {
  const a = chronicleLineKey(left);
  const b = chronicleLineKey(right);
  if (!a || !b) return false;
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (shorter.length >= 8 && longer.includes(shorter)) return true;
  let prefix = 0;
  while (prefix < shorter.length && shorter[prefix] === longer[prefix]) prefix += 1;
  return prefix >= 10;
}

export function scanLogicFaults(text, ctx = {}) {
  const raw = String(text || "").trim();
  const faults = [];
  if (!raw) return ["empty"];
  const facts = factsOf(ctx);
  ctx.narrativeFacts = facts;
  const frame = situationFrame(ctx);
  const age = Number(facts.age ?? frame.age ?? 0);
  const health = Number(facts.health ?? frame.health ?? 50);

  if ((frame.frail || frame.critical || paralyzedOf(ctx, facts) || health <= 28)
    && hits(STRENUOUS_ACTION_PATTERNS, raw)) {
    faults.push("frail_exertion");
  }
  if ((frame.critical || paralyzedOf(ctx, facts) || health <= 12)
    && /上工|工位|汽笛|扛|連搬|趕路/.test(raw)) {
    faults.push("frail_exertion");
  }
  if (destituteOf(ctx, facts) && hits(LUXURY_SPEND_PATTERNS, raw)) {
    faults.push("destitute_luxury");
  }
  if (age <= 12 && hits(ADULT_ROLE_PATTERNS, raw)) faults.push("age_role");
  if (age < 7 && hits(INFANT_ROLE_PATTERNS, raw)) faults.push("age_role");
  if (age >= 20 && hits(SCHOOLYARD_ONLY_PATTERNS, raw)) faults.push("age_role");
  if (age < 16 && /當兵入伍/.test(raw)) faults.push("age_role");
  if ((facts.classId === "peasant" || facts.classId === "worker")
    && /交易所|入股|轎車|豪宅/.test(raw)) {
    faults.push("identity_clash");
  }
  if (hits(ABSURD_CAUSE_PATTERNS, raw)) faults.push("absurd_cause");
  return faults;
}

export function scanVarietyFaults(text, ctx = {}, extras = {}) {
  const raw = String(text || "").trim();
  const faults = [];
  if (!raw) return ["empty"];
  const who = extras.character || ctx.character;
  const hist = who ? ensureTextHistory(who) : null;
  const recent = [...(hist?.stems || []), ...(hist?.choices || [])];
  const mine = lexemeBag(raw);
  if (mine.length >= 6 && recent.length) {
    const bag = new Set(recent.flatMap(lexemeBag));
    const hit = mine.filter((tok) => bag.has(tok)).length;
    if (hit >= Math.max(5, Math.floor(mine.length * 0.55))) faults.push("stale_lex");
  }
  const used = extras.usedLines || [];
  if (used.some((row) => stemsTooClose(row, raw))) faults.push("sibling_dup");
  const shapes = extras.usedShapes || used.map(sentenceShape);
  if (used.length && shapes.includes(sentenceShape(raw))) faults.push("stale_shape");
  return faults;
}

export function filterPublicLine(text, ctx = {}, extras = {}) {
  const raw = String(text || "").trim();
  const reasons = [];
  if (!raw) return { ok: false, reasons: ["empty"], text: raw, shape: "" };
  reasons.push(...scanLogicFaults(raw, ctx));
  if (!extras.skipVariety) reasons.push(...scanVarietyFaults(raw, ctx, extras));
  return {
    ok: !reasons.length,
    reasons,
    text: raw,
    shape: sentenceShape(raw),
  };
}

export function pickLiveChoiceLane(ctx = {}, index = 0) {
  const facts = factsOf(ctx);
  ctx.narrativeFacts = facts;
  const health = Number(facts.health ?? 50);
  const age = Number(facts.age ?? 0);
  const fever = Boolean(facts.fever) || health <= 28;
  const hungry = Boolean(facts.hungry);
  const poor = destituteOf(ctx, facts);
  const lanes = [];
  if (fever || paralyzedOf(ctx, facts)) {
    lanes.push(
      { kind: "illness", dir: "endure" },
      { kind: "illness", dir: "guard" },
      { kind: "family", dir: "help" },
    );
  } else if (age < 7) {
    lanes.push(
      { kind: "family", dir: "help" },
      { kind: "family", dir: "guard" },
      { kind: "hunger", dir: "guard" },
      { kind: "family", dir: "resist" },
      { kind: "hunger", dir: "seek" },
    );
  } else if (hungry) {
    lanes.push(
      { kind: "hunger", dir: "seek" },
      { kind: "hunger", dir: "guard" },
      { kind: "money", dir: "resist" },
    );
  } else if (poor) {
    lanes.push(
      { kind: "money", dir: "guard" },
      { kind: "labor", dir: "endure" },
      { kind: "family", dir: "help" },
    );
  } else if (age <= 12) {
    lanes.push(
      { kind: "family", dir: "seek" },
      { kind: "hunger", dir: "help" },
      { kind: "family", dir: "resist" },
    );
  } else {
    lanes.push(
      { kind: "labor", dir: "endure" },
      { kind: "family", dir: "seek" },
      { kind: "money", dir: "resist" },
    );
  }
  const slot = Math.abs(Number(index || 0) + Number(facts.year || 0) + age) % lanes.length;
  return lanes[slot];
}

export function composeLiveAnchor(facts = {}, index = 0) {
  const year = Number(facts.year) || "";
  const place = facts.place || facts.city || "此地";
  const housing = facts.housing || "屋裏";
  const age = Number(facts.age);
  const who = Number.isFinite(age) ? `${age}歲` : "";
  const weak = Number(facts.health) <= 28;
  const act = weak ? "先把力氣留給下一頓" : `先從${housing}過這兩週`;
  const head = [year && `${year}年`, place, who].filter(Boolean).join("，");
  return `${head}。${act}。`.replace(/。{2,}/g, "。");
}
