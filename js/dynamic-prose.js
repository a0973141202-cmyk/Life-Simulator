/**
 * Live prose composer. Every line is built from the four-pillar fact sheet.
 * No weekly sentence banks. Atoms are nouns; grammar is assembled here.
 */
import { BODY_ATOM, FOOD_ATOM, FOOD_BY_REGION, LABOR_ATOM, THREAD_ATOM } from "./data/prose-atoms.js";
import { FOOD_BY_CLASS } from "./data/variator-lexicon.js";
import { scanNarrativeFacts } from "./narrative-facts.js";
import { scrubPublicText } from "./data/public-text.js";
import { rememberTextSnippet, textOnCooldown } from "./text-history.js";

function atom(rng, list, fallback = "") {
  const pool = (list || []).filter(Boolean);
  if (!pool.length) return fallback;
  const n = typeof rng === "function" ? rng() : 0.37;
  return pool[Math.floor(n * pool.length) % pool.length] || fallback;
}

function joinSentences(parts) {
  const seen = new Set();
  const out = [];
  for (const part of parts || []) {
    const text = scrubPublicText(String(part || "").trim());
    if (!text) continue;
    const key = text.slice(0, 18);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(/[。！？]$/.test(text) ? text : `${text}。`);
  }
  return out.join("");
}

function foodBand(facts = {}) {
  const region = String(facts.region || "");
  const climate = String(facts.climate || "");
  const city = String(facts.city || "");
  const north = /cold|continental|arctic/.test(climate)
    || /北平|北京|天津|哈爾濱|瀋陽|長春|延吉|呼和浩特|歸綏|太原|濟南|青島/.test(city);
  if (region === "china" || region === "mongolia") return north ? "china_north" : "china_south";
  if (region === "taiwan" || region === "hongkong") return region === "taiwan" ? "taiwan" : "china_south";
  if (FOOD_BY_REGION[region]) return region;
  if (region === "oceania" || region === "arctic") return region === "arctic" ? "russia" : "se_asia";
  return "china_south";
}

function foodOf(facts = {}) {
  const table = FOOD_BY_REGION[foodBand(facts)] || {};
  return table[facts.economy]
    || table.poor
    || FOOD_BY_CLASS[facts.classId]
    || (FOOD_ATOM[facts.economy] || FOOD_ATOM.poor)[0]
    || "稀粥";
}

function rationOk(facts = {}) {
  const year = Number(facts.year) || 0;
  const band = foodBand(facts);
  if (band === "west" || band === "russia" || band === "middle_east") {
    return year >= 1939 && year <= 1955;
  }
  if (["china_north", "china_south", "taiwan", "japan", "korea"].includes(band)) {
    return year >= 1937 && year <= 1985;
  }
  return false;
}

function isVillage(facts = {}) {
  return /village|rural/.test(String(facts.kind || ""));
}

function tvYearOf(facts = {}) {
  const band = foodBand(facts);
  const village = isVillage(facts);
  if (band === "west" || band === "japan") return village ? 1965 : 1955;
  if (band === "russia") return 1960;
  if (["china_north", "china_south", "taiwan", "korea"].includes(band)) return village ? 1985 : 1972;
  return village ? 1988 : 1975;
}

function breadOk(facts = {}) {
  const band = foodBand(facts);
  return band === "west" || band === "russia" || band === "middle_east";
}

function scrubLocalCopy(text, facts) {
  let out = String(text || "");
  const staple = foodOf(facts);
  if (!breadOk(facts)) {
    out = out
      .replace(/發黴的黑麵包或糠餅/g, staple)
      .replace(/冷饅頭或配給麵包/g, staple)
      .replace(/廠食堂的冷饅頭、清湯，或把配給麵包泡軟再嚥/g, `廠食堂的${staple}`)
      .replace(/黑麵包/g, staple)
      .replace(/配給麵包/g, staple)
      .replace(/麵包/g, staple);
  }
  if (!rationOk(facts)) {
    out = out
      .replace(/配給窗常關/g, "糧店常關")
      .replace(/配給窗口/g, "糧店")
      .replace(/配給窗/g, "糧店")
      .replace(/配給本/g, "糧冊")
      .replace(/公共食堂/g, "施粥處");
  }
  const year = Number(facts.year) || 0;
  if (year && year < tvYearOf(facts)) {
    out = out
      .replace(/收音機或電視/g, "收音機")
      .replace(/電視前/g, "收音機前")
      .replace(/看電視/g, "聽收音機")
      .replace(/電視/g, "收音機");
  }
  return out;
}

