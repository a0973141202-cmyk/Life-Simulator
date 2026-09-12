/**
 * One gated beat per canonical tag prefix.
 * Any live tag in that namespace can unlock the option; nothing is leftover
 * just because the weekly catalog never named that exact id.
 */

function a(id, text, effects, followUps, when, extra = {}) {
  return {
    id,
    text,
    effects,
    followUps,
    when,
    weight: extra.weight ?? 2.6,
    tagDriven: true,
    tagLink: true,
    crisis: extra.crisis === true,
    ...extra,
    lane: extra.lane || "survival",
  };
}

/** [prefix, id, text, effects, followUps, age, extra] */
const PREFIX_BEATS = [
  ["ethnicity_", "link_ethnicity", "用家裏帶來的口音、姓氏或記性過這一週", { mood: 1 }, [
    "這不是表演。是你還認得哪一句話比較不容易被攔。",
    "旁人聽你的口音。你把這一週過完，沒有多解釋自己是誰。",
  ], [5, 120], { direction: "survive", hooks: ["survival", "language"] }],
  ["trait_", "link_trait", "把血脈留給身體的那一點餘裕用在這一週該做的事上", { health: 1, mood: -1 }, [
    "餘裕不是光環。它只是讓你晚一點喊停。",
    "你按身體認得的節奏做事。旁人以為你在逞強。",
  ], [6, 110], { direction: "endure", hooks: ["health", "survival"] }],
  ["parent_trait_", "link_parent_trait", "照父母教過的手勢把這一週的事做完", { intelligence: 1 }, [
    "手比口號先記得。你沒有把這說成遺傳。",
    "教過你的人未必還在。手勢還在。",
  ], [6, 110], { direction: "tend", hooks: ["family", "craft"] }],
  ["parent_", "link_parent", "按家裏還在或不在的人留下的空位過這一週", { mood: -1, health: 1 }, [
    "缺席也是一種作息。你按它排日子。",
    "有人問你家裡誰做主。你答了一個比較不容易惹事的版本。",
  ], [5, 120], { direction: "endure", hooks: ["family"] }],
  ["lineage_", "link_lineage", "把混在一起或被點名的血統收進這一週的回答", { charm: -1, mood: 1 }, [
    "姓氏不是護身符。它是檢查哨會問的東西。",
    "你決定這一週要暴露哪一半、藏哪一半。",
  ], [8, 110], { direction: "withdraw", hooks: ["social", "survival"] }],
  ["acquired_", "link_acquired", "用後來才學到的那一招撐過這一週", { intelligence: 1 }, [
    "這不是天生的。是你被逼出來的。",
    "你把學過的那一下用完。它仍會留下痕跡。",
  ], [7, 120], { direction: "seek", hooks: ["study", "survival"] }],
  ["hook_", "link_hook", "讓身體認得的那條線索先走，再決定要不要抬頭", { health: 1 }, [
    "線索在風、水、夜路或人群裡。你先跟它。",
    "旁人看你繞路。你只是不想走會死人的直線。",
  ], [6, 120], { direction: "survive", hooks: ["survival"] }],
  ["climate_", "link_climate", "按這地方的天氣改作息，不跟日曆抬槓", { health: 1, mood: -1 }, [
    "熱、冷、濕或風先決定能做什麼。你服從這個順序。",
    "你少做一件體面的事。你多活過這一週的天色。",
  ], [5, 120], { direction: "endure", hooks: ["weather", "survival"] }],
  ["class_", "link_class", "按戶口冊上的出身把這一週能做的事做完", { mood: -1 }, [
    "出身不是選擇。它是別人先看見的那一行。",
    "你按這一行事，不把力氣花在否認它。",
  ], [6, 120], { direction: "endure", hooks: ["social"] }],
  ["wealth_", "link_wealth", "按這一期還剩的錢和還沒還的帳先過眼前", { wealth: -1, mood: -1 }, [
    "口袋和債比出身先決定這一週能走哪條巷。",
    "你先算還得起的那一筆，再談別的。",
  ], [8, 120], { direction: "endure", hooks: ["commerce", "scarcity"] }],
  ["kin_", "link_kin", "按家裏還在的人或已經不在的人改這一週的走法", { mood: -1 }, [
    "至親的臉色、缺席或仇隙比街坊閒話先到。",
    "你先看屋裏還認不認你，再談外頭。",
  ], [8, 120], { direction: "endure", hooks: ["family", "home"] }],
  ["settlement_", "link_settlement", "用這座城或這個村子認得的走法過這一週", { intelligence: 1 }, [
    "門牌會變。巷的氣味比較慢。",
    "你走熟路。熟路也會突然被封。",
  ], [5, 120], { direction: "survive", hooks: ["urban", "survival"] }],
  ["region_", "link_region", "按這一帶的規矩低頭或抬頭", { charm: -1, mood: 1 }, [
    "規矩寫在眼神裡。你這一週沒有裝外地人。",
    "有人聽出你不是本地。你把句子改短。",
  ], [6, 120], { direction: "withdraw", hooks: ["social"] }],
  ["date_", "link_date", "按這一週的冷熱和雨，改出門和睡覺的時間", { mood: 1 }, [
    "日子本身會提醒身體。你沒有把它說成預兆。",
    "你比旁邊的人早一點添衣或早一點起床。",
  ], [5, 120], { direction: "tend", hooks: ["weather"] }],
  ["env_", "link_env", "讓環境先告訴你能走哪裡、不能停哪裡", { health: 1 }, [
    "極夜、酷熱或潮溼不是背景。它們是這一週的牆。",
    "你改路線。解釋留給以後。",
  ], [5, 120], { direction: "survive", hooks: ["weather", "survival"] }],
  ["hemisphere_", "link_hemisphere", "按你半球的季節改睡眠與出門時間", { health: 1 }, [
    "日曆印著另一個半球的夏天。你的身體不認。",
    "你少跟別人比誰比較像正常人。",
  ], [5, 120], { direction: "endure", hooks: ["weather"] }],
  ["current_", "link_current", "按這一週正在發生的天氣或節令改計畫", { health: 1, mood: -1 }, [
    "這一週的冷、熱、雨或風比計劃準時。",
    "你把要做的事切短。活過天才算完成。",
  ], [5, 120], { direction: "survive", hooks: ["weather", "survival"] }],
  ["condition_", "link_condition", "按身體已經寫進戶籍的那一行過這一週，不跟爆發的人比", { health: 1, mood: -1 }, [
    "病弱、帶因或體格不是故事。它是配速。",
    "你把力氣留給必須做的事。面子以後再算。",
  ], [6, 120], { direction: "tend", hooks: ["health"] }],
  ["risk_", "link_risk", "把隱性的風險當背景，不拿去賭這一週的面子", { health: 1 }, [
    "風險不現身，也會在熱、累或缺糧時開口。",
    "你少喝一杯、少走一段、少跟人群擠。",
  ], [8, 110], { direction: "withdraw", hooks: ["health", "survival"] }],
  ["socio_", "link_socio", "按家裏的錢、沒錢或門楣過這一週", { mood: -1, health: 1 }, [
    "貧困、資本或體面都會教人怎麼排隊。",
    "你按自己的出身做事。不把這週拿去假裝另一戶。",
  ], [6, 120], { direction: "endure", hooks: ["scarcity", "survival"] }],
  ["mood_", "link_mood", "按此刻的氣色決定要不要開口、要不要出門", { mood: 1, charm: -1 }, [
    "低落或亢奮都會改判斷。你先承認它在。",
    "你少做一件需要表演正常的事。",
  ], [8, 110], { direction: "withdraw", hooks: ["health"] }],
  ["path_", "link_path", "沿著街坊已經替你歸類的那條路再走一步，或故意停住", { intelligence: 1, mood: -1 }, [
    "路一旦被叫出來，就會有人按那個名字找你。",
    "你決定這一週要不要再給它燃料。",
  ], [12, 110], { direction: "seek", hooks: ["street", "politics"] }],
  ["crime_", "link_crime", "少留下名字，多留下退路", { mood: -1, health: 1 }, [
    "通緝或熱度不是氣氛。它是門會不會被砸。",
    "你改住處、改時間、改回答。",
  ], [14, 110], { direction: "survive", hooks: ["hide", "crime", "survival"] }],
  ["politics_", "link_politics", "把政治當天氣，先看風向再出門", { intelligence: 1, charm: -1 }, [
    "標語與名單比雨準時。你把這週的話收短。",
    "你沒有表態。沒有表態有時也是一種被看見。",
  ], [12, 110], { direction: "withdraw", hooks: ["politics", "official"] }],
  ["ledger_", "link_ledger", "先對這一週的帳，再決定要不要伸手", { intelligence: 1 }, [
    "信任、熱度與意見都在暗處走動。你按指針做事。",
    "你少欠一筆新的。舊帳仍在。",
  ], [12, 110], { direction: "seek", hooks: ["trade"] }],
  ["daily_", "link_daily", "按眼下這段日子的節奏把這一週過完", { mood: 1 }, [
    "營區、工廠、家或街上的作息比決心硬。",
    "你順這段日子。硬拗會先傷身體。",
  ], [5, 120], { direction: "endure", hooks: ["survival"] }],
  ["household_", "link_household", "按屋裡的氣氛決定今晚關哪一扇門", { health: 1, mood: -1 }, [
    "酒、忽略或爆發都有前奏。你比勸說更早動作。",
    "裡屋的呼吸被你數著。外屋的聲音還在。",
  ], [5, 90], { direction: "survive", hooks: ["family", "hide"] }],
  ["trauma_", "link_trauma", "給還在警戒的神經系統一條它認得的退路", { mood: -1, health: 1 }, [
    "創傷不是設定。它改走路的順序。",
    "你先數門窗。再決定要不要說話。",
  ], [6, 120], { direction: "survive", hooks: ["hide", "survival"] }],
  ["school_", "link_school", "按校園裡已經寫在你身上的位置過這一週", { mood: -1, health: 1 }, [
    "被圍、被跟或能讓人退後，都是院子的帳。",
    "你改路、改時間，或把餘裕收進口袋。",
  ], [7, 17], { direction: "survive", hooks: ["hide", "study"], childTheme: "peer", lane: "school" }],
  ["caste_", "link_caste", "在這套秩序裡找一個不被點名的角度", { health: 1, charm: -1 }, [
    "牢、道上或勞動營的規矩不講公平。你講角度。",
    "你少抬頭。你多活過這一週的點名。",
  ], [18, 90], { direction: "survive", hooks: ["street", "survival"], lane: "adult_society" }],
  ["adult_", "link_adult", "用成人世界已經貼上的標籤過這一週的工與帳", { mood: -1 }, [
    "職場、工地或街坊的記號比合約準時。",
    "你按這個記號做事。不把力氣花在洗掉它。",
  ], [18, 110], { direction: "endure", hooks: ["labor"] }],
  ["world_", "link_world", "按時代正在發生的事改這一週的計畫", { intelligence: 1, mood: -1 }, [
    "戰爭、疫、名單或貶值不等人準備好。",
    "你把出行與存糧改短。活過才算趕上時代。",
  ], [8, 120], { direction: "survive", hooks: ["war", "survival"] }],
  ["figure_", "link_figure", "把見過的大人物當路標，不當靠山", { intelligence: 1, charm: -1 }, [
    "交集會被兩邊記得。你這一週沒有主動再靠近。",
    "名字能開門，也能把你寫進下一張名單。",
  ], [10, 110], { direction: "seek", hooks: ["politics"] }],
  ["social_", "link_social", "按街坊現在怎麼看你來決定走哪一側", { mood: -1, health: 1 }, [
    "被怕、被冷、被求或被信，都改路線。",
    "你用距離付帳。不把解釋交給這一週。",
  ], [8, 120], { direction: "withdraw", hooks: ["social"] }],
];

