/**
 * Trauma tags. Contextual, not moral scores — but the ledger is cost-heavy:
 * a flinch may keep you alive in a raid and ruin every ordinary conversation.
 */

export const TRAUMA_TAG_DATABASE = Object.freeze([
  {
    id: "trauma_hypervigilance",
    label: "過度警戒",
    hooks: ["hide", "survival", "night"],
    advantageIn: ["hide", "survival", "crime"],
    strainIn: ["social", "study", "health", "family"],
    reason: "家裡或課堂的突襲讓神經系統改成二十四小時值班。",
  },
  {
    id: "trauma_flinch_body",
    label: "身體驚跳",
    hooks: ["body", "health"],
    advantageIn: ["hide"],
    strainIn: ["health", "social", "labor"],
    reason: "手、肩、耳在聲音響起前就先縮。這不是勇氣問題。",
  },
  {
    id: "trauma_shame_core",
    label: "核心羞恥",
    hooks: ["social", "family"],
    advantageIn: ["hide"],
    strainIn: ["social", "politics", "family", "ask"],
    reason: "你開始相信痛是因為你值得。這份信念會替施害者工作。",
  },
  {
    id: "trauma_self_blame",
    label: "自我歸咎",
    hooks: ["family", "study"],
    advantageIn: [],
    strainIn: ["social", "mood", "ask"],
    reason: "把結構性暴力翻譯成自己的錯，好讓世界看起來還有規則。",
  },
  {
    id: "trauma_rage_leak",
    label: "怒意滲漏",
    hooks: ["crime", "street", "risk"],
    advantageIn: ["crime", "militant"],
    strainIn: ["family", "social", "official", "health"],
    reason: "無處可去的怒在後來的人際與犯罪傾向裡找出口。出口通常更貴。",
  },
  {
    id: "trauma_dissociation",
    label: "解離空白",
    hooks: ["night", "wait"],
    advantageIn: ["hide"],
    strainIn: ["study", "social", "health", "leadership"],
    reason: "意識學會在痛開始前下班。空白會誤事，也會讓人以為你冷。",
  },
  {
    id: "trauma_authority_terror",
    label: "權威恐懼",
    hooks: ["official", "study"],
    advantageIn: ["hide"],
    strainIn: ["official", "study", "politics", "social"],
    reason: "師長、幹部、穿制服的人進入視野時，身體先認罪。",
  },
  {
    id: "trauma_attachment_starve",
    label: "依附饑餓",
    hooks: ["family", "social"],
    advantageIn: ["empathy"],
    strainIn: ["family", "social", "trust"],
    reason: "靠近與逃離同時發生。親密變成可能再被擊中的距離。",
  },
  {
    id: "trauma_parentified",
    label: "被親職化",
    hooks: ["family"],
    advantageIn: ["survival", "labor"],
    strainIn: ["social", "study", "health"],
    reason: "你被徵用去當大人。童年變成職務，休息變成曠職。",
  },
  {
    id: "trauma_labor_scar",
    label: "勞動榨取傷痕",
    hooks: ["labor", "survival"],
    advantageIn: ["labor", "survival"],
    strainIn: ["study", "health", "social"],
    reason: "身體被當成家庭的工具。後來你很難相信努力屬於自己。",
  },
  {
    id: "trauma_alcohol_house",
    label: "酒屋記憶",
    hooks: ["night", "family"],
    advantageIn: ["hide", "survival"],
    strainIn: ["family", "social", "health"],
    reason: "門把的聲音、酒瓶、腳步輕重，成為比鐘更準的預警系統。",
  },
  {
    id: "trauma_cannot_ask_help",
    label: "不能求助",
    hooks: ["ask", "social"],
    advantageIn: ["hide"],
    strainIn: ["ask", "social", "official", "family"],
    reason: "開口等於背叛家醜或惹來更大的罰。孤立被練成反射。",
  },
  {
    id: "trauma_cruelty_rehearsal",
    label: "殘忍預演",
    hooks: ["crime", "street"],
    advantageIn: ["crime"],
    strainIn: ["family", "social", "empathy", "health"],
    reason: "被對待的方式成為你後來對待世界的草稿。草稿不是原諒，是傳染。",
  },
]);

export const TRAUMA_TAG_INDEX = Object.freeze(
  Object.fromEntries(TRAUMA_TAG_DATABASE.map((row) => [row.id, row])),
);
