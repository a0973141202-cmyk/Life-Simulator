/**
 * Strict life-band gates for events and choices.
 * Play starts at 5; ages 5–6 stay in early childhood.
 * Option bands: childhood 5–12, teen 13–19, mature adult 20+.
 * Society entry (career) remains 18; hard adult option voice starts at 20.
 */

export const EARLY_CHILD_MAX = 6;
export const CHILDHOOD_MAX = 12;
export const STUDENT_MIN = 7;
export const STUDENT_MAX = 17;
export const TEEN_MAX = 19;
export const ADULT_MIN = 18;
export const MATURE_ADULT_MIN = 20;

export const AGE_BANDS = Object.freeze({
  early_child: { id: "early_child", label: "幼兒期", min: 0, max: EARLY_CHILD_MAX },
  student: { id: "student", label: "學生期", min: STUDENT_MIN, max: STUDENT_MAX },
  teen: { id: "teen", label: "青少年期", min: 13, max: TEEN_MAX },
  adult: { id: "adult", label: "成年期", min: MATURE_ADULT_MIN, max: 120 },
});

export const CONTENT_LANES = Object.freeze({
  family: { min: 0, max: 120 },
  play: { min: 0, max: CHILDHOOD_MAX },
  illness: { min: 0, max: 120 },
  survival: { min: 0, max: 120 },
  school: { min: STUDENT_MIN, max: TEEN_MAX },
  adolescent: { min: 13, max: TEEN_MAX },
  adult_work: { min: ADULT_MIN, max: 120 },
  adult_drink: { min: ADULT_MIN, max: 120 },
  adult_romance: { min: ADULT_MIN, max: 120 },
  adult_society: { min: ADULT_MIN, max: 120 },
});

/** Childhood / minor household voice — banned in option text at age ≥ 20 / meme legends. */
export const MATURE_BANNED_CHILD_VOICE = Object.freeze([
  /會被喊回來|趕在大人喊之前|趁大人沒喊|大人喊/,
  /門栓|把門栓|看門|被留在屋裏看門/,
  /把水打回來|打水|洗碗|把碗洗乾淨/,
  /用腳把家的邊界走清楚/,
  /帶著弟妹|看弟妹|把弟妹|弟妹/,
  /不許開門|不許玩火|學步|玩伴|捉迷藏|石板|戒尺|書包/,
  /最小的那碗|屋裏的口令|孩子王|先生點|聽門栓/,
  /學步|玩伴|捉迷藏|玩具|下課排隊/,
]);

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
