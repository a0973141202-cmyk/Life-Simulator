/**
 * Life Simulator — core logic entry.
 * UI can later import { GameEngine } or read window.LifeSim.
 */
export { GameEngine } from "./js/GameEngine.js";
export { GenesisEngine, createCharacter, describeGenesis } from "./js/genesis.js";
export { generateTurn } from "./js/eventGenerator.js";
export {
  generateNarrativeAndOptions,
  finalizeWeeklyOutput,
  NarrativeLogicEngine,
} from "./js/narrative-logic-engine.js";
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
  SAVE_VERSION,
  CLIENT_BUILD_KEY,
  HALL_KEY,
  clientBootHints,
  purgeStaleClientState,
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
export {
  evaluateIndustryImpact,
  finalizeWorldIncident,
  mintWorldEventTriad,
  resolveCareerSector,
} from "./js/world-impact-engine.js";
export {
  emptyCausalState,
  ensureCausalState,
  recordCausalEcho,
  weeklyCausalTick,
  causalIncidentWeight,
} from "./js/causal-feedback-engine.js";
export {
  THREAD_SECTOR_POLARITY,
  IMPACT_TAG_TILTS,
} from "./js/data/world-industry-impact.js";
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
import { closeHallOfFame, openHallOfFame, renderLifeSim, showBootError, setChoiceBusy, isChoiceBusy, holdChoiceBusy } from "./js/ui.js";
import { SHOW_REPUTATION_UI } from "./js/data/ui-config.js";
import { canBeginNewLife } from "./js/life-session.js";
import { SAVE_KEY, clearLifeSave, clientBootHints, purgeStaleClientState, readLifeSave } from "./js/life-persist.js";

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
    /** 114514 egg: digit sequence buffer; fires only on exact match. */
    this._inputSequence = "";
    this._lastKeyTime = Date.now();
    /** After one successful unlock this session/life, refuse re-fire / overwrite. */
    this._eggLock = false;
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
      this._eggLock = engine.character?.specialPresetId === "tadokoro_koji";
      this._clearEggBuffer();
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
      this._eggLock = false;
      this._clearEggBuffer();
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
      const already = this.engine?.character?.specialPresetId === "tadokoro_koji" && !this.engine?.gameOver;
      this._eggLock = true;
      this._clearEggBuffer();
      if (already) {
        return this.engine.getGameState();
      }
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
    this._inputSequence = "";
  }

  /**
   * Strict 114514 key buffer (idle-reset 2s).
   * Prefix-only (no sliding window). Returns:
   * - "fired" when egg unlocked
   * - "pending" when digit consumed into a valid prefix (do not choose)
   * - false when digit should fall through (or non-digit / locked)
   */
  _feedEggKeyBuffer(event) {
    const EGG = "114514";
    const currentTime = Date.now();
    if (currentTime - this._lastKeyTime > 2000 && this._inputSequence) {
      this._clearEggBuffer();
    }
    this._lastKeyTime = currentTime;

    if (this._eggLock || (this.engine?.character?.specialPresetId === "tadokoro_koji" && !this.engine?.gameOver)) {
      this._eggLock = true;
      if (this._inputSequence) this._clearEggBuffer();
      return false;
    }

    if (!/^[0-9]$/.test(event.key)) {
      if (this._inputSequence) this._clearEggBuffer();
      return false;
    }

    const next = this._inputSequence + event.key;
    if (EGG.startsWith(next)) {
      this._inputSequence = next;
      if (next === EGG) {
        this._eggLock = true;
        this._clearEggBuffer();
        this.triggerTadokoroKoji();
        return "fired";
      }
      return "pending";
    }

    // Mismatch: hard reset. Restart only if this digit alone is a valid prefix.
    if (EGG.startsWith(event.key)) {
      this._inputSequence = event.key;
      return "pending";
    }
    this._clearEggBuffer();
    return false;
  }

  /** Alias for the egg unlock path — applies Tadokoro preset via initNewGame. */
  triggerTadokoroKoji() {
    return this.forceTadokoroEgg();
  }

  _isEditableKeyTarget(target) {
    if (!target || target === document.body || target === document.documentElement) return false;
    const tag = String(target.tagName || "").toUpperCase();
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (target.isContentEditable) return true;
    if (typeof target.closest === "function" && target.closest("[contenteditable='true']")) return true;
    return false;
  }

  choose(index) {
    if (isChoiceBusy()) return null;
    try {
      if (!this.engine || this.engine.gameOver) return null;
      setChoiceBusy(true, `choose:${index}`);
      const result = this.engine.selectOption(index);
      const state = result?.state || this.engine.getGameState();
      this.sync(state).paint();
      // Re-lock freshly painted buttons, then unlock on a real timer (not rAF).
      holdChoiceBusy(280, "post-paint-hold");
      return result;
    } catch (error) {
      console.error("LifeSim: 選項結算失敗", error);
      setChoiceBusy(false, "choose-throw");
      showBootError(error);
      return null;
    }
  }

  bind() {
    if (this.bound) return this;
    const button = document.getElementById("btn-new-file");
    if (!button) {
      console.error("LifeSim: 找不到 #btn-new-file");
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
        this.triggerTadokoroKoji();
        return;
      }
      // Exact "114514" only — never fire on a single "1"; pending prefix blocks choose.
      const eggFeed = this._feedEggKeyBuffer(event);
      if (eggFeed === "fired" || eggFeed === "pending") {
        event.preventDefault();
        return;
      }
      const map = { 1: 0, 2: 1, 3: 2, Digit1: 0, Digit2: 1, Digit3: 2 };
      const choiceIndex = map[event.key] ?? map[event.code];
      if (choiceIndex == null) return;
      if (isChoiceBusy()) return;
      const buttons = document.querySelectorAll("#choices-container .choice-btn");
      if (buttons[choiceIndex] && !buttons[choiceIndex].disabled) this.choose(choiceIndex);
    });
    return this;
  }

  mount() {
    this.bind();
    try {
      purgeStaleClientState(clientBootHints());
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
  window.LifeSim = {
    GameEngine,
    GenesisEngine,
    CenturyLifeLoop,
    app,
    SHOW_REPUTATION_UI,
    canBeginNewLife,
    SAVE_KEY,
    clearLifeSave,
    purgeStaleClientState,
    forceTadokoroEgg: () => app?.forceTadokoroEgg?.(),
    triggerTadokoroKoji: () => app?.triggerTadokoroKoji?.(),
  };
  window.GameEngine = GameEngine;
  window.GenesisEngine = GenesisEngine;
  window.CenturyLifeLoop = CenturyLifeLoop;
}

function startApp() {
  const missing = REQUIRED_DOM_IDS.filter((id) => !document.getElementById(id));
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
  } catch (error) {
    console.error("LifeSim: 初始化失敗", error);
    showBootError(error);
  }
}

exposeGlobals();

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startApp);
  } else {
    startApp();
  }
}
