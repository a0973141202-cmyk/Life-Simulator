/**
 * Adult sandbox options. No moral veto.
 * All entries must set when.age; hard paths start at 18.
 * Content stays abstract: stakes and invoices, not tradecraft.
 */

function a(id, text, effects, followUps, when, extra = {}) {
  return {
    id,
    text,
    effects,
    followUps,
    when,
    weight: extra.weight ?? 1.15,
    sandbox: true,
    domain: extra.domain || extra.path || "adult",
    path: extra.path || null,
    hooks: extra.hooks || ["sandbox"],
    ...extra,
  };
}

const teenGray = [
  a("gray_petty_take", "順走攤上沒人看牢的東西", { wealth: 2, mood: 1, charm: -1 }, [
    "銅板或麵包進了口袋。心跳比貨更重。",
    "你沒被抓住。你開始計算下一次的距離。",
  ], { age: [18, 22] }, {
    path: "crime",
    domain: "crime",
    weight: 1.1,
    hooks: ["crime", "street"],
    consequence: { wanted: 6, heat: 8, trust: -8, infamy: 3, path: "crime", pathXp: 1, eventLabel: "順手牽羊" },
    risk: { chance: 0.28, effects: { wealth: -3, mood: -4, charm: -2 }, text: "被當眾揪住。這一週的臉比東西更貴。" },
  }),
  a("gray_run_word", "替人傳一句不該寫下來的話，換一點現金", { wealth: 2, intelligence: 1, mood: -1 }, [
    "你只是嘴。內容屬於別人，風險開始屬於你。",
    "收錢的時候你看見對方眼睛在量你會不會閉嘴。",
  ], { age: [18, 24] }, {
    path: "crime",
    domain: "crime",
    hooks: ["crime", "street"],
    consequence: { wanted: 4, heat: 6, trust: -5, path: "crime", pathXp: 1 },
    risk: { chance: 0.18, effects: { health: -4, mood: -3 }, text: "話傳到半路被截。你挨了一頓，作為封口費的利息。" },
  }),
];

const lawfulPolitics = [
  a("pol_join_machine", "走進本地的派系、工會或黨部，把名字寫進名冊", { charm: 2, intelligence: 1, mood: -1 }, [
    "他們教你舉手的時機。你開始用「我們」代替「我」。",
    "一杯茶的時間裡，你被量過出身、口才與能不能被犧牲。",
  ], { age: [18, 70] }, {
    path: "politics",
    domain: "politics",
    weight: 1.3,
    hooks: ["politics", "official", "social"],
    consequence: { politicalCapital: 6, opinion: 3, trust: 2, heat: 2, path: "politics", pathXp: 1 },
    addTags: ["acquired_party_machine"],
  }),
  a("pol_speech", "在市集、禮堂或電台把一套主張講完", { charm: 3, intelligence: 1, mood: 1 }, [
    "有人鼓掌。有人把你的句子記成日後的罪證。",
    "輿論像天氣。你試著在這一週裡變成風向。",
  ], { age: [20, 75], stats: { charm: [40, 100] } }, {
    path: "politics",
    domain: "politics",
    hooks: ["politics", "social", "leadership"],
    consequence: { politicalCapital: 5, opinion: 6, notoriety: 4, heat: 3, path: "politics", pathXp: 1 },
    attempt: {
      kind: "public_speech",
      path: "politics",
      baseChance: 0.42,
      backlashScale: 0.6,
      onSuccess: { opinion: 8, politicalCapital: 4 },
      onFailure: { opinion: -8, charm: 0, trust: -4 },
    },
  }),
  a("pol_run_local", "投入一場地方職位或代表權的爭奪", { charm: 2, wealth: -3, intelligence: 1 }, [
    "票、人情與謠言同時開工。你把睡眠抵押出去。",
    "有人說你代表他們。有人說你只代表你自己。",
  ], { age: [25, 70], year: [1920, 2025] }, {
    path: "politics",
    domain: "politics",
    weight: 1.4,
    hooks: ["politics", "leadership"],
    consequence: { politicalCapital: 8, wealth: 0, heat: 6, path: "politics", pathXp: 2 },
    attempt: {
      kind: "local_office",
      path: "politics",
      baseChance: 0.28,
      backlashEvenIfSuccess: true,
      backlashScale: 0.9,
      onSuccess: { politicalCapital: 18, opinion: 10, notoriety: 8, trust: 4 },
      onFailure: { politicalCapital: -8, opinion: -10, wealth: -2, trust: -6 },
    },
  }),
  a("pol_purge_rival", "用檔案、謠言或紀律程序把一個對手拿掉", { intelligence: 2, charm: -2, mood: -1 }, [
    "合法的刀也是刀。你學會在會議記錄裡殺人。",
    "派系因此更安靜，也更空。",
  ], { age: [26, 72], tagsAny: ["path_politics", "socio_official_network", "acquired_party_machine"] }, {
    path: "politics",
    domain: "politics",
    hooks: ["politics", "official"],
    consequence: { politicalCapital: 7, trust: -12, infamy: 8, opinion: -6, heat: 8, path: "politics", pathXp: 1 },
    risk: { chance: 0.22, effects: { charm: -4, mood: -3 }, text: "對手先下手。你的檔案被人傳閱。" },
  }),
];

