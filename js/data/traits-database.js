/**
 * Documented physiological, sensory, and ecological adaptations.
 * Tags: trait_<id>
 *
 * Notes cite widely reported anthropological / human-biology observations
 * (high-altitude alleles, cold metabolism, diving spleen, traditional tracking).
 * These are population-level tendencies, not individual destinies.
 */

function t(id, label, description, observation, hooks, statMods = {}, extra = {}) {
  return {
    id,
    tag: `trait_${id}`,
    label,
    description,
    observation,
    hooks,
    tags: extra.tags || hooks.slice(),
    statMods,
    eventModifiers: extra.eventModifiers || {},
  };
}

export const TRAIT_DATABASE = [
  t("polar_thermogenesis", "極地產熱適應", "在嚴寒中較能維持核心體溫與末梢操作。", "北極族群常見較高的冷誘導產熱與脂肪酸代謝特徵（如 CPT1A 變異的討論）。", ["arctic", "health", "survival"], { health: 4 }),
  t("barometric_sense", "氣壓敏銳", "對氣壓升降、風向轉換與暴風前兆極敏感。", "極地與開闊地形狩獵文化中，讀天是生存技術，常與氣味、雲態一齊訓練。", ["weather", "sensory", "survival"], { intelligence: 2 }, { eventModifiers: { weather: 0.2 } }),
  t("olfactory_tracking", "氣味追蹤", "能從氣味梯度分辨獸跡、潮線、煙火或人潮方向。", "狩獵採集與牧畜社會普遍把嗅覺當作遠距資訊通道。", ["sensory", "tracking", "survival"], { intelligence: 2 }),
  t("long_range_track", "遠距足跡判讀", "能把斷續蹄印、雪印或沙痕接成一條路線。", "卡拉哈里、北極與草原追蹤術在民族誌中有大量紀錄。", ["tracking", "travel", "survival"], { intelligence: 1, health: 1 }),
  t("ice_acoustic_read", "冰層聽診", "能從冰裂聲、顏色與回音判斷是否可走。", "海冰出行的因紐特與楚科奇知識體系。", ["arctic", "sensory", "survival"], { intelligence: 2 }),
  t("altitude_epas1", "高原氧適應（低血紅素路徑）", "稀薄空氣下較不易迅速缺氧衰竭。", "青藏高原族群以 EPAS1 等基因著稱，走「不過度推高血紅素」的路徑。", ["altitude", "health", "travel"], { health: 4 }),
  t("altitude_hemoglobin", "高原氧適應（血紅素路徑）", "以較高攜氧能力應付安地斯式的長期高海拔生活。", "克丘亞／艾馬拉等安地斯人群的血紅素與胸腔適應被反覆測量。", ["altitude", "health"], { health: 3 }),
  t("diving_spleen", "潛水脾臟反射", "長時間屏息與反覆下潛時較能調度氧氣。", "薩馬—巴瑤（Bajau）潛人的脾臟體積與潛水生理研究。", ["sea", "health", "survival"], { health: 3 }),
  t("heat_slender_build", "高熱疏散體型", "瘦長肢體有利在乾熱環境散熱。", "尼羅特語族等東非族群的體型與熱適應討論（艾倫法則脈絡）。", ["desert", "health"], { health: 2 }),
  t("endurance_running", "持久奔跑", "中長距離節奏穩、熱適應與高原訓練疊加時更明顯。", "肯亞高地卡倫金人等的長跑表現有訓練＋海拔＋體型的綜合研究。", ["health", "travel"], { health: 3 }),
  t("forest_short_stature", "密林體熱調節", "在潮濕密林中較省熱量、便於低層穿行。", "中非森林採集族群的體型適應討論（接觸社會，非隔離島嶼）。", ["forest", "health"], { health: 2 }),
  t("desert_thrift", "旱地節水節律", "身體與作息都習慣省水、避正午。", "貝都因、圖阿雷格與澳洲沙漠社會的熱環境行為適應。", ["desert", "survival"], { health: 2, wealth: 1 }),
  t("lactase_persistence", "乳糖持續酶", "成年後仍較能消化鮮奶。", "北歐、東非牧畜與部分中亞草原人群的 LP 等位基因分布。", ["health"], { health: 1, mood: 1 }),
  t("malaria_belt", "瘧區平衡適應", "對瘧區病原有較高的群體層次平衡多態。", "鐮刀型血球、地中海貧血等在瘧疾帶的經典平衡選擇（個體仍可能患病）。", ["health"], { health: 1 }),
  t("alcohol_flush", "酒精代謝敏感", "少量酒精即面紅、心跳加快，較不易豪飲。", "東亞常見 ALDH2 缺失型。", ["health"], { health: 1 }),
  t("salt_coastal", "沿海鹽分調節", "高鹽漁獲飲食下的血壓與腎臟調節傾向。", "島嶼與漁獵社會的飲食適應討論。", ["sea", "health"], { health: 1 }),
  t("star_path_nav", "星路航海", "能用星、湧浪、鳥與雲定位。", "玻里尼西亞傳統導航（star compass）的民族誌與復原航海。", ["sea", "navigation", "travel"], { intelligence: 3 }),
  t("desert_wayfind", "沙漠識途", "在少地標地形用風紋、星與記憶點定位。", "澳洲內陸與撒哈拉商路的導向知識。", ["desert", "navigation", "survival"], { intelligence: 2 }),
  t("persistence_hunt", "持久狩獵節奏", "能把步行追獵的配速維持到獵物過熱。", "San 等族群的持久狩獵紀錄。", ["tracking", "health", "survival"], { health: 3 }),
  t("visual_spatial_memory", "地形視覺記憶", "對地平線微差、岩層與植物分佈記得極牢。", "澳洲沙漠導向與太平洋島嶼潟湖記憶的認知人類學討論。", ["navigation", "memory"], { intelligence: 3 }),
  t("night_adapt", "夜視適應", "少燈環境下眼睛更快進入可用狀態。", "高緯極夜、沙漠夜行與洞穴住居的行為適應。", ["sensory", "underground", "survival"], { intelligence: 1 }),
  t("underground_orient", "地下方向感", "在無窗層疊空間較不易迷失出入口。", "穴居、礦坑與地下街的空間習慣。", ["underground", "navigation"], { intelligence: 2 }),
  t("river_read", "水文判斷", "從水色、流速與氣味判斷深淺與可否飲用。", "大河文明與三角洲漁獵的日常技術。", ["river", "survival", "navigation"], { intelligence: 2 }),
  t("sea_balance", "海上平衡感", "甲板、潟湖木屋與漁船上較穩。", "廣大的澳斯特羅尼西亞與沿海漁獵社會。", ["sea", "navigation"], { health: 2, charm: 1 }),
  t("steppe_endurance", "草原耐力", "長距離騎行或行走時恢復快。", "蒙古、哈薩克、哈薩克草原與部分東非牧畜社會。", ["steppe", "travel"], { health: 3 }),
  t("horse_bond", "馭畜直覺", "對馬、駝、馴鹿或牛的疲勞與脾氣判斷快。", "歐亞草原與薩米馴鹿文化。", ["steppe", "animals", "travel"], { charm: 2, health: 1 }),
  t("reindeer_read", "馴鹿季候感", "能把苔原物候、獸群與遷移對在同一張心智地圖上。", "薩米、涅涅茨等馴鹿牧民。", ["arctic", "animals", "steppe"], { intelligence: 2 }),
  t("forest_path", "密林識路", "在鬱閉植被裡用光、聲與植物辨位。", "東南亞高地、亞馬遜接觸社會與臺灣山林。", ["forest", "navigation", "survival"], { intelligence: 2 }),
  t("oral_memory", "口傳譜系記憶", "能把長串人名、路線與禁忌以口耳保存。", "無文字或雙軌記憶的社會普遍訓練。", ["language", "memory", "social"], { intelligence: 3, charm: 1 }),
  t("click_phoneme_ear", "搭嘴音聽覺", "對搭嘴音與細微輔音對立極敏感。", "科依桑語族語音範疇。", ["language", "sensory"], { intelligence: 2 }),
  t("tone_language_ear", "聲調聽覺", "對音高變化極敏感，學聲調語言較省力。", "漢藏、壯侗、尼日—剛果部分聲調語言環境。", ["language", "sensory"], { intelligence: 2, charm: 1 }),
  t("multilingual_ear", "多語轉換聽覺", "對陌生音韻與語碼轉換快。", "口岸、帝國邊地與離散社群的共同技能。", ["language", "social", "urban"], { intelligence: 2, charm: 2 }),
  t("urban_crowd_read", "市井眼色", "在擁擠街市迅速判斷活路與氣氛。", "長期高密度城市生活的社會認知訓練。", ["urban", "social"], { charm: 2, intelligence: 1 }),
  t("conflict_stillness", "突發鎮靜", "喧囂驟起時身體先靜、再決定跑或藏。", "反覆經歷襲擊、遷徙或高壓政局的家庭傳承。", ["combat", "survival", "war"], { mood: 2, health: 1 }),
  t("spice_gut", "發酵辛香耐受", "對濃烈發酵與辛香食物的腸胃耐受較高。", "南亞、東南亞、朝鮮與部分非洲飲食生態。", ["health", "urban"], { health: 2 }),
  t("craft_finger", "精細指法", "編織、金工、皮革或細修的小肌肉遺傳較上手。", "長期工藝專化的家庭與種姓／行會傳統。", ["craft"], { intelligence: 1, wealth: 1 }),
  t("market_haggle", "市集時機感", "對價格、人情與『今天不能賣』很敏銳。", "商路、離散商人與市集民族誌中的核心技能。", ["social", "urban", "trade"], { charm: 2, wealth: 2 }),
  t("clan_map", "親族地理", "腦子裡有一張誰能投靠、誰不能提的地圖。", "氏族、部落與宗族社會的社會計算。", ["social", "family"], { charm: 1, intelligence: 1 }),
  t("faith_spine", "儀式耐力", "長時間儀式、禁忌與公開場合較不易失儀。", "寺院、教會、伊斯蘭學術與禮教世家。", ["social", "faith"], { mood: 2, charm: 1 }),
  t("iron_shift", "輪班體能", "身體習慣礦坑、工廠或極晝極夜的斷續睡眠。", "工業聚落與高緯工作節奏。", ["health", "labor"], { health: 2, mood: -1 }),
  t("diaspora_pack", "離散打包術", "能迅速判斷哪些東西值得帶走。", "多次被迫遷徙的家庭技術。", ["travel", "survival", "family"], { intelligence: 1, mood: 1, wealth: 1 }),
  t("cold_hands_craft", "寒地精細操作", "低溫下仍能做縫補、修網、微雕。", "北極與亞北極手工傳統。", ["arctic", "craft"], { intelligence: 1, health: 1 }),
  t("humidity_pace", "濕熱配速", "在高濕環境不會一開始就爆衝耗水。", "熱帶雨林與季風區的勞動節奏。", ["health", "forest"], { health: 2 }),
  t("mountain_foot", "坡地步伐", "碎石坡與梯田上重心穩。", "喜馬拉雅、安地斯、阿爾卑斯與西南中國山地。", ["altitude", "travel"], { health: 2 }),
  t("camel_range", "駝隊節程", "能把沙漠行程按水井與陰影切割。", "撒哈拉—阿拉伯商路。", ["desert", "travel", "animals"], { health: 2, intelligence: 1 }),
  t("rice_terrace_eye", "水田水平眼", "對微小坡度與水流分配極敏感。", "東亞與東南亞稻作梯田。", ["craft", "river"], { intelligence: 1, wealth: 1 }),
  t("pastoral_count", "畜群心算", "掃一眼能估數量、病弱與走失。", "牧畜社會的數量直覺。", ["animals", "steppe"], { intelligence: 2 }),
  t("storm_sea_read", "風暴海況", "能從天色與湧浪判斷要不要出港。", "北大西洋、北太平洋漁民。", ["sea", "weather"], { intelligence: 2, health: 1 }),
  t("savanna_horizon", "草原地平線", "遠距離辨認塵、煙與獸群。", "東非與南非疏林草原。", ["tracking", "steppe"], { intelligence: 1, health: 1 }),
  t("island_resource_map", "島嶼資源圖", "把潮間帶、淡水與風向記成一張循環表。", "太平洋與加勒比島嶼生態知識。", ["sea", "survival"], { intelligence: 2 }),
  t("silk_road_bargain", "長程商路記憶", "記得關卡、秤砣與哪種語言能過境。", "絲路、茶馬與沙漠商隊家庭。", ["trade", "travel", "language"], { charm: 1, wealth: 2 }),
  t("lake_read", "湖澤判讀", "能從水色、風向與漁獲季節判斷出湖時機。", "內陸湖泊漁獵社會的日常技術。", ["river", "survival"], { intelligence: 1 }),
];

export const TRAIT_BY_ID = Object.fromEntries(TRAIT_DATABASE.map((item) => [item.id, item]));
