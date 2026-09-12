import { ACTION_POOL } from "./actions.js";
import { filterActionsByBoundary } from "./boundary.js";
import { ageBand, classifyLane, contentAllowedForAge, incidentAllowed } from "./age-gate.js";
import { childhoodClimate } from "./early-child-filter.js";
import { scanSemanticMismatches, scrubSemanticText, semanticOptionAllowed, situationFrame } from "./semantic-filter.js";
import { EARLY_CHILD_SURVIVAL_POOL } from "./data/early-child-survival-actions.js";
import { applyChaosToTriad, pickChaosProfile } from "./chaos-engine.js";
import { STAT_KEYS, clampStat, getLifeStage } from "./constants.js";
import { attachLifeProgress, progressAllowsAction } from "./life-stage-manager.js";
import { TURNING_POINT_POOL } from "./data/life-stage-catalog.js";
import { canonicalizeEffects, canonicalizeStats, gateStatValue } from "./stat-canon.js";
import { crisisPressure } from "./consequence-engine.js";
import { AWAKENING_ACTION_POOL } from "./data/awakening-actions.js";
import { CRISIS_ACTION_POOL } from "./data/crisis-actions.js";
import { SANDBOX_ACTION_POOL } from "./data/sandbox-actions.js";
import { getActiveHistory, getEraForYear, findCity } from "./data.js";
import { currentEnvironmentTags } from "./data/seasons.js";
import { makeDate } from "./data/calendar.js";
import { dressOption } from "./hint-engine.js";
import { modifyResolutionForTrauma } from "./trauma-engine.js";
import { applyHiddenOutcome, ensureLedger } from "./ledger.js";
import { collectDailyActions, pickDailyTexture, rememberDailyState, renderDailyNarrative } from "./daily-engine.js";
import { modifyResolutionForSchool, pickSchoolIncident, renderSchoolIncident } from "./school-engine.js";
import { modifyResolutionForCaste } from "./perp-caste-engine.js";
import { modifyResolutionForAdult, pickAdultIncident, renderAdultIncident } from "./adult-engine.js";
import { attachWorldContext, modifyResolutionForWorld, pickWorldEvent, renderWorldEvent } from "./world-event-engine.js";
import { attachUpheaval, publicUpheavalView } from "./upheaval-engine.js";
import {
  modifyResolutionForFigure,
  narrativePulseAllowed,
  pickFigureEncounter,
  renderFigureEncounter,
  tickHistory,
} from "./history-engine.js";
import { evaluateWeeklyMortality } from "./mortality-engine.js";
import { chance, pick, randInt } from "./rng.js";
import { findSettlement } from "./settlements.js";
import { uniqueTags } from "./tag-system.js";
import { describeSocialFeedback } from "./social-feedback.js";
import { scrubPublicText } from "./data/public-text.js";
import { assembleWeeklyChronicle, chronicleStageLine, chronicleSituationLine } from "./chronicle-voice.js";
import { composeHistoryPulse } from "./dynamic-prose.js";
import { consumeOpeningWeekLead } from "./opening-chronicle.js";
import { eventOutline, rememberTriggeredMany } from "./event-memory.js";
import { beginTextTurn, filterFreshByText, rememberTextSnippet } from "./text-history.js";
import { maybeVaryChoice, weaveVariatorLine } from "./narrative-variator.js";
import { attachLifeContext, contextAllowsOption } from "./life-context.js";
import { beginExclusionTurn, optionExcluded, rememberExcluded } from "./exclusion-buffer.js";
import { composeExclusiveFill } from "./exclusive-fill.js";
import { TAG_DRIVEN_ACTION_POOL } from "./data/tag-choice-actions.js";
import { BLOODLINE_CHOICE_POOL } from "./data/bloodline-choice-actions.js";
import { PREFIX_LINK_POOL } from "./data/tag-link-actions.js";
import { ASYMMETRIC_SURVIVAL_POOL } from "./data/asymmetric-survival-actions.js";
import { attachOrganicContext } from "./organic-trigger.js";
import { ensureTagCoverage, graftAsymmetricOptions } from "./tag-link-engine.js";
import { ensureUntaggedBaseline, isUntaggedBaseline, stampTagInfluence } from "./tag-influence.js";
import {
  collectCtxTags,
  ensureChoiceMemory,
  isTagGated,
  pickWeeklyTriad,
  rememberOfferedChoices,
  stampChoiceFingerprint,
  textsTooSimilar,
  whenTagsMatch,
} from "./choice-pool.js";

