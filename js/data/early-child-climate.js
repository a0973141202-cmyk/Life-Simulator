/**
 * Era × class × geo climate for ages 0–6.
 * Play starts at 5. Age 5 is not a modern kindergarten protagonist.
 */

export const EARLY_CHILD_HARSH_BANDS = Object.freeze([
  "slum",
  "camp",
  "warzone",
  "disaster",
  "arctic",
  "underground",
]);

export const EARLY_CHILD_HARD_LABOR_BANDS = Object.freeze([
  "industrial",
  "rural",
]);

export const EARLY_CHILD_HARD_CLASSES = Object.freeze([
  "peasant",
  "worker",
  "immigrant",
  "artisan",
]);

export const EARLY_CHILD_AFFLUENT_CLASSES = Object.freeze([
  "gentry",
  "official",
  "merchant",
]);

export const EARLY_CHILD_SURVIVAL_THEMES = Object.freeze([
  "hunger",
  "illness",
  "confinement",
  "abuse",
  "malnutrition",
]);

/** Always illegal at 0–6: modern / middle-class outing scripts. */
export const EARLY_CHILD_FRIVOLOUS_PATTERNS = Object.freeze([
  /上學|課堂|校園|書包|幼兒園|幼稚園|先生點/,
  /去公園|公園玩|遊樂場|玩伴|捉迷藏|跟別的孩子瘋跑/,
  /社交|一起玩|溜去戲園|電影院|廟會看熱鬧/,
  /把房間裡的東西重新取|把某個大人的走法/,
]);

export const EARLY_CHILD_THEME_PATTERNS = Object.freeze({
  hunger: /吃飽|饑|餓|稀|配給|糧|一鍋|碗底|殘湯|米湯|熱量/,
  illness: /發燒|發熱|病|咳嗽|冷毛巾|藥|熱度|體溫|虛脫/,
  confinement: /留置|看家|不許出門|鎖|門閂|一個人在家|大人不在|喊回來|炕上|門檻/,
  abuse: /挨打|被吼|疏忽|酒氣|皮帶|裝睡|躲/,
  malnutrition: /營養|腿腫|發軟|皮包骨|發育|腫|糠|樹葉/,
});

export const DEPRESSION_YEARS = Object.freeze([1929, 1939]);

function inYears(year, range) {
  return year >= range[0] && year <= range[1];
}

export function childhoodClimate(ctx = {}) {
  const age = Math.max(0, Number(ctx.ageYears ?? ctx.character?.ageYears) || 0);
  const year = Number(ctx.year ?? ctx.time?.year) || 1920;
  const band = ctx.geoBand || ctx.geoBandBase || "ordinary";
  const classId = ctx.familyClassId || ctx.character?.familyClassId || "artisan";
  const tags = ctx.tags || [];
  const threads = ctx.upheaval?.threads || [];
  const organic = ctx.organicContexts || [];

  const harshBand = EARLY_CHILD_HARSH_BANDS.includes(band);
  const laborBand = EARLY_CHILD_HARD_LABOR_BANDS.includes(band);
  const affluent = band === "affluent_safe" && EARLY_CHILD_AFFLUENT_CLASSES.includes(classId);
  const hardClass = EARLY_CHILD_HARD_CLASSES.includes(classId);
  const earlyEra = year < 1960;
  const depression = inYears(year, DEPRESSION_YEARS);
  const wartime = band === "warzone"
    || tags.some((tag) => /戰亂|戰區|空襲|徵兵/.test(String(tag)))
    || threads.includes("conscription")
    || organic.includes("conscription");
  const famine = threads.includes("famine")
    || organic.includes("famine")
    || tags.some((tag) => /饑|荒|缺糧/.test(String(tag)));
  const plague = organic.includes("plague")
    || tags.some((tag) => /疫|瘟/.test(String(tag)));

  const harsh = Boolean(
    harshBand
    || depression
    || wartime
    || famine
    || plague
    || (earlyEra && !affluent && (laborBand || hardClass)),
  );

  return {
    age,
    year,
    band,
    classId,
    harsh,
    affluent,
    earlyEra,
    depression,
    wartime,
    famine,
    plague,
    allowPlay: !harsh && affluent,
    allowLeisure: !harsh && affluent && year >= 1970,
    allowSchoolish: false,
    allowSocialOuting: false,
    themes: harsh
      ? EARLY_CHILD_SURVIVAL_THEMES.slice()
      : ["family", "illness", "confinement", "hunger"],
    traumaBias: harsh,
  };
}
