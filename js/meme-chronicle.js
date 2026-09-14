/**
 * Meme-legend chronicle + start-age helpers.
 * Ricardo / Billy / Tadokoro only — archival in-world tone, no meta UI leakage.
 */
import { MEME_LOCK_PRESET_IDS } from "./data/special-presets.js";
import { scanNarrativeFacts } from "./narrative-facts.js";
import { scrubPublicText } from "./data/public-text.js";

export const MEME_LEGEND_START_AGE = 24;
/** Full playthrough length for meme legends only (24 → ~37). */
export const MEME_PLAY_YEARS = 13;

export function isMemeLegendCharacter(character = null) {
  return MEME_LOCK_PRESET_IDS.includes(character?.specialPresetId);
}

export function memeLegendStartAgeOf(character = null) {
  return isMemeLegendCharacter(character) ? MEME_LEGEND_START_AGE : null;
}

/** Soft play-window end age for meme legends (start + 13 years). */
export function memeLegendPlayAgeMax(character = null) {
  if (!isMemeLegendCharacter(character)) return null;
  return MEME_LEGEND_START_AGE + MEME_PLAY_YEARS;
}

function roll01(rng) {
  return typeof rng === "function" ? rng() : Math.random();
}

function pick(rng, list = []) {
  if (!list.length) return "";
  return list[Math.floor(roll01(rng) * list.length) % list.length];
}

function fill(template, facts = {}) {
  return String(template || "")
    .replace(/\{year\}/g, String(facts.year || ""))
    .replace(/\{city\}/g, facts.city || "此地")
    .replace(/\{place\}/g, facts.place || facts.city || "此地")
    .replace(/\{age\}/g, String(facts.age ?? 24))
    .replace(/\{name\}/g, facts.name || "他");
}

const RICARDO_FORTNIGHT = Object.freeze([
  "這兩週是{year}年，{place}。當事人 {age} 歲。里約的熱風把紅色頭巾與舞步一齊吹亮，香蕉皮在石階上閃了一下又被踢開",
  "{year}年的{city}，陽光比規矩先到。{age} 歲的{name}把絕對自由踩進每一步，熱帶的節奏不等人喊口令",
  "這兩週{city}的山海階梯還在抖。紅色頭巾、赤足與笑聲寫在同一條巷，迷因舞王不當班也在跳",
  "{year}年，{place}。{age} 歲的盛年把巴西森巴押在街頭：香蕉、汗與無拘無束的轉身比工牌更響",
  "{year}年，{city}港口風把汗味與熱帶果香吹成同一條節奏。{name}不簽班表，卻把整條坡道跳成舞台",
  "這兩週是{year}年。{age} 歲。紅色頭巾在{city}的陽光裏發亮，旁人議論規矩，他只議論下一拍從哪裡起",
]);

const RICARDO_BEATS = Object.freeze([
  "危機來時他華麗一轉：樂天態度把絕境踩成舞池一角，名聲與自由都押在這一拍",
  "紅色頭巾一揚，旁人還在算利害，他已把絕對自由還給自己的腳步——工牌與規矩先擱一邊",
  "香蕉傳奇這兩週仍掛在嘴邊：不是玩笑，是他在{city}街頭換來掌聲與口糧的走法",
  "熱帶陽光底下，絕對自由比任何口令都先到；誰喊停，誰就先輸了節奏",
  "迷因之力不寫在告示上，卻寫在他轉身之後仍站得住、旁人還願意跟著跳的那一拍",
]);

