import { PLAY_AGE_MIN, PLAY_PHASE, SOCIETY_ENTRY_AGE, STAT_KEYS, STAT_LABELS, STAT_MAX, STAT_MIN, getLifeStage } from "./constants.js";
import {
  completeTurningPoint,
  ensureLifeProgress,
  publicProgressView,
  resolveLifeStage,
  tickLifeProgress,
} from "./life-stage-manager.js";
import { TURNING_POINTS } from "./data/life-stage-catalog.js";
import { canBeginNewLife } from "./life-session.js";
import { betaOverlaySnapshot, effectivePlayAgeMax, isTemporaryPlayCap, shouldClosePlayWindow } from "./life-bounds.js";
import { findCity, getEraForYear } from "./data.js";
import { applyEffects, generateTurn, resolveOption } from "./eventGenerator.js";
import { describeGenesis, GenesisEngine } from "./genesis.js";
import { composeOpeningDossier } from "./opening-chronicle.js";
import { composeLifeResolution } from "./life-resolution.js";
import { interceptUnsafeOption } from "./boundary.js";
import {
  applyChoiceConsequences,
  crisisPressure,
  describeLedger,
  rollLifestyleRisk,
  weeklyConsequenceTick,
} from "./consequence-engine.js";
import { publicEventView } from "./hint-engine.js";
import { applyTrauma, ensureTraumaState, weeklyTraumaPressure } from "./trauma-engine.js";
import {
  applyBreakdownChoice,
  armBreakdownIfNeeded,
  ensureBreakdownState,
  weeklySanityCrisis,
} from "./mental-breakdown-engine.js";
import { evaluateEraCrisis } from "./history-crisis-engine.js";
import { applySchoolChoice, ensureSchoolState, stampSchoolTags, weeklySchoolFallout } from "./school-engine.js";
import { applyPerpCaste, ensureCasteState, stampCasteTags, weeklyCastePressure } from "./perp-caste-engine.js";
import {
  applyAdultChoice,
  ensureCareerState,
  enterSociety,
  stampAdultTags,
  weeklyCareerFallout,
} from "./adult-engine.js";
import { evaluateWeeklyMortality, rollWeeklySurvival } from "./mortality-engine.js";
import {
  applyWorldEventChoice,
  attachWorldContext,
  ensureWorldEventState,
  stampWorldTags,
  weeklyWorldEventFallout,
} from "./world-event-engine.js";
import {
  publicUpheavalView,
  weeklyUpheavalTick,
} from "./upheaval-engine.js";
import {
  applyFigureChoice,
  ensureHistoryState,
  stampFigureTags,
  weeklyHistoryFallout,
} from "./history-engine.js";
import { currentEnvironmentTags } from "./data/seasons.js";
import { applyHiddenOutcome, applyLedgerDeltas, ensureLedger, syncLedgerTags } from "./ledger.js";
import { addCharacterTag, TagStore, tagsByCategory, visibleTagIds } from "./tag-system.js";
import { seedTagLifecycle, weeklyTagLifecycle } from "./tag-lifecycle-engine.js";
import { writeHallCard, writeLifeSave } from "./life-persist.js";
import { composeMementoCard } from "./memento.js";
import { composeStageClause } from "./dynamic-prose.js";
import { gateDeathCopy, gateWeeklyOutput, monitorPublicText } from "./text-monitor.js";
import { mintTagDrivenTriad, remintLockedTriadText } from "./tag-choice-mint.js";
import { composeWeekEncounter } from "./week-encounter.js";
import { socialStanding } from "./social-feedback.js";
import { SHOW_REPUTATION_UI } from "./data/ui-config.js";
import { publicTagLabel } from "./data/ui-zh.js";
import { createRng, randomSeed } from "./rng.js";
import { syncMoodTags } from "./mood-engine.js";
import { findSettlement, getSettlementCountry } from "./settlements.js";
import { canonicalizeCountry, formatBirthplace, formatPlaceLabel } from "./demographics-engine.js";
import { scrubPublicText } from "./data/public-text.js";
import {
  ensureChoiceMemory,
  rememberChosenChoice,
} from "./choice-pool.js";
import { ensureConstitution } from "./constitution.js";
import {
  advanceClock,
  clockToDate,
  createClockAtAge,
  formatTime,
  getAgeParts,
  rebuildClock,
} from "./time.js";
import { ensureTextHistory } from "./text-history.js";
import { ensureExclusionBuffer, rememberUnpicked } from "./exclusion-buffer.js";
import { ensureEventMemory } from "./event-memory.js";
import {
  applyWealthCrisisChoice,
  armWealthCrisis,
  ensureWealth,
  publicWealthView,
  resolveWealthStake,
  syncWealthTags,
  wealthPressureScore,
  weeklyEconomicTick,
} from "./wealth-engine.js";
import {
  applyAthleteHighPressureTick,
  applyBrotherhoodStandChoice,
  applyQuitAheadStopLoss,
  enhanceWealthStakeForPersona,
  personaCrisisResistBonus,
  resolveAbyssMagnetism,
  resolvePersonaPaybacks,
  rollPersonaCrisisSwing,
} from "./persona-engine.js";
import {
  applyChoiceKinEffects,
  applyKinCrisisChoice,
  armKinCrisis,
  ensureNpcNetwork,
  kinPressureScore,
  publicKinView,
  syncKinTags,
  weeklyNpcTick,
} from "./npc-social-engine.js";

