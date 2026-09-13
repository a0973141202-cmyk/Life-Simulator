import { filterActionsByBoundary } from "./boundary.js";
import { ageBand, classifyLane, incidentAllowed } from "./age-gate.js";
import { childhoodClimate } from "./early-child-filter.js";
import { scanSemanticMismatches } from "./semantic-filter.js";
import { applyChaosToTriad, pickChaosProfile } from "./chaos-engine.js";
import { STAT_KEYS, clampStat, getLifeStage } from "./constants.js";
import { attachLifeProgress } from "./life-stage-manager.js";
import { canonicalizeEffects, canonicalizeStats } from "./stat-canon.js";
import { crisisPressure } from "./consequence-engine.js";
import {
  eraPlaceAllows,
  eventWeight,
  meetsPrerequisites,
  sieveWeeklyEvents,
} from "./event-engine.js";
import { getActiveHistory, getEraForYear, findCity } from "./data.js";
import { currentEnvironmentTags } from "./data/seasons.js";
import { makeDate } from "./data/calendar.js";
import { dressOption } from "./hint-engine.js";
import { modifyResolutionForTrauma } from "./trauma-engine.js";
import {
  consumeBreakdownLock,
  pickBreakdownIncident,
  renderBreakdownIncident,
} from "./mental-breakdown-engine.js";
import {
  canMintWealthStake,
  consumeWealthLock,
  mintWealthStakeOption,
  pickWealthCrisis,
  renderWealthCrisis,
} from "./wealth-engine.js";
import {
  canMintKinBond,
  consumeKinLock,
  kinVoiceMeta,
  mintKinBondOption,
  pickKinCrisis,
  renderKinCrisis,
} from "./npc-social-engine.js";
import { attachEraCrisis } from "./history-crisis-engine.js";
import { applyHiddenOutcome, ensureLedger } from "./ledger.js";
import { collectDailyActions, pickDailyTexture, rememberDailyState } from "./daily-engine.js";
import { modifyResolutionForSchool, pickSchoolIncident, renderSchoolIncident } from "./school-engine.js";
import { modifyResolutionForCaste } from "./perp-caste-engine.js";
import { modifyResolutionForAdult, pickAdultIncident, renderAdultIncident } from "./adult-engine.js";
import { attachWorldContext, modifyResolutionForWorld, pickWorldEvent, renderWorldEvent } from "./world-event-engine.js";
import { finalizeWorldIncident, evaluateIndustryImpact } from "./world-impact-engine.js";
import { applyCausalShockBias } from "./causal-feedback-engine.js";
import { attachUpheaval, publicUpheavalView } from "./upheaval-engine.js";
import {
  figuresPresent,
  figureEncounterChance,
  modifyResolutionForFigure,
  narrativePulseAllowed,
  pickFigureEncounter,
  renderFigureEncounter,
  tickHistory,
} from "./history-engine.js";
import { bindEncounterToOption, composeWeekEncounter } from "./week-encounter.js";
import { gateWeeklyOutput } from "./text-monitor.js";
import { evaluateWeeklyMortality } from "./mortality-engine.js";
import { chance, pick, randInt } from "./rng.js";
import { findSettlement, getSettlementCountry } from "./settlements.js";
import { canonicalizeCountry } from "./data/polity.js";
import { uniqueTags } from "./tag-system.js";
import { describeSocialFeedback } from "./social-feedback.js";
import { scrubPublicText } from "./data/public-text.js";
import { assembleWeeklyChronicle, chronicleStageLine, chronicleSituationLine, scanNarrativeFacts } from "./chronicle-voice.js";
import { composeFollowBeat, composeHistoryPulse, composeLiveFollowUp, composeStageClause, composeStatusRecord, scrubEraCopy } from "./dynamic-prose.js";
import { isMemeLegendCharacter } from "./meme-chronicle.js";
import { consumeOpeningWeekLead } from "./opening-chronicle.js";
import { eventOutline, rememberTriggeredMany } from "./event-memory.js";
import { beginTextTurn, filterFreshByText, rememberTextSnippet } from "./text-history.js";
import { maybeVaryChoice } from "./narrative-variator.js";
import { attachLifeContext, contextAllowsOption } from "./life-context.js";
import { beginExclusionTurn, optionExcluded, rememberExcluded } from "./exclusion-buffer.js";
import { composeExclusiveFill } from "./exclusive-fill.js";
import { ensureDistinctChoiceTriad } from "./choice-dedupe.js";
import { textsTooSimilar } from "./choice-similarity.js";
import { mintTagDrivenTriad, remintLockedTriadText } from "./tag-choice-mint.js";
import { attachOrganicContext } from "./organic-trigger.js";
import { ensureTagCoverage, graftAsymmetricOptions } from "./tag-link-engine.js";
import { isUntaggedBaseline, stampTagInfluence } from "./tag-influence.js";
import {
  collectCtxTags,
  ensureChoiceMemory,
  rememberOfferedChoices,
  stampChoiceFingerprint,
} from "./choice-pool.js";

function jitterEffects(rng, effects) {
  const result = {};
  for (const [key, value] of Object.entries(effects || {})) {
    if (!STAT_KEYS.includes(key) || value === 0) {
      result[key] = value;
      continue;
    }
    const drift = randInt(rng, -1, 1);
    result[key] = value + drift;
  }
  return result;
}

