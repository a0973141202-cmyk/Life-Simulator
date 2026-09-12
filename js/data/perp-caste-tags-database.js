/**
 * Tags for intersecting the minor-sex-crime convict caste.
 * Not a playable offender identity. Adjacency is contamination, not flavor.
 */

export const PERP_CASTE_TAG_DATABASE = Object.freeze([
  {
    id: "caste_contaminate",
    label: "精神汙染",
    hooks: ["prison", "crime", "social"],
    advantageIn: [],
    strainIn: ["social", "family", "trust", "study"],
    reason: "你聽過否認的句子、看過種姓被使用的方式。它佔用注意力，不提升人格。",
  },
  {
    id: "caste_revulsion",
    label: "極度厭惡",
    hooks: ["prison", "social"],
    advantageIn: ["distance"],
    strainIn: ["social", "empathy", "family"],
    reason: "身體先拒絕靠近。厭惡是紀錄，不是道德獎章，也會把判斷變窄。",
  },
  {
    id: "caste_witness",
    label: "目擊種姓制裁",
    hooks: ["prison", "crime", "health"],
    advantageIn: ["hide"],
    strainIn: ["health", "sleep", "social"],
    reason: "你看見過其他囚犯或外面的人把制裁做成節目。畫面會在點名以外的時間回來。",
  },
  {
    id: "caste_reputation",
    label: "聲譽崩裂（株連）",
    hooks: ["social", "official", "crime"],
    advantageIn: [],
    strainIn: ["trust", "family", "official", "trade"],
    reason: "有人把你與那一欄罪名放在同一句。澄清比謠言慢。生意、探視與假釋都會變貴。",
  },
  {
    id: "caste_adjacent",
    label: "被當成同類",
    hooks: ["prison", "social"],
    advantageIn: [],
    strainIn: ["prison", "social", "health"],
    reason: "同房、同工、說過話，都可能被讀成同類。種姓靠連坐維持。",
  },
  {
    id: "caste_enforcer",
    label: "參與種姓私刑",
    hooks: ["prison", "crime", "street"],
    advantageIn: ["prison", "street"],
    strainIn: ["official", "health", "trust"],
    reason: "你動手或起鬨。這在院子裡買短保護，在檔案裡買更長的暴力習慣與處分。",
  },
]);

export const PERP_CASTE_TAG_INDEX = Object.freeze(
  Object.fromEntries(PERP_CASTE_TAG_DATABASE.map((row) => [row.id, row])),
);
