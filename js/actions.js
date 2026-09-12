/**
 * Contextual action pool.
 * Each entry is an option template. The generator picks 3 matching ones per week.
 * Adult sandbox / crisis options live in data/sandbox-actions.js and data/crisis-actions.js.
 *
 * when:
 *   age: [min, max]
 *   year: [min, max]
 *   stages: string[]
 *   classes: string[]
 *   regions: string[]
 *   tagsAny / tagsAll / tagsNone
 *   tagPrefixesAny / tagPrefixesNone
 *   stats: { key: [min, max] }
 *   wanted / heat / trust / opinion: ledger ranges (used by sandbox/crisis pools)
 *
 * Extra (optional, inferred if omitted):
 *   direction, riskBand, situation, tagDriven
 */
function a(id, text, effects, followUps, when = {}, extra = {}) {
  return { id, text, effects, followUps, when, weight: extra.weight ?? 1, ...extra };
}

const infant = [
  a("infant_care", "讓家人把你抱緊一些，多喂一口", { health: 2, mood: 2, wealth: -1 }, [
    "奶水或米湯比往日稠一點。你含著溫度睡著了。",
    "家裡把僅剩的糖精溶進水裡。你暫時不哭了。",
  ], { age: [0, 2] }, { weight: 3 }),
  a("infant_folk", "家人聽信鄰里偏方，給你灌一勺", { health: -1, mood: -1 }, [
    "苦味讓你大哭。有人說這是「排毒」，有人只是心虛。",
    "你發了一晚低燒，隔天又奇蹟似地好了。",
  ], { age: [0, 2] }, {
    risk: { chance: 0.12, effects: { health: -8 }, text: "偏方太猛，你上吐下瀉，差點脫水。" },
  }),
  a("infant_relative", "被寄放到親戚家過幾天", { charm: 1, mood: -1, intelligence: 1 }, [
    "陌生的屋樑讓你認床。你學會了用哭來談判。",
    "表親把你當活娃娃傳著抱，你因此認得更多臉。",
  ], { age: [0, 2] }),
  a("infant_outdoor", "被抱到門檻外曬太陽", { health: 1, mood: 1 }, [
    "光讓你眯眼。街上的氣味第一次寫進記憶。",
    "有人經過摸了摸你的臉，說這孩子「命硬」。",
  ], { age: [0, 2] }),
  a("infant_illness", "發熱未退，家人整夜輪守", { health: 1, mood: -2, wealth: -1 }, [
    "冷毛巾從額上滑到枕頭。你在昏沉裡聽見壓低的禱告或咒罵。",
    "醫生或赤腳郎中收走一筆錢。你活過了這一週。",
  ], { age: [0, 3], stats: { health: [0, 55] } }, { weight: 2 }),
];

const toddler = [
  a("toddler_play", "在巷口或田埂跟別的孩子瘋跑", { health: 1, charm: 1, mood: 2, intelligence: -1 }, [
    "你摔破膝蓋，卻交到一個會分享糖果紙的朋友。",
    "大人喊吃飯時，你假裝沒聽見，多玩了十分鐘。",
  ], { age: [3, 4] }, { weight: 3 }),
  a("toddler_listen", "蹲在大人腳邊偷聽家務與世情", { intelligence: 2, mood: 1 }, [
    "你還不懂「行情」和「風聲」，但已經會看臉色。",
    "有一句話你記住了，很多年後才知道那是警告。",
  ], { age: [3, 6] }),
  a("toddler_help", "學著掃地、看弟妹或趕雞", { health: 1, wealth: 1, mood: -1 }, [
    "你把灰掃進自己鞋裡。家人卻第一次誇你「懂事」。",
    "勞動把遊戲時間吃掉了。你開始知道家裡很缺人手。",
  ], { age: [3, 6], classes: ["peasant", "artisan", "worker", "immigrant"] }, {
    childTheme: "confinement",
    hooks: ["family", "survival"],
    lane: "family",
  }),
  a("toddler_story", "纏著家裡識字的人講故事", { intelligence: 2, charm: 1, mood: 1 }, [
    "故事裡的龍、火車或英雄暫時蓋過了饑餓。",
    "你把聽來的句子亂接，逗得全場大笑。",
  ], { age: [3, 6] }),
  a("toddler_scare", "被厲聲管教，學會把話吞回去", { charm: -1, mood: -2, intelligence: 1 }, [
    "你記住了哪些話題不能在飯桌上出現。",
    "晚上你把哭聲悶進被子，第一次有了秘密。",
  ], { age: [3, 8] }, {
    childTheme: "abuse",
    hooks: ["family", "hide"],
    lane: "survival",
  }),
];

