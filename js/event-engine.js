/**
 * Weekly event sieve: index → strict prerequisites → tag-weighted sample.
 * Called once per fortnight. Candidate narrowing stays O(bucket), not O(library).
 */
import { WEEKLY_EVENT_POOL } from "./data/events-pool.js";
import { contentAllowedForAge } from "./age-gate.js";
import { semanticOptionAllowed } from "./semantic-filter.js";
import { filterActionsByBoundary } from "./boundary.js";
import { contextAllowsOption } from "./life-context.js";
import { progressAllowsAction } from "./life-stage-manager.js";
import { optionExcluded } from "./exclusion-buffer.js";
import { choiceWeight, isTagGated, whenTagsMatch } from "./choice-pool.js";
import { gateStatValue } from "./stat-canon.js";
import { isSettlementAvailable } from "./settlements.js";
import { pickWeighted } from "./rng.js";

const AGE_BANDS = Object.freeze([
  [5, 7],
  [8, 12],
  [13, 17],
  [18, 25],
  [26, 44],
  [45, 64],
  [65, 120],
]);

const GENDER_ALIASES = Object.freeze({
  male: "male",
  m: "male",
  man: "male",
  男: "male",
  男性: "male",
  female: "female",
  f: "female",
  woman: "female",
  女: "female",
  女性: "female",
});

const TECH_LOCKS = Object.freeze([
  { re: /智慧型手機|滑手機|簡訊|手機App/i, year: 2001 },
  { re: /網際網路|上網|網站|電子郵件|網咖/i, year: 1995 },
  { re: /個人電腦|電腦教室|開電腦/i, year: 1983 },
  { re: /衛星電話|手機/i, year: 1992 },
  { re: /電視/, year: 0 },
]);

let cachedIndex = null;

function inRange(value, range) {
  if (!range) return true;
  const n = Number(value);
  if (!Number.isFinite(n)) return false;
  if (Array.isArray(range)) return n >= Number(range[0]) && n <= Number(range[1]);
  return n === Number(range);
}

function asList(value) {
  if (value == null || value === "") return [];
  return Array.isArray(value) ? value : [value];
}

function decadeOf(year) {
  return Math.floor(Number(year) / 10) * 10;
}

function ageBandKey(age) {
  const n = Number(age) || 0;
  for (const [lo, hi] of AGE_BANDS) {
    if (n >= lo && n <= hi) return `${lo}-${hi}`;
  }
  return n < 5 ? "0-4" : "65-120";
}

function overlappingAgeBands(range) {
  const lo = Number(range[0]);
  const hi = Number(range[1]);
  const keys = [];
  for (const [a, b] of AGE_BANDS) {
    if (hi >= a && lo <= b) keys.push(`${a}-${b}`);
  }
  if (lo < 5) keys.push("0-4");
  return keys;
}

function foldGender(value) {
  const raw = String(value || "").trim().toLowerCase();
  return GENDER_ALIASES[raw] || GENDER_ALIASES[String(value || "").trim()] || raw;
}

function tvYearOf(sheet) {
  const region = String(sheet.region || "");
  const kind = String(sheet.kind || "");
  const village = /village|rural/.test(kind);
  if (region === "west" || region === "japan") return village ? 1965 : 1955;
  if (region === "russia") return 1960;
  if (["china", "taiwan", "korea", "hongkong"].includes(region)) return village ? 1985 : 1972;
  return village ? 1988 : 1975;
}

function corpusOf(item = {}) {
  return [
    item.id,
    item.text,
    item.trueText,
    item.optionText,
    item.fact,
    item.title,
    ...(item.hooks || []),
  ].filter(Boolean).join("\n");
}

