/**
 * Life Simulator — core logic entry.
 * UI can later import { GameEngine } or read window.LifeSim.
 */
export { GameEngine } from "./js/GameEngine.js";
export { GenesisEngine, createCharacter, describeGenesis } from "./js/genesis.js";
export { generateTurn } from "./js/eventGenerator.js";
export {
  compileLiveSheet,
  eventWeight,
  meetsPrerequisites,
  sampleWeightedEvents,
  sieveWeeklyEvents,
} from "./js/event-engine.js";
export { WEEKLY_EVENT_POOL } from "./js/data/events-pool.js";
export { ensureEventMemory, filterCooledPool, rememberTriggeredEvent, seedSessionCooldown, EVENT_COOLDOWN_CAP } from "./js/event-memory.js";
export { ensureTextHistory, beginTextTurn, rememberTextSnippet, TEXT_HISTORY_TURNS } from "./js/text-history.js";
export { attachLifeContext, contextAllowsOption, scanWeekContext, fitsWeekContext } from "./js/life-context.js";
export { beginExclusionTurn, optionExcluded, rememberExcluded, rememberUnpicked, EXCLUSION_TURNS } from "./js/exclusion-buffer.js";
export { composeExclusiveFill } from "./js/exclusive-fill.js";
export { mintTagDrivenTriad, remintLockedTriadText, collectTagLanes } from "./js/tag-choice-mint.js";
export { varyGenericNarrative, inferVariatorKind, maybeVaryChoice, weaveVariatorLine } from "./js/narrative-variator.js";
export { VARIATOR_KINDS } from "./js/data/variator-lexicon.js";
export { assembleWeeklyChronicle, chronicleOpener, chronicleLineKey, pickFreshLine } from "./js/chronicle-voice.js";
export { tagGloss, composeTagGloss } from "./js/data/tag-gloss.js";
export { bindTagTooltips, decorateTagChip } from "./js/tag-tooltip.js";
export { composePeriodChronicle, composeFortnightRecord, composeOpeningBirth, composeWorldBeat, composeChoiceLine, composeLiveFollowUp } from "./js/dynamic-prose.js";
export { composeWeekEncounter, composeEncounterChoice } from "./js/week-encounter.js";
export { scanNarrativeFacts } from "./js/narrative-facts.js";
export { attachLifeProgress, resolveLifeStage, progressAllowsAction } from "./js/life-stage-manager.js";
export { LIFE_ARCS, TURNING_POINTS } from "./js/data/life-stage-catalog.js";
export { applyTheme, resolveTheme } from "./js/theme-manager.js";
export { composeLifeResolution } from "./js/life-resolution.js";
export { composeMementoCard, collectMemorialTags } from "./js/memento.js";
export { scrubPublicText, scrubRiddleText, isDossierLeakSentence } from "./js/data/public-text.js";
export { inspectPublicLine, monitorPublicText, gateWeeklyOutput, gateDeathCopy } from "./js/text-monitor.js";
export {
  sanitizeChronicleText,
  composeAlignedChronicle,
  splitChronicleUnits,
  dedupeChronicleUnits,
} from "./js/chronicle-sanitize.js";
export { ensureDistinctChoiceTriad, pickDistinctLanes, mintUniqueChoiceLine } from "./js/choice-dedupe.js";
export { textsTooSimilar, normalizeChoiceText, clashesAny } from "./js/choice-similarity.js";
export { filterPublicLine, scanLogicFaults, pickLiveChoiceLane, sentenceShape } from "./js/text-logic-filter.js";
export {
  ensureWealth,
  seedWealth,
  applyWealthDelta,
  weeklyEconomicTick,
  evaluateBankruptcy,
  pickWealthCrisis,
  publicWealthView,
} from "./js/wealth-engine.js";
export {
  ensureNpcNetwork,
  seedNpcNetwork,
  weeklyNpcTick,
  pickKinCrisis,
  publicKinView,
  livingParentRoles,
  kinPressureScore,
} from "./js/npc-social-engine.js";
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
export { TagStore, patchCharacterTag } from "./js/tag-system.js";
export {
  weeklyTagLifecycle,
  seedTagLifecycle,
  ensureTagLifecycle,
} from "./js/tag-lifecycle-engine.js";
export { DECAY_RULES, EVOLUTION_RULES } from "./js/data/tag-lifecycle-rules.js";
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
export {
  SAVE_KEY,
  HALL_KEY,
  readLifeSave,
  writeLifeSave,
  clearLifeSave,
  hasLifeSave,
  readHallOfFame,
  writeHallCard,
  hasHallOfFame,
} from "./js/life-persist.js";
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
export { resolveDailyState, pickDailyTexture, renderDailyNarrative, DAILY_STATES } from "./js/daily-engine.js";
export { DAILY_SLICES } from "./js/data/daily/catalog.js";
export { applyTrauma, weeklyTraumaPressure, ensureTraumaState } from "./js/trauma-engine.js";
export {
  applyBreakdownChoice,
  armBreakdownIfNeeded,
  ensureBreakdownState,
  pickBreakdownIncident,
  shouldForceBreakdown,
  weeklySanityCrisis,
  SANITY_DANGER,
  BREAKDOWN_TAG_IDS,
} from "./js/mental-breakdown-engine.js";
export { BREAKDOWN_INCIDENTS } from "./js/data/breakdown-incidents.js";
export { attachEraCrisis, evaluateEraCrisis, eraCrisisScore } from "./js/history-crisis-engine.js";
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
import { closeHallOfFame, openHallOfFame, renderLifeSim, showBootError } from "./js/ui.js";
import { SHOW_REPUTATION_UI } from "./js/data/ui-config.js";
import { canBeginNewLife } from "./js/life-session.js";
import { SAVE_KEY, clearLifeSave, readLifeSave } from "./js/life-persist.js";

