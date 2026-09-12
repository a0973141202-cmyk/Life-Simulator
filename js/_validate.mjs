import { GenesisEngine, describeGenesis } from "./genesis.js";
import { ETHNICITY_DATABASE } from "./data/ethnicities-database.js";
import { TRAIT_DATABASE } from "./data/traits-database.js";
import { isForbiddenEthnicity } from "./data/forbidden-groups.js";
import { GameEngine } from "./GameEngine.js";
import { isLeapYear, isValidGregorianDate, makeDate } from "./data/calendar.js";
import { natalEnvironmentTags } from "./data/seasons.js";
import { findSettlement, getSettlementCountry, isSettlementAvailable } from "./settlements.js";
import { canonicalizeCountry } from "./demographics-engine.js";
import { currentEnvironmentTags } from "./data/seasons.js";
import { canBeginNewLife } from "./life-session.js";
import { BETA_CONFIG, isBetaEnabled } from "./data/beta-config.js";
import { TAG_PREFIX } from "./data/tag-schema.js";
import { PREFIX_LINK_POOL } from "./data/tag-link-actions.js";
import { ASYMMETRIC_SURVIVAL_POOL } from "./data/asymmetric-survival-actions.js";
import { liveTagPrefixes, specializedAsymmetricOptions } from "./tag-link-engine.js";
import { MAX_TAGS_PER_CHOICE, selectInterveningTags, isUntaggedBaseline } from "./tag-influence.js";
import { composeOpeningDossier } from "./opening-chronicle.js";
import { composeLifeResolution } from "./life-resolution.js";
import { scrubRiddleText } from "./data/public-text.js";
import { createRng } from "./rng.js";
import { resetSessionRepeat } from "./session-repeat.js";
import { varyGenericNarrative } from "./narrative-variator.js";
import { beginTextTurn, textOnCooldown, rememberTextSnippet, TEXT_HISTORY_TURNS } from "./text-history.js";
import { composeChoiceLine, composeFortnightRecord, composeLiveFollowUp, lockChronicleToClock } from "./dynamic-prose.js";
import { maybeVaryChoice } from "./narrative-variator.js";
import { rememberUnpicked, optionExcluded } from "./exclusion-buffer.js";
import { scanNarrativeFacts, alignLiveClock } from "./narrative-facts.js";
import { evaluateEraCrisis } from "./history-crisis-engine.js";
import { shouldForceBreakdown } from "./mental-breakdown-engine.js";
import { composeMementoCard } from "./memento.js";
import { composeTagGloss, tagGloss } from "./data/tag-gloss.js";
import { composeEncounterChoice, composeWeekEncounter } from "./week-encounter.js";
import { gateWeeklyOutput, inspectPublicLine, monitorPublicText } from "./text-monitor.js";
import { filterPublicLine, scanLogicFaults, sentenceShape } from "./text-logic-filter.js";
import { textsTooSimilar } from "./choice-similarity.js";
import { ensureDistinctChoiceTriad } from "./choice-dedupe.js";
import {
  applyWealthDelta,
  evaluateBankruptcy,
  eraShockOf,
  seedWealth,
  shouldForceWealthCrisis,
  weeklyEconomicTick,
} from "./wealth-engine.js";
import {
  applyAffectionDelta,
  killNpc,
  livingParentRoles,
  publicKinView,
  seedNpcNetwork,
  shouldForceKinCrisis,
} from "./npc-social-engine.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const traitIds = new Set(TRAIT_DATABASE.map((item) => item.id));
const missing = [];
for (const eth of ETHNICITY_DATABASE) {
  assert(!isForbiddenEthnicity(eth), `forbidden leaked: ${eth.id}`);
  assert(!/sentinel|北哨兵/i.test(`${eth.id} ${eth.label} ${eth.labelEn}`), `sentinel leaked: ${eth.id}`);
  for (const id of eth.traits) {
    if (!traitIds.has(id)) missing.push(`${eth.id}:${id}`);
  }
}
assert(missing.length === 0, `missing traits: ${missing.join(", ")}`);
assert(ETHNICITY_DATABASE.length >= 180, `ethnicity count too small: ${ETHNICITY_DATABASE.length}`);

assert(isLeapYear(2024) && !isLeapYear(2023) && isLeapYear(2000) && !isLeapYear(1900), "leap rule");
assert(isValidGregorianDate(2024, 2, 29), "leap day exists");
assert(!isValidGregorianDate(2023, 2, 29), "non-leap feb 29");
assert(!isValidGregorianDate(2024, 4, 31), "april 31");

const brasilia = findSettlement("brasilia");
assert(brasilia, "brasilia exists");
assert(!isSettlementAvailable(brasilia, 1960, 1, 1), "brasilia before founding day");
assert(isSettlementAvailable(brasilia, 1960, 4, 21), "brasilia founding day");
assert(!isSettlementAvailable(brasilia, 1959, 12, 31), "brasilia before year");

