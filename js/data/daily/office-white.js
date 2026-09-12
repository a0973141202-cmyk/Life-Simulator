import { dailySlice as d } from "./schema.js";

/**
 * White-collar / clerical daily camouflage: attendance, meetings, corridors.
 */

export const OFFICE_WHITE_SLICES = [
  d({
    id: "ow_badge",
    state: "office_white",
    phase: "dawn",
    age: [18, 70],
    audience: "adult",
    optionText: "卡鐘、工牌、把臉在進門時調成「已出勤」",
    effects: { mood: -1, charm: 1, health: -1 },
    sensory: "消毒水、電梯鏡子、還沒散的口腔噴霧。工牌繩勒進脖子的那一圈。",
    procedure: "遲到以分鐘計價。準時只是不被點名。你在閘機前檢查口袋，像通過一道不盤問的海關。電腦開機的時間被算進你願意被擁有的部分。",
    social: "同一班電梯裡的人互道早安，內容是確認彼此還在編制內。被裁的位置在兩週內會換上另一張臉。",
    logic: "白領的身體被賣成出勤紀錄。所謂專業，是把疲勞藏進會議室能接受的表情。",
  }),
  d({
    id: "ow_meeting",
    state: "office_white",
    phase: "site",
    age: [18, 68],
    audience: "adult",
    optionText: "開會：點頭、記誰能打斷誰、把發言權當成職等",
    effects: { intelligence: 1, charm: 1, mood: -1 },
    sensory: "投影的熱、空調直吹後頸、咖啡因在胃裡發酸。筆電螢幕是盾。",
    procedure: "議程是表演。決定在會前或會後。你要在正確的時候笑，在錯誤的時候不要補充。被點名答覆時，答案要像已經請示過。",
    social: "抄送清單比座位圖誠實。你開始知道誰的沉默是權力，誰的沉默是恐懼。",
    logic: "會議把等級製做成參與感。基層賣的是在場，不是判斷。",
  }),
  d({
    id: "ow_lunch_desk",
    state: "office_white",
    phase: "meal",
    age: [18, 65],
    audience: "adult",
    optionText: "在工位吃飯，螢幕仍亮，把午休過成沒被看見的加班",
    effects: { health: -2, wealth: -1, mood: -1 },
    sensory: "便當的油、鍵盤縫的屑、別人微波爐裡魚的味道。",
    procedure: "外出吃飯會被讀成不忙。忙是忠誠的外形。你邊咀嚼邊回訊息，胃部學會在壓力下工作。",
    social: "一起出門的小圈子是派系的午餐版。沒人叫你時，你就屬於可以被延長工時的那一類。",
    logic: "無償的進食時間是企業把生命週期壓進工位的方式之一。",
  }),
  d({
    id: "ow_last_mail",
    state: "office_white",
    phase: "night",
    age: [18, 62],
    audience: "adult",
    optionText: "在「最後一封郵件」之後繼續回，直到大樓只剩保全",
    effects: { wealth: 1, health: -3, intelligence: 1, mood: -2 },
    sensory: "螢幕的藍、空走廊的聲控燈、冰箱裡過期的牛奶。",
    procedure: "加班申請如果存在，也常被勸你別提。準時離開的人會在考績裡變成「投入不足」。你把私人消息留到地鐵裡回，因為工作帳號被假定全天醒著。",
    social: "主管的一則「在嗎」比法律上的工時有效。你回了，就完成一次自願。",
    logic: "知識勞動用責任感提取無償時間。過勞看起來像上進，直到身體開單。",
    addTags: ["adult_burnout"],
    hooks: ["daily", "office", "work"],
  }),
];