const LOCK_BEATS = [
  a("lock_polite_papers", "把證件與笑容一次遞上，當自己會被當成普通良民", { charm: 1, mood: -1 }, [
    "這條路只對還沒被寫進黑冊的人開。你走了它。",
    "窗口要的是「看起來沒問題」。你把那張臉借給這一週。",
  ], {
    age: [10, 90],
    tagsNone: ["acquired_wanted", "social_feared", "social_shunned"],
    tagPrefixesNone: ["crime_", "caste_"],
  }, { direction: "seek", hooks: ["official"], weight: 1.5 }),
  a("lock_crowd_force", "跟走得最快、擠得最前的人比誰先到桌前或門口", { health: -2, wealth: 1 }, [
    "力氣在這一週被當成入場券。你還有力氣。",
    "隊伍按肌肉排序。你沒有把位置讓給看起來更弱的人。",
  ], {
    age: [10, 90],
    tagPrefixesNone: ["condition_", "risk_", "trauma_"],
    tagsNone: ["socio_extreme_poverty"],
  }, { direction: "defy", hooks: ["scarcity", "street"], weight: 1.4 }),
  a("lock_loud_reason", "當眾把不公講清楚，等旁人站到你這邊", { charm: 1, intelligence: 1, mood: -1 }, [
    "聲音大的人有時能改一句判決。你試了。",
    "講理需要一張還沒被怕過的臉。你這一週還有。",
  ], {
    age: [12, 90],
    tagPrefixesNone: ["trauma_", "school_"],
    tagsNone: ["social_feared", "mood_depressed"],
  }, { direction: "confront", hooks: ["official", "social"], weight: 1.4 }),
];

export const PREFIX_LINK_POOL = [
  ...PREFIX_BEATS.map(([prefix, id, text, effects, followUps, age, extra]) => (
    a(id, text, effects, followUps, { age, tagPrefixesAny: [prefix] }, extra)
  )),
  ...LOCK_BEATS,
];

export const LINKED_TAG_PREFIXES = PREFIX_BEATS.map((row) => row[0]);
