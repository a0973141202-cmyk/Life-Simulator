/**
 * Narrative & Logic Engine — single authority for weekly chronicle + triad.
 *
 * Iron rules (1920–2025 Life Simulator):
 * 1. Era density: text must carry historical / social pressure for the year.
 * 2. Meme legends (Ricardo / Billy / Tadokoro @ 24): voice must match preset soul.
 * 3. Age lock: adults / meme starts never get childhood household options.
 * 4. No loop: exclusion + weekEntropy + uniqueness — consecutive turns must diverge.
 *
 * Public API:
 *   generateNarrativeAndOptions(rng, playerState)
 *   finalizeWeeklyOutput(rng, ctx, payload)  — used by generateTurn
 */
import { scrubPublicText } from "./data/public-text.js";
import {
  MATURE_ADULT_MIN,
  MATURE_BANNED_CHILD_VOICE,
} from "./data/age-gate-rules.js";
import { isMemeLegendCharacter } from "./meme-chronicle.js";
import { scanNarrativeFacts } from "./narrative-facts.js";
import { composeWeekScene, applySceneStakesToOptions } from "./week-scene.js";
import { optionExcluded } from "./exclusion-buffer.js";
import { textOnCooldown } from "./text-history.js";
import { textsTooSimilar } from "./choice-similarity.js";

const COST_MARK = /代價|換來|寧可|卻|賭|先於|換/;
const CHILD_EXTRA = Object.freeze([
  /門栓|看門|弟妹|大人喊|最小的那碗|打水|洗碗|捉迷藏|書包|戒尺|學步|玩伴/,
  /屋裏的口令|不許開門|不許玩火|孩子王|先生點/,
]);

const ADULT_SAFE_BANK = Object.freeze([
  "去把這兩週還能換成工錢或人情的路走完——代價是可能把僅剩的體面押進去",
  "先守住飯錢與門面，不把底牌一次交出去——代價是錯過一次暴利的空窗",
  "不按旁人口令交名字或底牌——代價是被記一筆，卻留住主動",
  "先離開還在綁著你的班表或門戶——代價是短期斷炊，換長期不被掐死",
  "把這兩週的班先扛完再說話——代價是眼前的傷，換下期還能上工",
  "手裂了仍把活交上去——代價是傷與累，換來不被扣工錢",
]);

const MEME_SAFE = Object.freeze({
  ricardo_milos: [
    "把巴西森巴踩進街頭，用掌聲與小費換口糧——代價是規矩與工牌都先擱下",
    "不拿絕對自由換一時班表——代價是少賺，卻守住自己的節奏",
    "規矩一緊就華麗轉身離開——代價是舞台空一拍，卻不被扣住",
  ],
  billy_herrington: [
    "把力氣押進還認摔角與鐵杠的那條路——代價是透支身子，換掌聲與人情",
    "以兄貴氣度先把同伴從低谷拉起——代價是工錢後算，卻換來義氣帳",
    "先離開還在綁死你的場次或班表——代價是短期斷炊，卻不被這一局掐死",
  ],
  tadokoro_koji: [
    "憑野獸先輩的直覺找活路——代價是惡名上身，卻不把命押死在班表上",
    "按下北澤打工節奏搏薪水與怪事——代價是罰金與傳聞一起漲",
    "惡臭傳聞與罰金一起忍，把夜班熬完——代價是名聲更臭，錢包稍穩",
  ],
});

function roll01(rng) {
  return typeof rng === "function" ? rng() : Math.random();
}

function ageOf(ctx = {}, state = {}) {
  const n = Number(
    ctx.ageYears
    ?? ctx.narrativeFacts?.age
    ?? state.ageYears
    ?? state.time?.ageYears
    ?? ctx.character?.ageYears
    ?? 0,
  );
  return Number.isFinite(n) ? n : 0;
}

function isAdultVoice(ctx = {}, state = {}) {
  if (isMemeLegendCharacter(ctx.character || state.character)) return true;
  return ageOf(ctx, state) >= MATURE_ADULT_MIN;
}

