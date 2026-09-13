/**
 * Ultra-rare hardcoded character presets.
 * Exact-odds presets use oddsDenominator (mutually exclusive via LCM sample space).
 * Legacy presets keep exclusive 1/10000 integer bins.
 * Codes unlock a preset without waiting for the roll.
 */

export const SPECIAL_PRESET_ODDS = Object.freeze({
  denominator: 10000,
});

function gcd(a, b) {
  let x = Math.abs(Number(a) || 0);
  let y = Math.abs(Number(b) || 0);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function lcm(a, b) {
  const x = Math.abs(Number(a) || 1);
  const y = Math.abs(Number(b) || 1);
  return Math.abs((x / gcd(x, y)) * y);
}

function lcmMany(values) {
  return (values || []).reduce((acc, n) => lcm(acc, n), 1);
}

/** Hidden unlock phrases → preset id (matched case-insensitively / trimmed). */
export const SPECIAL_PRESET_CODES = Object.freeze({
  yajuu: "tadokoro_koji",
  "野獣": "tadokoro_koji",
  "野獸": "tadokoro_koji",
  shimokitazawa: "tadokoro_koji",
  "下北澤": "tadokoro_koji",
  tadokoro: "tadokoro_koji",
  "田所浩二": "tadokoro_koji",
  "田所": "tadokoro_koji",
  "114514": "tadokoro_koji",
  billy: "billy_herrington",
  herrington: "billy_herrington",
  "billy herrington": "billy_herrington",
  aniki: "billy_herrington",
  "兄貴": "billy_herrington",
  "比利": "billy_herrington",
  "海靈頓": "billy_herrington",
  "比利·海靈頓": "billy_herrington",
  "比利海靈頓": "billy_herrington",
  ricardo: "ricardo_milos",
  milos: "ricardo_milos",
  "ricardo milos": "ricardo_milos",
  "里卡多": "ricardo_milos",
  "米洛斯": "ricardo_milos",
  "里卡多·米洛斯": "ricardo_milos",
  "里卡多米洛斯": "ricardo_milos",
  banana: "ricardo_milos",
});

export const HUANG_PERSONA_TAGS = Object.freeze([
  Object.freeze({ id: "persona_hardy", label: "吃苦耐勞", category: "persona", source: "special_preset" }),
  Object.freeze({ id: "persona_cat_keeper", label: "貓奴", category: "persona", source: "special_preset" }),
  Object.freeze({ id: "persona_loyal_friend", label: "重朋友", category: "persona", source: "special_preset" }),
  Object.freeze({ id: "persona_faithful", label: "感情專一", category: "persona", source: "special_preset" }),
  Object.freeze({ id: "persona_gentle", label: "個性溫和", category: "persona", source: "special_preset" }),
]);

export const ZHANG_PERSONA_TAGS = Object.freeze([
  Object.freeze({ id: "persona_hardy", label: "吃苦耐勞", category: "persona", source: "special_preset" }),
  Object.freeze({ id: "persona_high_roller", label: "賭豪", category: "persona", source: "special_preset" }),
  Object.freeze({ id: "persona_loyal_friend", label: "重朋友", category: "persona", source: "special_preset" }),
  Object.freeze({ id: "persona_brotherhood", label: "重義氣", category: "persona", source: "special_preset" }),
  Object.freeze({ id: "persona_principled", label: "講求原則", category: "persona", source: "special_preset" }),
  Object.freeze({ id: "persona_quit_ahead", label: "見好就收", category: "persona", source: "special_preset" }),
]);

export const TADOKORO_PERSONA_TAGS = Object.freeze([
  Object.freeze({ id: "persona_shimokita_legend", label: "下北澤傳奇", category: "persona", source: "special_preset", permanent: true }),
  Object.freeze({ id: "persona_beast_instinct", label: "野獸直覺", category: "persona", source: "special_preset", permanent: true }),
  Object.freeze({ id: "persona_beast_senpai", label: "野獸先輩", category: "persona", source: "special_preset", permanent: true }),
  Object.freeze({ id: "persona_stench", label: "惡臭", category: "persona", source: "special_preset", permanent: true }),
  Object.freeze({ id: "persona_athlete", label: "體育生", category: "persona", source: "special_preset", permanent: true }),
  Object.freeze({ id: "persona_high_pressure", label: "高壓生存", category: "persona", source: "special_preset", permanent: true }),
  Object.freeze({ id: "persona_abyss_magnet", label: "深淵磁場", category: "persona", source: "special_preset", permanent: true }),
]);

export const HUANG_PINJUN_PRESET = Object.freeze({
  id: "huang_pinjun",
  rollBin: 0,
  name: "黃品均",
  gender: "male",
  settlementId: "yunlin",
  familyClass: "peasant",
  themeClass: "preset-yunlin-archive",
  tags: HUANG_PERSONA_TAGS.slice(),
  opening: Object.freeze({
    birth: "戶籍把黃品均寫在雲林這一帶。田埂、糖廠煙囪與庄廟鐘聲比縣城更早把他圍住。家裏按農戶的規矩派活，他從小就把力氣留給能做完的那一攤。",
    awakening: "五歲起他認得巷口的貓、認得誰會把碗分給旁人。語氣不衝，卻把朋友的事記得比自己的飯更清楚；答應過的人，他不輕易換口風。",
    weekLead: "雲林這兩週仍是田事、庄口與家裏的口令。黃品均按能吃苦的那一套把眼前做完，路過的貓與同伴他都不會先甩開。",
    outline: "yunlin|huang_pinjun|persona",
  }),
});

export const ZHANG_JUNBIN_PRESET = Object.freeze({
  id: "zhang_junbin",
  rollBin: 1,
  name: "張俊彬",
  gender: "male",
  settlementId: "taipei_county",
  familyClass: "worker",
  themeClass: "preset-hardboiled",
  tags: ZHANG_PERSONA_TAGS.slice(),
  opening: Object.freeze({
    birth: "戶籍把張俊彬寫在臺北縣這條河岸外的街庄。工廠汽笛、鐵橋風與夜市油煙比縣衙更早把他叫醒。他生來就認得誰能共苦、誰只是過路。",
    awakening: "五歲起他看人先看有沒有義氣。吃得起苦，輸得起也收得住；朋友喊一聲，他肯上，卻不把原則拿去換一時面子。",
    weekLead: "臺北縣這兩週仍是工寮、庄口與帳本上的賭注。張俊彬按硬派那一套走路：該搏就搏，該停就停，該挺的人絕不先鬆手。",
    outline: "taipei_county|zhang_junbin|hardboiled",
  }),
});

/** Exact 1/114514. */
export const TADOKORO_KOJI_PRESET = Object.freeze({
  id: "tadokoro_koji",
  oddsDenominator: 114514,
  name: "田所浩二",
  gender: "male",
  settlementId: "shimokitazawa",
  familyClass: "worker",
  themeClass: "preset-shimokita",
  statsBoost: Object.freeze({ health: 12, sanity: -6 }),
  tags: TADOKORO_PERSONA_TAGS.slice(),
  opening: Object.freeze({
    birth: "戶籍把田所浩二寫在東京下北澤。窄巷、鐵道路基與夜班燈比官署更早認得他。二十四歲上場時，夏蜜柑的酸氣與野獸般的氣息已經寫進走路的方式。",
    awakening: "傳奇全盛略過幼年卷宗。打工班表、惡臭名場面與那串說不清的數字並排：危機來得極端，活路也來得荒謬。",
    weekLead: "下北澤這兩週仍是窄巷、汽笛與深夜的笑聲。田所浩二按野獸先輩那一套走路：該扛就扛，該笑就笑，該絕處逢生就絕不先低頭。",
    outline: "shimokitazawa|tadokoro_koji|beast",
  }),
});

export const BILLY_PERSONA_TAGS = Object.freeze([
  Object.freeze({ id: "persona_muscle_hunk", label: "肌肉猛男", category: "persona", source: "special_preset", permanent: true }),
  Object.freeze({ id: "persona_wrestler", label: "摔角手", category: "persona", source: "special_preset", permanent: true }),
  Object.freeze({ id: "persona_aniki", label: "兄貴精神", category: "persona", source: "special_preset", permanent: true }),
  Object.freeze({ id: "persona_cheerful", label: "樂觀開朗", category: "persona", source: "special_preset", permanent: true }),
  Object.freeze({ id: "persona_born_leader", label: "天生領袖", category: "persona", source: "special_preset", permanent: true }),
]);

/** William Glen Harold "Billy" Herrington — exact 1/10000. */
export const BILLY_HERRINGTON_PRESET = Object.freeze({
  id: "billy_herrington",
  oddsDenominator: 10000,
  name: "比利·海靈頓",
  fullName: "William Glen Harold \"Billy\" Herrington",
  gender: "male",
  settlementId: "newyork",
  familyClass: "worker",
  birthYear: 1969,
  birthDate: "1969-07-14",
  themeClass: "preset-aniki-archive",
  statsBoost: Object.freeze({ health: 16, sanity: 4 }),
  tags: BILLY_PERSONA_TAGS.slice(),
  opening: Object.freeze({
    birth: "戶籍把比利·海靈頓寫在紐約。移民碼頭、體育館更衣室與摔角墊比摩天樓更早把他圍住。二十四歲上場時，William Glen Harold 這個長名在街上早已縮成 Billy。",
    awakening: "傳奇全盛略過幼年卷宗。筋肉、兄貴精神與哲學視角並排：溫柔重情，困境來了也先以摔角手的大度站穩。",
    weekLead: "紐約這兩週仍是碼頭風、體育館燈與街頭的熱血帳。比利·海靈頓按傳奇那一套走路：該扛的扛，該挺的挺，該把人拉起來的絕不先鬆手。",
    outline: "newyork|billy_herrington|aniki",
  }),
});

export const RICARDO_PERSONA_TAGS = Object.freeze([
  Object.freeze({ id: "persona_banana_legend", label: "香蕉傳奇", category: "persona", source: "special_preset", permanent: true }),
  Object.freeze({ id: "persona_absolute_freedom", label: "絕對自由", category: "persona", source: "special_preset", permanent: true }),
  Object.freeze({ id: "persona_meme_dancer", label: "迷因舞王", category: "persona", source: "special_preset", permanent: true }),
  Object.freeze({ id: "persona_brazil_passion", label: "巴西熱情", category: "persona", source: "special_preset", permanent: true }),
]);

/** Ricardo Milos — Rio de Janeiro, exact 1/10000. */
export const RICARDO_MILOS_PRESET = Object.freeze({
  id: "ricardo_milos",
  oddsDenominator: 10000,
  name: "里卡多·米洛斯",
  fullName: "Ricardo Milos",
  gender: "male",
  settlementId: "rio",
  familyClass: "worker",
  themeClass: "preset-rio-banana",
  tags: RICARDO_PERSONA_TAGS.slice(),
  opening: Object.freeze({
    birth: "戶籍把里卡多·米洛斯寫在巴西里約熱內盧。山海階梯、熱帶陽光與港口節奏比官署更早把他叫醒。二十四歲上場時，紅色頭巾與香蕉傳奇已經寫進步伐。",
    awakening: "傳奇全盛略過幼年卷宗。絕對自由、迷因舞步與巴西熱情並排：危機來了也能華麗轉身，樂天不散。",
    weekLead: "里約這兩週仍是山海風與街頭節奏。里卡多·米洛斯按傳奇那一套走路：該舞就舞，該自由就自由。",
    outline: "rio|ricardo_milos|banana",
  }),
});

export const SPECIAL_PRESETS = Object.freeze({
  [HUANG_PINJUN_PRESET.id]: HUANG_PINJUN_PRESET,
  [ZHANG_JUNBIN_PRESET.id]: ZHANG_JUNBIN_PRESET,
  [TADOKORO_KOJI_PRESET.id]: TADOKORO_KOJI_PRESET,
  [BILLY_HERRINGTON_PRESET.id]: BILLY_HERRINGTON_PRESET,
  [RICARDO_MILOS_PRESET.id]: RICARDO_MILOS_PRESET,
});

/** Presets whose core persona tags are permanently locked for the whole run. */
export const MEME_LOCK_PRESET_IDS = Object.freeze([
  TADOKORO_KOJI_PRESET.id,
  BILLY_HERRINGTON_PRESET.id,
  RICARDO_MILOS_PRESET.id,
]);

export const MEME_LOCK_TAGS_BY_PRESET = Object.freeze({
  [TADOKORO_KOJI_PRESET.id]: Object.freeze(TADOKORO_PERSONA_TAGS.map((tag) => tag.id)),
  [BILLY_HERRINGTON_PRESET.id]: Object.freeze(BILLY_PERSONA_TAGS.map((tag) => tag.id)),
  [RICARDO_MILOS_PRESET.id]: Object.freeze(RICARDO_PERSONA_TAGS.map((tag) => tag.id)),
});

export function memeLockTagDefsFor(presetId) {
  const preset = SPECIAL_PRESETS[presetId];
  if (!preset || !MEME_LOCK_PRESET_IDS.includes(presetId)) return [];
  return (preset.tags || []).slice();
}

export function memeLockTagIdsFor(presetId) {
  return MEME_LOCK_TAGS_BY_PRESET[presetId] ? MEME_LOCK_TAGS_BY_PRESET[presetId].slice() : [];
}

/** Legacy exclusive bins (presets without oddsDenominator only). */
export const SPECIAL_ROLL_TABLE = Object.freeze(
  Object.values(SPECIAL_PRESETS)
    .filter((preset) => preset.oddsDenominator == null && preset.rollBin != null)
    .slice()
    .sort((a, b) => a.rollBin - b.rollBin)
    .map((preset) => Object.freeze({ bin: preset.rollBin, preset })),
);

/**
 * Exact-odds legends: mutually exclusive integer ranges on LCM(denominators).
 * P(preset) = width/shared = 1/oddsDenominator exactly.
 */
export const SPECIAL_EXACT_ODDS_TABLE = (() => {
  const list = Object.values(SPECIAL_PRESETS).filter((preset) => preset.oddsDenominator > 0);
  if (!list.length) return Object.freeze({ shared: 1, rows: Object.freeze([]) });
  const shared = lcmMany(list.map((preset) => preset.oddsDenominator));
  const sorted = list.slice().sort((a, b) => (
    a.oddsDenominator - b.oddsDenominator || String(a.id).localeCompare(String(b.id))
  ));
  let cursor = 0;
  const rows = sorted.map((preset) => {
    const width = shared / preset.oddsDenominator;
    if (!Number.isInteger(width)) {
      throw new Error(`special preset odds width not integer: ${preset.id}`);
    }
    const row = Object.freeze({ start: cursor, width, preset });
    cursor += width;
    return row;
  });
  return Object.freeze({ shared, rows: Object.freeze(rows) });
})();

export function resolveSpecialPresetCode(raw) {
  const key = String(raw || "").trim();
  if (!key) return "";
  if (SPECIAL_PRESETS[key]) return key;
  const lower = key.toLowerCase();
  if (SPECIAL_PRESET_CODES[key]) return SPECIAL_PRESET_CODES[key];
  if (SPECIAL_PRESET_CODES[lower]) return SPECIAL_PRESET_CODES[lower];
  for (const [code, id] of Object.entries(SPECIAL_PRESET_CODES)) {
    if (code.toLowerCase() === lower) return id;
  }
  return "";
}

export function formatSpecialPresetOdds(preset) {
  if (!preset) return "";
  if (preset.oddsDenominator > 0) return `1/${preset.oddsDenominator}`;
  return `1/${SPECIAL_PRESET_ODDS.denominator}`;
}

/**
 * Forced via overrides.specialPresetId / specialCode / unlockCode.
 * Exact-odds presets hit via LCM table; legacy presets keep 1/10000 bins.
 */
export function rollSpecialPreset(rng, overrides = {}) {
  const coded = resolveSpecialPresetCode(
    overrides.specialPresetId || overrides.specialCode || overrides.unlockCode || overrides.code,
  );
  if (coded && SPECIAL_PRESETS[coded]) {
    return { hit: true, preset: SPECIAL_PRESETS[coded], forced: true };
  }
  if (overrides.skipSpecialPreset) {
    return { hit: false, preset: null, forced: false };
  }
  const r = typeof rng === "function" ? rng : Math.random;
  if (SPECIAL_EXACT_ODDS_TABLE.rows.length) {
    const exactRoll = Math.floor(r() * SPECIAL_EXACT_ODDS_TABLE.shared);
    const exactHit = SPECIAL_EXACT_ODDS_TABLE.rows.find(
      (row) => exactRoll >= row.start && exactRoll < row.start + row.width,
    );
    if (exactHit) return { hit: true, preset: exactHit.preset, forced: false };
  }
  if (!SPECIAL_ROLL_TABLE.length) return { hit: false, preset: null, forced: false };
  const roll = Math.floor(r() * SPECIAL_PRESET_ODDS.denominator);
  const row = SPECIAL_ROLL_TABLE.find((entry) => entry.bin === roll);
  if (!row) return { hit: false, preset: null, forced: false };
  return { hit: true, preset: row.preset, forced: false };
}

export function applySpecialPresetOverrides(overrides = {}, preset) {
  if (!preset) return overrides;
  const next = {
    ...overrides,
    name: overrides.name || preset.name,
    gender: overrides.gender || preset.gender,
    settlementId: overrides.settlementId || preset.settlementId,
    familyClass: overrides.familyClass || preset.familyClass,
    tags: [...(overrides.tags || []), ...(preset.tags || [])],
    specialPresetId: preset.id,
  };
  if (preset.birthYear != null && overrides.birthYear == null && !overrides.birthDate) {
    next.birthYear = preset.birthYear;
  }
  if (preset.birthDate && !overrides.birthDate) {
    next.birthDate = preset.birthDate;
  }
  if (preset.statsBoost && !overrides.stats) {
    next.statsBoost = { ...(preset.statsBoost || {}) };
  }
  return next;
}

export function stampSpecialOpening(character, preset) {
  if (!character || !preset?.opening) return character;
  character.specialPresetId = preset.id;
  character.specialPresetLabel = preset.name;
  character.specialPresetFullName = preset.fullName || preset.name;
  character.specialThemeClass = preset.themeClass || "";
  if (preset.statsBoost && character.stats) {
    for (const [key, delta] of Object.entries(preset.statsBoost)) {
      if (key !== "health" && key !== "sanity") continue;
      const cur = Number(character.stats[key] ?? 50);
      character.stats[key] = Math.max(1, Math.min(100, cur + Number(delta || 0)));
    }
  }
  character.openingDossier = {
    birth: preset.opening.birth,
    awakening: preset.opening.awakening,
    weekLead: preset.opening.weekLead,
    outline: preset.opening.outline,
    slotIds: [`special:${preset.id}`],
    yearBand: "",
    kind: character.settlementKind || "city",
    classId: character.familyClassId || "worker",
    upheavalId: "none",
    eventOutlines: [],
    eraName: "",
  };
  if (MEME_LOCK_PRESET_IDS.includes(preset.id)) {
    character.memeTagLock = true;
    character.permanentTagIds = memeLockTagIdsFor(preset.id);
  }
  return character;
}