const BILLY_FORTNIGHT = Object.freeze([
  "這兩週是{year}年，{place}。當事人 {age} 歲。體育館燈與摔角墊的味道比街燈更早把他叫醒，兄貴氣寫在肩線上",
  "{year}年的{city}，森之妖精似的身影穿過夜色。摔角手的大度與哲學視角同在，溫柔不軟、重情不散",
  "這兩週{city}仍有鐵杠與掌聲。{age} 歲的{name}以男子氣概扛事，也以領袖魅力把人從低谷拉起",
  "{year}年，{place}。{age} 歲全盛：哲學一句、摔角一記、義氣一聲，都能把困境看穿",
  "{year}年，{city}更衣室與碼頭風同在。長名在街上縮成 Billy，人卻比名更沉",
  "這兩週是{year}年。摔角墊的回彈聲裡，{name}把溫柔與重情義都壓進同一記肩摔的節奏",
]);

const BILLY_BEATS = Object.freeze([
  "困境來時他先笑：摔角手的大度把勝負寫成還能再站起來的帳，名聲與身子一起押",
  "兄貴精神這兩週先伸手——同伴低谷時他不肯鬆開，工錢與顏面可以後算",
  "哲學視角把人生困境看淡一截，身子卻仍按摔角墊的節奏站穩，不把人丟下",
  "溫柔與重情同在：領袖氣不吼，卻有人願意跟他走，危機來了先護人再談勝負",
  "森之妖精似的身影這兩週仍在：危機來了，他先把人護在身後，再談鐵杠與掌聲",
]);

const TADOKORO_FORTNIGHT = Object.freeze([
  "這兩週是{year}年，{place}。當事人 {age} 歲。下北澤窄巷的汽笛與打工班次表同在，夏蜜柑的酸氣混進野獸般的氣息",
  "{year}年的{city}，夜班燈把惡臭名場面的傳說又照亮一截。錢包夾層那串數字像班表，又像玩笑",
  "這兩週{city}仍是二手唱片與鐵道路基。{age} 歲的{name}按野獸先輩的走法過活：荒謬命運轉折來得比薪水準時",
  "{year}年，{place}。{age} 歲寫在下北澤：打工、夏蜜柑、惡臭與黑色幽默把危機變成另一種活路",
  "{year}年，{city}的窄巷把那串說不清的數字寫進傳說，卻不寫進戶籍。{name}只當那是班表上的另一種記號",
  "這兩週是{year}年。{age} 歲。夏蜜柑、夜班與野獸氣息在{city}交錯，黑色幽默比薪水先到帳本",
]);

const TADOKORO_BEATS = Object.freeze([
  "危機一響，黑色幽默先到：絕處逢生靠野獸直覺，也靠認命後再踹一腳——班表可以丟，命不能丟",
  "夏蜜柑的酸與惡臭傳聞同在，旁人捂鼻，他只當這是下北澤認得的天氣，下一班還要趕",
  "班表、窄巷與那串說不清的數字把命運寫得很荒謬，卻又合理：薪水少，活路還得自己找",
  "野獸先輩的氣場還在：高壓生存不退，奇人怪事仍往他身邊湊，名聲與罰金一起漲",
  "惡臭名場面這兩週仍像巷口傳聞：荒謬轉折一來，他先笑再找下一份能換飯的工",
]);

const POOLS = Object.freeze({
  ricardo_milos: Object.freeze({ fortnights: RICARDO_FORTNIGHT, beats: RICARDO_BEATS }),
  billy_herrington: Object.freeze({ fortnights: BILLY_FORTNIGHT, beats: BILLY_BEATS }),
  tadokoro_koji: Object.freeze({ fortnights: TADOKORO_FORTNIGHT, beats: TADOKORO_BEATS }),
});

function factsFor(ctx = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  return {
    ...facts,
    name: ctx.character?.name || facts.name || "他",
    age: facts.age ?? ctx.ageYears ?? MEME_LEGEND_START_AGE,
  };
}

function sealMemeLine(line) {
  const text = scrubPublicText(String(line || "").trim());
  if (!text) return "";
  return /[。！？]$/.test(text) ? text : `${text}。`;
}

export function composeMemeFortnight(rng, ctx = {}) {
  if (!isMemeLegendCharacter(ctx.character)) return "";
  const pool = POOLS[ctx.character.specialPresetId];
  if (!pool) return "";
  const facts = factsFor(ctx);
  return sealMemeLine(fill(pick(rng, pool.fortnights), facts));
}

