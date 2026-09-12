/**
 * Occupation catalog. Independent of incident files.
 * Add rows here (or later split by sector file) without touching GameEngine.
 *
 * sector -> daily state:
 *   labor      -> labor_legal
 *   office     -> office_white
 *   commerce   -> commerce_floor
 *   politics   -> politics_machine
 *   underworld -> underworld_cover
 *   neet       -> neet_depend
 *   military   -> militant_wait (only if already on militant path; else labor)
 */

export const OCCUPATION_SECTORS = Object.freeze([
  "labor",
  "office",
  "commerce",
  "politics",
  "underworld",
  "neet",
  "military",
]);

export const SECTOR_TO_STATE = Object.freeze({
  labor: "labor_legal",
  office: "office_white",
  commerce: "commerce_floor",
  politics: "politics_machine",
  underworld: "underworld_cover",
  neet: "neet_depend",
  military: "militant_wait",
});

function occ({
  id,
  label,
  sector,
  path = "lawful",
  dark = false,
  classWeights = {},
  educationAny = null,
  tags = [],
  aliases = [],
  weight = 1,
}) {
  if (!id || !label || !sector) throw new Error("occupation needs id, label, sector");
  return Object.freeze({
    id,
    label,
    sector,
    state: SECTOR_TO_STATE[sector] || "labor_legal",
    path,
    dark: Boolean(dark),
    classWeights: Object.freeze({ ...classWeights }),
    educationAny: educationAny ? educationAny.slice() : null,
    tags: tags.slice(),
    aliases: aliases.slice(),
    weight,
  });
}

export const OCCUPATION_DATABASE = Object.freeze([
  occ({
    id: "farmhand",
    label: "務農",
    sector: "labor",
    aliases: ["務農", "農"],
    classWeights: { peasant: 4.2, immigrant: 1.2, worker: 0.6 },
    tags: ["adult_labor_base"],
  }),
  occ({
    id: "factory_hand",
    label: "工人",
    sector: "labor",
    aliases: ["工人", "廠"],
    classWeights: { worker: 4.0, immigrant: 2.2, peasant: 1.4, artisan: 1.1 },
    tags: ["adult_labor_base"],
  }),
  occ({
    id: "construction_hand",
    label: "營造雜工",
    sector: "labor",
    aliases: ["雜工", "營造"],
    classWeights: { worker: 2.4, immigrant: 2.8, peasant: 1.6 },
    tags: ["adult_labor_base"],
  }),
  occ({
    id: "domestic_worker",
    label: "家務雇工",
    sector: "labor",
    aliases: ["幫傭", "家務"],
    classWeights: { immigrant: 2.6, peasant: 1.8, worker: 1.2 },
    tags: ["adult_labor_base"],
  }),
  occ({
    id: "artisan_hand",
    label: "學徒/匠人",
    sector: "labor",
    aliases: ["學徒/匠人", "匠"],
    classWeights: { artisan: 4.0, worker: 1.2, peasant: 0.8 },
    tags: ["adult_labor_base"],
  }),
  occ({
    id: "office_clerk",
    label: "公司職員",
    sector: "office",
    aliases: ["職員", "白領"],
    classWeights: { intellectual: 2.4, merchant: 1.6, official: 1.4, worker: 0.9, gentry: 1.2 },
    educationAny: ["secondary", "university"],
    tags: ["adult_office_base"],
    weight: 1.1,
  }),
  occ({
    id: "civil_clerk",
    label: "文書",
    sector: "office",
    path: "politics",
    aliases: ["文書"],
    classWeights: { official: 3.2, intellectual: 2.0, gentry: 1.6 },
    educationAny: ["secondary", "university"],
    tags: ["adult_office_base"],
  }),
  occ({
    id: "shopkeep",
    label: "幫鋪/跑商",
    sector: "commerce",
    path: "commerce",
    aliases: ["幫鋪/跑商", "鋪", "商"],
    classWeights: { merchant: 4.0, artisan: 1.6, immigrant: 1.4 },
    tags: ["adult_commerce_base"],
  }),
  occ({
    id: "stall_vendor",
    label: "攤販",
    sector: "commerce",
    path: "commerce",
    aliases: ["攤", "販"],
    classWeights: { merchant: 2.2, immigrant: 2.0, worker: 1.3, peasant: 1.1 },
    tags: ["adult_commerce_base"],
  }),
  occ({
    id: "party_staff",
    label: "機關跑腿",
    sector: "politics",
    path: "politics",
    aliases: ["政治", "機關"],
    classWeights: { official: 3.4, gentry: 2.2, intellectual: 1.8, military: 1.1 },
    educationAny: ["secondary", "university"],
    tags: ["adult_politics_base"],
    weight: 0.7,
  }),
  occ({
    id: "enlisted",
    label: "行伍",
    sector: "military",
    path: "lawful",
    aliases: ["行伍", "兵"],
    classWeights: { military: 4.2, peasant: 1.4, worker: 1.1 },
    tags: ["adult_labor_base"],
    weight: 0.8,
  }),
  occ({
    id: "unemployed_depend",
    label: "無業依附",
    sector: "neet",
    aliases: ["無", "無業"],
    classWeights: { immigrant: 1.2, worker: 1.1, intellectual: 1.0, peasant: 0.7, gentry: 0.5 },
    tags: ["adult_neet"],
    weight: 0.55,
  }),
  occ({
    id: "gentry_steward",
    label: "家業打理",
    sector: "commerce",
    path: "commerce",
    aliases: ["家業打理"],
    classWeights: { gentry: 3.6, merchant: 1.2, official: 0.8 },
    tags: ["adult_commerce_base"],
    weight: 0.7,
  }),
  occ({
    id: "gang_runner",
    label: "跑腿/外圍",
    sector: "underworld",
    path: "crime",
    dark: true,
    aliases: ["地下", "跑腿"],
    classWeights: { worker: 1.4, immigrant: 1.8, peasant: 1.1, artisan: 0.9 },
    tags: ["adult_underworld_base"],
    weight: 0.35,
  }),
  occ({
    id: "street_collector",
    label: "地下收帳",
    sector: "underworld",
    path: "crime",
    dark: true,
    aliases: ["收帳"],
    classWeights: { worker: 1.2, immigrant: 1.5 },
    tags: ["adult_underworld_base", "adult_gang_rank"],
    weight: 0.22,
  }),
]);

export const OCCUPATION_INDEX = Object.freeze(
  Object.fromEntries(OCCUPATION_DATABASE.map((row) => [row.id, row])),
);

export function occupationByLabel(label) {
  const text = String(label || "");
  return OCCUPATION_DATABASE.find((row) => row.label === text || row.aliases.some((alias) => text.includes(alias))) || null;
}

export function occupationSector(occupationIdOrLabel) {
  const byId = OCCUPATION_INDEX[occupationIdOrLabel];
  if (byId) return byId.sector;
  return occupationByLabel(occupationIdOrLabel)?.sector || null;
}
