/**
 * Age 5–8: first weeks the player is allowed to choose.
 * Self-awareness, naming, secrets — not adult sandbox.
 */

function a(id, text, effects, followUps, when = {}, extra = {}) {
  return { id, text, effects, followUps, when, weight: extra.weight ?? 1.2, ...extra };
}

export const AWAKENING_ACTION_POOL = [
  a("awake_name_world", "把房間裡的東西重新取一個只有你懂的名字", { intelligence: 2, mood: 1, charm: 1 }, [
    "世界開始可以被呼叫。呼叫是一種佔有，也是一種分離。",
    "家人笑你的詞。你知道他們聽不懂重點。",
  ], { age: [7, 8] }, { hooks: ["study", "empathy"] }),
  a("awake_first_secret", "把一件小事藏起來，不告訴任何人", { intelligence: 1, mood: 1, charm: -1 }, [
    "內側多了一個抽屜。你第一次覺得自己有厚度。",
    "秘密比糖果更甜，也更快變質。",
  ], { age: [5, 9] }, { hooks: ["empathy"] }),
  a("awake_follow_sound", "跟著一種說不清的聲音走到門檻邊", { health: 1, mood: 1, intelligence: 1 }, [
    "也許是風，也許是你把自己嚇大了一歲。",
    "門檻外的光比故事裡的寬。",
  ], { age: [7, 8] }, { hooks: ["weather"] }),
  a("awake_copy_adult", "把某個大人的走法、口氣或嘆息學一遍", { charm: 2, intelligence: 1, mood: -1 }, [
    "你發現人格可以被試穿。有的合身，有的刺。",
    "被學的那個人突然不自在。你把這記成力量。",
  ], { age: [7, 10] }, { hooks: ["social"] }),
  a("awake_ask_dead", "追問一個不在場的人為什麼不在", { mood: -2, intelligence: 2, charm: 1 }, [
    "答案含糊。你開始懂得：有些空位是家具。",
    "有人用故事填洞。你把洞留下。",
  ], { age: [5, 11], tagsAny: ["parent_father_deceased", "parent_mother_deceased"] }, { weight: 2.2, hooks: ["empathy", "family"] }),
  a("awake_map_home", "用腳把家的邊界走清楚：哪裡能去，哪裡會被喊回來", { intelligence: 2, health: 1 }, [
    "地理課從門檻開始。你畫的第一張地圖沒有北方，只有語氣。",
    "你發現禁地往往比較近。",
  ], { age: [5, 8] }, { hooks: ["survival"], childTheme: "confinement", lane: "family" }),
  a("awake_taste_rule", "故意試一次「不行」的邊緣，看懲罰怎麼來", { mood: 1, charm: -1, intelligence: 1 }, [
    "規則變成有重量的東西。你稱了一下。",
    "痛比道理更早到。你把這兩者暫時當成同一種語言。",
  ], { age: [5, 10] }, {
    hooks: ["family", "hide"],
    childTheme: "abuse",
    lane: "survival",
    risk: { chance: 0.22, effects: { mood: -3, health: -1 }, text: "試得太過。這一週的晚餐變成沉默。" },
  }),
  a("awake_weather_body", "在出門前記住身體比大人更早知道的那種天氣", { health: 1, intelligence: 2, mood: 1 }, [
    "你還不會說氣壓。你只會說「今天的空氣不對」。",
    "有人終於願意晚一點再走。",
  ], { age: [5, 12], tagsAny: ["trait_barometric_sense", "hook_weather", "date_winter", "date_summer"] }, { weight: 2, hooks: ["weather"] }),
];