const child = [
  a("child_study", "把能找到的字紙都讀一遍", { intelligence: 3, mood: -1, health: -1 }, [
    "你把生字抄在廢報紙邊上，寫到墨乾。",
    "有人笑你「讀書能當飯吃嗎」，你沒回答。",
  ], { age: [7, 12] }, { weight: 3, addTags: ["勤學"] }),
  a("child_labor", "幫家裡多做一份零工或農活", { wealth: 2, health: -2, intelligence: -1, mood: -1 }, [
    "手上起了泡。傍晚你把銅板放進家裡的鐵盒。",
    "你比同齡人更早知道力氣可以換成糧。",
  ], { age: [13, 17], classes: ["peasant", "worker", "artisan", "immigrant"] }, { weight: 2 }),
  a("child_bully", "跟孩子王硬碰硬，或把更弱的人拖進局裡", { charm: 1, health: -2, mood: 0 }, [
    "鼻青臉腫。老師或族長隨後都來問罪。院子裡的帳沒有因此結清。",
    "有人退了。有人記住你的手。這一週沒有人把它寫成友情。",
  ], { age: [7, 14] }, {
    schoolPeerHarm: true,
    schoolNonsexual: true,
    perpetrator: true,
    addTags: ["school_bully", "school_hated"],
    consequence: { infamy: 4, heat: 2, trust: -3, path: "crime", pathXp: 1, eventLabel: "孩子王衝突" },
    risk: { chance: 0.18, effects: { health: -10, mood: -3 }, text: "打輸了，還被拖去示眾。下一週的人可能帶幫手。" },
  }),
  a("child_observe", "溜去戲園、電影院或廟會看熱鬧", { charm: 2, mood: 2, wealth: -1, intelligence: 1 }, [
    "鑼鼓和燈光在你體內開了一扇窗。",
    "回家路上你把看到的情節講給弟妹聽，自己當起說書人。",
  ], { age: [6, 13] }),
  a("child_steal", "忍不住偷拿攤上的零食或文具", { wealth: 1, mood: 1, charm: -2 }, [
    "心跳比糖更甜。你第一次知道「不被發現」也是一種才能。",
    "事後你把東西藏在床板下，整夜沒睡實。",
  ], { age: [6, 13], stats: { wealth: [0, 40] } }, {
    risk: { chance: 0.2, effects: { charm: -4, mood: -4 }, text: "被當街抓住。恥辱比巴掌更久。" },
    addTags: ["機靈"],
  }),
  a("child_school", "按時上課，把課堂問答當作戰場", { intelligence: 2, charm: 1, mood: 1 }, [
    "先生點你的名。你站起來時腿在抖，答案卻是對的。",
    "你開始在意名次，也開始忌妒坐第一排的人。",
  ], { age: [7, 17], year: [1920, 2025] }, { weight: 2, lane: "school" }),
  a("child_nature", "往河邊、山坡或空地跑整天", { health: 2, mood: 2, intelligence: 1 }, [
    "你認得幾種能吃的野草，也認得哪段岸會崩。",
    "太陽把皮膚曬黑。家裡說你像野孩子，語氣裡卻有鬆一口氣。",
  ], { age: [6, 12] }),
];

const teen = [
  a("teen_exam", "為升學或出路把燈油熬盡", { intelligence: 3, health: -2, mood: -1 }, [
    "試卷上的格子像牢。你把公式寫到夢裡。",
    "你開始計算：若考不上，下一個出口在哪。",
  ], { age: [13, 17] }, { weight: 3, addTags: ["升學"], lane: "adolescent" }),
  a("teen_apprentice", "跟師傅或工廠老師傅學手藝", { intelligence: 1, wealth: 1, health: -1, charm: 1 }, [
    "你被罵了無數次「眼拙」。手卻漸漸有了記憶。",
    "第一次獨立做完一件活，你捨不得交給客人。",
  ], { age: [18, 45], classes: ["artisan", "worker", "peasant", "immigrant"] }, { addTags: ["手藝人"], lane: "adult_work" }),
  a("teen_crush", "把心事寫給那個總在路口出現的人", { charm: 3, mood: 2, intelligence: -1 }, [
    "回信來了，字跡比你想像的普通，卻讓你一整週腳不沾地。",
    "沒有回音。你把草稿燒了，假裝那只是練習書法。",
  ], { age: [13, 17] }, { weight: 2, lane: "adolescent" }),
  a("teen_rebel", "頂撞家裡，半夜溜出去", { mood: 2, charm: 1, wealth: -1, health: -1 }, [
    "夜風比訓斥好聽。你第一次覺得自己可以不被安排。",
    "回來時門沒鎖。桌上留著一碗冷掉的麵。",
  ], { age: [13, 17] }),
  a("teen_sport", "把多餘的怒氣耗在跑跳與競賽", { health: 3, charm: 1, mood: 1, intelligence: -1 }, [
    "肌肉比成績單更快給你自信。",
    "你在人群的喊聲裡短暫變成另一個人。",
  ], { age: [13, 22] }),
  a("teen_work", "課餘去送貨、帶孩子或幫攤", { wealth: 2, health: -1, mood: -1, intelligence: 1 }, [
    "你把賺來的錢分成「家用」和「自己的電影票」。",
    "顧客不把你當小孩。這既光榮又殘忍。",
  ], { age: [13, 17], stats: { wealth: [0, 55] } }),
  a("teen_read_forbidden", "傳閱一本不太能放在桌上的書刊", { intelligence: 3, mood: 1, charm: 1 }, [
    "紙頁發熱。你第一次意識到世界的說法不只一種。",
    "你把書藏在床板與牆之間，像藏一個未來。",
  ], { age: [14, 28], classes: ["intellectual", "gentry", "official", "student"] }, {
    risk: { chance: 0.1, effects: { mood: -4, charm: -2 }, text: "書被發現了。家裡或單位要你寫說明。" },
    addTags: ["思想活躍"],
  }),
];

