/**
 * Life Simulator — core logic entry.
 * UI can later import { GameEngine } or read window.LifeSim.
 */
export { GameEngine } from "./js/GameEngine.js";
export { GenesisEngine, createCharacter, describeGenesis } from "./js/genesis.js";
export { generateTurn } from "./js/eventGenerator.js";
export { ensureEventMemory, filterCooledPool, rememberTriggeredEvent, seedSessionCooldown, EVENT_COOLDOWN_CAP } from "./js/event-memory.js";
export { ensureTextHistory, beginTextTurn, rememberTextSnippet, TEXT_HISTORY_TURNS } from "./js/text-history.js";
export { attachLifeContext, contextAllowsOption, scanWeekContext, fitsWeekContext } from "./js/life-context.js";
export { beginExclusionTurn, optionExcluded, rememberExcluded, EXCLUSION_TURNS } from "./js/exclusion-buffer.js";
export { composeExclusiveFill } from "./js/exclusive-fill.js";
export { varyGenericNarrative, inferVariatorKind, maybeVaryChoice } from "./js/narrative-variator.js";
export { VARIATOR_KINDS } from "./js/data/variator-lexicon.js";
export { assembleWeeklyChronicle, chronicleOpener, pickFreshLine } from "./js/chronicle-voice.js";
export { composePeriodChronicle, composeOpeningBirth, composeWorldBeat } from "./js/dynamic-prose.js";
export { scanNarrativeFacts } from "./js/narrative-facts.js";
export { attachLifeProgress, resolveLifeStage, progressAllowsAction } from "./js/life-stage-manager.js";
export { LIFE_ARCS, TURNING_POINTS } from "./js/data/life-stage-catalog.js";
export { applyTheme, resolveTheme } from "./js/theme-manager.js";
export { composeLifeResolution } from "./js/life-resolution.js";
export { scrubPublicText, scrubRiddleText } from "./js/data/public-text.js";
export { composeOpeningDossier, consumeOpeningWeekLead } from "./js/opening-chronicle.js";
export { OPENING_REPEAT_CAP, rememberSessionOpening, recentOpeningRecords } from "./js/session-repeat.js";
export { ACTION_POOL } from "./js/actions.js";
export { TAG_DRIVEN_ACTION_POOL } from "./js/data/tag-choice-actions.js";
export { BLOODLINE_CHOICE_POOL } from "./js/data/bloodline-choice-actions.js";
export { PREFIX_LINK_POOL, LINKED_TAG_PREFIXES } from "./js/data/tag-link-actions.js";
export { ASYMMETRIC_SURVIVAL_POOL } from "./js/data/asymmetric-survival-actions.js";
export {
  ensureTagCoverage,
  graftAsymmetricOptions,
  liveTagPrefixes,
  specializedAsymmetricOptions,
} from "./js/tag-link-engine.js";
export { buildConstitution, ensureConstitution } from "./js/constitution.js";
export { attachOrganicContext, evaluateOrganicWeek } from "./js/organic-trigger.js";
export {
  collectCtxTags,
  ctxHasTag,
  ensureChoiceMemory,
  hasLiveCanonicalTag,
  isTagGated,
  pickDiverseTriad,
  pickWeeklyTriad,
  rememberChosenChoice,
  rememberOfferedChoices,
} from "./js/choice-pool.js";
export {
  MAX_TAGS_PER_CHOICE,
  MAX_TAGGED_TRIAD_SLOTS,
  ensureUntaggedBaseline,
  isUntaggedBaseline,
  selectInterveningTags,
  stampTagInfluence,
} from "./js/tag-influence.js";
export { SANDBOX_ACTION_POOL } from "./js/data/sandbox-actions.js";
export { CRISIS_ACTION_POOL } from "./js/data/crisis-actions.js";
export { evaluateBoundary, interceptUnsafeOption, MINOR_PROTECT_AGE } from "./js/boundary.js";
export { ageBand, classifyLane, contentAllowedForAge, filterByAgeGate, incidentAllowed } from "./js/age-gate.js";
export { childhoodClimate, earlyChildAllowed } from "./js/early-child-filter.js";
export { semanticOptionAllowed, scrubSemanticText, situationFrame } from "./js/semantic-filter.js";
export { EARLY_CHILD_SURVIVAL_POOL } from "./js/data/early-child-survival-actions.js";
export { evaluateAttempt, crisisPressure } from "./js/risk-calculator.js";
export { applyChoiceConsequences, describeLedger } from "./js/consequence-engine.js";
export { createLedger, ensureLedger } from "./js/ledger.js";
/** Flip in js/data/ui-config.js. false = 方案 A：聲望只活在底層，HUD 不畫數字。 */
export { SHOW_REPUTATION_UI } from "./js/data/ui-config.js";
export {
  socialStanding,
  describeSocialFeedback,
  socialAttemptMod,
  SOCIAL_METER_KEYS,
} from "./js/social-feedback.js";
export { CITIES, FAMILY_CLASSES, ERAS, HISTORICAL_EVENTS } from "./js/data.js";
export {
  SETTLEMENTS,
  SETTLEMENT_PACKS,
  FORBIDDEN_SETTLEMENT_IDS,
  isSettlementAvailable,
  getSettlementCountry,
  getSettlementDisplayName,
  getSettlementEthnicities,
  localizeSettlement,
} from "./js/settlements.js";
export {
  formatBirthplace,
  formatPlaceLabel,
  pickSettlementByDemographics,
  canonicalizeCountry,
} from "./js/demographics-engine.js";
export { REGION_POP_MILLIONS, COUNTRY_POP_MILLIONS } from "./js/data/historical-demographics.js";
export { ETHNICITY_DATABASE, ETHNICITY_COUNT } from "./js/data/ethnicities-database.js";
export { TRAIT_DATABASE } from "./js/data/traits-database.js";
export { PARENT_APTITUDE_DATABASE } from "./js/data/parent-aptitudes-database.js";
export { CONDITION_DATABASE } from "./js/data/conditions-database.js";
export { SOCIO_TAG_DATABASE } from "./js/data/socio-tags-database.js";
export { MOOD_TAG_RULES } from "./js/data/mood-tags-database.js";
export { TagStore } from "./js/tag-system.js";
export { FORBIDDEN_ETHNICITY_IDS } from "./js/data/forbidden-groups.js";
export { YEAR_MIN, YEAR_MAX, STAT_KEYS, STAT_LABELS, getLifeStage, PLAY_AGE_MIN, PLAY_AGE_MAX, PLAY_PHASE, SOCIETY_ENTRY_AGE, TURNS_PER_YEAR, DAYS_PER_TURN, TURNS_TO_AGE_18 } from "./js/constants.js";
export { BETA_CONFIG, isBetaEnabled } from "./js/data/beta-config.js";
export {
  effectiveGenesisYearRange,
  effectivePlayAgeMax,
  isTemporaryPlayCap,
  shouldClosePlayWindow,
} from "./js/life-bounds.js";
export { canBeginNewLife, lifeIsActive, refuseNewLife } from "./js/life-session.js";
export { makeDate, isLeapYear, formatDate, randomDateInYear, isValidGregorianDate } from "./js/data/calendar.js";
export { natalEnvironmentTags, currentEnvironmentTags } from "./js/data/seasons.js";
export { SETTLEMENT_COORDS, SETTLEMENT_FOUNDING } from "./js/data/settlement-geo.js";
export { pickChaosProfile, applyChaosToTriad } from "./js/chaos-engine.js";
export { dressOption, publicEventView } from "./js/hint-engine.js";
export { PROSE_VOICE_NOTE, PROSE_COST_NOTE, FOG_KEEPS_ACTION, SYSTEM_VOICE_NOTE, NPC_VOICE_NOTE, NPC_GLOSS_NOTE } from "./js/data/prose-rules.js";
export { attachNpcSpeech, resolveNpcSpeaker, resolveSpeakerKind, attitudeTowardPlayer, speakNpc } from "./js/npc-voice.js";
export { NPC_VOICES, NPC_ATTITUDES } from "./js/data/npc-voices.js";
export { NAME_PACKS, nameKeyForCountry, namesFromKey } from "./js/data/name-packs.js";
export { formatCulturalName, composeCulturalName, resolveNamingEthnicity } from "./js/naming-engine.js";
export { AWAKENING_ACTION_POOL } from "./js/data/awakening-actions.js";
export { createClockAtAge, isPastPlayAge, advanceClock, dateAtAgeTurn, formatTime, turnsToAge } from "./js/time.js";
export { resolveDailyState, pickDailyTexture, DAILY_STATES } from "./js/daily-engine.js";
export { DAILY_SLICES } from "./js/data/daily/catalog.js";
export { applyTrauma, weeklyTraumaPressure, ensureTraumaState } from "./js/trauma-engine.js";
export { TRAUMA_TAG_DATABASE } from "./js/data/trauma-tags-database.js";
export { HOUSEHOLD_CLIMATE_TAGS } from "./js/data/household-climate.js";
export { TRAUMA_COST_NOTE } from "./js/data/trauma-writing-rules.js";
export { applySchoolChoice, weeklySchoolFallout, ensureSchoolState } from "./js/school-engine.js";
export { SCHOOL_TAG_DATABASE } from "./js/data/school-tags-database.js";
export { SCHOOL_INCIDENTS } from "./js/data/school-incidents/catalog.js";
export { SCHOOL_COST_NOTE, SCHOOL_STANCE_NOTE } from "./js/data/school-dark-rules.js";
export { applyPerpCaste, weeklyCastePressure, ensureCasteState } from "./js/perp-caste-engine.js";
export { PERP_CASTE_TAG_DATABASE } from "./js/data/perp-caste-tags-database.js";
export { PERP_CASTE_COST_NOTE } from "./js/data/perp-caste-rules.js";

