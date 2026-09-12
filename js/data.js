import { YEAR_MAX, YEAR_MIN } from "./constants.js";
import { findSettlement, getSettlementDisplayName } from "./settlements.js";

export const CITIES = [
  {
    id: "shanghai",
    names: [{ from: 1920, to: YEAR_MAX, name: "上海" }],
    region: "china",
    country: "中國",
    flavor: "十里洋場與里弄煙火交疊的港口都市",
    tags: ["口岸", "都會", "商業"],
    weight: 12,
  },
  {
    id: "beijing",
    names: [
      { from: 1920, to: 1927, name: "北京" },
      { from: 1928, to: 1948, name: "北平" },
      { from: 1949, to: YEAR_MAX, name: "北京" },
    ],
    region: "china",
    country: "中國",
    flavor: "宮牆、胡同與政治風向標同時存在的北方古都",
    tags: ["古都", "政治", "北方"],
    weight: 11,
  },
  {
    id: "guangzhou",
    names: [{ from: 1920, to: YEAR_MAX, name: "廣州" }],
    region: "china",
    country: "中國",
    flavor: "珠水商船與白話街市終年熱鬧",
    tags: ["南方", "商業", "口岸"],
    weight: 8,
  },
  {
    id: "chongqing",
    names: [{ from: 1920, to: YEAR_MAX, name: "重慶" }],
    region: "china",
    country: "中國",
    flavor: "山城霧氣濃重，江岸階梯層層疊疊",
    tags: ["內陸", "山城", "江河"],
    weight: 7,
  },
  {
    id: "wuhan",
    names: [{ from: 1920, to: YEAR_MAX, name: "武漢" }],
    region: "china",
    country: "中國",
    flavor: "江漢交匯，碼頭號子與工廠汽笛此起彼落",
    tags: ["江城", "交通", "工業"],
    weight: 7,
  },
  {
    id: "harbin",
    names: [{ from: 1920, to: YEAR_MAX, name: "哈爾濱" }],
    region: "china",
    country: "中國",
    flavor: "冰雪、中東鐵路與俄式街景混成獨特的北國氣味",
    tags: ["東北", "鐵路", "寒帶"],
    weight: 5,
  },
  {
    id: "taipei",
    names: [{ from: 1920, to: YEAR_MAX, name: "臺北" }],
    region: "taiwan",
    country: "臺灣",
    flavor: "盆地濕熱，街巷從日式町名慢慢換成中文門牌",
    tags: ["島嶼", "盆地", "東亞"],
    weight: 8,
  },
  {
    id: "hongkong",
    names: [{ from: 1920, to: YEAR_MAX, name: "香港" }],
    region: "hongkong",
    country: "香港",
    flavor: "維港燈火、山城木屋與輪船汽笛終年不息",
    tags: ["口岸", "殖民", "都會"],
    weight: 8,
  },
  {
    id: "tokyo",
    names: [{ from: 1920, to: YEAR_MAX, name: "東京" }],
    region: "japan",
    country: "日本",
    flavor: "從震災廢墟到電氣招牌，節奏極快的東亞首都",
    tags: ["都會", "東亞", "工業"],
    weight: 6,
  },
  {
    id: "newyork",
    names: [{ from: 1920, to: YEAR_MAX, name: "紐約" }],
    region: "west",
    country: "美國",
    flavor: "摩天樓、移民碼頭與永不熄燈的街區",
    tags: ["都會", "移民", "西方"],
    weight: 7,
  },
  {
    id: "london",
    names: [{ from: 1920, to: YEAR_MAX, name: "倫敦" }],
    region: "west",
    country: "英國",
    flavor: "霧、磚牆與茶氣裡的帝國餘暉",
    tags: ["都會", "西方", "霧都"],
    weight: 5,
  },
  {
    id: "paris",
    names: [{ from: 1920, to: YEAR_MAX, name: "巴黎" }],
    region: "west",
    country: "法國",
    flavor: "咖啡館、畫室與一再改寫的街道政治",
    tags: ["都會", "西方", "文化"],
    weight: 5,
  },
  {
    id: "berlin",
    names: [{ from: 1920, to: YEAR_MAX, name: "柏林" }],
    region: "west",
    country: "德國",
    flavor: "斷裂與重建反覆發生的中歐都會",
    tags: ["都會", "西方", "政治"],
    weight: 4,
  },
  {
    id: "moscow",
    names: [{ from: 1920, to: YEAR_MAX, name: "莫斯科" }],
    region: "russia",
    country: "蘇聯/俄羅斯",
    flavor: "紅場風雪與集體節奏極重的北方都城",
    tags: ["都會", "寒冷", "政治"],
    weight: 4,
  },
  {
    id: "singapore",
    names: [{ from: 1920, to: YEAR_MAX, name: "新加坡" }],
    region: "se_asia",
    country: "新加坡",
    flavor: "熱風、港口與多語街市擠在熱帶島嶼上",
    tags: ["口岸", "熱帶", "移民"],
    weight: 5,
  },
];