const youthAdult = [
  a("work_overtime", "多接一班，把時間換成錢", { wealth: 3, health: -2, mood: -2, charm: -1 }, [
    "夜班的燈比月亮白。你開始用咖啡或濃茶計算壽命。",
    "薪水袋稍厚，夜裡卻反覆醒來，睡不夠。",
  ], { age: [18, 60] }, { weight: 3 }),
  a("work_network", "硬著頭皮去應酬、拜訪或攀談", { charm: 2, wealth: 1, mood: -1, health: -1 }, [
    "酒杯或茶盞碰撞之間，你得到一個名字和一個模棱兩可的許諾。",
    "你學會笑著把討厭的話咽回去。",
  ], { age: [18, 55] }, { weight: 2 }),
  a("work_study", "下班後繼續學一門能用的本事", { intelligence: 3, mood: 1, health: -1, wealth: -1 }, [
    "你把零碎時間縫成一條窄路。",
    "有人說你想太多。你把筆記寫得更密。",
  ], { age: [18, 45] }, { weight: 2, addTags: ["進修"] }),
  a("save_money", "把開銷砍到骨，把錢存起來", { wealth: 2, mood: -2, charm: -1 }, [
    "你開始記帳。每一筆「不必要」都被你盯到死。",
    "安全感上升時，生活的顏色下降了。",
  ], { age: [16, 70] }),
  a("invest_small", "拿一筆錢去嘗試買賣或入股", { wealth: 1, mood: -1, intelligence: 1 }, [
    "行情站在你這邊。你第一次覺得自己比命運聰明。",
    "只是小賺。你卻已經開始對人提起「眼光」。",
  ], { age: [18, 70], stats: { wealth: [20, 100] } }, {
    risk: { chance: 0.35, effects: { wealth: -8, mood: -3 }, text: "判斷錯了。錢像水一樣從指縫流走。" },
    weight: 2,
  }),
  a("romance_pursue", "認真追求一段感情", { charm: 2, mood: 3, wealth: -1, intelligence: -1 }, [
    "你們把世界縮小到兩個人能走完的那條路。",
    "告白比你準備的講稿更笨，卻成功了。",
  ], { age: [18, 45] }, { weight: 2, addTags: ["戀愛"] }),
  a("health_train", "開始規律鍛煉或進補", { health: 3, mood: 1, wealth: -1 }, [
    "身體比情緒先記得這件事。",
    "你在鏡子裡看到一點點可控的變化，這讓你上癮。",
  ], { age: [16, 70] }, { weight: 2 }),
  a("hobby", "把錢和夜晚交給一門無用的愛好", { mood: 3, charm: 1, wealth: -2, intelligence: 1 }, [
    "無用之物把你從有用的疲憊裡救出來。",
    "你交到幾個只談這件事的朋友。這比升遷更像活著。",
  ], { age: [15, 80] }),
  a("family_care", "把時間留給家裡的老小與病人", { mood: 1, charm: 1, wealth: -1, health: -1 }, [
    "沒有人發獎狀。洗碗水裡的月光卻很安靜。",
    "你成為那個「可以被拜託」的人，也成為那個比較難離開的人。",
  ], { age: [16, 80] }, { weight: 2 }),
  a("move_city", "考慮遷居或換一個碼頭碰運氣", { wealth: -2, mood: 1, charm: 1, intelligence: 1 }, [
    "行李比計畫少。你在新地址把名字寫錯兩次。",
    "語言、物價與孤獨一起漲潮。你暫時還沒後悔。",
  ], { age: [18, 40], tagsAny: ["流動", "移民", "漂泊", "商業"] }),
];

const middleLater = [
  a("career_risk", "在職位上賭一次升遷或改行", { wealth: 2, intelligence: 1, mood: -2, health: -1 }, [
    "你把半生的履歷押上桌。回覆來得很慢。",
    "有人開始用不同的口氣叫你的名字。",
  ], { age: [28, 55] }, {
    risk: { chance: 0.25, effects: { wealth: -6, mood: -4, charm: -2 }, text: "賭輸了。你被留在原處，還多了一個「不穩」的評價。" },
  }),
  a("mentor", "把本事傳給更年輕的人", { charm: 2, mood: 2, intelligence: 1, wealth: -1 }, [
    "你聽見自己年輕時討厭的句型從自己嘴裡出來，然後你改了說法。",
    "對方的進步讓你嫉妒，也讓你寬慰。",
  ], { age: [32, 70] }),
  a("checkup", "終於去把拖了很久的身體檢查做掉", { health: 2, wealth: -2, mood: -1 }, [
    "等候室的雜誌都是舊的。你的名字被叫到時，你忽然希望它再晚一點。",
    "結果沒有想像中糟。你決定少熬夜——至少這週。",
  ], { age: [35, 90], stats: { health: [0, 70] } }, { weight: 2 }),
  a("nostalgia", "整理舊物與未寄出的信", { mood: 2, intelligence: 1, charm: 1 }, [
    "有些臉只剩紙邊。你把它們按年份排好，像在修一條私人生的年譜。",
    "你發現自己比記憶中更勇敢，也更膽怯。",
  ], { age: [40, 100] }),
  a("community", "投入鄰里、工會、教會或志願事務", { charm: 2, mood: 1, wealth: -1, intelligence: 1 }, [
    "公共生活把你從私人的酸裡拉出來。",
    "你開始被叫「熱心的那位」，這稱號褒貶不明。",
  ], { age: [25, 80] }),
];

const senior = [
  a("senior_walk", "每天散步，把骨頭和街景一起活動", { health: 2, mood: 2 }, [
    "固定的長椅認得你。你也認得哪棵樹今年先開花。",
    "年輕人不讓座時你不再生氣，只是把步子放得更穩。",
  ], { age: [63, 120] }, { weight: 3 }),
  a("senior_doctor", "按時求醫問藥，不跟症狀賭氣", { health: 3, wealth: -3, mood: -1 }, [
    "藥袋越提越重。你開始能聽懂檢驗單上的部分字。",
    "醫生勸你「想開一點」。你想，這句話真不便宜。",
  ], { age: [60, 120] }, { weight: 2 }),
  a("senior_memoir", "把一生寫成片段，留給還願意讀的人", { intelligence: 2, mood: 2, charm: 1 }, [
    "你刪掉了太多復仇，留下了太多飯菜的氣味。",
    "寫到某個年份時，筆停了很久。那一頁後來還是空白。",
  ], { age: [58, 120] }),
  a("senior_grand", "把時間花在後輩身上", { mood: 3, health: -1, wealth: -1, charm: 1 }, [
    "他們的問題你答不全。你改說故事。",
    "有人嫌你囉嗦。有人把你的口頭禪學走了。",
  ], { age: [50, 120] }),
  a("senior_isolate", "把門關緊，少管外面的喧囂", { mood: -1, health: -1, intelligence: -1 }, [
    "安靜起初像休息，後來像井。",
    "你把收音機或電視開著，只為了屋裡有另一個聲音。",
  ], { age: [65, 120], stats: { mood: [0, 45] } }),
];