export function scrubEraCopy(text, facts = {}) {
  return scrubLocalCopy(text, facts);
}

const PRIOR_LIFE_COPY = /落地|第一次分得清|前兩週開始按|意識萌芽|一名[男女]嬰|出生紀錄/;

function splitSentences(text) {
  const out = [];
  let buf = "";
  for (const ch of String(text || "")) {
    buf += ch;
    if ("。！？".includes(ch)) {
      const piece = buf.trim();
      if (piece) out.push(piece);
      buf = "";
    }
  }
  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
}

export function lockChronicleToClock(text, facts = {}) {
  let out = String(text || "").trim();
  if (!out) return "";
  const year = Number(facts.year);
  const age = Number(facts.age);
  const kept = [];
  for (const chunk of splitSentences(out)) {
    const years = [...chunk.matchAll(/((?:1[89]|20)\d{2})\s*年/g)].map((row) => Number(row[1]));
    if (year && years.some((stamp) => stamp !== year)) continue;
    kept.push(chunk);
  }
  out = kept.join("");
  if (!out) return "";
  if ((Number.isFinite(age) ? age >= 5 : true) && PRIOR_LIFE_COPY.test(out)) return "";
  return scrubLocalCopy(out, facts);
}

function climateClause(facts = {}, current = []) {
  if (current.includes("current_env_extreme_cold") || current.includes("current_env_polar_night")) {
    return `${facts.city}嚴寒，手指和腳趾發白`;
  }
  if (current.includes("current_env_extreme_heat")) {
    return `${facts.city}熱到中暑：口乾、頭暈`;
  }
  if (current.includes("current_env_monsoon")) {
    return "雨季，衣服乾不了，傷口和咳嗽加重";
  }
  const season = String(facts.season || "");
  const climate = String(facts.climate || "");
  const band = foodBand(facts);
  if (/冬/.test(season) && (band === "china_north" || /cold|continental|arctic/.test(climate))) {
    return `${facts.city}入冬，手腳發僵，爐火不夠`;
  }
  if (/夏/.test(season) && /tropical|hot/.test(climate)) {
    return `${facts.city}暑熱，白天不宜走動`;
  }
  if (/雨/.test(season)) return "雨季未停，衣服和傷口都乾不了";
  return "";
}

function laborOf(facts) {
  if ((facts.age || 0) <= 7) return "打水或看火";
  return (LABOR_ATOM[facts.classId] || LABOR_ATOM.worker)[0];
}

function parentClause(facts) {
  if (!facts.hasFatherRecord && !facts.hasMotherRecord) return "";
  if (facts.orphan) return "父母都不在了，這戶只剩還能走動的人";
  const bits = [];
  if (facts.hasFatherRecord) bits.push(facts.fatherAlive ? "父親還在" : "父親已不在");
  if (facts.hasMotherRecord) bits.push(facts.motherAlive ? "母親還在" : "母親已不在");
  return bits.join("，");
}

function bodyClause(rng, facts, extras = {}) {
  const bits = [];
  if (facts.edema) bits.push(atom(rng, BODY_ATOM.edema, BODY_ATOM.edema[0]));
  else if (facts.hungry && !extras.foodSaid) bits.push(atom(rng, BODY_ATOM.hunger, BODY_ATOM.hunger[0]));
  if (facts.fever) bits.push(atom(rng, BODY_ATOM.fever, BODY_ATOM.fever[0]));
  if (facts.trauma) bits.push(atom(rng, BODY_ATOM.trauma, BODY_ATOM.trauma[0]));
  if (!bits.length && facts.health <= 45) bits.push("走路會喘，傷口或低燒還沒退");
  if (!bits.length) bits.push(`這兩週還能${laborOf(facts)}，沒有新的病把人按倒`);
  return bits.join("；");
}

