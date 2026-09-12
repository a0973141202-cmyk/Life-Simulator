import { eth } from "../ethnicity-factory.js";

/**
 * Additional documented groups that fill remaining regional gaps.
 * Contacted / interacting societies only — no closed isolates.
 */
export const SUPPLEMENT = [
  eth("newar", "紐瓦爾", "Newar", "rare", ["south_asia"], ["craft_finger", "urban_crowd_read", "altitude_epas1"], "加德滿都河谷的古城邦工藝與農耕。", "hindi", { intelligence: 1, charm: 1 }),
  eth("ladakhi", "拉達克", "Ladakhi", "rare", ["south_asia"], ["altitude_epas1", "cold_hands_craft", "mountain_foot"], "西喜馬拉雅高海拔谷地。", "tibetan", { health: 4 }),
  eth("balti", "巴爾蒂", "Balti", "rare", ["south_asia"], ["altitude_epas1", "mountain_foot", "cold_hands_craft"], "喀喇崑崙河谷。", "tibetan", { health: 3 }),
  eth("kalash", "卡拉什", "Kalash", "rare", ["south_asia"], ["mountain_foot", "oral_memory", "craft_finger"], "興都庫什河谷（與周邊社會長期往來，非封閉隔離）。", "persian", { charm: 2, health: 1 }),
  eth("khanty", "漢特", "Khanty", "rare", ["russia", "arctic"], ["polar_thermogenesis", "reindeer_read", "river_read", "cold_hands_craft"], "鄂畢河漁獵與馴鹿（有貿易站接觸史）。", "nenets", { health: 3 }),
  eth("mansy", "曼西", "Mansi", "rare", ["russia"], ["forest_path", "river_read", "cold_hands_craft"], "烏拉爾西北泰加林。", "nenets", { health: 2 }),
  eth("kalaallit", "卡拉阿利特（格陵蘭因紐特）", "Kalaallit", "rare", ["arctic"], ["polar_thermogenesis", "ice_acoustic_read", "storm_sea_read", "sea_balance"], "格陵蘭西岸；與丹麥行政與補給系統相連。", "inuit", { health: 4, intelligence: 1 }),
  eth("lingala", "林加拉語都市族", "Lingala urban", "uncommon", ["africa"], ["urban_crowd_read", "oral_memory", "river_read", "humidity_pace"], "剛果河沿岸的都市共通語社群。", "west_african", { charm: 2 }),
  eth("ossetian", "奧塞梯", "Ossetian", "rare", ["russia"], ["mountain_foot", "horse_bond", "oral_memory"], "高加索伊朗語族。", "ossetian", { health: 2 }),
  eth("lezgin", "列茲金", "Lezgin", "rare", ["russia", "middle_east"], ["mountain_foot", "clan_map"], "達吉斯坦—阿塞拜疆山地。", "chechen", { health: 1 }),
  eth("faroese", "法羅", "Faroese", "rare", ["west", "arctic"], ["storm_sea_read", "sea_balance", "cold_hands_craft"], "北大西洋群島漁民（有航運接觸）。", "nordic", { health: 2 }),
  eth("cornish", "康瓦爾", "Cornish", "rare", ["west"], ["sea_balance", "iron_shift", "oral_memory"], "西南半島礦業與漁業。", "welsh"),
  eth("hadza", "哈扎（接觸社群）", "Hadza", "rare", ["africa"], ["long_range_track", "olfactory_tracking", "savanna_horizon", "click_phoneme_ear"], "坦尚尼亞裂谷採集；與鄰近農牧社會有貿易往來，非封閉隔離。", "east_african", { health: 3, intelligence: 2 }),
  eth("mbuti", "姆布蒂（接觸社群）", "Mbuti", "rare", ["africa"], ["forest_short_stature", "forest_path", "humidity_pace", "olfactory_tracking"], "伊圖里森林採集；有長期對外交換，不含封閉隔離族。", "west_african", { health: 2, intelligence: 1 }),
  eth("twa", "特瓦（接觸社群）", "Twa", "rare", ["africa"], ["forest_short_stature", "forest_path", "humidity_pace"], "大湖區森林邊緣社群（接觸社會）。", "east_african", { health: 1 }),
  eth("inuit_greenland", "格陵蘭因紐特（廣義）", "Greenlandic Inuit", "rare", ["arctic"], ["polar_thermogenesis", "barometric_sense", "ice_acoustic_read"], "與 kalaallit 同網絡的廣義標籤。", "inuit", { health: 4 }),
];