const commerce = [
  a("biz_expand_shop", "把鋪面、攤位或工廠的產能再往外推一檔", { wealth: 3, health: -1, intelligence: 1 }, [
    "帳本變厚。夜裡反覆醒來，睡不夠。",
    "你開始用「規模」思考人。",
  ], { age: [18, 70] }, {
    path: "commerce",
    domain: "commerce_power",
    hooks: ["trade", "commerce"],
    consequence: { notoriety: 2, politicalCapital: 1, path: "commerce", pathXp: 1, trust: 1 },
  }),
  a("biz_monopoly", "用壓價、圍堵或獨家契約把一條供應鏈握在手裡", { wealth: 5, charm: -2, mood: -1 }, [
    "市場變安靜。安靜通常不是因為公平。",
    "有人叫你遠見。有人叫你土匪。",
  ], { age: [24, 70], stats: { wealth: [35, 100] } }, {
    path: "commerce",
    domain: "commerce_power",
    weight: 1.3,
    hooks: ["trade", "commerce"],
    consequence: { opinion: -8, trust: -6, infamy: 5, notoriety: 8, path: "commerce", pathXp: 2 },
    risk: { chance: 0.2, effects: { wealth: -6, mood: -2 }, text: "抵制與檢查同時上門。壟斷會反咬。" },
  }),
  a("biz_buy_office", "把金錢變成許可、豁免或一份蓋章", { wealth: -4, intelligence: 1, charm: 1 }, [
    "這在某些年代叫捐輸，在另一些年代叫行賄。現場不會替你選詞。",
    "章蓋下去時，你同時買到方便與把柄。",
  ], { age: [22, 75], stats: { wealth: [40, 100] } }, {
    path: "commerce",
    domain: "commerce_power",
    hooks: ["trade", "official", "politics"],
    consequence: { politicalCapital: 6, wanted: 5, heat: 6, trust: -7, path: "commerce", pathXp: 1 },
    addTags: ["acquired_graft"],
  }),
  a("biz_tycoon_leap", "把生意做成跨城或跨國的勢", { wealth: 6, health: -2, charm: 1 }, [
    "你的名字開始在別的港口被念出來。",
    "帝國的形狀出現了。稅務與仇家也是。",
  ], { age: [30, 68], tagsAny: ["path_tycoon", "socio_merchant_capital"], stats: { wealth: [55, 100] } }, {
    path: "commerce",
    domain: "commerce_power",
    weight: 1.5,
    hooks: ["commerce", "trade", "leadership"],
    consequence: { notoriety: 12, opinion: -4, politicalCapital: 6, path: "commerce", pathXp: 2 },
    attempt: {
      kind: "tycoon_leap",
      path: "commerce",
      baseChance: 0.3,
      backlashScale: 0.8,
      onSuccess: { notoriety: 10 },
      onFailure: { wealth: -8, heat: 10, trust: -8 },
    },
  }),
];