export { applyAdultChoice, weeklyCareerFallout, ensureCareerState, assignOccupation } from "./js/adult-engine.js";
export { OCCUPATION_DATABASE } from "./js/data/occupations-database.js";
export { ADULT_TAG_DATABASE } from "./js/data/adult-tags-database.js";
export { ADULT_INCIDENTS } from "./js/data/adult-incidents/catalog.js";
export { ADULT_COST_NOTE, ADULT_STANCE_NOTE } from "./js/data/adult-writing-rules.js";
export { rollWeeklySurvival, evaluateWeeklyMortality, annualToWeekly } from "./js/mortality-engine.js";
export { MORTALITY_HISTORY } from "./js/data/mortality-history.js";
export { MORTALITY_COST_NOTE } from "./js/data/mortality-rules.js";

export { pickWorldEvent, applyWorldEventChoice, weeklyWorldEventFallout, ensureWorldEventState, eventMatches, attachWorldContext } from "./js/world-event-engine.js";
export { WORLD_EVENTS } from "./js/data/world-events/catalog.js";
export { WORLD_TAG_DATABASE } from "./js/data/world-event-tags.js";
export { WORLD_COST_NOTE, WORLD_STANCE_NOTE } from "./js/data/world-event-rules.js";
export { SOCIAL_UPHEAVALS } from "./js/data/social-upheaval.js";
export { evaluateUpheaval, attachUpheaval, weeklyUpheavalTick, publicUpheavalView } from "./js/upheaval-engine.js";