export function composeMemeTagBeat(rng, ctx = {}, options = []) {
  if (!isMemeLegendCharacter(ctx.character)) return "";
  const pool = POOLS[ctx.character.specialPresetId];
  if (!pool) return "";
  const facts = factsFor(ctx);
  const situations = [...new Set((options || []).map((row) => String(row?.situation || "")).filter(Boolean))];
  const id = ctx.character.specialPresetId;
  // Prefer a beat that echoes the triad's stakes so chronicle ↔ choices stay causal.
  if (situations.includes("labor") || situations.includes("money")) {
    if (id === "tadokoro_koji") {
      return sealMemeLine(fill("這兩週的抉擇卡在班表與飯錢上：留下就賭罰金與惡名，走了就賭下一頓還沒著落", facts));
    }
    if (id === "billy_herrington") {
      return sealMemeLine(fill("這兩週的抉擇卡在鐵杠與工錢上：扛住能換掌聲與人情，鬆手就丟這一季的名聲", facts));
    }
    if (id === "ricardo_milos") {
      return sealMemeLine(fill("這兩週的抉擇卡在舞台與口糧上：繼續跳能換掌聲，收住腳步就先輸了自由", facts));
    }
  }
  if (situations.includes("illness") || situations.includes("hunger")) {
    return sealMemeLine(fill("身體與空碗這兩週比名聲先到：先活過，再談傳奇怎麼寫", facts));
  }
  return sealMemeLine(fill(pick(rng, pool.beats), facts));
}

export function memePeakJournalLine(character = {}) {
  const id = character.specialPresetId;
  if (id === "ricardo_milos") {
    return "傳奇全盛從二十四歲寫起（二〇一一年前後）：里約的熱、紅色頭巾與絕對自由比課堂更早到齊。";
  }
  if (id === "billy_herrington") {
    return "傳奇全盛從二十四歲寫起（一九九三年）：摔角墊、兄貴氣與哲學視角把幼年與求學整段略過。";
  }
  if (id === "tadokoro_koji") {
    return "傳奇全盛從二十四歲寫起（一九九九年訪談時代）：下北澤、打工班表與野獸氣息直接上場，幼年卷宗略過。";
  }
  return "傳奇全盛從二十四歲寫起。";
}

/**
 * Soft curtain for the ~13-year meme playthrough (non-fatal).
 * Archival in-world tone; no meta / beta leakage.
 */
export function memeLegendaryFinaleCause(character = null, time = null) {
  const age = Math.max(0, Math.floor(Number(time?.ageYears ?? character?.ageYears) || 0));
  const end = Number.isFinite(time?.year) ? time.year : null;
  const yearBit = end != null ? `${end}年、` : "";
  const name = character?.name || "他";
  const id = character?.specialPresetId;
  if (id === "ricardo_milos") {
    return `${yearBit}${age}歲。紅色頭巾與熱帶節奏在里約寫滿約十三年的全盛頁；迷因舞王這一段檔案到此合上，人未死，舞步卻不再往下兩週記。`;
  }
  if (id === "billy_herrington") {
    return `${yearBit}${age}歲。摔角墊、兄貴氣與哲學視角扛過約十三年的全盛；森之妖精似的身影這一段到此謝幕，人未死，兩週紀事不再往下寫。`;
  }
  if (id === "tadokoro_koji") {
    return `${yearBit}${age}歲。下北澤、夏蜜柑與野獸氣息把約十三年的訪談時代寫滿；惡臭名場面與黑色幽默這一卷到此合檔，人未死，班表卻不再往下排。`;
  }
  return `${yearBit}${age}歲。${name}的傳奇全盛約十三年寫滿；這一卷迷因檔案到此謝幕，人未死，兩週紀事不再往下寫。`;
}