const pripyat = findSettlement("pripyat");
assert(isSettlementAvailable(pripyat, 1970, 2, 4), "pripyat founding");
assert(!isSettlementAvailable(pripyat, 1970, 2, 3), "pripyat too early");
assert(!isSettlementAvailable(pripyat, 1986, 4, 28), "pripyat after evacuation");

assert(!findSettlement("north_sentinel"), "no sentinel settlement");

const genesis = new GenesisEngine({ seed: 20260911 });
const char = genesis.generateRandomCharacter();
assert(char.birthYear >= 1920 && char.birthYear <= 2025, "year");
assert(char.birthDate && char.birthIso === char.birthDate.iso, "exact birth date");
assert(isValidGregorianDate(char.birthYear, char.birthMonth, char.birthDay), "calendar date");
assert(isSettlementAvailable(findSettlement(char.cityId), char.birthYear, char.birthMonth, char.birthDay), "date-city lock");
assert(char.bloodline.parents.father && char.bloodline.parents.mother, "parents");
assert(char.tagRecords.length > 5, "tag records");
assert(char.tags.some((t) => t.startsWith("ethnicity_")), "ethnicity tag");
assert(char.tags.some((t) => t.startsWith("date_")), "date tags");
assert(char.tags.some((t) => t.startsWith("hemisphere_")), "hemisphere tag");
for (const rec of char.tagRecords.filter((item) => ["trait", "parentTrait", "ethnicity"].includes(item.category))) {
  assert(typeof rec.reason === "string" && rec.reason.length > 4, `reason missing for ${rec.id}`);
}
assert(!char.tags.some((t) => /sentinel|北哨兵/i.test(t)), "no sentinel tags");
assert(char.birthplaceLabel && char.birthplaceLabel.includes("，"), "birthplace 國家，城市");
assert(char.country && char.cityName, "country and city stamped");
assert(!/未知|sentinel|北哨兵/i.test(`${char.birthplaceLabel}${char.country}${char.cityName}`), "no vague/sentinel birthplace");
assert(char.genesisMeta?.historicalDemographics === true, "historicalDemographics flag");
assert(char.genesisMeta?.lifeLockUntilSettlement === true, "life lock flag");
if (isBetaEnabled()) {
  assert(char.birthYear >= BETA_CONFIG.birthYearMin && char.birthYear <= BETA_CONFIG.birthYearMax, "beta random year");
}
assert(char.genesisMeta?.fullTagLinkage === true, "fullTagLinkage flag");
assert(char.genesisMeta?.asymmetricSurvival === true, "asymmetricSurvival flag");
assert(char.genesisMeta?.tagInfluenceCap === true, "tagInfluenceCap flag");
assert(char.genesisMeta?.maxTagsPerChoice === 3, "maxTagsPerChoice");
assert(char.genesisMeta?.untaggedBaseline === false, "untaggedBaseline disabled");
assert(char.genesisMeta?.tagDrivenOnly === true, "tagDrivenOnly flag");
assert(char.genesisMeta?.liveTagMint === true, "liveTagMint flag");
assert(char.genesisMeta?.tagDrivenChoices === true, "tagDrivenChoices flag");
for (const prefix of Object.values(TAG_PREFIX)) {
  assert(
    PREFIX_LINK_POOL.some((action) => (action.when?.tagPrefixesAny || []).includes(prefix)),
    `prefix link missing ${prefix}`,
  );
}
assert(ASYMMETRIC_SURVIVAL_POOL.some((action) => action.asymmetric === "specialized"), "specialized exits");
assert(ASYMMETRIC_SURVIVAL_POOL.some((action) => action.asymmetric === "mainstream"), "mainstream despair");
const inuitCtx = { tags: ["ethnicity_inuit", "hook_arctic", "current_env_extreme_cold"], ageYears: 20 };
assert(liveTagPrefixes(inuitCtx).includes("ethnicity_"), "live ethnicity prefix");
assert(specializedAsymmetricOptions(inuitCtx).some((action) => action.id === "asym_spec_arctic_cache"), "inuit arctic exit");
const piled = {
  id: "cap_test",
  when: { tagPrefixesAny: ["ethnicity_", "hook_", "current_"], tagsAny: ["ethnicity_inuit"] },
  organic: "ethnicity",
};
const piledCtx = {
  tags: [
    "ethnicity_inuit", "ethnicity_sami", "hook_arctic", "hook_sea",
    "current_env_extreme_cold", "current_env_polar_night", "trait_polar_thermogenesis",
  ],
};
assert(selectInterveningTags(piled, piledCtx).length <= MAX_TAGS_PER_CHOICE, "max 3 tags per choice");
assert(isUntaggedBaseline({ text: "把這一週過完", when: { age: [5, 120] } }), "untagged baseline");
assert(describeGenesis(char).includes(char.birthplaceLabel), "birth journal shows full birthplace");
const deathCard = composeLifeResolution({
  character: char,
  time: { year: char.birthYear + 7, ageYears: 7 },
  kind: "death",
  fatal: true,
  reason: "健康歸零",
  detail: "高燒不退，隨後脫水，呼吸停止。",
  era: { name: "蕭條與備戰的三〇年代", summary: "糧店關門，失業排隊。" },
});
assert(deathCard.name === char.name, "death card names the person");
assert(deathCard.birthplace.includes(char.birthplaceLabel.split("，")[0]), "death card keeps country");
assert(/7/.test(deathCard.ageLine), "death card records age");
assert(/7 歲/.test(deathCard.cause) && /過世/.test(deathCard.cause), "death card states age and death");
assert(!/十八歲|封閉測試/.test(`${deathCard.epitaph}${deathCard.cause}`), "a 7-year death must not claim the 18-year beta close");
const betaClose = composeLifeResolution({
  character: { ...char, stats: { health: 72 } },
  time: { year: char.birthYear + 18, ageYears: 18 },
  kind: "session_close",
  fatal: false,
  playAgeCap: 18,
  temporaryCap: true,
});
assert(betaClose.ageYears === 18, "beta close uses live age 18");
assert(/封閉測試/.test(betaClose.cause) && /18/.test(betaClose.cause), "beta close names the 18-year test stage");
assert(/測試版本/.test(betaClose.cause), "beta close names the current test version");
const falseClose = composeLifeResolution({
  character: char,
  time: { year: char.birthYear + 5, ageYears: 5 },
  kind: "session_close",
  fatal: false,
  playAgeCap: 18,
  temporaryCap: true,
});
assert(falseClose.ageYears === 5, "false close keeps actual age 5");
assert(!/封閉測試的 18/.test(falseClose.cause), "age 5 must not be labeled as the 18-year beta close");
assert(scrubRiddleText("命運的風鈴在風中搖晃。把發黴的黑麵包吃掉。").includes("發黴的黑麵包"), "riddle scrub keeps concrete action");
assert(!scrubRiddleText("命運的風鈴在風中搖晃。").includes("風鈴"), "riddle scrub drops wind-chime metaphor");
assert(TEXT_HISTORY_TURNS >= 5 && TEXT_HISTORY_TURNS <= 10, "text history window is 5-10 turns");
const hungerPeasant = varyGenericNarrative(createRng(11), "hunger", {
  year: 1932,
  character: { cityName: "上海", country: "中華民國", familyClassId: "peasant", familyClassLabel: "貧農", tags: ["socio_extreme_poverty"] },
  familyClassId: "peasant",
  tags: ["socio_extreme_poverty"],
});
const hungerMerchant = varyGenericNarrative(createRng(22), "hunger", {
  year: 1978,
  character: { cityName: "香港", country: "香港", familyClassId: "merchant", familyClassLabel: "商賈", tags: ["mood_euphoric"] },
  familyClassId: "merchant",
  tags: ["mood_euphoric"],
});
assert(/貧農|糠|樹皮|上海|1932/.test(hungerPeasant), "1932 peasant hunger is local and concrete");
assert(/商賈|香港|隔夜|1978/.test(hungerMerchant), "1978 merchant hunger uses a different matrix");
assert(hungerPeasant !== hungerMerchant, "same hunger type must reassemble by year/class/place");
const histHost = { recentTextHistory: null };
beginTextTurn(histHost, { year: 1932, week: 1 });
rememberTextSnippet(histHost, { stem: hungerPeasant, id: "hunger_test" });
assert(textOnCooldown(histHost, hungerPeasant), "recent text history blocks the same stem");
resetSessionRepeat();
const openingOutlines = [];
const openingBirths = [];
for (let i = 0; i < 10; i += 1) {
  const rolled = genesis.generateRandomCharacter({ birthYear: 1932, settlementId: "shanghai" });
  const dossier = composeOpeningDossier(createRng(3300 + i * 19), rolled);
  assert(dossier.birth.includes(rolled.birthplaceLabel), "opening birth keeps precise birthplace");
  assert(dossier.awakening && dossier.weekLead, "opening dossier has awakening and week lead");
  openingOutlines.push(dossier.outline);
  openingBirths.push(dossier.birth.slice(0, 48));
}
assert(new Set(openingOutlines).size >= 5, `opening outlines should vary, got ${openingOutlines.join(" | ")}`);
assert(new Set(openingBirths).size >= 5, "opening birth stems should vary across new lives");