export {
  pickFigureEncounter,
  applyFigureChoice,
  weeklyHistoryFallout,
  ensureHistoryState,
  filterShockRow,
  figuresPresent,
} from "./js/history-engine.js";
export { FIGURES } from "./js/data/figures/catalog.js";
export { FIGURE_ENCOUNTERS } from "./js/data/figure-encounters/catalog.js";
export { FIGURE_TAG_DATABASE } from "./js/data/figure-tags.js";
export { FIGURE_COST_NOTE, FIGURE_STANCE_NOTE } from "./js/data/figure-rules.js";
export { BUTTERFLY_CASCADES } from "./js/data/butterfly-cascades.js";

import { GameEngine } from "./js/GameEngine.js";
import { GenesisEngine } from "./js/genesis.js";
import { renderLifeSim, showBootError } from "./js/ui.js";
import { SHOW_REPUTATION_UI } from "./js/data/ui-config.js";
import { canBeginNewLife } from "./js/life-session.js";

/**
 * Browser game loop. HUD fields match index.html IDs.
 * Survival, tags, geography, and triad events stay in GameEngine;
 * this class only owns the bi-weekly cycle and DOM sync.
 *
 * Starting HUD (before genesis overwrites from a real birth):
 *   year 1920, age 5, health 100, stress 0, reputation 0, crisis 0
 * reputation / notoriety / socialCredit stay on Character.ledger.
 * HUD hides those scores unless SHOW_REPUTATION_UI is true.
 * Under 10: mortality coefficient 0.5. Age 10+: 1.0.
 */
export class CenturyLifeLoop {
  constructor() {
    this.year = 1920;
    this.age = 5;
    this.health = 100;
    this.stress = 0;
    this.reputation = 0;
    this.crisis = 0;
    this.location = "";
    this.environment = "";
    this.tags = [];
    this.engine = null;
    this.state = null;
    this.bound = false;
  }

