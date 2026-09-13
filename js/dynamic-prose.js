/**
 * Live prose composer. Every line is built from the four-pillar fact sheet.
 * No weekly sentence banks. Atoms are nouns; grammar is assembled here.
 */
import { BODY_ATOM, FOOD_ATOM, FOOD_BY_REGION, LABOR_ATOM, THREAD_ATOM } from "./data/prose-atoms.js";
import { FOOD_BY_CLASS } from "./data/variator-lexicon.js";
import { chronicleLineKey } from "./chronicle-key.js";
import { scanNarrativeFacts } from "./narrative-facts.js";
import { composeMemeFortnight, isMemeLegendCharacter } from "./meme-chronicle.js";
import { scrubPublicText } from "./data/public-text.js";
import { rememberTextSnippet, textOnCooldown } from "./text-history.js";
import { pickLiveChoiceLane } from "./text-logic-filter.js";
import { textsTooSimilar } from "./choice-similarity.js";
import { MATURE_ADULT_MIN } from "./data/age-gate-rules.js";
import { remapChoiceKindForAge } from "./age-gate.js";

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
    const key = chronicleLineKey(text);
    if (!key || seen.has(key)) continue;
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

function laborOf(facts, rng) {
  if ((facts.age || 0) <= 7) return "打水或看火";
  const list = LABOR_ATOM[facts.classId] || LABOR_ATOM.worker;
  return atom(rng, list, list[0]);
}

function householdWho(facts = {}) {
  if (facts.motherAlive && facts.motherName) return `母親${facts.motherName}`;
  if (facts.fatherAlive && facts.fatherName) return `父親${facts.fatherName}`;
  if (facts.motherAlive) return "母親";
  if (facts.fatherAlive) return "父親";
  const kin = (facts.kinLiving || []).find((row) => row.role === "guardian" || row.role === "spouse" || row.role === "sibling");
  if (kin?.name) return `${kin.role === "spouse" ? "伴侶" : (kin.role === "guardian" ? "監護人" : "家裏的人")}${kin.name}`;
  return "家裏還能走動的人";
}

function kinWord(facts = {}) {
  return facts.orphan ? "這戶剩下的人" : "最小的那碗";
}

