import { adultIncident as inc } from "./schema.js";

/**
 * Patronage, envelopes, faction purges. Facts of machinery, not sermons.
 */

export const ADULT_POLITICS_INCIDENTS = [
  inc({
    id: "ap_envelope",
    kind: "politics",
    sector: "politics",
    occupationAny: ["party_staff", "civil_clerk", "gentry_steward"],
    fact: "這一週，有一個信封、一張卡、或一次「先墊」。內容不必當面說。你要把它送到指定的人，或從指定的人那裡收回扣。拒絕會被寫成不懂事。收下會被寫進某本不公開的帳。",
    procedure: "賄賂很少用賄賂這個詞。它用意思、心意、手續費。",
    options: [
      {
        stance: "refuse",
        text: "不碰信封，把這趟差事還回去，承擔被邊緣",
        effects: { charm: -2, mood: -1, intelligence: 1, wealth: 0 },
        addTags: ["adult_whistle"],
        crisisDelta: 4,
        hooks: ["politics", "official"],
        path: "lawful",
        followUps: [
          "你被稱為清高或麻煩。名單還在，只是你不在需要被喂的那一列。",
        ],
        consequence: { trust: 3, politicalCapital: -4, opinion: 1, eventLabel: "拒收意思" },
      },
      {
        stance: "carry",
        text: "照送、照收，當一條會走路的手續",
        effects: { wealth: 2, charm: 1, intelligence: 1, mood: -1 },
        addTags: ["adult_graft", "adult_politics_base"],
        crisisDelta: 10,
        hooks: ["politics"],
        path: "politics",
        followUps: [
          "你變得有用。有用的人最容易在清算時被點名，因為證據在手上。",
        ],
        consequence: { politicalCapital: 5, heat: 6, trust: -4, path: "politics", pathXp: 2, eventLabel: "經手好處" },
        risk: { chance: 0.24, effects: { wealth: -5, charm: -3 }, text: "抽查或錄音。經手者比下令者先被放上桌。" },
      },
      {
        stance: "pocket",
        dark: true,
        perpetrator: true,
        text: "截留一部分，或把把柄複製一份留給自己",
        effects: { wealth: 4, intelligence: 2, charm: -1 },
        addTags: ["adult_graft", "adult_betrayer"],
        crisisDelta: 16,
        hooks: ["politics", "crime"],
        path: "crime",
        followUps: [
          "短少與備份都會被發現。政商的報復可以走紀檢、也可以走車禍。",
        ],
        consequence: { wanted: 8, heat: 12, infamy: 7, politicalCapital: -6, trust: -10, path: "crime", pathXp: 3, eventLabel: "截留把柄" },
        risk: { chance: 0.34, effects: { health: -6, wealth: -8, charm: -4 }, text: "你被叫去一間沒有窗戶的房間。解釋從這時起不值錢。" },
      },
    ],
  }),
  inc({
    id: "ap_faction_purge",
    kind: "politics",
    sector: "politics",
    fact: "這一週，派系要清人。會議改成學習，學習改成表態。有一個名字被反覆提起，像已經死了、只差手續。有人把檢舉草稿塞到你手裡，要你簽名或補充細節。",
    procedure: "極權與普通機關的差別往往只是速度。材料都是人寫的。",
    options: [
      {
        stance: "endure",
        text: "不簽字、少說話，設法當背景而不是證人",
        effects: { mood: -2, charm: -1, intelligence: 1 },
        addTags: ["adult_burnout"],
        burnoutDelta: 5,
        hooks: ["politics", "hide"],
        followUps: [
          "你沒有寫那一行。下一次材料可能換成你的名字，理由是態度。",
        ],
      },
      {
        stance: "denounce",
        text: "簽名、補充、當眾切割，換自己留在機器裡",
        effects: { charm: 1, intelligence: 1, mood: -2 },
        addTags: ["adult_office_politics", "adult_betrayer", "adult_promoted_thin"],
        crisisDelta: 11,
        hooks: ["politics"],
        path: "politics",
        followUps: [
          "那個人的位置空了。空位暫時不是你的。你的名字進了另一份會被保存的名單。",
        ],
        consequence: { politicalCapital: 6, trust: -8, opinion: -4, infamy: 4, path: "politics", pathXp: 2, eventLabel: "表態檢舉" },
        risk: { chance: 0.22, effects: { charm: -4, mood: -3 }, text: "風向當天轉。你的檢舉被當成過河拆橋的樣板。" },
      },
      {
        stance: "switch",
        dark: true,
        perpetrator: true,
        text: "連夜把材料、人脈與對方的把柄賣給對面，自己先翻盤",
        effects: { intelligence: 2, wealth: 2, charm: -2, health: -1 },
        addTags: ["adult_betrayer", "adult_graft"],
        crisisDelta: 18,
        hooks: ["politics", "crime"],
        path: "crime",
        followUps: [
          "新主子用你，舊主子找你。兩邊的清算都可以做成意外。",
        ],
        consequence: { heat: 14, wanted: 6, infamy: 9, politicalCapital: -2, trust: -12, path: "crime", pathXp: 3, eventLabel: "派系倒戈" },
        risk: { chance: 0.36, effects: { health: -10, wealth: -6 }, text: "有人決定你知道得太多。這不是比喻。" },
        ending: { chance: 0.06, reason: "派系滅口", detail: "倒戈的中間人在結案前消失。手續寫成意外或畏罪。" },
      },
    ],
  }),
];