function historyClause(rng, facts) {
  const threadBits = [];
  for (const thread of facts.threads || []) {
    const atoms = THREAD_ATOM[thread];
    if (atoms) threadBits.push(atom(rng, atoms, atoms[0]));
  }
  if (facts.pulseTitle) threadBits.push(facts.pulseTitle);
  if (facts.upheavalLabel && !threadBits.includes(facts.upheavalLabel)) {
    threadBits.push(facts.upheavalLabel);
  }
  const unique = [...new Set(threadBits)].slice(0, 2);
  if (!unique.length) return "";
  return `街上能核對的是${unique.join("、")}`;
}

function classClause(facts) {
  return `戶籍寫「${facts.classLabel}」。住在${facts.housing}`;
}

function ancestryClause(facts) {
  if (!facts.ancestry?.length) return "";
  const names = facts.ancestry.join("、");
  if (facts.minority) {
    return `${names}的姓和口音在檢查哨會被多問一句，不是護身符`;
  }
  return `家裏的話帶著${names}的口音`;
}

export function composePlaceLine(facts) {
  return `${facts.year}年，${facts.place}`;
}

export function composeFortnightRecord(rng, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const current = ctx.currentTags || ctx.environment?.tags || [];
  const food = facts.hungry || facts.edema ? `鍋裡常見的是${foodOf(facts)}` : "";
  const history = facts.pulseTitle
    ? `時局：${facts.pulseTitle}`
    : (facts.upheavalLabel ? `時局：${facts.upheavalLabel}` : "");
  const text = lockChronicleToClock(joinSentences([
    `這兩週是${facts.year}年，${facts.place}。當事人 ${facts.age} 歲`,
    `住在${facts.housing}`,
    climateClause(facts, current) || bodyClause(rng, facts, { foodSaid: Boolean(food) }),
    food,
    facts.householdHarsh ? "屋裏仍有人動手、鎖門或把飯扣下來" : "",
    history,
  ]), facts);
  const who = ctx.character;
  if (who && text) rememberTextSnippet(who, { stem: text });
  return text;
}

export function composePeriodChronicle(rng, ctx = {}) {
  return composeFortnightRecord(rng, ctx);
}

export function composeSituationLine(rng, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const current = ctx.currentTags || [];
  if (current.includes("current_env_extreme_cold") || current.includes("current_env_polar_night")) {
    return lockChronicleToClock(joinSentences([
      `這兩週${facts.city}嚴寒，哈氣在門框上結冰，手指和腳趾發白`,
      bodyClause(rng, facts),
    ]), facts);
  }
  if (current.includes("current_env_extreme_heat")) {
    return lockChronicleToClock(joinSentences([
      `這兩週${facts.city}熱到中暑：口乾、頭暈、不想走動`,
      bodyClause(rng, facts),
    ]), facts);
  }
  if (current.includes("current_env_monsoon")) {
    return lockChronicleToClock(joinSentences([
      `這兩週雨季讓衣服乾不了，傷口和咳嗽都更重`,
      bodyClause(rng, facts),
    ]), facts);
  }
  if (facts.hungry || facts.edema) {
    const who = facts.motherAlive ? "母親" : (facts.fatherAlive ? "父親" : "家裏的人");
    return lockChronicleToClock(joinSentences([
      `這兩週${atom(rng, BODY_ATOM.edema, BODY_ATOM.edema[0])}`,
      `${who}捏著小腿，說這是水腫`,
      `家裏鍋裡的${foodOf(facts)}已經見底`,
    ]), facts);
  }
  if (facts.fever) {
    return lockChronicleToClock(joinSentences([
      `這兩週${atom(rng, BODY_ATOM.fever, BODY_ATOM.fever[0])}`,
      "沒有退燒藥，只能用冷毛巾擦汗",
    ]), facts);
  }
  return lockChronicleToClock(joinSentences([
    historyClause(rng, facts),
    `這兩週能做的仍是${laborOf(facts)}、關門、看還有沒有下一頓`,
  ]), facts);
}