function hasChildVoice(text = "") {
  const raw = String(text || "");
  if (!raw) return false;
  if (MATURE_BANNED_CHILD_VOICE.some((re) => re.test(raw))) return true;
  return CHILD_EXTRA.some((re) => re.test(raw));
}

function ensureCostClause(text = "", salt = 0) {
  let line = scrubPublicText(String(text || "").trim());
  if (!line) return "";
  if (!COST_MARK.test(line)) {
    const tails = [
      "代價是這兩週的主動權",
      "代價是眼前的傷與名聲",
      "代價是可能把僅剩的體面押進去",
      "代價是慢，卻少翻車",
    ];
    line = `${line.replace(/[。！？，、]+$/g, "")}——${tails[Math.abs(salt) % tails.length]}`;
  }
  return line;
}

function adultSafeLine(ctx = {}, index = 0, salt = 0) {
  const preset = ctx.character?.specialPresetId;
  const bank = (preset && MEME_SAFE[preset]) || ADULT_SAFE_BANK;
  const pick = bank[(index + salt) % bank.length];
  return ensureCostClause(pick, salt + index);
}

function lineBlocked(character, id, text, used = []) {
  if (!text || text.length < 8) return true;
  if (used.some((row) => row === text || textsTooSimilar(row, text))) return true;
  if (character && optionExcluded(character, id, text)) return true;
  if (character && textOnCooldown(character, text)) return true;
  return false;
}

/**
 * Strip childhood / soft-lock copy for adult & meme runs; force cost clauses;
 * ensure three mutually distinct complete sentences.
 */
export function enforceVoiceAndStakes(rng, options = [], ctx = {}) {
  const adult = isAdultVoice(ctx);
  const character = ctx.character || null;
  const salt = Math.floor(
    (Number(ctx.weekEntropy || 0) * 997)
    + (Number(ctx.turnCount || 0) * 13)
    + (Number(ctx.year || ctx.time?.year || 0) % 97),
  );
  const used = [];
  return [0, 1, 2].map((index) => {
    const row = options[index] || {};
    let text = scrubPublicText(String(row.trueText || row.text || "").trim());
    const id = row.id || `nle_${index}_${salt}`;

    if (adult && hasChildVoice(text)) {
      text = adultSafeLine(ctx, index, salt);
    }
    text = ensureCostClause(text, salt + index);

    let guard = 0;
    while (lineBlocked(character, id, text, used) && guard < 8) {
      text = ensureCostClause(adultSafeLine(ctx, index + guard + 1, salt + guard * 3), salt + guard);
      guard += 1;
    }
    if (lineBlocked(character, id, text, used)) {
      text = ensureCostClause(
        `${adultSafeLine(ctx, index, salt)}（第${(salt + index) % 9}局）`,
        salt,
      );
    }
    used.push(text);
    return {
      ...row,
      index,
      id,
      text,
      trueText: text,
      narrativeEngine: true,
      adultVoice: adult,
      childVoiceBlocked: adult && hasChildVoice(String(row.text || "")),
    };
  });
}

/**
 * Structural seal for UI: always 3 options with index/text/trueText; non-empty narrative.
 */
export function sealNarrativePayload(payload = {}, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const year = facts.year || ctx.year || ctx.time?.year || "";
  const place = facts.place || facts.city || "此地";
  let narrative = scrubPublicText(String(payload.narrative || "").trim());
  if (!narrative || narrative.length < 12) {
    narrative = `${year}年，${place}。這兩週先把眼前的帳結清，再談下一步。`;
  }
  if (!/[。！？]$/.test(narrative)) narrative = `${narrative}。`;

  const options = enforceVoiceAndStakes(
    () => Math.random(),
    payload.options || [],
    ctx,
  );

  return {
    narrative,
    options,
    ok: true,
    engine: "narrative-logic",
    pressure: payload.pressure || null,
    meme: Boolean(payload.meme || isMemeLegendCharacter(ctx.character)),
    ageYears: ageOf(ctx),
    weekEntropy: Number(ctx.weekEntropy) || null,
    turnCount: Number(ctx.turnCount) || 0,
    validation: {
      optionCount: options.length,
      allHaveCost: options.every((row) => COST_MARK.test(row.text || "")),
      noChildVoiceOnAdult: !isAdultVoice(ctx)
        || options.every((row) => !hasChildVoice(row.text || "")),
      distinct: new Set(options.map((row) => row.text)).size === 3,
    },
  };
}