function inRange(value, range) {
  if (!range) return true;
  return value >= range[0] && value <= range[1];
}

function matchesAction(action, ctx) {
  const when = action.when || {};
  if (!contentAllowedForAge(action, ctx)) return false;
  if (!semanticOptionAllowed(action, ctx)) return false;
  if (when.age && !inRange(ctx.ageYears, when.age)) return false;
  if (when.year && !inRange(ctx.year, when.year)) return false;
  if (when.stages && !when.stages.includes(ctx.stage.id)) return false;
  if (when.classes && !when.classes.includes(ctx.familyClassId)) return false;
  if (when.regions && !when.regions.includes(ctx.region)) return false;
  if (when.countriesAny) {
    const country = ctx.character?.country || "";
    if (!when.countriesAny.some((item) => country.includes(item))) return false;
  }
  if (!whenTagsMatch(when, ctx)) return false;
  if (when.stats) {
    for (const [key, range] of Object.entries(when.stats)) {
      const value = gateStatValue(ctx, key);
      if (value == null) continue;
      if (!inRange(value, range)) return false;
    }
  }
  if (when.occupationAny) {
    const occupation = ctx.character?.occupation || "";
    if (!when.occupationAny.some((item) => occupation === item || occupation.includes(item))) return false;
  }
  const ledger = ctx.ledger || ctx.character?.ledger || {};
  if (when.wanted && !inRange(ledger.wanted ?? 0, when.wanted)) return false;
  if (when.heat && !inRange(ledger.heat ?? 0, when.heat)) return false;
  if (when.trust && !inRange(ledger.trust ?? 50, when.trust)) return false;
  if (when.opinion && !inRange(ledger.opinion ?? 50, when.opinion)) return false;
  if (when.politicalCapital && !inRange(ledger.politicalCapital ?? 0, when.politicalCapital)) return false;
  if (when.pathsAny) {
    const minXp = when.pathMin ?? 1;
    if (!when.pathsAny.some((path) => (ledger.paths?.[path] || 0) >= minXp)) return false;
  }
  if (when.pathsNone && when.pathsNone.some((path) => (ledger.paths?.[path] || 0) >= (when.pathMin ?? 1))) {
    return false;
  }
  if (!contextAllowsOption(action, ctx)) return false;
  if (!progressAllowsAction(action, ctx)) return false;
  if (ctx.noOptionRecycling && optionExcluded(ctx.character, action.id, action.text)) return false;
  return true;
}

function matchesAgeYear(action, ctx) {
  const when = action.when || {};
  if (!contentAllowedForAge(action, ctx)) return false;
  if (!semanticOptionAllowed(action, ctx)) return false;
  if (when.age && !inRange(ctx.ageYears, when.age)) return false;
  if (when.year && !inRange(ctx.year, when.year)) return false;
  if (!contextAllowsOption(action, ctx)) return false;
  if (!progressAllowsAction(action, ctx)) return false;
  if (ctx.noOptionRecycling && optionExcluded(ctx.character, action.id, action.text)) return false;
  return true;
}

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
    followUps: (action.followUps || []).slice(),
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
    untaggedBaseline: Boolean(action.untaggedBaseline || isUntaggedBaseline(action)),
    organic: action.organic || null,
    organicContexts: action.organicContexts ? action.organicContexts.slice() : (action.when?.organicContexts || []).slice(),
    valence: action.valence || null,
  };
}

