/**
 * Life-end dossier. Numbers come only from the live clock.
 * Session-close copy may name the closed-beta age cap when that is the real trigger.
 * Death copy names age, year, place, and a concrete cause — no riddles.
 */
import { scrubPublicText } from "./data/public-text.js";
import { scanNarrativeFacts } from "./narrative-facts.js";
import { monitorPublicText } from "./text-monitor.js";

function placeOf(character) {
  return character?.birthplaceLabel
    || character?.birthplace
    || [character?.birthCountry || character?.country, character?.birthCityName || character?.cityName]
      .filter(Boolean)
      .join("，")
    || "出生地未登記";
}

function endPlaceOf(character) {
  return character?.currentPlaceLabel
    || [character?.country, character?.cityName].filter(Boolean).join("，")
    || placeOf(character);
}

function eraPressureLine(era, upheaval, eraCrisis) {
  const bits = [];
  if (era?.name) bits.push(era.name);
  if (upheaval?.label) bits.push(`當時壓在街上的是${upheaval.label}`);
  if (era?.summary) bits.push(era.summary);
  const score = Number(eraCrisis?.score || 0);
  if (score >= 70) bits.push("這一季的時代已經在收人命");
  else if (score >= 42) bits.push("這一季的時代把人往死裏擠");
  else if (score >= 22) bits.push("街上已經比往年緊");
  return scrubPublicText(bits.join("。"));
}

function livedYears(character, time) {
  const age = Math.max(0, Number(time?.ageYears) || 0);
  const born = Number(character?.birthYear);
  const end = Number(time?.year);
  return { age, born: Number.isFinite(born) ? born : null, end: Number.isFinite(end) ? end : null };
}

function hardshipAdverb(character) {
  const health = character?.stats?.health ?? 50;
  const tags = character?.tags || [];
  const hard = health <= 40
    || (character?.upheavalState?.tier || 0) >= 2
    || tags.includes("socio_extreme_poverty")
    || tags.includes("socio_war_displacement")
    || tags.includes("socio_working_poor")
    || tags.some((tag) => String(tag).startsWith("trauma_"));
  return hard ? "艱難地" : "平安";
}

function deathPlacePhrase(character, time) {
  const facts = scanNarrativeFacts({
    character,
    year: time?.year,
    ageYears: time?.ageYears,
    tags: character?.tags,
    stats: character?.stats,
  });
  if (facts.place && facts.housing) return `${facts.place}的${facts.housing}`;
  return endPlaceOf(character);
}

function medicalDeathCause(character, reason, detail) {
  const raw = `${reason || ""} ${detail || ""}`;
  const tags = character?.tags || [];
  const health = Number(character?.stats?.health ?? 50);
  const hungry = health <= 36
    || tags.includes("socio_extreme_poverty")
    || tags.includes("household_hungry")
    || tags.includes("world_famine_witness")
    || /饑|飢|餓|營養|空碗|水腫|腫/.test(raw);
  const fever = /疫|感染|燒|咳|瀉|肺/.test(raw)
    || tags.some((tag) => String(tag).startsWith("condition_"));
  const bits = [];
  if (hungry) {
    bits.push("長期營養不良");
    if (health <= 32 || /腫|水腫/.test(raw) || tags.includes("household_hungry")) {
      bits.push("嚴重水腫");
    }
  }
  if (fever && !/戰|暴|砲|槍|清洗|空襲|流彈|意外|車|礦|倒塌|凍|暑|衰老/.test(raw)) {
    bits.push(/瀉/.test(raw) ? "腹瀉脫水" : "高燒感染");
  }
  if (/戰|暴|砲|槍|清洗|空襲|流彈/.test(raw)) return "戰亂中的槍砲、抄家或流彈";
  if (/意外|車|礦|倒塌/.test(raw)) return "車禍、塌方或勞動意外";
  if (/凍|暑|極端環境|雪|缺氧/.test(raw)) return "凍傷、中暑或極端氣候";
  if (/衰老|高齡/.test(raw) && !hungry) return "衰老，呼吸在睡眠中停止";
  if (bits.length) {
    const joined = bits.length === 1
      ? bits[0]
      : bits.length === 2
        ? bits.join("與")
        : `${bits.slice(0, -1).join("、")}與${bits[bits.length - 1]}`;
    const body = health <= 25 || /健康歸零|體格|耗盡/.test(raw) ? "，身體耗盡" : "";
    return `${joined}${body}`;
  }
  if (/健康歸零|體格/.test(raw)) return "體格耗盡，高燒或營養不良把身體收走";
  const clean = scrubPublicText(reason || "");
  return clean || "致死傷病";
}

