/**
 * Player-facing copy must stay inside the simulated world.
 * Designer notes, prompt rules, tag invoices, and dice talk never reach the UI.
 * Riddle metaphors are stripped or replaced with a concrete action / symptom.
 */

import { RIDDLE_PATTERNS, RIDDLE_REPLACEMENTS } from "./prose-rules.js";

const META_PHRASE_RE = /(?<![式正官辦])系統(?:只|不|已|必須|陳述|把|強制)|心境不|不代寫|主角光環|三選一|生存檢定|後續檢定|標籤寫入|拒絕謎語|主體敘述直白|文風：|抽到校園|抽到制度|權重較低|提高遭遇權重|提高霸凌|canon|Canon|禁止美化|禁止性傷害|這是位置與紀錄|不是代填的心情|客觀紀錄：|凡選必有代價|混沌檔|無保底|沙盒不|沙盒允許|提示詞|主動加害|受害與主動|強制攔截|開發指令|底層規則|設計註解|危機係數|仇恨值|直白發票|不被混沌|無主角|不指定你會|開局標籤|種族適應標籤|家庭氣候標籤|校園氣候標籤|社經出身標籤|體質／遺傳|雙親氣質標籤|所有標籤皆為|年齡係數|主要死因通道|歷史加權|本週即死|即死約|企圖基礎成功率|立場由你選|加害將寫入|創傷將寫入|選擇寫入標籤|寫入獨立的歷史|歷史慣性計價|觸發權重|沒有絕對正負|客觀事實|後續生存檢定|後續週次的生存|通緝係數|衝擊表|改寫後續程序|對 canon|心境欄|因果帳簿|按現實計價|重新計價|被計價|本週混沌檔|極端選擇不被禁止|只改變後續事件|暫時寫入|地理帶：|屬性表|主角鏡頭|心情欄|遊戲不|數值到零|西線加權/;

const META_HEADER_RE = /【(?:校園事件|社會事件|全域事件|歷史人物|生存檢定|日常)[^】]*】/g;
const META_PARENS_RE = /（[^）]*(?:主角光環|不保證、無|心境不|標籤與帳簿|系統只|高風險；不保證|無主角光環)[^）]*）/g;
const TAG_INVOICE_RE = /[^\n。]*標籤寫入［[^］]*］［^。\n]*/g;
const DEBUG_BRACKET_RE = /［[A-Za-z][A-Za-z0-9_]*］/g;
const SPOILER_BRACKET_RE = /〔[^〕]*〕/g;
const SPOILER_SQUARE_RE = /\[[^\]]*(?:健康|智力|財富|魅力|心情|神智|通緝|風聲|聲望|惡名|危機)[^\]]*\]/g;
const SPOILER_DELTA_RE = /(?:健康|智力|財富|魅力|心情|神智|體格|精神(?:壓力)?|通緝|風聲|聲望|惡名|危機)\s*[：:]?\s*[＋+\-−]?\s*\d+/g;
const SPOILER_VERB_RE = /(?:健康|財富|智力|魅力|心情|神智)(?:增加|提升|提高|下降|減少|降低)/g;

export function stripChoiceSpoilers(raw) {
  let text = String(raw || "");
  if (!text) return "";
  text = text.replace(SPOILER_BRACKET_RE, "");
  text = text.replace(SPOILER_SQUARE_RE, "");
  text = text.replace(SPOILER_DELTA_RE, "");
  text = text.replace(SPOILER_VERB_RE, "");
  return text.replace(/[ \t]{2,}/g, " ").replace(/[，、。]*$/g, "").trim();
}

export function isMetaPublicSentence(sentence) {
  const text = String(sentence || "").trim();
  if (!text) return true;
  return META_PHRASE_RE.test(text);
}

export function scrubRiddleText(raw) {
  let text = String(raw || "");
  if (!text) return "";
  for (const [pattern, concrete] of RIDDLE_REPLACEMENTS) {
    text = text.replace(pattern, concrete);
  }
  const parts = text.split(/([。！？\n])/);
  let out = "";
  for (let i = 0; i < parts.length; i += 2) {
    const sentence = parts[i] || "";
    const punct = parts[i + 1] || "";
    if (!sentence.trim()) {
      if (punct === "\n") out += "\n";
      continue;
    }
    if (RIDDLE_PATTERNS.some((pattern) => pattern.test(sentence))) continue;
    out += sentence + (punct === "\n" ? "\n" : punct || "");
  }
  return out.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function scrubPublicText(raw) {
  let text = String(raw || "");
  if (!text) return "";
  text = scrubRiddleText(text);
  text = stripChoiceSpoilers(text);
  text = text.replace(META_HEADER_RE, "");
  text = text.replace(/這一週的客觀事實：/g, "這一週，");
  text = text.replace(META_PARENS_RE, "");
  text = text.replace(TAG_INVOICE_RE, "");
  text = text.replace(DEBUG_BRACKET_RE, "");
  const parts = text.split(/([。！？\n])/);
  let out = "";
  for (let i = 0; i < parts.length; i += 2) {
    const sentence = parts[i] || "";
    const punct = parts[i + 1] || "";
    if (!sentence.trim()) {
      if (punct === "\n") out += "\n";
      continue;
    }
    if (isMetaPublicSentence(sentence)) continue;
    out += sentence + (punct === "\n" ? "\n" : punct || "");
  }
  return out
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^[ \n。]+|[ \n]+$/g, "")
    .trim();
}

export function publicIncidentBody(incident) {
  if (!incident) return "";
  return scrubPublicText([incident.fact, incident.procedure].filter(Boolean).join(""));
}