export function composeStageClause(rng, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const age = facts.age || 0;
  if (age <= 6) {
    return lockChronicleToClock(`${facts.year}年，${age}歲的${facts.childWord}這兩週仍是看火、看弟妹、把空碗洗乾淨。`, facts);
  }
  if (age <= 12) {
    return lockChronicleToClock(`${facts.city}不讓你玩完再開始：劈柴、打水、看弟妹和空碗搶同一段白天。`, facts);
  }
  if (age <= 17) {
    return lockChronicleToClock(`${facts.place}的街上先看你的衣服和口音，再決定要不要讓路或搜身。`, facts);
  }
  return lockChronicleToClock(`${facts.year}年沒有多餘的下午：找工、撐面子、或被人抓住把柄，這一期只能先做一件。`, facts);
}

export function composeChoiceLine(rng, ctx = {}, kind = "labor", index = 0) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const food = foodOf(facts);
  const city = facts.city;
  const table = {
    hunger: [
      `把${food}吃掉，不留給下一頓`,
      `去${city}排隊，把能買到的帶回來`,
      "把鍋底的糊刮乾淨再嚥",
    ],
    illness: [
      "用冷毛巾把額頭的熱降下來",
      "去問還有沒有退燒藥或止瀉的粉",
      "躺著把力氣留給去廁所那一下",
    ],
    family: [
      "按家裏交代的把水打回來、把碗洗乾淨",
      "把門栓插上，聽見拍門先裝作沒人",
      "把最小的那碗護住，不讓人先扣走",
    ],
    labor: [
      `把這兩週的${laborOf(facts)}先做完再說話`,
      "手裂了仍把活交上去",
      "按汽笛或日頭去上工，遲到的罰金付不起",
    ],
    play: [
      "趁大人沒喊之前，在巷口踢一輪罐子",
      "帶著弟妹在能去的那條巷走一圈",
      "聽見口令就把石子收進口袋散開",
    ],
    money: [
      "先付會砸門的那一筆：房租、糧或罰",
      `把能當的東西拿去換這兩週的${food}`,
      "向熟臉求一點賒",
    ],
  };
  const pool = table[kind] || table.labor;
  const line = scrubLocalCopy(pool[index % pool.length] || pool[0], facts);
  const who = ctx.character;
  if (who && textOnCooldown(who, line)) {
    return `${line}（${facts.year}年第${ctx.turn || index + 1}期）`;
  }
  return line;
}

export function composeOpeningBirth(rng, ctx = {}) {
  const facts = scanNarrativeFacts(ctx);
  const date = ctx.dateLabel || `${facts.year}年`;
  const stamp = ctx.character?.birthplaceLabel || facts.place;
  return joinSentences([
    `${date}，一名${facts.gender === "女" ? "女嬰" : "男嬰"}在${stamp}落地`,
    classClause(facts),
    parentClause(facts),
    ancestryClause(facts),
    historyClause(rng, facts),
  ]);
}

export function composeOpeningAwakening(rng, ctx = {}) {
  const facts = scanNarrativeFacts(ctx);
  return joinSentences([
    `${facts.year}年，${facts.childWord}第一次分得清哪條巷能走、哪戶會罵人或搶東西`,
    bodyClause(rng, facts),
    historyClause(rng, facts),
  ]);
}

export function composeOpeningWeekLead(rng, ctx = {}) {
  const facts = scanNarrativeFacts(ctx);
  return joinSentences([
    `${facts.year}年${facts.season || ""}，${facts.place}的前兩週開始按${laborOf(facts)}、關門和空碗收費`,
    classClause(facts),
    ancestryClause(facts),
    historyClause(rng, facts),
  ]);
}