const peiping = genesis.generateRandomCharacter({ birthYear: 1935, settlementId: "beijing" });
assert(peiping.cityName === "北平", "1935 Beijing display is 北平");
assert(peiping.country === "中華民國", `1935 Beijing polity: ${peiping.country}`);
assert(peiping.birthplaceLabel === "中華民國，北平", `got ${peiping.birthplaceLabel}`);

const sovietVillage = genesis.generateRandomCharacter({ birthYear: 1928, settlementId: "poltava_village" });
assert(/蘇聯/.test(sovietVillage.country) && /烏克蘭/.test(sovietVillage.country), "1928 Poltava polity");
assert(/農村/.test(sovietVillage.birthplaceLabel) && sovietVillage.birthplaceLabel.includes("，"), "Ukraine village birthplace");

const beijingNow = genesis.generateRandomCharacter({ birthYear: 2000, settlementId: "beijing" });
assert(beijingNow.country === "中華人民共和國" && beijingNow.cityName === "北京", "2000 Beijing PRC");

const depressionWest = evaluateEraCrisis({
  year: 1931,
  week: 10,
  region: "west",
  familyClassId: "merchant",
  settlement: { kind: "city", region: "west" },
  character: { region: "west", familyClassId: "merchant", country: "美國" },
});
const calmWest = evaluateEraCrisis({
  year: 1924,
  week: 10,
  region: "west",
  familyClassId: "merchant",
  settlement: { kind: "city", region: "west" },
  character: { region: "west", familyClassId: "merchant", country: "美國" },
});
assert(depressionWest.score > calmWest.score, "1931 western merchant crisis exceeds 1924");
assert(depressionWest.score >= 22, `1931 depression must raise personal crisis: ${depressionWest.score}`);
const leapPeasant = evaluateEraCrisis({
  year: 1960,
  week: 8,
  region: "china",
  familyClassId: "peasant",
  settlement: { kind: "village", region: "china" },
  character: { region: "china", familyClassId: "peasant", country: "中華人民共和國" },
});
assert(leapPeasant.score >= 36, `1960 China peasant must be in the Great Leap vise: ${leapPeasant.score}`);
assert(shouldForceBreakdown({ stats: { sanity: 10 }, traumaState: { intensity: 24 }, breakdownState: { pending: false, lastTurn: -999, lowStreak: 2 } }, { turnCount: 40 }), "sanity 10 must force breakdown");
assert(!shouldForceBreakdown({ stats: { sanity: 62 }, traumaState: { intensity: 4 }, breakdownState: { pending: false, lastTurn: -999, lowStreak: 0 } }, { turnCount: 8 }), "stable sanity must not force breakdown");