export function specOf(item = {}) {
  const when = item.when || {};
  const pre = item.prerequisites || item.prereq || {};
  return {
    ...when,
    ...pre,
    age: pre.age || when.age || item.age || null,
    year: pre.year || when.year || item.year || null,
    gender: pre.gender || when.gender || item.gender || null,
    month: pre.month || when.month || null,
    day: pre.day || when.day || null,
    weekday: pre.weekday ?? when.weekday ?? null,
    dateFrom: pre.dateFrom || when.dateFrom || null,
    dateTo: pre.dateTo || when.dateTo || null,
    countriesAny: pre.countriesAny || when.countriesAny || null,
    citiesAny: pre.citiesAny || when.citiesAny || pre.cities || when.cities || null,
    settlementIds: pre.settlementIds || when.settlementIds || null,
    settlementKinds: pre.settlementKinds || when.settlementKinds || null,
    regions: pre.regions || when.regions || null,
    classes: pre.classes || when.classes || null,
    climates: pre.climates || when.climates || null,
  };
}

export function compileLiveSheet(ctx = {}) {
  if (ctx.liveSheet?.scanned) return ctx.liveSheet;
  const character = ctx.character || {};
  const date = ctx.date || {};
  const settlement = ctx.settlement || character.settlement || null;
  const year = Number(ctx.year || date.year || ctx.time?.year || 0);
  const month = Number(date.month || 0);
  const day = Number(date.day || 0);
  const tags = (ctx.tags || []).map((tag) => String(tag || "")).filter(Boolean);
  const tagSet = new Set(tags);
  const city = String(
    ctx.city
    || ctx.narrativeFacts?.city
    || character.cityName
    || settlement?.name
    || "",
  );
  const sheet = {
    scanned: true,
    year,
    age: Number(ctx.ageYears ?? ctx.age ?? 0),
    month,
    day,
    weekday: date.weekday,
    iso: date.iso || (year && month && day
      ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      : ""),
    gender: foldGender(character.gender || ctx.gender || ""),
    country: String(ctx.country || character.country || ""),
    city,
    cityId: ctx.cityId || settlement?.id || character.settlementId || "",
    region: ctx.region || character.region || settlement?.region || "",
    kind: ctx.kind || settlement?.kind || "",
    climate: ctx.climate || settlement?.climate || character.climate || "",
    familyClassId: ctx.familyClassId || character.familyClassId || "",
    tags,
    tagSet,
    settlement,
    settlementOk: !settlement || !year || isSettlementAvailable(settlement, year, month || null, day || null),
    intelligence: Number(ctx.stats?.intelligence ?? character.stats?.intelligence ?? 0),
    poor: Boolean(ctx.lifeContext?.poor || ctx.lifeContext?.hungry
      || tagSet.has("socio_extreme_poverty")
      || tagSet.has("socio_working_poor")),
    tvYear: 0,
  };
  sheet.tvYear = tvYearOf(sheet);
  ctx.liveSheet = sheet;
  return sheet;
}

function eraCopyAllowed(item, sheet) {
  const year = sheet.year;
  if (!year) return true;
  const text = corpusOf(item);
  if (!text) return true;
  for (const lock of TECH_LOCKS) {
    if (!lock.re.test(text)) continue;
    const floor = lock.year === 0 ? sheet.tvYear : lock.year;
    if (year < floor) return false;
  }
  return true;
}

function genderAllowed(spec, sheet) {
  const wanted = asList(spec.gender).map(foldGender).filter(Boolean);
  if (!wanted.length) return true;
  if (!sheet.gender) return false;
  return wanted.includes(sheet.gender);
}

function dateAllowed(spec, sheet) {
  if (spec.month && !inRange(sheet.month, spec.month)) return false;
  if (spec.day && !inRange(sheet.day, spec.day)) return false;
  if (spec.weekday != null && spec.weekday !== "") {
    const allowed = asList(spec.weekday).map((item) => Number(item));
    if (Number.isFinite(sheet.weekday) && !allowed.includes(Number(sheet.weekday))) return false;
  }
  if (spec.dateFrom && sheet.iso && sheet.iso < String(spec.dateFrom)) return false;
  if (spec.dateTo && sheet.iso && sheet.iso > String(spec.dateTo)) return false;
  return true;
}

