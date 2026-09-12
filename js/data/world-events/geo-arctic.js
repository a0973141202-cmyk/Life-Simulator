import { worldEvent as we } from "./schema.js";

/**
 * Polar / arctic / high-cold settlements. Weather arrives before character.
 */

export const WORLD_ARCTIC_EVENTS = [
  we({
    id: "we_whiteout",
    kind: "survival",
    age: [5, 90],
    geoBands: ["arctic"],
    fact: "這一週，能見度在幾分鐘內被風雪抹掉。繩、牆或已經記得的電線桿成為唯一的路。有人沒在預計時間出現。救援若存在，它也要等風。",
    procedure: "白化不是風景。走錯方向的成本以體溫計算。",
    options: [
      {
        stance: "endure",
        text: "停在能摸到的掩體內，不出門去找還沒收工的人",
        effects: { health: -3, mood: -2, wealth: -1 },
        addTags: ["world_arctic_exposure"],
        hooks: ["arctic", "hide", "survival"],
        followUps: ["你還有手指。外面的名字要等雪停。停的選擇會被後來的人重講成冷血或活命，那是事後的詞。"],
        risk: { chance: 0.16, effects: { health: -11 }, text: "掩體不夠。手指或腳趾發黑、失去知覺。" },
      },
      {
        stance: "rope",
        text: "沿著繩或牆出去找還沒回來的人，或把燃料補進共用之處",
        effects: { health: -5, charm: 2, mood: -1 },
        addTags: ["world_arctic_exposure"],
        hooks: ["arctic", "survival", "social"],
        followUps: ["有人被拖回來，或燃料多撐了一夜。你的臉與肺記這筆。極地不發獎章。"],
        risk: { chance: 0.34, effects: { health: -16 }, text: "繩的盡頭不是人。風把方向收走。" },
      },
      {
        stance: "hoard",
        dark: true,
        text: "把能燒的、能吃的先搬進自己這一戶能鎖的範圍",
        effects: { wealth: 2, health: -2, charm: -3, mood: -1 },
        addTags: ["world_arctic_exposure", "world_looter"],
        hooks: ["arctic", "crime", "survival"],
        path: "crime",
        followUps: ["你的爐子先亮。共倉的缺口會在雪停後開會。極地的會議有時不使用語言。"],
        consequence: { heat: 6, trust: -8, infamy: 4, path: "crime", pathXp: 1, eventLabel: "極地囤燃料" },
        risk: { chance: 0.3, effects: { health: -8, wealth: -3, charm: -4 }, text: "被發現。共享規則用排除來執行。" },
      },
    ],
  }),
  we({
    id: "we_fuel_late",
    kind: "survival",
    age: [5, 90],
    geoBands: ["arctic"],
    climates: ["polar", "cold"],
    fact: "這一週，補給船、雪車或定時的燃料沒有按表到達。室內溫度掉到必須把水缸移到爐邊，否則會結冰漲裂。有人開始算還能燒幾天。官方廣播若存在，它重複「正在協調」。",
    procedure: "誤點在極地等於減壽。錢買不到已經沒開出來的船。",
    options: [
      {
        stance: "endure",
        text: "把室溫與口糧往下調，等下一班還可能來的車",
        effects: { health: -3, mood: -2, wealth: -1 },
        addTags: ["world_arctic_exposure", "world_famine_witness"],
        hooks: ["arctic", "survival", "hide"],
        followUps: ["你還在。手指的感覺變遲。等待被寫進身體，不寫進投訴信。"],
        risk: { chance: 0.18, effects: { health: -10 }, text: "下一班比體溫預算晚。" },
      },
      {
        stance: "share",
        text: "把剩下的燃料或熱食拿去共用點，換一個較不容易單獨熄火的夜晚",
        effects: { wealth: -2, health: -2, charm: 2, mood: -1 },
        addTags: ["world_arctic_exposure"],
        hooks: ["arctic", "social", "survival"],
        followUps: ["共火讓幾戶過了夜。柴、糧又少了一截。之後若有人反悔，會把你從火邊趕開。"],
      },
      {
        stance: "cut",
        dark: true,
        text: "減少分給弱者或外戶的那一份，把熱留給「還能出門的人」",
        effects: { wealth: 1, health: -1, charm: -3, mood: -2 },
        addTags: ["world_arctic_exposure", "world_informant"],
        hooks: ["arctic", "survival"],
        followUps: ["能出門的人還能出門。被切掉的那一側不會在會議上記成自願。"],
        consequence: { trust: -8, opinion: -6, infamy: 3, eventLabel: "極地切配額" },
        risk: { chance: 0.22, effects: { health: -6, charm: -4 }, text: "反彈以孤立或奪走你的爐子的形式到來。" },
      },
    ],
  }),
];
