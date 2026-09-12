import { worldEvent as we } from "./schema.js";

/**
 * Affluent / gated / "safe" districts. Safety is relative infrastructure, not moral cleanliness.
 * Quiet streets still have walls, servants, and things that are renamed as household matters.
 */

export const WORLD_AFFLUENT_EVENTS = [
  we({
    id: "we_gated_noise",
    kind: "household",
    lock: "scene",
    age: [5, 18],
    geoBands: ["affluent_safe"],
    fact: "這一週，門禁、庭院或厚牆那一側傳來器物落地、壓低的吼與短促的哭。警衛或傭人把臉轉開。第二天早餐照常。沒有人報警。有人說「那家在處理家務」。",
    procedure: "體面區把聲音做成隔音問題。隔音不是調查。",
    options: [
      {
        stance: "endure",
        text: "當作沒聽見，按原來的路線回家或上樓",
        effects: { mood: -2, charm: -1 },
        addTags: ["world_affluent_silence", "world_silent_witness"],
        trauma: { tags: ["trauma_cannot_ask_help"], intensity: 4, domain: "witness" },
        hooks: ["hide", "family"],
        followUps: ["牆恢復安靜。你被允許繼續當一個「好人家的孩子」。聽見本身沒有被寫進任何紀錄。"],
      },
      {
        stance: "ask",
        text: "問警衛、傭人或自己家裏的大人那是什麼聲音",
        effects: { intelligence: 1, charm: -1, mood: -2 },
        addTags: ["world_affluent_silence"],
        hooks: ["ask", "family"],
        followUps: ["答案是「別多事」或一個更乾淨的名詞。你得到了不許再問的邊界。"],
        risk: { chance: 0.2, effects: { mood: -4, charm: -2 }, text: "問本身被記成不懂事。這一週的餐桌變短。" },
      },
      {
        stance: "report",
        text: "把聽到的說給校方、鄰居委員會或警察聽",
        effects: { charm: -2, intelligence: 1, mood: -2 },
        addTags: ["world_informant", "world_affluent_silence"],
        hooks: ["official", "ask"],
        followUps: ["有一份筆錄或一次家訪。門禁那一側開始稱呼你的家庭。保護承諾比閒話短。"],
        consequence: { trust: -2, opinion: -3, heat: 2, eventLabel: "體面區開口" },
        risk: { chance: 0.34, effects: { mood: -4, charm: -3, wealth: -1 }, text: "被說成破壞門風。你家在這個圈子裡的信用先被扣。" },
      },
    ],
  }),
  we({
    id: "we_servant_child",
    kind: "mundane",
    age: [6, 16],
    geoBands: ["affluent_safe"],
    classes: ["gentry", "official", "merchant"],
    fact: "這一週，家裏或鄰居宅子裡的幫工、保姆或司機的孩子在後門等。有人叫你不要跟「那邊的」玩。有人叫你把剩菜拿去。階級在同一棟建築裡用門劃開。",
    procedure: "這不是友誼課。這是住在同一屋頂下的兩種匯率。",
    options: [
      {
        stance: "endure",
        text: "按家裡的規矩：點頭、不一起玩、把剩的遞過去就走",
        effects: { mood: -1, charm: -1 },
        addTags: ["world_affluent_silence"],
        hooks: ["family", "social"],
        followUps: ["規矩被遵守。後門那一側把你的臉記成主人家的一種。你把這週過成被允許的樣子。"],
      },
      {
        stance: "cross",
        text: "不理禁令，在後門或巷子裡一起耗掉一段時間",
        effects: { charm: 1, mood: 1, intelligence: 1 },
        addTags: ["world_silent_witness"],
        hooks: ["social", "street"],
        followUps: ["時間被花掉。家裡若發現，禁令會被說得更具體。兩邊都可能因此被罵。"],
        risk: { chance: 0.26, effects: { mood: -3, charm: -2 }, text: "被看見。傭人被扣工錢，你被禁足。連坐先於解釋。" },
      },
      {
        stance: "enforce",
        dark: true,
        text: "主動把禁令執行得更響：驅趕、告狀或當眾羞辱",
        effects: { charm: -2, mood: 0, intelligence: -1 },
        addTags: ["world_affluent_silence"],
        hooks: ["family", "official"],
        perpetrator: true,
        followUps: ["後門清了。有人丟了工或被罵。你被稱讚懂事。懂事在這裡等於幫牆加高。"],
        consequence: { trust: -4, opinion: -2, infamy: 2, eventLabel: "門禁執行" },
      },
    ],
  }),
];