const crime = [
  a("crime_join_ring", "加入一個已經在運轉的地下圈子", { wealth: 3, mood: 1, health: -1 }, [
    "他們不問你相不相信正義。他們問你能不能準時。",
    "你得到一套暗號、一條退路，以及一張以後很難撕掉的名片。",
  ], { age: [18, 60] }, {
    path: "crime",
    domain: "crime",
    weight: 1.35,
    hooks: ["crime", "street", "underground"],
    consequence: { wanted: 10, heat: 12, trust: -12, infamy: 6, path: "crime", pathXp: 2 },
    addTags: ["acquired_underworld"],
  }),
  a("crime_smuggle", "接手一條不走報關的貨道", { wealth: 4, intelligence: 1, health: -1 }, [
    "箱子的重量與文件上的重量對不上。你選擇相信箱子。",
    "夜路比公路貴，也比公路自由。",
  ], { age: [18, 65] }, {
    path: "crime",
    domain: "crime",
    hooks: ["crime", "trade", "port"],
    consequence: { wanted: 12, heat: 14, trust: -10, infamy: 5, healthRisk: 3, path: "crime", pathXp: 1 },
    risk: { chance: 0.24, effects: { wealth: -5, health: -3, mood: -3 }, text: "抽查比你的時機更準。貨沒了，名字留下了。" },
  }),
  a("crime_protection", "向街坊或鋪面收取「平安費」", { wealth: 3, charm: -2, mood: -1 }, [
    "你把恐懼做成訂閱制。有人付，有人記仇。",
    "秩序出現了，只是不再姓法。",
  ], { age: [20, 62], tagsAny: ["path_crime", "acquired_underworld", "socio_extreme_poverty"] }, {
    path: "crime",
    domain: "crime",
    hooks: ["crime", "street"],
    consequence: { wanted: 8, heat: 10, trust: -16, infamy: 8, opinion: -8, path: "crime", pathXp: 1 },
  }),
  a("crime_hit_rival", "除掉一個擋路的人——方法留給黑暗，帳單留給你", { wealth: 2, mood: -3, health: -2 }, [
    "世界少了一個障礙。你多了一種再也洗不掉的氣味。",
    "同夥敬你。普通人繞路。",
  ], { age: [21, 58], tagsAny: ["path_crime", "acquired_underworld", "acquired_infamy"] }, {
    path: "crime",
    domain: "crime",
    weight: 1.2,
    hooks: ["crime", "underground"],
    consequence: { wanted: 22, heat: 24, trust: -20, infamy: 14, healthRisk: 8, opinion: -12, path: "crime", pathXp: 2 },
    risk: { chance: 0.3, effects: { health: -12, mood: -6 }, text: "反殺比計畫更快。你活下來，但這一週幾乎沒有活的形狀。" },
  }),
  a("crime_empire", "把零散的地下生意收成一張網", { wealth: 6, intelligence: 2, charm: 1, health: -2 }, [
    "你開始批示，而不是跑腿。帝國的第一個敵人永遠是自己人。",
    "警察、政客與叛徒同時成為人事問題。",
  ], { age: [28, 62], tagsAny: ["path_crime"], stats: { wealth: [40, 100] } }, {
    path: "crime",
    domain: "crime",
    weight: 1.5,
    hooks: ["crime", "leadership", "underground"],
    consequence: { wanted: 16, heat: 18, notoriety: 14, infamy: 10, trust: -10, path: "crime", pathXp: 2 },
    attempt: {
      kind: "crime_empire",
      path: "crime",
      baseChance: 0.24,
      backlashEvenIfSuccess: true,
      backlashScale: 1.1,
      onSuccess: { notoriety: 12, wealth: 0 },
      onFailure: { wanted: 18, heat: 20, trust: -12 },
    },
  }),
];

