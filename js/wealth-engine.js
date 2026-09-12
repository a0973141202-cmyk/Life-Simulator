/**
 * Dynamic Wealth & Economic Flow Model.
 * Cash, assets, debt, and fortnight cash-flow drive bands, tags, crisis, and death.
 */
import {
  CASH_PER_MEANS,
  CLASS_WEALTH_SEED,
  CLASS_WEEKLY_EXPENSE,
  CLASS_WEEKLY_INCOME,
  CRISIS_KINDS,
  INFLATION_WINDOWS,
  WEALTH_BANDS,
  WEALTH_CRISIS_COOLDOWN,
  WEALTH_TAG_RULES,
} from "./data/wealth-schema.js";
import { addCharacterTag, characterHasTag, removeCharacterTag } from "./tag-system.js";
import { scanNarrativeFacts } from "./narrative-facts.js";
import { composeChoiceLine } from "./dynamic-prose.js";

function num(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, Math.round(value)));
}

export function netWorthOf(wealth = {}) {
  return num(wealth.cash) + num(wealth.assets) - num(wealth.debt);
}

export function wealthBandOf(wealth = {}) {
  const net = netWorthOf(wealth);
  if (num(wealth.debt) >= 80 && net < 40) return WEALTH_BANDS[0];
  return WEALTH_BANDS.find((row) => net <= row.maxNet) || WEALTH_BANDS[WEALTH_BANDS.length - 1];
}

export function deriveMeans(wealth = {}) {
  const band = wealthBandOf(wealth);
  const net = netWorthOf(wealth);
  const span = band.maxNet === Infinity ? 240 : Math.max(24, band.maxNet);
  const mix = band.means + Math.round((Math.max(0, net) / span) * 8);
  return clamp(mix, 1, 99);
}

export function emptyWealth(options = {}) {
  return {
    cash: num(options.cash),
    assets: num(options.assets),
    debt: Math.max(0, num(options.debt)),
    income: num(options.income),
    expense: num(options.expense),
    inflation: num(options.inflation, 1),
    shock: options.shock || "",
    band: options.band || "getting_by",
    pendingCrisis: Boolean(options.pendingCrisis),
    lastCrisisTurn: num(options.lastCrisisTurn, -999),
    crises: num(options.crises),
    lastKind: options.lastKind || null,
    climbStreak: num(options.climbStreak),
    fallStreak: num(options.fallStreak),
  };
}

function classSeed(classId) {
  return CLASS_WEALTH_SEED[classId] || CLASS_WEALTH_SEED.worker;
}

export function seedWealth(character = {}) {
  const means = clamp(num(character.means, 40), 1, 99);
  const seed = classSeed(character.familyClassId);
  const wealth = emptyWealth({
    cash: Math.max(0, Math.round(means * seed.cashMul)),
    assets: Math.max(0, Math.round(means * seed.assetMul)),
    debt: means < 18 ? seed.debtFloor : 0,
  });
  wealth.band = wealthBandOf(wealth).id;
  character.wealth = wealth;
  character.means = deriveMeans(wealth);
  return wealth;
}

export function ensureWealth(character) {
  if (!character) return emptyWealth();
  if (!character.wealth) seedWealth(character);
  else character.wealth = emptyWealth(character.wealth);
  character.wealth.band = wealthBandOf(character.wealth).id;
  character.means = deriveMeans(character.wealth);
  return character.wealth;
}

export function eraShockOf(ctx = {}) {
  const year = num(ctx.year ?? ctx.time?.year);
  const region = String(ctx.region || ctx.character?.region || "");
  const hit = INFLATION_WINDOWS.find((row) => (
    year >= row.from && year <= row.to
    && (!row.regions || row.regions.includes(region))
  ));
  return hit || { inflation: 1, income: 1, shock: "" };
}

function householdScale(age) {
  if (age < 8) return 0.35;
  if (age < 14) return 0.55;
  if (age < 18) return 0.8;
  return 1;
}