function statusLine(stats, tags, ledger, ctx = {}) {
  const bits = [];
  if (stats.health <= 25) bits.push("體格很差：走路會喘，傷口或發燒都還沒退");
  else if (stats.health >= 80) bits.push("體格還撐得住：能提水、能走完這一週要走的路");
  if (stats.sanity <= 25) bits.push("神智差：睡不好、提不起勁、容易發呆或哭");
  else if (stats.sanity >= 80) bits.push("這一陣子還能睡得著，話也說得清楚");
  if (tags.includes("勤學") || tags.includes("acquired_勤學") || tags.includes("parent_trait_math_aptitude")) bits.push("手裏還有沒做完的功課或帳");
  if (tags.includes("戰火") || tags.includes("hook_war")) bits.push("爆炸和槍聲還沒停，窗紙仍在抖");
  if (tags.includes("socio_extreme_poverty") || tags.includes("socio_working_poor") || tags.includes("底層開局") || tags.includes("household_hungry")) {
    bits.push("家裏仍在數每一粒米、每一塊發黴的麵包");
    if ((stats.health ?? 50) <= 40) {
      bits.push("這兩週雙腿腫得發亮，按下去的坑很久才彈回來，家裏的人說這是水腫");
    }
  }
  if (tags.includes("trait_barometric_sense") || tags.includes("hook_weather") || tags.includes("current_env_extreme_cold") || tags.includes("current_env_extreme_heat")) bits.push("你比別人更早頭痛或關節痛，知道天氣要變");
  if (tags.includes("ethnicity_inuit") || tags.includes("trait_polar_thermogenesis")) bits.push("嚴寒對你比較慢才咬進骨頭，但凍傷仍可能發生");
  if (tags.includes("current_date_winter") || tags.includes("current_env_polar_night")) bits.push("這一週冷到哈氣在門框上結冰");
  if (tags.includes("current_date_summer") || tags.includes("current_env_extreme_heat")) bits.push("熱到中暑：口乾、頭暈、不想走動");
  if (tags.includes("current_date_wet_season") || tags.includes("current_env_monsoon")) bits.push("衣服乾不了，傷口和咳嗽都更重");
  if (tags.includes("mood_depressed")) bits.push("連續幾天吃不下、不想說話");
  if (tags.includes("mood_euphoric")) bits.push("過於興奮：話多、步子快、容易判斷錯");
  if (tags.includes("socio_extreme_poverty") || tags.includes("socio_war_displacement")) bits.push("出身仍決定你能走哪條巷、能不能進店");
  if (tags.includes("acquired_wanted") || tags.includes("path_crime")) bits.push("通緝或地下買賣正在改寫你能走的路");
  if (tags.includes("path_politics") || tags.includes("path_historical")) bits.push("派系和檔案讓這一週的談話都要先看臉色");
  if (tags.includes("path_militant")) bits.push("持槍的人或巡邏隊讓普通日子也要躲路檢");
  if (tags.some((tag) => tag.startsWith("trauma_"))) bits.push("舊傷一碰就痛，或一聽見類似的聲音就發抖");
  if (tags.some((tag) => tag.startsWith("household_"))) bits.push("家裏仍有人會動手、鎖門，或把飯扣下來");
  if (tags.includes("school_bully") || tags.includes("school_gang") || tags.includes("school_ringleader")) {
    bits.push("院子裏仍有人盯著你，準備攔路或勒索");
  }
  if (tags.includes("school_bullied") || tags.includes("school_hated")) bits.push("有人把你寫在下手或報復的名單上");
  if (tags.includes("school_expelled") || tags.includes("school_record")) bits.push("學籍或處分正在改寫你能不能進校門");
  if (tags.some((tag) => tag.startsWith("caste_"))) bits.push("有人在核對你是不是「那一掛」，核對完會收費或動手");
  if ((ctx.upheaval?.tier || 0) >= 2) bits.push(`時局是${ctx.upheaval.label}：配給、抓人、或逃難比平常更硬`);
  else if (ctx.upheaval?.id) bits.push(`大環境仍是${ctx.upheaval.label}`);
  const safeBits = bits.filter((bit) => !scanSemanticMismatches(bit, ctx).length);
  const body = safeBits.length ? safeBits.join("；") + "。" : (situationFrame(ctx).strict ? "這一週身體還能走動，帳也還沒被砸門來收。" : "這一週沒有新的病，也沒有新的工。");
  const social = describeSocialFeedback(ledger || {}, {
    salt: (stats.health || 0) + (stats.sanity || 0) * 2,
    upheaval: ctx.upheaval,
  });
  return `${body}\n${social}`;
}