const classPeasant = [
  a("field_weather", "看天吃飯，搶在變天前把活兒做完", { wealth: 2, health: -2, mood: 1 }, [
    "腰很痛。麥子或菜葉卻因此多活了一截。",
    "你對雲的判斷比對官員的講話更準。",
  ], { classes: ["peasant"], age: [8, 70] }, { weight: 2 }),
  a("grain_hide", "把餘糧藏好，不讓風聲或徵收輕易拿走", { wealth: 2, mood: -1, intelligence: 1 }, [
    "地窖或床下多了一個只有家人知道的數字。",
    "你開始用暗語談論米。",
  ], { classes: ["peasant"], age: [10, 70], year: [1920, 1984] }),
];

const classArtisan = [
  a("craft_perfect", "把一件活做到自己願意署名", { charm: 2, intelligence: 1, wealth: 1, mood: 1 }, [
    "客人摸著接口說「這才像樣」。你把這句話存得比工錢久。",
    "手藝讓你在亂世裡仍有一個能站穩的小角落。",
  ], { classes: ["artisan"], age: [12, 70] }, { weight: 2 }),
  a("craft_cheap", "接急單、做大路貨，先顧流轉", { wealth: 2, charm: -1, mood: -1 }, [
    "速度吃掉了細節。你知道師傅若看見會嘆氣。",
    "錢進來了。你告訴自己：活著的手藝才叫手藝。",
  ], { classes: ["artisan"], age: [14, 65] }),
];

const classWorker = [
  a("union_talk", "跟工友討論工時、安全或薪水", { charm: 1, intelligence: 1, mood: 1, wealth: 0 }, [
    "有人把你當出頭鳥。有人把你當自己人。",
    "你把車間裡的潛規則摸得更清楚。",
  ], { classes: ["worker"], age: [18, 60] }, {
    risk: { chance: 0.12, effects: { wealth: -3, mood: -3 }, text: "領班記了你的名字。這個月的好班被換走了。" },
  }),
  a("machine_care", "多花時間保養機器，避免事故", { health: 1, intelligence: 1, mood: 1 }, [
    "油脂的氣味讓你安心。你相信可被潤滑的東西就還能活。",
    "一次險些發生的絞傷被你攔下。沒有獎，只有冷汗。",
  ], { classes: ["worker"], age: [18, 60] }),
];

const classMerchant = [
  a("market_read", "早起探行情，把消息換成判斷", { intelligence: 2, wealth: 2, mood: -1 }, [
    "你在茶樓或交易所聽來半句真話。這就夠用了。",
    "你把風險寫在袖口內側，走出門卻要笑得像毫無風險。",
  ], { classes: ["merchant"], age: [18, 70] }, { weight: 2 }),
  a("credit_extend", "放帳給熟客，賭對方還會回來", { charm: 2, wealth: -1, mood: -1 }, [
    "人情是槓桿。你清楚它也可能是斷點。",
    "對方回購時多帶了一個新客戶。你把酒錢記在公帳。",
  ], { classes: ["merchant"], age: [18, 70] }, {
    risk: { chance: 0.22, effects: { wealth: -7, charm: -2 }, text: "帳變成了故事。故事不能進倉。" },
  }),
];

const classIntellectual = [
  a("write_speak", "把觀察寫成文章或講給人聽", { intelligence: 2, charm: 2, mood: 1, wealth: -1 }, [
    "句子比人先到達遠方。回響來時，你已開始懷疑自己寫得太滿。",
    "有人抄你的觀點，沒有人抄你的猶豫。",
  ], { classes: ["intellectual"], age: [16, 80] }, { weight: 2 }),
  a("teach", "教書、助教或私下開班", { intelligence: 1, charm: 2, wealth: 1, mood: 1 }, [
    "講臺是一種麻醉。你在別人的恍然裡感到自己還有用。",
    "學生的問題比大綱更難。你帶著這個愉快的失敗回家。",
  ], { classes: ["intellectual", "gentry"], age: [20, 75] }),
];

const classOfficial = [
  a("paperwork", "把公文與關係打理清楚", { intelligence: 2, wealth: 1, charm: 1, mood: -2 }, [
    "你在印章之間行走。正確比真誠更被需要。",
    "一次小小的通融讓你睡不好，也讓事情過關。",
  ], { classes: ["official"], age: [22, 65] }, { weight: 2 }),
  a("low_profile", "在風向轉變時把自己的名字寫小一點", { mood: 1, charm: -1, intelligence: 1 }, [
    "你學會缺席某些宴會。這比出席更像政治。",
    "有人說你圓滑。你把這當成活過冬天的收據。",
  ], { classes: ["official", "gentry"], age: [20, 70] }),
];

const classMilitary = [
  a("drill", "把身體交給操練與隊列", { health: 2, mood: -1, intelligence: 1 }, [
    "口令比思想快。你在重複裡找到一種安全。",
    "你開始用「任務」理解私事，然後又為此不安。",
  ], { classes: ["military"], age: [18, 55] }, { weight: 2 }),
  a("letter_home", "寫信或託人帶話給散在各地的家人", { mood: 2, charm: 1, intelligence: 1 }, [
    "紙很薄，卻是你能控制的少數距離。",
    "回信遲到。你把等待當成紀律的一部分。",
  ], { classes: ["military", "immigrant"], age: [12, 70] }),
];