export function applyWealthDelta(character, delta = {}, time = {}) {
  const wealth = ensureWealth(character);
  const meansPts = num(delta.means ?? delta.wealth);
  if (meansPts) {
    const cashMove = Math.round(meansPts * CASH_PER_MEANS);
    if (cashMove >= 0) wealth.cash += cashMove;
    else {
      const take = Math.min(wealth.cash, Math.abs(cashMove));
      wealth.cash -= take;
      const rest = Math.abs(cashMove) - take;
      if (rest) {
        const sell = Math.min(wealth.assets, rest);
        wealth.assets -= sell;
        wealth.debt += rest - sell;
      }
    }
  }
  wealth.cash += num(delta.cash);
  wealth.assets = Math.max(0, wealth.assets + num(delta.assets));
  wealth.debt = Math.max(0, wealth.debt + num(delta.debt));
  if (wealth.cash < 0) {
    wealth.debt += Math.abs(wealth.cash);
    wealth.cash = 0;
  }
  wealth.band = wealthBandOf(wealth).id;
  character.means = deriveMeans(wealth);
  wealth.lastYear = time.year ?? wealth.lastYear ?? null;
  return snapshotWealth(wealth);
}

export function snapshotWealth(wealth) {
  const band = wealthBandOf(wealth);
  return {
    cash: wealth.cash,
    assets: wealth.assets,
    debt: wealth.debt,
    netWorth: netWorthOf(wealth),
    band: band.id,
    label: band.label,
    means: deriveMeans(wealth),
    inflation: wealth.inflation || 1,
    shock: wealth.shock || "",
    pendingCrisis: Boolean(wealth.pendingCrisis),
  };
}

export function weeklyEconomicTick(character, ctx = {}) {
  const wealth = ensureWealth(character);
  const age = num(ctx.ageYears ?? ctx.time?.ageYears, 18);
  const classId = character.familyClassId || "worker";
  const shock = eraShockOf(ctx);
  const scale = householdScale(age);
  const jobless = shock.income < 0.6 && /depression|famine|covid|gfc|asian_crisis/.test(shock.shock);
  const income = Math.round(num(CLASS_WEEKLY_INCOME[classId], 8) * shock.income * scale * (jobless ? 0.45 : 1));
  const expense = Math.round(num(CLASS_WEEKLY_EXPENSE[classId], 8) * shock.inflation * scale);
  wealth.income = income;
  wealth.expense = expense;
  wealth.inflation = shock.inflation;
  wealth.shock = shock.shock;
  applyWealthDelta(character, { cash: income - expense }, ctx.time || ctx);
  if (wealth.debt > 0) {
    const interest = Math.max(1, Math.round(wealth.debt * 0.02));
    wealth.debt += interest;
  }
  if (shock.shock === "gfc" || shock.shock === "asian_crisis") {
    wealth.assets = Math.max(0, Math.round(wealth.assets * 0.92));
  }
  if (shock.shock === "hyperinflation") {
    wealth.cash = Math.max(0, Math.round(wealth.cash * 0.55));
  }
  wealth.band = wealthBandOf(wealth).id;
  character.means = deriveMeans(wealth);
  tickMobility(character);
  return {
    income,
    expense,
    shock: shock.shock,
    snapshot: snapshotWealth(wealth),
    note: composeWealthBeat(ctx, wealth),
  };
}

function tickMobility(character) {
  const wealth = character.wealth;
  const net = netWorthOf(wealth);
  const classId = character.familyClassId || "";
  const lowBorn = /peasant|worker|immigrant/.test(classId);
  const highBorn = /merchant|gentry|official/.test(classId);
  if (lowBorn && net >= 280) wealth.climbStreak = (wealth.climbStreak || 0) + 1;
  else wealth.climbStreak = 0;
  if (highBorn && (wealth.band === "bankrupt" || net < 0)) wealth.fallStreak = (wealth.fallStreak || 0) + 1;
  else wealth.fallStreak = 0;
}

export function evaluateBankruptcy(character) {
  const wealth = ensureWealth(character);
  const net = netWorthOf(wealth);
  return {
    broke: net <= 0 || (wealth.cash <= 0 && wealth.debt >= 40),
    deep: wealth.debt >= 80 || net <= -40,
    band: wealth.band,
    net,
  };
}