function sliceOfLife(rng, stage, era, ctx = {}) {
  ctx.stage = ctx.stage || stage;
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
    notes.push("年紀讓你這一週更容易喘，提水或上樓都比以前慢。");
  }
  if (ctx.ageYears >= 75 && chance(rng, 0.18)) {
    effects.health = (effects.health || 0) - 1;
  }
  if (ctx.stats.sanity <= 20 && chance(rng, 0.2)) {
    effects.health = (effects.health || 0) - 1;
    notes.push("連續睡不好、吃不下，體重在掉。");
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
    notes.push(chronicleSituationLine(rng, ctx) || (hardyCold ? "嚴寒很深，但你比旁人晚一點出現凍傷。" : "這一週的嚴寒咬進骨頭，手指和腳趾發白。"));
  }
  if (current.includes("current_env_extreme_heat") && chance(rng, 0.16)) {
    effects.mood = (effects.mood || 0) - 1;
    notes.push(chronicleSituationLine(rng, ctx) || "熱浪讓人中暑：口乾、頭暈、不想走動。");
  }
  if (current.includes("current_env_monsoon") && chance(rng, 0.12)) {
    effects.health = (effects.health || 0) - 1;
    notes.push(chronicleSituationLine(rng, ctx) || "雨季讓傷口發黴、咳嗽加重。");
  }
  if (current.includes("current_env_polar_night") && chance(rng, 0.14)) {
    effects.mood = (effects.mood || 0) - 1;
    notes.push(chronicleSituationLine(rng, ctx) || "極夜沒有白天。你靠摸牆和爐火判斷方向。");
  }

  const childClimate = childhoodClimate(ctx);
  if (childClimate.age <= 6 && childClimate.harsh && chance(rng, childClimate.famine || childClimate.wartime ? 0.55 : 0.38)) {
    effects.health = (effects.health || 0) - 1;
    ctx.childClimate = childClimate;
    const climateLine = chronicleSituationLine(rng, ctx);
    if (climateLine) notes.push(climateLine);
    else if (childClimate.famine || childClimate.depression) {
      notes.push("這一週的熱量不夠一個五六歲的身體。餓、腿軟、長不高，都是現在發生的事。");
    } else if (childClimate.wartime) {
      notes.push("戰亂區的槍聲、潮冷和缺糧讓幼兒睡不著、體溫掉下來。");
    } else {
      notes.push("潮冷的屋子或空鍋仍在向幼兒收費：咳嗽、腹瀉，或半夜餓醒。");
    }
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
  const mortalityInvoice = evaluateWeeklyMortality(ctx);
  ctx.mortality = mortalityInvoice;
  attachWorldContext(ctx);
  attachUpheaval(ctx);
  pressure = crisisPressure(ledger, {
    upheavalScore: ctx.upheaval?.score || 0,
    worldPressure: character.worldEventState?.pressure || 0,
  });
  ctx.pressure = pressure;
  ctx.tags = collectCtxTags(ctx);
  attachOrganicContext(ctx);
  attachLifeContext(ctx);
  attachLifeProgress(ctx);
  ctx.childClimate = childhoodClimate(ctx);
  tickHistory(character, { year: time.year, iso: time.iso });
  const memory = ensureChoiceMemory(character, stage.id);

  const dailyTexture = pickDailyTexture(rng, ctx, 3);
  rememberDailyState(character, dailyTexture);

  const catalog = [
    ...AWAKENING_ACTION_POOL,
    ...EARLY_CHILD_SURVIVAL_POOL,
    ...TURNING_POINT_POOL,
    ...ACTION_POOL,
    ...TAG_DRIVEN_ACTION_POOL,
    ...BLOODLINE_CHOICE_POOL,
    ...PREFIX_LINK_POOL,
    ...ASYMMETRIC_SURVIVAL_POOL,
    ...collectDailyActions(),
    ...SANDBOX_ACTION_POOL,
    ...CRISIS_ACTION_POOL,
  ];
  const { kept, blocked } = filterActionsByBoundary(catalog, ctx);
  const matched = kept.filter((action) => !action.fallback && matchesAction(action, ctx));
  const loose = kept.filter((action) => !action.fallback && !isTagGated(action) && matchesAgeYear(action, ctx));
  const fallbacks = kept.filter((action) => action.fallback && matchesAction(action, ctx));
  const chaosProfile = pickChaosProfile(rng);
  const acceptLocked = (incident) => {
    if (!incident?.options || incident.options.length < 3) return null;
    if (!incidentAllowed(incident, ctx)) return null;
    if (optionExcluded(character, incident.id, incident.fact || incident.id)) return null;
    if (!contextAllowsOption({
      text: [incident.fact, incident.title, incident.procedure].filter(Boolean).join("\n"),
      hooks: incident.hooks,
    }, ctx)) return null;
    const grafted = graftAsymmetricOptions(rng, ctx, incident);
    const { kept: optionKept } = filterActionsByBoundary(grafted.options, ctx);
    const exclusiveKept = optionKept.filter((option) => (
      contextAllowsOption(option, ctx)
      && !optionExcluded(character, option.id, option.text)
    ));
    if (exclusiveKept.length < 3) {
      const { kept: originalKept } = filterActionsByBoundary(incident.options, ctx);
      const originalExclusive = originalKept.filter((option) => (
        contextAllowsOption(option, ctx)
        && !optionExcluded(character, option.id, option.text)
      ));
      if (originalExclusive.length < 3) return null;
      return { ...incident, options: originalExclusive.slice(0, 3) };
    }
    return { ...grafted, options: exclusiveKept.slice(0, 3) };
  };
  const worldCrisis = acceptLocked(pickWorldEvent(rng, ctx, { lock: "crisis" }));
  const worldCrisisLocked = Boolean(worldCrisis);
  const turningPoint = !worldCrisisLocked && ctx.dueTurningPoint?.options?.length >= 3
    ? {
      ...ctx.dueTurningPoint,
      options: ctx.dueTurningPoint.options.map((row) => ({ ...row, turningPoint: true })),
      lock: "turning_point",
    }
    : null;
  const turningLocked = Boolean(turningPoint);
  const figureIncidentRaw = (worldCrisisLocked || turningLocked) ? null : pickFigureEncounter(rng, ctx);
  const figureIncident = acceptLocked(figureIncidentRaw);
  const figureCrisisLocked = Boolean(figureIncident && figureIncident.lock !== "scene");
  const adultIncident = acceptLocked(
    (worldCrisisLocked || turningLocked || figureCrisisLocked) ? null : pickAdultIncident(rng, ctx),
  );
  const adultLocked = Boolean(adultIncident);
  const schoolIncident = acceptLocked(
    (worldCrisisLocked || turningLocked || figureCrisisLocked || adultLocked) ? null : pickSchoolIncident(rng, ctx),
  );
  const schoolLocked = Boolean(schoolIncident);
  const worldScene = acceptLocked(
    (worldCrisisLocked || turningLocked || figureCrisisLocked || adultLocked || schoolLocked)
      ? null
      : pickWorldEvent(rng, ctx, { lock: "scene" }),
  );
  const worldSceneLocked = Boolean(worldScene);
  const figureSceneLocked = Boolean(
    !worldCrisisLocked && !turningLocked && !figureCrisisLocked && !adultLocked && !schoolLocked && !worldSceneLocked
    && figureIncident?.lock === "scene",
  );
  const worldIncident = worldCrisisLocked ? worldCrisis : (worldSceneLocked ? worldScene : null);
  const worldLocked = Boolean(worldIncident);
  const figureLocked = figureCrisisLocked || figureSceneLocked;
  const factLocked = worldCrisisLocked || turningLocked || figureCrisisLocked || adultLocked || schoolLocked || worldSceneLocked || figureSceneLocked;
  const lockedIncident = worldCrisisLocked
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

  const crisis = matched.filter((action) => action.crisis);
  const restMatched = matched.filter((action) => !action.crisis);
  const restLoose = loose.filter((action) => !action.crisis);
  const climate = (ctx.tags || []).some((tag) => tag.startsWith("household_") || tag.startsWith("trauma_"));
  const inCasteHabitat = (ctx.ageYears || 0) >= 18 && (
    ctx.character?.dailyState?.id === "prison"
    || ctx.character?.dailyState?.id === "underworld_cover"
    || (ctx.tags || []).some((tag) => tag.startsWith("caste_") || tag === "acquired_imprisoned")
  );
  let picked = factLocked
    ? []
    : pickWeeklyTriad(rng, ctx, {
      pressure,
      climate,
      inCasteHabitat,
      crisis,
      tagged: matched.filter((action) => isTagGated(action) || action.tagDriven),
      tagLink: matched.filter((action) => action.tagLink),
      asymmetric: matched.filter((action) => action.asymmetric),
      trauma: restMatched.filter((action) => (
        action.traumaVictim
        || action.situation === "trauma"
        || (action.when?.tagPrefixesAny || []).includes("trauma_")
        || (action.when?.tagsAny || []).some((tag) => String(tag).startsWith("trauma_"))
      )),
      daily: restMatched.filter((action) => action.daily),
      caste: restMatched.filter((action) => action.perpCasteEcology),
      organic: restMatched.filter((action) => action.organic),
      matched: restMatched,
      loose: restLoose,
      fallbacks,
    }, memory);
  if (!factLocked) {
    picked = ensureTagCoverage(rng, ctx, picked, matched).picked;
    picked = filterActionsByBoundary(picked, ctx).kept;
    picked = ensureUntaggedBaseline(rng, picked.slice(0, 3), [...loose, ...fallbacks], ctx).slice(0, 3);
    picked = filterActionsByBoundary(picked, ctx).kept;
  }

  while (!factLocked && picked.length < 3) {
    const extra = composeExclusiveFill(rng, ctx, picked, character, picked.length);
    if (!extra || !filterActionsByBoundary([extra], ctx).kept.length) break;
    if (picked.some((row) => row.id === extra.id || row.text === extra.text)) break;
    picked.push(extra);
  }

  const sourceActions = factLocked ? lockedIncident.options : picked.slice(0, 3);
  const { kept: lockedKept } = filterActionsByBoundary(
    (sourceActions || []).filter((option) => (
      contextAllowsOption(option, ctx)
      && !optionExcluded(character, option.id, option.text)
    )),
    ctx,
  );
  const useLock = factLocked && lockedKept.length >= 3;
  while (!useLock && picked.length < 3) {
    const extra = composeExclusiveFill(rng, ctx, picked, character, picked.length);
    if (!extra || !filterActionsByBoundary([extra], ctx).kept.length) break;
    if (picked.some((row) => row.id === extra.id || row.text === extra.text)) break;
    picked.push(extra);
  }
  const sourcePool = (useLock ? lockedKept : picked.slice(0, 3)).slice(0, 3);
  const freshSource = useLock ? sourcePool : filterFreshByText(sourcePool, character, (row) => row.text);
  const rawOptions = (freshSource.length ? freshSource : sourcePool)
    .map((action, index) => stampChoiceFingerprint(cloneOption(rng, action, index, ctx)))
    .map((option) => maybeVaryChoice(rng, option, ctx));
  const exclusiveRaw = [];
  for (let index = 0; index < rawOptions.length; index += 1) {
    let option = rawOptions[index];
    const text = option?.trueText || option?.text;
    const clash = exclusiveRaw.some((row) => textsTooSimilar(row.trueText || row.text, text));
    if (!option || clash || optionExcluded(character, option.id, text)) {
      option = stampChoiceFingerprint(cloneOption(
        rng,
        composeExclusiveFill(rng, ctx, [...exclusiveRaw, ...rawOptions], character, index),
        index,
        ctx,
      ));
    }
    exclusiveRaw.push(option);
  }
  while (exclusiveRaw.length < 3) {
    exclusiveRaw.push(stampChoiceFingerprint(cloneOption(
      rng,
      composeExclusiveFill(rng, ctx, exclusiveRaw, character, exclusiveRaw.length),
      exclusiveRaw.length,
      ctx,
    )));
  }
  const chaotic = useLock
    ? exclusiveRaw.map((option, index) => ({ ...option, chaosSlot: "fact", index }))
    : applyChaosToTriad(rng, exclusiveRaw, chaosProfile, ctx);
  const options = chaotic.map((option) => stampChoiceFingerprint(dressOption(rng, option, ctx, chaosProfile)));
  rememberOfferedChoices(character, options, stage.id);
  rememberExcluded(character, options, {
    eventIds: [
      useLock && worldLocked ? worldIncident?.id : null,
      useLock && schoolLocked ? schoolIncident?.id : null,
      useLock && adultLocked ? adultIncident?.id : null,
      useLock && figureLocked ? figureIncident?.id : null,
    ].filter(Boolean),
  });
  const passive = weeklyPassive(rng, ctx);

  ctx.openingWeekLead = consumeOpeningWeekLead(character);
  const matrixLine = weaveVariatorLine(rng, ctx, character);
  const narrative = scrubSemanticText(scrubPublicText(assembleWeeklyChronicle(rng, [
    `${date.year}年${date.month}月${date.day}日`,
    renderDailyNarrative(dailyTexture, useLock ? null : ctx, rng),
    useLock && turningLocked && turningPoint ? `${turningPoint.title}。${turningPoint.journal}` : "",
    useLock && worldLocked ? renderWorldEvent(worldIncident, ctx, rng) : "",
    useLock && figureLocked ? renderFigureEncounter(figureIncident, ctx, rng) : "",
    useLock && adultLocked ? renderAdultIncident(adultIncident, ctx, rng) : "",
    useLock && schoolLocked ? renderSchoolIncident(schoolIncident, ctx, rng) : "",
    sliceOfLife(rng, stage, era, ctx),
    statusLine(character.stats, ctx.tags, ledger, ctx),
    matrixLine,
    ...passive.notes,
  ], ctx)), ctx);

  rememberTextSnippet(character, { stem: narrative });
  for (const option of options) rememberTextSnippet(character, { choice: option.trueText || option.text });
  rememberTriggeredMany(character, [
    useLock && worldLocked && worldIncident
      ? { id: worldIncident.id, outline: eventOutline("world", worldIncident.kind, (worldIncident.threads || [])[0] || worldIncident.lock) }
      : null,
    useLock && schoolLocked && schoolIncident
      ? { id: schoolIncident.id, outline: eventOutline("school", schoolIncident.kind) }
      : null,
    useLock && adultLocked && adultIncident
      ? { id: adultIncident.id, outline: eventOutline("adult", adultIncident.kind, adultIncident.sector) }
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
    figure: useLock && figureLocked
      ? {
        id: figureIncident.id,
        figureId: figureIncident.figureId,
        figureName: figureIncident.figureName,
        kind: figureIncident.kind,
        lock: figureIncident.lock,
        lockedTriad: true,
      }
      : {
        rewritten: Boolean(ctx.character?.historyState?.rewritten),
        inertia: ctx.character?.historyState?.inertia || 0,
        lockedTriad: false,
      },
    mortality: {
      weekly: mortalityInvoice.weekly,
      annual: mortalityInvoice.annual,
      band: mortalityInvoice.band?.id || null,
      ageCoefficient: mortalityInvoice.ageCoefficient ?? 1,
      noHalo: true,
    },
    boundary: {
      intercepted: blocked.length,
      minorProtectAge: 12,
      ageGate: true,
      eraAgeEnv: true,
      ageBand: ageBand(ctx.ageYears).id,
      childClimate: childhoodClimate(ctx).harsh ? "harsh" : "sheltered",
      contextAwareRandom: true,
      exclusiveOptions: true,
      noOptionRecycling: true,
    },
    narrative,
    passiveEffects: passive.effects,
    options,
  };
}

export function resolveOption(rng, option, character = null) {
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
    texts.push(advantageous
      ? "這件事對你比對旁人順一些。"
      : "你身上的底子讓這一步比較好走。");
  }

  if (strained) {
    for (const [key, value] of Object.entries(effects)) {
      if (typeof value === "number" && value > 0) effects[key] = Math.max(0, value - 1);
    }
    texts.push("這一步比旁人更難走完。");
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
    texts.push(option.risk.text);
  }

  texts.push(pick(rng, option.followUps) || "這兩週就這樣過去了：飯仍是那幾口，活仍是那些。");
  if (option.style === "fog") {
    texts.unshift("這兩週做完，發燒、扣飯或被人點名才從別處露出來。");
  }
  if (option.chaosSlot === "trap") {
    texts.unshift("這一步做完，接下來可能發燒、挨打、被扣飯，或被人記住把柄。");
  }
  if (option.chaosSlot === "scramble") {
    texts.push("這兩週做的事和後來發生的對不上，燒、扣飯或被點名仍照樣來。");
  }

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
