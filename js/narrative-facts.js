/**
 * Four-pillar fact sheet for every bi-weekly turn.
 * Tags × family/class × country/city × live history — no story templates.
 */
import { getActiveHistory, getEraForYear } from "./data.js";
import { attachLifeContext } from "./life-context.js";
import { canonicalizeCountry } from "./data/polity.js";
import { getSettlementCountry, getSettlementDisplayName } from "./settlements.js";
import { GEO_BAND_ZH, publicTagLabel } from "./data/ui-zh.js";

function ancestryLabels(character = {}) {
  const rows = character.bloodline?.ancestries || [];
  const named = rows.map((row) => row.label).filter(Boolean);
  if (named.length) return named;
  const tag = (character.tags || []).find((id) => String(id).startsWith("ethnicity_"));
  if (!tag) return [];
  return [publicTagLabel({ id: tag }) || tag.replace(/^ethnicity_/, "")];
}

function housingOf(life, character, settlement) {
  const kind = settlement?.kind || character.settlementKind || "";
  const band = life.geoBand || character.geoBand || "";
  if (band === "slum" || life.economy === "destitute" && /city|metropolis|slum/.test(kind || "city")) {
    return "貧民窟或棚戶";
  }
  if (band === "camp" || /camp/.test(kind)) return "收容棚或難民營";
  if (band === "warzone") return "仍聽得到槍砲的街區";
  if (life.economy === "destitute" && /village|rural/.test(kind || band)) return "漏雨的土屋或茅屋";
  if (life.economy === "poor") return kind === "village" ? "村里的窄屋" : "工廠宿舍或窄巷";
  if (life.economy === "comfortable") return "有門牌、能關嚴的房子";
  return kind === "village" ? "村裏的屋子" : "城裡普通的一戶";
}

function pulseFitsYear(title, year) {
  const raw = String(title || "");
  const years = [...raw.matchAll(/\b((?:1[89]|20)\d{2})\b/g)].map((row) => Number(row[1]));
  if (!years.length || !year) return true;
  return years.every((stamp) => stamp === Number(year));
}

function historyNouns(ctx, year, region) {
  const nouns = [];
  const upheaval = ctx.upheaval || {};
  const threads = upheaval.threads || [];
  if (upheaval.label) nouns.push(upheaval.label);
  if (threads.includes("unemployment")) nouns.push("糧店常關", "排隊買不到");
  if (threads.includes("war") || threads.includes("conscription")) nouns.push("徵兵", "逃難的消息");
  if (threads.includes("famine") || (threads.includes("unemployment") && ctx.lifeContext?.hungry)) {
    nouns.push("糧店時開時關");
  }
  if (threads.includes("purge") || threads.includes("occupation")) nouns.push("清點戶口", "抓人");
  const era = getEraForYear(year) || {};
  const week = ctx.week || ctx.time?.week || 1;
  const pulses = getActiveHistory(year, week, region) || [];
  const pulse = pulses.find((row) => pulseFitsYear(row.title, year)) || null;
  if (pulse?.title) nouns.push(pulse.title);
  return {
    nouns: [...new Set(nouns)].filter(Boolean).slice(0, 4),
    eraName: era.name || `${year}年代`,
    eraSummary: era.summary || "",
    pulseTitle: pulse?.title || "",
    pulseId: pulse?.id || null,
    upheavalLabel: upheaval.label || "",
    threads,
  };
}

export function alignLiveClock(ctx = {}) {
  const character = ctx.character || {};
  const born = Number(character.birthYear);
  const clockYear = Number(ctx.year ?? ctx.time?.year);
  const clockAge = Number(ctx.ageYears ?? ctx.time?.ageYears);
  let year = Number.isFinite(clockYear) ? clockYear : NaN;
  let age = Number.isFinite(clockAge) ? clockAge : NaN;
  if (Number.isFinite(born) && born > 0) {
    if (Number.isFinite(year) && year < born) year = born;
    if (Number.isFinite(year)) {
      const expected = Math.max(0, year - born);
      const birthdayPending = expected > 0 && age === expected - 1;
      if (!Number.isFinite(age) || !(age === expected || birthdayPending)) {
        age = expected;
      }
    } else if (Number.isFinite(age)) {
      year = born + Math.max(0, Math.floor(age));
    } else {
      year = born;
      age = 0;
    }
  } else {
    if (!Number.isFinite(year)) year = Number(ctx.lifeContext?.year) || 0;
    if (!Number.isFinite(age)) age = 0;
  }
  return { year, age, birthYear: Number.isFinite(born) && born > 0 ? born : 0 };
}