export function shouldForceWealthCrisis(character, ctx = {}) {
  if (!character) return false;
  const wealth = ensureWealth(character);
  const turn = num(ctx.turnCount ?? ctx.turn, 0);
  if (turn - num(wealth.lastCrisisTurn, -999) < WEALTH_CRISIS_COOLDOWN && !wealth.pendingCrisis) {
    return false;
  }
  const book = evaluateBankruptcy(character);
  return book.broke || book.deep || wealth.pendingCrisis;
}

export function armWealthCrisis(character, ctx = {}) {
  const wealth = ensureWealth(character);
  if (shouldForceWealthCrisis(character, ctx)) wealth.pendingCrisis = true;
  return wealth;
}

function pickCrisisKind(wealth) {
  if (wealth.assets >= 20) return "fire_sale";
  if (wealth.debt >= 70) return "collectors";
  if (wealth.band === "bankrupt" && wealth.assets <= 4) return "street";
  if (wealth.debt >= 36) return "bonded";
  return "hunger";
}

export function composeWealthBeat(ctx = {}, wealth = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const year = facts.year || ctx.year || "";
  const city = facts.city || "此地";
  const band = wealthBandOf(wealth);
  if (band.id === "bankrupt") return `${year}年，${city}的帳已經空了，債還在加。`;
  if (band.id === "indebted" || wealth.debt >= 36) return `${year}年，${city}這兩週要先還人，再談吃飯。`;
  if (band.id === "destitute" || band.id === "poor") return `${year}年，${city}口袋見底，下一頓還沒著落。`;
  if (wealth.shock === "depression") return `${year}年，${city}的工位和舖面同時在收。`;
  if (wealth.shock === "famine") return `${year}年，${city}糧價把家裏的餘錢吃光。`;
  if (wealth.shock === "hyperinflation") return `${year}年，${city}手裏的票子一天比一天薄。`;
  if (band.id === "affluent" || band.id === "comfortable") {
    return `${year}年，${city}還能先付房租和糧，再談別的。`;
  }
  return `${year}年，${city}這兩週的進帳剛夠抵開銷。`;
}

export function renderWealthCrisis(incident, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const kind = incident?.kind || "hunger";
  const city = facts.city || "此地";
  const year = facts.year || "";
  if (kind === "street") return `${year}年，${city}已經沒有能回去的門。`;
  if (kind === "fire_sale") return `${year}年，${city}能當的東西要在債主來之前賣掉。`;
  if (kind === "bonded") return `${year}年，${city}有人要用你的工時抵帳。`;
  if (kind === "collectors") return `${year}年，${city}來收帳的人不講價。`;
  return `${year}年，${city}鍋已經見底，身體先垮。`;
}

function crisisOption(rng, ctx, incident, index) {
  const kind = incident.kind;
  const lanes = kind === "street"
    ? [{ kind: "family", dir: "flee" }, { kind: "hunger", dir: "seek" }, { kind: "family", dir: "guard" }]
    : kind === "fire_sale"
      ? [{ kind: "money", dir: "seek" }, { kind: "money", dir: "resist" }, { kind: "family", dir: "guard" }]
      : kind === "bonded"
        ? [{ kind: "labor", dir: "endure" }, { kind: "labor", dir: "resist" }, { kind: "family", dir: "flee" }]
        : kind === "collectors"
          ? [{ kind: "family", dir: "guard" }, { kind: "family", dir: "flee" }, { kind: "money", dir: "resist" }]
          : [{ kind: "hunger", dir: "seek" }, { kind: "illness", dir: "endure" }, { kind: "family", dir: "help" }];
  const lane = lanes[index % lanes.length];
  const text = composeChoiceLine(rng, ctx, lane.kind, index + 31, { direction: lane.dir });
  const tag = WEALTH_TAG_RULES.find((row) => row.crisis === kind)?.id || "wealth_indebted";
  const flows = [
    { cash: 0, debt: 4, assets: 0, health: -2, sanity: -2 },
    { cash: 8, debt: -6, assets: -12, health: -1, sanity: -1 },
    { cash: 2, debt: -3, assets: 0, health: -3, sanity: -1 },
  ][index % 3];
  return {
    id: `wealth_${kind}_${index}`,
    text,
    trueText: text,
    wealthCrisis: true,
    wealthKind: kind,
    addTags: [tag, kind === "hunger" ? "household_hungry" : null, kind === "collectors" ? "adult_debt" : null].filter(Boolean),
    effects: { health: flows.health, sanity: flows.sanity },
    wealthDelta: { cash: flows.cash, debt: flows.debt, assets: flows.assets },
    hooks: ["survival", "scarcity", kind === "collectors" ? "violence" : "family"],
  };
}