function cloneOption(rng, action, index, ctx = {}) {
  stampTagInfluence(action, ctx, rng);
  return {
    index,
    id: action.id,
    text: action.text,
    effects: jitterEffects(rng, action.effects),
    followUps: [],
    addTags: action.addTags ? action.addTags.slice() : [],
    risk: action.risk ? { ...action.risk, effects: { ...action.risk.effects } } : null,
    hooks: action.hooks ? action.hooks.slice() : (action.when?.hooksAny || []).slice(),
    sandbox: Boolean(action.sandbox),
    crisis: Boolean(action.crisis),
    path: action.path || null,
    domain: action.domain || null,
    consequence: action.consequence ? { ...action.consequence } : null,
    attempt: action.attempt ? JSON.parse(JSON.stringify(action.attempt)) : null,
    ending: action.ending ? { ...action.ending } : null,
    when: action.when ? { ...action.when } : {},
    flags: action.flags ? action.flags.slice() : [],
    daily: Boolean(action.daily),
    lane: action.lane || classifyLane(action),
    childTheme: action.childTheme || null,
    lifeState: action.lifeState || null,
    phase: action.phase || null,
    trauma: action.trauma ? { ...action.trauma, tags: (action.trauma.tags || []).slice() } : null,
    traumaVictim: Boolean(action.traumaVictim || action.trauma),
    traumaNonsexual: action.traumaNonsexual !== false,
    breakdownIncident: Boolean(action.breakdownIncident),
    breakdownIncidentId: action.breakdownIncidentId || null,
    schoolIncident: Boolean(action.schoolIncident),
    schoolIncidentId: action.schoolIncidentId || null,
    schoolKind: action.schoolKind || null,
    schoolPeerHarm: Boolean(action.schoolPeerHarm),
    schoolNonsexual: action.schoolNonsexual !== false,
    affectChoice: Boolean(action.affectChoice),
    stance: action.stance || null,
    perpetrator: Boolean(action.perpetrator),
    dark: Boolean(action.dark),
    caste: action.caste ? { ...action.caste, tags: (action.caste.tags || []).slice() } : null,
    perpCasteEcology: Boolean(action.perpCasteEcology || action.caste),
    noSexualMinorActs: action.noSexualMinorActs !== false,
    adultIncident: Boolean(action.adultIncident),
    adultIncidentId: action.adultIncidentId || null,
    adultKind: action.adultKind || null,
    adultSector: action.adultSector || null,
    occupationId: action.occupationId || null,
    crisisDelta: action.crisisDelta || 0,
    burnoutDelta: action.burnoutDelta || 0,
    worldEvent: Boolean(action.worldEvent),
    worldEventId: action.worldEventId || null,
    worldKind: action.worldKind || null,
    worldLock: action.worldLock || null,
    worldNonsexual: action.worldNonsexual !== false,
    figureEncounter: Boolean(action.figureEncounter),
    figureEncounterId: action.figureEncounterId || null,
    figureKind: action.figureKind || null,
    figureId: action.figureId || null,
    figureName: action.figureName || null,
    figureStatus: action.figureStatus || null,
    figureNonsexual: action.figureNonsexual !== false,
    butterfly: action.butterfly ? { ...action.butterfly } : null,
    relation: action.relation || null,
    direction: action.direction || null,
    riskBand: action.riskBand || null,
    situation: action.situation || null,
    tagDriven: Boolean(action.tagDriven),
    tagLink: Boolean(action.tagLink),
    asymmetric: action.asymmetric || null,
    interveningTags: (action.interveningTags || []).slice(0, 3),
    tagInfluenceCount: Math.min(3, action.tagInfluenceCount || (action.interveningTags || []).length || 0),
    tagInfluenceCapped: Boolean(action.tagInfluenceCapped),
    exclusiveFill: Boolean(action.exclusiveFill),
    liveFollowUp: action.liveFollowUp || "",
    liveTagMint: Boolean(action.liveTagMint),
    liveWorldMint: Boolean(action.liveWorldMint),
    dynamicWorldMint: Boolean(action.dynamicWorldMint),
    industryPolarity: action.industryPolarity || null,
    industrySector: action.industrySector || null,
    worldThreads: action.worldThreads ? action.worldThreads.slice() : (action.threads || []).slice(),
    threads: action.threads ? action.threads.slice() : [],
    zeroHardcodedTemplates: Boolean(action.zeroHardcodedTemplates),
    driverTags: (action.driverTags || []).slice(),
    wealthStake: Boolean(action.wealthStake),
    stakeCash: action.stakeCash || null,
    stakeChance: action.stakeChance || null,
    kinBond: Boolean(action.kinBond),
    kinCrisis: Boolean(action.kinCrisis),
    wealthCrisis: Boolean(action.wealthCrisis),
    untaggedBaseline: Boolean(action.untaggedBaseline || isUntaggedBaseline(action)),
    organic: action.organic || null,
    organicContexts: action.organicContexts ? action.organicContexts.slice() : (action.when?.organicContexts || []).slice(),
    valence: action.valence || null,
  };
}

function statusLine(stats, tags, ledger, ctx = {}) {
  ctx.stats = ctx.stats || stats;
  ctx.tags = ctx.tags || tags;
  const body = composeStatusRecord(() => 0.41, ctx);
  const social = describeSocialFeedback(ledger || {}, {
    salt: (stats.health || 0) + (stats.sanity || 0) * 2,
    upheaval: ctx.upheaval,
    ctx,
  });
  return [body, social].filter(Boolean).join("\n");
}

function sliceOfLife(rng, stage, era, ctx = {}) {
  ctx.stage = ctx.stage || stage;
  if (isMemeLegendCharacter(ctx.character)) return "";
  const line = chronicleStageLine(rng, ctx);
  if (line && !scanSemanticMismatches(line, ctx).length) return line;
  return "";
}

export function applyEffects(stats, effects, character = null, time = {}) {
  const canon = canonicalizeEffects(effects);
  const next = canonicalizeStats(stats);
  const applied = {};
  for (const key of STAT_KEYS) {
    const delta = canon.stats[key] || 0;
    if (!delta) continue;
    const before = next[key];
    next[key] = clampStat(key, before + delta);
    applied[key] = next[key] - before;
  }
  if (character) {
    applyHiddenOutcome(character, canon.hidden, time);
    character.stats = next;
  }
  return { stats: next, applied, hidden: canon.hidden };
}