function ageLine(character, time, fatal) {
  const { age, born, end } = livedYears(character, time);
  if (fatal) {
    if (born != null && end != null) return `享年 ${age} 歲（${born}–${end}）`;
    return `享年 ${age} 歲`;
  }
  if (born != null && end != null) return `活到 ${age} 歲（生於 ${born} 年，結算於 ${end} 年）`;
  return `活到 ${age} 歲`;
}

function betaCloseCause(character, time, playAgeCap) {
  const { age, end } = livedYears(character, time);
  const cap = Math.max(1, Number(playAgeCap) || age);
  const how = hardshipAdverb(character);
  const yearBit = end != null ? `（${end}年，實歲 ${age}）` : `（實歲 ${age}）`;
  return [
    `你已${how}度過了封閉測試的 ${cap} 歲階段${yearBit}。`,
    "在當前的測試版本中，你的前半生故事暫時告一段落。",
  ].join("");
}

function unexpectedCloseCause(character, time) {
  const { age, end } = livedYears(character, time);
  const yearBit = end != null ? `${end}年、` : "";
  return `這一局在${yearBit}${age}歲停止，不是死亡。年齡以當期日曆為準。`;
}

function longevityCause(character, time) {
  const { age, end } = livedYears(character, time);
  const yearBit = end != null ? `${end}年、` : "";
  return `你活到${yearBit}${age}歲。這是高齡收束：人未死，兩週紀事不再往下寫。`;
}

function deathCause(character, time, reason, detail) {
  const { age, end } = livedYears(character, time);
  const place = deathPlacePhrase(character, time);
  const phrase = medicalDeathCause(character, reason, detail);
  const yearBit = end != null ? `${end}年，` : "";
  const violent = /戰亂|槍砲|意外|車禍/.test(phrase);
  const verb = violent ? "過世" : "病逝";
  const lead = `${yearBit}你在${place}因${phrase}${verb}，得年 ${age} 歲。`;
  return lead;
}

export function composeLifeResolution({
  character,
  time,
  kind = "death",
  fatal = true,
  reason = "",
  detail = "",
  era = null,
  upheaval = null,
  eraCrisis = null,
  playAgeCap = null,
  temporaryCap = false,
} = {}) {
  const { age, born, end } = livedYears(character, time);
  const name = character?.name || "未名";
  const birthplace = placeOf(character);
  const cap = Number(playAgeCap);
  const betaClose = kind === "session_close"
    && temporaryCap
    && Number.isFinite(cap)
    && age >= cap;
  let title = "死亡證明";
  let kicker = "當事人已死";
  let cause = "";
  if (fatal || kind === "death") {
    title = "死亡證明";
    kicker = "當事人已死";
    cause = deathCause(character, time, reason, detail);
  } else if (betaClose) {
    title = "封閉測試結算";
    kicker = "測試階段告一段落";
    cause = betaCloseCause(character, time, cap);
  } else if (kind === "longevity") {
    title = "高齡結算";
    kicker = "高齡收束";
    cause = longevityCause(character, time);
  } else {
    title = "人生結算";
    kicker = "這一局到此為止";
    cause = unexpectedCloseCause(character, time);
  }

  const resolution = {
    kind,
    fatal: Boolean(fatal),
    title,
    kicker,
    name,
    birthplace,
    birthYear: born,
    endYear: end,
    ageYears: age,
    yearLine: end != null ? `${end}年` : "年份未登記",
    ageLine: ageLine(character, time, Boolean(fatal)),
    cause: (() => {
      const clean = scrubPublicText(cause);
      return clean && !/[。！？]$/.test(clean) ? `${clean}。` : clean;
    })(),
    eraPressure: eraPressureLine(era, upheaval, eraCrisis),
    rebirthLabel: "接受命運，開啟新的一生",
  };
  resolution.epitaph = monitorPublicText(() => 0.41, scrubPublicText([
    `${name}，生於${birthplace}。`,
    resolution.ageLine + "。",
    resolution.cause,
    resolution.eraPressure,
  ].filter(Boolean).join("")), {
    character,
    year: time?.year,
    ageYears: time?.ageYears,
    tags: character?.tags,
    stats: character?.stats,
  }, { kind: "death" });
  return resolution;
}
