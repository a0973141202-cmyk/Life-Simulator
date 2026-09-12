/**
 * Ages 5–6: body facts under year × class × habitat.
 * No park, school, or social outings. Harsh climates bill hunger, fever, and being left.
 */

function a(id, text, effects, followUps, when = {}, extra = {}) {
  return {
    id,
    text,
    effects,
    followUps,
    when,
    weight: extra.weight ?? 3.2,
    childTheme: extra.childTheme,
    lane: extra.lane || "survival",
    ...extra,
  };
}

export const EARLY_CHILD_SURVIVAL_POOL = [
  a("ec_hunger_bowl", "盯著碗底或空鍋，把還想要的那一口嚥回去", { health: -2, mood: -2, intelligence: 1 }, [
    "熱量沒有增加。你把饑餓練成安靜。大人說「再要就貪」。",
    "胃在後半夜醒來。沒有人起來為一個五歲的人開火。",
  ], { age: [5, 6], classes: ["peasant", "worker", "immigrant", "artisan"] }, {
    childTheme: "hunger",
    lane: "survival",
    hooks: ["survival", "hunger", "family"],
    trauma: { tags: ["trauma_attachment_starve"], intensity: 7, domain: "home" },
    traumaVictim: true,
    traumaNonsexual: true,
    direction: "endure",
    riskBand: "high",
    situation: "hunger",
  }),
  a("ec_fever_mat", "發燒時躺在能被看見的位置，等有人發現你還熱", { health: -3, mood: -2 }, [
    "冷毛巾若來，已經不冰。請醫生是最後一步，因為錢。",
    "你把熱當成天氣。有人說「扛一扛就過了」。有人不在家。",
  ], { age: [5, 6] }, {
    childTheme: "illness",
    lane: "illness",
    hooks: ["health", "family", "survival"],
    trauma: { tags: ["trauma_cannot_ask_help"], intensity: 6, domain: "home" },
    traumaVictim: true,
    traumaNonsexual: true,
    risk: { chance: 0.22, effects: { health: -8 }, text: "熱度沒退。這一週以抽搐或脫水結算的邊緣走過。" },
    direction: "endure",
    riskBand: "high",
    situation: "fever",
    weight: 3.6,
  }),
  a("ec_left_latch", "被留在屋裏或炕上，聽門外的腳步決定要不要出聲", { mood: -2, intelligence: 1, health: -1 }, [
    "大人的時間更貴。你的任務是不要添麻煩、不要開門、不要把火弄旺。",
    "尿了或餓了都要自己先熬。回來的第一句話通常是東西還在不在。",
  ], { age: [5, 6] }, {
    childTheme: "confinement",
    lane: "family",
    hooks: ["family", "hide", "survival"],
    trauma: { tags: ["trauma_attachment_starve", "trauma_cannot_ask_help"], intensity: 8, domain: "home" },
    traumaVictim: true,
    traumaNonsexual: true,
    direction: "endure",
    riskBand: "mid",
    situation: "left_alone",
    weight: 3.5,
  }),
  a("ec_damp_chest", "潮、冷或煙把咳寫進胸，把身體縮成更小的一團", { health: -2, mood: -1 }, [
    "牆壁出汗。席子潮。你用別人的外套當第二層皮膚。",
    "咳在夜裏最響。沒有人把這寫成病歷，只寫成「這孩子弱」。",
  ], { age: [5, 6], classes: ["peasant", "worker", "immigrant", "artisan"] }, {
    childTheme: "illness",
    lane: "illness",
    hooks: ["health", "weather", "survival"],
    trauma: { tags: ["trauma_flinch_body"], intensity: 5, domain: "home" },
    traumaVictim: true,
    traumaNonsexual: true,
    direction: "endure",
    riskBand: "mid",
    situation: "damp",
  }),
  a("ec_legs_soft", "腿腫或發軟時把一步路走成兩次歇，不讓自己在大人眼前倒下", { health: -3, mood: -2 }, [
    "營養不良很少進大事記。它寫在你站起來時發黑的眼前。",
    "有人捏你的小腿說「水腫」。沒有人改這一週的鍋。",
  ], { age: [5, 6], classes: ["peasant", "worker", "immigrant", "artisan"] }, {
    childTheme: "malnutrition",
    lane: "survival",
    hooks: ["health", "hunger", "survival"],
    trauma: { tags: ["trauma_attachment_starve", "trauma_shame_core"], intensity: 8, domain: "home" },
    traumaVictim: true,
    traumaNonsexual: true,
    direction: "endure",
    riskBand: "high",
    situation: "malnutrition",
    weight: 3.4,
  }),
  a("ec_guard_dregs", "把能盛的殘湯或水護住，不讓弟妹、蒼蠅或老鼠先碰到", { health: -1, mood: -1, intelligence: 1 }, [
    "這不是分享課。這是五歲的人被派去當蓋子。",
    "灑了要自己承受下一頓的空。你開始用手量體積。",
  ], { age: [5, 6], classes: ["peasant", "worker", "immigrant", "artisan"] }, {
    childTheme: "hunger",
    lane: "survival",
    hooks: ["survival", "hunger", "family"],
    trauma: { tags: ["trauma_parentified"], intensity: 6, domain: "home" },
    traumaVictim: true,
    traumaNonsexual: true,
    direction: "endure",
    riskBand: "mid",
    situation: "hunger",
  }),
  a("ec_sleeve_blow", "把這一週落在身上的打或器物，藏進袖子能蓋住的位置", { health: -4, mood: -3, charm: -1 }, [
    "理由是哭聲、飯量、或根本不需要理由。鄰居把聲音開大。",
    "沒有驗傷單。你把能走的路走完，把青紫留給布。",
  ], { age: [5, 6], tagsAny: ["household_volatile", "household_alcohol", "household_step_tension"] }, {
    childTheme: "abuse",
    lane: "survival",
    hooks: ["family", "hide", "health"],
    trauma: { tags: ["trauma_flinch_body", "trauma_shame_core", "trauma_self_blame"], intensity: 11, domain: "home" },
    traumaVictim: true,
    traumaNonsexual: true,
    risk: { chance: 0.24, effects: { health: -9 }, text: "力道比「這一週」的預算大。頭或耳開始要價。" },
    direction: "endure",
    riskBand: "high",
    situation: "abuse",
    weight: 3.8,
  }),
  a("ec_wait_door", "大人出去做事時，你把整晚過成聽門栓的工作", { mood: -2, intelligence: 1, health: -1 }, [
    "火不能太旺。窗不能全開。有人來拍門時，你被交代裝作沒人。",
    "回來的人可能帶糧，也可能帶酒氣。你先分辨腳步。",
  ], { age: [5, 6] }, {
    childTheme: "confinement",
    lane: "family",
    hooks: ["family", "hide", "night"],
    trauma: { tags: ["trauma_hypervigilance"], intensity: 7, domain: "home" },
    traumaVictim: true,
    traumaNonsexual: true,
    direction: "endure",
    riskBand: "mid",
    situation: "left_alone",
    weight: 3.3,
  }),
];