export const FAMILY_CLASSES = [
  {
    id: "peasant",
    label: "貧農",
    weight: 24,
    tags: ["農村", "勞力", "貧困", "土地"],
    flavor: "家裡幾乎沒有餘糧，孩子從小就認得田埂與饑餓。",
    stats: {
      health: [48, 72],
      intelligence: [22, 48],
      wealth: [4, 18],
      charm: [28, 52],
      mood: [28, 52],
    },
  },
  {
    id: "artisan",
    label: "工匠",
    weight: 14,
    tags: ["手藝", "作坊", "市井"],
    flavor: "屋裡常年有鋸末或針線氣味，手藝是家裡唯一的護身符。",
    stats: {
      health: [52, 74],
      intelligence: [32, 58],
      wealth: [18, 38],
      charm: [34, 58],
      mood: [38, 62],
    },
  },
  {
    id: "worker",
    label: "工人",
    weight: 16,
    tags: ["工廠", "勞工", "城市"],
    flavor: "汽笛比雞鳴更準時，工資按日或按週發，生活緊貼機器節奏。",
    stats: {
      health: [46, 70],
      intelligence: [28, 54],
      wealth: [12, 32],
      charm: [30, 54],
      mood: [32, 56],
    },
  },
  {
    id: "merchant",
    label: "商賈",
    weight: 12,
    tags: ["商業", "資本", "流動"],
    flavor: "帳冊、秤砣與人情同樣重要，家裡說話總離不開行情。",
    stats: {
      health: [50, 72],
      intelligence: [40, 66],
      wealth: [48, 78],
      charm: [48, 74],
      mood: [42, 66],
    },
  },
  {
    id: "intellectual",
    label: "知識分子",
    weight: 10,
    tags: ["書香", "學識", "輿論"],
    flavor: "書架比飯桌更擠，家裡相信字能改命，也怕字會惹禍。",
    stats: {
      health: [44, 68],
      intelligence: [62, 88],
      wealth: [22, 48],
      charm: [42, 68],
      mood: [36, 60],
    },
  },
  {
    id: "official",
    label: "官員世家",
    weight: 7,
    tags: ["權貴", "人脈", "體制"],
    flavor: "門檻內外規矩不同，孩子很早學會察言觀色。",
    stats: {
      health: [52, 74],
      intelligence: [50, 76],
      wealth: [50, 78],
      charm: [52, 78],
      mood: [40, 64],
    },
  },
  {
    id: "military",
    label: "軍人家庭",
    weight: 8,
    tags: ["軍旅", "紀律", "動盪"],
    flavor: "靴聲、口令和突然的遷徙是童年背景音。",
    stats: {
      health: [58, 82],
      intelligence: [32, 58],
      wealth: [16, 42],
      charm: [36, 62],
      mood: [30, 56],
    },
  },
  {
    id: "gentry",
    label: "舊族遺緒",
    weight: 4,
    tags: ["舊族", "禮教", "沒落"],
    flavor: "廳堂還掛著發黃的字畫，體面與空帳簿並存在同一個屋簷下。",
    stats: {
      health: [48, 70],
      intelligence: [48, 74],
      wealth: [28, 62],
      charm: [56, 82],
      mood: [34, 58],
    },
  },
  {
    id: "immigrant",
    label: "移民家庭",
    weight: 5,
    tags: ["移民", "雙鄉", "漂泊"],
    flavor: "家裡同時說兩種口音，箱子永遠比家具更像家。",
    stats: {
      health: [50, 74],
      intelligence: [36, 64],
      wealth: [10, 36],
      charm: [40, 68],
      mood: [28, 54],
    },
  },
];

