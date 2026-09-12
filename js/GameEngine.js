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
import { addCharacterTag, tagsByCategory, visibleTagIds } from "./tag-system.js";
import { socialStanding } from "./social-feedback.js";
import { SHOW_REPUTATION_UI } from "./data/ui-config.js";
import { publicTagLabel } from "./data/ui-zh.js";
import { createRng, randomSeed } from "./rng.js";
import { syncMoodTags } from "./mood-engine.js";
import { findSettlement } from "./settlements.js";
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
} from "./time.js";

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
    tickLifeProgress(this.character, {
      ageYears: PLAY_AGE_MIN,
      year: this.clock.year,
      time: this.clock,
      character: this.character,
    });
    const openingDeath = this._checkDeath("五歲剛能自己走路的那兩週，高燒、腹瀉或飢餓把性命收走了。");
    if (openingDeath) return openingDeath.state;
    this.currentEvent = generateTurn(this.rng, this._context());
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
      }),
      social: socialStanding(this.character.ledger),
      pressure: crisisPressure(this.character.ledger, {
        upheavalScore: this.character.upheavalState?.score || 0,
        worldPressure: this.character.worldEventState?.pressure || 0,
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
        untaggedBaseline: true,
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
      },
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
      return { ...blocked, nextEvent: publicEventView(clone(this.currentEvent)) };
    }
    rememberChosenChoice(this.character, option, getLifeStage(ctx.ageYears || 0).id);
    if (option.turningPointId) {
      completeTurningPoint(this.character, option.turningPointId, ctx);
      const point = TURNING_POINTS[option.turningPointId];
      if (point?.journal) this._pushJournal(point.title, point.journal, {});
      if (point?.addTags?.length) this._gainTags(point.addTags);
    }

    const decay = weeklyConsequenceTick(this.character, ctx.time);
    const resolved = resolveOption(this.rng, option, this.character);
    const combinedEffects = { ...event.passiveEffects };
    for (const [key, value] of Object.entries(resolved.effects)) {
      combinedEffects[key] = (combinedEffects[key] || 0) + value;
    }

    applyHiddenOutcome(this.character, resolved.hidden, ctx.time);
    const appliedBundle = applyEffects(this.character.stats, combinedEffects, this.character, ctx.time);
    this.character.stats = appliedBundle.stats;
    const karma = applyChoiceConsequences(this.rng, this.character, option, ctx.time);
    const trauma = applyTrauma(this.character, option.trauma, ctx.time);
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
      followUpText: scrubPublicText([resolved.followUpText, ...moodNotes, ...ledgerNotes].filter(Boolean).join(" ")),
      effects: combinedEffects,
      applied: appliedBundle.applied,
      tagsGained: [
        ...(resolved.addTags || []),
        ...(karma.addTags || []),
        ...((moodSync.changed || []).filter((item) => item.action === "add").map((item) => item.tag)),
        ...((karma.tagsChanged || []).filter((item) => item.action === "add").map((item) => item.tag)),
        ...((trauma.applied || []).map((item) => item.id)),
        ...(school.applied || []),
        ...(schoolWeek.addTags || []),
        ...(caste.applied || []),
        ...(adult.applied || []),
        ...(adultWeek.addTags || []),
        ...(world.applied || []),
        ...(worldWeek.addTags || []),
        ...(figure.applied || []),
        ...(historyWeek.addTags || []),
      ],
      tagsLost: [
        ...(moodSync.changed || []).filter((item) => item.action === "remove").map((item) => item.tag),
        ...(karma.tagsChanged || []).filter((item) => item.action === "remove").map((item) => item.tag),
      ],
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
    this.currentEvent = generateTurn(this.rng, this._context());

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
    engine.character = data.character;
    if (engine.character) {
      ensureLedger(engine.character);
      ensureTraumaState(engine.character);
      ensureSchoolState(engine.character);
      ensureCasteState(engine.character);
      ensureCareerState(engine.character);
      ensureWorldEventState(engine.character);
      ensureHistoryState(engine.character);
    }
    engine.clock = data.clock;
    engine.currentEvent = data.currentEvent;
    engine.lastResult = data.lastResult;
    engine.journal = data.journal || [];
    engine.turnCount = data.turnCount || 0;
    engine.gameOver = data.gameOver || false;
    engine.ending = data.ending || null;
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
      ageYears: time.ageYears,
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
      playAgeCap: effectivePlayAgeMax(),
      temporaryCap: isTemporaryPlayCap(),
    });
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
    return {
      ok: true,
      gameOver: true,
      result: clone(this.lastResult),
      ending: clone(this.ending),
      state: this.getGameState(),
    };
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
