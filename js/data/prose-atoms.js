/**
 * Word-level atoms for the dynamic prose engine.
 * Not story sentences. Not weekly templates. Just nouns and short clauses
 * keyed by the four pillars (class, body, housing, history thread).
 */

export const FOOD_ATOM = Object.freeze({
  destitute: ["糠餅", "清水湯", "樹皮混進鍋的糊", "發黴的冷飯"],
  poor: ["冷饅頭", "隔夜的鍋底", "稀粥", "冷飯"],
  getting_by: ["隔夜飯", "能買到的麵", "鍋裡剩下的粥"],
  comfortable: ["舖子裏賣不掉的隔夜貨", "米缸底的碎米"],
});

/** Staple food by geography. Bread only where bread was the daily grain. */
export const FOOD_BY_REGION = Object.freeze({
  china_north: {
    destitute: "糠餅或樹皮糊",
    poor: "冷饅頭或稀粥",
    getting_by: "隔夜的窩頭或粥",
    comfortable: "米缸底的碎米",
  },
  china_south: {
    destitute: "發黴的冷飯或番薯",
    poor: "冷飯或稀粥",
    getting_by: "隔夜飯",
    comfortable: "米缸底的碎米",
  },
  taiwan: {
    destitute: "番薯籤或稀粥",
    poor: "冷飯或稀粥",
    getting_by: "隔夜飯",
    comfortable: "米缸底的碎米",
  },
  se_asia: {
    destitute: "發黴的冷飯或木薯",
    poor: "冷飯或稀粥",
    getting_by: "隔夜的飯",
    comfortable: "還能買到的米",
  },
  south_asia: {
    destitute: "稀粥或發黴的冷飯",
    poor: "冷飯或扁麵",
    getting_by: "隔夜的飯",
    comfortable: "還能買到的麵餅",
  },
  africa: {
    destitute: "木薯糊或小米湯",
    poor: "小米糊或稀粥",
    getting_by: "隔夜的糊",
    comfortable: "還能買到的穀物",
  },
  west: {
    destitute: "發黴的黑麵包或清湯",
    poor: "配給麵包或冷湯",
    getting_by: "隔夜的麵包",
    comfortable: "舖子裏賣不掉的隔夜貨",
  },
  russia: {
    destitute: "發黴的黑麵包或糠",
    poor: "黑麵包或清湯",
    getting_by: "隔夜的麵包",
    comfortable: "還能換到的麥",
  },
  latin_america: {
    destitute: "稀粥或冷玉米餅",
    poor: "冷玉米餅或稀粥",
    getting_by: "隔夜的玉米餅",
    comfortable: "還能買到的豆和玉米",
  },
  middle_east: {
    destitute: "扁麵包皮或稀粥",
    poor: "扁麵包或稀粥",
    getting_by: "隔夜的餅",
    comfortable: "還能買到的麵",
  },
  japan: {
    destitute: "稀粥或番薯",
    poor: "冷飯或稀粥",
    getting_by: "隔夜飯",
    comfortable: "米缸底的碎米",
  },
  korea: {
    destitute: "稀粥或糠",
    poor: "冷飯或稀粥",
    getting_by: "隔夜飯",
    comfortable: "米缸底的碎米",
  },
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
  unemployment: ["失業隊伍排到巷口", "糧店常關"],
  war: ["徵兵名冊在傳", "逃難的人堵住路口"],
  conscription: ["有人被點去當兵", "家裏藏壯丁"],
  famine: ["糧店時開時關", "樹皮和糠進鍋"],
  purge: ["清點戶口", "半夜敲門抓人"],
  occupation: ["佔領軍或巡邏隊查路", "口音被多問一句"],
});