const SURNAMES_ZH = [
  "陳", "林", "黃", "張", "李", "王", "吳", "劉", "蔡", "楊",
  "許", "鄭", "謝", "郭", "洪", "邱", "曾", "廖", "賴", "徐",
  "周", "葉", "蘇", "莊", "江", "呂", "何", "羅", "高", "蔡",
];

const GIVEN_ZH = [
  "安", "寧", "遠", "舟", "秋", "衡", "明", "華", "芳", "文",
  "傑", "婷", "浩", "雪", "平", "蘭", "誠", "慧", "峰", "晴",
  "博", "雅", "霖", "萱", "磊", "瑜", "翔", "瑾", "凱", "柔",
];

const GIVEN_WEST = [
  "Helen", "Arthur", "Marie", "James", "Clara", "David", "Eva", "Paul",
  "Anna", "George", "Sophie", "Henry", "Lena", "Thomas", "Nina", "Robert",
];

const SURNAMES_WEST = [
  "Miller", "Cohen", "Dubois", "Keller", "Bennett", "Rossi", "Walsh", "Berg",
];

const GIVEN_JP = ["浩", "明", "陽子", "健", "惠", "誠", "咲", "悠"];
const SURNAMES_JP = ["佐藤", "鈴木", "高橋", "田中", "伊藤", "渡邊", "山本"];

export const ERAS = [
  {
    id: "twenties",
    from: 1920,
    to: 1929,
    name: "狂飆與裂縫的二〇年代",
    summary: "戰後新節奏、電台與都會娛樂興起，底層生活卻仍被饑荒、軍閥與殖民秩序捆住。",
    tags: ["戰後", "電台", "都會"],
    mood: "喧囂而不穩",
  },
  {
    id: "thirties",
    from: 1930,
    to: 1939,
    name: "蕭條與備戰的三〇年代",
    summary: "經濟崩潰沿著港口與農村擴散，街頭口號變多，徵兵、空襲與逃難的消息一天比一天近。",
    tags: ["蕭條", "備戰", "失業"],
    mood: "緊縮",
  },
  {
    id: "forties",
    from: 1940,
    to: 1945,
    name: "總力戰的四〇年代前半",
    summary: "空襲、配給、逃亡與徵召改寫日常。活著本身就是一種運氣。",
    tags: ["戰爭", "配給", "流離"],
    mood: "危殆",
  },
  {
    id: "postwar",
    from: 1946,
    to: 1959,
    name: "廢墟重建與冷戰初期",
    summary: "城市從瓦礫裡站起來，意識形態把世界切成兩半，糧票、戶口與工廠指標成為新的節氣。",
    tags: ["重建", "冷戰", "體制"],
    mood: "重整",
  },
  {
    id: "sixties",
    from: 1960,
    to: 1969,
    name: "激盪的六〇年代",
    summary: "運動、衛星、電晶體與街頭標語同時加速。個人命運更容易被集體浪潮捲走。",
    tags: ["運動", "科技", "激盪"],
    mood: "高熱",
  },
  {
    id: "seventies",
    from: 1970,
    to: 1979,
    name: "停滯與轉向的七〇年代",
    summary: "石油危機、物價與政治轉折讓人重新計算生活成本；有人開始把目光從口號轉回飯碗。",
    tags: ["能源", "物價", "轉折"],
    mood: "滯重",
  },
  {
    id: "eighties",
    from: 1980,
    to: 1989,
    name: "開放與消費的八〇年代",
    summary: "卡帶、電視、個體戶與股市傳聞進入尋常人家。機會變多，落差也變大。",
    tags: ["改革", "消費", "電子"],
    mood: "躁動",
  },
  {
    id: "nineties",
    from: 1990,
    to: 1999,
    name: "全球化與網路前夜",
    summary: "圍牆倒塌、商品跨海、個人電腦閃著綠字。世界突然變近，也變得更難預測。",
    tags: ["全球化", "電腦", "轉型"],
    mood: "加速",
  },
  {
    id: "two_thousands",
    from: 2000,
    to: 2009,
    name: "千禧震盪的〇〇年代",
    summary: "手機、非典、戰爭直播與金融海嘯輪流佔據餐桌話題。",
    tags: ["數位", "金融", "恐慌"],
    mood: "不安定",
  },
  {
    id: "tens",
    from: 2010,
    to: 2019,
    name: "社群與零工的一〇年代",
    summary: "演算法開始分配注意力，租屋、加班與短影片變成新的生活節奏。",
    tags: ["社群", "零工", "都市"],
    mood: "過載",
  },
  {
    id: "twenties_now",
    from: 2020,
    to: YEAR_MAX,
    name: "疫後與智能的二〇年代",
    summary: "口罩、遠距、通膨與生成式工具同時改寫工作與親密關係。",
    tags: ["疫情", "遠距", "AI"],
    mood: "斷裂再接",
  },
];