export function weeklyPassive(rng, ctx) {
  const effects = {};
  const notes = [];

  if (ctx.ageYears >= 50 && chance(rng, 0.12 + (ctx.ageYears - 50) * 0.004)) {
    effects.health = (effects.health || 0) - 1;
    notes.push(chronicleSituationLine(rng, ctx));
  }
  if (ctx.ageYears >= 75 && chance(rng, 0.18)) {
    effects.health = (effects.health || 0) - 1;
  }
  if (ctx.stats.sanity <= 20 && chance(rng, 0.2)) {
    effects.health = (effects.health || 0) - 1;
    notes.push(chronicleSituationLine(rng, ctx));
  }
  if (ctx.stats.health <= 20 && chance(rng, 0.15)) {
    effects.sanity = (effects.sanity || 0) - 1;
  }

  const history = getActiveHistory(ctx.year, ctx.week, ctx.region)
    .filter((event) => narrativePulseAllowed(event.id, ctx.character?.historyState));
  const pulse = history.length ? pick(rng, history) : null;
  if (pulse) {
    const bias = pulse.classBias?.[ctx.familyClassId] || 0;
    const intensity = 1 + Math.min(2, bias);
    for (const [key, value] of Object.entries(pulse.effects || {})) {
      effects[key] = (effects[key] || 0) + value * intensity;
    }
    const dossier = ctx.character?.openingDossier;
    const alreadyTold = dossier && !dossier.weekConsumed && (dossier.pulseId === pulse.id || dossier.pulseTitle === pulse.title);
    if (alreadyTold) {
      dossier.pulseNarrated = true;
    } else {
      notes.push(composeHistoryPulse(rng, pulse, ctx));
    }
  }

  const current = ctx.currentTags || [];
  const hardyCold = (ctx.tags || []).some((tag) => tag === "trait_polar_thermogenesis" || tag === "ethnicity_inuit" || tag === "ethnicity_sami" || tag === "ethnicity_yakut");
  if (current.includes("current_env_extreme_cold") && chance(rng, hardyCold ? 0.06 : 0.2)) {
    effects.health = (effects.health || 0) - 1;
    notes.push(chronicleSituationLine(rng, ctx));
  }
  if (current.includes("current_env_extreme_heat") && chance(rng, 0.16)) {
    effects.mood = (effects.mood || 0) - 1;
    notes.push(chronicleSituationLine(rng, ctx));
  }
  if (current.includes("current_env_monsoon") && chance(rng, 0.12)) {
    effects.health = (effects.health || 0) - 1;
    notes.push(chronicleSituationLine(rng, ctx));
  }
  if (current.includes("current_env_polar_night") && chance(rng, 0.14)) {
    effects.mood = (effects.mood || 0) - 1;
    notes.push(chronicleSituationLine(rng, ctx));
  }

  const childClimate = childhoodClimate(ctx);
  if (childClimate.age <= 6 && childClimate.harsh && chance(rng, childClimate.famine || childClimate.wartime ? 0.55 : 0.38)) {
    effects.health = (effects.health || 0) - 1;
    ctx.childClimate = childClimate;
    notes.push(chronicleSituationLine(rng, ctx));
  }

  return { effects, notes, historyPulse: pulse };
}