assert(canonicalizeCountry("中華民國", 1935, "china") === "中華民國", "pre-1949 mainland stays ROC");
assert(canonicalizeCountry("中華民國", 1967, "china") === "中華人民共和國", "stale ROC birth stamp remaps on mainland after 1949");
assert(canonicalizeCountry("臺灣", 1967, "taiwan") === "中華民國／臺灣省", "1967 Taiwan is ROC Taiwan province");
assert(!canonicalizeCountry("臺灣", 1967, "taiwan").includes("中華人民共和國"), "Taiwan never becomes PRC");
assert(getSettlementCountry(findSettlement("yanji"), 1967) === "中華人民共和國", "1967 Yanji is PRC");
assert(getSettlementCountry(findSettlement("taipei"), 1935).includes("日本"), "1935 Taipei is Japanese Taiwan");
assert(getSettlementCountry(findSettlement("taipei"), 1967) === "中華民國／臺灣省", "1967 Taipei is ROC Taiwan province");

const clock = alignLiveClock({
  year: 1967,
  ageYears: 5,
  character: { birthYear: 1938, region: "africa" },
});
assert(clock.year === 1967 && clock.age === 29, "inconsistent age is corrected from birth year");
const driftedFacts = scanNarrativeFacts({
  year: 1967,
  ageYears: 5,
  character: { birthYear: 1938, region: "china", cityName: "延吉", familyClassId: "peasant" },
});
assert(driftedFacts.year === 1967 && driftedFacts.age === 29, "fact sheet cannot keep a time-travel age");
const clockOk = alignLiveClock({
  year: 1927,
  ageYears: 5,
  character: { birthYear: 1922 },
});
assert(clockOk.year === 1927 && clockOk.age === 5, "consistent year/age/birth stays put");
const beforeBirthday = alignLiveClock({
  year: 1927,
  ageYears: 4,
  character: { birthYear: 1922 },
});
assert(beforeBirthday.year === 1927 && beforeBirthday.age === 4, "age may trail year-birth by one");

const oyoFacts = scanNarrativeFacts({
  year: 1927,
  ageYears: 5,
  region: "africa",
  settlement: findSettlement("oyo_village"),
  character: { birthYear: 1922, region: "africa", cityName: "奧約農村", climate: "tropical", familyClassId: "peasant" },
});
assert(oyoFacts.year === 1927 && oyoFacts.age === 5, "oyo facts stay in 1927");
const oyoLine = composeFortnightRecord(() => 0.2, {
  year: 1927,
  ageYears: 5,
  region: "africa",
  settlement: findSettlement("oyo_village"),
  character: { birthYear: 1922, region: "africa", climate: "tropical", familyClassId: "peasant", cityName: "奧約農村" },
  narrativeFacts: oyoFacts,
});
assert(!/麵包/.test(oyoLine), `Africa 1927 must not use bread: ${oyoLine}`);
assert(!/1922/.test(oyoLine), `chronicle must not reprint birth year: ${oyoLine}`);
assert(!/落地|分得清|出生/.test(oyoLine), `chronicle must not restack birth copy: ${oyoLine}`);