/**
 * Historical pulses that can overlay a given week.
 * `regions` empty/null = worldwide.
 */
export const HISTORICAL_EVENTS = [
  {
    id: "radio_age",
    title: "收音機進入尋常巷弄",
    from: [1924, 1],
    to: [1928, 52],
    regions: null,
    narrative: "鄰居第一次把收音機打開時，整條街的人都探出頭來。",
    effects: { intelligence: 1 },
    classBias: { intellectual: 1, merchant: 1 },
  },
  {
    id: "crash_1929",
    title: "金融恐慌沿港口蔓延",
    from: [1929, 40],
    to: [1933, 26],
    regions: null,
    narrative: "行情像雪崩。有人撕股票，有人把金飾縫進衣擺。",
    effects: { wealth: -2, mood: -2 },
    classBias: { merchant: 3, gentry: 2, official: 1, peasant: 1 },
  },
  {
    id: "mukden",
    title: "東北的槍響傳到關內",
    from: [1931, 36],
    to: [1932, 20],
    regions: ["china"],
    narrative: "報紙號外被搶光。有人說鐵路被炸，有人說更大的事情才剛開始。",
    effects: { mood: -2 },
    classBias: { military: 2 },
  },
  {
    id: "war_full",
    title: "全面戰爭壓上日常",
    from: [1937, 27],
    to: [1945, 32],
    regions: ["china", "japan", "hongkong", "taiwan"],
    narrative: "燈火管制、防空壕、失散的地址簿成為新的生活配件。",
    effects: { health: -1, wealth: -1, mood: -2 },
    classBias: { peasant: 1, worker: 1, military: 2 },
  },
  {
    id: "ww2_europe",
    title: "歐陸淪入總體戰",
    from: [1939, 35],
    to: [1945, 20],
    regions: ["west", "russia"],
    narrative: "配給票比鈔票更值錢。夜間的警報聲會把人從夢裡揪起來。",
    effects: { health: -1, wealth: -1, mood: -2 },
    classBias: { military: 2, worker: 1 },
  },
  {
    id: "pacific_war",
    title: "太平洋戰火燒到港口",
    from: [1941, 48],
    to: [1945, 32],
    regions: ["hongkong", "se_asia", "japan", "west"],
    narrative: "輪船班次消失，市面只剩下囤積與傳聞。",
    effects: { wealth: -2, mood: -2 },
    classBias: { merchant: 2, immigrant: 1 },
  },
  {
    id: "end_of_war",
    title: "戰爭突然停了",
    from: [1945, 33],
    to: [1946, 12],
    regions: null,
    narrative: "有人放鞭炮，有人找墳。勝利與空白同時降臨。",
    effects: { mood: 2 },
    classBias: {},
  },
  {
    id: "china_1949",
    title: "政權更迭改寫門牌",
    from: [1948, 40],
    to: [1950, 26],
    regions: ["china"],
    narrative: "舊徽章被摘下，新的學習會開始。有人留下，有人連夜走水路。",
    effects: { mood: -1, wealth: -1 },
    classBias: { gentry: 3, official: 3, merchant: 2, intellectual: 2, peasant: 1 },
  },
  {
    id: "taiwan_228",
    title: "島上的驚惶之春",
    from: [1947, 8],
    to: [1947, 20],
    regions: ["taiwan"],
    narrative: "街上的語言突然變得危險。家裡有人把日記燒了。",
    effects: { mood: -4, health: -1 },
    classBias: { intellectual: 2, official: 1 },
  },
  {
    id: "korean_war",
    title: "鄰近的戰爭吸走物資",
    from: [1950, 25],
    to: [1953, 30],
    regions: ["china", "japan", "west", "russia"],
    narrative: "工廠轉為軍需，報紙每天都有地圖。",
    effects: { wealth: -1, mood: -1 },
    classBias: { worker: 1, military: 2 },
  },
  {
    id: "great_leap",
    title: "高指標壓過節氣",
    from: [1958, 1],
    to: [1962, 20],
    regions: ["china"],
    narrative: "公共食堂的粥越來越稀。有人把樹皮說成「代食品」。",
    effects: { health: -2, wealth: -2, mood: -2 },
    classBias: { peasant: 4, worker: 2, official: 1 },
  },
  {
    id: "cultural_rev",
    title: "運動壓過私事",
    from: [1966, 20],
    to: [1976, 36],
    regions: ["china"],
    narrative: "大字報蓋住了舊春聯。家庭出身比分數更先被問起。",
    effects: { mood: -2, charm: -1 },
    classBias: { intellectual: 4, gentry: 3, official: 2, merchant: 2 },
  },
  {
    id: "oil_shock",
    title: "石油危機改寫物價",
    from: [1973, 40],
    to: [1975, 20],
    regions: null,
    narrative: "燈要省，車要排，菜場的價錢每週都在重新學習。",
    effects: { wealth: -2, mood: -1 },
    classBias: { worker: 1, merchant: 1 },
  },
  {
    id: "reform_1978",
    title: "政策口風鬆動",
    from: [1978, 48],
    to: [1984, 52],
    regions: ["china"],
    narrative: "有人開始談承包、個體戶和「先富起來」。街角重新出現私彩攤。",
    effects: { wealth: 1, mood: 1 },
    classBias: { merchant: 2, peasant: 1, worker: 1 },
  },
  {
    id: "pc_wave",
    title: "個人電腦閃起綠字",
    from: [1983, 1],
    to: [1995, 52],
    regions: null,
    narrative: "機房裡的風扇聲像新的紡織機。會打字的人忽然變得值錢。",
    effects: { intelligence: 1 },
    classBias: { intellectual: 2, merchant: 1 },
  },
  {
    id: "cold_war_peak",
    title: "檔案比成績厚",
    from: [1948, 1],
    to: [1989, 39],
    regions: ["west", "russia", "china", "korea", "japan", "taiwan", "hongkong"],
    narrative: "單位、學校或街道開始要填立場與關係。收音機的波段也會被問起。",
    effects: { mood: -1 },
    classBias: { intellectual: 2, official: 2, military: 1 },
  },
  {
    id: "cold_war_end",
    title: "長牆倒塌的消息",
    from: [1989, 40],
    to: [1992, 20],
    regions: ["west", "russia", "china", "taiwan", "hongkong"],
    narrative: "電視裡的人群比任何課本都更快改寫地圖。",
    effects: { mood: 1, intelligence: 1 },
    classBias: { intellectual: 2, official: 1 },
  },
  {
    id: "xiagang",
    title: "單位把人往外推",
    from: [1993, 1],
    to: [2003, 40],
    regions: ["china"],
    narrative: "工齡被折成一個數。廠徽從帽子上消失。人才市場的隊伍比食堂長。",
    effects: { wealth: -2, mood: -2 },
    classBias: { worker: 4, peasant: 2, artisan: 2 },
  },
  {
    id: "asian_crisis",
    title: "亞洲金融風暴",
    from: [1997, 27],
    to: [1999, 12],
    regions: ["hongkong", "se_asia", "taiwan", "japan", "korea"],
    narrative: "匯率像受驚的馬。公司開始用「優退」代替「裁員」。",
    effects: { wealth: -2, mood: -2 },
    classBias: { merchant: 3, worker: 2 },
  },
  {
    id: "handover_1997",
    title: "主權交接之夜",
    from: [1997, 26],
    to: [1997, 30],
    regions: ["hongkong"],
    narrative: "雨裡的旗幟換了顏色。有人通宵看直播，有人把護照夾進內衣。",
    effects: { mood: -1 },
    classBias: {},
  },
  {
    id: "dotcom",
    title: "網路泡沫一起一落",
    from: [1999, 1],
    to: [2002, 24],
    regions: null,
    narrative: "有人靠網域發了小財，更多人只留下燒完的選擇權。",
    effects: { wealth: -1, intelligence: 1 },
    classBias: { merchant: 2, intellectual: 1 },
  },
  {
    id: "sars",
    title: "非典的口罩夏天",
    from: [2003, 8],
    to: [2003, 28],
    regions: ["china", "hongkong", "taiwan", "se_asia"],
    narrative: "體溫槍出現在門口。咳嗽會讓整節車廂側目。",
    effects: { health: -2, mood: -2 },
    classBias: {},
  },
  {
    id: "gfc_2008",
    title: "全球金融海嘯",
    from: [2008, 36],
    to: [2010, 20],
    regions: null,
    narrative: "銀行的玻璃門還在，裡頭的工作卻在蒸發。",
    effects: { wealth: -3, mood: -2 },
    classBias: { merchant: 3, official: 1, worker: 1 },
  },
  {
    id: "smartphone",
    title: "智慧型手機改寫走路姿勢",
    from: [2011, 1],
    to: [2016, 52],
    regions: null,
    narrative: "人開始低頭生活。消息比風快，孤獨也比以前更亮。",
    effects: { intelligence: 1, charm: 1, mood: -1 },
    classBias: {},
  },
  {
    id: "covid",
    title: "全球大流行",
    from: [2020, 4],
    to: [2022, 40],
    regions: null,
    narrative: "日曆上的計畫被一條條劃掉。家變成辦公室、教室和避難所。",
    effects: { health: -1, mood: -2, wealth: -1 },
    classBias: { merchant: 1, worker: 1 },
  },
  {
    id: "ai_wave",
    title: "生成式工具湧入職場",
    from: [2023, 1],
    to: [YEAR_MAX, 52],
    regions: null,
    narrative: "有人靠提示詞吃飯，有人擔心自己的手藝被學走。",
    effects: { intelligence: 1, mood: -1 },
    classBias: { intellectual: 2, artisan: 1, worker: 1 },
  },
];

