/**
 * Snapshot the living household + every live tag before a week is drawn.
 * Event/option pools must pass this filter; fail closed on contradictions.
 */
import { FAMILY_CLASSES } from "./data.js";
import { uniqueTags } from "./tag-system.js";
import { optionExcluded } from "./exclusion-buffer.js";

const DESTITUTE_HARDSHIP = /發黴|糠|樹皮|草根|餓得|斷糧|討飯|拾荒/;

function tagPolarity(id) {
  const tag = String(id || "");
  if (/^(trauma_|household_|condition_|risk_|crime_|caste_)/.test(tag)) return "neg";
  if (/^(trait_|parent_trait_)/.test(tag)) return "pos";
  if (/socio_extreme|socio_working_poor|socio_war|mood_depressed|parent_.*_deceased/.test(tag)) return "neg";
  if (/socio_merchant|socio_official|socio_gentry|socio_comfortable|socio_affluent|mood_euphoric/.test(tag)) {
    return "pos";
  }
  return "plain";
}

const FATHER_RE = /父親|爸爸|親父|生父|父執/;
const MOTHER_RE = /母親|媽媽|生母|娘親|娘家/;
const LUXURY_RE = /戲園|大餐|買醉|入股|酒樓|洋行應酬|金飾|筵席|聽戲|應酬/;
const IDLE_RE = /整天玩|去公園跳|追著紙團|玩耍到天黑|踢罐子|跳房子|紙牌/;
const REASON_FATHER_RE = /求父親講理|跟父親講理|求父親別再/;

function parentAlive(parent, tags, role, year) {
  if (tags.includes(`parent_${role}_deceased`)) return false;
  if (parent?.deathYear != null && year != null && Number(parent.deathYear) <= Number(year)) return false;
  if (tags.includes(`parent_${role}_alive`)) return true;
  if (!parent) return false;
  return parent.aliveAtBirth !== false && parent.alive !== false;
}

function mentions(action, re) {
  const text = `${action?.text || ""} ${(action?.hooks || []).join(" ")}`;
  return re.test(text);
}