export function pickWealthCrisis(rng, ctx = {}) {
  const character = ctx.character;
  if (!character || !shouldForceWealthCrisis(character, ctx)) return null;
  const wealth = ensureWealth(character);
  const kind = CRISIS_KINDS.includes(wealth.lastKind)
    ? CRISIS_KINDS[(CRISIS_KINDS.indexOf(wealth.lastKind) + 1) % CRISIS_KINDS.length]
    : pickCrisisKind(wealth);
  const incident = {
    id: `wealth_crisis_${kind}`,
    kind,
    lock: "wealth",
    fact: renderWealthCrisis({ kind }, ctx),
    options: [0, 1, 2].map((index) => crisisOption(rng, ctx, { kind }, index)),
  };
  return incident;
}

export function consumeWealthLock(character, incident = null, turnCount = 0) {
  const wealth = ensureWealth(character);
  wealth.pendingCrisis = false;
  wealth.lastCrisisTurn = num(turnCount);
  wealth.crises = (wealth.crises || 0) + 1;
  if (incident?.kind) wealth.lastKind = incident.kind;
  return wealth;
}

export function applyWealthCrisisChoice(character, option, time = {}) {
  if (!character || !option?.wealthCrisis) return { applied: [], notes: [], tags: [] };
  const wealth = ensureWealth(character);
  applyWealthDelta(character, option.wealthDelta || {}, time);
  const tags = [...new Set(option.addTags || [])];
  wealth.pendingCrisis = false;
  wealth.lastCrisisTurn = num(time.turnCount ?? time.turn ?? wealth.lastCrisisTurn);
  wealth.crises = (wealth.crises || 0) + 1;
  return {
    applied: tags.map((id) => ({ id })),
    notes: [composeWealthBeat({ year: time.year, character }, wealth)],
    tags,
  };
}

export function resolveWealthStake(rng, character, option, ctx = {}) {
  if (!option?.wealthStake) return { triggered: false, note: "" };
  const wealth = ensureWealth(character);
  const stake = Math.max(12, Math.min(wealth.cash + 8, num(option.stakeCash, 40)));
  applyWealthDelta(character, { cash: -Math.min(wealth.cash, stake) }, ctx.time || ctx);
  const chance = num(option.stakeChance, 0.28);
  const roll = typeof rng === "function" ? rng() : 0.5;
  if (roll < chance) {
    applyWealthDelta(character, { cash: Math.round(stake * 2.4), assets: Math.round(stake * 0.4) }, ctx.time || ctx);
    return { triggered: false, won: true, note: composeWealthBeat(ctx, wealth) };
  }
  applyWealthDelta(character, { debt: Math.round(stake * 1.6) }, ctx.time || ctx);
  return { triggered: true, won: false, note: composeWealthBeat(ctx, wealth) };
}

export function canMintWealthStake(ctx = {}) {
  const age = num(ctx.ageYears, 0);
  if (age < 16) return false;
  const wealth = ctx.character ? ensureWealth(ctx.character) : emptyWealth();
  const classId = ctx.character?.familyClassId || ctx.familyClassId || "";
  const capital = /merchant|gentry|official/.test(classId) || wealth.cash + wealth.assets >= 80;
  const desperate = wealth.debt >= 40 || wealth.band === "bankrupt";
  return capital || (age >= 18 && desperate);
}