const classGentry = [
  a("manners", "把舊禮儀維持得像一種抵抗", { charm: 3, mood: 1, wealth: -1 }, [
    "茶具還在。時代已經不坐在同一張椅子上。",
    "有人嘲諷你過時。你把嘲諷當成尚未完全失敗的證據。",
  ], { classes: ["gentry"], age: [8, 80] }),
  a("sell_heirloom", "賣掉一件舊物換眼前的穩定", { wealth: 3, mood: -2, charm: -1 }, [
    "匣子空了。飯桌上的菜卻熱了。",
    "你在夜裡夢見祖宗沒有說話，只是把臉別過去。",
  ], { classes: ["gentry"], age: [16, 80], stats: { wealth: [0, 55] } }),
];

const classImmigrant = [
  a("language", "惡補本地語言與潛規則", { intelligence: 2, charm: 2, mood: -1 }, [
    "你終於能聽懂笑話裡的刺。這既是融入，也是失去保護色。",
    "口音還在。機會開始認你。",
  ], { classes: ["immigrant"], age: [6, 50] }, { weight: 2 }),
  a("remit", "把錢寄回另一個地址的家", { wealth: -2, mood: 2, charm: 1 }, [
    "匯款單是你的另一種簽名。",
    "你在這個城市省下一頓肉，讓那個城市的人多一點藥。",
  ], { classes: ["immigrant"], age: [16, 70] }),
];

const eraTwenties = [
  a("era_jazz", "跟著新節奏去聽爵士、文明戲或留聲機", { charm: 2, mood: 2, wealth: -1 }, [
    "身體先於道德學會搖擺。你覺得自己很摩登，也有點心虛。",
    "回家時耳裡還有銅管。巷子卻仍是舊的。",
  ], { year: [1920, 1929], age: [14, 40] }),
  a("era_warlord", "在兵差與封路的傳聞裡決定是否出門", { intelligence: 1, mood: -1, health: 1 }, [
    "你改走小路。活著的路線圖比地圖更真實。",
    "有人被拉夫。你低頭走過，把愧疚存進夜裡。",
  ], { year: [1920, 1928], regions: ["china"], age: [10, 50] }),
];

const eraThirties = [
  a("era_queue", "去排隊領救濟、找零工或等一個名額", { wealth: 1, mood: -2, health: -1 }, [
    "隊伍比希望長。你學會用站姿睡覺。",
    "輪到你時窗口關了一半。你把帽子捏皺。",
  ], { year: [1930, 1939], age: [12, 60], stats: { wealth: [0, 45] } }),
  a("era_radio_news", "追著電台聽時局，把焦慮當成知情", { intelligence: 2, mood: -2 }, [
    "播音員的平靜比消息更可怕。",
    "你開始在家裡用地圖插大頭針。",
  ], { year: [1930, 1945], age: [12, 70] }),
];

const eraForties = [
  a("era_shelter", "警報響起時，帶家人往掩體或山溝跑", { health: -1, mood: -2, intelligence: 1 }, [
    "土味和呼吸聲混在一起。你數著間隔，假裝那是節拍器。",
    "炸點偏了。你們活下來，卻不敢立刻慶祝。",
  ], { year: [1937, 1945], age: [6, 70] }, { weight: 2 }),
  a("era_ration", "用配給票精算這一週的熱量", { wealth: 1, intelligence: 1, mood: -1, health: -1 }, [
    "你把米粒從桌縫裡撿起來。沒有人笑。",
    "黑市的價格像另一場戰爭。",
  ], { year: [1939, 1946], age: [10, 70] }),
  a("era_enlist", "考慮從軍、當護理或去做戰地雜役", { health: -2, charm: 1, intelligence: 1, mood: -1 }, [
    "制服讓你看起來像被時代選中。其實你只是較少選擇。",
    "你看見了不該由這個年紀看見的東西。",
  ], { year: [1937, 1945], age: [18, 35] }, {
    risk: { chance: 0.18, effects: { health: -12, mood: -4 }, text: "前線或診所吞噬了你的健康。有些聲音此後一直留下。" },
    addTags: ["戰火"],
  }),
];

const eraPostwar = [
  a("era_rebuild", "加入清瓦礫、復工或識字班", { health: -1, intelligence: 2, wealth: 1, mood: 1 }, [
    "世界還破著，手卻先忙起來。忙碌像止痛藥。",
    "你在廢墟裡撿到一張能用的桌面，決定從吃飯開始重建。",
  ], { year: [1946, 1955], age: [12, 55] }),
  a("era_ideology", "參加學習會，練習公開說話", { intelligence: 1, charm: 1, mood: -1 }, [
    "正確的句子有標準答案。你背得很快，心裡卻在打草稿。",
    "有人因發言被記住。你決定這週當聽眾。",
  ], { year: [1949, 1976], regions: ["china", "russia"], age: [12, 60] }),
];

const eraSixties = [
  a("era_movement", "被街頭或校園的浪潮推著走", { charm: 2, mood: 1, intelligence: 1, health: -1 }, [
    "口號讓血液變熱。事後你說不清那熱有多少是自己的。",
    "你交到同志，也失去一些親戚。",
  ], { year: [1964, 1972], age: [14, 35] }),
  a("era_transistor", "迷上半導體、收音機改裝或太空新聞", { intelligence: 3, mood: 1, wealth: -1 }, [
    "衛星比鄰里更遠，卻讓你覺得人類還能共同做一件大事。",
    "你把零件攤在床上，母親以為你在玩，其實你在未來裡打工。",
  ], { year: [1960, 1969], age: [10, 40] }),
];

const eraSeventies = [
  a("era_queue_oil", "為燃料、副食或車票改寫生活日程", { intelligence: 1, wealth: -1, mood: -1, health: -1 }, [
    "節約從美德變成算術。",
    "你開始討厭浪費燈光的人，包括過去的自己。",
  ], { year: [1971, 1979], age: [16, 70] }),
  a("era_turn", "把話題從口號悄悄轉到出路與手藝", { intelligence: 2, wealth: 1, mood: 1 }, [
    "你發現周圍的人也在做同樣的轉向，只是誰都不先說破。",
    "一個小門路出現了。它不起眼，卻能養活人。",
  ], { year: [1976, 1979], regions: ["china"], age: [18, 55] }),
];