function incidentKindLine(lane, kind) {
  const table = {
    world: {
      historical: "這一期街上在清點戶口、封路或傳徵召",
      household: "這一期事出在屋裏：扣飯、鎖門或動手",
      dark: "這一期有人收保護費、拉人下水或堵巷口",
      survival: "這一期先來的是糧、病或天氣，不是選擇",
      crisis: "這一期危機能死人：槍、餓、燒或抄家",
      scene: "這一期巷口、窗口或工場出了事",
    },
    school: {
      bullying: "這一期校園裡有人攔路、勒索或當眾羞辱",
      gang: "這一期有人拉幫、收保護費或堵校門",
      extreme: "這一期校規或處分能改寫你能不能進門",
      exam: "這一期考試、處分或點名先於下課",
    },
    adult: {
      crime: "這一期工地、碼頭或巷口有人收保護費或拉人下水",
      politics: "這一期單位或街道在清點立場、檔案和連坐",
      burnout: "這一期加班、罰款或夜班把睡眠收走",
      labor: "這一期廠門、工分或罰金先於工錢",
      commerce: "這一期舖面、票證或欠帳先到期",
    },
  };
  return (table[lane] || table.world)[kind] || "這一期街上出了事";
}

export function composeWorldBeat(rng, incident, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const threads = (incident?.threads || facts.threads || [])
    .map((thread) => (THREAD_ATOM[thread] || [])[0])
    .filter(Boolean)
    .slice(0, 2);
  return lockChronicleToClock(joinSentences([
    `${facts.year}年，${facts.place}`,
    incidentKindLine("world", incident?.kind || "scene"),
    threads.length ? `能看見的是${threads.join("、")}` : "",
  ]), facts);
}

export function composeSchoolBeat(rng, incident, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  return lockChronicleToClock(joinSentences([
    `${facts.year}年，${facts.place}`,
    incidentKindLine("school", incident?.kind || "exam"),
    facts.age ? `${facts.age}歲仍要按校規、點名和院子裏的人過日子` : "",
  ]), facts);
}

export function composeAdultBeat(rng, incident, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  return lockChronicleToClock(joinSentences([
    `${facts.year}年，${facts.place}`,
    incidentKindLine("adult", incident?.kind || incident?.sector || "labor"),
  ]), facts);
}

export function composeFigureBeat(rng, incident, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const who = incident?.figureName ? `${incident.figureName}在這一期被點到名字` : "有人把歷史人物的名字帶進這一期的巷口";
  return lockChronicleToClock(joinSentences([
    `${facts.year}年，${facts.place}`,
    who,
  ]), facts);
}

export function composeHistoryPulse(rng, pulse, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  if (!pulse?.title) return lockChronicleToClock(historyClause(rng, facts), facts);
  return lockChronicleToClock(joinSentences([
    `${facts.year}年，${facts.place}能核對的時局是${pulse.title}`,
  ]), facts);
}

export function composeDeathRecord(character, time, reason, detail) {
  const ctx = {
    character,
    year: time?.year,
    ageYears: time?.ageYears,
    tags: character?.tags,
    stats: character?.stats,
  };
  const facts = scanNarrativeFacts(ctx);
  const yearBit = facts.year ? `${facts.year}年，` : "";
  const medical = [];
  if (facts.hungry || /饑|飢|餓|營養/.test(`${reason}${detail}`)) medical.push("長期營養不良");
  if (facts.edema) medical.push("嚴重水腫");
  if (facts.fever || /燒|咳|疫|瀉/.test(`${reason}${detail}`)) medical.push("高燒感染");
  if (/戰|槍|砲|暴/.test(`${reason}${detail}`)) {
    return `${yearBit}你在${facts.place}因戰亂中的槍砲、抄家或流彈過世，得年 ${facts.age} 歲。`;
  }
  const cause = medical.length ? medical.join("與") : "體格耗盡";
  return `${yearBit}你在${facts.place}的${facts.housing}因${cause}，身體耗盡病逝，得年 ${facts.age} 歲。`;
}

export { scanNarrativeFacts };
