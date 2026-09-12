import { adultIncident as inc } from "./schema.js";

/**
 * Shops, stalls, small capital: squeeze, counterfeit pressure, debt.
 */

export const ADULT_COMMERCE_INCIDENTS = [
  inc({
    id: "ac_supplier_squeeze",
    kind: "commerce",
    sector: "commerce",
    occupationAny: ["shopkeep", "stall_vendor", "gentry_steward"],
    fact: "這一週，上游漲價或斷貨。租、利息、熟客欠帳同時到期。有人提議換一批「看起來一樣」的貨；有人介紹地下週轉，利息按天。顧客仍按舊價錢罵。",
    procedure: "小生意的破產很少爆炸，它是連續三筆付不出。",
    options: [
      {
        stance: "endure",
        text: "減量、欠租、把笑容維持到這個月底",
        effects: { wealth: -3, charm: 1, mood: -2, health: -1 },
        addTags: ["adult_shop_fail", "adult_debt"],
        burnoutDelta: 6,
        hooks: ["commerce", "work"],
        followUps: [
          "店還開著。帳本上的洞沒有因為你勤快而自己長平。",
        ],
      },
      {
        stance: "cut",
        text: "換劣質或假標的貨，把差價留給租金",
        effects: { wealth: 2, charm: -1, intelligence: 1 },
        addTags: ["adult_graft", "adult_shop_fail"],
        crisisDelta: 8,
        hooks: ["commerce"],
        path: "commerce",
        followUps: [
          "退貨與口碑比進貨快。檢查或同業檢舉是時間問題。",
        ],
        consequence: { heat: 5, opinion: -4, trust: -3, path: "commerce", pathXp: 1, eventLabel: "摻假求生" },
        risk: { chance: 0.28, effects: { wealth: -7, charm: -3 }, text: "抽檢或顧客出事。罰款先於解釋。" },
      },
      {
        stance: "loan_shark",
        dark: true,
        text: "接地下週轉，用下一週的命填這一週的洞",
        effects: { wealth: 4, mood: -2, health: -1 },
        addTags: ["adult_debt", "adult_underworld_base"],
        crisisDelta: 16,
        hooks: ["commerce", "crime"],
        path: "crime",
        followUps: [
          "錢當天能用。收帳的人認識你的店門與家人下班的路。",
        ],
        consequence: { heat: 9, wanted: 5, infamy: 6, trust: -6, path: "crime", pathXp: 2, eventLabel: "地下週轉" },
        risk: { chance: 0.32, effects: { health: -6, wealth: -4, charm: -2 }, text: "利息滾過本金。警告從砸貨開始。" },
      },
    ],
  }),
  inc({
    id: "ac_rival_dirty",
    kind: "commerce",
    sector: "commerce",
    fact: "這一週，對家開始用手段——挖角、造謠、堵供貨、買通檢查、或在你攤位前站人牆。生意掉得像被切斷水管。街坊說「做生意都這樣」。都這樣的意思是沒有法院管這一段。",
    procedure: "商場競爭在基層往往不是廣告，是封鎖與羞辱。",
    options: [
      {
        stance: "endure",
        text: "改路線、改時段、把衝突不當成可以贏的事",
        effects: { wealth: -3, mood: -2, intelligence: 1 },
        addTags: ["adult_shop_fail"],
        hooks: ["commerce", "hide"],
        followUps: [
          "你還在賣。位置更差。對家不必追你，市場會幫他完成。",
        ],
      },
      {
        stance: "mirror",
        text: "用同樣的封鎖、挖角或買通，把壓力推回去",
        effects: { wealth: 1, charm: -1, intelligence: 1 },
        addTags: ["adult_office_politics"],
        crisisDelta: 9,
        hooks: ["commerce", "street"],
        path: "commerce",
        followUps: [
          "兩邊開始互記。地方上的人會選邊，或等你們兩敗。",
        ],
        consequence: { heat: 6, infamy: 3, opinion: -3, path: "commerce", pathXp: 2, eventLabel: "惡性競爭" },
        risk: { chance: 0.26, effects: { wealth: -5, health: -3 }, text: "衝突從貨變成手。有人報官或找場外的人。" },
      },
      {
        stance: "hire_force",
        dark: true,
        perpetrator: true,
        text: "花錢請人嚇、砸、或讓對家暫時開不了門",
        effects: { wealth: -2, charm: -1, health: -1 },
        addTags: ["adult_gang_rank", "adult_underworld_base"],
        crisisDelta: 18,
        hooks: ["commerce", "crime", "street"],
        path: "crime",
        followUps: [
          "場子安靜一週。經手的人從此認識你的臉與你的弱點。",
        ],
        consequence: { wanted: 12, heat: 14, infamy: 10, trust: -10, path: "crime", pathXp: 3, eventLabel: "商場暴力" },
        risk: { chance: 0.38, effects: { health: -8, wealth: -6, charm: -3 }, text: "反砸或逮捕。雇來的人可以作證，也可以把你賣了。" },
      },
    ],
  }),
];