const eraEighties = [
  a("era_tv", "圍著電視看連續劇、演唱會或商品廣告", { charm: 1, mood: 2, intelligence: 1, wealth: -1 }, [
    "螢光把客廳變成廣場。你和陌生人笑同一則笑話。",
    "廣告教你想要你尚未擁有的生活。",
  ], { year: [1980, 1989], age: [8, 70] }),
  a("era_private", "試著擺攤、接私活或炒一點小差價", { wealth: 3, intelligence: 1, mood: 1, health: -1 }, [
    "第一筆「自己的錢」有金屬味。你反覆數。",
    "政策的邊緣像刀。你走得很小心，卻停不下來。",
  ], { year: [1978, 1992], regions: ["china"], age: [18, 50] }, { weight: 2, lane: "adult_work" }),
  a("era_cassette", "用卡帶、明星海報和時髦衣著裝修自己", { charm: 3, mood: 2, wealth: -2 }, [
    "你覺得自己終於跟上了某種全球時間。",
    "家長說那是噪音。你把音量開得更小，耳機更近。",
  ], { year: [1980, 1989], age: [13, 30] }),
];

const eraNineties = [
  a("era_pc", "去電腦教室或夜市攤位碰那些會發光的機器", { intelligence: 3, wealth: -1, mood: 1 }, [
    "游標閃爍時，你第一次感到一種不屬於土地的速度。",
    "你把指令背下來，像從前背詩。",
  ], { year: [1990, 1999], age: [10, 45] }, { weight: 2 }),
  a("era_global", "嘗試外語、洋裝或跨國商品", { charm: 2, intelligence: 1, wealth: -2, mood: 1 }, [
    "世界變得可以購買。你高興了一會兒，又覺得被定了價。",
    "你開始用另一種語言做白日夢。",
  ], { year: [1990, 1999], age: [14, 40] }),
];

const era2000s = [
  a("era_mobile", "換一支能上網的手機，把關係帶在口袋", { charm: 2, intelligence: 1, wealth: -2, mood: 1 }, [
    "訊息提示音成為新的條件反射。",
    "你比以前更容易被找到，也更難躲起來。",
  ], { year: [2000, 2009], age: [12, 55] }),
  a("era_sars_mask", "減少出門，把清潔與體溫當成禮儀", { health: 2, mood: -2, charm: -1 }, [
    "口罩讓表情消失。你學會用眼睛打招呼。",
    "恐懼很理性。理性並不因此比較好受。",
  ], { year: [2003, 2003], regions: ["china", "hongkong", "taiwan", "se_asia"], age: [6, 90] }),
  a("era_crisis_job", "在裁員傳聞裡更新履歷或兼差", { intelligence: 1, wealth: 1, mood: -2, health: -1 }, [
    "你把自我介紹寫得像求生手冊。",
    "有一個面試取消了。你去公園走了兩圈，回來繼續投。",
  ], { year: [2008, 2010], age: [22, 60] }),
];

const era2010s = [
  a("era_social", "把生活切片發到網路上換回聲", { charm: 2, mood: 1, intelligence: -1, health: -1 }, [
    "按讚像糖。你知道，卻還是伸手。",
    "你刪了一則太真實的貼文。公開的自己需要剪輯。",
  ], { year: [2010, 2019], age: [13, 50] }, { weight: 2 }),
  a("era_gig", "用平台接單：外送、家教、設計或代駕", { wealth: 2, health: -2, mood: -1, intelligence: 1 }, [
    "演算法是新工頭。它不罵人，只是突然沉默。",
    "你自由得像沒有保障。",
  ], { year: [2012, 2019], age: [18, 45] }),
  a("era_rent", "為房租或房貸重新安排整個人生節奏", { wealth: -1, intelligence: 1, mood: -2 }, [
    "你開始對「穩定」這個詞過敏，又渴求它。",
    "看房時你學會在三分鐘內判斷潮氣與隔音。",
  ], { year: [2010, 2019], age: [22, 45], regions: ["china", "taiwan", "hongkong", "west", "japan"] }),
];

const era2020s = [
  a("era_lockdown", "把日子改成室內的迴圈：工作、螢幕、窗", { intelligence: 1, mood: -2, health: -1, charm: -1 }, [
    "你量過房間的步數。這是一種新的地理學。",
    "視訊裡的人都很近，身體卻很遠。",
  ], { year: [2020, 2022], age: [8, 90] }, { weight: 2 }),
  a("era_remote", "試著把工作或學習搬到線上", { intelligence: 2, wealth: 1, charm: -1, mood: -1 }, [
    "通勤消失了。邊界也消失了。你在廚房開會。",
    "效率有時很高。孤獨的品質變差。",
  ], { year: [2020, 2025], age: [16, 65] }),
  a("era_ai", "開始用生成工具幫忙寫、畫或整理", { intelligence: 2, mood: 1, wealth: 1, charm: -1 }, [
    "你省下時間，卻花更多時間懷疑那還算不算自己的本事。",
    "有人說這是作弊。你說這是識字之後下一次識工具。",
  ], { year: [2023, 2025], age: [14, 70] }, { addTags: ["新工具"] }),
];

const fallback = [
  a("idle_rest", "什麼都不賭，只求這一週平安過去", { mood: 1, health: 1 }, [
    "無事發生。對某些年代來說，這已接近幸福。",
    "你把這週過成一張空白頁。以後也許會感激。",
  ], { age: [0, 120] }, { weight: 0.2, fallback: true }),
  a("idle_talk", "與身邊的人閒談，交換天氣與傳聞", { charm: 1, mood: 1, intelligence: 1 }, [
    "話比事實多。你從語氣裡聽出真正的天氣。",
    "有人把秘密說漏。你選擇當聽不懂。",
  ], { age: [4, 120] }, { weight: 0.3, fallback: true }),
  a("idle_chore", "把能收拾的角落收拾好", { mood: 1, health: -1, wealth: 1 }, [
    "秩序是廉價的控制感。你接受這個交易。",
    "掃完地，世界並沒有變好，但你比較能進去睡覺。",
  ], { age: [7, 120] }, { weight: 0.3, fallback: true }),
];

