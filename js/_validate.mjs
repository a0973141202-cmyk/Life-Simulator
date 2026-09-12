import { GenesisEngine, describeGenesis } from "./genesis.js";
import { ETHNICITY_DATABASE } from "./data/ethnicities-database.js";
import { TRAIT_DATABASE } from "./data/traits-database.js";
import { isForbiddenEthnicity } from "./data/forbidden-groups.js";
import { GameEngine } from "./GameEngine.js";
import { isLeapYear, isValidGregorianDate, makeDate } from "./data/calendar.js";
import { natalEnvironmentTags } from "./data/seasons.js";
import { findSettlement, isSettlementAvailable } from "./settlements.js";
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
assert(char.genesisMeta?.untaggedBaseline === true, "untaggedBaseline flag");
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