function parentClause(facts) {
  if (!facts.hasFatherRecord && !facts.hasMotherRecord) return "";
  if (facts.orphan) return "父母都不在了，這戶只剩還能走動的人";
  const bits = [];
  if (facts.hasFatherRecord) {
    bits.push(facts.fatherAlive
      ? (facts.fatherName ? `父親${facts.fatherName}還在` : "父親還在")
      : "父親已不在");
  }
  if (facts.hasMotherRecord) {
    bits.push(facts.motherAlive
      ? (facts.motherName ? `母親${facts.motherName}還在` : "母親還在")
      : "母親已不在");
  }
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
  return `街上這兩週看得到的是${unique.join("、")}`;
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
  if (isMemeLegendCharacter(ctx.character)) {
    const meme = composeMemeFortnight(rng, ctx);
    if (meme) {
      const who = ctx.character;
      if (who) rememberTextSnippet(who, { stem: meme });
      return meme;
    }
  }
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const current = ctx.currentTags || ctx.environment?.tags || [];
  const food = facts.hungry || facts.edema ? `鍋裡常見的是${foodOf(facts)}` : "";
  const history = facts.pulseTitle
    ? `街上這兩週，${facts.pulseTitle}`
    : (facts.upheavalLabel ? `街上這兩週，${facts.upheavalLabel}` : "");
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
  if (isMemeLegendCharacter(ctx.character)) {
    const meme = composeMemeFortnight(rng, ctx);
    if (meme) return meme;
  }
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

export function composeStatusRecord(rng, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const sanity = Number(facts.sanity ?? ctx.stats?.sanity ?? 50);
  const tags = facts.tags || [];
  const bits = [];
  if (facts.health <= 25) bits.push(`體格撐不住：在${facts.city}走路會喘，傷口或發燒都還沒退`);
  else if (facts.health >= 80) bits.push(`體格還撐得住，能走完${facts.year}年這兩週要走的路`);
  if (sanity <= 25) bits.push("神智差：睡不好、提不起勁、容易發呆或哭");
  else if (sanity >= 80) bits.push("這兩週還能睡得著，話也說得清楚");
  bits.push(bodyClause(rng, facts));
  if (facts.householdHarsh || tags.some((tag) => String(tag).startsWith("household_"))) {
    bits.push("屋裏仍有人動手、鎖門，或把飯扣下來");
  }
  if (tags.some((tag) => String(tag).startsWith("school_")) && (facts.age || 0) <= 17) {
    bits.push(`${facts.city}的院子裏仍有人攔路或勒索`);
  }
  if (tags.some((tag) => String(tag).startsWith("caste_"))) {
    bits.push(`${facts.city}有人在核對你是不是「那一掛」，核對完會收費或動手`);
  }
  if (tags.includes("acquired_wanted") || tags.includes("path_crime")) {
    bits.push(`${facts.city}這兩週，通緝或地下買賣正在改寫你能走的路`);
  }
  const hist = historyClause(rng, facts);
  if (hist) bits.push(hist);
  return lockChronicleToClock(joinSentences(bits.slice(0, 4)), facts);
}

export function composeFollowBeat(rng, ctx = {}, extra = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  if (extra.advantage) {
    return lockChronicleToClock(`${facts.year}年在${facts.city}，這一步比旁人少碰一次關卡`, facts);
  }
  if (extra.strain) {
    return lockChronicleToClock(`${facts.year}年在${facts.city}，這一步比旁人更難走完`, facts);
  }
  return composeLiveFollowUp(rng, ctx, extra);
}

export function composeStageClause(rng, ctx = {}) {
  if (isMemeLegendCharacter(ctx.character)) {
    // Peak-era legends never fall back to childhood / generic workplace stage copy.
    return "";
  }
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

function resolveChoiceDirection(ctx = {}, index = 0, extra = {}) {
  const named = String(extra.direction || ctx.direction || "").trim();
  if (named) return named;
  const dirs = ["endure", "seek", "guard", "resist", "flee", "help"];
  const salt = Number(index || 0) + Number(ctx.turn || ctx.week || 0) * 3;
  return dirs[((salt % dirs.length) + dirs.length) % dirs.length];
}

function assembleChoiceCore(rng, facts, kind, dir, extra = {}) {
  const food = foodOf(facts);
  const labor = laborOf(facts, rng);
  const city = facts.city || "此地";
  const who = householdWho(facts);
  const kin = kinWord(facts);
  const year = facts.year || "";
  const age = facts.age || 0;
  const housing = facts.housing || "屋裏";
  const tagFocus = String(extra.tagFocus || "");
  let tagLabel = String(extra.tagLabel || "").replace(/〔[^〕]*〕/g, "").trim();
  if (/^[A-Za-z][A-Za-z0-9]*(_[A-Za-z0-9]+)+$/.test(tagLabel) || !/[\u4e00-\u9fff]/.test(tagLabel)) {
    tagLabel = "";
  }
  const drivers = (extra.driverTags || []).map(String);
  const has = (re) => drivers.some((tag) => re.test(tag));
  // Primary lane wins: overlap tags must not steal the focused branch.
  const focus = (cats, re) => {
    if (tagFocus) return cats.includes(tagFocus);
    return has(re);
  };

  if (focus(["trauma"], /^trauma_/)) {
    if (dir === "flee") return `帶著還在身上的傷，先離開${city}會再碰到的那條路`;
    if (dir === "resist") return `不按旁人的口令假裝${year}年那些傷沒發生過`;
    if (dir === "guard") return `把還會疼的地方護住，不讓人當眾揭開`;
    if (dir === "help") return `用還剩的力氣幫${who}把這一週能做的做完`;
    return `按還在身上的傷，這兩週只做${city}還能做完的事`;
  }
  if (focus(["persona"], /^persona_/)) {
    const drivers = (extra.driverTags || []).map(String);
    if (drivers.includes("persona_banana_legend") || drivers.includes("persona_meme_dancer") || drivers.includes("persona_brazil_samba") || drivers.includes("persona_absolute_freedom") || drivers.includes("persona_invincible_smile")) {
      if (dir === "seek") return `把巴西森巴與自由的舞步踩進${city}這兩週`;
      if (dir === "help") return `用無敵笑容與節奏把${who}從沉悶裏拉起來`;
      if (dir === "resist") return `不拿絕對自由換一時規矩，仍按自己的步伐走`;
      return `香蕉傳奇還在${city}的風裡，這兩週熱也不散`;
    }
    if (drivers.includes("persona_aniki_wrestle") || drivers.includes("persona_biochem") || drivers.includes("persona_forest_fairy")) {
      if (dir === "resist" || dir === "guard") return `用兄貴摔角練出的身子，把${city}這兩週的衝突或危機硬扛過去`;
      if (dir === "endure") return `勞動與體能帳先交給摔角墊上的節奏，把${year}年這兩週能扛的扛完`;
      if (dir === "seek") return `把力氣押進${city}還認摔角與鐵杠的那條路`;
      return `兄貴摔角與 Biochem 傳說並排，把${city}這兩週的生存帳先做完`;
    }
    if (drivers.includes("persona_loyal_bond") || drivers.includes("persona_deep_philosophy")) {
      if (dir === "help") return `以重情重義把同伴從低谷拉起來`;
      if (dir === "resist") return `不丟下還在難處的人，先用深邃哲學把逆境看穿`;
      return `重情重義寫在走路的方式裏，先把${city}這兩週難處帶過`;
    }
    if (drivers.includes("persona_deep_philosophy") || drivers.includes("persona_forest_fairy")) {
      if (dir === "help") return `以森之妖精的氣度站到人群前，把${city}這兩週能一起做完的事先帶起來`;
      if (dir === "resist") return `不讓時代動盪先吞掉神智，仍把人往前帶`;
      return `深邃哲學與森之妖精氣並排，把${year}年這兩週的群眾帳扛住`;
    }
    if (drivers.includes("persona_shimokita_labor") || drivers.includes("persona_beast_senpai") || drivers.includes("persona_114514") || drivers.includes("persona_natsumikan") || drivers.includes("persona_stench_foul") || drivers.includes("persona_onmad_classic")) {
      if (dir === "resist" || dir === "guard") return `憑野獸先輩的直覺在${city}街頭的縫裡找一條活路`;
      if (dir === "flee") return `危機一響就鑽進${city}巷弄，不跟絕境硬剛到底`;
      if (dir === "seek") return `按下北澤打工認得的節奏，把${year}年這兩週能搏的搏完`;
      return `114514 與惡臭傳說並排，把${city}這兩週極端的帳扛過`;
    }
    if (drivers.includes("persona_high_roller") || drivers.includes("persona_quit_ahead")) {
      if (dir === "seek") return `把口袋裏能押的押進${city}這一局，贏了就收`;
      if (dir === "resist" || dir === "guard") return `見好就收：這注夠了，不把底褲也押進去`;
      return `按賭桌上認得的節奏，把${year}年這兩週能收的先收`;
    }
    if (drivers.includes("persona_brotherhood")) {
      if (dir === "help") return `挺身替還肯喊你一聲的人擋這一回`;
      if (dir === "resist") return `不為旁人一句閑話，丟下還在難處的同伴`;
      return `義氣寫在走路的方式裏，先把${city}這兩週難處扛過`;
    }
    if (drivers.includes("persona_principled")) {
      if (dir === "resist") return `不拿原則換一時面子，該拒的拒`;
      return `按寫死的底線，把${city}這兩週能做完的做完`;
    }
    if (drivers.includes("persona_cat_keeper")) {
      if (dir === "help" || dir === "seek") return `繞去${city}巷口或簷下，先把還認得你的貓安頓好`;
      return `做事不忘留一碗水給跟過腳邊的貓`;
    }
    if (drivers.includes("persona_loyal_friend")) {
      if (dir === "help") return `先幫還肯跟你說話的同伴把${city}這兩週難處扛過`;
      return `朋友開口時，你把能讓的位子讓出去`;
    }
    if (drivers.includes("persona_faithful")) {
      if (dir === "resist") return `不為旁人一句閑話，改掉已答應過的那句話`;
      return `按當初答應的那一個人，把${year}年這兩週走完`;
    }
    if (drivers.includes("persona_gentle")) {
      if (dir === "resist") return `不抬高聲氣，仍把不該交的名字按住`;
      return `語氣放軟，把${city}這兩週能做完的先做完`;
    }
    if (dir === "endure" || dir === "seek") return `不嫌髒累，把${city}這兩週田事與雜活先做完`;
    if (dir === "help") return `用還撐得住的力氣，幫${who}把眼前能做的做完`;
    return `按吃得起苦的那一套，把${year}年這兩週熬過`;
  }
  if (focus(["wealth"], /^wealth_/)) {
    if (dir === "seek") return `去${city}把能換成現錢或${food}的路走完`;
    if (dir === "guard") return `先守住這一期還沒被債收走的那一點`;
    if (dir === "resist") return `不把能當的東西一次交出去抵帳`;
    return `按口袋和帳本，先把${year}年這兩週能付的付掉`;
  }
  if (focus(["kin", "parent"], /^kin_|^parent_/)) {
    if (age >= MATURE_ADULT_MIN) {
      if (dir === "help") return `按還能聯繫上的親眷空位，把${city}這兩週人情與雜務結完`;
      if (dir === "resist") return `不為舊規矩把底牌或名字交出去`;
      if (dir === "guard") return `先守住自己這戶還能站得住的那一點`;
      return `看親眷臉色，再決定${city}這兩週能走哪條路`;
    }
    if (dir === "help") return `按${who}還在或不在的空位，把這一週的事做完`;
    if (dir === "resist") return `不按屋裏的口令把${kin}交出去`;
    if (dir === "guard") return `把門栓插上，先保住${who}還認的那張牀`;
    return `看${who}的臉色，再決定${city}這兩週能走哪條巷`;
  }
  if (focus(["ethnicity", "lineage"], /^ethnicity_|^lineage_/)) {
    if (dir === "endure") return `用口音和姓氏還能過關的說法，把${city}這兩週走完`;
    if (dir === "seek") return `去${city}找還聽得懂家裏那套話的人`;
    return `把${tagLabel || "出身"}收進回答裏，少說一句多餘的`;
  }
  if (focus(["school"], /^school_/)) {
    if (age >= MATURE_ADULT_MIN) {
      if (dir === "resist") return `不按舊學籍或旁人口令把名字交出去`;
      if (dir === "flee") return `繞開${city}還會拿舊帳卡你的那條路`;
      return `按${age}歲在${city}的職場與街面規矩把這兩週過完`;
    }
    if (dir === "resist") return `不按院子裏的人把位子和名字交出去`;
    if (dir === "flee") return `繞開${city}會攔路的那條巷，先回${housing}`;
    return `${age}歲在${city}仍要按點名和院子裏的規矩把這兩週過完`;
  }
  if (focus(["condition", "risk"], /^condition_|^risk_/)) {
    if (dir === "guard") return `按身體已經寫進戶籍的那一行，把力氣留給必做的事`;
    if (dir === "endure") return `帶著${tagLabel || "身上的標記"}，只做${city}這兩週還能做完的`;
    return `不跟爆發的人比速度，先把下一頓和睡覺排好`;
  }
  if (focus(["mood"], /^mood_/)) {
    if (dir === "flee") return `神智撐不住時，先離開${city}還會逼你開口的地方`;
    if (dir === "seek") return `去找${city}能讓人坐一會兒、少被問的角落`;
    return `按此刻的氣色，這兩週少做一件需要表演正常的事`;
  }
  if (focus(["household"], /^household_/)) {
    if (age >= MATURE_ADULT_MIN) {
      if (dir === "guard") return `先守住這一戶還能對外說出口的底線與門面`;
      if (dir === "resist") return `不按屋裏舊規矩把名字或錢交出去`;
      if (dir === "help") return `把這一戶還能一起做完的帳與雜務先扛過`;
      return `按這一戶在${city}的規矩，把${year}年這兩週獨立撐過去`;
    }
    if (dir === "guard") return `把門栓插上，聽見拍門先裝作沒人`;
    if (dir === "resist") return `不按屋裏的口令把${kin}交出去`;
    if (dir === "help") return `按${who}交代的把水打回來、把碗洗乾淨`;
    return `按屋裏動手或扣飯的規矩，先把${year}年這兩週熬過`;
  }
  if (focus(["socio", "class"], /^socio_|^class_/)) {
    if (dir === "seek") return `按戶籍寫的那一行，去${city}找還能換成${food}的路`;
    if (dir === "guard") return `先守住這一戶還能公開說出口的那一點體面`;
    if (dir === "resist") return `不按旁人對這戶的說法把名字交出去`;
    return `按這戶在${city}被叫的那套身分，把${year}年這兩週走完`;
  }
  if (kind === "hunger") {
    if (dir === "seek") return `去${city}把能換成${food}的路走完`;
    if (dir === "guard") return `把${who}還沒扣走的那口${food}護住`;
    if (dir === "resist") return `不把${food}讓給先伸手的人`;
    if (dir === "flee") return `帶著空碗離開${city}還在排隊的那條巷`;
    if (dir === "help") return `把${food}分給${kin}`;
    return `把眼前的${food}吃掉，不留給${year}年下一頓`;
  }
  if (kind === "illness") {
    if (dir === "seek") return `去${city}問還有沒有退燒藥或止瀉的粉`;
    if (dir === "guard") return `把冷毛巾和能喝的水留給還在燒的人`;
    if (dir === "resist") return `不讓人把你從床上拖去上工`;
    if (dir === "flee") return `燒還沒退也先離開${housing}`;
    if (dir === "help") return `用冷毛巾把${who}額上的熱降下來`;
    return `躺著把力氣留給去廁所那一下`;
  }
  if (kind === "family") {
    if (age >= MATURE_ADULT_MIN) {
      if (dir === "seek") return `去${city}找這一週還能換成飯錢或人情的路`;
      if (dir === "guard") return `先守住房租、糧與還能公開說的那一點體面`;
      if (dir === "resist") return `不按旁人口令把底牌一次交出去`;
      if (dir === "flee") return `先離開還在綁著你的那戶或那張班表`;
      if (dir === "help") return `用還撐得住的力氣，幫${who}把眼前能結的帳結完`;
      return `按成人自立的節奏，把${city}這兩週該扛的先扛過`;
    }
    if (dir === "seek") return `去找${who}要這兩週還能走的路`;
    if (dir === "guard") return `把門栓插上，聽見拍門先裝作沒人`;
    if (dir === "resist") return `不按屋裏的口令把${kin}交出去`;
    if (dir === "flee") return `趁沒人看門，從${housing}走出去`;
    if (dir === "help") return `按${who}交代的把水打回來、把碗洗乾淨`;
    return `把${kin}護住，不讓人先扣走`;
  }
  if (kind === "play") {
    if (age >= MATURE_ADULT_MIN) {
      if (dir === "seek") return `去${city}找還能喘一口氣、不耽誤明天上工的空隙`;
      return `把力氣留給班表與帳本，不拿整段白天去空耗`;
    }
    if (dir === "seek") return `帶著弟妹在${city}能去的那條巷走一圈`;
    if (dir === "guard") return `聽見口令就把石子收進口袋散開`;
    if (dir === "resist") return `不讓大人把能玩的空隙收去劈柴`;
    if (dir === "flee") return `警報或口令一響，先認能躲的方向`;
    if (dir === "help") return `把弟妹從巷口那些攔人的身邊拉開`;
    return age <= 7
      ? `趁${who}沒喊之前，在能去的空地停一下`
      : `趁大人沒喊之前，在巷口踢一輪罐子`;
  }
  if (kind === "money") {
    if (dir === "seek") return `向${city}熟臉求一點能換成${food}的賒`;
    if (dir === "guard") return `先付會砸門的那一筆：房租、糧或罰`;
    if (dir === "resist") return `不把能當的東西一次交出去`;
    if (dir === "flee") return `帶著還能當的東西離開會砸門的那一戶`;
    if (dir === "help") return `把能當的東西換成${kin}的那口${food}`;
    return `把能當的東西拿去換這兩週的${food}`;
  }
  if (dir === "seek") return `去${city}把這兩週的${labor}先找齊`;
  if (dir === "guard") return `手裂了仍把${labor}交上去，不讓人扣工錢`;
  if (dir === "resist") return `不按汽笛或罰金把${labor}提前交完`;
  if (dir === "flee") return `遲到的罰金付不起，先離開${city}的工位`;
  if (dir === "help") return `替${who}把這兩週的${labor}做完再說話`;
  return extra.lockedLane === "school"
    ? `${age}歲在${city}仍要按點名和院子裏的人把這兩週過完`
    : `把這兩週的${labor}先做完再說話`;
}

function saltChoiceTail(facts, dir, index, extra = {}) {
  const pulse = facts.pulseTitle || facts.upheavalLabel || "";
  const slot = Math.abs(Number(index || 0) + Number(facts.year || 0) + Number(facts.age || 0)) % 5;
  if (slot === 1 && pulse && /封|關|戒嚴|宵禁|清人|封鎖/.test(pulse)) {
    return `趁${pulse}還沒把門封死`;
  }
  if (slot === 1 && pulse) return `街上還在傳${pulse}`;
  if (slot === 2 && facts.householdHarsh) return "屋裏有人盯著";
  if (slot === 3 && (facts.age || 0) <= 12) return "趕在大人喊之前";
  if (slot === 4 && facts.poor) return "口袋是空的";
  if (dir === "flee" && extra.lockedLane === "world") return `${facts.city}的路口正在清人`;
  return "";
}

export function composeChoiceLine(rng, ctx = {}, kind = "labor", index = 0, extra = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  let useKind = kind || "labor";
  let dir = resolveChoiceDirection(ctx, index, extra);
  if (extra.direction) dir = extra.direction;
  if (extra.kind) useKind = extra.kind;
  const health = Number(facts.health ?? 50);
  const age = Number(facts.age || 0);
  if ((health <= 28 || facts.fever) && (useKind === "labor" || useKind === "play") && !extra.direction) {
    const lane = pickLiveChoiceLane(ctx, index);
    useKind = extra.kind || lane.kind;
    dir = extra.direction || lane.dir;
  }
  if (age < 7 && useKind === "labor") {
    useKind = "family";
    if (dir === "seek" || dir === "flee") dir = "help";
  }
  useKind = remapChoiceKindForAge(useKind, age);
  const avoid = extra.avoidTexts || [];
  let line = "";
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const adultRetries = ["labor", "hunger", "illness", "money", "labor"];
    const childRetries = ["family", "hunger", "illness", "money", "labor"];
    const tryKind = attempt === 0
      ? useKind
      : remapChoiceKindForAge((age >= MATURE_ADULT_MIN ? adultRetries : childRetries)[attempt % 5], age);
    const tryDir = attempt === 0 ? dir : (["guard", "seek", "resist", "help", "flee", "endure"][(index + attempt) % 6]);
    const core = assembleChoiceCore(rng, facts, tryKind, tryDir, extra);
    const tail = saltChoiceTail(facts, tryDir, index + attempt * 3, extra);
    line = scrubLocalCopy(tail ? `${core}，${tail}` : core, facts);
    const who = ctx.character;
    if (who && textOnCooldown(who, line)) continue;
    if (avoid.some((row) => textsTooSimilar(row, line))) continue;
    break;
  }
  const who = ctx.character;
  if (who && textOnCooldown(who, line)) {
    const lane = pickLiveChoiceLane(ctx, index + 11);
    line = scrubLocalCopy(assembleChoiceCore(rng, facts, lane.kind, lane.dir, extra), facts);
  }
  return line;
}

export function composeLiveFollowUp(rng, ctx = {}, option = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const food = foodOf(facts);
  const labor = laborOf(facts, rng);
  const slot = option.chaosSlot || "";
  const bits = [
    slot === "trap" ? `這一步做完，${facts.place}接下來可能發燒、挨打或被扣飯` : "",
    slot === "scramble" ? "這兩週做的事和後來對不上，燒或被點名仍照樣來" : "",
    option.style === "fog" ? "做完以後，發燒、扣飯或被人點名才從別處露出來" : "",
    `${facts.year}年這兩週，${facts.city}的${labor}還在`,
    facts.hungry ? `鍋裡仍是${food}` : "日子還要過",
  ];
  return lockChronicleToClock(joinSentences(bits), facts);
}

export function composeBreakdownBeat(rng, incident, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  return lockChronicleToClock(joinSentences([
    `${facts.year}年，${facts.place}`,
    `${facts.age}歲的神智撐不住：睡眠、飯量和出門的路同時裂開`,
    bodyClause(rng, facts),
  ]), facts);
}

export function composeNpcQuote(ctx = {}, incident = {}, meta = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const food = foodOf(facts);
  const labor = laborOf(facts);
  const city = facts.city || "此地";
  const speaker = meta.speaker || "civilian";
  const attitude = meta.attitude || "ordinary";
  const who = meta.who || incident.figureName || "巷口的人";
  const pulse = facts.pulseTitle || facts.upheavalLabel || "";
  const weekSalt = Math.abs(Number(ctx.week || ctx.turn || facts.age || 0)) % 3;
  let quote = weekSalt === 1
    ? `${city}這兩週先看哪條巷能走`
    : (weekSalt === 2 ? `${city}的人這兩週話比以前少` : `${city}這兩週先看臉色再走路`);
  let gloss = "街坊在傳這兩週能走哪條巷。";
  if (speaker === "gangster") {
    quote = attitude === "fear"
      ? `${city}這條巷今天讓開。你走你的。`
      : (attitude === "hunt" ? "站住。口袋先說話。" : `這週的數，${city}這條巷不認空口袋。`);
    gloss = "他要過路費或封口，不是寒暄。";
  } else if (speaker === "household") {
    const who = meta.who || householdWho(facts);
    const kinAtt = meta.kinAttitude || "";
    if (kinAtt === "hostile") {
      quote = facts.hungry
        ? `少伸手。${food}不是為你留的。`
        : "你這張臉這兩週別靠近灶臺。";
      gloss = `${who}在趕人或扣飯，不是勸。`;
    } else if (kinAtt === "cold") {
      quote = facts.hungry ? `鍋裡的${food}見底了，別再伸手。` : "把水打回來再說話。";
      gloss = `${who}在派活，話短。`;
    } else if (kinAtt === "devoted" || kinAtt === "warm") {
      quote = facts.hungry
        ? `先把這口${food}咽下去，外頭的事等天亮。`
        : "回來先洗手。門口那個人我替你擋過了。";
      gloss = `${who}還肯留一口飯或擋一回。`;
    } else {
      quote = facts.hungry ? `鍋裡的${food}見底了，別再伸手。` : "把水打回來再說話。";
      gloss = `${who}在派活或扣飯。`;
    }
  } else if (speaker === "officer") {
    quote = pulse ? `${pulse}的時候，路條拿出來。` : "站住。路條和口音都要核。";
    gloss = "持槍或佩章的人在查路。";
  } else if (speaker === "foreman") {
    quote = `汽笛響了還站著？${labor}先交上去。`;
    gloss = "工頭要的是工時和罰金。";
  } else if (speaker === "merchant") {
    quote = `帳先結。${food}不賒給生面孔。`;
    gloss = "舖子要現錢或當票。";
  } else if (speaker === "authority" || speaker === "clerk") {
    quote = `${facts.year}年的名冊上有你。章蓋了才能走。`;
    gloss = "窗口要的是章和名冊，不是解釋。";
  } else if (speaker === "orator") {
    quote = pulse ? `${pulse}不是聽的，是要站邊的。` : `${city}這條街這兩週要人表態。`;
    gloss = "他要你站邊或閉嘴。";
  } else if (speaker === "bully") {
    quote = `${city}院子這邊，你的位子不是你說了算。`;
    gloss = "攔路的人要的是怕或東西。";
  } else if (facts.hungry) {
    quote = `${city}糧店又關了。${food}有人搶。`;
  }
  return {
    quote: scrubLocalCopy(quote, facts),
    gloss,
    who,
  };
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

function incidentKindLine(lane, kind, facts = {}) {
  const city = facts.city || "此地";
  const age = facts.age || 0;
  const food = foodOf(facts);
  if (lane === "school") {
    if (kind === "bullying") return `${age}歲在${city}的院子裏碰到攔路、勒索或當眾羞辱`;
    if (kind === "gang") return `${city}有人拉幫、收保護費或堵校門`;
    if (kind === "extreme") return `校規或處分正在改寫${age}歲的人能不能進門`;
    return `${city}的考試、處分或點名先於下課`;
  }
  if (lane === "adult") {
    if (kind === "crime") return `${city}的工地、碼頭或巷口有人收保護費或拉人下水`;
    if (kind === "politics") return `${city}的單位或街道在清點立場、檔案和連坐`;
    if (kind === "burnout") return "加班、罰款或夜班把睡眠收走";
    if (kind === "commerce") return `${city}的舖面、票證或欠帳先到期`;
    return `${city}的廠門、工分或罰金先於工錢`;
  }
  if (kind === "historical") return `${city}街上在清點戶口、封路或傳徵召`;
  if (kind === "household") return `屋裏在扣${food}、鎖門或動手`;
  if (kind === "dark") return `${city}有人收保護費、拉人下水或堵巷口`;
  if (kind === "survival") return `先來的是${food}、病或天氣，不是選擇`;
  if (kind === "crisis") return `${city}這一期能死人：槍、餓、燒或抄家`;
  return `${city}的巷口、窗口或工場出了事`;
}

export function composeWorldBeat(rng, incident, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const threads = (incident?.threads || facts.threads || [])
    .map((thread) => (THREAD_ATOM[thread] || [])[0])
    .filter(Boolean)
    .slice(0, 2);
  const impact = ctx.industryImpact || incident?.industryImpact;
  const impactLine = impact?.polarity === "benefit"
    ? "你的行業或標籤這兩週踩在順風邊上"
    : impact?.polarity === "harm"
      ? "逆風先打到班表與口袋，再輪到心情"
      : "";
  return lockChronicleToClock(joinSentences([
    `${facts.year}年，${facts.place}`,
    incidentKindLine("world", incident?.kind || "scene", facts),
    threads.length ? `能看見的是${threads.join("、")}` : "",
    impactLine,
  ]), facts);
}

export function composeSchoolBeat(rng, incident, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  return lockChronicleToClock(joinSentences([
    `${facts.year}年，${facts.place}`,
    incidentKindLine("school", incident?.kind || "exam", facts),
    facts.age ? `${facts.age}歲仍要按校規、點名和院子裏的人過日子` : "",
  ]), facts);
}

export function composeAdultBeat(rng, incident, ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  return lockChronicleToClock(joinSentences([
    `${facts.year}年，${facts.place}`,
    incidentKindLine("adult", incident?.kind || incident?.sector || "labor", facts),
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
    `${facts.year}年，${facts.place}街上聽得到的是${pulse.title}`,
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
