/**
 * Adult social / underworld ecology around the same convict caste.
 * Still no sexual acts against minors. Still not a playable offender path.
 */

import { dailySlice as d } from "./schema.js";

const ADULT = {
  age: [18, 90],
  audience: "adult",
  perpCaste: true,
};

export const SOCIETY_CASTE_SLICES = [
  d({
    ...ADULT,
    id: "uw_caste_refuse",
    state: "underworld_cover",
    phase: "social",
    domain: "crime",
    optionText: "在場子、宿舍或風聲裡看見連黑道也把某一欄罪名推出門外，並決定自己的距離",
    effects: { mood: -2, charm: -1, intelligence: 1 },
    hooks: ["crime", "street", "social"],
    addTags: ["caste_revulsion", "caste_contaminate"],
    caste: { tags: ["caste_revulsion", "caste_contaminate"], intensity: 6 },
    tagsAny: ["path_crime", "acquired_underworld", "acquired_wanted", "acquired_imprisoned"],
    sensory: "茶冷了。有人把一個名字從桌上抹掉，動作比殺人通知更乾淨。",
    procedure: "地下秩序也有不可碰的種姓。不是道德覺醒，是風險：這種人會把警察、記者與私刑同時引來。場子用驅逐維持自己「還算人」的廣告。",
    social: "你若還跟他說話，門會對你關。你若當眾羞辱他，門會對你開一小條縫，縫裡是下一筆更髒的差事。",
    logic: "社會邊緣並不自動接納所有罪犯。對未成年人實施性犯罪的人在非法世界裡往往更沒有棲所。這是殘酷，不是救贖敘事。",
    risk: { chance: 0.18, effects: { charm: -4, mood: -2 }, text: "株連：有人把你的猶豫傳成包庇。下一週的生意少一張桌子。" },
  }),
  d({
    ...ADULT,
    id: "uw_caste_paper",
    state: "underworld_cover",
    phase: "paper",
    domain: "crime",
    optionText: "在報紙、通緝欄或耳語名單上看見那一欄罪名，並處理自己被問「你認不認識」",
    effects: { intelligence: 1, mood: -2, charm: -2 },
    hooks: ["crime", "official", "social"],
    addTags: ["caste_reputation", "caste_contaminate"],
    caste: { tags: ["caste_reputation", "caste_contaminate"], intensity: 6 },
    sensory: "油墨、影印發熱、有人用指甲劃過一個名字。照片被允許存在，細節不被允許展開。",
    procedure: "公共羞辱是法辦之外的第二套刑。鄰居、雇主、同伙用「知不知道」當忠誠測驗。你的答案會被記住比事實更久。",
    social: "澄清需要證人。證人討厭把名字寫進這種句子。於是沉默被讀成有鬼。",
    logic: "聲譽崩裂可以發生在你並非當事人的時候。株連是社會控制，不是真相程序。",
    risk: { chance: 0.15, effects: { charm: -5, mood: -2 }, text: "測驗沒通過。有人把你從活路名單上划掉。" },
  }),
  d({
    ...ADULT,
    id: "uw_caste_street_hit",
    state: "underworld_cover",
    phase: "night",
    domain: "crime",
    optionText: "路過一場針對短碼案件的街頭制裁，選擇看、走、或補一腳",
    effects: { health: -2, mood: -3, charm: -1 },
    hooks: ["crime", "street"],
    addTags: ["caste_witness", "caste_revulsion"],
    caste: { tags: ["caste_witness", "caste_revulsion"], intensity: 8 },
    trauma: { tags: ["trauma_flinch_body"], intensity: 5, domain: "authority" },
    sensory: "巷口的聲音先到。有人喊罪名當加油。真正的判決不在這裡開庭。",
    procedure: "私刑把法庭省略。結束以後會有人報警，也會有人擦鞋。你的鞋印若留下，兩套系統都可能來找。",
    social: "地下與街上的人用這場表演劃線。線的這一側自稱正常人。正常人今晚也可以很用力。",
    logic: "遊戲記錄這套額外刑罰的存在與傳染。不提供快感配樂，也不把受害者（被打的那個定罪者）寫成可消費的笑料。",
    risk: { chance: 0.24, effects: { health: -7, charm: -3 }, text: "圍觀的人越靠越近。看的人裡開始有人伸手打。" },
  }),
];
