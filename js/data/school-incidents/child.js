import { schoolIncident as inc } from "./schema.js";

/**
 * Primary-school peer ecology: packs, extortion, long bullying, yard gangs.
 * Each incident is one fact + three stances (victim / join / escalate).
 */

export const SCHOOL_CHILD_INCIDENTS = [
  inc({
    id: "sc_pack_toilet",
    kind: "bullying",
    age: [7, 12],
    fact: "這一週，廁所隔間外有三到五個人堵住門。有人被按頭、被搜口袋、被用濕拖把擦臉。老師在五十公尺外改作業。沒有攝影機，或攝影機壞了。",
    procedure: "動手的人輪流。被動手的人要交出銅板或承認一句指定的話。圍觀的人算參與，因為人牆就是工具。",
    options: [
      {
        stance: "endure",
        text: "把臉轉開、交出口袋裡能交的，等他們自己走",
        effects: { health: -3, mood: -2, charm: -2, wealth: -1 },
        addTags: ["school_bullied"],
        trauma: { tags: ["trauma_shame_core", "trauma_flinch_body"], intensity: 7, domain: "school" },
        hooks: ["school", "hide", "social"],
        followUps: [
          "門開了。地上有水。沒有人進來問。你回到座位時頭髮還濕。這一週沒有處分單，因為沒有被寫成事件。",
        ],
        risk: { chance: 0.2, effects: { health: -6 }, text: "頭撞到瓷磚。這一週上課會偏頭痛。" },
      },
      {
        stance: "join",
        perpetrator: true,
        text: "跟著堵門、起鬨或補上一腳，換自己不當下一個",
        effects: { charm: 1, mood: 0, health: -1 },
        addTags: ["school_bully", "school_hated"],
        hooks: ["school", "street"],
        followUps: [
          "人牆裡多了一個位置。被按住的人看見你的臉。這一週你沒有被搜口袋。名單上多了一個會記你的人。",
        ],
        consequence: { infamy: 4, heat: 2, trust: -3, opinion: -2, path: "crime", pathXp: 1, eventLabel: "廁所圍毆" },
        risk: { chance: 0.18, effects: { charm: -3, mood: -2 }, text: "值日生路過。你的名字進了口頭報告。" },
      },
      {
        stance: "retaliate",
        perpetrator: true,
        text: "反抓一個更弱的人當擋箭，或當眾還手把衝突擴大",
        effects: { health: -3, charm: -1, mood: -1 },
        addTags: ["school_bully", "school_bullied", "school_hated"],
        hooks: ["school", "street"],
        followUps: [
          "兩邊都出了血。老師把「互毆」寫成同一欄。下手的順序被抹平。院子裡的帳沒有被抹平。",
        ],
        consequence: { infamy: 6, heat: 3, trust: -4, opinion: -3, path: "crime", pathXp: 1, eventLabel: "廁所互毆" },
        risk: { chance: 0.28, effects: { health: -7, charm: -3 }, text: "對方帶來了高年級。這一週你用袖子遮的面積增加。" },
      },
    ],
  }),
  inc({
    id: "sc_lunch_tax",
    kind: "gang",
    age: [7, 12],
    fact: "這一週，有一撮人在午休收「過路費」。便當、銅板、作業被當成稅。不交的人會在放學路上被跟上。這已持續不只一週。",
    procedure: "頭目不需要自己動手。他點頭。打手負責。老師稱這是「孩子之間的事」。",
    options: [
      {
        stance: "endure",
        text: "按時交稅，把剩下的冷飯吃完",
        effects: { wealth: -2, health: -1, mood: -1, charm: -1 },
        addTags: ["school_bullied"],
        hooks: ["school", "hide"],
        followUps: [
          "稅收穩定。你的名字留在「會交」的那一列。饑餓寫進下午的課。沒有人問你為什麼吃得快。",
        ],
      },
      {
        stance: "join",
        perpetrator: true,
        text: "加入收稅：盯梢、擋路或幫忙點名誰還沒交",
        effects: { wealth: 1, charm: 1, mood: 0 },
        addTags: ["school_gang", "school_enforcer"],
        hooks: ["school", "street", "crime"],
        followUps: [
          "你分到一點被沒收的食物或銅板。頭目記住你有用。被點名的人記住你的臉。兩種記憶都會比這一週長。",
        ],
        consequence: { infamy: 5, heat: 3, trust: -4, notoriety: 3, path: "crime", pathXp: 1, eventLabel: "午餐收稅" },
      },
      {
        stance: "lead",
        perpetrator: true,
        text: "另立規矩：你來決定誰交、交多少、誰可以免",
        effects: { wealth: 2, charm: 1, mood: 0, intelligence: 1 },
        addTags: ["school_ringleader", "school_gang", "school_hated"],
        hooks: ["school", "leadership", "crime"],
        followUps: [
          "院子出現第二套稅。衝突從個人變成地盤。老師仍稱孩子之間的事。帳簿不這麼稱。",
        ],
        consequence: { infamy: 8, heat: 5, trust: -6, opinion: -4, notoriety: 5, path: "crime", pathXp: 2, eventLabel: "另立午餐稅" },
        risk: { chance: 0.24, effects: { health: -5, charm: -2 }, text: "舊頭目找來哥哥。地盤戰提前開打。" },
      },
    ],
  }),
  inc({
    id: "sc_long_name",
    kind: "bullying",
    age: [7, 12],
    fact: "這一週，綽號、起哄和孤立已經從「一次」變成班上的固定節目。座位、分組、傳紙條都把同一個人排除。持續時間以月計。",
    procedure: "老師偶爾喊「不要這樣」。喊完繼續上課。節目照播。",
    options: [
      {
        stance: "endure",
        text: "當它是背景音，把作業寫完",
        effects: { mood: -2, charm: -2, intelligence: 1 },
        addTags: ["school_bullied"],
        trauma: { tags: ["trauma_cannot_ask_help", "trauma_shame_core"], intensity: 6, domain: "school" },
        hooks: ["school", "study", "hide"],
        followUps: [
          "節目沒有因為你安靜而停。安靜被讀成同意。成績單不會寫這一欄。",
        ],
      },
      {
        stance: "join",
        perpetrator: true,
        text: "把綽號轉到下一個更好下手的人，讓鏡頭離開自己",
        effects: { charm: 1, mood: 0, intelligence: 0 },
        addTags: ["school_bully", "school_hated"],
        hooks: ["school", "social"],
        followUps: [
          "笑聲換了地址。你暫時不在靶心。新的靶會在以後的分組看見你。",
        ],
        consequence: { infamy: 3, trust: -3, opinion: -2, eventLabel: "轉移綽號" },
      },
      {
        stance: "report",
        text: "告訴老師、家長或值日，要求把這件事寫下來",
        effects: { charm: -1, mood: -1, intelligence: 1 },
        addTags: ["school_snitch_marked", "school_bullied"],
        hooks: ["school", "official", "ask"],
        followUps: [
          "有人被口頭警告。放學後人牆換了地點。告密者標記比處分單更快傳開。",
        ],
        consequence: { trust: 1, opinion: -1, heat: 1, eventLabel: "通報長期霸凌" },
        risk: { chance: 0.3, effects: { health: -4, charm: -3 }, text: "報復改在沒有證人的巷口進行。" },
      },
    ],
  }),
  inc({
    id: "sc_yard_gang",
    kind: "gang",
    age: [8, 12],
    fact: "這一週，高年級或校外的人在放學口收小弟。任務包括看風、傳話、偷車座墊、或把指定的人拖到巷子。拒絕的人會被當「下一個」。",
    procedure: "這不是遊戲。有人已經被打到不敢走校門那條路。",
    options: [
      {
        stance: "hide",
        text: "繞路、晚走、裝病，設法不當他們的人也不當他們的貨",
        effects: { health: -1, mood: -1, intelligence: 1 },
        addTags: ["school_bullied"],
        hooks: ["school", "hide", "survival"],
        followUps: [
          "你活過這一週的校門。路線變長。他們仍可能在下一週換一個出口等。",
        ],
      },
      {
        stance: "join",
        perpetrator: true,
        text: "答應跑腿：放風、傳話或幫忙拖人",
        effects: { charm: 1, health: -1, wealth: 1 },
        addTags: ["school_gang", "school_enforcer"],
        hooks: ["school", "street", "crime"],
        followUps: [
          "你完成一件差事。回扣很少。把柄很多。校門口的人開始用另一種方式叫你的名字。",
        ],
        consequence: { infamy: 6, heat: 4, trust: -5, notoriety: 3, path: "crime", pathXp: 1, eventLabel: "校門口跑腿" },
        risk: { chance: 0.22, effects: { health: -5, charm: -2 }, text: "差事被撞見。值日或路人報了名字。" },
      },
      {
        stance: "plunder",
        perpetrator: true,
        text: "主動提議去搶、去砸、去點名下一個，讓自己顯得有用",
        effects: { wealth: 2, health: -2, charm: 1, mood: -1 },
        addTags: ["school_bully", "school_gang", "school_hated"],
        hooks: ["school", "crime", "street"],
        followUps: [
          "你出的主意被採用。東西換了口袋。被搶的人的家長可能會來，也可能只會打自己的孩子。兩種結果你都進了帳。",
        ],
        consequence: { infamy: 9, heat: 6, trust: -7, opinion: -5, notoriety: 5, path: "crime", pathXp: 2, eventLabel: "校門掠奪" },
      },
    ],
  }),
  inc({
    id: "sc_teacher_scapegoat",
    kind: "power",
    age: [7, 12],
    fact: "這一週，班上有一個固定的出氣對象。老師用這個人維持秩序：罰站、連坐、當眾讀錯卷。同學學會把髒水往同一處倒。",
    procedure: "權力從講台流到座位。動手的人不必是老師。",
    options: [
      {
        stance: "endure",
        text: "若那個人是你：站著。若不是：看著，不接那盆水",
        effects: { mood: -2, charm: -1, intelligence: 1 },
        addTags: ["school_bullied"],
        hooks: ["school", "official", "study"],
        followUps: [
          "秩序維持了。被用的那個人這一週少了半節課。沒有會議記錄這件事。",
        ],
      },
      {
        stance: "join",
        perpetrator: true,
        text: "配合老師或同學，把髒水倒得更準，換自己不被點",
        effects: { charm: 2, mood: 0, intelligence: 0 },
        addTags: ["school_bully", "school_enforcer"],
        hooks: ["school", "official", "social"],
        followUps: [
          "你被點去擦黑板或喊人。講台暫時認你。被倒水的人把你算進同一張表。",
        ],
        consequence: { infamy: 3, trust: -2, opinion: -2, eventLabel: "配合點名出氣" },
      },
      {
        stance: "lead",
        perpetrator: true,
        text: "主動提議新的罰法或新的對象，讓自己成為秩序的翻譯",
        effects: { charm: 2, intelligence: 1, mood: -1 },
        addTags: ["school_ringleader", "school_bully", "school_hated"],
        hooks: ["school", "leadership", "official"],
        followUps: [
          "你的提議被採用了一次。教室更安靜。安靜的成本寫在另一個人身上，也寫在你以後被誰記住。",
        ],
        consequence: { infamy: 5, trust: -4, opinion: -3, eventLabel: "發明新罰" },
      },
    ],
  }),
];