function placeAllowed(spec, sheet) {
  if (!sheet.settlementOk) return false;
  if (spec.regions && !spec.regions.includes(sheet.region)) return false;
  if (spec.countriesAny) {
    if (!spec.countriesAny.some((item) => sheet.country.includes(item))) return false;
  }
  if (spec.settlementIds && !spec.settlementIds.includes(sheet.cityId)) return false;
  if (spec.settlementKinds && !spec.settlementKinds.includes(sheet.kind)) return false;
  if (spec.climates && !spec.climates.includes(sheet.climate)) return false;
  if (spec.citiesAny) {
    const hay = `${sheet.city}${sheet.cityId}`;
    if (!spec.citiesAny.some((item) => hay.includes(item))) return false;
  }
  if (spec.classes && !spec.classes.includes(sheet.familyClassId)) return false;
  return true;
}

export function eraPlaceAllows(item, ctx = {}) {
  if (!item) return false;
  const spec = specOf(item);
  const sheet = compileLiveSheet(ctx);
  if (spec.age && !inRange(sheet.age, spec.age)) return false;
  if (spec.year && !inRange(sheet.year, spec.year)) return false;
  if (!dateAllowed(spec, sheet)) return false;
  if (!genderAllowed(spec, sheet)) return false;
  if (!placeAllowed(spec, sheet)) return false;
  if (!eraCopyAllowed(item, sheet)) return false;
  return true;
}

export function meetsPrerequisites(item, ctx = {}, opts = {}) {
  if (!item) return false;
  const spec = specOf(item);
  const sheet = compileLiveSheet(ctx);
  const loose = Boolean(opts.loose);

  if (!contentAllowedForAge(item, ctx)) return false;
  if (!semanticOptionAllowed(item, ctx)) return false;
  if (spec.age && !inRange(sheet.age, spec.age)) return false;
  if (spec.year && !inRange(sheet.year, spec.year)) return false;
  if (!dateAllowed(spec, sheet)) return false;
  if (!genderAllowed(spec, sheet)) return false;
  if (!placeAllowed(spec, sheet)) return false;
  if (!eraCopyAllowed(item, sheet)) return false;

  if (!loose) {
    if (spec.stages && ctx.stage?.id && !spec.stages.includes(ctx.stage.id)) return false;
    if (!whenTagsMatch(spec, ctx)) return false;
    if (spec.stats) {
      for (const [key, range] of Object.entries(spec.stats)) {
        const value = gateStatValue(ctx, key);
        if (value == null) continue;
        if (!inRange(value, range)) return false;
      }
    }
    if (spec.occupationAny) {
      const occupation = ctx.character?.occupation || "";
      if (!spec.occupationAny.some((row) => occupation === row || occupation.includes(row))) return false;
    }
    const ledger = ctx.ledger || ctx.character?.ledger || {};
    if (spec.wanted && !inRange(ledger.wanted ?? 0, spec.wanted)) return false;
    if (spec.heat && !inRange(ledger.heat ?? 0, spec.heat)) return false;
    if (spec.trust && !inRange(ledger.trust ?? 50, spec.trust)) return false;
    if (spec.opinion && !inRange(ledger.opinion ?? 50, spec.opinion)) return false;
    if (spec.politicalCapital && !inRange(ledger.politicalCapital ?? 0, spec.politicalCapital)) return false;
    if (spec.pathsAny) {
      const minXp = spec.pathMin ?? 1;
      if (!spec.pathsAny.some((path) => (ledger.paths?.[path] || 0) >= minXp)) return false;
    }
    if (spec.pathsNone && spec.pathsNone.some((path) => (ledger.paths?.[path] || 0) >= (spec.pathMin ?? 1))) {
      return false;
    }
  }

  if (!contextAllowsOption(item, ctx)) return false;
  if (!progressAllowsAction(item, ctx)) return false;
  if (ctx.noOptionRecycling && optionExcluded(ctx.character, item.id, item.text)) return false;
  return true;
}

