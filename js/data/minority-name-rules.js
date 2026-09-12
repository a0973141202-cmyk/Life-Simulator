/**
 * 1920–2025 naming pressure for minority / indigenous groups.
 *
 * traditional — the group's own pack
 * overlay     — registry, boarding-school, colonial, or household-registration name
 * overlayChance — probability the overlay wins that year
 * hybrid      — "overlay-given": overlay given name + traditional surname
 *               (boarding-school / koseki traces without erasing the clan)
 * where       — optional country needle(s); a located band beats a generic
 *               same-year band so the same people keep different traces
 *               in China vs Vietnam vs a diaspora city
 *
 * Overlay is a dated survival trace, not a default. Outside these bands the
 * engine uses the traditional pack only.
 */

function band(from, to, traditional, overlay, overlayChance, hybrid = null, where = null) {
  return { from, to, traditional, overlay, overlayChance, hybrid, where };
}

const PRC_HANIZE = [
  band(1920, 1949, null, "han", 0.12),
  band(1950, 1984, null, "han", 0.62),
  band(1985, 2025, null, "han", 0.28),
];

const SOVIET_RUSSIFY = [
  band(1920, 1932, null, "russian", 0.28),
  band(1933, 1991, null, "russian", 0.58),
  band(1992, 2025, null, "russian", 0.32),
];

const BOARDING_ENGLISH = [
  band(1920, 1969, null, "english", 0.72, "overlay-given"),
  band(1970, 2025, null, "english", 0.28),
];

const FORMOSA_STATE = [
  band(1920, 1945, "formosa", "japanese", 0.58, "overlay-given"),
  band(1946, 1994, "formosa", "han", 0.78),
  band(1995, 2025, "formosa", "han", 0.26),
];

const DUTCH_THEN_MALAY = [
  band(1920, 1949, null, "dutch", 0.32, "overlay-given"),
  band(1950, 2025, null, "malay", 0.28),
];

