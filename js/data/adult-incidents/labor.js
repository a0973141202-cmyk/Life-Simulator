import { adultIncident as inc } from "./schema.js";

/**
 * Wage labor: hours, injury, replacement. Facts only. Heart is the triad.
 */

export const ADULT_LABOR_INCIDENTS = [
  inc({
    id: "al_overtime_cover",
    kind: "labor",
    sector: "labor",
    occupationAny: ["factory_hand", "construction_hand", "farmhand", "artisan_hand", "domestic_worker"],
    fact: "這一週，班表在下班鈴之後繼續。加班寫成自願或算件。有人手指或腰出事，線長要你在事故單上勾「個人疏失」，好讓產線不停。工資遲發三天，理由是「對帳」。",
    procedure: "工傷鑑定沒開始。停手等於讓位。開口要錢等於被記住。",
    options: [
      {
        stance: "endure",
        text: "簽字、加班、把疼藏進下一週，先把這筆錢拿到",
        effects: { wealth: 1, health: -4, mood: -2 },
        addTags: ["adult_burnout", "adult_labor_injury"],
        burnoutDelta: 10,
        hooks: ["labor", "work", "hide"],
        followUps: [
          "你的名字在自願欄。產線沒停。疼痛會在家裡的椅子上補收。",
        ],
        risk: { chance: 0.22, effects: { health: -8, wealth: -1 }, text: "同一處再損一次。這一週開始跛或握不住工具。" },
      },
      {
        stance: "report",
        text: "留下證據、找工會或勞動部門，把「自願」這兩個字頂回去",
        effects: { intelligence: 1, wealth: -2, charm: -1, mood: -1 },
        addTags: ["adult_whistle", "adult_union"],
        crisisDelta: 6,
        hooks: ["labor", "official"],
        followUps: [
          "程序啟動很慢。黑名單比較快。有人拍你的肩，語氣像關心。",
        ],
        consequence: { trust: 2, opinion: -2, heat: 3, eventLabel: "勞動開口" },
        risk: { chance: 0.28, effects: { wealth: -4, charm: -3 }, text: "班被調到最差的崗。或直接被說人手優化。" },
      },
      {
        stance: "skim",
        dark: true,
        text: "偷工、夾料、把公司的東西換成現金，用違法補回被欠的部分",
        effects: { wealth: 3, health: -1, intelligence: 1 },
        addTags: ["adult_graft"],
        crisisDelta: 14,
        hooks: ["labor", "crime"],
        path: "crime",
        followUps: [
          "短少會指向現場的人。監工不一定立刻抓到，帳卻開始有你的形狀。",
        ],
        consequence: { heat: 8, infamy: 5, trust: -6, wanted: 4, path: "crime", pathXp: 2, eventLabel: "產線夾帶" },
        risk: { chance: 0.3, effects: { wealth: -5, charm: -3, health: -2 }, text: "盤點對上你。開除是最輕的。報警是另一種。" },
      },
    ],
  }),
  inc({
    id: "al_replace_cheaper",
    kind: "labor",
    sector: "labor",
    fact: "這一週，更便宜的人來了——新移民、更年輕的、或外包隊。領班說「一起熬」。同時有人被口頭通知下週不用來。罷工的耳語在廁所。有人已經答應頂班。",
    procedure: "市場用替換威脅紀律。集體若散，條件按個人結算，通常更差。",
    options: [
      {
        stance: "endure",
        text: "接受減班或降價，設法留在名單上",
        effects: { wealth: -2, mood: -2, health: -1 },
        addTags: ["adult_layoff"],
        burnoutDelta: 6,
        hooks: ["labor", "work"],
        followUps: [
          "你還在。工資更薄。下一批更便宜的人已經在路上。",
        ],
      },
      {
        stance: "scab",
        text: "答應頂罷工的班，換自己不被先裁",
        effects: { wealth: 2, charm: -2, mood: 0 },
        addTags: ["adult_scab"],
        crisisDelta: 7,
        hooks: ["labor", "work"],
        path: "lawful",
        followUps: [
          "領班點頭。工友把視線從你身上拿開。這筆錢能過週，這筆帳能過年。",
        ],
        consequence: { trust: -4, opinion: -3, eventLabel: "頂班破壞集體" },
        risk: { chance: 0.2, effects: { health: -5, charm: -2 }, text: "下班路上有人等你。不一定動手，但工具在。" },
      },
      {
        stance: "sabotage",
        dark: true,
        perpetrator: true,
        text: "破壞設備、威脅頂班者、或把衝突做成無法開工",
        effects: { wealth: -1, health: -3, charm: -1 },
        addTags: ["adult_whistle"],
        crisisDelta: 16,
        hooks: ["labor", "crime", "street"],
        path: "crime",
        followUps: [
          "停工有代價。代價會找主事的人。警察與公司可以同時到。",
        ],
        consequence: { heat: 10, wanted: 8, infamy: 7, trust: -8, path: "crime", pathXp: 2, eventLabel: "勞資衝突升級" },
        risk: { chance: 0.34, effects: { health: -8, wealth: -3 }, text: "有人受傷。攝影機比證人可靠。" },
      },
    ],
  }),
];
