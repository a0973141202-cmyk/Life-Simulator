import { dailySlice as d } from "./schema.js";

/**
 * Waiting, recitation, and social control around political violence.
 * No operational planning, weapons, or targeting instructions.
 */

export const MILITANT_WAIT_SLICES = [
  d({
    id: "ml_meeting",
    state: "militant_wait",
    phase: "wait",
    age: [18, 55],
    audience: "adult",
    optionText: "參加一次大部分時間在等待與重複口號的聚會",
    effects: { intelligence: 1, mood: 1, charm: 1, health: -1 },
    sensory: "密閉房間的呼吸、油印或螢幕、茶冷掉的膜。有人的鞋一直點地。",
    procedure: "會議很少是決策，多半是確認誰還來、誰開始動搖。文件若有，也是已經決定的句子要你當眾讀出。讀出是簽名。不讀是記錄。",
    social: "熱情過剩的人令人不安，沉默過久的人同樣。你被要求用正確的恨看待正確的對象，私人的恨必須改寫成理論。",
    logic: "政治暴力團體用儀式維持凝結，因為行動之間的空白太長，空白會讓人想起普通生活。",
    domain: "militant",
    hooks: ["daily", "militant", "politics"],
  }),
  d({
    id: "ml_cover_life",
    state: "militant_wait",
    phase: "site",
    age: [18, 55],
    audience: "adult",
    optionText: "把白天過得像一個無害的人：上學、上班、買菜、抱怨物價",
    effects: { charm: 2, intelligence: 1, mood: -1 },
    sensory: "超市燈光。公車月票。你的背包看起來應該只有午餐。",
    procedure: "無害必須可被鄰居複述。作息、穿著、戀愛或沒有戀愛，都要能通過閒聊。你開始討厭自己的普通，因為普通是工作。真正消耗你的是不能把怒寫在臉上。",
    social: "最危險的不是敵人，是那個想跟你深談理想的舊同學。深談會把你從偽裝裡拖出來。",
    logic: "地下政治依賴與日常無異的外觀。外觀一旦成為專業，人會失去非表演的自己。",
    domain: "militant",
    hooks: ["daily", "hide", "militant"],
  }),
  d({
    id: "ml_doubt_hour",
    state: "militant_wait",
    phase: "night",
    age: [18, 55],
    audience: "adult",
    optionText: "在沒有觀眾的夜裡，讓那句「這值得嗎」走過一遍，再把它按回去",
    effects: { mood: -2, intelligence: 2, health: -1 },
    sensory: "天花板的裂縫。耳鳴。你把宣傳小冊的句子背到失去意思。",
    procedure: "懷疑不被允許公開，於是它改在身體裡發生：胃、失眠、突然的淚。你用更大聲的正確去蓋。蓋住之後仍要在明天的臉上出現。",
    social: "若你把懷疑說給錯的人，它會被當成試探或背叛。於是你只說給自己，自己又不可靠。",
    logic: "極端承諾靠隔離維持。隔離越成功，人越只剩下組織給的鏡子。鏡子碎的時候通常已經太晚。",
    domain: "militant",
    hooks: ["daily", "militant"],
  }),
];
