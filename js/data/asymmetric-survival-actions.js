/**
 * Asymmetric survival: mainstream choices stay desperate or nearly impossible;
 * matching minority / extreme / trauma / feared tags can unlock a specialized exit.
 */

function a(id, text, effects, followUps, when, extra = {}) {
  return {
    id,
    text,
    effects,
    followUps,
    when,
    weight: extra.weight ?? 4.6,
    tagDriven: true,
    crisis: extra.crisis !== false,
    asymmetric: extra.asymmetric || "specialized",
    ...extra,
    lane: extra.lane || "survival",
  };
}

const MINORITY_OR_MIXED = [
  "lineage_mixed",
  "socio_war_displacement",
  "socio_immigrant_insecurity",
  "socio_refugee_camp",
];

const EXTREME_COLD = [
  "ethnicity_inuit", "ethnicity_sami", "ethnicity_nenets", "ethnicity_chukchi", "ethnicity_evenki",
  "trait_polar_thermogenesis", "hook_arctic", "current_env_extreme_cold", "current_env_polar_night",
];

const EXTREME_HEAT = [
  "trait_heat_slender_build", "trait_humidity_pace", "trait_desert_thrift",
  "hook_desert", "current_env_extreme_heat",
];

const SEA_BODY = [
  "ethnicity_bajau", "ethnicity_maori", "ethnicity_marshallese",
  "trait_diving_spleen", "trait_sea_balance", "hook_sea",
];

const TRACK_BODY = [
  "ethnicity_san", "ethnicity_mongol", "trait_long_range_track", "hook_tracking",
];

const POVERTY = ["socio_extreme_poverty", "socio_working_poor"];

const FEARED = ["social_feared", "social_shunned", "trauma_authority_terror"];

const BULLY_ORDER = ["school_bully", "school_ringleader", "school_enforcer", "caste_enforcer"];