/** Hidden special presets via ?code= / ?unlock= / ?preset= (e.g. yajuu, 下北澤). */
function specialOverridesFromLocation() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    const code = params.get("code") || params.get("unlock") || params.get("preset") || "";
    if (!code) return {};
    return { specialCode: String(code).trim() };
  } catch {
    return {};
  }
}

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
    /** Strict digit egg buffer — only exact "114514" may fire. */
    this._keyBuffer = "";
    this._eggTimer = null;
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
    renderLifeSim(this.state, {
      onChoose: (index) => this.choose(index),
      onHallSelect: () => this.paint(),
      onHallClose: () => {
        closeHallOfFame();
        this.paint();
      },
    });
    return this;
  }

  restoreFile() {
    const data = readLifeSave();
    if (!data) return null;
    try {
      const engine = GameEngine.fromJSON(data);
      if (!engine?.character || !engine.clock) return null;
      this.engine = engine;
      this.sync(engine.getGameState()).paint();
      return this.state;
    } catch (error) {
      console.error("LifeSim: 讀檔失敗", error);
      return null;
    }
  }

  newFile(overrides = null) {
    try {
      if (this.engine && !canBeginNewLife(this.engine)) {
        this.sync(this.engine.getGameState()).paint();
        return this.state;
      }
      clearLifeSave();
      this.engine = new GameEngine();
      const state = this.engine.initNewGame({
        ...specialOverridesFromLocation(),
        ...(overrides || {}),
      });
      closeHallOfFame();
      this.sync(state).paint();
      return state;
    } catch (error) {
      console.error("LifeSim: 開檔失敗", error);
      showBootError(error);
      return null;
    }
  }

  /** Debug / egg: force Tadokoro Koji with permanent meme tag lock. */
  forceTadokoroEgg() {
    try {
      clearLifeSave();
      this.engine = new GameEngine();
      const state = this.engine.initNewGame({ specialPresetId: "tadokoro_koji" });
      closeHallOfFame();
      this.sync(state).paint();
      return state;
    } catch (error) {
      console.error("LifeSim: 田所彩蛋開檔失敗", error);
      showBootError(error);
      return null;
    }
  }

  _clearEggBuffer() {
    this._keyBuffer = "";
    if (this._eggTimer) {
      clearTimeout(this._eggTimer);
      this._eggTimer = null;
    }
  }

  _armEggBufferTimeout() {
    if (this._eggTimer) clearTimeout(this._eggTimer);
    this._eggTimer = setTimeout(() => {
      this._keyBuffer = "";
      this._eggTimer = null;
    }, 3000);
  }

  /**
   * Strict key-sequence buffer for the 114514 egg.
   * Digits append into a 6-char sliding window; fires only on exact "114514".
   * Returns true only when the egg was triggered.
   */
  _feedEggSeq(digit) {
    const ch = String(digit || "");
    if (!/^[0-9]$/.test(ch)) return false;
    this._keyBuffer = `${this._keyBuffer}${ch}`.slice(-6);
    this._armEggBufferTimeout();
    if (this._keyBuffer !== "114514") return false;
    this._clearEggBuffer();
    this.forceTadokoroEgg();
    return true;
  }

  _isEditableKeyTarget(target) {
    if (!target || target === document.body || target === document.documentElement) return false;
    const tag = String(target.tagName || "").toUpperCase();
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (target.isContentEditable) return true;
    if (typeof target.closest === "function" && target.closest("[contenteditable='true']")) return true;
    return false;
  }

  _digitFromKeyEvent(event) {
    if (/^[0-9]$/.test(event.key)) return event.key;
    if (event.code && /^Digit[0-9]$/.test(event.code)) return event.code.slice(5);
    if (event.code && /^Numpad[0-9]$/.test(event.code)) return event.code.slice(6);
    return null;
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
      console.error("LifeSim: 找不到 #btn-new-file");
      // #region agent log
      fetch("http://127.0.0.1:7279/ingest/ef06ca9d-d21b-4fa2-ab19-0a6f383a196a",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"7687e1"},body:JSON.stringify({sessionId:"7687e1",location:"script.js:bind",message:"bind-missing-button",data:{readyState:document.readyState},timestamp:Date.now(),hypothesisId:"D",runId:"post-fix"})}).catch(()=>{});
      // #endregion
      return this;
    }
    button.hidden = true;
    button.setAttribute("aria-hidden", "true");
    button.tabIndex = -1;
    this.bound = true;
    const startNextLife = () => {
      try {
        if (!this.engine || !canBeginNewLife(this.engine)) return;
        this.newFile();
      } catch (error) {
        console.error("LifeSim: 結算後開檔失敗", error);
        showBootError(error);
      }
    };
    const rebirth = document.getElementById("btn-rebirth");
    if (rebirth) rebirth.addEventListener("click", startNextLife);
    const hall = document.getElementById("btn-hall");
    if (hall) {
      hall.addEventListener("click", () => {
        if (this.engine?.gameOver) {
          closeHallOfFame();
        } else {
          openHallOfFame();
        }
        this.paint();
      });
    }
    const hallClose = document.getElementById("btn-hall-close");
    if (hallClose) {
      hallClose.addEventListener("click", () => {
        closeHallOfFame();
        this.paint();
      });
    }
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (this.engine?.gameOver) return;
      closeHallOfFame();
      this.paint();
    });
    document.addEventListener("keydown", (event) => {
      if (this._isEditableKeyTarget(event.target)) return;
      if (event.ctrlKey && event.shiftKey && (event.key === "Y" || event.code === "KeyY")) {
        event.preventDefault();
        this._clearEggBuffer();
        this.forceTadokoroEgg();
        return;
      }
      const digit = this._digitFromKeyEvent(event);
      if (digit != null) {
        // Feed buffer first; only exact "114514" returns true.
        if (this._feedEggSeq(digit)) {
          event.preventDefault();
          return;
        }
      } else if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        // Non-digit breaks the sequence so stray keys cannot complete it later.
        this._clearEggBuffer();
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
      if (!this.restoreFile()) this.newFile();
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
  "btn-hall",
  "death-weeks",
];

let app = null;

function exposeGlobals() {
  if (typeof window === "undefined") return;
  window.LifeSim = { GameEngine, GenesisEngine, CenturyLifeLoop, app, SHOW_REPUTATION_UI, canBeginNewLife, SAVE_KEY, forceTadokoroEgg: () => app?.forceTadokoroEgg?.() };
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