export function generateTurn(rng, state) {
  const { character, time } = state;
  const city = findCity(character.cityId);
  const settlement = findSettlement(character.cityId) || city;
  const era = getEraForYear(time.year);
  const stage = getLifeStage(time.ageYears);
  const date = state.date || (time.month && time.day
    ? makeDate(time.year, time.month, time.day)
    : makeDate(time.year, 1, Math.min(28, ((time.week || 1) - 1) % 28 + 1)));
  const environment = state.environment || currentEnvironmentTags(date, settlement || character);
  const ledger = ensureLedger(character);
  let pressure = crisisPressure(ledger);
  const ctx = {
    year: time.year,
    month: time.month || date.month,
    day: time.day || date.day,
    iso: time.iso || date.iso,
    week: time.week,
    turn: time.turn || date.turn,
    ageYears: time.ageYears,
    region: character.region,
    country: canonicalizeCountry(
      getSettlementCountry(settlement, time.year) || character.country || "",
      time.year,
      character.region || settlement?.region,
    ),
    cityId: character.cityId,
    familyClassId: character.familyClassId,
    tags: uniqueTags([...(character.tags || []), ...(environment.tags || [])]),
    natalTags: character.tags || [],
    currentTags: environment.tags || [],
    hooks: character.bloodline?.hooks || [],
    stats: character.stats,
    stage,
    character,
    environment,
    ledger,
    pressure,
    settlement,
  };

  beginTextTurn(character, ctx);
  beginExclusionTurn(character);
  ctx.weekEntropy = rng();
  ctx.noOptionRecycling = true;
  ctx.exclusiveOptions = true;
  ctx.contextAwareRandom = true;
  ctx.dynamicOnTheFly = true;
  ctx.zeroHardcodedTemplates = true;
  ctx.tagDrivenOnly = true;
  ctx.liveTagMint = true;
  ctx.liveChoiceMint = true;
  ctx.contextualIntro = true;
  ctx.figureWeave = true;
  ctx.encounterDrivenChoices = true;
  const mortalityInvoice = evaluateWeeklyMortality(ctx);
  ctx.mortality = mortalityInvoice;
  attachWorldContext(ctx);
  attachUpheaval(ctx);
  attachEraCrisis(ctx);
  ctx.industryImpact = evaluateIndustryImpact(ctx, {
    threads: ctx.upheaval?.threads || [],
  });
  applyCausalShockBias(ctx.character, ctx.year ?? ctx.time?.year, ctx.historyIds || []);
  pressure = crisisPressure(ledger, {
    upheavalScore: ctx.upheaval?.score || 0,
    worldPressure: character.worldEventState?.pressure || 0,
    eraCrisis: ctx.eraCrisis?.score || 0,
    sanityGap: Math.max(0, 40 - (character.stats?.sanity ?? 50)),
    wealthGap: character.wealth ? Math.max(0, 40 - (character.means ?? 40)) : 0,
    kinGap: character.npcNetwork?.pendingCrisis ? 14 : (character.tags || []).includes("kin_orphan") ? 20 : 0,
  });
  ctx.pressure = pressure;
  ctx.tags = collectCtxTags(ctx);
  attachOrganicContext(ctx);
  attachLifeContext(ctx);
  ctx.narrativeFacts = scanNarrativeFacts(ctx);
  ctx.kinVoice = kinVoiceMeta(character, ctx);
  ctx.figuresPresent = figuresPresent(ctx);
  ctx.figureWeaveChance = figureEncounterChance(ctx);
  attachLifeProgress(ctx);
  ctx.childClimate = childhoodClimate(ctx);
  tickHistory(character, { year: time.year, iso: time.iso });
  const memory = ensureChoiceMemory(character, stage.id);

  const dailyTexture = pickDailyTexture(rng, ctx, 3);
  rememberDailyState(character, dailyTexture);

  ctx.getWeight = eventWeight;
  const sieved = sieveWeeklyEvents(ctx, collectDailyActions());
  const matched = sieved.matched;
  const loose = sieved.loose;
  const fallbacks = sieved.fallbacks;
  const chaosProfile = pickChaosProfile(rng);
  const acceptLocked = (incident) => {
    if (!incident?.options || incident.options.length < 3) return null;
    if (!incidentAllowed(incident, ctx)) return null;
    const isLiveWorld = Boolean(
      incident.dynamicWorldMint
      || incident.options.every((row) => row.liveWorldMint || row.dynamicWorldMint),
    );
    if (!isLiveWorld && optionExcluded(character, incident.id, incident.fact || incident.id)) return null;
    if (!eraPlaceAllows(incident, ctx)) return null;
    // Live world mint already passed industry/era gates — do not drop via catalog boundary filters.
    if (isLiveWorld) {
      return { ...incident, options: incident.options.slice(0, 3) };
    }
    if (!contextAllowsOption({
      text: [incident.fact, incident.title, incident.procedure].filter(Boolean).join("\n"),
      hooks: incident.hooks,
    }, ctx)) return null;
    const grafted = graftAsymmetricOptions(rng, ctx, incident);
    const { kept: optionKept } = filterActionsByBoundary(grafted.options, ctx);
    const exclusiveKept = optionKept.filter((option) => (
      meetsPrerequisites(option, ctx)
      && !optionExcluded(character, option.id, option.text)
    ));
    if (exclusiveKept.length < 3) {
      const { kept: originalKept } = filterActionsByBoundary(incident.options, ctx);
      const originalExclusive = originalKept.filter((option) => (
        meetsPrerequisites(option, ctx)
        && !optionExcluded(character, option.id, option.text)
      ));
      if (originalExclusive.length < 3) return null;
      return { ...incident, options: originalExclusive.slice(0, 3) };
    }
    return { ...grafted, options: exclusiveKept.slice(0, 3) };
  };
  const acceptBreakdown = (incident) => {
    if (!incident?.options || incident.options.length < 3) return null;
    if (!incidentAllowed(incident, ctx)) return null;
    if (!eraPlaceAllows(incident, ctx)) return null;
    const { kept } = filterActionsByBoundary(incident.options, ctx);
    const playable = kept.filter((option) => meetsPrerequisites(option, ctx));
    if (playable.length < 3) return null;
    return { ...incident, options: playable.slice(0, 3) };
  };
  const breakdownRaw = pickBreakdownIncident(rng, ctx);
  const breakdown = acceptBreakdown(breakdownRaw);
  const breakdownLocked = Boolean(breakdown);
  if (breakdownLocked) consumeBreakdownLock(character, breakdown, ctx.turnCount || 0);
  const wealthRaw = breakdownLocked ? null : pickWealthCrisis(rng, ctx);
  const wealthCrisis = wealthRaw && wealthRaw.options?.length >= 3 ? wealthRaw : null;
  const wealthLocked = Boolean(wealthCrisis);
  if (wealthLocked) consumeWealthLock(character, wealthCrisis, ctx.turnCount || 0);

  // Evidence: kin/breakdown always blocked world picks. Prefer world when upheaval/industry is live.
  const upheavalPrefersWorld = (ctx.upheaval?.tier || 0) >= 1
    || (ctx.industryImpact && ctx.industryImpact.polarity !== "neutral");
  const worldCrisisRawPreferred = (breakdownLocked || wealthLocked || !upheavalPrefersWorld)
    ? null
    : pickWorldEvent(rng, ctx, { lock: "crisis" });
  const worldCrisisPreferredFinal = worldCrisisRawPreferred
    ? finalizeWorldIncident(rng, worldCrisisRawPreferred, ctx)
    : null;
  let worldCrisis = acceptLocked(worldCrisisPreferredFinal);

  const kinRaw = (breakdownLocked || wealthLocked || worldCrisis) ? null : pickKinCrisis(rng, ctx);
  const kinCrisis = kinRaw && kinRaw.options?.length >= 3 ? kinRaw : null;
  const kinLocked = Boolean(kinCrisis);
  if (kinLocked) consumeKinLock(character, kinCrisis, ctx.turnCount || 0);

  const worldCrisisRaw = (breakdownLocked || wealthLocked || kinLocked || worldCrisis)
    ? null
    : pickWorldEvent(rng, ctx, { lock: "crisis" });
  const worldCrisisFinal = worldCrisisRaw ? finalizeWorldIncident(rng, worldCrisisRaw, ctx) : null;
  if (!worldCrisis) worldCrisis = acceptLocked(worldCrisisFinal);
  const worldCrisisLocked = Boolean(worldCrisis);
  const hardLock = breakdownLocked || wealthLocked || kinLocked;
  const turningPoint = !hardLock && !worldCrisisLocked && ctx.dueTurningPoint?.options?.length >= 3
    ? {
      ...ctx.dueTurningPoint,
      options: ctx.dueTurningPoint.options.map((row) => ({ ...row, turningPoint: true })),
      lock: "turning_point",
    }
    : null;
  const turningLocked = Boolean(turningPoint);
  const figureIncidentRaw = (hardLock || worldCrisisLocked || turningLocked) ? null : pickFigureEncounter(rng, ctx);
  const figureIncident = acceptLocked(figureIncidentRaw);
  const figureCrisisLocked = Boolean(figureIncident && figureIncident.lock !== "scene");
  const adultIncident = acceptLocked(
    (hardLock || worldCrisisLocked || turningLocked || figureCrisisLocked) ? null : pickAdultIncident(rng, ctx),
  );
  const adultLocked = Boolean(adultIncident);
  const schoolIncident = acceptLocked(
    (hardLock || worldCrisisLocked || turningLocked || figureCrisisLocked || adultLocked) ? null : pickSchoolIncident(rng, ctx),
  );
  const schoolLocked = Boolean(schoolIncident);
  const worldSceneRaw = (hardLock || worldCrisisLocked || turningLocked || figureCrisisLocked || adultLocked || schoolLocked)
    ? null
    : pickWorldEvent(rng, ctx, { lock: "scene" });
  const worldScene = acceptLocked(
    worldSceneRaw ? finalizeWorldIncident(rng, worldSceneRaw, ctx) : null,
  );
  const worldSceneLocked = Boolean(worldScene);
  const figureSceneLocked = Boolean(
    !hardLock && !worldCrisisLocked && !turningLocked && !figureCrisisLocked && !adultLocked && !schoolLocked && !worldSceneLocked
    && figureIncident?.lock === "scene",
  );
  const worldIncident = worldCrisisLocked ? worldCrisis : (worldSceneLocked ? worldScene : null);
  const worldLocked = Boolean(worldIncident);
  const figureLocked = figureCrisisLocked || figureSceneLocked;
  const factLocked = hardLock || worldCrisisLocked || turningLocked || figureCrisisLocked || adultLocked || schoolLocked || worldSceneLocked || figureSceneLocked;
  const lockedIncident = breakdownLocked
    ? breakdown
    : wealthLocked
      ? wealthCrisis
    : kinLocked
      ? kinCrisis
    : worldCrisisLocked
    ? worldCrisis
    : turningLocked
      ? turningPoint
      : figureCrisisLocked
        ? figureIncident
        : adultLocked
          ? adultIncident
          : schoolLocked
            ? schoolIncident
            : worldSceneLocked
              ? worldScene
              : figureIncident;

  // Catalog sieve still runs for crisis locks / organic context; player triad text is never drawn from it.
  ensureTagCoverage(rng, ctx, [], matched);
  void loose;
  void fallbacks;

  ctx.tagDrivenOnly = true;
  ctx.zeroHardcodedTemplates = true;
  ctx.liveTagMint = true;

  const sourceActions = factLocked ? lockedIncident.options : [];
  const liveWorldOptions = (sourceActions || []).filter((row) => row.liveWorldMint || row.dynamicWorldMint);
  let lockedKept;
  if (worldLocked && liveWorldOptions.length >= 3) {
    lockedKept = liveWorldOptions.slice(0, 3);
  } else {
    const filtered = filterActionsByBoundary(
      (sourceActions || []).filter((option) => (
        meetsPrerequisites(option, ctx)
        && !optionExcluded(character, option.id, option.text)
      )),
      ctx,
    );
    lockedKept = filtered.kept;
  }
  const useLock = factLocked && lockedKept.length >= 3;
  let sourcePool;
  if (useLock) {
    // World incidents already carry live industry-minted options — do not overwrite with generic remint.
    if (worldLocked && lockedKept.every((row) => row.liveWorldMint || row.dynamicWorldMint)) {
      sourcePool = lockedKept.slice(0, 3);
    } else {
      // Replace catalog option mechanics with live tag mint; keep only lock linkage flags.
      const live = mintTagDrivenTriad(rng, ctx);
      sourcePool = live.slice(0, 3).map((opt, index) => {
        const locked = lockedKept[index] || {};
        return {
          ...opt,
          breakdownIncident: Boolean(locked.breakdownIncident),
          breakdownIncidentId: locked.breakdownIncidentId || null,
          kinCrisis: Boolean(locked.kinCrisis),
          wealthCrisis: Boolean(locked.wealthCrisis),
          schoolIncident: Boolean(locked.schoolIncident),
          adultIncident: Boolean(locked.adultIncident),
          figureEncounter: Boolean(locked.figureEncounter),
          worldEvent: Boolean(locked.worldEvent || worldLocked),
          worldEventId: locked.worldEventId || (worldLocked ? worldIncident?.id : null),
          worldKind: locked.worldKind || (worldLocked ? worldIncident?.kind : null),
          zeroHardcodedTemplates: true,
          liveTagMint: true,
          id: `live_${locked.id || opt.id}`,
        };
      });
    }
  } else {
    sourcePool = mintTagDrivenTriad(rng, ctx);
    if (canMintWealthStake(ctx) && sourcePool.length >= 3) {
      const stake = mintWealthStakeOption(rng, ctx, 2);
      sourcePool[2] = {
        ...sourcePool[2],
        ...stake,
        text: stake.text,
        trueText: stake.trueText || stake.text,
        tagDriven: true,
        liveTagMint: true,
        zeroHardcodedTemplates: true,
        driverTags: [...new Set([...(sourcePool[2].driverTags || []), "wealth_climber", ...(stake.driverTags || [])])],
      };
    } else if (canMintKinBond(ctx) && sourcePool.length >= 3 && rng() < 0.42) {
      const bond = mintKinBondOption(rng, ctx, 1);
      if (bond) {
        sourcePool[1] = {
          ...sourcePool[1],
          ...bond,
          text: bond.text,
          trueText: bond.trueText || bond.text,
          tagDriven: true,
          liveTagMint: true,
          zeroHardcodedTemplates: true,
          driverTags: [...new Set([...(sourcePool[1].driverTags || []), "kin_bonded", ...(bond.driverTags || [])])],
        };
      }
    }
  }
  const freshSource = useLock ? sourcePool : filterFreshByText(sourcePool, character, (row) => row.text);
  ctx.lockedFigure = useLock && figureLocked ? figureIncident : null;
  ctx.weekEncounter = composeWeekEncounter(rng, ctx);
  const seedOptions = ensureDistinctChoiceTriad(
    rng,
    (freshSource.length ? freshSource : sourcePool).slice(0, 3),
    ctx,
  );
  while (seedOptions.length < 3) {
    const fill = mintTagDrivenTriad(rng, ctx)[seedOptions.length]
      || composeExclusiveFill(rng, ctx, seedOptions, character, seedOptions.length);
    if (!fill) break;
    seedOptions.push({
      ...fill,
      tagDriven: true,
      liveTagMint: true,
      zeroHardcodedTemplates: true,
    });
  }
  const usedTexts = [];
  const exclusiveRaw = [];
  for (let index = 0; index < 3; index += 1) {
    let option = stampChoiceFingerprint(cloneOption(rng, seedOptions[index], index, ctx));
    // Never overwrite tag-minted display copy with encounter binders.
    if (!option.liveTagMint) {
      option = maybeVaryChoice(rng, option, ctx, index);
      option = bindEncounterToOption(rng, option, ctx, ctx.weekEncounter, index, usedTexts);
    } else if (ctx.weekEncounter?.figure) {
      option = {
        ...option,
        encounterBound: true,
        figureEncounter: Boolean(option.figureEncounter || ctx.weekEncounter.figure),
        figureId: option.figureId || ctx.weekEncounter.figure?.id || null,
        figureName: option.figureName || ctx.weekEncounter.figure?.name || null,
      };
    }
    let text = option?.trueText || option?.text || "";
    let guard = 0;
    while (
      guard < 12
      && (
        !text
        || usedTexts.some((row) => textsTooSimilar(row, text))
        || optionExcluded(character, option?.id, text)
      )
    ) {
      const refill = mintTagDrivenTriad(rng, { ...ctx, weekEntropy: rng() })[index]
        || composeExclusiveFill(rng, ctx, exclusiveRaw, character, index + guard * 3);
      option = stampChoiceFingerprint(cloneOption(rng, {
        ...option,
        ...refill,
        text: refill?.text,
        trueText: refill?.trueText || refill?.text,
        liveTagMint: true,
        tagDriven: true,
        zeroHardcodedTemplates: true,
      }, index + guard * 3, ctx));
      text = option?.trueText || option?.text || "";
      guard += 1;
    }
    exclusiveRaw.push({
      ...option,
      tagDriven: true,
      liveTagMint: true,
      zeroHardcodedTemplates: true,
      untaggedBaseline: false,
    });
    usedTexts.push(option.trueText || option.text);
  }
  const chaotic = useLock
    ? exclusiveRaw.map((option, index) => ({ ...option, chaosSlot: "fact", index }))
    : applyChaosToTriad(rng, exclusiveRaw, chaosProfile, ctx);
  const dressedOptions = chaotic.map((option) => {
    const dressed = stampChoiceFingerprint(dressOption(rng, option, ctx, chaosProfile));
    const facts = ctx.narrativeFacts;
    if (!facts) return dressed;
    return {
      ...dressed,
      text: scrubEraCopy(dressed.text, facts),
      trueText: scrubEraCopy(dressed.trueText || dressed.text, facts),
      encounterBound: true,
    };
  });
  const passive = weeklyPassive(rng, ctx);

  consumeOpeningWeekLead(character);
  const dateStamp = `${date.year}年${date.month}月${date.day}日`;
  // Lean chronicle inputs only: encounter intro is owned by assembleWeeklyChronicle.
  // Status / daily / variator pulse echoes are dropped; gateWeeklyOutput rebuilds
  // an option-aligned record and runs the sanitizer.
  const crisisLines = [
    useLock && breakdownLocked ? renderBreakdownIncident(breakdown, ctx, rng) : "",
    useLock && wealthLocked ? renderWealthCrisis(wealthCrisis, ctx) : "",
    useLock && kinLocked ? renderKinCrisis(kinCrisis, ctx) : "",
    useLock && turningLocked && turningPoint ? composeStageClause(rng, ctx) : "",
    useLock && worldLocked ? renderWorldEvent(worldIncident, ctx, rng) : "",
    useLock && figureLocked ? renderFigureEncounter(figureIncident, ctx, rng) : "",
    useLock && adultLocked ? renderAdultIncident(adultIncident, ctx, rng) : "",
    useLock && schoolLocked ? renderSchoolIncident(schoolIncident, ctx, rng) : "",
  ];
  const rawNarrative = assembleWeeklyChronicle(rng, [
    dateStamp,
    sliceOfLife(rng, stage, era, ctx),
    ...crisisLines,
  ], ctx);
  const gated = gateWeeklyOutput(rng, { narrative: rawNarrative, options: dressedOptions }, ctx);
  const narrative = gated.narrative;
  const gatedOptions = ensureDistinctChoiceTriad(rng, gated.options, ctx);
  rememberOfferedChoices(character, gatedOptions, stage.id);
  rememberExcluded(character, gatedOptions, {
    eventIds: [
      useLock && breakdownLocked ? breakdown?.id : null,
      useLock && wealthLocked ? wealthCrisis?.id : null,
      useLock && kinLocked ? kinCrisis?.id : null,
      useLock && worldLocked ? worldIncident?.id : null,
      useLock && schoolLocked ? schoolIncident?.id : null,
      useLock && adultLocked ? adultIncident?.id : null,
      useLock && figureLocked ? figureIncident?.id : null,
    ].filter(Boolean),
  });

  rememberTextSnippet(character, { stem: narrative });
  for (const option of gatedOptions) rememberTextSnippet(character, { choice: option.trueText || option.text });
  rememberTriggeredMany(character, [
    useLock && breakdownLocked && breakdown
      ? { id: breakdown.id, outline: eventOutline("breakdown", breakdown.kind || "breakdown") }
      : null,
    useLock && worldLocked && worldIncident
      ? { id: worldIncident.id, outline: eventOutline("world", worldIncident.kind, (worldIncident.threads || [])[0] || worldIncident.lock) }
      : null,
    useLock && schoolLocked && schoolIncident
      ? { id: schoolIncident.id, outline: eventOutline("school", schoolIncident.kind) }
      : null,
    useLock && adultLocked && adultIncident
      ? { id: adultIncident.id, outline: eventOutline("adult", adultIncident.kind, adultIncident.sector) }
      : null,
    useLock && wealthLocked && wealthCrisis
      ? { id: wealthCrisis.id, outline: eventOutline("wealth", wealthCrisis.kind) }
      : null,
    useLock && kinLocked && kinCrisis
      ? { id: kinCrisis.id, outline: eventOutline("kin", kinCrisis.kind) }
      : null,
    useLock && figureLocked && figureIncident
      ? { id: `${figureIncident.id}:${figureIncident.figureId || ""}`, outline: eventOutline("figure", figureIncident.kind, figureIncident.figureId) }
      : null,
    ...(dailyTexture.slices || []).map((slice) => ({
      id: `daily:${slice.id}`,
      outline: eventOutline("daily", slice.id),
    })),
  ].filter(Boolean), ctx);

  return {
    id: `turn_${date.iso}_${time.totalTurnsLived || time.totalWeeksLived || 0}`,
    year: time.year,
    month: date.month,
    day: date.day,
    iso: date.iso,
    week: time.week,
    turn: time.turn || date.turn,
    ageYears: time.ageYears,
    season: environment.seasonLabel,
    currentTags: environment.tags,
    era: { id: era.id, name: era.name, summary: era.summary, mood: era.mood },
    stage: { id: stage.id, label: stage.label },
    worldContext: passive.historyPulse
      ? { id: passive.historyPulse.id, title: passive.historyPulse.title, text: passive.historyPulse.narrative }
      : null,
    ledger: {
      wanted: ledger.wanted,
      heat: ledger.heat,
      trust: ledger.trust,
      opinion: ledger.opinion,
      politicalCapital: ledger.politicalCapital,
      infamy: ledger.infamy,
      paths: { ...ledger.paths },
      pressure: pressure.level,
      eraCrisis: ctx.eraCrisis?.score || 0,
    },
    chaos: {
      id: chaosProfile.id,
      label: chaosProfile.label,
      note: chaosProfile.note,
    },
    daily: {
      stateId: dailyTexture.state?.id || null,
      stateLabel: dailyTexture.state?.label || null,
      sliceIds: (dailyTexture.slices || []).map((slice) => slice.id),
    },
    breakdown: useLock && breakdownLocked
      ? { id: breakdown.id, kind: breakdown.kind, lock: "breakdown", lockedTriad: true }
      : null,
    wealthCrisis: useLock && wealthLocked
      ? { id: wealthCrisis.id, kind: wealthCrisis.kind, lock: "wealth", lockedTriad: true }
      : null,
    kinCrisis: useLock && kinLocked
      ? { id: kinCrisis.id, kind: kinCrisis.kind, lock: "kin", lockedTriad: true, npcId: kinCrisis.npcId || null }
      : null,
    turningPoint: useLock && turningLocked
      ? { id: turningPoint.id, title: turningPoint.title, lockedTriad: true }
      : null,
    school: useLock && schoolLocked
      ? { id: schoolIncident.id, kind: schoolIncident.kind, lockedTriad: true }
      : null,
    adult: useLock && adultLocked
      ? { id: adultIncident.id, kind: adultIncident.kind, sector: adultIncident.sector, lockedTriad: true }
      : null,
    worldEvent: useLock && worldLocked
      ? {
        id: worldIncident.id,
        kind: worldIncident.kind,
        lock: worldIncident.lock,
        geoBand: ctx.geoBand,
        geoBandBase: ctx.geoBandBase,
        historyIds: (ctx.historyIds || []).slice(),
        lockedTriad: true,
        upheaval: publicUpheavalView(ctx.upheaval),
      }
      : {
        geoBand: ctx.geoBand,
        geoBandBase: ctx.geoBandBase,
        historyIds: (ctx.historyIds || []).slice(),
        lockedTriad: false,
        upheaval: publicUpheavalView(ctx.upheaval),
      },
    figure: {
      id: useLock && figureLocked ? figureIncident.id : null,
      figureId: ctx.weekEncounter?.figure?.id || (useLock && figureLocked ? figureIncident.figureId : null),
      figureName: ctx.weekEncounter?.figure?.name || (useLock && figureLocked ? figureIncident.figureName : null),
      kind: useLock && figureLocked ? figureIncident.kind : null,
      lock: useLock && figureLocked ? figureIncident.lock : null,
      lockedTriad: Boolean(useLock && figureLocked),
      woven: Boolean(ctx.weekEncounter?.figure),
      rewritten: Boolean(ctx.character?.historyState?.rewritten),
      inertia: ctx.character?.historyState?.inertia || 0,
    },
    encounter: {
      contextualIntro: true,
      pressure: ctx.weekEncounter?.pressure || "",
      figureWoven: Boolean(ctx.weekEncounter?.figure),
    },
    mortality: {
      weekly: mortalityInvoice.weekly,
      annual: mortalityInvoice.annual,
      band: mortalityInvoice.band?.id || null,
      ageCoefficient: mortalityInvoice.ageCoefficient ?? 1,
      noHalo: true,
    },
    boundary: {
      intercepted: 0,
      minorProtectAge: 12,
      ageGate: true,
      eraAgeEnv: true,
      ageBand: ageBand(ctx.ageYears).id,
      childClimate: childhoodClimate(ctx).harsh ? "harsh" : "sheltered",
      contextAwareRandom: true,
      exclusiveOptions: true,
      noOptionRecycling: true,
      dynamicOnTheFly: true,
      zeroHardcodedTemplates: true,
      tagDrivenOnly: true,
      liveTagMint: true,
      liveChoiceMint: true,
      staticWorldDatabase: true,
      predefinedDemographics: true,
      liveWeeklyNarrative: true,
      textLogicMonitor: true,
      semanticGate: true,
      logicFilter: true,
      causalityGate: true,
      varietyGuard: true,
      wealthEngine: true,
      wealthCashflow: true,
      bankruptcyCrisis: true,
      classMobilityStakes: true,
      contextualIntro: true,
      figureWeave: true,
      encounterDrivenChoices: true,
    },
    narrative,
    passiveEffects: passive.effects,
    options: gatedOptions,
    textMonitor: gated.textMonitor,
  };
}