export const ASYMMETRIC_SURVIVAL_POOL = [
  a("asym_main_explain_life", "向檢查的人把身世、行程與口袋從頭講清楚", { charm: 1, mood: -2, health: -1 }, [
    "你把能說的都說了。對方要的不一定是真相。",
    "解釋變長。隊伍沒有因此對你更軟。",
  ], { age: [10, 90] }, {
    asymmetric: "mainstream",
    direction: "seek",
    riskBand: "high",
    situation: "official",
    hooks: ["official", "ask"],
    weight: 1.4,
    risk: { chance: 0.42, effects: { health: -8, charm: -4, mood: -3 }, text: "話被聽成謊。你被叫出隊伍，或被抄進另一張紙。" },
  }),

  a("asym_main_queue_shove", "在發放或逃難的隊伍裡用力氣往前擠", { health: -3, wealth: 1, mood: -2 }, [
    "前面的人更餓。你的力氣不夠改隊伍的幾何。",
    "你擠到一個能看見桌子的位置。手仍可能空著回來。",
  ], { age: [10, 90] }, {
    asymmetric: "mainstream",
    direction: "defy",
    riskBand: "high",
    situation: "crisis",
    hooks: ["scarcity", "street"],
    weight: 1.3,
    risk: { chance: 0.48, effects: { health: -10, mood: -3 }, text: "擠壓先傷人。份額沒有因此變成你的。" },
  }),

  a("asym_main_wait_help", "停在看得見的地方等有人來救或來發東西", { mood: -2, health: -2 }, [
    "被看見有時等於被優先。有時等於被先帶走。",
    "救援按名單與距離來。你的等待不改這兩樣。",
  ], { age: [6, 90] }, {
    asymmetric: "mainstream",
    direction: "endure",
    riskBand: "high",
    situation: "crisis",
    hooks: ["wait", "survival"],
    weight: 1.2,
    risk: { chance: 0.36, effects: { health: -9, mood: -3 }, text: "沒有人按你的時間到達。冷、熱或饑餓先結算。" },
  }),

  a("asym_spec_second_tongue", "用另一種語言、沒畫在官圖上的路繞過檢查", { intelligence: 1, health: -1, mood: -1 }, [
    "主流的隊伍還在解釋。你已經走在他們不看的那一側。",
    "口音在這裡是罪證，也是鑰匙。你選了鑰匙的那一面。",
  ], {
    age: [10, 90],
    tagsAny: MINORITY_OR_MIXED,
    tagPrefixesAny: ["ethnicity_"],
  }, {
    organic: "ethnicity",
    valence: "advantage",
    direction: "survive",
    riskBand: "mid",
    situation: "official",
    hooks: ["language", "hide", "survival"],
    weight: 6.2,
    risk: { chance: 0.18, effects: { health: -6, charm: -2 }, text: "繞路仍被看見。只是比正面解釋少被問一句。" },
  }),

  a("asym_spec_arctic_cache", "按族裡藏糧、認冰或數風的辦法過這一週的冷", { health: 2, mood: -1 }, [
    "等人來救的人還在發抖。你去找雪下仍能吃或仍能燃的東西。",
    "這在溫帶的課堂裡叫落後。在這一週它叫活著。",
  ], {
    age: [7, 90],
    tagsAny: EXTREME_COLD,
  }, {
    organic: "gene",
    valence: "advantage",
    direction: "survive",
    riskBand: "mid",
    situation: "weather",
    hooks: ["arctic", "survival"],
    weight: 6.4,
    risk: { chance: 0.16, effects: { health: -5 }, text: "冰面或風向仍可能改。你只是比等待多一個計畫。" },
  }),

  a("asym_spec_heat_pace", "酷熱裡把步子切成自己的配速，不跟隊伍比誰先到蔭", { health: 2, mood: -1 }, [
    "正午是敵人。你的身體比口號早學會這件事。",
    "別人已經中暑。你還能把水省到下一站。",
  ], {
    age: [8, 90],
    tagsAny: EXTREME_HEAT,
  }, {
    organic: "gene",
    valence: "advantage",
    direction: "endure",
    riskBand: "low",
    situation: "weather",
    hooks: ["desert", "survival"],
    weight: 6.1,
  }),

  a("asym_spec_sea_backwater", "從水邊、潮溝或船縫走一條岸上的人不會先想到的路", { health: 1, intelligence: 1 }, [
    "檢查哨看路。潮汐看你。",
    "衣服濕了。名字暫時沒被抄。",
  ], {
    age: [8, 80],
    tagsAny: SEA_BODY,
  }, {
    direction: "survive",
    riskBand: "mid",
    situation: "local",
    hooks: ["sea", "hide", "survival"],
    weight: 6.0,
    risk: { chance: 0.2, effects: { health: -7 }, text: "水比記憶深。你仍比正面衝卡少被問一次。" },
  }),

  a("asym_spec_track_ghost", "靠足跡、風向或牲口的氣味把封鎖線讀成可以繞的句子", { health: -1, intelligence: 2 }, [
    "官圖是白的。地面不是。",
    "你沒有英雄的速度。你有一種被當成過時、卻能讓人活過冬的記性。",
  ], {
    age: [8, 85],
    tagsAny: TRACK_BODY,
  }, {
    direction: "survive",
    riskBand: "mid",
    situation: "local",
    hooks: ["tracking", "survival"],
    weight: 5.8,
  }),

  a("asym_spec_poverty_seams", "把能吃、能換或能藏的邊角縫進衣裡，不跟隊伍搶第一個位置", { health: 1, wealth: 1, mood: -1 }, [
    "體面的人還在排隊講理。你先保住明天早上的那一口。",
    "邊角不是偷。它是這一週還沒被登記的餘糧。",
  ], {
    age: [7, 90],
    tagsAny: POVERTY,
  }, {
    organic: "ethnicity",
    valence: "advantage",
    direction: "survive",
    riskBand: "mid",
    situation: "crisis",
    hooks: ["scarcity", "survival"],
    weight: 6.0,
    risk: { chance: 0.14, effects: { charm: -3, mood: -2 }, text: "有人看見你的衣縫。閒話比糧食先到。" },
  }),

  a("asym_spec_trauma_blank", "讓身體走它認得的最短逃路，一句話也不解釋", { health: 1, mood: -2, charm: -2 }, [
    "神經系統比證件早決定方向。你服從它。",
    "旁人看你冷。你那時根本不在他們的句子裡。",
  ], {
    age: [7, 90],
    tagPrefixesAny: ["trauma_"],
    tagsAny: FEARED,
  }, {
    direction: "withdraw",
    riskBand: "mid",
    situation: "trauma",
    hooks: ["hide", "survival", "night"],
    weight: 5.9,
  }),

  a("asym_spec_feared_shadow", "走人們已經不敢跟的那條巷，用被怕當成掩護", { health: 1, charm: -2, mood: -1 }, [
    "恐懼把路讓出來。你走空出來的那一側。",
    "這不是威望。這是他們寧願當你不存在。",
  ], {
    age: [12, 90],
    tagsAny: FEARED,
  }, {
    direction: "survive",
    riskBand: "mid",
    situation: "street",
    hooks: ["hide", "street", "survival"],
    weight: 5.7,
    risk: { chance: 0.22, effects: { health: -6, mood: -2 }, text: "空巷也有人等。只是比大街少一排眼睛。" },
  }),

  a("asym_spec_bully_order", "用院子或道上認得的秩序換一條不被點名的活路", { charm: -1, mood: -1, health: 1 }, [
    "主流的規矩要你低頭求。你改用他們也怕的那種安靜。",
    "這條路離經叛道。它讓你今晚不必躺在名單上。",
  ], {
    age: [12, 80],
    tagsAny: BULLY_ORDER,
    tagPrefixesAny: ["caste_"],
  }, {
    direction: "defy",
    riskBand: "high",
    situation: "street",
    hooks: ["street", "survival"],
    weight: 5.5,
    risk: { chance: 0.28, effects: { health: -5, charm: -3 }, text: "秩序反咬。你換到的活路比想像窄。" },
  }),

  a("asym_spec_wanted_holes", "鑽戶籍與地圖都不畫的空隙過這一週", { health: -1, intelligence: 1, mood: -1 }, [
    "正面自首是給有體面的人留的。你走縫。",
    "縫會記你。但這一週沒有人按門牌找到你。",
  ], {
    age: [16, 90],
    tagPrefixesAny: ["crime_", "ledger_"],
    tagsAny: ["acquired_imprisoned", "social_feared"],
  }, {
    direction: "survive",
    riskBand: "high",
    situation: "crisis",
    hooks: ["hide", "crime", "survival"],
    weight: 5.4,
    consequence: { heat: -6, wanted: -1, trust: -2, eventLabel: "鑽縫" },
    risk: { chance: 0.3, effects: { health: -8, wealth: -2 }, text: "縫被補上。你比開門解釋晚被找到一步。" },
  }),

  a("asym_spec_frail_still", "用少消耗的方式過卡：不跑、不爭、只佔一個不容易被注意的角度", { health: 2, mood: -1 }, [
    "精壯的人還在比誰能擠到桌前。你比誰先倒下。",
    "病弱在這一週不是弱點。它讓你不被當成威脅。",
  ], {
    age: [6, 90],
    tagsAny: ["socio_extreme_poverty"],
    tagPrefixesAny: ["condition_", "risk_"],
    stats: { health: [0, 42] },
  }, {
    direction: "endure",
    riskBand: "low",
    situation: "crisis",
    hooks: ["health", "hide", "survival"],
    weight: 5.6,
  }),

  a("asym_spec_local_face", "走還肯認你的那一扇側門，不跟官隊解釋自己是誰", { charm: 1, health: 1 }, [
    "威望在這裏不是獎狀。它是一扇不必排隊的門。",
    "有人點頭。你沒有把這點頭說成命運。",
  ], {
    age: [10, 90],
    tagsAny: ["social_trusted", "social_courted"],
  }, {
    direction: "survive",
    riskBand: "low",
    situation: "local",
    hooks: ["social", "survival"],
    weight: 5.8,
  }),

  a("asym_spec_craft_hand", "用家裏傳下的手藝換一口糧、一條縫或一個不記名的忙", { intelligence: 1, wealth: 1 }, [
    "檢查的人看證件。師傅看手。",
    "這一週你沒有去爭我是誰。你讓手指先說話。",
  ], {
    age: [8, 90],
    tagsAny: [
      "trait_craft_finger",
      "parent_trait_fine_motor",
      "parent_trait_mechanical_intuition",
      "parent_trait_calm_hands",
      "parent_trait_green_thumb",
    ],
  }, {
    direction: "transact",
    riskBand: "low",
    situation: "local",
    hooks: ["craft", "trade", "survival"],
    weight: 5.7,
  }),

  a("asym_spec_war_shadow", "按逃過一次的人認得的巷、溝或時間差過這一週的點名", { health: 1, intelligence: 1, mood: -1 }, [
    "正面報到是給還相信名單的人留的。你走陰影。",
    "流離教過的不是勇氣。是哪一段牆比較不容易被看見。",
  ], {
    age: [8, 90],
    tagsAny: ["socio_war_displacement", "socio_refugee_camp", "hook_war", "world_stray_fire", "world_border_run"],
  }, {
    direction: "survive",
    riskBand: "mid",
    situation: "crisis",
    hooks: ["war", "hide", "survival"],
    weight: 6.0,
    risk: { chance: 0.2, effects: { health: -7 }, text: "陰影也被掃過。你只是比站在隊伍正中晚被叫到。" },
  }),

  a("asym_spec_household_ear", "屋裡的氣味先告訴你今晚該關門、該藏還是該先走", { health: 1, mood: -1 }, [
    "官方還在敲門。你已經按家裏的前奏做完決定。",
    "這不是膽小。是你比勸說更早聽見瓶子與腳步。",
  ], {
    age: [6, 90],
    tagPrefixesAny: ["household_"],
  }, {
    direction: "survive",
    riskBand: "mid",
    situation: "family",
    hooks: ["family", "hide", "survival"],
    weight: 5.8,
  }),
];