const dingFacts = scanNarrativeFacts({
  year: 1935,
  ageYears: 5,
  region: "china",
  settlement: findSettlement("dingxian"),
  character: { birthYear: 1930, region: "china", cityName: "定縣農村", climate: "continental", familyClassId: "peasant" },
});
assert(dingFacts.year === 1935 && dingFacts.age === 5, "dingxian facts stay in 1935");
const dingLine = composeFortnightRecord(() => 0.2, {
  year: 1935,
  ageYears: 5,
  region: "china",
  settlement: findSettlement("dingxian"),
  character: { birthYear: 1930, region: "china", climate: "continental", familyClassId: "peasant", cityName: "定縣農村" },
  narrativeFacts: dingFacts,
});
assert(!/麵包/.test(dingLine), `North China 1935 must not use bread: ${dingLine}`);
assert(!/1930/.test(dingLine), `dingxian chronicle must not reprint birth year: ${dingLine}`);

const locked = lockChronicleToClock("1922年落地。1967年，延吉。配給麵包發綠。", {
  year: 1967,
  age: 29,
  region: "china",
  city: "延吉",
  climate: "cold",
  economy: "poor",
});
assert(!/1922/.test(locked) && !/落地/.test(locked), `lock drops foreign year and birth copy: ${locked}`);
assert(!/麵包/.test(locked), `lock scrubs bread in China: ${locked}`);

const yanjiNow = genesis.generateRandomCharacter({ birthYear: 1967, settlementId: "yanji" });
assert(yanjiNow.country === "中華人民共和國", `1967 Yanji polity: ${yanjiNow.country}`);
const taipeiNow = genesis.generateRandomCharacter({ birthYear: 1967, settlementId: "taipei" });
assert(taipeiNow.country === "中華民國／臺灣省", `1967 Taipei polity: ${taipeiNow.country}`);
const taipeiJp = genesis.generateRandomCharacter({ birthYear: 1935, settlementId: "taipei" });
assert(/日本/.test(taipeiJp.country) && /臺灣/.test(taipeiJp.country), `1935 Taipei polity: ${taipeiJp.country}`);

let threw = false;
try {
  genesis.generateRandomCharacter({ birthYear: 1940, settlementId: "brasilia" });
} catch {
  threw = true;
}
assert(threw, "year-city lock");

threw = false;
try {
  genesis.generateRandomCharacter({ birthDate: "1960-01-01", settlementId: "brasilia" });
} catch {
  threw = true;
}
assert(threw, "date-city lock before founding");

const brasiliaOk = genesis.generateRandomCharacter({ birthDate: "1960-04-21", settlementId: "brasilia" });
assert(brasiliaOk.cityId === "brasilia" && brasiliaOk.birthIso === "1960-04-21", "brasilia on founding date");

const ushuaia = genesis.generateRandomCharacter({ birthDate: "1985-07-15", settlementId: "ushuaia" });
assert(ushuaia.tags.includes("date_winter") || ushuaia.natalEnvironment.season === "winter", "south-hemisphere July is winter");
assert(ushuaia.tags.includes("hemisphere_south"), "ushuaia south");

const longyear = findSettlement("longyearbyen");
const polarNatal = natalEnvironmentTags(makeDate(1990, 12, 20), longyear);
assert(polarNatal.tags.includes("env_polar_night") || polarNatal.tags.includes("env_extreme_cold"), "polar night natal");

let birthRangeThrew = false;
try {
  genesis.generateRandomCharacter({ birthDate: "1910-06-15", settlementId: "oyo_village" });
} catch {
  birthRangeThrew = true;
}
assert(birthRangeThrew, "pre-1920 birthDate must fail closed");
birthRangeThrew = false;
try {
  genesis.generateRandomCharacter({ birthDate: "2030-01-01", settlementId: "beijing" });
} catch {
  birthRangeThrew = true;
}
assert(birthRangeThrew, "post-2025 birthDate must fail closed");

const memo = composeMementoCard({
  character: {
    name: "張三",
    birthplaceLabel: "中華民國，定縣農村",
    birthYear: 1930,
    birthDate: { year: 1930, month: 3, day: 1 },
    tags: ["trauma_ptsd", "mood_calm"],
    tagRecords: [
      { id: "trauma_ptsd", category: "trauma" },
      { id: "mood_calm", category: "mood" },
    ],
  },
  time: { year: 1935, month: 3, day: 1, ageYears: 5 },
  ending: { kind: "death", fatal: true, reason: "健康歸零", detail: "" },
  seed: 7,
  turnCount: 12,
});
assert(memo.weeksLived >= 260, `weeksLived from birth date: ${memo.weeksLived}`);
assert(/定縣/.test(memo.birthplace), `memento keeps precise birthplace: ${memo.birthplace}`);
assert(memo.tags.some((row) => row.id === "trauma_ptsd"), "memento keeps trauma tags");
assert(!memo.tags.some((row) => row.id === "mood_calm"), "memento drops mundane mood tags");
assert(memo.weeksLine.includes("週"), `weeks line must name weeks: ${memo.weeksLine}`);