export function getCityDisplayName(city, year) {
  if (!city) return "未知聚落";
  if (city.availableFrom != null || city.kind) return getSettlementDisplayName(city, year);
  const row = city.names.find((item) => year >= item.from && year <= item.to);
  return row?.name ?? city.names[city.names.length - 1].name;
}

export function getEraForYear(year) {
  return ERAS.find((era) => year >= era.from && year <= era.to) ?? ERAS[ERAS.length - 1];
}

export function getActiveHistory(year, week, region) {
  return HISTORICAL_EVENTS.filter((event) => {
    const afterStart = year > event.from[0] || (year === event.from[0] && week >= event.from[1]);
    const beforeEnd = year < event.to[0] || (year === event.to[0] && week <= event.to[1]);
    if (!afterStart || !beforeEnd) return false;
    if (!event.regions || event.regions.length === 0) return true;
    return event.regions.includes(region);
  });
}

export function generateName(rng, region, gender) {
  const pick = (list) => list[Math.floor(rng() * list.length)];
  if (region === "west") {
    return `${pick(GIVEN_WEST)} ${pick(SURNAMES_WEST)}`;
  }
  if (region === "japan") {
    return `${pick(SURNAMES_JP)}${pick(GIVEN_JP)}`;
  }
  const given = gender === "female"
    ? pick(GIVEN_ZH.filter((_, i) => i % 2 === 1).concat(["芳", "婷", "雪", "蘭", "慧", "雅", "萱", "瑾", "柔"]))
    : pick(GIVEN_ZH);
  return `${pick(SURNAMES_ZH)}${given}${rng() < 0.45 ? pick(GIVEN_ZH) : ""}`;
}

export function findCity(id) {
  return findSettlement(id) || CITIES.find((city) => city.id === id);
}

export function findClass(id) {
  return FAMILY_CLASSES.find((item) => item.id === id);
}
