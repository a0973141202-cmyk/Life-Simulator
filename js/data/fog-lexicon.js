/**
 * Fog / blunt hint lexicons. Data only; the hint engine does the weaving.
 *
 * Fog hides the numeric invoice. It does not replace the action with a riddle.
 * Every line must still be readable vernacular: conflict, pressure, or cost.
 */

export const FOG_COST_HINTS = Object.freeze([
  "具體數字這週不印出來。你要做的事仍寫在選項上。",
  "這個選項不預告健康、錢或通緝會怎麼動。你點下去才入帳。",
  "做完仍會有後果。此刻不把健康或錢的細目攤開。",
  "有代價。括號裡沒有分數。",
  "選項寫的是動作本身：吃、跑、求人、或把東西交出去。",
]);

/** @deprecated alias — keep export name for older imports / validate */
export const FOG_LINES = FOG_COST_HINTS;

export const FOG_HIDDEN_WEAVES = Object.freeze([
  { hooks: ["weather", "arctic"], line: "你比旁邊的人更早感覺到氣壓在變。這會讓你多走一步或少走一步。" },
  { hooks: ["altitude"], line: "坡度對你比對旁人更貴體力。有人會把這讀成倔強。" },
  { hooks: ["sea", "navigation"], line: "你讀得懂水面的方向。這週有人會拿這件事使喚你，或防你。" },
  { hooks: ["labor", "health"], line: "身體記得輪班與勞損。這週的力氣不是無窮的，只是比旁邊的人晚一點喊。" },
  { hooks: ["hunger", "survival", "scarcity"], line: "胃先於道理。缺糧會改寫你願意丟掉什麼。" },
  { hooks: ["malaria", "tropics", "health"], line: "你家裡有人發過這種熱。徵兆先從身體來，不從病名來。" },
  { hooks: ["study", "math"], line: "數字這週可以當藉口，也可以當把柄。你選怎麼用。" },
  { hooks: ["art", "music"], line: "你會的那套手藝／節奏，這週能換一口飯，也能換一次被盯上。" },
  { hooks: ["war", "survival"], line: "爆炸過的地方仍會在平靜裡收費：聲音、隊伍、或不准問的方向。" },
  { hooks: ["tracking"], line: "地上的痕跡比嘴上的話先寫完。你看不看，都會被當成知情。" },
  { hooks: ["empathy"], line: "你先感覺到房間裡沒說出口的那個人。這會讓你多付一次代價，或少踩一次雷。" },
  { hooks: ["trade"], line: "價錢在眼神裡，不在招牌上。你若裝不懂，對方會把你當更便宜的貨。" },
  { hooks: ["language", "social"], line: "你聽得懂房間裡另一種話。翻譯是把柄，沉默也是。" },
  { hooks: ["family", "social"], line: "親族的門比衙門近。走近它，就要欠一句以後要還的話。" },
]);

export const FOG_TRAPS = Object.freeze([
  "這件事看起來不費力。做完仍可能浪費半天、被人抓住把柄，或把人弄傷。",
  "字面上像休息或幫忙。做完是把決定權交出去：接下來聽別人的。",
  "有人說「沒關係」。選了仍可能欠錢、欠人情，或被記下名字。",
  "句子聽起來像送禮。下面要還的是錢、人情或罪名。",
  "這個選項先讓你覺得自己占了便宜。便宜的內容不寫在字面上。",
]);

export const BLUNT_RISK_LABELS = Object.freeze({
  health: "健康",
  intelligence: "智力",
  wealth: "財富",
  charm: "魅力",
  mood: "心情",
  wanted: "通緝",
  heat: "風聲",
  trust: "信任",
  opinion: "輿論",
  infamy: "惡名",
  notoriety: "惡名累積",
  reputation: "聲望",
  socialCredit: "社會信用",
  politicalCapital: "政治資本",
  healthRisk: "健康風險",
});
