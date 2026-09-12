/**
 * Word-level atoms for the dynamic prose engine.
 * Not story sentences. Not weekly templates. Just nouns and short clauses
 * keyed by the four pillars (class, body, housing, history thread).
 */

export const FOOD_ATOM = Object.freeze({
  destitute: ["發黴的黑麵包", "糠餅", "清水湯", "樹皮混進鍋的糊"],
  poor: ["冷饅頭", "配給麵包", "隔夜的鍋底", "稀粥"],
  getting_by: ["隔夜飯", "配給本上的那一勺", "能買到的麵"],
  comfortable: ["舖子裏賣不掉的隔夜貨", "米缸底的碎米"],
});

export const LABOR_ATOM = Object.freeze({
  peasant: ["打水", "看場", "鋤地"],
  worker: ["上工", "搬貨", "排隊進廠"],
  artisan: ["交活", "修手藝"],
  merchant: ["看舖", "算帳"],
  intellectual: ["抄寫", "教書或寫稿"],
  official: ["蓋章", "應付上門的人"],
  military: ["出操", "站崗"],
  gentry: ["撐面子", "當東西"],
  immigrant: ["接最晚的工", "翻譯或搬運"],
});

export const BODY_ATOM = Object.freeze({
  edema: ["雙腿腫得發亮，鞋穿不進去", "小腿按下的坑很久才彈回來"],
  fever: ["燒到衣服濕透", "站起來眼前發黑"],
  cough: ["帶痰的咳夜裏醒三次", "傷口在潮氣裏化膿"],
  hunger: ["鍋裡的稀粥見底", "走路沒力氣走完同一條巷"],
  trauma: ["舊傷口一碰就痛", "聽見類似的聲音就發抖"],
});

export const THREAD_ATOM = Object.freeze({
  unemployment: ["失業隊伍排到巷口", "配給窗常關"],
  war: ["徵兵名冊在傳", "逃難的人堵住路口"],
  conscription: ["有人被點去當兵", "家裏藏壯丁"],
  famine: ["糧店時開時關", "樹皮和糠進鍋"],
  purge: ["清點戶口", "半夜敲門抓人"],
  occupation: ["佔領軍或巡邏隊查路", "口音被多問一句"],
});
