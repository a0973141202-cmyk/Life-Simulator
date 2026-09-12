import { dailySlice as d } from "./schema.js";

/**
 * Child/teen labor extraction as suffered exploitation, not a career tutorial.
 */

export const TRAUMA_LABOR_SLICES = [
  d({
    id: "tr_lab_hours",
    state: "home_child",
    phase: "site",
    age: [7, 12],
    tagsAny: ["household_extractive", "socio_extreme_poverty", "socio_working_poor"],
    optionText: "被派去超過體力的工：搬、採、看攤、帶幼小，直到天黑仍不准停",
    effects: { wealth: 1, health: -4, mood: -3, intelligence: -1 },
    hooks: ["labor", "family", "trauma", "survival"],
    trauma: { tags: ["trauma_labor_scar", "trauma_parentified"], intensity: 10, domain: "labor" },
    sensory: "手腕的筋在抖。眼睛進沙。你的身高還夠不著某些架子，所以要踩倒過來的盆。",
    procedure: "這不是「幫忙做家事」。工時、產出、被罵的標準都按人手算。受傷用布綁。上學變成可犧牲的項目。工資若有，進大人的口袋。",
    social: "路人可能稱讚能幹。能幹是剝削的公關。你不能拒絕，拒絕就是吃閒飯的證據。",
    logic: "兒童勞動剝削把發育中的身體折現。遊戲不把這寫成刻苦美德。",
    risk: { chance: 0.26, effects: { health: -8, mood: -2 }, text: "扭傷或燙傷。仍被要求做完。學校的缺席由此開始累積。" },
  }),
  d({
    id: "tr_lab_night_shift_kid",
    state: "school_child",
    phase: "night",
    age: [9, 12],
    tagsAny: ["household_extractive"],
    optionText: "夜裏被叫醒去趕工或看攤，再頂著眼皮去上課",
    effects: { health: -3, mood: -3, intelligence: -2, wealth: 1 },
    hooks: ["labor", "night", "trauma", "study"],
    trauma: { tags: ["trauma_labor_scar", "trauma_dissociation"], intensity: 9, domain: "labor" },
    sensory: "油燈或日光燈。你的名字在課堂上被叫到時會慢半拍。",
    procedure: "睡眠被家庭企業徵用。老師說你笨。笨是缺睡的別名。沒有人把這兩件事接在同一張表上。",
    social: "你開始在桌上睡。被罰。罰完回家繼續做。循環看起來像性格，其實是班表。",
    logic: "剝削不需要工廠大門，它只需要一個把孩子當成最後加班人力的家。",
  }),
  d({
    id: "tr_lab_teen_wage_stolen",
    state: "labor_legal",
    phase: "paper",
    age: [18, 70],
    audience: "teen_up",
    tagsAny: ["household_extractive", "trauma_labor_scar"],
    optionText: "看工錢在發薪日轉進家裡，自己留下的部分被叫作孝順",
    effects: { wealth: -2, mood: -4, charm: -1, health: -1 },
    hooks: ["labor", "family", "trauma"],
    trauma: { tags: ["trauma_labor_scar", "trauma_rage_leak", "trauma_cannot_ask_help"], intensity: 9, domain: "labor" },
    sensory: "信封或日結的現金在手裡停留的秒數短到像錯覺。",
    procedure: "你已經能算時薪。你也知道自己沒有帳戶。反抗被道德綁架：家裡養你那麼大。養你與抽走你的時間被算成同一筆帳。",
    social: "同事問你買什麼。你說沒賺什麼。這句話是真的，也是家醜。",
    logic: "對青少年的工資掠奪延續兒童期的產權聲明。獨立被無限期推遲，怒被存成後來的破裂。",
  }),
];