export function mintWealthStakeOption(rng, ctx = {}, index = 2) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const wealth = ctx.character ? ensureWealth(ctx.character) : emptyWealth();
  const desperate = wealth.debt >= 40 || wealth.band === "bankrupt";
  const driverTags = (ctx.tags || []).filter((tag) => String(tag).startsWith("wealth_")).slice(0, 3);
  const text = composeChoiceLine(rng, ctx, "money", index + 41, {
    direction: desperate ? "seek" : "resist",
    driverTags: driverTags.length ? driverTags : ["wealth_climber"],
    tagFocus: "wealth",
  });
  return {
    id: "wealth_stake_live",
    text,
    trueText: text,
    tagDriven: true,
    liveTagMint: true,
    zeroHardcodedTemplates: true,
    driverTags: driverTags.length ? driverTags : ["wealth_climber"],
    wealthStake: true,
    stakeCash: desperate ? 24 : 40,
    stakeChance: desperate ? 0.22 : 0.3,
    effects: { sanity: desperate ? -1 : 0 },
    addTags: desperate ? ["wealth_ruined_name"] : [],
    hooks: ["commerce", "scarcity"],
    risk: {
      chance: desperate ? 0.55 : 0.35,
      effects: { sanity: -2, health: -1 },
    },
    cityStamp: facts.city || "",
  };
}

export function syncWealthTags(character) {
  const wealth = ensureWealth(character);
  const net = netWorthOf(wealth);
  const book = evaluateBankruptcy(character);
  const changed = [];
  for (const rule of WEALTH_TAG_RULES) {
    const has = characterHasTag(character, rule.id);
    let on = false;
    if (rule.crisis && wealth.lastKind === rule.crisis && (book.broke || wealth.crises)) on = true;
    if (rule.minDebt != null && wealth.debt >= rule.minDebt) on = true;
    if (rule.maxNet != null && net <= rule.maxNet) on = true;
    if (rule.minNet != null && (wealth.climbStreak || 0) >= 4 && net >= rule.minNet) on = true;
    if (rule.id === "wealth_ruined_name" && (wealth.fallStreak || 0) >= 2) on = true;
    if (!has && on) {
      addCharacterTag(character, {
        id: rule.id,
        category: "wealth",
        label: rule.label,
        source: "wealth",
        reason: rule.label,
        valence: "neg",
        temporary: true,
        strainIn: rule.strain || [],
      });
      changed.push({ action: "add", tag: rule.id });
    } else if (has && !on && rule.id !== "wealth_climber") {
      if (rule.minDebt != null && wealth.debt < Math.max(8, (rule.minDebt || 0) - 20)) {
        removeCharacterTag(character, rule.id);
        changed.push({ action: "remove", tag: rule.id });
      }
      if (rule.maxNet != null && net > 24 && rule.id === "wealth_bankrupt") {
        removeCharacterTag(character, rule.id);
        changed.push({ action: "remove", tag: rule.id });
      }
    }
  }
  if ((wealth.climbStreak || 0) >= 4 && !characterHasTag(character, "acquired_class_rise")) {
    addCharacterTag(character, {
      id: "acquired_class_rise",
      category: "acquired",
      label: "從下面爬上來",
      source: "wealth",
      valence: "pos",
      temporary: true,
    });
    changed.push({ action: "add", tag: "acquired_class_rise" });
  }
  if ((wealth.fallStreak || 0) >= 2 && !characterHasTag(character, "acquired_class_fall")) {
    addCharacterTag(character, {
      id: "acquired_class_fall",
      category: "acquired",
      label: "從上面摔下來",
      source: "wealth",
      valence: "neg",
      temporary: true,
    });
    changed.push({ action: "add", tag: "acquired_class_fall" });
  }
  return { wealth, changed };
}

export function publicWealthView(character) {
  const wealth = character?.wealth ? snapshotWealth(character.wealth) : snapshotWealth(emptyWealth());
  return {
    ...wealth,
    line: wealth.band === "bankrupt"
      ? "帳已經空了，債還在加。"
      : wealth.debt >= 36
        ? "這兩週要先還人，再談吃飯。"
        : wealth.band === "destitute" || wealth.band === "poor"
          ? "口袋見底，下一頓還沒著落。"
          : wealth.band === "affluent" || wealth.band === "comfortable"
            ? "還能先付房租和糧。"
            : "進帳剛夠抵開銷。",
  };
}

export function wealthPressureScore(character) {
  if (!character) return 0;
  const wealth = ensureWealth(character);
  const book = evaluateBankruptcy(character);
  let score = 0;
  if (book.broke) score += 28;
  if (book.deep) score += 18;
  if (wealth.debt >= 36) score += Math.min(22, wealth.debt * 0.2);
  if (wealth.band === "destitute" || wealth.band === "poor") score += 10;
  return score;
}
