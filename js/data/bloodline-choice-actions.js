/**
 * Batch 2: organic gene / ethnicity choices.
 * These only match when organicContexts are live — never a weekly quota.
 */

function a(id, text, effects, followUps, when = {}, extra = {}) {
  return {
    id,
    text,
    effects,
    followUps,
    when,
    weight: extra.weight ?? 2.8,
    tagDriven: true,
    organic: extra.organic || "gene",
    organicContexts: extra.organicContexts || when.organicContexts || [],
    ...extra,
  };
}

export const BLOODLINE_CHOICE_POOL = [
  a("gene_cold_hardy_fetch", "把這一週的寒當成熟悉的背景，出去把該取的燃料取完", { health: -1, mood: 1 }, [
    "旁人已經縮進被窩。你的身體還記得怎麼在冷裡把事情做完。",
    "手指仍能彎。這不是勇氣，是血脈留下的餘裕。",
  ], {
    age: [8, 90],
    tagsAny: ["trait_polar_thermogenesis", "trait_cold_hands_craft", "trait_ice_acoustic_read"],
    organicContexts: ["climate"],
  }, { organic: "gene", valence: "advantage", direction: "survive", riskBand: "mid", situation: "gene", hooks: ["arctic", "survival"] }),

  a("gene_heat_pace", "酷熱裡把活兒改到自己的配速，不跟旁邊的人比爆發", { health: 1, mood: -1 }, [
    "正午是敵人。你的節奏比口號早學會這件事。",
    "水省著喝。步子切短。你活過這一週的太陽。",
  ], {
    age: [10, 80],
    tagsAny: ["trait_heat_slender_build", "trait_humidity_pace", "trait_desert_thrift", "parent_trait_athletic_endurance"],
    organicContexts: ["climate", "labor"],
  }, { organic: "gene", valence: "advantage", direction: "endure", riskBand: "low", situation: "gene", hooks: ["desert", "labor"] }),

  a("gene_hematocrit_thin_air", "稀薄空氣裡你把步子放穩，不跟旁人比誰先到頂", { health: 1, mood: -1 }, [
    "血比較稠。坡比較聽話。頭痛也比較早到。",
    "你用餘裕換高度。你也用高度換一次必須坐下的午後。",
  ], {
    age: [10, 75],
    tagsAny: ["condition_high_hematocrit", "risk_high_hematocrit"],
    organicContexts: ["climate", "labor"],
  }, { organic: "gene", valence: "advantage", direction: "survive", riskBand: "mid", situation: "gene", hooks: ["altitude", "health"] }),

  a("gene_altitude_short_step", "坡上把步子切短，不讓心肺去跟別人的驕傲比賽", { health: 1 }, [
    "空氣稀。你的血比較認得這種稀。",
    "同行的人停下來罵。你假裝也累，其實還能再走一段。",
  ], {
    age: [8, 75],
    tagsAny: ["trait_altitude_epas1", "trait_altitude_hemoglobin", "trait_mountain_foot"],
    organicContexts: ["climate", "labor"],
  }, { organic: "gene", valence: "advantage", direction: "survive", riskBand: "low", situation: "gene", hooks: ["altitude", "health"] }),

  a("gene_labor_stoic_shift", "把這一趟重活按自己的底盤扛完，不跟爆發的人比快", { health: -2, mood: 1 }, [
    "勞損會入帳。你只是比旁邊的人晚一點喊。",
    "輪班的身體記得怎麼把痛放到明天。明天仍會來。",
  ], {
    age: [13, 70],
    tagsAny: ["trait_iron_shift", "parent_trait_pain_stoic", "parent_trait_athletic_endurance"],
    organicContexts: ["labor"],
  }, { organic: "gene", valence: "advantage", direction: "endure", riskBand: "mid", situation: "gene", hooks: ["labor", "health"] }),

  a("gene_malaria_quiet_week", "熱病傳言裡你把水煮開，少跟發熱的隊伍擠在一起", { health: 1, mood: -1 }, [
    "這不是護身符。是家裏有人發過這種熱，身體先認得徵兆。",
    "你仍會發燒。只是這一週沒有被抬走。",
  ], {
    age: [6, 80],
    tagsAny: ["trait_malaria_belt", "risk_sickle_trait", "risk_thalassemia_trait", "risk_g6pd_deficiency"],
    organicContexts: ["plague", "medical"],
  }, { organic: "gene", valence: "advantage", direction: "survive", riskBand: "mid", situation: "gene", hooks: ["malaria", "health"] }),

  a("gene_famine_thrift_gut", "饑荒週裡把能吃的東西切得更細，先餵身體再餵面子", { health: 1, mood: -1 }, [
    "節儉的代謝不是美德。它只是在缺糧時多給你一天。",
    "你少解釋自己為什麼不吐。解釋會讓人把你的份分走。",
  ], {
    age: [8, 80],
    tagsAny: ["risk_diabetes_t2_risk", "condition_diabetes_t2_risk", "trait_desert_thrift"],
    organicContexts: ["famine"],
  }, { organic: "gene", valence: "advantage", direction: "endure", riskBand: "low", situation: "gene", hooks: ["survival", "scarcity"] }),

  a("gene_g6pd_refuse_dose", "這一週拒絕來路不明的藥與蠶豆，哪怕旁人說你矯情", { health: 2, mood: -1 }, [
    "氧化壓力對你不是抽象詞。它是尿色和眼前發黑。",
    "你少吃了一頓。你也少崩了一次血。",
  ], {
    age: [8, 80],
    tagsAny: ["condition_g6pd_deficiency", "risk_g6pd_deficiency"],
    organicContexts: ["plague", "medical"],
  }, { organic: "gene", valence: "strain", direction: "withdraw", riskBand: "mid", situation: "gene", hooks: ["health", "infection"] }),

  a("gene_sickle_no_hero", "缺氧或重活一上來，你先停，不把危象當成英勇", { health: 1, mood: -2 }, [
    "痛會從骨頭裡來。你把這週的力氣留給走路，不留給表演。",
    "有人笑你嬌氣。你知道嬌氣比倒下便宜。",
  ], {
    age: [8, 70],
    tagsAny: ["condition_sickle_trait"],
    organicContexts: ["labor", "climate", "medical"],
  }, { organic: "gene", valence: "strain", direction: "withdraw", riskBand: "high", situation: "gene", hooks: ["health", "hypoxia"] }),

  a("gene_bleed_pass_work", "會出血的活兒這週留給別人，你改做清點與傳話", { mood: -1 }, [
    "凝血對你不是理所當然。你把這句話藏在動作裡。",
    "手沒破。帳仍在。這已經算過關。",
  ], {
    age: [10, 70],
    tagsAny: ["condition_hemophilia_carrier", "risk_hemophilia_carrier"],
    organicContexts: ["labor", "medical"],
  }, { organic: "gene", valence: "strain", direction: "withdraw", riskBand: "high", situation: "gene", hooks: ["health", "labor"] }),

  a("gene_asthma_windward", "煙塵起來時你改走上風，不硬扛那口氣", { health: 1, mood: -1 }, [
    "氣道先報警。你聽從它，不聽從要你證明自己的人。",
    "工業的氣味還在。你把距離買成呼吸。",
  ], {
    age: [6, 80],
    tagsAny: ["condition_asthma_atopy", "risk_asthma_atopy"],
    organicContexts: ["labor", "climate", "medical"],
  }, { organic: "gene", valence: "strain", direction: "survive", riskBand: "mid", situation: "gene", hooks: ["health", "weather"] }),

  a("gene_night_touch_path", "燈不夠的地方，你改靠觸與聲，不跟旁人比眼力", { mood: 1, health: -1 }, [
    "暗適應慢不是膽怯。你把牆當作地圖。",
    "有人走得比你快。你走得比較少摔。",
  ], {
    age: [8, 80],
    tagsAny: ["condition_night_blindness_risk", "risk_night_blindness_risk"],
    tagsNone: ["trait_night_adapt"],
    organicContexts: ["climate", "medical"],
  }, { organic: "gene", valence: "strain", direction: "seek", riskBand: "mid", situation: "gene", hooks: ["sensory", "night"] }),

  a("gene_heart_no_slope_race", "上坡或抬重時你把次數切開，不讓雜音去跟工期比賽", { health: 1, mood: -1 }, [
    "心肺儲備偏低的人，驕傲是一種昂貴的燃料。",
    "你少搬一趟。你也少在這一週把自己搬倒。",
  ], {
    age: [12, 80],
    tagsAny: ["condition_congenital_murmur_risk", "risk_congenital_murmur_risk"],
    organicContexts: ["labor", "climate", "medical"],
  }, { organic: "gene", valence: "strain", direction: "endure", riskBand: "high", situation: "gene", hooks: ["health", "altitude"] }),

  a("gene_myopia_close_work", "這一週把世界縮成一張桌面：帳、針、字，不跟遠處的人比眼", { mood: 1 }, [
    "遠方變糊。近處仍是領土。",
    "有人要你望風。你改做點數。點數比較不會把人看丟。",
  ], {
    age: [8, 70],
    tagsAny: ["condition_myopia_risk", "risk_myopia_risk"],
    organicContexts: ["labor", "medical"],
  }, { organic: "gene", valence: "strain", direction: "seek", riskBand: "low", situation: "gene", hooks: ["study", "craft"] }),

  a("eth_listed_quiet_origin", "被點名或盤問時，你先報一個比較不容易惹事的出身說法", { mood: -1 }, [
    "血統在這一週變成手續。你把真實的那一段留在牙關後。",
    "有人要你選邊。你選活過這一週。",
  ], {
    age: [10, 90],
    tagsAny: ["lineage_mixed", "socio_war_displacement"],
    organicContexts: ["discrimination", "cultural"],
  }, { organic: "ethnicity", valence: "contextual", direction: "withdraw", riskBand: "mid", situation: "lineage", hooks: ["survival", "social"] }),

  a("eth_clan_side_door", "走親族能擔保、官方文件走不通的那條非正式路", { mood: 1 }, [
    "誰能投靠、誰不能提，這張地圖比印章早存在。",
    "你欠下一句人情。人情比罰款便宜，也比罰款更長。",
  ], {
    age: [12, 90],
    tagsAny: ["trait_clan_map", "trait_diaspora_pack"],
    organicContexts: ["discrimination", "enclave", "cultural"],
  }, { organic: "ethnicity", valence: "advantage", direction: "bind", riskBand: "mid", situation: "lineage", hooks: ["family", "social"] }),

  a("eth_oral_hide_name", "把不能寫下來的名字、禁忌與路線用口傳藏過這一週", { mood: 1 }, [
    "紙會被收走。嘴還在。",
    "你少公開了一個稱呼。有人因此沒有把你寫進名單。",
  ], {
    age: [8, 90],
    tagsAny: ["trait_oral_memory", "parent_trait_memory_rote", "parent_trait_verbal_aptitude"],
    organicContexts: ["discrimination", "cultural"],
  }, { organic: "ethnicity", valence: "advantage", direction: "seek", riskBand: "mid", situation: "lineage", hooks: ["language", "memory"] }),

  a("eth_other_tongue_listen", "用另一種語言把話聽完，再決定要不要翻譯給誰", { mood: 1 }, [
    "聽得懂是一種武器，也是一種把柄。你這週先不當翻譯官。",
    "房間裡的人以為你沒聽見。你聽見了，只是不接。",
  ], {
    age: [10, 90],
    tagsAny: ["trait_multilingual_ear", "parent_trait_language_ear", "trait_tone_language_ear"],
    organicContexts: ["discrimination", "cultural", "enclave"],
  }, { organic: "ethnicity", valence: "advantage", direction: "seek", riskBand: "low", situation: "lineage", hooks: ["language", "social"] }),

  a("eth_faith_offstage", "儀式改在看不見的時間做，不在廣場上證明自己是誰", { mood: 1, health: -1 }, [
    "公開的虔誠這週太貴。你把節奏留給家裏。",
    "禁忌仍在。你沒有用它去換一句被看見的讚美。",
  ], {
    age: [8, 90],
    tagsAny: ["trait_faith_spine"],
    organicContexts: ["cultural", "discrimination"],
  }, { organic: "ethnicity", valence: "contextual", direction: "withdraw", riskBand: "mid", situation: "lineage", hooks: ["faith", "hide"] }),

  a("eth_pack_what_matters", "按離散家裏的打包順序，決定什麼值得帶走、什麼該丟", { health: -1, mood: -1 }, [
    "行李是一種判斷。你比旁人更早做過這種判斷。",
    "有人笑你小氣。你把種子、文件和能換水的東西放最上面。",
  ], {
    age: [8, 90],
    tagsAny: ["trait_diaspora_pack", "socio_war_displacement"],
    organicContexts: ["famine", "discrimination", "cultural"],
  }, { organic: "ethnicity", valence: "advantage", direction: "survive", riskBand: "mid", situation: "lineage", hooks: ["survival", "family"] }),

  a("eth_enclave_password", "在聚居巷裡問一句只有自己人聽得懂的話，換一個今晚能睡的地方", { mood: 1 }, [
    "口音是鑰匙，也是標記。你把音量放低。",
    "門開了一條縫。縫的另一側仍可能要代價。",
  ], {
    age: [8, 90],
    tagPrefixesAny: ["ethnicity_"],
    organicContexts: ["enclave", "discrimination"],
  }, { organic: "ethnicity", valence: "contextual", direction: "bind", riskBand: "mid", situation: "lineage", hooks: ["social", "survival"], weight: 2.2 }),

  a("eth_crowd_read_checkpoint", "關卡或點名隊伍裡，你靠眼色決定何時插隊、何時變成空氣", { mood: -1 }, [
    "市井教過你：活路不在標語上。",
    "你少說了一句正確的話。正確的話這週比較容易被記住。",
  ], {
    age: [12, 90],
    tagsAny: ["trait_urban_crowd_read", "trait_conflict_stillness"],
    organicContexts: ["discrimination", "cultural", "enclave", "conscription", "flight"],
  }, { organic: "ethnicity", valence: "advantage", direction: "survive", riskBand: "high", situation: "lineage", hooks: ["urban", "survival", "war"] }),

  a("eth_draft_short_origin", "徵集處把出身問到第三句時，你把籍貫說成比較不容易被加碼的那種", { mood: -2 }, [
    "血統在這一週變成隊列手續。你把真實的那一段留在牙關後。",
    "有人要你選邊。你選活過這一輪點名。",
  ], {
    age: [18, 48],
    tagsAny: ["lineage_mixed", "socio_war_displacement"],
    tagPrefixesAny: ["ethnicity_"],
    organicContexts: ["conscription", "discrimination"],
  }, { organic: "ethnicity", valence: "contextual", direction: "withdraw", riskBand: "high", situation: "lineage", hooks: ["war", "official", "hide"] }),

  a("eth_flight_pack_first", "逃難隊伍移動前，你按離散家裏的順序把文件、水與能換的東西放最上面", { health: -2, mood: -2 }, [
    "行李是一種判斷。關卡會打開它。你讓他們先看見能過關的東西。",
    "有人笑你小氣。你沒有把族名寫在最外層。",
  ], {
    age: [8, 90],
    tagsAny: ["trait_diaspora_pack", "socio_war_displacement", "lineage_mixed"],
    tagPrefixesAny: ["ethnicity_"],
    organicContexts: ["flight", "discrimination"],
  }, { organic: "ethnicity", valence: "advantage", direction: "survive", riskBand: "high", situation: "lineage", hooks: ["survival", "family", "travel"] }),

  a("eth_layoff_enclave_work", "停工名單出來後，你先問聚居巷裡誰還有當天能換糧的活", { mood: -1, wealth: -1 }, [
    "官方介紹所這週太慢。自己人的工比較碎，也比較先有。",
    "你欠下一句人情。人情比空等復工便宜。",
  ], {
    age: [18, 70],
    tagPrefixesAny: ["ethnicity_"],
    organicContexts: ["unemployment", "enclave"],
  }, { organic: "ethnicity", valence: "contextual", direction: "bind", riskBand: "mid", situation: "lineage", hooks: ["labor", "social"] }),
];