export function attachLifeContext(ctx = {}) {
  const character = ctx.character || {};
  const blood = character.bloodline || {};
  const parents = blood.parents || {};
  const classId = character.familyClassId || ctx.familyClassId || "peasant";
  const classRow = FAMILY_CLASSES.find((row) => row.id === classId) || FAMILY_CLASSES[0];
  const means = Number(character.means ?? character.stats?.wealth ?? 40);
  const tags = uniqueTags([
    ...(ctx.tags || []),
    ...(character.tags || []),
    ...(character.socioTags || []),
    ...(character.householdClimate || []),
    ...((character.tagRecords || []).map((row) => row.id)),
    ...(ctx.environment?.tags || []),
    ...(character.bloodline?.hooks || []).map((hook) => (
      String(hook).startsWith("hook_") ? hook : `hook_${hook}`
    )),
  ]);
  const household = uniqueTags([
    ...(character.householdClimate || []),
    ...tags.filter((id) => String(id).startsWith("household_")),
  ]);
  const socio = uniqueTags([
    ...(character.socioTags || []),
    ...tags.filter((id) => String(id).startsWith("socio_")),
  ]);
  const ancestry = uniqueTags([
    ...((blood.ancestries || []).map((row) => row.id || row)),
    ...tags.filter((id) => String(id).startsWith("ethnicity_") || String(id).startsWith("lineage_")),
  ]);
  const envTags = tags.filter((id) => (
    String(id).startsWith("current_env_")
    || String(id).startsWith("env_")
    || String(id).startsWith("climate_")
    || String(id).startsWith("current_date_")
  ));
  const year = ctx.year ?? character.birthYear;
  const fatherAlive = parentAlive(parents.father, tags, "father", year);
  const motherAlive = parentAlive(parents.mother, tags, "mother", year);
  let economy = "getting_by";
  if (
    means < 22
    || socio.includes("socio_extreme_poverty")
    || tags.includes("household_hungry")
    || (classId === "peasant" && means < 34)
  ) {
    economy = "destitute";
  } else if (means < 38 || socio.includes("socio_working_poor") || ["worker", "immigrant"].includes(classId)) {
    economy = "poor";
  } else if (
    means >= 62
    || ["merchant", "official", "gentry"].includes(classId)
    || socio.includes("socio_comfortable")
    || socio.includes("socio_affluent")
  ) {
    economy = "comfortable";
  }
  const harsh = household.some((id) => /extractive|volatile|alcohol|neglect|step_tension|silent|absent|hungry/.test(id));
  const hungry = tags.includes("household_hungry")
    || socio.includes("socio_extreme_poverty")
    || tags.includes("famine")
    || tags.includes("world_famine_witness")
    || means < 26;
  const war = tags.includes("war")
    || tags.includes("occupation")
    || tags.includes("bombardment")
    || tags.includes("hook_war")
    || tags.includes("戰火");
  const posTags = tags.filter((id) => tagPolarity(id) === "pos");
  const negTags = tags.filter((id) => tagPolarity(id) === "neg");
  const lifeContext = {
    classId,
    classLabel: character.familyClassLabel || classRow.label,
    means,
    economy,
    poor: economy === "destitute" || economy === "poor"
      || means < 38
      || socio.includes("socio_working_poor")
      || socio.includes("socio_extreme_poverty"),
    affluent: economy === "comfortable"
      || means >= 62
      || socio.includes("socio_comfortable")
      || socio.includes("socio_affluent")
      || socio.includes("socio_merchant_capital")
      || socio.includes("socio_gentry_estate"),
    household,
    householdHarsh: harsh,
    fatherAlive,
    motherAlive,
    anyParentAlive: fatherAlive || motherAlive,
    tags,
    posTags,
    negTags,
    ancestry,
    socio,
    envTags,
    year,
    place: character.birthplaceLabel || character.birthplace || character.originLabel,
    geoBand: character.geoBand || ctx.geoBand,
    hungry,
    war,
    orphan: !fatherAlive && !motherAlive,
    scanned: true,
    contextAwareRandom: true,
  };
  ctx.lifeContext = lifeContext;
  ctx.tags = tags;
  ctx.familyClassId = classId;
  ctx.contextAwareRandom = true;
  return lifeContext;
}

export function contextAllowsOption(action, ctx = {}) {
  const life = ctx.lifeContext || attachLifeContext(ctx);
  if (mentions(action, FATHER_RE) && !life.fatherAlive) return false;
  if (mentions(action, MOTHER_RE) && !life.motherAlive) return false;
  if ((life.hungry || life.war || life.poor) && (mentions(action, LUXURY_RE) || action.tone === "leisure")) {
    return false;
  }
  if (life.householdHarsh && mentions(action, IDLE_RE)) return false;
  if (life.household.includes("household_alcohol") && mentions(action, REASON_FATHER_RE)) return false;
  if (life.poor && !/merchant|official|gentry/.test(life.classId)) {
    if (/入股|洋行|酒樓應酬|金飾/.test(action.text || "")) return false;
  }
  if ((life.economy === "destitute" || life.economy === "poor") && (action.hooks || []).includes("leisure")) {
    return false;
  }
  if (life.economy === "comfortable" && DESTITUTE_HARDSHIP.test(action.text || "")) {
    if (!life.hungry && !life.war && ["official", "gentry", "merchant"].includes(life.classId)) return false;
  }
  const when = action.when || {};
  if (when.economy) {
    const allowed = Array.isArray(when.economy) ? when.economy : [when.economy];
    if (!allowed.includes(life.economy)) return false;
  }
  if (when.parents === "any" && life.orphan) return false;
  if (when.parents === "father" && !life.fatherAlive) return false;
  if (when.parents === "mother" && !life.motherAlive) return false;
  if (when.parents === "both" && (!life.fatherAlive || !life.motherAlive)) return false;
  return true;
}

export { attachLifeContext as scanWeekContext, contextAllowsOption as fitsWeekContext };

export function filterContextPool(pool, ctx = {}, character = ctx.character) {
  return (pool || []).filter((action) => (
    contextAllowsOption(action, ctx)
    && !optionExcluded(character, action.id, action.text)
  ));
}
