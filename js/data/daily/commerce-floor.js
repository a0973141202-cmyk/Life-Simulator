import { dailySlice as d } from "./schema.js";

/**
 * Shop floor / stall / small trade daily: cash, customers, inventory anxiety.
 */

export const COMMERCE_FLOOR_SLICES = [
  d({
    id: "cf_open_shutter",
    state: "commerce_floor",
    phase: "dawn",
    age: [18, 75],
    audience: "adult",
    optionText: "拉門、灑水、把第一批貨擺成「還在做生意」的樣子",
    effects: { health: -1, wealth: 1, mood: -1 },
    sensory: "鐵門的鏽、紙箱油墨、昨天沒 sweep 乾淨的油。手在冷裡先痛。",
    procedure: "開店不是儀式，是趕在同業之前被看見。缺貨要先用空盒撐場面。收銀的零錢必須對，因為第一筆帳錯了會錯一天。",
    social: "隔壁的人用點頭計算你還能撐幾個月。討債與送貨都挑這個時段，因為你逃不掉。",
    logic: "小商業把睡眠切在日出之前。門開著，才有被市場審判的資格。",
  }),
  d({
    id: "cf_customer_face",
    state: "commerce_floor",
    phase: "site",
    age: [18, 72],
    audience: "adult",
    optionText: "把笑、殺價、識假鈔與忍辱過成同一套肌肉",
    effects: { charm: 2, wealth: 1, health: -1, mood: -1 },
    sensory: "找零的金屬聲、顧客的香水或汗、假笑拉緊的顴骨。",
    procedure: "客人永遠對。罵是服務的一部分。偷竊從薪水扣。熟客要欠，生客要防。你學會用「老闆不在」擋住無法答應的價。",
    social: "街坊閒話能讓一個攤死。你必須知道誰的親戚在市場管理處。",
    logic: "零售把人格當成包裝紙。包裝破了，貨還在也賣不掉。",
  }),
  d({
    id: "cf_count_drawer",
    state: "commerce_floor",
    phase: "paper",
    age: [18, 70],
    audience: "adult",
    optionText: "打烊後對數、對進貨、把短少先算成自己的錯",
    effects: { intelligence: 2, mood: -2, wealth: 0 },
    sensory: "鈔票的油、計算器的塑料鍵、帳本邊角捲起。燈只留一盞。",
    procedure: "短少沒有保險。可能是偷、可能是算錯、可能是家人先拿走。你數兩遍，因為第三遍開始想逃。稅與保護費若存在，會在這一刻變成具體的數字。",
    social: "合夥的人用「我們」這個詞的時候，通常在分風險給你。",
    logic: "現金生意的核心勞動是清點。它看起來像貪婪，運作起來是沒有法院的會計。",
  }),
  d({
    id: "cf_rent_day",
    state: "commerce_floor",
    phase: "wait",
    age: [18, 68],
    audience: "adult",
    optionText: "在收租或收利息的人到來之前，把能湊的現金湊齊",
    effects: { wealth: -2, mood: -2, intelligence: 1, charm: 1 },
    sensory: "口袋裡紙幣的厚度不夠。茶要先泡給來人。",
    procedure: "租與高利貸都按日羞辱。拖延換來的不是體諒，是下次帶更多人來。你把家用和貨款在腦子裡對倒，看哪一邊能再欠一週。",
    social: "來收的人可能認識你小孩的學校。這是抵押，不是閒聊。",
    logic: "小資本活在到期日之間。所謂勤快，是把到期日再推一寸。",
    addTags: ["adult_debt"],
    hooks: ["daily", "commerce"],
  }),
];