export function resolveOption(rng, option, character = null, ctx = {}) {
  let effects = { ...option.effects };
  const texts = [];
  let triggeredRisk = false;
  const charHooks = character?.bloodline?.hooks || [];
  const optionHooks = option.hooks || [];
  const aligned = optionHooks.some((hook) => charHooks.includes(hook));
  const records = character?.tagRecords || [];
  const advantageous = records.some((item) => (
    item.category !== "trauma"
    && item.category !== "caste"
    && item.category !== "adult"
    && (item.advantageIn || []).some((hook) => optionHooks.includes(hook))
  ));
  const strained = records.some((item) => (item.strainIn || []).some((hook) => optionHooks.includes(hook)));
  const depressed = records.some((item) => item.id === "mood_depressed");
  const euphoric = records.some((item) => item.id === "mood_euphoric");

  const noHalo = (option.adultIncident || option.worldEvent || option.figureEncounter || option.butterfly)
    && (option.dark || option.perpetrator || option.path === "crime" || option.path === "militant" || option.butterfly);
  if ((aligned || advantageous) && !noHalo) {
    for (const [key, value] of Object.entries(effects)) {
      if (typeof value === "number" && value > 0) effects[key] = value + 1;
      if (typeof value === "number" && value < 0) effects[key] = value + 1 > 0 ? 0 : value + 1;
    }
    texts.push(composeFollowBeat(rng, ctx, { advantage: true }));
  }

  if (strained) {
    for (const [key, value] of Object.entries(effects)) {
      if (typeof value === "number" && value > 0) effects[key] = Math.max(0, value - 1);
    }
    texts.push(composeFollowBeat(rng, ctx, { strain: true }));
  }

  if (depressed && (effects.sanity || effects.mood)) {
    effects.sanity = (effects.sanity || 0) + (effects.mood || 0) - 1;
    effects.mood = 0;
  }
  if (euphoric && option.risk) {
    option = { ...option, risk: { ...option.risk, chance: Math.min(0.95, option.risk.chance + 0.08) } };
  }

  const traumaMod = modifyResolutionForTrauma(character, option, effects, texts);
  effects = traumaMod.effects;
  const schoolMod = modifyResolutionForSchool(character, option, effects, texts);
  effects = schoolMod.effects;
  const casteMod = modifyResolutionForCaste(character, option, effects, texts);
  effects = casteMod.effects;
  const adultMod = modifyResolutionForAdult(character, option, effects, texts);
  effects = adultMod.effects;
  const worldMod = modifyResolutionForWorld(character, option, effects, texts);
  effects = worldMod.effects;
  const figureMod = modifyResolutionForFigure(character, option, effects, texts);
  effects = figureMod.effects;

  const riskChance = option.risk
    ? (aligned || advantageous) && !noHalo ? option.risk.chance * 0.7 : option.risk.chance
    : 0;
  if (option.risk && chance(rng, Math.min(0.95, riskChance + (traumaMod.extraRisk || 0) + (schoolMod.extraRisk || 0) + (casteMod.extraRisk || 0) + (adultMod.extraRisk || 0) + (worldMod.extraRisk || 0) + (figureMod.extraRisk || 0)))) {
    triggeredRisk = true;
    for (const [key, value] of Object.entries(option.risk.effects || {})) {
      effects[key] = (effects[key] || 0) + value;
    }
    texts.push(composeLiveFollowUp(rng, { ...ctx, character }, { ...option, chaosSlot: "trap" }));
  }

  texts.push(composeLiveFollowUp(rng, { ...ctx, character }, option) || option.liveFollowUp || "");

  const canon = canonicalizeEffects(effects);
  return {
    effects: canon.stats,
    hidden: canon.hidden,
    followUpText: scrubPublicText(texts.join(" ")),
    triggeredRisk,
    addTags: option.addTags || [],
    tagAligned: aligned || advantageous,
    consequence: option.consequence || null,
    attempt: option.attempt || null,
    path: option.path || null,
  };
}