export function indexEventPool(pool = []) {
  const items = (pool || []).filter(Boolean);
  const byDecade = new Map();
  const byAge = new Map();
  const noYear = [];
  const noAge = [];
  const push = (map, key, index) => {
    const list = map.get(key);
    if (list) list.push(index);
    else map.set(key, [index]);
  };
  for (let i = 0; i < items.length; i += 1) {
    const spec = specOf(items[i]);
    if (!spec.year) noYear.push(i);
    else {
      const lo = Array.isArray(spec.year) ? spec.year[0] : spec.year;
      const hi = Array.isArray(spec.year) ? spec.year[1] : spec.year;
      const start = decadeOf(lo);
      const end = decadeOf(hi);
      if (Number.isFinite(start) && Number.isFinite(end)) {
        for (let year = start; year <= end; year += 10) push(byDecade, year, i);
      } else {
        noYear.push(i);
      }
    }
    if (!spec.age) noAge.push(i);
    else {
      const band = Array.isArray(spec.age) ? spec.age : [spec.age, spec.age];
      overlappingAgeBands(band).forEach((key) => push(byAge, key, i));
    }
  }
  return { items, byDecade, byAge, noYear, noAge, size: items.length };
}

export function weeklyEventIndex() {
  if (!cachedIndex) cachedIndex = indexEventPool(WEEKLY_EVENT_POOL);
  return cachedIndex;
}

export function candidatesFromIndex(index, ctx = {}) {
  const sheet = compileLiveSheet(ctx);
  const yearKeys = index.noYear;
  const decadeHits = index.byDecade.get(decadeOf(sheet.year)) || [];
  const ageHits = index.byAge.get(ageBandKey(sheet.age)) || [];
  const yearSet = new Set(decadeHits);
  for (const i of yearKeys) yearSet.add(i);
  const out = [];
  const ageSet = new Set(ageHits);
  for (const i of index.noAge) ageSet.add(i);
  const walk = yearSet.size <= ageSet.size ? yearSet : ageSet;
  const other = walk === yearSet ? ageSet : yearSet;
  for (const i of walk) {
    if (other.has(i)) out.push(index.items[i]);
  }
  return out;
}

export function eventWeight(action, ctx = {}) {
  let weight = choiceWeight(action, ctx);
  const sheet = compileLiveSheet(ctx);
  if (sheet.poor) {
    if (action.crisis || action.asymmetric || /survive|hunger|scarcity|crisis/.test(action.situation || "")) {
      weight *= 1.42;
    }
    if ((action.hooks || []).includes("survival") || (action.hooks || []).includes("scarcity")) {
      weight *= 1.18;
    }
    if (action.tone === "leisure" || (action.hooks || []).includes("leisure")) weight *= 0.32;
  }
  if (sheet.intelligence >= 68
    || sheet.tagSet.has("parent_trait_math_aptitude")
    || sheet.tagSet.has("parent_trait_verbal_aptitude")
    || sheet.tagSet.has("trait_visual_spatial_memory")
    || sheet.tagSet.has("trait_oral_memory")) {
    if ((action.hooks || []).includes("study") || action.organic === "gene" || action.tagDriven) {
      weight *= 1.26;
    }
  }
  const era = Number(ctx.eraCrisis?.score || 0);
  if (era >= 22) {
    if (action.crisis || action.asymmetric || (action.hooks || []).some((hook) => ["survival", "hunger", "hide", "scarcity"].includes(hook))) {
      weight *= 1.28 + Math.min(0.42, era / 140);
    }
    if (action.tone === "leisure" || (action.hooks || []).includes("leisure")) weight *= 0.3;
    if ((action.hooks || []).includes("study") && era >= 36) weight *= 0.72;
  }
  const broken = sheet.tagSet.has("trauma_ptsd")
    || sheet.tagSet.has("trauma_melancholia")
    || sheet.tagSet.has("trauma_persecution")
    || sheet.tagSet.has("trauma_persona_crack");
  if (broken) {
    if (action.crisis || action.traumaVictim || (action.hooks || []).some((hook) => ["survival", "hide", "night"].includes(hook))) {
      weight *= 1.26;
    }
    if (action.tone === "leisure" || (action.hooks || []).includes("leisure") || (action.hooks || []).includes("social")) {
      weight *= 0.42;
    }
    if (sheet.tagSet.has("trauma_melancholia") && (action.hooks || []).includes("study")) weight *= 0.55;
    if (sheet.tagSet.has("trauma_persecution") && (action.hooks || []).includes("official")) weight *= 0.6;
    if (sheet.tagSet.has("trauma_persona_crack") && ((action.hooks || []).includes("crime") || (action.hooks || []).includes("street"))) {
      weight *= 1.22;
    }
  }
  if (sheet.tagSet.has("mood_depressed") && (action.crisis || action.traumaVictim)) weight *= 1.12;
  if (sheet.tagSet.has("mood_euphoric") && (action.hooks || []).includes("social")) weight *= 1.08;
  if (sheet.tagSet.has("acquired_desperate_survival")
    && (action.crisis || (action.hooks || []).some((hook) => ["survival", "hunger", "hide"].includes(hook)))) {
    weight *= 1.22;
  }
  if (sheet.tagSet.has("acquired_cold_forged") && (action.hooks || []).includes("arctic")) weight *= 1.16;
  if (sheet.tagSet.has("acquired_heat_forged") && (action.hooks || []).some((hook) => ["heat", "desert"].includes(hook))) {
    weight *= 1.16;
  }
  return Math.max(0.04, weight);
}

