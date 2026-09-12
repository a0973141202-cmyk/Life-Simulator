import { adultIncident as inc } from "./schema.js";

/**
 * White-collar / clerical: credit theft, KPI, meetings as rank.
 */

export const ADULT_OFFICE_INCIDENTS = [
  inc({
    id: "ao_credit_theft",
    kind: "office",
    sector: "office",
    occupationAny: ["office_clerk", "civil_clerk", "party_staff"],
    fact: "這一週，你做的表、稿或方案，在會上變成別人的口頭禪。主管問「是誰的主意」時，有人先舉手。你的名字在附件，不在致謝。走廊裡有人用眼神要你別當場拆穿。",
    procedure: "職場的所有權很少寫在檔案裡。它寫在誰能打斷誰。",
    options: [
      {
        stance: "endure",
        text: "讓會議過完，把下一次的檔案自己多留一份",
        effects: { intelligence: 1, mood: -2, charm: -1 },
        addTags: ["adult_burnout"],
        burnoutDelta: 5,
        hooks: ["office", "hide"],
        followUps: [
          "你沒有當眾拆穿。升遷討論仍不會自動補上你的名字。",
        ],
      },
      {
        stance: "climb",
        text: "事後把把柄交給另一派，用別人的錯換自己的位置",
        effects: { charm: 1, intelligence: 1, mood: -1 },
        addTags: ["adult_office_politics", "adult_promoted_thin"],
        crisisDelta: 5,
        hooks: ["office", "politics"],
        path: "lawful",
        followUps: [
          "有人開始抄送你。也有人開始不在你面前講完整句。薄昇進常常長這樣。",
        ],
        consequence: { politicalCapital: 4, trust: -3, opinion: -2, path: "politics", pathXp: 1, eventLabel: "辦公室站隊" },
        risk: { chance: 0.24, effects: { charm: -4, mood: -2 }, text: "反咬比你快。你被寫進「溝通問題」。" },
      },
      {
        stance: "frame",
        dark: true,
        perpetrator: true,
        text: "改紀錄、洩密或栽贓，讓那個人先從名單上消失",
        effects: { intelligence: 2, wealth: 1, charm: -1 },
        addTags: ["adult_office_politics", "adult_graft", "adult_betrayer"],
        crisisDelta: 14,
        hooks: ["office", "crime"],
        path: "crime",
        followUps: [
          "檔案被改過的人會找來源。來源不一定是法律，也可能是私下了結。",
        ],
        consequence: { heat: 7, infamy: 5, trust: -8, politicalCapital: -2, path: "crime", pathXp: 2, eventLabel: "職場栽贓" },
        risk: { chance: 0.3, effects: { wealth: -4, charm: -4 }, text: "郵件或權限日誌對上你。人事與法務同時約談。" },
      },
    ],
  }),
  inc({
    id: "ao_kpi_cook",
    kind: "office",
    sector: "office",
    fact: "這一週，指標完不成。主管說「想辦法」。想辦法的意思是改口徑、提前認列、把客戶還沒簽的單寫進去，或把鍋分給離職的人。加班到末班車仍補不齊缺口。",
    procedure: "數字比現場權威。現場必須改成數字喜歡的樣子。",
    options: [
      {
        stance: "endure",
        text: "如實填，接受扣薪或約談，把缺口留在紙上",
        effects: { wealth: -2, mood: -2, intelligence: 1 },
        addTags: ["adult_burnout"],
        burnoutDelta: 7,
        hooks: ["office", "work"],
        followUps: [
          "真實的數字沒有被獎勵。你被稱為不懂配合。",
        ],
      },
      {
        stance: "cook",
        text: "改口徑、提前認列，讓這一季的表過關",
        effects: { wealth: 2, intelligence: 1, mood: -1 },
        addTags: ["adult_graft", "adult_promoted_thin"],
        crisisDelta: 9,
        burnoutDelta: 4,
        hooks: ["office", "commerce"],
        path: "commerce",
        followUps: [
          "表過了。審計或對帳若來，日期會出賣手。",
        ],
        consequence: { heat: 5, trust: -3, path: "commerce", pathXp: 1, eventLabel: "做帳過關" },
        risk: { chance: 0.26, effects: { wealth: -6, charm: -2 }, text: "抽查抽到你負責的欄。獎金追回，信用先死。" },
      },
      {
        stance: "embezzle",
        dark: true,
        perpetrator: true,
        text: "把缺口做成自己的帳外收入：虛報、回扣或假發票",
        effects: { wealth: 5, intelligence: 1, mood: 0 },
        addTags: ["adult_graft", "adult_debt"],
        crisisDelta: 18,
        hooks: ["office", "crime"],
        path: "crime",
        followUps: [
          "現金先到。票據鏈比記憶長。公司可以不聲張地處理你，也可以報案。",
        ],
        consequence: { wanted: 10, heat: 12, infamy: 8, trust: -12, path: "crime", pathXp: 3, eventLabel: "職務侵占" },
        risk: { chance: 0.36, effects: { wealth: -10, charm: -4, health: -2 }, text: "法務與警察的順序不一定誰先。凍結從帳戶開始。" },
      },
    ],
  }),
];
