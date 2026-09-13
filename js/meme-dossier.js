/**
 * Meme-legend dossier: golden-core warnings + seeded historical contact log.
 * Archival in-world tone; high-contrast UI consumes these fields.
 */
import { MEME_LOCK_PRESET_IDS, ensureOriginalPresetName } from "./data/special-presets.js";

export function isMemeLegendPreset(presetId) {
  return MEME_LOCK_PRESET_IDS.includes(presetId);
}

export const MEME_DOSSIER_WARNINGS = Object.freeze({
  ricardo_milos: Object.freeze({
    level: "meme-joy",
    stamp: "檔案安全級別：極度危險的快樂源泉",
    text: "警告：此人物具備跨越國界與時代的精神感染力。任何試圖以嚴肅教條或極端體制束縛其自由的嘗試皆會失效，當心因過度沈浸於其律動而導致理性崩潰（神智轉換為極樂）。",
    sub: "里約街頭節奏寫入全球數位檔案庫。樂天磁場與舞姿可感化過路人。",
  }),
  billy_herrington: Object.freeze({
    level: "meme-philosophy",
    stamp: "檔案安全級別：哲學深淵警報",
    text: "警告：此人物散發著不可質疑的雄性氣魄與兄貴哲學。當遭遇人生重大挫折或背叛時，會強制觸發「男人的浪漫與眼淚」事件，將危機轉化為不屈不撓的意志力，切勿輕易試探其底線。",
    sub: "影視摔角界跨入亞洲次文化網路深處。桑拿、論壇與深邃森林皆有精神碰撞紀錄。",
  }),
  tadokoro_koji: Object.freeze({
    level: "meme-stench",
    stamp: "檔案安全級別：最高級迷因汙染防範",
    text: "警告：此實體出沒時伴隨強烈的惡臭與數字幻覺（114514）。其人生軌跡充滿荒謬的戲劇性與不可預測的黑暗兵法。任何接觸其檔案的研究人員需具備極高的精神耐受力，否則將永久陷入音MAD的迴圈中。",
    sub: "考據錨點：一九九九年前後訪談／現身時代。其後匿名論壇與影音平台的數位大地震由此震源擴散。",
  }),
});

export const MEME_FIGURE_CONTACT_LOG = Object.freeze({
  ricardo_milos: Object.freeze([
    Object.freeze({
      who: "里約熱內盧山海街頭",
      rel: "崛起原點",
      note: "熱帶陽光、紅色頭巾與無拘無束的舞步，先於任何國界把他寫進街頭檔案。",
      butterfly: false,
    }),
    Object.freeze({
      who: "全球數位檔案庫傳播鏈",
      rel: "二〇一一年無遠弗屆",
      note: "二〇一一年前後，網路把里約的節奏複製到遠方終端：檔案庫一開，樂天磁場與香蕉傳奇同步擴散。",
      butterfly: true,
    }),
    Object.freeze({
      who: "被感化的過路人與檔案員",
      rel: "精神感染",
      note: "與他互動過的人，往往先被舞姿與無敵笑容帶走嚴肅教條，再談別的。",
      butterfly: false,
    }),
  ]),
  billy_herrington: Object.freeze([
    Object.freeze({
      who: "美國影視與摔角界",
      rel: "一九九三年跨界起點",
      note: "一九九三年滿二十四歲的體育館燈、摔角墊與鏡頭前的男子氣概，構成森之妖精進入亞洲網路前的原卷。",
      butterfly: false,
    }),
    Object.freeze({
      who: "亞洲次文化網路論壇",
      rel: "深度交鋒",
      note: "迷因先驅在論壇字裡行間與他進行精神摔角：哲學一句、肩摔一記，並列成檔。",
      butterfly: true,
    }),
    Object.freeze({
      who: "深邃森林與桑拿房",
      rel: "兄貴碰撞",
      note: "傳說中的場域留下重情重義與 Biochem 源頭的迴響；每一次碰撞都改寫街頭說法。",
      butterfly: true,
    }),
  ]),
  tadokoro_koji: Object.freeze([
    Object.freeze({
      who: "一九九九年訪談／現身卷宗",
      rel: "經典考據錨點",
      note: "一九九九年前後，二十四歲的下北澤打工者身影與野獸般的氣息寫進訪談與現場紀錄，成為後世迷因的原點。",
      butterfly: false,
    }),
    Object.freeze({
      who: "日本匿名論壇",
      rel: "數位震源",
      note: "其後匿名串把 114514 數字幻覺與惡臭名場面層層疊加，平成末的現身變成網路年表的震源。",
      butterfly: true,
    }),
    Object.freeze({
      who: "Niconico 與音MAD 創作者",
      rel: "定番迴圈",
      note: "定番音MAD 把夏蜜柑酸氣與惡臭傳說剪進無限迴圈，追隨者與同好層層疊加。",
      butterfly: true,
    }),
  ]),
});

export function memeDossierWarningOf(character = null) {
  const id = character?.specialPresetId;
  if (!isMemeLegendPreset(id)) return null;
  return MEME_DOSSIER_WARNINGS[id] || null;
}

export function memeFigureContactLogOf(character = null) {
  const id = character?.specialPresetId;
  if (!isMemeLegendPreset(id)) return [];
  const seeded = character?.memeFigureLog;
  if (Array.isArray(seeded) && seeded.length) return seeded.slice();
  return (MEME_FIGURE_CONTACT_LOG[id] || []).map((row) => ({ ...row }));
}

/** Stamp warning + contact log onto character at genesis / hydrate. */
export function stampMemeDossier(character, presetId = null) {
  if (!character) return character;
  const id = presetId || character.specialPresetId;
  if (!isMemeLegendPreset(id)) return character;
  ensureOriginalPresetName(character, id);
  const warning = MEME_DOSSIER_WARNINGS[id];
  const log = MEME_FIGURE_CONTACT_LOG[id] || [];
  character.memeDossierWarning = warning ? { ...warning } : null;
  character.memeFigureLog = log.map((row) => ({ ...row }));
  if (character.openingDossier) {
    character.openingDossier.memeWarning = warning ? { ...warning } : null;
    character.openingDossier.memeFigureLog = character.memeFigureLog.slice();
  }
  return character;
}
