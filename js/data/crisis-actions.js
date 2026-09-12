/**
 * Crisis / opportunity / ruin options grown from the ledger.
 * These are not moral lectures; they are invoices that came due.
 */

function a(id, text, effects, followUps, when, extra = {}) {
  return {
    id,
    text,
    effects,
    followUps,
    when,
    weight: extra.weight ?? 5,
    sandbox: true,
    crisis: true,
    domain: extra.domain || extra.path || "crime",
    path: extra.path || null,
    hooks: extra.hooks || ["crisis"],
    ...extra,
  };
}

export const CRISIS_ACTION_POOL = [
  a("crisis_lie_low", "這一週只求消失：換住處、少說話、不點名", { mood: -1, wealth: -2, health: -1 }, [
    "熱度是火。你選擇不提供氧氣。",
    "朋友問你去哪。你讓他們習慣得不到答案。",
  ], { age: [18, 90], wanted: [28, 100] }, {
    path: "crime",
    domain: "crime",
    hooks: ["hide", "crisis", "survival"],
    consequence: { heat: -18, wanted: -3, trust: -2, notoriety: -1, eventLabel: "藏匿" },
  }),
  a("crisis_bribe_net", "用錢去買一份「暫時沒看見」", { wealth: -5, intelligence: 1 }, [
    "收據不會開。可是壓力計的指針動了一下。",
    "你在合法與非法之間又加了一層油。油會燃。",
  ], { age: [18, 80], wanted: [22, 100], stats: { wealth: [25, 100] } }, {
    path: "crime",
    domain: "crime",
    hooks: ["crisis", "official"],
    consequence: { heat: -12, wanted: -6, politicalCapital: 2, trust: -4, eventLabel: "買通" },
    risk: { chance: 0.2, effects: { wealth: -3, mood: -3 }, text: "錢收下了，把柄也收下了。風聲反而更尖。" },
  }),
  a("crisis_burn_books", "銷毀名冊、帳本與可能指向你的紙", { intelligence: 1, wealth: -1, mood: -2 }, [
    "火光很短。空白很長。",
    "你少了一些證據，也少了一些自己是誰的證據。",
  ], { age: [18, 85], heat: [30, 100] }, {
    path: "crime",
    domain: "crime",
    hooks: ["hide", "crisis"],
    consequence: { heat: -10, wanted: -2, politicalCapital: -4, eventLabel: "毀證" },
  }),
  a("crisis_flip", "把同夥的名字賣給對面，換自己的呼吸", { wealth: 2, charm: -3, mood: -3 }, [
    "信任是一次性容器。你把它摔碎，換一張通行證。",
    "你活過這一週。有人因此不會再活過很多週。",
  ], { age: [18, 70], wanted: [40, 100], tagsAny: ["path_crime", "path_narcotics", "path_militant"] }, {
    path: "crime",
    domain: "crime",
    hooks: ["crisis", "official"],
    consequence: { wanted: -14, heat: -10, trust: -22, infamy: 8, politicalCapital: 4, opinion: -6, eventLabel: "反水" },
    addTags: ["acquired_snitch"],
  }),
  a("crisis_flee_city", "連夜離開這座城，把地圖當成傷口", { wealth: -3, mood: -2, health: -1, charm: -1 }, [
    "行李很少。通緝不會比行李更輕。",
    "新地方的人還不認識你。這是最後一次免費的匿名。",
  ], { age: [18, 80], wanted: [45, 100] }, {
    path: "crime",
    domain: "crime",
    hooks: ["hide", "crisis", "travel"],
    consequence: { heat: -22, wanted: -4, trust: -4, notoriety: -2, eventLabel: "流亡" },
    addTags: ["acquired_fugitive"],
  }),
  a("crisis_surrender", "走進機關，把故事交給他們改寫", { mood: -4, charm: -2, health: -1 }, [
    "你用確定的懲罰，交換不確定的處決。",
    "有人說這是懦夫。有人說這是還活著的算法。",
  ], { age: [18, 90], wanted: [55, 100] }, {
    path: "lawful",
    domain: "crime",
    weight: 4,
    hooks: ["crisis", "official"],
    consequence: { wanted: -30, heat: -25, trust: 4, politicalCapital: -8, infamy: 4, eventLabel: "投案" },
    risk: { chance: 0.35, effects: { mood: -6, health: -4 }, text: "他們不需要你活著作證。這一週變成漫長的等待。" },
  }),
  a("crisis_double_down", "不躲：把壓力當成擴張的理由", { wealth: 3, mood: 1, health: -2 }, [
    "你讓追捕者看見你還在加碼。這是威懾，也是遺言預演。",
    "熱度上升時，有人會更怕你，有人會更快開槍。",
  ], { age: [18, 65], wanted: [36, 100], tagsAny: ["path_crime", "path_narcotics", "path_militant"] }, {
    path: "crime",
    domain: "crime",
    hooks: ["crisis", "crime", "leadership"],
    consequence: { wanted: 12, heat: 16, infamy: 8, trust: -8, notoriety: 6, pathXp: 1, eventLabel: "加碼" },
  }),
  a("crisis_pr_wash", "用捐贈、演說或媒體把輿論往回拉", { wealth: -3, charm: 3, intelligence: 1 }, [
    "清洗形象比清洗手更貴。有時也更有效。",
    "你把惡名暫時翻譯成爭議性。",
  ], { age: [20, 80], opinion: [0, 45], stats: { wealth: [30, 100] } }, {
    path: "politics",
    domain: "politics",
    hooks: ["crisis", "politics", "social"],
    consequence: { opinion: 10, trust: 6, heat: -4, notoriety: 3, politicalCapital: 3, eventLabel: "洗白" },
  }),
  a("crisis_purge_inside", "先清自己人，再談外面的敵人", { intelligence: 2, mood: -2, charm: -2 }, [
    "內鬼理論永遠有市場。你付錢給這個市場。",
    "組織更純，也更小。",
  ], { age: [22, 68], heat: [40, 100], tagsAny: ["path_crime", "path_militant", "path_narcotics", "path_historical"] }, {
    path: "crime",
    domain: "crime",
    hooks: ["crisis", "underground"],
    consequence: { heat: -8, trust: -10, infamy: 6, wanted: 4, eventLabel: "內清" },
  }),
  a("crisis_state_raid", "風聲已變成破門：這一週只能選怎麼被歷史記錄", { health: -3, mood: -3, wealth: -2 }, [
    "靴子比理論更早到達。",
    "你還能決定的，只剩合作、抵抗或消失。",
  ], { age: [18, 90], wanted: [70, 100], heat: [50, 100] }, {
    path: "crime",
    domain: "crime",
    weight: 7,
    hooks: ["crisis", "official", "ruin"],
    consequence: { wanted: 8, heat: 10, healthRisk: 8, eventLabel: "抄查" },
    risk: { chance: 0.4, effects: { health: -10, mood: -6, wealth: -8 }, text: "抵抗讓屋子變成現場。你被拖走時還在算還有誰知道密碼。" },
  }),
  a("opp_vacuum", "對手剛倒下，真空變成你的領土", { wealth: 4, charm: 1, intelligence: 1 }, [
    "危機對別人是葬禮，對你是開業。",
    "你搬進去的速度，決定你會不會成為下一個葬禮。",
  ], { age: [20, 65], tagsAny: ["path_crime", "path_narcotics", "path_tycoon"], heat: [0, 55] }, {
    path: "crime",
    domain: "crime",
    weight: 4.5,
    hooks: ["crime", "opportunity"],
    consequence: { wanted: 6, heat: 8, notoriety: 8, infamy: 4, pathXp: 1, eventLabel: "填真空" },
  }),
  a("opp_wartime_seat", "戰爭或動亂把位置空出來，你伸手去接", { charm: 2, intelligence: 2, mood: -1 }, [
    "時代的漏洞就是職位。你不需要喜歡這個時代。",
    "接得太快會被當成投機，接得太慢會被當成屍體。",
  ], { age: [24, 70], year: [1931, 1953], tagsAny: ["path_politics", "path_historical", "class_military", "class_official"] }, {
    path: "historical",
    domain: "historical",
    weight: 4.8,
    hooks: ["historical", "politics", "opportunity"],
    consequence: { politicalCapital: 12, heat: 8, opinion: -4, path: "historical", pathXp: 1, eventLabel: "亂世座位" },
    attempt: {
      kind: "seize_power",
      path: "historical",
      baseChance: 0.18,
      backlashEvenIfSuccess: true,
      backlashScale: 1.2,
      onSuccess: { politicalCapital: 16, notoriety: 10 },
      onFailure: { wanted: 14, trust: -12, heat: 12 },
    },
  }),
  a("ruin_last_broadcast", "在終局來臨前，把一份宣言或自白丟進世界", { charm: 2, mood: 1, intelligence: 1 }, [
    "你可能不會看到回音。回音會看到你。",
    "這是政治，也是遺囑。",
  ], { age: [18, 90], wanted: [80, 100] }, {
    path: "historical",
    domain: "historical",
    weight: 3.5,
    hooks: ["crisis", "leadership"],
    consequence: { opinion: 6, notoriety: 10, heat: 8, infamy: 4, eventLabel: "最後宣言" },
  }),
];
