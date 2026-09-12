/**
 * Strict Boundary Enforcement.
 * Fail closed: if an option cannot be proven safe, it never reaches the player.
 */

import {
  ADULT_ONLY_DOMAINS,
  ADULT_SANDBOX_AGE,
  BOUNDARY_BLOCK_MESSAGE,
  MINOR_PROTECT_AGE,
  REDLINE_FLAGS,
  REDLINE_PATTERNS,
  TEEN_GRAY_AGE,
} from "./data/boundary-rules.js";
import { contentAllowedForAge } from "./age-gate.js";
import { semanticOptionAllowed } from "./semantic-filter.js";
import { SEXUAL_MINOR_PATTERNS } from "./data/trauma-writing-rules.js";
import {
  PERP_CASTE_ROMANTICIZE_PATTERNS,
  SEXUAL_MINOR_ACT_PATTERNS,
} from "./data/perp-caste-rules.js";

function corpusOf(action) {
  const bits = [
    action?.id,
    action?.text,
    action?.risk?.text,
    action?.attempt?.kind,
    ...(action?.followUps || []),
    ...(action?.addTags || []),
    ...(action?.hooks || []),
    action?.domain,
    action?.path,
    action?.traumaVictim ? "trauma_victim" : "",
    action?.schoolPeerHarm ? "school_peer_harm" : "",
    action?.schoolIncident ? "school_incident" : "",
    action?.worldEvent ? "world_event" : "",
    action?.perpCasteEcology ? "perp_caste_ecology" : "",
  ];
  return bits.filter(Boolean).join("\n");
}

export function scanSexualMinorText(text) {
  if (!text) return null;
  for (const pattern of SEXUAL_MINOR_PATTERNS) {
    if (pattern.test(text)) return { matched: String(pattern), snippet: text.slice(0, 160) };
  }
  return null;
}

export function scanSexualMinorActs(text) {
  if (!text) return null;
  for (const pattern of SEXUAL_MINOR_ACT_PATTERNS) {
    if (pattern.test(text)) return { matched: String(pattern), snippet: text.slice(0, 160) };
  }
  return null;
}

export function scanPerpRomanticize(text) {
  if (!text) return null;
  for (const pattern of PERP_CASTE_ROMANTICIZE_PATTERNS) {
    if (pattern.test(text)) return { matched: String(pattern), snippet: text.slice(0, 160) };
  }
  return null;
}

export function scanRedlineText(text) {
  if (!text) return null;
  for (const pattern of REDLINE_PATTERNS) {
    if (pattern.test(text)) return { matched: String(pattern), snippet: text.slice(0, 160) };
  }
  return null;
}

function flagsOf(action) {
  const listed = action?.flags || action?.redlineFlags || [];
  const extra = [];
  if (action?.harmsMinors || action?.exploitsMinors) extra.push("harms_minors");
  if (action?.redline) extra.push(String(action.redline));
  return [...listed, ...extra];
}

function minAgeOf(action) {
  const age = action?.when?.age;
  if (Array.isArray(age) && typeof age[0] === "number") return age[0];
  return null;
}

function isAdultDomain(action) {
  const domain = action?.domain || action?.path;
  if (!domain) return Boolean(action?.sandbox || action?.crisis);
  return ADULT_ONLY_DOMAINS.includes(domain);
}

/**
 * @returns {{ blocked: boolean, reason?: string, message?: string }}
 */
