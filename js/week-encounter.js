/**
 * Live weekly encounter. World databases (cities, ethnicities, figures) stay static.
 * Player-facing intro and triad are minted from four live pillars:
 * tags/bloodline, class, country/city, and the year's history.
 * Figures weave only when year + settlement match. No catalog sentences.
 */
import { chance } from "./rng.js";
import { figureEncounterChance, figuresPresent } from "./history-engine.js";

export { figureEncounterChance, figuresPresent };
import { composeChoiceLine, lockChronicleToClock, scrubEraCopy } from "./dynamic-prose.js";
import { scanNarrativeFacts } from "./narrative-facts.js";
import { isDossierLeakSentence, scrubPublicText, scrubRiddleText } from "./data/public-text.js";
import { chronicleLineKey } from "./chronicle-key.js";
import { optionExcluded } from "./exclusion-buffer.js";
import { textOnCooldown } from "./text-history.js";
import { textsTooSimilar } from "./choice-similarity.js";
import { pickDistinctLanes } from "./choice-dedupe.js";

function joinSentences(parts) {
  const seen = new Set();
  const out = [];
  for (const part of parts || []) {
    const text = scrubPublicText(String(part || "").trim());
    if (!text) continue;
    const key = chronicleLineKey(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(/[。！？]$/.test(text) ? text : `${text}。`);
  }
  return out.join("");
}

function plainMission(text) {
  return String(text || "")
    .replace(/發跡|尚未掌權|權力高峰|公開程序|被改寫後的位置/g, "")
    .replace(/\s+/g, "")
    .replace(/[、，]+$/g, "")
    .trim();
}

export function inferEncounterPressure(ctx = {}, facts = {}, figure = null) {
  if (figure) return "figure";
  const tags = facts.tags || ctx.tags || [];
  const climate = ctx.childClimate || {};
  if (facts.hungry || facts.edema || climate.famine || tags.includes("household_hungry") || tags.includes("socio_extreme_poverty")) {
    return "hunger";
  }
  if (facts.fever || (facts.health != null && facts.health <= 32) || (facts.sanity != null && facts.sanity <= 28)) {
    return "illness";
  }
  if (climate.wartime || (facts.threads || []).some((thread) => thread === "war" || thread === "conscription")) {
    return "war";
  }
  if ((facts.threads || []).includes("purge") || (facts.threads || []).includes("occupation")) return "papers";
  if (tags.some((tag) => String(tag).startsWith("household_"))) return "family";
  if (tags.some((tag) => String(tag).startsWith("school_")) && (facts.age || 0) <= 17) return "school";
  if ((facts.age || 0) <= 12) return "family";
  if ((facts.threads || []).includes("unemployment")) return "money";
  return "labor";
}

function civilianRole(facts, pressure) {
  if (pressure === "hunger") return "糧店的人";
  if (pressure === "illness") return "還能走動的街坊";
  if (pressure === "labor") return facts.age <= 12 ? "工位旁邊的大人" : "工頭";
  if (pressure === "money") return "收數或收租的人";
  if (pressure === "family") {
    if (facts.motherAlive && facts.motherName) return `母親${facts.motherName}`;
    if (facts.fatherAlive && facts.fatherName) return `父親${facts.fatherName}`;
    return facts.motherAlive ? "母親" : (facts.fatherAlive ? "父親" : "屋裏的人");
  }
  if (pressure === "school") return "院子裏攔路的人";
  if (pressure === "war") return "路口查路的人";
  if (pressure === "papers") return "核名冊的人";
  return "巷口的人";
}

function civilianBeat(facts, pressure, role) {
  if (pressure === "hunger") return `${role}把能換的份核完就關門。空碗比功課先到`;
  if (pressure === "illness") return `沒有退燒藥。${role}能給的只剩冷毛巾和能喝的水`;
  if (pressure === "labor") return `${role}按汽笛或日頭收工。遲到的罰金付不起`;
  if (pressure === "money") return `${role}先上門。房租、糧或罰比工錢快`;
  if (pressure === "family") return `${role}在屋裏派活、扣飯或鎖門`;
  if (pressure === "school") return `${facts.city}的院子裏，${role}先於下課到`;
  if (pressure === "war") return `${facts.city}的路口在清人、傳徵召或封路。${role}先看路條`;
  if (pressure === "papers") return `${role}在核戶口。口音和衣服先於解釋`;
  if (facts.pulseTitle) return `${role}在傳：${facts.pulseTitle}`;
  if (facts.upheavalLabel) return `${role}把這兩週過成${facts.upheavalLabel}`;
  return `${role}在${facts.city}按這兩週的規矩收錢、收工或收路`;
}

function figureBeat(facts, figure) {
  const mission = plainMission(figure.mission);
  const job = mission ? `${figure.name}：${mission}` : figure.name;
  return `${facts.city}這兩週聽得到${job}。排隊、名冊和誰能出門都跟著改`;
}

function closer(facts, pressure, figure) {
  if (figure) return `${figure.name}留下的路口這兩週還在，繞不開就得正面碰上`;
  if (pressure === "hunger") return "下一頓比功課先排進今天";
  if (pressure === "illness") return "先弄清楚還能不能自己走到門口";
  if (pressure === "war") return "路條、躲處與回家的路都要比平時算得更準";
  if (pressure === "papers") return "名冊上有沒有你的名字，比解釋先被打開";
  if (pressure === "family") return "屋裏派的活與扣下來的飯，這兩週還管得著你";
  return `${facts.city || "此地"}這兩週仍要按眼前能做完的事排活`;
}

export function resolveFigureForWeek(rng, ctx = {}) {
  const locked = ctx.lockedFigure;
  if (locked?.figureName) {
    return {
      id: locked.figureId || "",
      name: locked.figureName,
      mission: plainMission(locked.figureMission || locked.mission || ""),
      role: locked.figureRole || "",
      locked: true,
    };
  }
  if (ctx.skipFigureScan) return null;
  const present = ctx.figuresPresent || figuresPresent({
    ...ctx,
    cityId: ctx.cityId || ctx.character?.cityId,
    country: ctx.country || ctx.character?.country,
    region: ctx.region || ctx.character?.region,
    year: ctx.year || ctx.narrativeFacts?.year,
  });
  ctx.figuresPresent = present;
  if (!present.length) return null;
  const p = figureEncounterChance(ctx);
  if (!p || !chance(rng, Math.min(0.28, p))) return null;
  const ranked = present.slice().sort((a, b) => (b.loc?.grade || 0) - (a.loc?.grade || 0));
  const ceiling = ranked[0]?.loc?.grade || 0;
  const top = ranked.filter((row) => (row.loc?.grade || 0) >= ceiling * 0.6);
  const n = typeof rng === "function" ? rng() : 0.37;
  const row = top[Math.floor(n * top.length) % top.length] || ranked[0];
  if (!row?.figure?.name) return null;
  return {
    id: row.figure.id,
    name: row.figure.name,
    mission: plainMission(row.track?.mission || ""),
    role: row.figure.roles?.[0] || "",
    grade: row.loc?.grade || 0,
    locked: false,
  };
}

export function composeWeekEncounter(rng, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const figure = resolveFigureForWeek(rng, ctx);
  const pressure = inferEncounterPressure(ctx, facts, figure);
  const civilian = figure ? null : { role: civilianRole(facts, pressure) };
  const season = facts.season ? `${facts.season}` : "";
  const body = facts.health <= 36
    ? `體格在${facts.city}已經走路會喘`
    : (facts.sanity <= 32 ? "神智撐不住：睡不好，出門的路也變短" : "");
  const hist = !figure && (facts.pulseTitle || facts.upheavalLabel)
    ? `街上這兩週聽得到${facts.pulseTitle || facts.upheavalLabel}`
    : "";
  const intro = lockChronicleToClock(joinSentences([
    `${facts.year}年${season}，${facts.place}。當事人 ${facts.age} 歲，戶籍寫「${facts.classLabel}」`,
    `住在${facts.housing}`,
    body,
    figure ? figureBeat(facts, figure) : civilianBeat(facts, pressure, civilian.role),
    hist,
    closer(facts, pressure, figure),
  ]), facts);
  const clean = scrubRiddleText(scrubPublicText(intro));
  const safe = clean && !isDossierLeakSentence(clean)
    ? clean
    : lockChronicleToClock(`${facts.year}年，${facts.place}。這兩週先過眼前的事。`, facts);
  return {
    intro: safe,
    pressure,
    figure,
    civilian,
    contextualIntro: true,
    figureWoven: Boolean(figure),
  };
}

function figureChoice(facts, figure, index) {
  const name = figure.name;
  const city = facts.city || "此地";
  const year = facts.year;
  const housing = facts.housing || "屋裏";
  const age = facts.age || 0;
  const dir = age < 12
    ? ["watch", "hide", "home"][index % 3]
    : ["watch", "avoid", "ask"][index % 3];
  if (dir === "watch") {
    return age < 12
      ? `站在${city}能看見的位置，把${name}這兩週讓街上發生的事看完`
      : `把${name}這兩週在${city}公開做的事看完，記住${year}年的名冊和路口`;
  }
  if (dir === "hide") {
    return `拉著家裏的人繞開${city}的人群，不當面讓人把你寫進名冊`;
  }
  if (dir === "avoid") {
    return `低頭走過${city}，不讓人把你和${name}寫成一夥`;
  }
  if (dir === "home") {
    return `回${housing}把門栓插上，先保住最小的那碗`;
  }
  return `向${city}管事的人問這期要的是路條、錢還是名字`;
}

export function composeEncounterChoice(rng, ctx = {}, encounter = null, index = 0, extras = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const week = encounter || ctx.weekEncounter || {};
  const pressure = week.pressure || inferEncounterPressure(ctx, facts, week.figure);
  const who = ctx.character;
  const avoid = extras.avoidTexts || extras.used || [];
  const forced = extras.forcedLane || pickDistinctLanes(ctx, 3)[index % 3];
  const dirs = ["endure", "seek", "guard", "resist", "flee", "help"];
  const kinds = ["family", "labor", "hunger", "money", "illness"];
  const baseKind = forced?.kind || (pressure === "war" || pressure === "papers"
    ? "family"
    : (pressure === "figure" || pressure === "school" ? (pressure === "school" ? "family" : "labor") : pressure));
  let text = "";
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const salt = index + attempt * 3 + Number(ctx.turn || ctx.week || 0);
    let line = "";
    if (week.figure?.name && attempt < 2 && !avoid.length) {
      line = figureChoice(facts, week.figure, salt);
    } else {
      const useKind = attempt === 0 ? baseKind : kinds[(salt + attempt) % kinds.length];
      const useDir = attempt === 0
        ? (forced?.dir || dirs[index % dirs.length])
        : dirs[(salt + attempt + index) % dirs.length];
      line = composeChoiceLine(rng, ctx, useKind || "labor", salt, {
        direction: useDir,
        avoidTexts: avoid,
      });
    }
    text = scrubEraCopy(scrubRiddleText(scrubPublicText(line)), facts);
    if (!text) continue;
    if (avoid.some((row) => textsTooSimilar(row, text))) continue;
    if (who && optionExcluded(who, "", text)) continue;
    if (who && textOnCooldown(who, text)) continue;
    return text;
  }
  return text || composeChoiceLine(rng, ctx, Number(facts.age || 0) < 7 ? "family" : "labor", index + 19, {
    direction: forced?.dir || (Number(facts.health || 50) <= 28 ? "endure" : dirs[(index + 2) % dirs.length]),
    avoidTexts: avoid,
  });
}

export function bindEncounterToOption(rng, option, ctx, encounter, index, usedTexts = []) {
  const forced = pickDistinctLanes(ctx, 3)[index % 3];
  const text = composeEncounterChoice(rng, ctx, encounter, index, {
    avoidTexts: usedTexts,
    forcedLane: forced,
  });
  if (!option) {
    return { text, trueText: text, encounterBound: true, direction: forced?.dir, situation: forced?.kind };
  }
  return {
    ...option,
    text,
    trueText: text,
    encounterBound: true,
    direction: option.direction || forced?.dir,
    situation: option.situation || forced?.kind,
    figureEncounter: Boolean(option.figureEncounter || encounter?.figure),
    figureId: option.figureId || encounter?.figure?.id || null,
    figureName: option.figureName || encounter?.figure?.name || null,
  };
}
