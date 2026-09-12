/**
 * Strict life-band gates for events and choices.
 * Play starts at 5; ages 5–6 stay in early childhood. Society entry is 18.
 */

export const EARLY_CHILD_MAX = 6;
export const STUDENT_MIN = 7;
export const STUDENT_MAX = 17;
export const ADULT_MIN = 18;

export const AGE_BANDS = Object.freeze({
  early_child: { id: "early_child", label: "幼兒期", min: 0, max: EARLY_CHILD_MAX },
  student: { id: "student", label: "學生期", min: STUDENT_MIN, max: STUDENT_MAX },
  adult: { id: "adult", label: "成年期", min: ADULT_MIN, max: 120 },
});

export const CONTENT_LANES = Object.freeze({
  family: { min: 0, max: 120 },
  play: { min: 0, max: 12 },
  illness: { min: 0, max: 120 },
  survival: { min: 0, max: 120 },
  school: { min: STUDENT_MIN, max: STUDENT_MAX },
  adolescent: { min: STUDENT_MIN, max: STUDENT_MAX },
  adult_work: { min: ADULT_MIN, max: 120 },
  adult_drink: { min: ADULT_MIN, max: 120 },
  adult_romance: { min: ADULT_MIN, max: 120 },
  adult_society: { min: ADULT_MIN, max: 120 },
});

/** Player-as-adult-actor. Household alcohol / war survival as victim is not these. */
export const ADULT_WORK_PATTERNS = Object.freeze([
  /求職|應聘|面試|招工|人才市場|應徵/,
  /加班|下班後|薪水袋|發工資|買斷|下崗|工時、安全或薪水/,
  /入股|交易所|放帳給熟客|擺攤、接私活/,
  /保養機器|跟工友討論|跟師傅或工廠/,
  /從軍|入伍|徵兵|當護理或去做戰地雜役/,
]);

export const ADULT_DRINK_PATTERNS = Object.freeze([
  /去喝酒|買醉|灌自己|酒吧|酒局|勸酒|乾杯|茅台或便宜白酒/,
  /用咖啡、酒或更烈|用藥、酒或更烈/,
]);

export const SCHOOL_PATTERNS = Object.freeze([
  /上課|課堂|校園|放學|書包|石板|戒尺|教室|孩子王|先生點/,
]);

export const PLAY_PATTERNS = Object.freeze([
  /學步|玩伴|捉迷藏|玩具/,
]);

export const HOUSEHOLD_ALCOHOL_PATTERNS = Object.freeze([
  /酒氣上來前|照護者帶著酒|擋酒|酒瓶子|酒後家暴|家裏.*酒/,
]);

export const ADULT_ROMANCE_PATTERNS = Object.freeze([
  /認真追求一段感情|告白|約會|戀愛|求婚|結婚|同居/,
]);

export const ADULT_SOCIETY_DOMAINS = Object.freeze([
  "crime",
  "narcotics",
  "militant",
  "historical",
  "politics",
  "commerce_power",
  "sexual",
  "terror",
  "adult",
]);
