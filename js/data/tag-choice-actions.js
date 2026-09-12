/**
 * First-batch tag-driven choices.
 * These options only enter the weekly triad when matching tags are present
 * (or, for tagsNone, when the locking tags are absent).
 */

function a(id, text, effects, followUps, when = {}, extra = {}) {
  return {
    id,
    text,
    effects,
    followUps,
    when,
    weight: extra.weight ?? 4.2,
    tagDriven: true,
    ...extra,
  };
}

const ARCTIC_LOCAL = [
  "ethnicity_inuit",
  "ethnicity_sami",
  "ethnicity_nenets",
  "ethnicity_chukchi",
  "ethnicity_evenki",
  "trait_polar_thermogenesis",
  "hook_arctic",
];

const SEA_LOCAL = [
  "ethnicity_bajau",
  "ethnicity_maori",
  "ethnicity_marshallese",
  "trait_diving_spleen",
  "trait_sea_balance",
  "hook_sea",
];

const TRACK_LOCAL = [
  "ethnicity_san",
  "ethnicity_mongol",
  "trait_long_range_track",
  "hook_tracking",
];

export const TAG_DRIVEN_ACTION_POOL = [
  a("tag_arctic_local_week", "用族裡認路的辦法過這一週的冷與黑", { health: 1, mood: 1 }, [
    "別人問你為什麼不慌。你只是把退路留在身體記得的地方。",
    "雪或風改寫了巷口。你改走一條沒有路牌的路。",
  ], { age: [6, 90], tagsAny: ARCTIC_LOCAL }, {
    direction: "survive", riskBand: "mid", situation: "local", hooks: ["arctic", "survival"],
  }),
  a("tag_sea_local_week", "下到水邊做一件岸上的人不會先想到的事", { health: 1, mood: 1 }, [
    "水比街更熟。你把這一週的缺口補在潮汐裡。",
    "岸上的人看你的背影，以為你在玩。你在找還能吃或還能走的東西。",
  ], { age: [8, 70], tagsAny: SEA_LOCAL }, {
    direction: "survive", riskBand: "mid", situation: "local", hooks: ["sea", "survival"],
  }),
  a("tag_track_local_week", "靠足跡、風向或牲口的氣味把路找回來", { health: -1, mood: 1 }, [
    "斷掉的印子在你眼裡仍是句子。你把它讀完。",
    "你沒有地圖。你有一種被當成落後、卻能讓人活過冬的記性。",
  ], { age: [8, 80], tagsAny: TRACK_LOCAL }, {
    direction: "survive", riskBand: "mid", situation: "local", hooks: ["tracking", "survival"],
  }),
  a("tag_displaced_blend", "把口音與行李收小，讓這一週少被點到名", { mood: -1, health: 1 }, [
    "你學會在隊伍裡站得既在場又不突出。",
    "有人問你從哪來。你答了一個比較不容易惹事的地名。",
  ], { age: [8, 80], tagsAny: ["socio_war_displacement", "socio_working_poor", "lineage_mixed"] }, {
    direction: "withdraw", riskBand: "mid", situation: "street", hooks: ["war", "survival", "scarcity"],
  }),

  a("tag_trauma_scan_exits", "把這一週的門、窗與退路重新數一遍", { mood: -1, health: 1 }, [
    "神經系統要一份地圖才肯睡覺。你給它。",
    "你不是膽小。你只是比別人更早開始計算逃跑的秒數。",
  ], { age: [7, 90], tagsAny: ["trauma_hypervigilance"] }, {
    direction: "survive", riskBand: "low", situation: "trauma", hooks: ["hide", "survival", "night"],
  }),
  a("tag_trauma_hold_flinch", "在聲音響起前先讓身體停住，而不是解釋", { mood: 1, health: -1 }, [
    "肩先縮。你把它當成天氣，不當成罪。",
    "有人笑你過敏。你把這週的力氣省下來，不拿去辯護。",
  ], { age: [6, 90], tagsAny: ["trauma_flinch_body"] }, {
    direction: "withdraw", riskBand: "low", situation: "trauma", hooks: ["body", "health"],
  }),
  a("tag_trauma_swallow_shame", "把想開口的話咽回去，改用把事情做完證明自己還在", { mood: -1, health: -1 }, [
    "羞恥要你消失。你留下一個完成的角落。",
    "你沒有把痛說成故事。你只是把碗洗乾淨。",
  ], { age: [8, 90], tagsAny: ["trauma_shame_core", "trauma_self_blame"] }, {
    direction: "endure", riskBand: "mid", situation: "trauma", hooks: ["family", "social"],
  }),
  a("tag_trauma_move_rage", "把要砸出去的力氣改用在搬一件重的東西", { health: -2, mood: 1 }, [
    "怒意要出口。你給它一塊石頭、一袋米、一扇該關的門。",
    "手還在抖。房間裡沒有因此多一個敵人。",
  ], { age: [10, 80], tagsAny: ["trauma_rage_leak"] }, {
    direction: "defy", riskBand: "mid", situation: "trauma", hooks: ["risk", "street"],
    risk: { chance: 0.18, effects: { health: -4, mood: -2 }, text: "力氣沒有搬完。有東西還是碎了。" },
  }),
  a("tag_trauma_leave_body", "讓意識先離開現場，只留身體把這一小時過完", { mood: -2, health: 1 }, [
    "空白是一種昂貴的麻醉。你知道醒來還要對帳。",
    "有人說你冷。你那時根本不在這間屋子裡。",
  ], { age: [9, 90], tagsAny: ["trauma_dissociation"] }, {
    direction: "withdraw", riskBand: "high", situation: "trauma", hooks: ["night", "wait"],
  }),
  a("tag_trauma_avoid_uniform", "避開任何會點名、穿制服或抬高聲音的走廊", { mood: 1, health: 1 }, [
    "身體先認罪。你把路線改到沒有徽章的那一側。",
    "你少問了一件事。你也少被叫住一次。",
  ], { age: [6, 90], tagsAny: ["trauma_authority_terror"] }, {
    direction: "withdraw", riskBand: "low", situation: "official", hooks: ["official", "hide"],
  }),
  a("tag_trauma_one_needed_sentence", "想靠近時只問一句真正需要的話，不多留", { mood: 1, charm: -1 }, [
    "饑餓要你整個人貼過去。你只伸出一指寬的距離。",
    "問完你就走。親密在這一週被收成手續。",
  ], { age: [8, 90], tagsAny: ["trauma_attachment_starve"] }, {
    direction: "bind", riskBand: "mid", situation: "trauma", hooks: ["family", "social", "empathy"],
  }),
  a("tag_trauma_put_back_duty", "把不該你扛的事放回桌上，即使會被罵", { mood: -1, health: 1 }, [
    "童年被徵用成職務。你這一週試著曠職一次。",
    "有人說你不懂事。你第一次感覺到肩膀空了一點。",
  ], { age: [8, 70], tagsAny: ["trauma_parentified"] }, {
    direction: "defy", riskBand: "mid", situation: "home", hooks: ["family", "survival"],
  }),
  a("tag_any_trauma_no_task_night", "給神經系統一個沒有任務的晚上", { mood: 2, health: 1 }, [
    "警戒、羞恥或空白都還在。你只是不給它們加班。",
    "燈調低。門仍鎖著。這不是痊癒，是停工。",
  ], { age: [8, 90], tagPrefixesAny: ["trauma_"] }, {
    direction: "tend", riskBand: "low", situation: "trauma", hooks: ["night", "health"], weight: 3.4,
  }),

  a("tag_social_feared_sidestep", "把路讓給別人，自己改走沒有燈的那一側", { mood: -1, health: 1 }, [
    "恐懼比辱罵更安靜。你用距離付帳。",
    "有人過馬路。你沒有叫住任何人。",
  ], { age: [10, 90], tagsAny: ["social_feared"] }, {
    direction: "withdraw", riskBand: "mid", situation: "standing", hooks: ["social", "hide"],
  }),
  a("tag_social_shunned_empty_seat", "在被空出的位子裡把該做的事做完，不問為什麼", { mood: -1 }, [
    "椅子少了一張。解釋不會把它變回來。",
    "你把文件或糧食處理完。房間繼續當你不在。",
  ], { age: [10, 90], tagsAny: ["social_shunned"] }, {
    direction: "endure", riskBand: "low", situation: "standing", hooks: ["social"],
  }),
  a("tag_social_cold_no_explain", "不再解釋自己，只把該交的東西交出去", { mood: 1, charm: -1 }, [
    "招呼已經變短。你把句子也剪短。",
    "找零放在桌上。你拿走，不多看一眼。",
  ], { age: [12, 90], tagsAny: ["social_cold"] }, {
    direction: "endure", riskBand: "low", situation: "standing", hooks: ["social"],
  }),
  a("tag_social_trusted_hold_name", "有人把話交給你時，先聽完再決定要不要接", { mood: 1 }, [
    "信用是一種會被用完的家具。你這一週沒有立刻坐上去。",
    "門還開著。你沒有把所有人都請進來。",
  ], { age: [12, 90], tagsAny: ["social_trusted"] }, {
    direction: "bind", riskBand: "low", situation: "standing", hooks: ["social", "empathy"],
  }),
  a("tag_social_courted_gate", "把過於熱情的靠近先擋在門外，看對方要什麼", { mood: -1 }, [
    "靠近你的人通常有自己的帳。你先數門閂。",
    "笑還在。你沒有把名字連同鑰匙一起交出去。",
  ], { age: [14, 90], tagsAny: ["social_courted"] }, {
    direction: "seek", riskBand: "mid", situation: "standing", hooks: ["social", "politics"],
  }),

  a("tag_school_other_road", "今天改走一條比較沒有人堵的路回家", { health: 1, mood: 1 }, [
    "多繞的那十分鐘是買來的安靜。",
    "書包換邊。視線不對上。你活過這一週的放學。",
  ], { age: [7, 17], tagsAny: ["school_bullied", "school_hated"] }, {
    direction: "survive", riskBand: "low", situation: "school", hooks: ["hide", "survival"],
  }),
  a("tag_school_leave_early", "提前離開會被點名或圍住的地方", { mood: 1, charm: -1 }, [
    "缺席有代價。待著的代價你已經算過了。",
    "老師或孩子王的聲音在背後。你沒有回頭。",
  ], { age: [7, 17], tagsAny: ["school_hated", "school_weapon", "school_climate_predatory"] }, {
    direction: "withdraw", riskBand: "mid", situation: "school", hooks: ["hide", "study"],
  }),
  a("tag_school_not_use_power", "你知道自己能讓誰退後——這一週你選擇不用", { mood: 1, charm: -1 }, [
    "手上的餘裕還在。你把它收進口袋。",
    "院子裡的帳沒有因此結清。只是今天沒有新的一筆。",
  ], { age: [8, 17], tagsAny: ["school_bully", "school_ringleader"] }, {
    direction: "endure", riskBand: "low", situation: "school", hooks: ["social"],
  }),

  a("tag_home_shut_before_drink", "酒氣上來前先把自己和能帶走的人關進裡屋", { health: 1, mood: -1 }, [
    "門閂比勸說更早到。你按這個順序活。",
    "外屋的聲音還在。裡屋的呼吸被你數著。",
  ], { age: [6, 70], tagsAny: ["household_alcohol", "household_volatile"] }, {
    direction: "survive", riskBand: "mid", situation: "home", hooks: ["family", "hide", "survival"],
  }),
  a("tag_home_move_breakables", "把能砸到人的東西先挪開，再決定要不要出聲", { health: 1, mood: -1 }, [
    "預防不是原諒。你只是把軌跡改窄。",
    "有人說你神經質。碎裂聲今晚少了一種。",
  ], { age: [7, 80], tagsAny: ["household_volatile", "household_neglect"] }, {
    direction: "tend", riskBand: "low", situation: "home", hooks: ["family", "health"],
  }),

  a("tag_lock_no_uniform_ask", "向穿制服或會點名的人問路、求證", { mood: -1 }, [
    "你把問題交出去。對方的臉決定這週好不好過。",
    "答案來了。你同時被記進某一種名單或某一種視線。",
  ], { age: [8, 70], tagsNone: ["trauma_authority_terror", "social_feared"] }, {
    direction: "seek", riskBand: "mid", situation: "official", hooks: ["official", "ask"], weight: 1.1, tagDriven: true,
  }),
];