const liveCtx = {
  year: 1931,
  ageYears: 9,
  week: 10,
  turn: 10,
  region: "west",
  tags: ["socio_extreme_poverty", "household_hungry"],
  stats: { health: 34, sanity: 48 },
  settlement: findSettlement("chicago") || { kind: "city", region: "west", climate: "continental" },
  character: {
    birthYear: 1922,
    region: "west",
    cityName: "芝加哥",
    familyClassId: "worker",
    familyClassLabel: "工人",
    country: "美國",
    climate: "continental",
    tags: ["socio_extreme_poverty", "household_hungry"],
    stats: { health: 34, sanity: 48 },
    bloodline: { parents: { father: { alive: true }, mother: { alive: true } } },
  },
  upheaval: { label: "大蕭條", threads: ["unemployment"], score: 28 },
};
liveCtx.narrativeFacts = scanNarrativeFacts(liveCtx);
const hungerA = composeChoiceLine(() => 0.2, liveCtx, "hunger", 0, { direction: "seek" });
const hungerB = composeChoiceLine(() => 0.7, liveCtx, "hunger", 1, { direction: "guard" });
assert(hungerA && hungerB && hungerA !== hungerB, `live choices must diverge: ${hungerA} / ${hungerB}`);
assert(/芝加哥|美國/.test(hungerA + hungerB), `choice must name live place: ${hungerA} / ${hungerB}`);
const schoolLocked = maybeVaryChoice(() => 0.41, {
  id: "school_demo",
  text: "按校規把點名冊交上去",
  schoolIncident: true,
  schoolKind: "exam",
  direction: "endure",
}, liveCtx, 0);
assert(schoolLocked.text !== "按校規把點名冊交上去", `locked incident must remint: ${schoolLocked.text}`);
const follow = composeLiveFollowUp(() => 0.3, liveCtx, { direction: "endure" });
assert(/1931/.test(follow), `follow-up must stay on the live year: ${follow}`);
const unusedWho = { exclusionBuffer: { turn: 2, items: [], never: [], neverIds: [] } };
rememberUnpicked(unusedWho, [
  { id: "a", text: "去芝加哥把能換成稀粥的路走完" },
  { id: "b", text: "把門栓插上，聽見拍門先裝作沒人" },
  { id: "c", text: "把這兩週的上工先做完再說話" },
], 0);
assert(optionExcluded(unusedWho, "b", "把門栓插上，聽見拍門先裝作沒人"), "unused option must stay excluded");
assert(!optionExcluded(unusedWho, "a", "去芝加哥把能換成稀粥的路走完"), "chosen option is not permanently banned by rememberUnpicked");
assert(
  textsTooSimilar(
    "把母親Clara·Clark還沒扣走的那口舖子裏賣不掉的隔夜貨護住，屋裏有人盯著",
    "把母親Clara·Clark還沒扣走的那口舖子裏賣不掉的隔夜貨護住",
  ),
  "near-duplicate choice cores must clash",
);

const triadCtx = {
  ...liveCtx,
  character: { ...liveCtx.character, exclusionBuffer: { turn: 1, items: [], never: [], neverIds: [] } },
};
const clashTriad = ensureDistinctChoiceTriad(() => 0.33, [
  { id: "x1", text: "把母親還沒扣走的那口稀粥護住，屋裏有人盯著" },
  { id: "x2", text: "去芝加哥把能換成稀粥的路走完" },
  { id: "x3", text: "把母親還沒扣走的那口稀粥護住" },
], triadCtx);
assert(clashTriad.length === 3, "triad must keep three slots");
assert(
  !textsTooSimilar(clashTriad[0].text, clashTriad[1].text)
  && !textsTooSimilar(clashTriad[0].text, clashTriad[2].text)
  && !textsTooSimilar(clashTriad[1].text, clashTriad[2].text),
  `forced triad must be pairwise distinct: ${clashTriad.map((row) => row.text).join(" | ")}`,
);

const hanGloss = composeTagGloss({ id: "ethnicity_han", label: "漢族", category: "ethnicity" });
const inuitGloss = composeTagGloss({ id: "ethnicity_inuit", label: "因紐特", category: "ethnicity" });
assert(hanGloss && inuitGloss && hanGloss !== inuitGloss, `ethnicity gloss must be unique: ${hanGloss} / ${inuitGloss}`);
assert(/稻作|宗族|中國/.test(hanGloss), `Han gloss must keep geo/history: ${hanGloss}`);
assert(/北極|海冰|極地/.test(inuitGloss), `Inuit gloss must keep arctic geo: ${inuitGloss}`);
assert(!/ALDH2|EPAS1|民族誌/.test(hanGloss + inuitGloss), "ethnicity gloss must not leak lab notes");
const peasantGloss = tagGloss({ id: "class_peasant", label: "貧農", category: "class" });
assert(/餘糧|田埂/.test(peasantGloss), `class gloss: ${peasantGloss}`);
const traumaGloss = tagGloss({ id: "trauma_ptsd", label: "驚悸未褪", category: "trauma" });
assert(traumaGloss.length >= 8, `trauma gloss too thin: ${traumaGloss}`);
const unknownGloss = composeTagGloss({ id: "hook_weather", label: "天氣", category: "hook" });
assert(unknownGloss, "unknown prefix must still mint a gloss");

