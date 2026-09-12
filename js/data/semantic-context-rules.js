/**
 * Semantic context rules for public copy and triad options.
 * Adjectives, adverbs, and verbs must match age, body, and the week's crisis.
 */

export const CHILD_MATURE_PATTERNS = Object.freeze([
  /仕途|應酬|職場|升遷|權術|老謀|玩世不恭|情場|情慾|慾望同時/,
  /買醉|酒局|認真追求一段感情|入股|交易所|心機/,
  /中年危機|玩世|宦途|官場應酬/,
]);

export const CHILD_TONE_PATTERNS = Object.freeze([
  /心氣還算高|判斷變薄、步子變快|用別人的眼睛檢查自己的走姿/,
  /友情、工作和慾望|出路像很多扇門/,
]);

export const VIGOROUS_MOTION_PATTERNS = Object.freeze([
  /狂奔|飛奔|猛撲|衝刺|連跳|全力奔跑|瘋跑|徹夜狂歡/,
  /把多餘的怒氣耗在跑跳|搏鬥到天亮|扭打一整夜|把人從地上拽起來猛/,
]);

export const FRAIL_BODY_PATTERNS = Object.freeze([
  /癱瘓|癱瘓在|起不了身|虛脫|發軟|腿腫|走不動|昏迷|抽搐/,
]);

export const EUPHORIC_PATTERNS = Object.freeze([
  /狂喜|興高采烈|欣喜若狂|歡呼雀躍|得意忘形/,
]);

export const SATED_PATTERNS = Object.freeze([
  /酒足飯飽|吃撐|大餐|酒肉|飽食終日/,
]);

export const LEISURE_PATTERNS = Object.freeze([
  /無用的愛好|去聽爵士|卡帶、明星海報|把生活切片發到/,
  /圍著電視看連續劇|溜去戲園、電影院|往河邊、山坡或空地跑整天/,
  /去公園|遊樂場|唱K|狂歡/,
]);

export const INCOHERENT_PATTERNS = Object.freeze([
  /還沒有名字的東西/,
  /把影子留在原地/,
  /數到三再眨眼/,
  /把運氣從左邊口袋換到右邊/,
  /對鏡子練習一種還不屬於你的表情/,
  /選擇比較像門的那道光/,
  /水平線像一句沒寫完/,
  /命運的風鈴/,
  /暗影在呼吸中交織/,
  /意義不明|文意不通/,
]);

export const CRISIS_HOOKS = Object.freeze({
  hunger: ["hunger", "scarcity", "survival", "family"],
  illness: ["health", "survival", "family", "hide"],
  war: ["war", "survival", "hide", "family"],
  disaster: ["survival", "weather", "hide", "family"],
  confinement: ["family", "hide", "survival"],
  trauma: ["family", "hide", "survival", "health"],
  labor: ["labor", "survival", "scarcity"],
  school: ["school", "study", "hide", "social"],
});

export const SURVIVAL_SITUATIONS = Object.freeze([
  "hunger",
  "fever",
  "left_alone",
  "malnutrition",
  "abuse",
  "damp",
  "home",
  "trauma",
  "crisis",
  "idle",
]);
