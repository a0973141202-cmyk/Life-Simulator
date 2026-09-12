import { adultIncident as inc } from "./schema.js";

/**
 * Cross-sector adult beats: unemployment shame, debt collectors, burnout.
 */

export const ADULT_GENERIC_INCIDENTS = [
  inc({
    id: "ag_neet_shame",
    kind: "burnout",
    sector: "neet",
    occupationAny: ["unemployed_depend"],
    fact: "這一週，親戚、鄰居或父母把「最近在做什麼」問成結算。冰箱、房租、介紹工作的紙條同時出現。勞動市場沒有回信。家庭內部開始用糧食和眼神收費。",
    procedure: "無業不是休息。它是被市場吐出之後，家庭成為最後的櫃檯。",
    options: [
      {
        stance: "endure",
        text: "躲開放飯時間，用一個聽起來像計劃的句子擋過這一週",
        effects: { mood: -2, charm: -2, health: -1, wealth: 1 },
        addTags: ["adult_neet", "adult_burnout"],
        burnoutDelta: 6,
        hooks: ["family", "hide"],
        followUps: [
          "句子又用了一次。沒有一份工因為你的計劃而出現。",
        ],
      },
      {
        stance: "take_any",
        text: "接最差的班、最遠的工，先把「在上班」三個字買回來",
        effects: { wealth: 1, health: -3, mood: -1, charm: 1 },
        addTags: ["adult_labor_base", "adult_burnout"],
        burnoutDelta: 8,
        occupationId: "factory_hand",
        hooks: ["labor", "work"],
        path: "lawful",
        followUps: [
          "你有了可以對外說的職業名。身體開始按那個名字折舊。",
        ],
      },
      {
        stance: "easy_cash",
        dark: true,
        text: "去問那些不寫進履歷的錢：帶貨、看場、或一筆說不清的跑腿",
        effects: { wealth: 3, charm: -1, intelligence: 1, mood: -1 },
        addTags: ["adult_underworld_base"],
        crisisDelta: 12,
        occupationId: "gang_runner",
        hooks: ["crime", "street"],
        path: "crime",
        followUps: [
          "錢比面試快。把柄也是。家庭暫時不問，因為現金出現了。",
        ],
        consequence: { heat: 8, infamy: 5, trust: -5, path: "crime", pathXp: 2, eventLabel: "無業入地下" },
        risk: { chance: 0.28, effects: { health: -5, wealth: -3 }, text: "第一趟就出包。或被當成用完可棄的腿。" },
      },
    ],
  }),
  inc({
    id: "ag_burnout_break",
    kind: "burnout",
    tagsAny: ["adult_burnout"],
    fact: "這一週，睡眠碎掉。班表、帳、或恐嚇電話在沒有刺激時仍響。你在工作中停住幾秒，忘記自己在做哪一步。有人笑你，有人叫你撐。身體開始抗命。",
    procedure: "崩潰是生理帳的逾期。它不討論你的志向。",
    options: [
      {
        stance: "endure",
        text: "用咖啡、酒或忍，把這一週的班湊完",
        effects: { health: -4, mood: -3, wealth: 1 },
        addTags: ["adult_burnout", "adult_breakdown"],
        burnoutDelta: 12,
        hooks: ["work", "health"],
        followUps: [
          "班湊完了。判斷力沒有回來。下一次出錯的成本更高。",
        ],
        risk: { chance: 0.3, effects: { health: -8, mood: -4 }, text: "暈、受傷或當眾崩潰。現場不給病假流程。" },
      },
      {
        stance: "stop",
        text: "請假、辭、或躺下，讓收入先斷",
        effects: { wealth: -3, health: 1, mood: -1, charm: -1 },
        addTags: ["adult_layoff", "adult_breakdown"],
        burnoutDelta: -8,
        hooks: ["health", "hide"],
        followUps: [
          "身體得到幾天。位置可能沒有了。債與指責會來補位。",
        ],
      },
      {
        stance: "self_medicate",
        dark: true,
        text: "用藥、酒或更烈的東西把班表灌過去，並把來源交給不開處方的人",
        effects: { health: -3, mood: 1, wealth: -2, intelligence: -1 },
        addTags: ["adult_breakdown", "adult_debt"],
        crisisDelta: 10,
        hooks: ["health", "crime"],
        path: "narcotics",
        followUps: [
          "你準時出現。依賴與欠的人一起出現。這不是治療，是賒帳。",
        ],
        consequence: { heat: 6, healthRisk: 8, trust: -4, path: "narcotics", pathXp: 2, eventLabel: "用藥撐班" },
        risk: { chance: 0.34, effects: { health: -10, charm: -3 }, text: "過量、被抓或被勒索。身體與法律可以同一週到。" },
      },
    ],
  }),
];