const tagActions = [
  a("tag_read_weather", "憑氣壓與氣味判斷要不要出門", { intelligence: 2, health: 1, mood: 1 }, [
    "別人看雲，你看空氣的重量。這一週你少淋了一場不該淋的雨。",
    "你把風向告訴家人。有人笑，直到天色真的翻了。",
  ], { age: [6, 90], tagsAny: ["trait_barometric_sense", "hook_weather", "ethnicity_inuit", "ethnicity_sami"] }, { weight: 4, hooks: ["weather", "survival"] }),
  a("tag_track_path", "用足跡與氣味把迷路的人（或牲口）找回來", { intelligence: 2, charm: 1, health: -1 }, [
    "斷續的印子在你眼裡仍是句子。你把它讀完。",
    "你找到的不是人，是一條還能走的路。這也夠了。",
  ], { age: [8, 80], tagsAny: ["trait_long_range_track", "hook_tracking", "ethnicity_san", "ethnicity_mongol"] }, { weight: 3, hooks: ["tracking", "survival"] }),
  a("tag_high_pass", "走一條別人會喘的坡或階梯", { health: 2, mood: 1 }, [
    "空氣稀，你的步子卻還在。這是血脈留下的餘裕。",
    "同行的人停下來。你假裝自己也累，其實還能再走一段。",
  ], { age: [8, 75], tagsAny: ["trait_altitude_epas1", "trait_altitude_hemoglobin", "hook_altitude"] }, { weight: 3, hooks: ["altitude", "health"] }),
  a("tag_dive_or_swim", "下到水裡做一件岸上的人不敢做的事", { health: 2, intelligence: 1, mood: 1 }, [
    "肺像記得另一種節拍。你浮上來時手上多了一樣東西。",
    "水壓讓耳朵響。你比旁邊的人多撐了幾個呼吸。",
  ], { age: [10, 60], tagsAny: ["trait_diving_spleen", "trait_sea_balance", "ethnicity_bajau"] }, { weight: 3, hooks: ["sea", "survival"] }),
  a("tag_math_accounts", "幫家裡把帳目或配給數字理清楚", { intelligence: 3, wealth: 1, mood: -1 }, [
    "數字在你腦子裡自己排隊。有人開始把簿子交給你。",
    "你找出一處被多扣的差額。錢不多，信任卻變了。",
  ], { age: [10, 70], tagsAny: ["parent_trait_math_aptitude", "hook_study", "hook_trade"] }, { weight: 3, hooks: ["study", "trade"] }),
  a("tag_music_night", "把一段旋律或節奏傳下去", { charm: 3, mood: 2, intelligence: 1 }, [
    "音準不用想。房間裡的呼吸跟著你對齊。",
    "有人說這是天賦。你知道那是某一個還在或已不在的長輩留下的。",
  ], { age: [6, 80], tagsAny: ["parent_trait_musical_aptitude", "parent_trait_absolute_pitch", "hook_art"] }, { weight: 3, hooks: ["art", "social"] }),
  a("tag_cold_craft", "在冷處仍把手上的細活做完", { intelligence: 2, wealth: 1, health: 1 }, [
    "別人的手指已經僵了。你還在把線穿過最後一個孔。",
    "寒意是背景音。完成才是前景。",
  ], { age: [8, 75], tagsAny: ["trait_cold_hands_craft", "trait_polar_thermogenesis", "hook_arctic"] }, { weight: 3, hooks: ["arctic", "craft"] }),
  a("tag_star_nav", "夜晚靠星與風判斷方向", { intelligence: 3, mood: 1 }, [
    "天頂是一張舊海圖。你認得其中幾個釘。",
    "你沒有儀器，可是沒有走回頭路。",
  ], { age: [12, 70], tagsAny: ["trait_star_path_nav", "hook_navigation", "ethnicity_maori", "ethnicity_marshallese"] }, { weight: 3, hooks: ["navigation", "sea"] }),
  a("season_winter_fuel", "把這一週的嚴寒過成囤燃料、補縫與早睡", { health: 1, wealth: -1, mood: 1 }, [
    "窗縫用布塞緊。屋子變小，人比較不容易散熱。",
    "你學會用最少的火撐過最長的夜。",
  ], { age: [6, 90], tagsAny: ["current_date_winter", "current_env_extreme_cold"] }, { weight: 4, hooks: ["weather", "survival"] }),
  a("season_summer_shade", "把活動改到清晨與陰影裡，躲開酷熱", { health: 2, mood: 1, wealth: -1 }, [
    "正午的街像被曬乾的河床。你改在天亮時把事情做完。",
    "水比昨天更值錢。你把杯子洗得特別乾。",
  ], { age: [6, 90], tagsAny: ["current_date_summer", "current_env_extreme_heat"] }, { weight: 4, hooks: ["weather", "health"] }),
  a("season_monsoon_stay", "雨季裡改修屋頂、清溝，少跟泥水硬碰", { health: 1, intelligence: 1, mood: -1 }, [
    "雨把巷子變成河。你把能抬高的東西都抬高。",
    "潮氣鑽進箱子。你學會用氣味判斷東西還能不能留。",
  ], { age: [8, 80], tagsAny: ["current_date_wet_season", "current_env_monsoon"] }, { weight: 3, hooks: ["weather"] }),
  a("season_dry_water", "旱季裡把取水、存水和走路的時間重新排過", { intelligence: 2, health: -1, wealth: -1 }, [
    "井邊的隊伍比日曆更準。你把容器洗到沒有氣味。",
    "灰塵進牙齒。你少說話，多走路。",
  ], { age: [8, 80], tagsAny: ["current_date_dry_season", "current_env_dust_dry"] }, { weight: 3, hooks: ["desert", "survival"] }),
  a("season_polar_night", "極夜裡靠室內節奏與彼此的聲音過一週", { mood: 1, charm: 1, health: -1 }, [
    "窗外幾乎沒有白天。鐘錶比太陽更像權威。",
    "你把燈調得很低，讓眼睛記得還有夜晚這件事。",
  ], { age: [4, 90], tagsAny: ["current_env_polar_night"] }, { weight: 5, hooks: ["arctic", "weather"] }),
  a("season_midnight_sun", "極晝裡把睡眠和工作重新切開", { health: -1, intelligence: 1, mood: 1 }, [
    "太陽不肯下班。你用布把窗戶變成夜晚。",
    "有人因此更勤快，有人因此更失眠。你兩邊都試過。",
  ], { age: [8, 80], tagsAny: ["current_env_midnight_sun"] }, { weight: 4, hooks: ["arctic"] }),
  a("natal_winter_body", "冬日出生的你把這週的冷當成熟悉的背景音", { health: 1, mood: 1 }, [
    "別人喊凍。你只是把袖口拉緊一點。",
    "這份從出生日期帶來的環境記憶，並不是魔法，只是身體比較早見過這種天氣。",
  ], { age: [8, 70], tagsAll: ["date_winter", "current_date_winter"] }, { weight: 3, hooks: ["weather"] }),
  a("natal_heat_body", "暑熱出生的你比旁邊的人更早找到陰涼處", { health: 1, intelligence: 1 }, [
    "你不必思考就往風口走。這是日期留下來的習慣。",
    "酷熱仍在，但你比較不會一開始就耗乾自己。",
  ], { age: [8, 70], tagsAll: ["date_summer", "current_date_summer"] }, { weight: 3, hooks: ["weather"] }),
  a("tag_malaria_carrier", "在蚊蟲與熱病傳言裡，你比旁人少崩一次", { health: 2, intelligence: 1 }, [
    "這不是幸運符。是家族標記在瘧區被讀成另一種意思。",
    "你仍會發燒。只是這一週沒有被抬走。",
  ], { age: [6, 70], tagsAny: ["risk_sickle_trait", "risk_thalassemia_trait", "risk_g6pd_deficiency", "trait_malaria_belt"] }, { weight: 4, hooks: ["malaria", "tropics", "health"] }),
  a("tag_poverty_blend", "把貧困出身當成偽裝，少被徵調或勒索盯上", { wealth: 1, intelligence: 1, charm: -1 }, [
    "沒有人從你身上看出油水。這在某些年代等於護身符。",
    "你把僅有的東西藏得比有錢人更熟練。",
  ], { age: [10, 70], tagsAny: ["socio_extreme_poverty", "socio_working_poor", "socio_war_displacement"] }, { weight: 3, hooks: ["survival", "war", "scarcity"] }),
  a("tag_capital_shelter", "動用商號或門第的餘裕撐過這一週", { wealth: -1, mood: 2, health: 1 }, [
    "錢能買時間。你清楚這份餘裕在革命或配給裡會瞬間翻面。",
    "帳房替你擋了一道。你同時鬆一口氣，也更依賴它。",
  ], { age: [12, 70], tagsAny: ["socio_merchant_capital", "socio_official_network", "socio_gentry_estate"] }, { weight: 3, hooks: ["trade", "urban"] }),
  a("tag_mood_low_write", "把低落寫下來，而不是把它當成必須立刻治好的錯", { mood: 2, intelligence: 1, charm: -1 }, [
    "暫時性低落標籤讓你少參加應酬，卻多看見別人沒說的句子。",
    "你沒有變好。你只是把極端心情當成一種天氣。",
  ], { age: [12, 80], tagsAny: ["mood_depressed"] }, { weight: 5, hooks: ["empathy", "study"] }),
  a("tag_mood_high_risk", "亢奮裡答應一件過大的事", { charm: 3, mood: 1, wealth: 1, health: -2 }, [
    "暫時性狂熱標籤讓房間跟著你加速。事後你才開始算代價。",
    "有人被你帶動。有人被你嚇到。",
  ], { age: [14, 60], tagsAny: ["mood_euphoric"] }, { weight: 5, hooks: ["social", "risk"], risk: { chance: 0.28, effects: { wealth: -4, mood: -3 }, text: "承諾太大。你用接下來的沉默還債。" } }),
  a("tag_myopia_desk", "近視傾向讓你更願意把世界縮成一張桌面", { intelligence: 2, health: -1 }, [
    "遠方變糊。近處的字卻更像領土。",
    "這枚風險標籤在書房是工具，在山路上是懲罰。",
  ], { age: [8, 70], tagsAny: ["risk_myopia_risk", "condition_myopia_risk"] }, { weight: 3, hooks: ["study"] }),
];

export const ACTION_POOL = [
  ...infant,
  ...toddler,
  ...child,
  ...teen,
  ...youthAdult,
  ...middleLater,
  ...senior,
  ...classPeasant,
  ...classArtisan,
  ...classWorker,
  ...classMerchant,
  ...classIntellectual,
  ...classOfficial,
  ...classMilitary,
  ...classGentry,
  ...classImmigrant,
  ...eraTwenties,
  ...eraThirties,
  ...eraForties,
  ...eraPostwar,
  ...eraSixties,
  ...eraSeventies,
  ...eraEighties,
  ...eraNineties,
  ...era2000s,
  ...era2010s,
  ...era2020s,
  ...tagActions,
  ...fallback,
];
