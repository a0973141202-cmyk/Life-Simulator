/**
 * Ultra-rare hardcoded character presets.
 * Each preset owns one exclusive 1/10000 integer bin.
 * Codes unlock a preset without waiting for the roll.
 */

export const SPECIAL_PRESET_ODDS = Object.freeze({
  denominator: 10000,
});

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
  Object.freeze({ id: "persona_shimokita_legend", label: "下北澤傳奇", category: "persona", source: "special_preset" }),
  Object.freeze({ id: "persona_beast_instinct", label: "野獸直覺", category: "persona", source: "special_preset" }),
  Object.freeze({ id: "persona_athlete", label: "體育生", category: "persona", source: "special_preset" }),
  Object.freeze({ id: "persona_high_pressure", label: "高壓生存", category: "persona", source: "special_preset" }),
  Object.freeze({ id: "persona_abyss_magnet", label: "深淵磁場", category: "persona", source: "special_preset" }),
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

export const TADOKORO_KOJI_PRESET = Object.freeze({
  id: "tadokoro_koji",
  rollBin: 2,
  name: "田所浩二",
  gender: "male",
  settlementId: "shimokitazawa",
  familyClass: "worker",
  themeClass: "preset-shimokita",
  statsBoost: Object.freeze({ health: 12, sanity: -6 }),
  tags: TADOKORO_PERSONA_TAGS.slice(),
  opening: Object.freeze({
    birth: "戶籍把田所浩二寫在東京下北澤的窄巷裏。二手唱片、酒吧燈與鐵道路基把昭和末的潮氣吹進平成的皮膚。身體比街燈更早學會怎麼在擠壓裏站住。",
    awakening: "五歲起他靠野獸般的直覺判斷誰會先動手。體育場上練出的肺與腿撐得住高壓，巷口卻總把奇人怪事吸過來——像有一塊深淵磁場寫在他名字底下。",
    weekLead: "下北澤這兩週仍是窄巷、汽笛與深夜的笑聲。田所浩二按傳奇那一套走路：危機來得極端，活路也來得極端。",
    outline: "shimokitazawa|tadokoro_koji|beast",
  }),
});

export const SPECIAL_PRESETS = Object.freeze({
  [HUANG_PINJUN_PRESET.id]: HUANG_PINJUN_PRESET,
  [ZHANG_JUNBIN_PRESET.id]: ZHANG_JUNBIN_PRESET,
  [TADOKORO_KOJI_PRESET.id]: TADOKORO_KOJI_PRESET,
});

/** Exclusive bins: each preset owns exactly one of 10000 slots. */
export const SPECIAL_ROLL_TABLE = Object.freeze(
  Object.values(SPECIAL_PRESETS)
    .slice()
    .sort((a, b) => a.rollBin - b.rollBin)
    .map((preset) => Object.freeze({ bin: preset.rollBin, preset })),
);

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

/**
 * Exact 1/10000 per preset using integer bins (no floating drift).
 * Forced via overrides.specialPresetId / specialCode / unlockCode.
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
  const roll = Math.floor((typeof rng === "function" ? rng() : Math.random()) * SPECIAL_PRESET_ODDS.denominator);
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
  if (preset.statsBoost && !overrides.stats) {
    next.statsBoost = { ...(preset.statsBoost || {}) };
  }
  return next;
}

export function stampSpecialOpening(character, preset) {
  if (!character || !preset?.opening) return character;
  character.specialPresetId = preset.id;
  character.specialPresetLabel = preset.name;
  character.specialThemeClass = preset.themeClass || "";
  if (preset.statsBoost && character.stats) {
    for (const [key, delta] of Object.entries(preset.statsBoost)) {
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
  return character;
}