const encounterCtx = {
  ...liveCtx,
  cityId: "chicago",
  skipFigureScan: true,
};
const week = composeWeekEncounter(() => 0.11, encounterCtx);
assert(week.contextualIntro && week.intro, "weekly encounter must mint an intro");
assert(/1931/.test(week.intro) && /芝加哥|美國/.test(week.intro), `intro must stay on the live clock: ${week.intro}`);
assert(!/發跡|命運的風鈴|光影交織/.test(week.intro), `intro must stay plain: ${week.intro}`);
const stalinCtx = {
  year: 1936,
  ageYears: 16,
  week: 8,
  region: "russia",
  cityId: "moscow",
  skipFigureScan: true,
  lockedFigure: { figureId: "stalin", figureName: "史達林", mission: "集體化與大清洗", figureRole: "politician" },
  settlement: findSettlement("moscow") || { kind: "city", region: "russia" },
  character: {
    birthYear: 1920,
    region: "russia",
    cityName: "莫斯科",
    cityId: "moscow",
    familyClassId: "worker",
    familyClassLabel: "工人",
    country: "蘇聯",
    climate: "continental",
    tags: [],
    stats: { health: 50, sanity: 50 },
  },
};
const stalinWeek = composeWeekEncounter(() => 0.2, stalinCtx);
assert(/史達林/.test(stalinWeek.intro), `figure must weave when present: ${stalinWeek.intro}`);
assert(stalinWeek.pressure === "figure", "locked figure sets figure pressure");
const a = composeEncounterChoice(() => 0.2, stalinCtx, stalinWeek, 0);
const b = composeEncounterChoice(() => 0.4, stalinCtx, stalinWeek, 1);
assert(a && b && a !== b, `encounter choices must diverge: ${a} / ${b}`);
assert(/史達林|莫斯科/.test(a + b), `choices must answer the figure encounter: ${a} / ${b}`);
assert(inspectPublicLine("命運的風鈴在巷口響").ok === false, "monitor must reject riddle copy");
assert(inspectPublicLine("trauma_ptsd 寫進本週").ok === false, "monitor must reject tag ids");
assert(inspectPublicLine("把能當的東西換成最小的那碗的那口還能買到的米").ok === false, "monitor must reject mashup");
const repaired = monitorPublicText(() => 0.2, "命運的風鈴。1922年落地。", encounterCtx);
assert(repaired && !/命運的風鈴|1922/.test(repaired), `monitor must recompose riddle/anachronism: ${repaired}`);
assert(/1931|芝加哥|美國/.test(repaired), `repaired line must stay on the live clock: ${repaired}`);
const gatedWeek = gateWeeklyOutput(() => 0.3, {
  narrative: week.intro,
  options: [{ text: "命運的風鈴" }, { text: "trauma_ptsd" }, { text: a }],
}, encounterCtx);
assert(gatedWeek.textMonitor?.gated, "weekly output must pass the text monitor");
assert(gatedWeek.textMonitor?.logicFilter && gatedWeek.textMonitor?.varietyGuard, "weekly output must pass the logic filter");
assert(gatedWeek.options.length === 3, "gated triad stays three");
assert(gatedWeek.options.every((row) => row.text && !/命運的風鈴|trauma_/.test(row.text)), "gated options must be clean");
assert(new Set(gatedWeek.options.map((row) => row.text)).size === 3, `gated options must stay distinct: ${gatedWeek.options.map((row) => row.text).join(" / ")}`);
assert(new Set(gatedWeek.options.map((row) => sentenceShape(row.text))).size >= 2, `gated options must vary shape: ${gatedWeek.options.map((row) => row.text).join(" / ")}`);

const sickLogic = {
  year: 1931,
  ageYears: 20,
  stats: { health: 8 },
  tags: ["condition_paralysis"],
  character: {
    birthYear: 1911,
    stats: { health: 8 },
    tags: ["condition_paralysis"],
    familyClassId: "worker",
    cityName: "芝加哥",
    country: "美國",
    region: "west",
  },
};
assert(inspectPublicLine("重病的人連夜狂奔趕路", sickLogic).ok === false, "monitor must reject frail sprint");
assert(scanLogicFaults("連夜趕路扛麻袋", sickLogic).includes("frail_exertion"), "logic filter flags exertion");
const poorLogic = {
  year: 1931,
  ageYears: 20,
  character: {
    birthYear: 1911,
    means: 8,
    familyClassId: "peasant",
    tags: ["socio_extreme_poverty"],
    stats: { health: 44 },
    cityName: "定縣農村",
    country: "中華民國",
    region: "china",
  },
};
assert(inspectPublicLine("隨手揮霍金條買下豪宅", poorLogic).ok === false, "monitor must reject destitute luxury");
assert(filterPublicLine("隨手揮霍金條買下豪宅", poorLogic, { skipVariety: true }).reasons.includes("destitute_luxury"), "destitute luxury is a logic fault");
const childLogic = {
  year: 1931,
  ageYears: 5,
  character: {
    birthYear: 1926,
    familyClassId: "worker",
    stats: { health: 50 },
    cityName: "芝加哥",
    country: "美國",
    region: "west",
  },
};
assert(inspectPublicLine("五歲去交易所入股", childLogic).ok === false, "monitor must reject child stock trade");
assert(sentenceShape("去芝加哥把路走完") !== sentenceShape("不把能當的東西交出去"), "sentence shapes must diverge");