export function sampleWeightedEvents(rng, pool, ctx, count = 1) {
  const picked = [];
  const available = (pool || []).filter(Boolean);
  while (picked.length < count && available.length) {
    const item = pickWeighted(rng, available, (row) => eventWeight(row, ctx));
    if (!item) break;
    picked.push(item);
    const at = available.indexOf(item);
    if (at >= 0) available.splice(at, 1);
  }
  return picked;
}

export function sieveWeeklyEvents(ctx = {}, extras = []) {
  compileLiveSheet(ctx);
  const indexed = candidatesFromIndex(weeklyEventIndex(), ctx);
  const seen = new Set();
  const merged = [];
  for (const item of indexed) {
    const key = item?.id || item?.text;
    if (!item || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  for (const item of extras || []) {
    const key = item?.id || item?.text;
    if (!item || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  const { kept } = filterActionsByBoundary(merged, ctx);
  const matched = [];
  const loose = [];
  const fallbacks = [];
  for (const action of kept) {
    if (action.fallback) {
      if (meetsPrerequisites(action, ctx)) fallbacks.push(action);
      continue;
    }
    if (meetsPrerequisites(action, ctx)) matched.push(action);
    if (!isTagGated(action) && meetsPrerequisites(action, ctx, { loose: true })) {
      loose.push(action);
    }
  }
  return {
    matched,
    loose,
    fallbacks,
    crisis: matched.filter((action) => action.crisis),
    tagged: matched.filter((action) => isTagGated(action) || action.tagDriven),
    tagLink: matched.filter((action) => action.tagLink),
    asymmetric: matched.filter((action) => action.asymmetric),
    trauma: matched.filter((action) => (
      action.traumaVictim
      || action.situation === "trauma"
      || (action.when?.tagPrefixesAny || []).includes("trauma_")
      || (action.when?.tagsAny || []).some((tag) => String(tag).startsWith("trauma_"))
    )),
    daily: matched.filter((action) => action.daily),
    caste: matched.filter((action) => action.perpCasteEcology),
    organic: matched.filter((action) => action.organic),
    size: merged.length,
    scanned: true,
    prerequisiteFilter: true,
    weightedEventSample: true,
  };
}

export { WEEKLY_EVENT_POOL };