  survivalCoefficient(age = this.age) {
    return age < 10 ? 0.5 : 1;
  }

  sync(state) {
    this.state = state || null;
    if (!state?.ready) return this;
    const time = state.time || {};
    const character = state.character || {};
    const sanity = Math.max(0, Math.min(100, Math.round(state.stats?.sanity ?? state.stats?.mood ?? 50)));
    const opinion = state.ledger?.reputation ?? state.ledger?.opinion;
    const pressure = state.pressure?.score ?? 0;
    this.year = time.year ?? this.year;
    this.age = time.ageYears ?? this.age;
    this.health = Math.max(0, Math.min(100, Math.round(state.stats?.health ?? this.health)));
    this.stress = Math.max(0, Math.min(100, 100 - sanity));
    this.reputation = Math.max(0, Math.min(100, Math.round(opinion ?? 0)));
    this.crisis = Math.max(0, Math.min(100, Math.round(Math.max(
      pressure,
      state.career?.crisis || 0,
      (state.world?.pressure || 0) * 0.85,
      state.history?.inertia || 0,
    ))));
    this.location = [character.cityName, character.country].filter(Boolean).join(" · ");
    this.environment = character.settlementKindLabel || "";
    this.tags = (character.visibleTags || []).slice();
    return this;
  }

  paint() {
    renderLifeSim(this.state, { onChoose: (index) => this.choose(index) });
    return this;
  }

  newFile() {
    try {
      if (this.engine && !canBeginNewLife(this.engine)) {
        this.sync(this.engine.getGameState()).paint();
        return this.state;
      }
      this.engine = new GameEngine();
      const state = this.engine.initNewGame();
      this.sync(state).paint();
      return state;
    } catch (error) {
      console.error("LifeSim: 開新檔案失敗", error);
      showBootError(error);
      return null;
    }
  }

  choose(index) {
    try {
      if (!this.engine || this.engine.gameOver) return null;
      const result = this.engine.selectOption(index);
      const state = result?.state || this.engine.getGameState();
      this.sync(state).paint();
      return result;
    } catch (error) {
      console.error("LifeSim: 選項結算失敗", error);
      showBootError(error);
      return null;
    }
  }

  bind() {
    if (this.bound) return this;
    const button = document.getElementById("btn-new-file");
    if (!button) {
      console.error("LifeSim: 找不到 #btn-new-file，開新檔案按鈕無法綁定");
      // #region agent log
      fetch("http://127.0.0.1:7279/ingest/ef06ca9d-d21b-4fa2-ab19-0a6f383a196a",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"7687e1"},body:JSON.stringify({sessionId:"7687e1",location:"script.js:bind",message:"bind-missing-button",data:{readyState:document.readyState},timestamp:Date.now(),hypothesisId:"D",runId:"post-fix"})}).catch(()=>{});
      // #endregion
      return this;
    }
    this.bound = true;
    const startNew = () => {
      try {
        this.newFile();
      } catch (error) {
        console.error("LifeSim: 開新檔案按鈕觸發失敗", error);
        showBootError(error);
      }
    };
    button.addEventListener("click", startNew);
    const rebirth = document.getElementById("btn-rebirth");
    if (rebirth) rebirth.addEventListener("click", startNew);
    document.addEventListener("keydown", (event) => {
      if (event.target && ["INPUT", "TEXTAREA"].includes(event.target.tagName)) return;
      if (event.key === "n" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        this.newFile();
        return;
      }
      const map = { 1: 0, 2: 1, 3: 2, Digit1: 0, Digit2: 1, Digit3: 2 };
      const choiceIndex = map[event.key] ?? map[event.code];
      if (choiceIndex == null) return;
      const buttons = document.querySelectorAll("#choices-container .choice-btn");
      if (buttons[choiceIndex] && !buttons[choiceIndex].disabled) this.choose(choiceIndex);
    });
    // #region agent log
    fetch("http://127.0.0.1:7279/ingest/ef06ca9d-d21b-4fa2-ab19-0a6f383a196a",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"7687e1"},body:JSON.stringify({sessionId:"7687e1",location:"script.js:bind",message:"bind-ok",data:{bound:this.bound,hasButton:true},timestamp:Date.now(),hypothesisId:"D",runId:"post-fix"})}).catch(()=>{});
    // #endregion
    return this;
  }

  mount() {
    this.bind();
    try {
      this.newFile();
    } catch (error) {
      showBootError(error);
      console.error("LifeSim: 初次開檔失敗", error);
    }
    return this;
  }
}