const narcotics = [
  a("narco_enter", "把成癮物當成一條可以擴張的貨流，而不是道德辯論", { wealth: 5, mood: -1, health: -1 }, [
    "需求穩定得可怕。穩定會讓人誤以為這是生意而不是戰爭。",
    "你學會不看使用者的臉，只看週轉。",
  ], { age: [18, 60] }, {
    path: "narcotics",
    domain: "narcotics",
    weight: 1.25,
    hooks: ["crime", "trade", "port"],
    consequence: { wanted: 16, heat: 16, trust: -14, infamy: 8, healthRisk: 10, opinion: -10, path: "narcotics", pathXp: 2 },
    addTags: ["acquired_narco_trade"],
  }),
  a("narco_ports", "打通港口、邊境或倉儲的暗帳", { wealth: 6, intelligence: 2, health: -2 }, [
    "地圖上的合法線與你的線重疊。重疊處就是稅。",
    "每一次放行都在加高未來被抄的樓層。",
  ], { age: [22, 58], tagsAny: ["path_narcotics", "acquired_narco_trade", "path_crime"] }, {
    path: "narcotics",
    domain: "narcotics",
    hooks: ["crime", "port", "trade"],
    consequence: { wanted: 14, heat: 18, politicalCapital: 3, healthRisk: 6, path: "narcotics", pathXp: 1 },
    risk: { chance: 0.26, effects: { wealth: -8, health: -5 }, text: "一次臨檢把暗帳翻成證據。你用錢和跑路同時止血。" },
  }),
  a("narco_war", "用恐懼維持貨流的獨占", { wealth: 4, mood: -2, charm: -2, health: -2 }, [
    "市場不接受兩個皇帝。你決定當那個還站著的。",
    "街上的安靜是你買來的。發票在通緝欄。",
  ], { age: [24, 55], tagsAny: ["path_narcotics"] }, {
    path: "narcotics",
    domain: "narcotics",
    weight: 1.4,
    hooks: ["crime", "militant", "underground"],
    consequence: { wanted: 20, heat: 22, infamy: 14, trust: -18, healthRisk: 12, opinion: -14, path: "narcotics", pathXp: 2 },
    attempt: {
      kind: "cartel_war",
      path: "narcotics",
      baseChance: 0.22,
      backlashEvenIfSuccess: true,
      backlashScale: 1.3,
      onSuccess: { notoriety: 10, infamy: 8 },
      onFailure: { wanted: 16, heat: 20, healthRisk: 10 },
    },
  }),
];

const militant = [
  a("mil_ideology", "把私怨與理論焊在一起，決定對體制開戰", { intelligence: 2, mood: 1, charm: 1, health: -1 }, [
    "你開始用歷史的口吻談論鄰居。這很危險，也很誘人。",
    "第一批同路人出現時，退路同時變窄。",
  ], { age: [18, 55] }, {
    path: "militant",
    domain: "militant",
    weight: 1.2,
    hooks: ["militant", "politics", "war"],
    consequence: { wanted: 10, heat: 12, trust: -10, infamy: 6, politicalCapital: 3, opinion: -6, path: "militant", pathXp: 2 },
    addTags: ["acquired_armed_politics"],
  }),
  a("mil_cell", "把人編成一個只在暗處存在的小組", { intelligence: 1, wealth: -2, mood: -1 }, [
    "紀律比信仰更早到位。有人因此留下，有人因此告密。",
    "你擁有了行動力，也擁有了被一網打盡的幾何形狀。",
  ], { age: [18, 50], tagsAny: ["path_militant", "acquired_armed_politics", "socio_war_displacement"] }, {
    path: "militant",
    domain: "militant",
    hooks: ["militant", "underground"],
    consequence: { wanted: 14, heat: 16, trust: -12, healthRisk: 8, path: "militant", pathXp: 1 },
  }),
  a("mil_strike", "對一個象徵性的權威目標發動衝擊（過程不寫，後果必寫）", { mood: 2, health: -3, charm: -1 }, [
    "消息比煙更快。有人叫你英雄，有人叫你屠夫，國家叫你案件。",
    "你把暴力寫進政治。政治用通緝與葬禮回信。",
  ], { age: [18, 48], tagsAny: ["path_militant", "acquired_armed_politics"] }, {
    path: "militant",
    domain: "militant",
    weight: 1.45,
    hooks: ["militant", "war", "underground"],
    consequence: { wanted: 28, heat: 30, trust: -24, infamy: 18, opinion: -20, healthRisk: 14, path: "militant", pathXp: 2 },
    attempt: {
      kind: "militant_strike",
      path: "militant",
      baseChance: 0.16,
      backlashEvenIfSuccess: true,
      backlashScale: 1.6,
      severity: 1.4,
      onSuccess: { notoriety: 16, politicalCapital: 6, infamy: 12 },
      onFailure: { wanted: 22, heat: 24, healthRisk: 10 },
    },
  }),
];