/**
 * Final weekly authority: one scene → stakes → voice lock → structure seal.
 * Call after pool mint / gate / sealPlayableTriad.
 */
export function finalizeWeeklyOutput(rng, ctx = {}, payload = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;

  const sealedIn = (payload.options || []).slice(0, 3);
  const scene = composeWeekScene(rng, ctx, sealedIn);
  let options = applySceneStakesToOptions(sealedIn, scene, ctx);
  options = enforceVoiceAndStakes(rng, options, ctx);

  let narrative = scrubPublicText(String(scene.chronicle || payload.narrative || "").trim());
  if (narrative && !/[。！？]$/.test(narrative)) narrative = `${narrative}。`;

  const sealed = sealNarrativePayload({
    narrative,
    options,
    pressure: scene.pressure,
    meme: scene.meme,
  }, ctx);

  return {
    ...payload,
    narrative: sealed.narrative,
    options: sealed.options,
    weekScene: {
      pressure: scene.pressure,
      meme: scene.meme,
      sceneAligned: true,
      engine: "narrative-logic",
    },
    narrativeLogic: sealed.validation,
  };
}

/**
 * High-level entry: playerState → { narrative, options[3], meta }.
 * playerState may be a full engine ctx or { character, time, options, rng, ... }.
 */
export function generateNarrativeAndOptions(rngOrState, maybeState = null) {
  const hasRngFirst = typeof rngOrState === "function";
  const rng = hasRngFirst ? rngOrState : (maybeState?.rng || Math.random);
  const state = hasRngFirst ? (maybeState || {}) : (rngOrState || {});
  const character = state.character || state;
  const time = state.time || {
    year: state.year,
    ageYears: state.ageYears ?? character?.ageYears,
  };
  const ctx = {
    ...state,
    character,
    time,
    year: time.year ?? state.year,
    ageYears: time.ageYears ?? state.ageYears,
    turnCount: Number(state.turnCount) || 0,
    weekEntropy: Number.isFinite(Number(state.weekEntropy))
      ? Number(state.weekEntropy)
      : (
        ((Number(state.turnCount) || 0) * 0.137)
        + ((Number(time.year) || 0) * 0.011)
        + ((Number(time.ageYears) || 0) * 0.071)
        + roll01(rng)
      ) % 1,
  };
  ctx.narrativeFacts = scanNarrativeFacts(ctx);

  const draftOptions = Array.isArray(state.options) ? state.options : [];
  const finalized = finalizeWeeklyOutput(rng, ctx, {
    narrative: state.narrative || state.rawNarrative || "",
    options: draftOptions,
  });

  return {
    narrative: finalized.narrative,
    options: finalized.options,
    meta: {
      pressure: finalized.weekScene?.pressure || null,
      meme: finalized.weekScene?.meme || false,
      validation: finalized.narrativeLogic || null,
      ageYears: ageOf(ctx),
      weekEntropy: ctx.weekEntropy,
      turnCount: ctx.turnCount,
      engine: "narrative-logic",
    },
  };
}

export const NarrativeLogicEngine = Object.freeze({
  generateNarrativeAndOptions,
  finalizeWeeklyOutput,
  enforceVoiceAndStakes,
  sealNarrativePayload,
  isAdultVoice,
  hasChildVoice,
});

export default NarrativeLogicEngine;