const poorWho = {
  familyClassId: "peasant",
  means: 10,
  tags: ["socio_extreme_poverty"],
  stats: { health: 40, sanity: 40 },
};
seedWealth(poorWho);
assert(poorWho.wealth && Number.isFinite(poorWho.wealth.cash), "wealth seed must mint cash");
assert(poorWho.wealth.debt >= 0, "debt starts non-negative");
const beforeCash = poorWho.wealth.cash;
applyWealthDelta(poorWho, { means: -8 });
assert(evaluateBankruptcy(poorWho).broke || poorWho.wealth.cash < beforeCash || poorWho.wealth.debt > 0, "loss must hit cash or raise debt");
applyWealthDelta(poorWho, { cash: -999, debt: 90 });
assert(evaluateBankruptcy(poorWho).broke, "emptied books must count as bankrupt");
assert(shouldForceWealthCrisis(poorWho, { turnCount: 80 }), "bankrupt must arm wealth crisis");
const boom = eraShockOf({ year: 1931, region: "west" });
assert(boom.income < 1 && boom.shock === "depression", "1931 west must cut income");
const merchant = { familyClassId: "merchant", means: 70, tags: [], stats: { health: 55, sanity: 55 } };
seedWealth(merchant);
const week = weeklyEconomicTick(merchant, { year: 1924, ageYears: 30, region: "west", character: merchant });
assert(Number.isFinite(week.income) && Number.isFinite(week.expense), "weekly cashflow must be numeric");

const kinWho = {
  birthYear: 1930,
  familyClassId: "peasant",
  cityId: "dingxian",
  gender: "male",
  householdClimate: ["household_extractive"],
  tags: ["parent_father_alive", "parent_mother_alive"],
  bloodline: {
    primaryEthnicityId: "han",
    parents: {
      father: { name: "張父", birthYear: 1900, aliveAtBirth: true, deathYear: null, alive: true },
      mother: { name: "李母", birthYear: 1905, aliveAtBirth: true, deathYear: null, alive: true },
    },
  },
  stats: { health: 50, sanity: 50 },
};
const kinRng = createRng(42);
seedNpcNetwork(kinWho, kinRng);
assert(kinWho.npcNetwork?.npcs?.some((npc) => npc.role === "father"), "kin network seeds father");
assert(kinWho.npcNetwork.npcs.some((npc) => npc.role === "mother"), "kin network seeds mother");
const mom = kinWho.npcNetwork.npcs.find((npc) => npc.role === "mother");
assert(Number.isFinite(mom.affection) && mom.attitude, "mother has affection and attitude");
applyAffectionDelta(kinWho, mom.id, -80, { year: 1935 });
assert(mom.affection <= 18, "affection can crash into hostility");
killNpc(kinWho, "father", { year: 1936, cause: "war" });
killNpc(kinWho, "mother", { year: 1936, cause: "illness" });
const parentsNow = livingParentRoles(kinWho, 1936);
assert(parentsNow.orphan, "both parents dead must orphan");
assert(shouldForceKinCrisis(kinWho, { turnCount: 90, year: 1936 }), "orphan must arm kin crisis");
const kinView = publicKinView(kinWho, 1936);
assert(/父母/.test(kinView.line), `kin public line names orphan: ${kinView.line}`);

const game = new GameEngine();
const state = game.initNewGame({ seed: 99 });
assert(!canBeginNewLife(game), "living file is locked");
const locked = game.initNewGame({ seed: 100 });
assert(locked.seed === state.seed, "initNewGame must not swap a living character");
assert(state.currentEvent.options.length === 3, "options");
assert(state.time.iso && state.time.month && state.time.day, "clock has exact date");
assert(state.currentEvent.currentTags?.length >= 1, "weekly current tags");
const step = game.selectOption(0);
assert(step.ok, "select");
assert(step.state.time.iso !== state.time.iso, "clock advanced by a week");

const winterCtx = currentEnvironmentTags(makeDate(1990, 1, 10), findSettlement("yakutsk"));
assert(winterCtx.tags.some((t) => t.startsWith("current_")), "current tag prefix");

console.log(JSON.stringify({
  ok: true,
  ethnicities: ETHNICITY_DATABASE.length,
  traits: TRAIT_DATABASE.length,
  name: char.name,
  birthIso: char.birthIso,
  city: char.cityName,
  birthplace: char.birthplaceLabel,
  season: char.natalEnvironment.seasonLabel,
  ancestries: char.bloodline.ancestries.map((a) => a.id),
  dateTags: char.tagsByCategory.date,
  envTags: char.tagsByCategory.env,
  traitTags: char.tagsByCategory.trait,
  parentTraitTags: char.tagsByCategory.parentTrait,
  tagCount: char.tags.length,
  sample: describeGenesis(char).slice(0, 360),
}, null, 2));
