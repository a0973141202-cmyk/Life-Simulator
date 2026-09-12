import { schoolIncident as inc } from "./schema.js";

/**
 * Rare extreme campus violence: brawls, knives, lockdowns, shootings as facts.
 * Player-as-gunman: 16+ in firearm-common countries only. Never glorified.
 */

export const SCHOOL_EXTREME_INCIDENTS = [
  inc({
    id: "sx_brawl",
    kind: "extreme",
    age: [13, 17],
    audience: "teen",
    weight: 0.7,
    fact: "這一週，兩幫人或兩個班級在操場、天台或校門外打成一團。棍、磚、腰帶。有人倒。有人錄影。警衛或老師到場的速度慢過第一波。",
    procedure: "這是群毆。醫療與處分會來，若這所學校還有這兩套程序。",
    options: [
      {
        stance: "hide",
        text: "後退、關門、把身體從圓心移開",
        effects: { health: 0, mood: -1, intelligence: 1 },
        addTags: ["school_lockdown"],
        hooks: ["school", "hide", "survival"],
        followUps: [
          "你沒有進圈。地上仍有血或掉落的東西。點名會少人。你的選擇是位置，不是評論。",
        ],
      },
      {
        stance: "join",
        perpetrator: true,
        text: "進圈：為自己的人出手，或隨便抓一個打",
        effects: { health: -4, charm: 1, mood: -1 },
        addTags: ["school_bully", "school_gang", "school_hated"],
        hooks: ["school", "street", "crime"],
        followUps: [
          "你進過圈。衣服上的證據比證詞硬。校方與警方若到場，互毆欄不看你是為誰出手。",
        ],
        consequence: { infamy: 10, heat: 8, trust: -6, opinion: -4, wanted: 3, path: "crime", pathXp: 2, eventLabel: "校園群毆" },
        risk: { chance: 0.34, effects: { health: -10, charm: -3 }, text: "骨折或頭傷。這一週在醫務室或派出所過完。" },
      },
      {
        stance: "lead",
        perpetrator: true,
        text: "叫人、帶武器、決定什麼時候衝",
        effects: { health: -3, charm: 2, intelligence: 1, mood: -2 },
        addTags: ["school_ringleader", "school_weapon", "school_hated"],
        hooks: ["school", "leadership", "crime"],
        followUps: [
          "指揮被聽見。傷勢清單會有你的名字在「糾眾」那一側。這不是體育比賽。",
        ],
        consequence: { infamy: 14, heat: 12, wanted: 8, trust: -10, opinion: -7, path: "crime", pathXp: 3, eventLabel: "糾眾群毆" },
      },
    ],
  }),
  inc({
    id: "sx_lockdown",
    kind: "extreme",
    age: [7, 17],
    year: [1970, 2025],
    weight: 0.35,
    fact: "這一週，校園進入封鎖或緊急疏散。警報、反鎖、關掉燈。走廊有跑動與不清楚的聲響。有的年代叫防空，有的年代叫鎖門演習，有的年代不是演習。",
    procedure: "指令互相矛盾。老師的手在發抖或異常平。手機若存在，訊息比官方更快、更假、更真。",
    options: [
      {
        stance: "hide",
        text: "按指令躲、噤聲、不開門，直到有人用規定的暗號開鎖",
        effects: { mood: -2, health: -1, intelligence: 1 },
        addTags: ["school_lockdown"],
        hooks: ["school", "hide", "survival"],
        followUps: [
          "封鎖解除或改成疏散。點名。有的名字晚到。新聞與謠言會在放學後並列。沒有人替你填這一週該怎麼想。",
        ],
      },
      {
        stance: "watch",
        text: "靠近門縫或窗戶看清楚發生什麼，再決定要不要跑",
        effects: { intelligence: 2, health: -2, mood: -1 },
        addTags: ["school_lockdown"],
        hooks: ["school", "survival"],
        followUps: [
          "你看見的可能是演習、是刀、是槍、是警察、或只是人跑。看見會成為證詞，也會成為 overnight 的畫面。選擇已做完。",
        ],
        risk: { chance: 0.2, effects: { health: -8, mood: -3 }, text: "靠近通道的人更容易成為誤傷或目擊。這一週身體先記。" },
      },
      {
        stance: "report",
        text: "在能動的時候通知老師、警衛或外面的成年人",
        effects: { charm: 1, intelligence: 1, mood: -1 },
        addTags: ["school_lockdown"],
        hooks: ["school", "official", "ask"],
        followUps: [
          "通知送出。回應快慢不由你。你沒有因此成為指揮。後續調查可能問你同一句話很多遍。",
        ],
      },
    ],
  }),
  inc({
    id: "sx_shooting_witness",
    kind: "extreme",
    age: [8, 17],
    year: [1980, 2025],
    countriesAny: ["美國", "加拿大"],
    weight: 0.22,
    fact: "這一週，校園內傳出槍聲或確認有人持槍。封鎖。有人受傷或死亡的訊息在未經證實前就開始傳。這不是電影分鏡，是警報與地板。",
    procedure: "警察到場的時間以分鐘計。資訊以秒計。教室的門是一扇普通的門。",
    options: [
      {
        stance: "hide",
        text: "鎖門、遠離窗戶、把身體放進最不像目標的位置",
        effects: { mood: -3, health: -1, intelligence: 1 },
        addTags: ["school_lockdown"],
        hooks: ["school", "hide", "survival"],
        followUps: [
          "這一週以點名、家長接人、輔導室或新聞車結束。缺席的椅子是事實。你的心境欄仍空著，直到你自己選以後的週。",
        ],
        risk: { chance: 0.12, effects: { health: -12, mood: -4 }, text: "通道上的人無法選擇距離。傷害按彈道與位置分配，不按品德。" },
      },
      {
        stance: "watch",
        text: "看、聽、記：幾個聲音、哪個方向、誰還在動",
        effects: { intelligence: 2, mood: -2, health: -2 },
        addTags: ["school_lockdown"],
        hooks: ["school", "survival"],
        followUps: [
          "你成為可能的證人。筆錄與噩夢不是同一套系統寫的。這裡只記錄：你沒有離開觀察位置。",
        ],
      },
      {
        stance: "report",
        text: "在能撥號或能喊的時候把位置與聲音傳出去",
        effects: { charm: 1, intelligence: 1, mood: -2 },
        addTags: ["school_lockdown"],
        hooks: ["school", "official", "ask"],
        followUps: [
          "訊息送出。之後是等待。等待不是英勇，是沒有別的按鈕。",
        ],
      },
    ],
  }),
  inc({
    id: "sx_player_firearm",
    kind: "extreme",
    age: [16, 17],
    year: [1980, 2025],
    countriesAny: ["美國", "加拿大"],
    audience: "gray",
    weight: 0.12,
    tagsAny: ["school_hated", "school_weapon", "school_gang", "trauma_rage_leak", "school_ringleader"],
    fact: "這一週，槍枝在這個國家對十六歲以上的人並非不可想像。有人把槍帶到校園。你可以成為那個把槍帶來的人，或把已經在場的槍拿起來。法律把這寫成重罪。新聞會寫成另一種文體。兩者都不浪漫。",
    procedure: "扣下之後無法倒帶。死傷、通緝、審判或當場被擊斃是同一棵樹的不同枝。",
    options: [
      {
        stance: "hide",
        text: "把槍放下、走開、或根本不碰已經出現的那把",
        effects: { mood: -1, intelligence: 1 },
        addTags: ["school_lockdown"],
        hooks: ["school", "hide"],
        followUps: [
          "你沒有成為扣板機的人。槍仍可能在別人手上。這一週的帳記在能被證明的行為上。",
        ],
      },
      {
        stance: "weapon",
        perpetrator: true,
        text: "攜槍或持槍進入校園，用於威脅、展示或開火",
        effects: { health: -4, charm: -4, mood: -3 },
        addTags: ["school_weapon", "school_hated", "school_expelled", "school_record"],
        hooks: ["school", "crime", "street"],
        followUps: [
          "金屬與校園同時出現在筆錄裡。死傷數字若產生，不會寫成高光。通緝、起訴與可能的死亡是這條路的標準出口。沒有成長敘事。",
        ],
        path: "crime",
        consequence: {
          infamy: 40,
          heat: 40,
          wanted: 45,
          trust: -30,
          opinion: -25,
          healthRisk: 20,
          path: "crime",
          pathXp: 5,
          eventLabel: "校園持槍",
        },
        risk: {
          chance: 0.72,
          effects: { health: -25, charm: -8, mood: -6 },
          text: "開火或被反制。現場結束的方式包括逮捕、擊斃或你自己的重傷。",
        },
        ending: {
          chance: 0.45,
          reason: "校園持槍案件",
          detail: "持槍進入校園之後，故事在逮捕、擊斃或終身監禁的入口處折斷。沒有浪漫的最後一鏡。",
        },
      },
      {
        stance: "report",
        text: "舉報持槍的人、交出自己碰到的槍、呼叫校警或警察",
        effects: { intelligence: 1, charm: -1, mood: -1 },
        addTags: ["school_snitch_marked", "school_lockdown"],
        hooks: ["school", "official", "ask"],
        followUps: [
          "舉報進入紀錄。若及時，傷害可能被截在威脅階段。若不及時，你仍只是證人。報復風險另計。",
        ],
        consequence: { wanted: -2, trust: 2, heat: 4, eventLabel: "舉報校園槍枝" },
      },
    ],
  }),
];