const REQUIRED_DOM_IDS = [
  "app",
  "btn-new-file",
  "current-year",
  "current-age",
  "stat-health",
  "stat-sanity",
  "tags-container",
  "event-history",
  "choices-container",
  "death-resolution",
  "btn-rebirth",
];

let app = null;

function exposeGlobals() {
  if (typeof window === "undefined") return;
  window.LifeSim = { GameEngine, GenesisEngine, CenturyLifeLoop, app, SHOW_REPUTATION_UI, canBeginNewLife };
  window.GameEngine = GameEngine;
  window.GenesisEngine = GenesisEngine;
  window.CenturyLifeLoop = CenturyLifeLoop;
}

function startApp() {
  const missing = REQUIRED_DOM_IDS.filter((id) => !document.getElementById(id));
  // #region agent log
  fetch("http://127.0.0.1:7279/ingest/ef06ca9d-d21b-4fa2-ab19-0a6f383a196a",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"7687e1"},body:JSON.stringify({sessionId:"7687e1",location:"script.js:startApp",message:"startApp-enter",data:{readyState:document.readyState,missing,font:typeof getComputedStyle==="function"&&document.body?getComputedStyle(document.body).fontFamily:null,hiddenRep:SHOW_REPUTATION_UI===false},timestamp:Date.now(),hypothesisId:"F",runId:"post-fix"})}).catch(()=>{});
  // #endregion
  if (missing.length) {
    console.error("LifeSim: 必要 DOM 節點尚未就緒或缺失", missing.map((id) => `#${id}`).join(", "));
  }
  if (!document.getElementById("app")) {
    console.error("LifeSim: 找不到 #app，無法掛載遊戲");
    return;
  }
  try {
    app = new CenturyLifeLoop();
    exposeGlobals();
    app.mount();
    // #region agent log
    fetch("http://127.0.0.1:7279/ingest/ef06ca9d-d21b-4fa2-ab19-0a6f383a196a",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"7687e1"},body:JSON.stringify({sessionId:"7687e1",location:"script.js:mount",message:"mount-ok",data:{ready:Boolean(app.state&&app.state.ready),choiceCount:(app.state&&app.state.currentEvent&&app.state.currentEvent.options||[]).length,choiceSample:((app.state&&app.state.currentEvent&&app.state.currentEvent.options)||[]).slice(0,3).map((row)=>String(row.text||"")),statKeys:Object.keys((app.state&&app.state.stats)||{})},timestamp:Date.now(),hypothesisId:"C",runId:"post-fix"})}).catch(()=>{});
    // #endregion
  } catch (error) {
    console.error("LifeSim: 初始化失敗", error);
    showBootError(error);
    // #region agent log
    fetch("http://127.0.0.1:7279/ingest/ef06ca9d-d21b-4fa2-ab19-0a6f383a196a",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"7687e1"},body:JSON.stringify({sessionId:"7687e1",location:"script.js:mount",message:"mount-throw",data:{msg:String(error&&error.message||error),stack:String(error&&error.stack||"")},timestamp:Date.now(),hypothesisId:"C",runId:"post-fix"})}).catch(()=>{});
    // #endregion
  }
}

exposeGlobals();

// #region agent log
fetch("http://127.0.0.1:7279/ingest/ef06ca9d-d21b-4fa2-ab19-0a6f383a196a",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"7687e1"},body:JSON.stringify({sessionId:"7687e1",location:"script.js:boot",message:"script-module-evaluated",data:{readyState:typeof document!=="undefined"?document.readyState:null,hasApp:Boolean(typeof document!=="undefined"&&document.getElementById("app")),ids:{year:Boolean(typeof document!=="undefined"&&document.getElementById("current-year")),health:Boolean(typeof document!=="undefined"&&document.getElementById("stat-health")),tags:Boolean(typeof document!=="undefined"&&document.getElementById("tags-container")),choices:Boolean(typeof document!=="undefined"&&document.getElementById("choices-container")),btn:Boolean(typeof document!=="undefined"&&document.getElementById("btn-new-file"))},appAlive:Boolean(app),hiddenRep:SHOW_REPUTATION_UI===false},timestamp:Date.now(),hypothesisId:"B"})}).catch(()=>{});
// #endregion

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp);
  } else {
    startApp();
  }
}