export function scanNarrativeFacts(ctx = {}) {
  const character = ctx.character || {};
  if (!ctx.lifeContext) attachLifeContext(ctx);
  const life = ctx.lifeContext || {};
  const clock = alignLiveClock({ ...ctx, character });
  const year = clock.year;
  const settlement = ctx.settlement || null;
  const city = settlement
    ? getSettlementDisplayName(settlement, year)
    : (character.cityName || "此地");
  const country = canonicalizeCountry(
    ctx.country
      || (settlement ? getSettlementCountry(settlement, year) : "")
      || character.country
      || settlement?.country
      || "",
    year,
    character.region || settlement?.region || ctx.region,
  );
  const health = Number(ctx.stats?.health ?? character.stats?.health ?? 50);
  const sanity = Number(ctx.stats?.sanity ?? character.stats?.sanity ?? 50);
  const tags = life.tags || ctx.tags || character.tags || [];
  const hist = historyNouns(ctx, year, character.region || settlement?.region || ctx.region);
  const ancestry = ancestryLabels(character);
  const parents = character.bloodline?.parents || {};
  const hasFatherRecord = Boolean(parents.father);
  const hasMotherRecord = Boolean(parents.mother);
  const network = character.npcNetwork?.npcs || [];
  const fatherNpc = network.find((npc) => npc.role === "father");
  const motherNpc = network.find((npc) => npc.role === "mother");
  const livingKin = network.filter((npc) => {
    if (npc.alive === false) return false;
    if (npc.deathYear != null && Number(npc.deathYear) <= Number(year)) return false;
    return true;
  });
  const kinNames = livingKin.map((npc) => npc.name).filter(Boolean);
  return {
    year,
    birthYear: clock.birthYear,
    age: clock.age,
    city,
    country,
    region: character.region || settlement?.region || ctx.region || "",
    climate: character.climate || settlement?.climate || "",
    kind: settlement?.kind || character.settlementKind || "",
    place: country ? `${country}，${city}` : city,
    classId: life.classId || character.familyClassId || "worker",
    classLabel: life.classLabel || character.familyClassLabel || "未登記",
    economy: life.economy || "getting_by",
    poor: Boolean(life.poor),
    affluent: Boolean(life.affluent),
    means: Number(life.means ?? character.means ?? 40),
    housing: housingOf(life, character, settlement),
    housingBand: GEO_BAND_ZH[life.geoBand] || "",
    hasFatherRecord,
    hasMotherRecord,
    fatherAlive: hasFatherRecord ? life.fatherAlive !== false : true,
    motherAlive: hasMotherRecord ? life.motherAlive !== false : true,
    fatherName: fatherNpc?.name || parents.father?.name || "",
    motherName: motherNpc?.name || parents.mother?.name || "",
    kinLiving: livingKin.map((npc) => ({
      role: npc.role,
      name: npc.name,
      affection: npc.affection,
      attitude: npc.attitude,
    })),
    kinNames,
    orphan: Boolean(hasFatherRecord && hasMotherRecord && life.orphan),
    health,
    sanity,
    hungry: Boolean(life.hungry) || health <= 36 || tags.includes("household_hungry"),
    edema: health <= 32 || tags.includes("household_hungry") || tags.includes("socio_extreme_poverty"),
    fever: health <= 28 || tags.some((tag) => String(tag).startsWith("condition_")),
    trauma: tags.some((tag) => String(tag).startsWith("trauma_")),
    householdHarsh: Boolean(life.householdHarsh),
    ancestry,
    minority: Boolean(character.bloodline?.mixed || character.constitution?.minority || life.minority),
    tags,
    posTags: life.posTags || [],
    negTags: life.negTags || [],
    season: ctx.environment?.seasonLabel || ctx.season || "",
    stageId: ctx.stage?.id || "",
    gender: character.gender === "female" ? "女" : "男",
    childWord: character.gender === "female" ? "女孩" : "男孩",
    name: character.name || "未名",
    ...hist,
    scanned: true,
    fourPillars: true,
  };
}
