import { schoolIncident as inc } from "./schema.js";

/**
 * Secondary-school gangs, campaigns of bullying, protection, weapons at the gate.
 */

export const SCHOOL_TEEN_INCIDENTS = [
  inc({
    id: "st_gang_dues",
    kind: "gang",
    age: [13, 17],
    audience: "teen",
    fact: "這一週，學校裡有具名或不具名的組織。有人收週費、定誰能走哪條走廊、在誰的書包裡放東西。外面的人偶爾進校園接人。老師說「不要跟他們玩」。玩不是這個詞。",
    procedure: "保護費、放風、帶貨、打架輪值。拒絕等於改走更遠的路，或變成示範。",
    options: [
      {
        stance: "endure",
        text: "交錢、繞路、把制服洗乾淨，設法不當示範",
        effects: { wealth: -2, mood: -1, charm: -1, health: -1 },
        addTags: ["school_bullied"],
        hooks: ["school", "hide"],
        followUps: [
          "你通過這一週的走廊。帳還在。組織不因為你順從而解散。",
        ],
      },
      {
        stance: "join",
        perpetrator: true,
        text: "入伙：交投名狀、跑一趟或在打架時站人牆",
        effects: { charm: 1, health: -2, wealth: 1, mood: 0 },
        addTags: ["school_gang", "school_enforcer"],
        hooks: ["school", "crime", "street"],
        followUps: [
          "你被叫過一次兄弟。回扣不夠一雙鞋。把柄足夠讓你下不了車。校外的人開始對你點頭。",
        ],
        consequence: { infamy: 8, heat: 6, trust: -6, notoriety: 5, path: "crime", pathXp: 2, eventLabel: "入伙校園幫" },
        risk: { chance: 0.22, effects: { health: -6, charm: -2 }, text: "火併或巡邏撞見。有人流血。名字被記下。" },
      },
      {
        stance: "lead",
        perpetrator: true,
        text: "爭位子：改規矩、收自己的人、把舊頭目擠開或合併",
        effects: { charm: 2, intelligence: 1, health: -2, wealth: 2 },
        addTags: ["school_ringleader", "school_gang", "school_hated"],
        hooks: ["school", "leadership", "crime"],
        followUps: [
          "走廊的走法改了一部分。改的代價是新仇人與舊帳。學校可能仍假裝沒有幫派。",
        ],
        consequence: { infamy: 12, heat: 9, trust: -8, opinion: -6, notoriety: 8, path: "crime", pathXp: 3, eventLabel: "爭校園頭目" },
        risk: { chance: 0.3, effects: { health: -8, charm: -3 }, text: "火併升級。刀具或鐵管進場。校方終於要開會。" },
      },
    ],
  }),
  inc({
    id: "st_campaign",
    kind: "bullying",
    age: [13, 17],
    audience: "teen",
    fact: "這一週，針對同一個人的行動是有分工的：起鬨、孤立、毀書包、傳照片或字條、在廁所等他。持續、重複、有觀眾。這不是口角。",
    procedure: "有人出點子，有人動手，有人轉發。老師收到「他太敏感」的解釋。",
    options: [
      {
        stance: "endure",
        text: "若你是對象：改路線、少開口。若不是：把視線移開",
        effects: { mood: -2, charm: -2, health: -1 },
        addTags: ["school_bullied"],
        trauma: { tags: ["trauma_dissociation", "trauma_cannot_ask_help"], intensity: 7, domain: "school" },
        hooks: ["school", "hide", "social"],
        followUps: [
          "行動沒有因為你換路線而結束。換路線是他們的勝利條件之一。這一週沒有結案。",
        ],
      },
      {
        stance: "join",
        perpetrator: true,
        text: "參與轉發、起鬨或動手，讓自己站在人多的那一側",
        effects: { charm: 1, mood: 0, intelligence: 0 },
        addTags: ["school_bully", "school_hated"],
        hooks: ["school", "social", "street"],
        followUps: [
          "你被算進「自己人」。對象的東西少了一件。聊天紀錄或字條上有你的筆跡或帳號。",
        ],
        consequence: { infamy: 6, heat: 3, trust: -5, opinion: -3, eventLabel: "參與群體霸凌" },
        risk: { chance: 0.2, effects: { charm: -4, mood: -2 }, text: "家長或校方截到證據。記過。名字進檔。" },
      },
      {
        stance: "lead",
        perpetrator: true,
        text: "升級：指定下一輪怎麼做、誰來做、做到什麼程度",
        effects: { charm: 2, intelligence: 1, mood: -1 },
        addTags: ["school_ringleader", "school_bully", "school_hated"],
        hooks: ["school", "leadership", "crime"],
        followUps: [
          "下一輪發生了。程度比上一輪深。指揮的人很少自己滿手證據，但院子認得聲音。",
        ],
        consequence: { infamy: 10, heat: 6, trust: -7, opinion: -5, notoriety: 4, path: "crime", pathXp: 1, eventLabel: "指揮霸凌升級" },
      },
    ],
  }),
  inc({
    id: "st_campaign_net",
    kind: "bullying",
    age: [14, 17],
    year: [2005, 2025],
    audience: "teen",
    fact: "這一週，羞辱從走廊延伸到螢幕。群組、留言、偷拍的糗照或配字在放學後仍轉。刪除跟不上轉發。老師說「網路不歸學校管」，直到記者打電話。",
    procedure: "帳號可以是假的。臉是真的。擴散速度比訓導處快。",
    options: [
      {
        stance: "endure",
        text: "關通知、換頭像、少上學，等它自己冷",
        effects: { mood: -3, charm: -2, intelligence: -1 },
        addTags: ["school_bullied"],
        trauma: { tags: ["trauma_shame_core", "trauma_cannot_ask_help"], intensity: 8, domain: "school" },
        hooks: ["school", "hide", "social"],
        followUps: [
          "它沒有自己冷。截圖比人更耐放。缺席被記成曠課。",
        ],
      },
      {
        stance: "join",
        perpetrator: true,
        text: "轉發、配字或建群，讓自己不是被轉的那個",
        effects: { charm: 1, mood: 0 },
        addTags: ["school_bully", "school_hated"],
        hooks: ["school", "social"],
        followUps: [
          "你的帳號或轉發路徑留下痕跡。螢幕前的人變多。被轉的人少來學校。",
        ],
        consequence: { infamy: 7, heat: 4, trust: -5, opinion: -4, eventLabel: "網路群體羞辱" },
        risk: { chance: 0.26, effects: { charm: -5, mood: -2 }, text: "截圖進了訓導處或警察局的信箱。" },
      },
      {
        stance: "report",
        text: "保存證據交給校方、家長或平台，要求下架",
        effects: { intelligence: 1, charm: -1, mood: -1 },
        addTags: ["school_snitch_marked"],
        hooks: ["school", "official", "ask"],
        followUps: [
          "有的連結消失。有的轉到更小的群。舉報者的名字在私下被點。程序比傷害慢。",
        ],
        consequence: { trust: 2, heat: 2, opinion: 0, eventLabel: "舉報網路霸凌" },
      },
    ],
  }),
  inc({
    id: "st_protect_racket",
    kind: "gang",
    age: [14, 17],
    audience: "teen",
    fact: "這一週，有人賣保護。不買的人在體育器材室或騎樓被示範一次。買了的人仍可能被同一批人搶。這是生意。",
    procedure: "價錢用週費或代寫作業計。打手輪班。",
    options: [
      {
        stance: "endure",
        text: "買一次保護，或忍一次示範，把這一週過完",
        effects: { wealth: -2, health: -2, mood: -1 },
        addTags: ["school_bullied"],
        hooks: ["school", "hide"],
        followUps: [
          "保護的有效期短過廣告。示範的瘀青比收據清楚。",
        ],
      },
      {
        stance: "join",
        perpetrator: true,
        text: "加入收保護費或當場動手示範",
        effects: { wealth: 2, health: -2, charm: 1 },
        addTags: ["school_gang", "school_enforcer", "school_hated"],
        hooks: ["school", "crime", "street"],
        followUps: [
          "你經手了錢或手。生意多一筆。被示範的人與他的親戚現在認你。",
        ],
        consequence: { infamy: 9, heat: 6, trust: -6, notoriety: 5, path: "crime", pathXp: 2, eventLabel: "收保護費" },
      },
      {
        stance: "retaliate",
        perpetrator: true,
        text: "帶人反收、砸場或叫校外的人進來翻桌",
        effects: { health: -3, charm: 1, wealth: 1, mood: -2 },
        addTags: ["school_bully", "school_gang", "school_hated", "school_weapon"],
        hooks: ["school", "crime", "street"],
        followUps: [
          "場被砸了。新的帳開始算。鐵器或棍進過場。校方可能報警，也可能只關校門。",
        ],
        consequence: { infamy: 12, heat: 10, trust: -8, opinion: -6, wanted: 4, path: "crime", pathXp: 2, eventLabel: "反收保護費" },
        risk: { chance: 0.32, effects: { health: -9, charm: -3 }, text: "衝突開到馬路。有人進醫務室或派出所。" },
      },
    ],
  }),
  inc({
    id: "st_blade_gate",
    kind: "extreme",
    age: [16, 17],
    audience: "gray",
    fact: "這一週，有人把刀、甩棍或改裝工具帶進校園。不是比喻。安檢如果存在，也有人知道怎麼繞。走廊的話題從成績換成誰帶了什麼。",
    procedure: "展示、威脅、或真的劃下去，是三種不同的帳單。法律不因為這是學校而比較軟。",
    options: [
      {
        stance: "hide",
        text: "避開那個人、改走有人的路、把這件事只放在嘴裡不放在手上",
        effects: { mood: -1, health: 0, intelligence: 1 },
        addTags: ["school_lockdown"],
        hooks: ["school", "hide", "survival"],
        followUps: [
          "你沒有碰那件工具。它仍在校園裡。這一週沒有血，或血發生在別的樓層。",
        ],
      },
      {
        stance: "join",
        perpetrator: true,
        text: "拿過那件工具、幫忙藏、或在威脅時站在持械的人身邊",
        effects: { charm: 1, health: -1, mood: -1 },
        addTags: ["school_weapon", "school_gang", "school_hated"],
        hooks: ["school", "crime", "street"],
        followUps: [
          "你的指紋或證詞現在與一件違禁物有關。同學讓路。訓導處若搜到，不會只記警告。",
        ],
        consequence: { infamy: 10, heat: 10, wanted: 6, trust: -8, path: "crime", pathXp: 2, eventLabel: "校園攜械同場" },
        risk: { chance: 0.28, effects: { health: -6, charm: -4 }, text: "被搜到。警察到校。家長會與案號同一天到。" },
      },
      {
        stance: "weapon",
        perpetrator: true,
        text: "自己帶刀或工具進校，用於威脅、搶或劃",
        effects: { charm: -1, health: -2, mood: -2, wealth: 1 },
        addTags: ["school_weapon", "school_bully", "school_hated", "school_record"],
        hooks: ["school", "crime", "street"],
        followUps: [
          "金屬進過校園。威脅已經構成事實。若劃下去，醫務室與筆錄會同時存在。這不是 Recess。",
        ],
        consequence: { infamy: 14, heat: 14, wanted: 12, trust: -12, opinion: -8, healthRisk: 8, path: "crime", pathXp: 3, eventLabel: "攜械進校" },
        risk: { chance: 0.4, effects: { health: -8, charm: -6 }, text: "傷人或被搜到。退學程序與刑事案件可以同一週啟動。" },
      },
    ],
  }),
];