const historical = [
  a("hist_local_strongman", "試圖成為本地事實上的掌權者", { charm: 2, intelligence: 2, health: -1 }, [
    "法律還在，只是開始繞著你走。",
    "你把警察局、糧倉與謠言收進同一張桌子。",
  ], { age: [28, 70] }, {
    path: "historical",
    domain: "historical",
    weight: 1.4,
    hooks: ["historical", "politics", "leadership"],
    consequence: { politicalCapital: 10, heat: 10, wanted: 8, opinion: -4, path: "historical", pathXp: 1 },
    attempt: {
      kind: "seize_power",
      path: "historical",
      baseChance: 0.1,
      backlashEvenIfSuccess: true,
      backlashScale: 1.5,
      severity: 1.3,
      onSuccess: { politicalCapital: 28, notoriety: 18, infamy: 12, trust: -8, wanted: 12 },
      onFailure: { politicalCapital: -16, wanted: 24, heat: 22, trust: -18, opinion: -14 },
    },
  }),
  a("hist_coup", "策劃一次對現政權的突然改寫", { intelligence: 3, wealth: -3, mood: -2 }, [
    "時間表以小時計。失敗以世代計。",
    "你把命運押在少數幾個人會不會在同一夜醒來。",
  ], { age: [30, 68], year: [1920, 2025], tagsAny: ["path_politics", "path_militant", "path_historical", "socio_official_network", "class_military"] }, {
    path: "historical",
    domain: "historical",
    weight: 1.6,
    hooks: ["historical", "politics", "militant"],
    consequence: { heat: 20, wanted: 16, path: "historical", pathXp: 2 },
    attempt: {
      kind: "coup",
      path: "historical",
      baseChance: 0.07,
      backlashEvenIfSuccess: true,
      backlashScale: 1.8,
      severity: 1.6,
      onSuccess: { politicalCapital: 40, notoriety: 24, infamy: 16, opinion: -10, wanted: 20 },
      onFailure: { politicalCapital: -24, wanted: 36, heat: 32, trust: -28, healthRisk: 12 },
    },
  }),
  a("hist_collaborate", "與占領者或強權合作，換取位置", { wealth: 3, charm: -1, intelligence: 1 }, [
    "有人活下來。有人把你的名字寫進以後的審判。遊戲兩種都算。",
    "你得到辦公室。辦公室的窗對著將來的廣場。",
  ], { age: [22, 70], year: [1931, 1955] }, {
    path: "historical",
    domain: "historical",
    hooks: ["historical", "politics", "war"],
    consequence: { politicalCapital: 10, opinion: -16, trust: -14, infamy: 10, wanted: 6, path: "historical", pathXp: 1 },
  }),
  a("hist_turn_era", "公開推動一次足以改寫本地時代走向的決斷", { charm: 3, intelligence: 2, mood: 1, health: -2 }, [
    "你站到比個人更大的句子前面。成功會變成教科書，失敗會變成註腳。",
    "輿論、年份與你身上的標籤正在現場投票。",
  ], { age: [32, 72], tagsAny: ["path_politics", "path_historical", "path_tycoon"] }, {
    path: "historical",
    domain: "historical",
    weight: 1.7,
    hooks: ["historical", "politics", "leadership"],
    consequence: { heat: 14, notoriety: 10, path: "historical", pathXp: 2 },
    attempt: {
      kind: "historical_turn",
      path: "historical",
      baseChance: 0.09,
      backlashEvenIfSuccess: true,
      backlashScale: 1.7,
      severity: 1.5,
      onSuccess: { politicalCapital: 32, opinion: 12, notoriety: 20, wanted: 10, infamy: 8 },
      onFailure: { politicalCapital: -20, opinion: -18, wanted: 18, heat: 20, trust: -16 },
    },
  }),
];

export const SANDBOX_ACTION_POOL = [
  ...teenGray,
  ...lawfulPolitics,
  ...commerce,
  ...crime,
  ...narcotics,
  ...militant,
  ...historical,
];