function snapshotTime(clock, character) {
  return formatTime(clock, character);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function comingOfAgeText(character, time) {
  const job = character.occupation && character.occupation !== "無"
    ? `目前在做${character.occupation}。`
    : "謀生的位置還沒被市場承認。";
  return `${character.name}（生於 ${character.birthYear} 年，${character.birthplaceLabel || character.cityName}）走到 ${time.year} 年，滿 ${time.ageYears} 歲。戶口與工錢開始按成人的規矩算。${job}`;
}

/**
 * Century life simulator core.
 *
 * Typical UI loop (ages 5–120):
 *   const game = new GameEngine();
 *   game.initNewGame();
 *   const state = game.getGameState();
 *   const result = game.selectOption(1); // or game.advanceWeek(1)
 * Age 18 is society entry. A living file cannot be replaced until death or play-window close.
 * Fog options hide effects in getGameState().currentEvent; the engine still resolves the true invoice.
 */
export class GameEngine {
  constructor(options = {}) {
    this.seed = options.seed ?? randomSeed();
    this.rng = createRng(this.seed, options.rngState);
    this.character = null;
    this.clock = null;
    this.currentEvent = null;
    this.lastResult = null;
    this.journal = [];
    this.turnCount = 0;
    this.gameOver = false;
    this.ending = null;
  }

  initNewGame(overrides = {}) {
    if (!canBeginNewLife(this)) {
      return this.getGameState();
    }
    this.seed = overrides.seed ?? randomSeed();
    this.rng = createRng(this.seed, overrides.rngState);
    this.genesis = new GenesisEngine({ rng: this.rng, seed: this.seed });
    this.character = this.genesis.generateRandomCharacter(overrides);
    this.clock = createClockAtAge(this.character.birthDate, PLAY_AGE_MIN);
    this.journal = [];
    this.turnCount = 0;
    this.gameOver = false;
    this.ending = null;
    const opening = composeOpeningDossier(this.rng, this.character);
    this.lastResult = {
      type: "awakening",
      followUpText: `${opening.birth} ${opening.awakening}`,
      effects: {},
      applied: {},
      tagsGained: this.character.tags.slice(),
      triggeredRisk: false,
    };
    this._pushJournal("出生", opening.birth || describeGenesis(this.character, this.rng), {});
    this._pushJournal("意識萌芽", opening.awakening, {});
    ensureLifeProgress(this.character);
    seedTagLifecycle(this.character, 0);
    tickLifeProgress(this.character, {
      ageYears: PLAY_AGE_MIN,
      year: this.clock.year,
      time: this.clock,
      character: this.character,
    });
    const openingDeath = this._checkDeath("五歲剛能自己走路的那兩週，高燒、腹瀉或飢餓把性命收走了。");
    if (openingDeath) return openingDeath.state;
    this.currentEvent = generateTurn(this.rng, this._context());
    this._persist();
    return this.getGameState();
  }

  getGameState() {
    if (!this.character) {
      return {
        ready: false,
        seed: this.seed,
        message: "尚未開局。請先呼叫 initNewGame()。",
      };
    }

    const time = snapshotTime(this.clock, this.character);
    const city = findCity(this.character.cityId);
    const era = getEraForYear(time.year);
    const stage = resolveLifeStage(time.ageYears);
    let liveCityName = this.character.cityName;
    let liveCountry = canonicalizeCountry(this.character.country, time.year, this.character.region);
    let currentPlaceLabel = this.character.birthplaceLabel || formatPlaceLabel(liveCountry, liveCityName);
    if (city) {
      const livePlace = formatBirthplace(city, time.year);
      liveCityName = livePlace.cityOfficial;
      liveCountry = livePlace.country;
      currentPlaceLabel = livePlace.label;
    }

    return {
      ready: true,
      seed: this.seed,
      gameOver: this.gameOver,
      ending: this.ending,
      turnCount: this.turnCount,
      character: clone({
        ...this.character,
        cityName: liveCityName,
        country: liveCountry,
        birthplaceLabel: this.character.birthplaceLabel,
        currentPlaceLabel,
        visibleTags: visibleTagIds(this.character),
        hiddenTagCount: (this.character.tagRecords || []).filter((item) => item.hidden).length,
      }),
      time,
      playPhase: { ...PLAY_PHASE, currentAge: time.ageYears },
      era: { id: era.id, name: era.name, summary: era.summary, mood: era.mood },
      stage: { id: stage.id, label: stage.label, arcId: stage.arcId, arcLabel: stage.arcLabel },
      lifeProgress: publicProgressView(this.character, {
        ageYears: time.ageYears,
        year: time.year,
        time,
        upheaval: this.character.upheavalState,
      }),
      stats: clone(this.character.stats),
      statMeta: { keys: STAT_KEYS, labels: STAT_LABELS, min: STAT_MIN, max: STAT_MAX },
      ledger: clone(ensureLedger(this.character)),
      ledgerLine: describeLedger(this.character.ledger, {
        upheavalScore: this.character.upheavalState?.score || 0,
        worldPressure: this.character.worldEventState?.pressure || 0,
        eraCrisis: this._eraCrisis().score,
      }),
      social: socialStanding(this.character.ledger),
      pressure: crisisPressure(this.character.ledger, {
        upheavalScore: this.character.upheavalState?.score || 0,
        worldPressure: this.character.worldEventState?.pressure || 0,
        eraCrisis: this._eraCrisis().score,
        sanityGap: Math.max(0, 40 - (this.character.stats?.sanity ?? 50)),
        wealthGap: wealthPressureScore(this.character),
        kinGap: kinPressureScore(this.character, time.year),
        personaResist: personaCrisisResistBonus(this.character),
      }),
      upheaval: publicUpheavalView(this.character.upheavalState),
      sandbox: {
        choiceFreedom: true,
        minorProtectAge: 12,
        consequenceEngine: true,
        chaosTriad: true,
        hintStyles: ["blunt", "fog"],
        dailyEngine: true,
        traumaEngine: true,
        schoolEngine: true,
        schoolPeerHarm: true,
        perpCasteEngine: true,
        adultEngine: true,
        societyEntryAge: SOCIETY_ENTRY_AGE,
        choiceFreedomAdult: true,
        consequenceNoHalo: true,
        mortalityEngine: true,
        noHaloMortality: true,
        worldEventEngine: true,
        worldEventContextual: true,
        figureEngine: true,
        butterflyEngine: true,
        tagDrivenChoices: true,
        tagDrivenOnly: true,
        liveTagMint: true,
        uniqueChoicePool: true,
        organicBloodlineChoices: true,
        constitutionEngine: true,
        socialUpheavalEngine: true,
        hiddenReputationUi: !SHOW_REPUTATION_UI,
        socialFeedback: true,
        npcVoice: true,
        npcAttitudeByStanding: true,
        ageGatedEvents: true,
        ageGatedChoices: true,
        eraAgeEnvFilter: true,
        earlyChildSurvival: true,
        semanticContextFilter: true,
        fullTagLinkage: true,
        asymmetricSurvival: true,
        tagInfluenceCap: true,
        maxTagsPerChoice: 3,
        untaggedBaseline: false,
        culturalNameMatching: true,
        indigenousNaming: true,
        historicalGeography: true,
        historicalDemographics: true,
        lifeLockUntilSettlement: true,
        eventCooldown: true,
        chronicleVariance: true,
        dynamicOpeningChronicle: true,
        fourPillarProse: true,
        progressiveLifeStages: true,
        lifeStageManager: true,
        dynamicUiTheme: true,
        themeManager: true,
        dynamicComputationEngine: true,
        explicitDeathPanel: true,
        concreteNarration: true,
        globalTextDedup: true,
        narrativeVariator: true,
        contextAwareRandom: true,
        exclusiveOptions: true,
        noOptionRecycling: true,
        dynamicOnTheFly: true,
        zeroHardcodedTemplates: true,
        liveChoiceMint: true,
        staticWorldDatabase: true,
        predefinedDemographics: true,
        liveWeeklyNarrative: true,
        textLogicMonitor: true,
        semanticGate: true,
        logicFilter: true,
        causalityGate: true,
        varietyGuard: true,
        contextualIntro: true,
        figureWeave: true,
        encounterDrivenChoices: true,
        prerequisiteFilter: true,
        weightedEventSample: true,
        tagDecayEngine: true,
        tagForgetting: true,
        tagEvolution: true,
        mentalBreakdown: true,
        traumaBreakdownSystem: true,
        eraCrisisIndex: true,
        wealthEngine: true,
        wealthCashflow: true,
        bankruptcyCrisis: true,
        classMobilityStakes: true,
        npcSocialNetwork: true,
        kinAffection: true,
        kinDeathCrisis: true,
        autoLocalPersist: true,
        noManualReset: true,
        hallOfFame: true,
        mementoModal: true,
        biweeklyTurns: true,
        turnsPerYear: 24,
        daysPerTurn: 14,
        turnsToAge18: 432,
        ...betaOverlaySnapshot(),
      },
      dailyState: clone(this.character.dailyState || null),
      trauma: {
        intensity: this.character.traumaState?.intensity || 0,
        domains: clone(this.character.traumaState?.domains || {}),
        tags: (this.character.tagsByCategory?.trauma || []).slice(),
        breakdownPending: Boolean(this.character.breakdownState?.pending),
        breakdownEpisodes: this.character.breakdownState?.episodes || 0,
      },
      eraCrisis: this._eraCrisis(),
      wealth: publicWealthView(this.character),
      kin: publicKinView(this.character, snapshotTime(this.clock, this.character).year),
      school: {
        enmity: this.character.schoolState?.enmity || 0,
        heat: this.character.schoolState?.heat || 0,
        tags: (this.character.tagsByCategory?.school || []).slice(),
      },
      caste: {
        intensity: this.character.casteState?.intensity || 0,
        adjacency: this.character.casteState?.adjacency || 0,
        tags: (this.character.tagsByCategory?.caste || []).slice(),
      },
      career: {
        occupationId: this.character.occupationId || null,
        sector: this.character.careerState?.sector || null,
        socialPhase: this.character.socialPhase || "minor",
        crisis: this.character.careerState?.crisis || 0,
        burnout: this.character.careerState?.burnout || 0,
        tags: (this.character.tagsByCategory?.adult || []).slice(),
      },
      world: {
        pressure: this.character.worldEventState?.pressure || 0,
        lastIncidentId: this.character.worldEventState?.lastIncidentId || null,
        lastKind: this.character.worldEventState?.lastKind || null,
        tags: (this.character.tagsByCategory?.world || []).slice(),
      },
      history: {
        inertia: this.character.historyState?.inertia || 0,
        rewritten: Boolean(this.character.historyState?.rewritten),
        lastFigureId: this.character.historyState?.lastFigureId || null,
        divergences: (this.character.historyState?.divergences || []).slice(-12),
        shockOverrides: clone(this.character.historyState?.shockOverrides || {}),
        relations: clone(this.character.historyState?.relations || {}),
        tags: (this.character.tagsByCategory?.figure || []).slice(),
      },
      currentEvent: publicEventView(clone(this.currentEvent)),
      lastResult: clone(this.lastResult),
      journal: clone(this.journal.slice(-80)),
      mortality: clone(this._mortalityView()),
    };
  }

  /**
   * Choose one of the three period options (0, 1, 2).
   * Applies effects, may append random follow-up text, then advances one fortnight.
   */
  selectOption(choiceIndex) {
    return this.advanceTurn(choiceIndex);
  }

  advanceWeek(choiceIndex) {
    return this.advanceTurn(choiceIndex);
  }

  advanceTurn(choiceIndex) {
    if (!this.character) {
      return { ok: false, error: "not_initialized", message: "尚未開局。" };
    }
    if (this.gameOver) {
      return { ok: false, error: "game_over", message: "人生已結束。", ending: this.ending };
    }

    const event = this.currentEvent;
    const option = event?.options?.[choiceIndex];
    if (!option) {
      return { ok: false, error: "invalid_choice", message: "請選擇 0、1 或 2。" };
    }

    const ctx = this._context();
    const blocked = interceptUnsafeOption(option, ctx);
    if (blocked) {
      this.currentEvent = generateTurn(this.rng, ctx);
      this._persist();
      return { ...blocked, nextEvent: publicEventView(clone(this.currentEvent)) };
    }
    rememberChosenChoice(this.character, option, getLifeStage(ctx.ageYears || 0).id);
    rememberUnpicked(this.character, event.options, choiceIndex);
    if (option.turningPointId) {
      completeTurningPoint(this.character, option.turningPointId, ctx);
      const point = TURNING_POINTS[option.turningPointId];
      if (point) this._pushJournal(point.title, composeStageClause(this.rng, ctx), {});
      if (point?.addTags?.length) this._gainTags(point.addTags);
    }

    const decay = weeklyConsequenceTick(this.character, ctx.time);
    const resolved = resolveOption(this.rng, option, this.character, ctx);
    const combinedEffects = { ...event.passiveEffects };
    for (const [key, value] of Object.entries(resolved.effects)) {
      combinedEffects[key] = (combinedEffects[key] || 0) + value;
    }

    applyHiddenOutcome(this.character, resolved.hidden, ctx.time);
    const appliedBundle = applyEffects(this.character.stats, combinedEffects, this.character, ctx.time);
    this.character.stats = appliedBundle.stats;
    const karma = applyChoiceConsequences(this.rng, this.character, option, ctx.time);
    const trauma = applyTrauma(this.character, option.trauma, ctx.time);
    const breakdown = option.breakdownIncident
      ? applyBreakdownChoice(this.character, option, { ...ctx.time, turnCount: this.turnCount })
      : { applied: [], notes: [], tags: [] };
    const wealthCrisis = option.wealthCrisis
      ? applyWealthCrisisChoice(this.character, option, { ...ctx.time, turnCount: this.turnCount })
      : { applied: [], notes: [], tags: [] };
    const wealthStake = option.wealthStake
      ? resolveWealthStake(
        this.rng,
        this.character,
        enhanceWealthStakeForPersona(option, this.character),
        { ...ctx, time: ctx.time },
      )
      : { triggered: false, note: "" };
    const brotherhood = applyBrotherhoodStandChoice(this.character, option, {
      ...ctx,
      turnCount: this.turnCount,
      time: ctx.time,
    });
    const kinCrisis = option.kinCrisis
      ? applyKinCrisisChoice(this.character, option, { ...ctx.time, turnCount: this.turnCount })
      : { applied: [], notes: [], tags: [] };
    applyChoiceKinEffects(this.character, option, { ...ctx, year: ctx.year || ctx.time?.year });
    const economy = weeklyEconomicTick(this.character, { ...ctx, ...this._context() });
    const stopLoss = applyQuitAheadStopLoss(this.character, {
      ...ctx,
      turnCount: this.turnCount,
      time: ctx.time,
    });
    const wealthSync = syncWealthTags(this.character);
    armWealthCrisis(this.character, {
      ...ctx,
      turnCount: this.turnCount,
      year: ctx.year || ctx.time?.year,
    });
    if (economy.snapshot?.band === "bankrupt" || economy.snapshot?.debt >= 80) {
      const dripW = applyEffects(this.character.stats, { sanity: -1 }, this.character, ctx.time);
      this.character.stats = dripW.stats;
      appliedBundle.applied.sanity = (appliedBundle.applied.sanity || 0) + (dripW.applied.sanity || 0);
    }
    const kinWeek = weeklyNpcTick(this.character, { ...ctx, ...this._context(), turnCount: this.turnCount }, this.rng);
    const abyss = resolveAbyssMagnetism(this.character, this.rng, {
      ...ctx,
      turnCount: this.turnCount,
      year: ctx.year || ctx.time?.year,
      time: ctx.time,
    });
    const kinSync = syncKinTags(this.character, { year: ctx.year || ctx.time?.year });
    const payback = resolvePersonaPaybacks(this.character, this.rng, {
      ...ctx,
      turnCount: this.turnCount,
      pressure: karma.pressure,
      time: ctx.time,
    });
    armKinCrisis(this.character, {
      ...ctx,
      turnCount: this.turnCount,
      year: ctx.year || ctx.time?.year,
    });
    if (kinWeek.death || this.character.npcNetwork?.pendingCrisis) {
      const dripK = applyEffects(this.character.stats, { sanity: -2 }, this.character, ctx.time);
      this.character.stats = dripK.stats;
      appliedBundle.applied.sanity = (appliedBundle.applied.sanity || 0) + (dripK.applied.sanity || 0);
    }
    const school = option.schoolIncident
      ? applySchoolChoice(this.character, option, ctx.time, this.rng)
      : { applied: stampSchoolTags(this.character, option.addTags || []), notes: [], ending: null };
    const caste = applyPerpCaste(this.character, option.caste, ctx.time);
    if (!option.caste) stampCasteTags(this.character, option.addTags || []);
    const adult = option.adultIncident
      ? applyAdultChoice(this.character, option, ctx.time, this.rng)
      : { applied: stampAdultTags(this.character, option.addTags || []), notes: [], ending: null };
    const world = option.worldEvent
      ? applyWorldEventChoice(this.character, option, ctx.time, this.rng)
      : { applied: stampWorldTags(this.character, option.addTags || []), notes: [], ending: null };
    const figure = option.figureEncounter
      ? applyFigureChoice(this.character, option, ctx.time, this.rng, karma.roll)
      : { applied: stampFigureTags(this.character, option.addTags || []), notes: [], ending: null };
    this._gainTags([...(resolved.addTags || []), ...(karma.addTags || [])]);
    const moodSync = syncMoodTags(this.character);
    const lifestyle = rollLifestyleRisk(this.rng, this.character);
    const traumaWeek = weeklyTraumaPressure(this.character);
    const schoolWeek = weeklySchoolFallout(this.rng, this.character, ctx.time);
    const casteWeek = weeklyCastePressure(this.character);
    const adultWeek = weeklyCareerFallout(this.rng, this.character, ctx.time);
    const worldWeek = weeklyWorldEventFallout(this.rng, this.character, ctx.time);
    attachWorldContext(ctx);
    const upheavalWeek = weeklyUpheavalTick(this.rng, this.character, ctx);
    const historyWeek = weeklyHistoryFallout(this.rng, this.character, ctx.time);
    if (schoolWeek.addTags?.length) {
      stampSchoolTags(this.character, schoolWeek.addTags);
      this._gainTags(schoolWeek.addTags);
    }
    if (adultWeek.addTags?.length) {
      stampAdultTags(this.character, adultWeek.addTags);
      this._gainTags(adultWeek.addTags);
    }
    if (worldWeek.addTags?.length) {
      stampWorldTags(this.character, worldWeek.addTags);
      this._gainTags(worldWeek.addTags);
    }
    if (historyWeek.addTags?.length) {
      stampFigureTags(this.character, historyWeek.addTags);
      this._gainTags(historyWeek.addTags);
    }
    if (schoolWeek.consequence) {
      applyLedgerDeltas(ensureLedger(this.character), schoolWeek.consequence, ctx.time, schoolWeek.consequence.eventLabel);
      syncLedgerTags(this.character);
    }
    if (schoolWeek.effects && Object.keys(schoolWeek.effects).length) {
      const extra = applyEffects(this.character.stats, schoolWeek.effects, this.character, ctx.time);
      this.character.stats = extra.stats;
      for (const [key, value] of Object.entries(extra.applied || {})) {
        appliedBundle.applied[key] = (appliedBundle.applied[key] || 0) + value;
      }
    }
    if (adultWeek.consequence) {
      applyLedgerDeltas(ensureLedger(this.character), adultWeek.consequence, ctx.time, adultWeek.consequence.eventLabel);
      syncLedgerTags(this.character);
    }
    if (adultWeek.effects && Object.keys(adultWeek.effects).length) {
      const extraA = applyEffects(this.character.stats, adultWeek.effects, this.character, ctx.time);
      this.character.stats = extraA.stats;
      for (const [key, value] of Object.entries(extraA.applied || {})) {
        appliedBundle.applied[key] = (appliedBundle.applied[key] || 0) + value;
      }
    }
    if (worldWeek.consequence) {
      applyLedgerDeltas(ensureLedger(this.character), worldWeek.consequence, ctx.time, worldWeek.consequence.eventLabel);
      syncLedgerTags(this.character);
    }
    if (upheavalWeek.consequence) {
      syncLedgerTags(this.character);
    }
    if (worldWeek.effects && Object.keys(worldWeek.effects).length) {
      const extraW = applyEffects(this.character.stats, worldWeek.effects, this.character, ctx.time);
      this.character.stats = extraW.stats;
      for (const [key, value] of Object.entries(extraW.applied || {})) {
        appliedBundle.applied[key] = (appliedBundle.applied[key] || 0) + value;
      }
    }
    if (historyWeek.consequence) {
      applyLedgerDeltas(ensureLedger(this.character), historyWeek.consequence, ctx.time, historyWeek.consequence.eventLabel);
      syncLedgerTags(this.character);
    }
    if (historyWeek.effects && Object.keys(historyWeek.effects).length) {
      const extraH = applyEffects(this.character.stats, historyWeek.effects, this.character, ctx.time);
      this.character.stats = extraH.stats;
      for (const [key, value] of Object.entries(extraH.applied || {})) {
        appliedBundle.applied[key] = (appliedBundle.applied[key] || 0) + value;
      }
    }
    if (lifestyle.hit) {
      const hurt = applyEffects(this.character.stats, { health: lifestyle.healthDelta }, this.character, ctx.time);
      this.character.stats = hurt.stats;
      appliedBundle.applied.health = (appliedBundle.applied.health || 0) + (hurt.applied.health || 0);
    }
    if (traumaWeek.moodDelta) {
      const drip = applyEffects(this.character.stats, { sanity: traumaWeek.moodDelta }, this.character, ctx.time);
      this.character.stats = drip.stats;
      appliedBundle.applied.mood = (appliedBundle.applied.mood || 0) + (drip.applied.mood || 0);
    }
    if (traumaWeek.healthChance && this.rng() < traumaWeek.healthChance) {
      const dripH = applyEffects(this.character.stats, { health: -1 }, this.character, ctx.time);
      this.character.stats = dripH.stats;
      appliedBundle.applied.health = (appliedBundle.applied.health || 0) + (dripH.applied.health || 0);
    }
    if (casteWeek.moodDelta) {
      const dripC = applyEffects(this.character.stats, { sanity: casteWeek.moodDelta }, this.character, ctx.time);
      this.character.stats = dripC.stats;
      appliedBundle.applied.mood = (appliedBundle.applied.mood || 0) + (dripC.applied.mood || 0);
    }
    const eraNow = evaluateEraCrisis({ ...ctx, ...this._context(), upheaval: this.character.upheavalState });
    const crisisSwing = rollPersonaCrisisSwing(this.character, this.rng, {
      ...ctx,
      turnCount: this.turnCount,
      time: ctx.time,
    });
    const athleteDrain = applyAthleteHighPressureTick(this.character, this.rng, {
      ...ctx,
      turnCount: this.turnCount,
      upheavalScore: this.character.upheavalState?.score || 0,
      eraCrisis: eraNow.score,
      wealthGap: wealthPressureScore(this.character),
      pressure: karma.pressure,
    });
    if (athleteDrain.applied && athleteDrain.drain) {
      appliedBundle.applied.sanity = (appliedBundle.applied.sanity || 0) - athleteDrain.drain;
      appliedBundle.applied.health = (appliedBundle.applied.health || 0) + 1;
    }
    const sanityWeek = weeklySanityCrisis(this.character, {
      ...ctx,
      eraCrisis: eraNow,
      pressure: karma.pressure,
    });
    if (sanityWeek.moodDelta) {
      const dripS = applyEffects(this.character.stats, { sanity: sanityWeek.moodDelta }, this.character, ctx.time);
      this.character.stats = dripS.stats;
      appliedBundle.applied.mood = (appliedBundle.applied.mood || 0) + (dripS.applied.mood || 0);
    }
    armBreakdownIfNeeded(this.character, {
      ...ctx,
      turnCount: this.turnCount,
      eraCrisis: eraNow,
      pressure: crisisPressure(this.character.ledger, {
        upheavalScore: this.character.upheavalState?.score || 0,
        worldPressure: this.character.worldEventState?.pressure || 0,
        eraCrisis: eraNow.score,
        sanityGap: Math.max(0, 40 - (this.character.stats?.sanity ?? 50)),
        wealthGap: wealthPressureScore(this.character),
        kinGap: kinPressureScore(this.character, ctx.year || ctx.time?.year),
        personaResist: personaCrisisResistBonus(this.character),
      }),
    });
    const lifecycle = weeklyTagLifecycle(this.character, {
      ...ctx,
      pressure: karma.pressure,
      turnCount: this.turnCount,
      ageYears: ctx.ageYears,
    }, { option, turnCount: this.turnCount });
    if (this.character.tagRecords) {
      this.character.tagsByCategory = tagsByCategory(this.character);
    }
    const moodNotes = (moodSync.changed || []).map((item) => (
      item.action === "add"
        ? "你的心情已經在這條路上停很久。"
        : "心情從極端裡退回一點。"
    ));
    const ledgerNotes = [
      ...(decay.notes || []),
      ...(karma.notes || []),
      lifestyle.text,
      traumaWeek.note,
      ...(trauma.notes || []),
      ...(school.notes || []),
      ...(schoolWeek.notes || []),
      casteWeek.note,
      ...(caste.notes || []),
      ...(adult.notes || []),
      ...(adultWeek.notes || []),
      ...(world.notes || []),
      ...(worldWeek.notes || []),
      ...(upheavalWeek.notes || []),
      ...(figure.notes || []),
      ...(historyWeek.notes || []),
    ].filter(Boolean);

    const beforeTime = snapshotTime(this.clock, this.character);
    this.lastResult = {
      type: "turn",
      year: beforeTime.year,
      month: beforeTime.month,
      day: beforeTime.day,
      iso: beforeTime.iso,
      week: beforeTime.week,
      ageYears: beforeTime.ageYears,
      choiceIndex,
      choiceText: option.trueText || option.text,
      followUpText: monitorPublicText(this.rng, scrubPublicText([resolved.followUpText, ...moodNotes, ...ledgerNotes, sanityWeek.note, economy.note, wealthStake.note, stopLoss.note, brotherhood.note, payback.note, crisisSwing.note, athleteDrain.note, abyss.note, ...(breakdown.notes || []), ...(wealthCrisis.notes || []), ...(kinCrisis.notes || []), ...(kinWeek.notes || []), ...(lifecycle.notes || [])].filter(Boolean).join(" ")), ctx, { kind: "follow" }),
      effects: combinedEffects,
      applied: appliedBundle.applied,
      tagsGained: [
        ...(resolved.addTags || []),
        ...(karma.addTags || []),
        ...((moodSync.changed || []).filter((item) => item.action === "add").map((item) => item.tag)),
        ...((karma.tagsChanged || []).filter((item) => item.action === "add").map((item) => item.tag)),
        ...((trauma.applied || []).map((item) => item.id)),
        ...((breakdown.applied || []).map((item) => item.id || item)),
        ...((wealthCrisis.applied || []).map((item) => item.id || item)),
        ...((kinCrisis.applied || []).map((item) => item.id || item)),
        ...((wealthSync.changed || []).filter((item) => item.action === "add").map((item) => item.tag)),
        ...((kinSync.changed || []).filter((item) => item.action === "add").map((item) => item.tag)),
        ...(school.applied || []),
        ...(schoolWeek.addTags || []),
        ...(caste.applied || []),
        ...(adult.applied || []),
        ...(adultWeek.addTags || []),
        ...(world.applied || []),
        ...(worldWeek.addTags || []),
        ...(figure.applied || []),
        ...(historyWeek.addTags || []),
        ...(lifecycle.tagsGained || []),
      ],
      tagsLost: [
        ...(moodSync.changed || []).filter((item) => item.action === "remove").map((item) => item.tag),
        ...(karma.tagsChanged || []).filter((item) => item.action === "remove").map((item) => item.tag),
        ...(lifecycle.tagsLost || []),
        ...((wealthSync.changed || []).filter((item) => item.action === "remove").map((item) => item.tag)),
        ...((kinSync.changed || []).filter((item) => item.action === "remove").map((item) => item.tag)),
      ],
      tagLifecycle: {
        faded: (lifecycle.changed || []).filter((item) => item.action === "fade").map((item) => item.tag),
        evolved: (lifecycle.changed || []).filter((item) => item.action === "evolve").map((item) => item.tag),
      },
      moodTags: moodSync.changed,
      triggeredRisk: resolved.triggeredRisk,
      worldContext: event.worldContext,
      ledgerApplied: karma.applied,
      attempt: karma.roll,
      pressure: karma.pressure,
      hintStyle: option.style || null,
      chaosSlot: option.chaosSlot || null,
      trueText: option.trueText || option.text,
      trauma: {
        applied: (trauma.applied || []).map((item) => item.id),
        intensity: this.character.traumaState?.intensity || 0,
        weeklyNote: traumaWeek.note || "",
        breakdown: Boolean(option.breakdownIncident),
        breakdownTags: (breakdown.tags || []).slice(),
      },
      school: {
        stance: option.stance || null,
        incidentId: option.schoolIncidentId || null,
        perpetrator: Boolean(option.perpetrator),
        enmity: this.character.schoolState?.enmity || 0,
      },
      caste: {
        applied: caste.applied || [],
        intensity: this.character.casteState?.intensity || 0,
      },
      adult: {
        stance: option.stance || null,
        incidentId: option.adultIncidentId || null,
        dark: Boolean(option.dark || option.perpetrator),
        crisis: this.character.careerState?.crisis || 0,
        burnout: this.character.careerState?.burnout || 0,
      },
      world: {
        stance: option.stance || null,
        incidentId: option.worldEventId || null,
        kind: option.worldKind || null,
        dark: Boolean(option.dark || option.perpetrator),
        pressure: this.character.worldEventState?.pressure || 0,
      },
      figure: {
        stance: option.stance || null,
        figureId: option.figureId || null,
        figureName: option.figureName || null,
        butterfly: option.butterfly?.kind || null,
        rewritten: Boolean(this.character.historyState?.rewritten),
        inertia: this.character.historyState?.inertia || 0,
      },
    };
    this._pushJournal(option.trueText || option.text, this.lastResult.followUpText, appliedBundle.applied);
    this.turnCount += 1;

    if (karma.ending) {
      return this._endGame(karma.ending.reason, karma.ending.detail);
    }
    if (school.ending) {
      return this._endGame(school.ending.reason, school.ending.detail);
    }
    if (schoolWeek.ending) {
      return this._endGame(schoolWeek.ending.reason, schoolWeek.ending.detail);
    }
    if (adult.ending) {
      return this._endGame(adult.ending.reason, adult.ending.detail);
    }
    if (adultWeek.ending) {
      return this._endGame(adultWeek.ending.reason, adultWeek.ending.detail);
    }
    if (world.ending) {
      return this._endGame(world.ending.reason, world.ending.detail);
    }
    if (worldWeek.ending) {
      return this._endGame(worldWeek.ending.reason, worldWeek.ending.detail);
    }
    if (figure.ending) {
      return this._endGame(figure.ending.reason, figure.ending.detail);
    }
    if (historyWeek.ending) {
      return this._endGame(historyWeek.ending.reason, historyWeek.ending.detail);
    }

    const death = this._checkDeath(resolved.followUpText);
    if (death) return death;

    this.clock = advanceClock(this.clock, this.character);
    const ageNow = getAgeParts(this.clock, this.character);

    if (shouldClosePlayWindow(ageNow.ageYears)) {
      return this._endPlayWindow();
    }

    if (ageNow.ageYears >= SOCIETY_ENTRY_AGE && this.character.socialPhase !== "adult") {
      this._comingOfAge();
    }

    this._maybeMilestones(ageNow.ageYears);
    tickLifeProgress(this.character, {
      ageYears: ageNow.ageYears,
      year: this.clock.year,
      time: this.clock,
      character: this.character,
      upheaval: this.character.upheavalState,
    });
    if (getLifeStage(ageNow.ageYears).id !== getLifeStage(beforeTime.ageYears).id) {
      weeklyTagLifecycle(this.character, {
        ...this._context(),
        ageYears: ageNow.ageYears,
        pressure: karma.pressure,
      }, {
        option,
        stageOnly: true,
        stageId: getLifeStage(ageNow.ageYears).id,
      });
      if (this.character.tagRecords) {
        this.character.tagsByCategory = tagsByCategory(this.character);
      }
    }
    this.currentEvent = generateTurn(this.rng, this._context());
    this._persist();

    return {
      ok: true,
      gameOver: false,
      result: clone(this.lastResult),
      nextEvent: publicEventView(clone(this.currentEvent)),
      state: this.getGameState(),
    };
  }

  toJSON() {
    return {
      seed: this.seed,
      rngState: this.rng.getState(),
      character: this.character,
      clock: this.clock,
      currentEvent: this.currentEvent,
      lastResult: this.lastResult,
      journal: this.journal,
      turnCount: this.turnCount,
      gameOver: this.gameOver,
      ending: this.ending,
    };
  }

  static fromJSON(data) {
    const engine = new GameEngine({ seed: data.seed, rngState: data.rngState });
    engine.character = data.character ? clone(data.character) : null;
    engine.turnCount = data.turnCount || 0;
    if (engine.character) {
      delete engine.character.tagStore;
      engine.character.tagStore = TagStore.fromJSON(engine.character.tagRecords || engine.character.tags || []);
      engine.character.tagRecords = engine.character.tagStore.toJSON();
      ensureLedger(engine.character);
      ensureTraumaState(engine.character);
      ensureBreakdownState(engine.character);
      ensureWealth(engine.character);
      ensureNpcNetwork(engine.character);
      ensureSchoolState(engine.character);
      ensureCasteState(engine.character);
      ensureCareerState(engine.character);
      ensureWorldEventState(engine.character);
      ensureHistoryState(engine.character);
      ensureLifeProgress(engine.character);
      seedTagLifecycle(engine.character, engine.turnCount || 0);
      ensureTextHistory(engine.character);
      ensureExclusionBuffer(engine.character);
      ensureEventMemory(engine.character);
      if (engine.character.genesisMeta) {
        delete engine.character.genesisMeta.forbiddenNote;
        delete engine.character.genesisMeta.forbiddenIds;
      }
      if (engine.character.tagRecords) {
        engine.character.tagsByCategory = tagsByCategory(engine.character);
      }
    }
    engine.clock = data.clock && engine.character
      ? rebuildClock(data.clock, engine.character)
      : (data.clock ? clone(data.clock) : null);
    if (engine.character && engine.clock) {
      const settlement = findSettlement(engine.character.cityId);
      engine.character.country = canonicalizeCountry(
        getSettlementCountry(settlement, engine.clock.year) || engine.character.country || "",
        engine.clock.year,
        engine.character.region || settlement?.region,
      );
      ensureChoiceMemory(engine.character, getLifeStage(snapshotTime(engine.clock, engine.character).ageYears).id);
    }
    engine.currentEvent = data.currentEvent ? clone(data.currentEvent) : null;
    engine.lastResult = data.lastResult ? clone(data.lastResult) : null;
    engine.journal = clone(data.journal || []);
    engine.gameOver = Boolean(data.gameOver);
    engine.ending = data.ending ? clone(data.ending) : null;
    if (engine.currentEvent && engine.character && engine.clock && !engine.gameOver) {
      const ctx = engine._context();
      ctx.weekEncounter = composeWeekEncounter(engine.rng, ctx);
      const locked = Boolean(
        engine.currentEvent.breakdown?.lockedTriad
        || engine.currentEvent.wealthCrisis?.lockedTriad
        || engine.currentEvent.kinCrisis?.lockedTriad
        || engine.currentEvent.school?.lockedTriad
        || engine.currentEvent.adult?.lockedTriad
        || engine.currentEvent.worldEvent?.lockedTriad
        || engine.currentEvent.figure?.lockedTriad
        || engine.currentEvent.turningPoint?.lockedTriad,
      );
      const reminted = locked
        ? remintLockedTriadText(engine.rng, engine.currentEvent.options || [], ctx)
        : mintTagDrivenTriad(engine.rng, ctx);
      engine.currentEvent = {
        ...engine.currentEvent,
        ...gateWeeklyOutput(engine.rng, {
          ...engine.currentEvent,
          options: reminted,
        }, ctx),
      };
    } else if (engine.currentEvent && engine.character && engine.clock) {
      engine.currentEvent = {
        ...engine.currentEvent,
        ...gateWeeklyOutput(engine.rng, engine.currentEvent, engine._context()),
      };
    }
    return engine;
  }

  _context() {
    const time = snapshotTime(this.clock, this.character);
    const settlement = findSettlement(this.character.cityId);
    const date = clockToDate(this.clock);
    const environment = currentEnvironmentTags(date, settlement || this.character);
    ensureLedger(this.character);
    syncLedgerTags(this.character);
    ensureChoiceMemory(this.character, getLifeStage(time.ageYears).id);
    ensureConstitution(this.character, settlement, time.year);
    return {
      character: this.character,
      time,
      settlement,
      date,
      environment,
      year: time.year,
      ageYears: time.ageYears,
      cityId: this.character.cityId,
      turnCount: this.turnCount,
      country: canonicalizeCountry(
        getSettlementCountry(settlement, time.year) || this.character.country || "",
        time.year,
        this.character.region || settlement?.region,
      ),
      ledger: this.character.ledger,
    };
  }

  _gainTags(tags) {
    if (!tags || !tags.length) return;
    for (const tag of tags) {
      addCharacterTag(this.character, typeof tag === "string"
        ? { id: tag, label: publicTagLabel({ id: tag }) || "事證", source: "event", category: tag.includes("_") ? undefined : "acquired" }
        : { ...tag, label: publicTagLabel(tag) || tag.label || "事證" });
    }
    if (this.character.tagRecords) {
      this.character.tagsByCategory = tagsByCategory(this.character);
    }
  }

  _pushJournal(title, text, applied) {
    const clean = scrubPublicText(text);
    if (!clean && !title) return;
    const last = this.journal[this.journal.length - 1];
    if (last && last.title === title && last.text === clean) return;
    this.journal.push({
      year: this.clock.year,
      month: this.clock.month,
      day: this.clock.day,
      iso: this.clock.iso,
      week: this.clock.week,
      turn: this.clock.turn,
      title: scrubPublicText(title) || title,
      text: clean,
      applied,
    });
    if (this.journal.length > 400) {
      this.journal.splice(0, this.journal.length - 400);
    }
  }

  _mortalityView() {
    const invoice = evaluateWeeklyMortality(this._context());
    return {
      weekly: invoice.weekly,
      annual: invoice.annual,
      band: invoice.band,
      yearBand: invoice.yearBand?.label || null,
      ageBand: invoice.ageBand?.label || null,
      ranked: (invoice.ranked || []).slice(0, 4),
      shocks: (invoice.shocks || []).map((row) => ({ id: row.id, label: row.label })),
      ageCoefficient: invoice.ageCoefficient ?? 1,
      ageCoefficientLabel: invoice.ageCoefficientLabel || null,
    };
  }

  _checkDeath(lastText) {
    const roll = rollWeeklySurvival(this.rng, this._context());
    if (!roll.dead) return null;
    const reason = roll.reason || "健康歸零";
    const detail = roll.cause === "collapse"
      ? (lastText || roll.detail)
      : roll.detail;
    return this._endGame(reason, detail);
  }

  _comingOfAge() {
    const time = snapshotTime(this.clock, this.character);
    const entered = enterSociety(this.character, time, this.rng);
    completeTurningPoint(this.character, "society_entry", { ...time, ageYears: time.ageYears, year: time.year });
    const detail = comingOfAgeText(this.character, time);
    this._pushJournal("步入社會", [detail, ...(entered.notes || [])].filter(Boolean).join(" "), {});
    this._gainTags(entered.applied || ["adult_society_entry"]);
    return {
      ok: true,
      gameOver: false,
      societyEntry: true,
      occupation: this.character.occupation,
      occupationId: this.character.occupationId || null,
    };
  }

  _endPlayWindow() {
    if (isTemporaryPlayCap()) {
      return this._endSessionClose();
    }
    return this._endLongevity();
  }

  _stampResolution(kind, { reason, detail, fatal }) {
    const time = snapshotTime(this.clock, this.character);
    const era = getEraForYear(time.year);
    const stage = getLifeStage(time.ageYears);
    const resolution = composeLifeResolution({
      character: this.character,
      time,
      kind,
      fatal,
      reason,
      detail,
      era,
      upheaval: this.character.upheavalState,
      eraCrisis: this._eraCrisis(),
      playAgeCap: effectivePlayAgeMax(),
      temporaryCap: isTemporaryPlayCap(),
    });
    const deathCtx = { ...this._context(), year: time.year, ageYears: time.ageYears };
    resolution.epitaph = gateDeathCopy(this.rng, resolution.epitaph, deathCtx);
    resolution.cause = monitorPublicText(this.rng, resolution.cause, deathCtx, { kind: "death" });
    this.gameOver = true;
    this.character.alive = !fatal;
    if (fatal) this.character.causeOfDeath = reason;
    this.ending = {
      kind,
      fatal,
      reason: resolution.cause,
      detail,
      year: time.year,
      ageYears: time.ageYears,
      epitaph: resolution.epitaph,
      resolution,
    };
    this.currentEvent = {
      id: kind === "death" ? "ending" : kind,
      year: time.year,
      month: time.month,
      day: time.day,
      iso: time.iso,
      week: time.week,
      turn: time.turn,
      ageYears: time.ageYears,
      era: { id: era.id, name: era.name, summary: era.summary, mood: era.mood },
      stage: { id: stage.id, label: stage.label },
      worldContext: null,
      narrative: resolution.epitaph,
      passiveEffects: {},
      options: [],
    };
    this._pushJournal(resolution.title, resolution.epitaph, {});
    const memento = composeMementoCard({
      character: this.character,
      time,
      ending: this.ending,
      resolution,
      seed: this.seed,
      turnCount: this.turnCount,
    });
    this.ending.memento = memento;
    writeHallCard(memento);
    this._persist();
    return {
      ok: true,
      gameOver: true,
      result: clone(this.lastResult),
      ending: clone(this.ending),
      state: this.getGameState(),
    };
  }

  _eraCrisis() {
    if (!this.character || !this.clock) {
      return { score: 0, level: "calm", pulses: [], shocks: [], matches: [], noHalo: true };
    }
    const time = snapshotTime(this.clock, this.character);
    const settlement = findSettlement(this.character.cityId);
    return evaluateEraCrisis({
      year: time.year,
      week: time.week,
      region: this.character.region,
      country: canonicalizeCountry(
        getSettlementCountry(settlement, time.year) || this.character.country || "",
        time.year,
        this.character.region || settlement?.region,
      ),
      familyClassId: this.character.familyClassId,
      tags: this.character.tags,
      character: this.character,
      settlement,
      geoBand: this.character.worldEventState?.geoBand,
    });
  }

  _persist() {
    writeLifeSave(this);
  }

  _endSessionClose() {
    return this._stampResolution("session_close", {
      fatal: false,
      reason: "",
      detail: "",
    });
  }

  _endLongevity() {
    return this._stampResolution("longevity", {
      fatal: false,
      reason: "",
      detail: "",
    });
  }

  _endGame(reason, detail) {
    return this._stampResolution("death", {
      fatal: true,
      reason,
      detail,
    });
  }

  _maybeMilestones(ageYears) {
    const tags = this.character.tags || [];
    const studious = tags.some((tag) => /勤學|study|math|school_/.test(String(tag)));
    const means = this.character.means ?? 50;
    const standing = this.character.ledger?.reputation ?? 50;
    if (ageYears >= 9 && this.character.education === "none") {
      completeTurningPoint(this.character, "first_school", { ageYears, year: this.clock?.year });
      this.character.education = "primary";
      this._gainTags(["acquired_school_primary", "入學"]);
    }
    if (ageYears === 18 && this.character.education === "primary" && (studious || means >= 38)) {
      this.character.education = "secondary";
      this._gainTags(["acquired_school_secondary", "中等學歷"]);
    }
    if (ageYears === 22 && ["primary", "secondary"].includes(this.character.education) && studious && means >= 44) {
      this.character.education = "university";
      this._gainTags(["acquired_school_university", "高等教育"]);
    }
    if (!this.character.married && ageYears >= 22 && ageYears <= 40 && standing >= 52 && this.rng() < 0.02) {
      this.character.married = true;
      this._gainTags(["acquired_married", "成家"]);
      this._pushJournal("成家", "你把生活的一部分正式交給另一個人。", {});
    }
    if (this.character.married && this.character.childrenCount < 3 && ageYears >= 23 && ageYears <= 42 && this.rng() < 0.01) {
      this.character.childrenCount += 1;
      this._pushJournal("添丁", `家裡多了一個孩子。現在有 ${this.character.childrenCount} 個。`, {});
    }

    if (this.character.occupation === "無" && ageYears >= 16) {
      const byClass = {
        peasant: "務農",
        artisan: "學徒/匠人",
        worker: "工人",
        merchant: "幫鋪/跑商",
        intellectual: "讀書/教職",
        official: "文書",
        military: "行伍",
        gentry: "家業打理",
        immigrant: "雜工",
      };
      this.character.occupation = byClass[this.character.familyClassId] || "謀生";
    }
  }
}

export default GameEngine;