/** Keyed by namesKey (pack family) or ethnicity id. */
export const MINORITY_ERA_RULES = Object.freeze({
  formosa: FORMOSA_STATE,
  ainu: [
    band(1920, 1985, "ainu", "japanese", 0.82),
    band(1986, 2025, "ainu", "japanese", 0.42),
  ],
  ryukyuan: [
    band(1920, 1971, "ryukyuan", "japanese", 0.55),
    band(1972, 2025, "ryukyuan", "japanese", 0.35),
  ],
  hmong: [
    band(1920, 1949, "hmong", "han", 0.12, null, "中國"),
    band(1950, 1984, "hmong", "han", 0.62, null, "中國"),
    band(1985, 2025, "hmong", "han", 0.28, null, "中國"),
    band(1920, 1954, "hmong", "french", 0.4, "overlay-given", ["越南", "寮國"]),
    band(1955, 2025, "hmong", "viet", 0.35, "overlay-given", "越南"),
    band(1955, 2025, "hmong", "lao", 0.22, "overlay-given", "寮國"),
    band(1920, 2025, "hmong", "thai", 0.28, "overlay-given", "泰國"),
    band(1975, 2025, "hmong", "english", 0.55, "overlay-given", ["美國", "澳洲", "加拿大"]),
    band(1975, 2025, "hmong", "french", 0.45, "overlay-given", "法國"),
  ],
  zhuang: PRC_HANIZE,
  yi: PRC_HANIZE,
  yao: PRC_HANIZE,
  tujia: PRC_HANIZE,
  bai: PRC_HANIZE,
  wa: PRC_HANIZE,
  dai: PRC_HANIZE,
  manchu: [
    band(1920, 1949, "manchu", "han", 0.45),
    band(1950, 2025, "manchu", "han", 0.55),
  ],
  hui: [
    band(1920, 2025, "hui", "han", 0.22),
  ],
  tungus: PRC_HANIZE,
  tibetan: [
    band(1920, 1965, "tibetan", "han", 0.08),
    band(1966, 1976, "tibetan", "han", 0.28),
    band(1977, 2025, "tibetan", "han", 0.12),
  ],
  uyghur: [
    band(1920, 2025, "uyghur", "han", 0.1),
  ],
  kazakh: [
    band(1920, 1991, "kazakh", "russian", 0.4, null, ["俄羅斯", "蘇聯", "哈薩克"]),
    band(1992, 2025, "kazakh", "russian", 0.18, null, ["俄羅斯", "蘇聯", "哈薩克"]),
    band(1920, 2025, "kazakh", "han", 0.22, null, "中國"),
    band(1920, 1991, "kazakh", "russian", 0.35),
    band(1992, 2025, "kazakh", "russian", 0.18),
  ],
  lao: [
    band(1920, 1953, "lao", "french", 0.4, "overlay-given"),
    band(1954, 2025, "lao", "french", 0.08),
  ],
  shan: [
    band(1920, 2025, "lao", "burmese", 0.35, "overlay-given"),
  ],
  karen: [
    band(1920, 2025, "karen", "burmese", 0.4, "overlay-given", "緬甸"),
    band(1920, 2025, "karen", "thai", 0.32, "overlay-given", "泰國"),
    band(1920, 2025, "karen", "english", 0.28, "overlay-given"),
  ],
  javanese: DUTCH_THEN_MALAY,
  minangkabau: DUTCH_THEN_MALAY,
  batak: DUTCH_THEN_MALAY,
  bugis: DUTCH_THEN_MALAY,
  dayak: DUTCH_THEN_MALAY,
  bajau: [
    band(1920, 2025, "bajau", "malay", 0.4, "overlay-given"),
  ],
  cham: [
    band(1920, 1954, "cham", "french", 0.3, "overlay-given", ["越南", "柬埔寨"]),
    band(1955, 2025, "cham", "viet", 0.28, "overlay-given", "越南"),
    band(1920, 2025, "cham", "malay", 0.22),
  ],
  igorot: [
    band(1920, 1945, "igorot", "spanish", 0.4, "overlay-given"),
    band(1946, 2025, "igorot", "filipino", 0.45, "overlay-given"),
  ],
  moro: [
    band(1920, 1945, "moro", "spanish", 0.28, "overlay-given"),
    band(1946, 2025, "moro", "filipino", 0.32, "overlay-given"),
  ],
  cree: BOARDING_ENGLISH,
  anishinaabe: BOARDING_ENGLISH,
  dakota_sioux: BOARDING_ENGLISH,
  haida: BOARDING_ENGLISH,
  tlingit: BOARDING_ENGLISH,
  cherokee: BOARDING_ENGLISH,
  mohawk: BOARDING_ENGLISH,
  mikmaq: BOARDING_ENGLISH,
  dene: BOARDING_ENGLISH,
  navajo: [
    band(1920, 1969, "navajo", "english", 0.62, "overlay-given"),
    band(1970, 2025, "navajo", "english", 0.22),
  ],
  inuit: [
    band(1920, 1969, "inuit", "english", 0.48, "overlay-given", ["加拿大", "美國"]),
    band(1970, 2025, "inuit", "english", 0.18, null, ["加拿大", "美國"]),
    band(1920, 1978, "inuit", "nordic", 0.55, "overlay-given", "格陵蘭"),
    band(1979, 2025, "inuit", "nordic", 0.22, null, "格陵蘭"),
    band(1920, 1969, "inuit", "english", 0.48, "overlay-given"),
    band(1970, 2025, "inuit", "english", 0.18),
  ],
  mapuche: [
    band(1920, 1989, "mapuche", "spanish", 0.55, "overlay-given"),
    band(1990, 2025, "mapuche", "spanish", 0.28),
  ],
  guarani: [
    band(1920, 1989, "guarani", "spanish", 0.5, "overlay-given"),
    band(1990, 2025, "guarani", "spanish", 0.25),
  ],
  amazonian: [
    band(1920, 1989, "amazonian", "spanish", 0.45),
    band(1990, 2025, "amazonian", "spanish", 0.22),
  ],
  tupi: [
    band(1920, 1985, "tupi", "portuguese", 0.55, "overlay-given"),
    band(1986, 2025, "tupi", "portuguese", 0.28),
  ],
  garifuna: [
    band(1920, 2025, "garifuna", "spanish", 0.4, "overlay-given"),
  ],
  mesoamerican: [
    band(1920, 1975, "mesoamerican", "spanish", 0.52, "overlay-given"),
    band(1976, 2025, "mesoamerican", "spanish", 0.3),
  ],
  amazigh: [
    band(1920, 1961, "amazigh", "french", 0.35),
    band(1962, 1994, "amazigh", "arabic", 0.62),
    band(1995, 2025, "amazigh", "arabic", 0.32),
  ],
  tuareg: [
    band(1920, 1961, "tuareg", "french", 0.3),
    band(1962, 1994, "tuareg", "arabic", 0.55),
    band(1995, 2025, "tuareg", "arabic", 0.28),
  ],
  malagasy: [
    band(1920, 1960, "malagasy", "french", 0.5, "overlay-given"),
    band(1961, 2025, "malagasy", "french", 0.28),
  ],
  san: [
    band(1920, 1993, "san", "afrikaans", 0.45, "overlay-given"),
    band(1994, 2025, "san", "english", 0.28, "overlay-given"),
  ],
  afrikaans: [
    band(1920, 2025, "afrikaans", "english", 0.22),
  ],
  yakut: SOVIET_RUSSIFY,
  tatar: SOVIET_RUSSIFY,
  komi: SOVIET_RUSSIFY,
  nenets: SOVIET_RUSSIFY,
  georgian: [
    band(1920, 1991, "georgian", "russian", 0.35),
    band(1992, 2025, "georgian", "russian", 0.12),
  ],
  chechen: [
    band(1920, 1991, "chechen", "russian", 0.4),
    band(1992, 2025, "chechen", "russian", 0.18),
  ],
  ossetian: SOVIET_RUSSIFY,
  circassian: [
    band(1920, 1991, "circassian", "russian", 0.4, null, ["俄羅斯", "蘇聯"]),
    band(1920, 2025, "circassian", "turkish", 0.35, null, ["土耳其", "約旦", "敘利亞"]),
    band(1920, 1991, "circassian", "russian", 0.35),
  ],
  armenian: [
    band(1920, 1991, "armenian", "russian", 0.35, null, ["俄羅斯", "蘇聯"]),
    band(1920, 2025, "armenian", "turkish", 0.22, null, "土耳其"),
    band(1920, 2025, "armenian", "persian", 0.18, null, "伊朗"),
    band(1920, 2025, "armenian", "arabic", 0.15, null, ["黎巴嫩", "敘利亞"]),
  ],
  sami: [
    band(1920, 1974, "sami", "nordic", 0.62, "overlay-given"),
    band(1975, 2025, "sami", "nordic", 0.28),
  ],
  maori: [
    band(1920, 1974, "maori", "english", 0.55, "overlay-given"),
    band(1975, 2025, "maori", "english", 0.22),
  ],
  hawaiian: [
    band(1920, 1977, "hawaiian", "english", 0.6, "overlay-given"),
    band(1978, 2025, "hawaiian", "english", 0.28),
  ],
  samoan: [
    band(1920, 1961, "samoan", "english", 0.4, "overlay-given"),
    band(1962, 2025, "samoan", "english", 0.22),
  ],
  papua: [
    band(1920, 1974, "papua", "english", 0.55, "overlay-given"),
    band(1975, 2025, "papua", "english", 0.28),
  ],
  aboriginal: [
    band(1920, 1974, "aboriginal", "english", 0.7, "overlay-given"),
    band(1975, 2025, "aboriginal", "english", 0.3),
  ],
  chamorro: [
    band(1920, 1944, "chamorro", "spanish", 0.4),
    band(1945, 2025, "chamorro", "english", 0.45, "overlay-given"),
  ],
  kanak: [
    band(1920, 1987, "kanak", "french", 0.6, "overlay-given"),
    band(1988, 2025, "kanak", "french", 0.32),
  ],
  basque: [
    band(1920, 1938, "basque", "spanish", 0.22),
    band(1939, 1975, "basque", "spanish", 0.72),
    band(1976, 2025, "basque", "spanish", 0.28),
  ],
  catalan: [
    band(1920, 1938, "catalan", "spanish", 0.25),
    band(1939, 1975, "catalan", "spanish", 0.65),
    band(1976, 2025, "catalan", "spanish", 0.3),
  ],
  scottish: [
    band(1920, 2025, "scottish", "english", 0.35),
  ],
  welsh: [
    band(1920, 2025, "welsh", "english", 0.4),
  ],
  breton: [
    band(1920, 2025, "breton", "french", 0.45),
  ],
  maltese: [
    band(1920, 1964, "maltese", "english", 0.45, "overlay-given"),
    band(1965, 2025, "maltese", "english", 0.22),
  ],
  roma: [
    band(1920, 2025, "roma", "slavic", 0.35, "overlay-given"),
  ],
  coptic: [
    band(1920, 2025, "coptic", "arabic", 0.35),
  ],
  assyrian: [
    band(1920, 2025, "assyrian", "arabic", 0.28),
  ],
  yazidi: [
    band(1920, 2025, "yazidi", "arabic", 0.32),
  ],
  nubian: [
    band(1920, 2025, "nubian", "arabic", 0.4, "overlay-given"),
  ],
  kurdish: [
    band(1920, 2025, "kurdish", "turkish", 0.4, null, "土耳其"),
    band(1920, 2025, "kurdish", "persian", 0.32, null, "伊朗"),
    band(1920, 2025, "kurdish", "arabic", 0.35, null, ["伊拉克", "敘利亞"]),
  ],
});

export const MAJORITY_NAME_KEYS = Object.freeze([
  "han", "yue", "hakka", "japanese", "korean", "viet", "thai", "malay",
  "hindi", "english", "french", "german", "spanish", "portuguese", "italian",
  "russian", "arabic", "turkish", "dutch", "polish",
]);

export function isMinorityNameKey(key) {
  if (!key) return false;
  return !MAJORITY_NAME_KEYS.includes(key);
}

function countryMatches(where, country) {
  if (!where) return false;
  const text = String(country || "");
  if (!text) return false;
  const needles = Array.isArray(where) ? where : [where];
  return needles.some((needle) => text.includes(needle));
}

export function eraBandFor(namesKey, ethnicityId, year, country = "") {
  const y = Number(year) || 1920;
  const rows = MINORITY_ERA_RULES[ethnicityId] || MINORITY_ERA_RULES[namesKey];
  if (!rows?.length) return null;
  const inYear = rows.filter((row) => y >= row.from && y <= row.to);
  const pool = inYear.length ? inYear : [rows[rows.length - 1]];
  const located = pool.filter((row) => countryMatches(row.where, country));
  if (located.length) return located[0];
  const generic = pool.filter((row) => !row.where);
  return generic[0] || null;
}