export function evaluateBoundary(action, ctx = {}) {
  if (!action) {
    return { blocked: true, reason: "missing_action", message: BOUNDARY_BLOCK_MESSAGE };
  }

  const flags = flagsOf(action);
  if (flags.some((flag) => REDLINE_FLAGS.includes(flag))) {
    return { blocked: true, reason: "redline_flag", message: BOUNDARY_BLOCK_MESSAGE };
  }

  const corpus = corpusOf(action);
  const actHit = scanSexualMinorActs(corpus);
  if (actHit) {
    return { blocked: true, reason: "sexual_minor_act", message: BOUNDARY_BLOCK_MESSAGE, hit: actHit };
  }

  const casteLens = Boolean(action.perpCasteEcology && action.noSexualMinorActs !== false);
  if (!casteLens) {
    const sexualHit = scanSexualMinorText(corpus);
    if (sexualHit) {
      return { blocked: true, reason: "sexual_minor", message: BOUNDARY_BLOCK_MESSAGE, hit: sexualHit };
    }
  } else {
    const rom = scanPerpRomanticize(corpus);
    if (rom) {
      return { blocked: true, reason: "perp_romanticize", message: BOUNDARY_BLOCK_MESSAGE, hit: rom };
    }
  }

  const victimLens = Boolean(action.traumaVictim && action.traumaNonsexual !== false);
  const schoolPeer = Boolean(action.schoolPeerHarm && action.schoolNonsexual !== false);
  const worldLens = Boolean(action.worldEvent && action.worldNonsexual !== false);
  const figureLens = Boolean(action.figureEncounter && action.figureNonsexual !== false);
  if (!victimLens && !schoolPeer && !casteLens && !worldLens && !figureLens) {
    const hit = scanRedlineText(corpus);
    if (hit) {
      return { blocked: true, reason: "redline_pattern", message: BOUNDARY_BLOCK_MESSAGE, hit };
    }
  }

  const age = ctx.ageYears ?? ctx.character?.ageYears ?? 0;
  if (!contentAllowedForAge(action, ctx)) {
    return { blocked: true, reason: "age_lane", message: BOUNDARY_BLOCK_MESSAGE };
  }
  const minAge = minAgeOf(action);

  if (figureLens && minAge != null && age < minAge) {
    return { blocked: true, reason: "figure_too_young", message: BOUNDARY_BLOCK_MESSAGE };
  }

  if (casteLens) {
    if (age < ADULT_SANDBOX_AGE) {
      return { blocked: true, reason: "caste_ecology_under_18", message: BOUNDARY_BLOCK_MESSAGE };
    }
    if (minAge != null && minAge < ADULT_SANDBOX_AGE) {
      return { blocked: true, reason: "caste_ecology_min_age", message: BOUNDARY_BLOCK_MESSAGE };
    }
  }

  if (!worldLens && (action.sandbox || action.crisis || isAdultDomain(action)) && minAge == null) {
    return { blocked: true, reason: "sandbox_missing_age", message: BOUNDARY_BLOCK_MESSAGE };
  }

  if (!worldLens && !figureLens && isAdultDomain(action) && minAge != null && minAge < TEEN_GRAY_AGE) {
    return { blocked: true, reason: "adult_domain_too_young", message: BOUNDARY_BLOCK_MESSAGE };
  }

  const hardAdult = ["narcotics", "militant", "terror", "historical", "sexual"].includes(action.domain || action.path);
  if (!worldLens && hardAdult && minAge != null && minAge < ADULT_SANDBOX_AGE) {
    return { blocked: true, reason: "hard_adult_under_18", message: BOUNDARY_BLOCK_MESSAGE };
  }

  if (age < MINOR_PROTECT_AGE) {
    if (!worldLens && !figureLens && (action.sandbox || action.crisis || isAdultDomain(action))) {
      return { blocked: true, reason: "player_under_12_adult_content", message: BOUNDARY_BLOCK_MESSAGE };
    }
    if (minAge != null && minAge >= MINOR_PROTECT_AGE) {
      return { blocked: true, reason: "option_not_for_minors", message: BOUNDARY_BLOCK_MESSAGE };
    }
  }

  if (!worldLens && age < ADULT_SANDBOX_AGE && hardAdult) {
    return { blocked: true, reason: "player_under_18_hard_path", message: BOUNDARY_BLOCK_MESSAGE };
  }

  if (!semanticOptionAllowed(action, ctx)) {
    return { blocked: true, reason: "semantic_context", message: BOUNDARY_BLOCK_MESSAGE };
  }

  return { blocked: false };
}

export function isActionAllowed(action, ctx) {
  return !evaluateBoundary(action, ctx).blocked;
}

export function filterActionsByBoundary(actions, ctx) {
  const kept = [];
  const blocked = [];
  for (const action of actions || []) {
    const verdict = evaluateBoundary(action, ctx);
    if (verdict.blocked) blocked.push({ id: action?.id, reason: verdict.reason });
    else kept.push(action);
  }
  return { kept, blocked };
}

export function interceptUnsafeOption(option, ctx) {
  const verdict = evaluateBoundary(option, ctx);
  if (!verdict.blocked) return null;
  return {
    ok: false,
    error: "boundary_blocked",
    reason: verdict.reason,
    message: verdict.message || BOUNDARY_BLOCK_MESSAGE,
  };
}

export {
  ADULT_ONLY_DOMAINS,
  ADULT_SANDBOX_AGE,
  BOUNDARY_BLOCK_MESSAGE,
  MINOR_PROTECT_AGE,
  TEEN_GRAY_AGE,
};
