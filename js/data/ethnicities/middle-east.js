import { eth } from "../ethnicity-factory.js";

export const MIDDLE_EAST = [
  eth("arab_levant", "黎凡特阿拉伯", "Levantine Arab", "common", ["middle_east"], ["urban_crowd_read", "oral_memory", "clan_map", "market_haggle"], "東地中海城市與農園。", "arabic", { charm: 2, intelligence: 1 }),
  eth("arab_gulf", "海灣阿拉伯", "Gulf Arab", "uncommon", ["middle_east"], ["desert_thrift", "sea_balance", "heat_slender_build"], "波斯灣珍珠與航海。", "arabic", { wealth: 1 }),
  eth("arab_bedouin", "貝都因", "Bedouin", "uncommon", ["middle_east"], ["desert_thrift", "camel_range", "long_range_track", "barometric_sense"], "阿拉伯沙漠游牧。", "arabic", { health: 3, intelligence: 1 }),
  eth("arab_iraqi", "伊拉克阿拉伯", "Iraqi Arab", "common", ["middle_east"], ["river_read", "urban_crowd_read", "heat_slender_build"], "兩河流域。", "arabic"),
  eth("arab_yemeni", "也門", "Yemeni", "uncommon", ["middle_east"], ["mountain_foot", "heat_slender_build", "spice_gut"], "也門高地與季候風港。", "arabic", { health: 1 }),
  eth("arab", "阿拉伯（廣義）", "Arab", "common", ["middle_east", "africa"], ["desert_thrift", "oral_memory", "clan_map"], "阿拉伯語世界的主體認同。", "arabic", { charm: 2 }),
  eth("persian", "波斯", "Persian / Iranian", "common", ["middle_east"], ["oral_memory", "urban_crowd_read", "craft_finger", "silk_road_bargain"], "伊朗高原城市文明。", "persian", { intelligence: 2, charm: 1 }),
  eth("kurdish", "庫德", "Kurdish", "uncommon", ["middle_east"], ["mountain_foot", "conflict_stillness", "oral_memory", "long_range_track"], "扎格羅斯—托羅斯山地。", "kurdish", { health: 2, mood: 1 }),
  eth("turkish", "土耳其", "Turkish", "common", ["middle_east", "west"], ["market_haggle", "urban_crowd_read", "steppe_endurance"], "安納托利亞農牧與城市。", "turkish", { charm: 1, wealth: 1 }),
  eth("assyrian", "亞述", "Assyrian / Syriac", "rare", ["middle_east"], ["diaspora_pack", "faith_spine", "multilingual_ear"], "兩河基督教少數族群。", "assyrian", { intelligence: 2 }),
  eth("yazidi", "雅茲迪", "Yazidi", "rare", ["middle_east"], ["mountain_foot", "diaspora_pack", "oral_memory"], "辛賈爾山區。", "yazidi", { mood: 1 }),
  eth("druze", "德魯茲", "Druze", "rare", ["middle_east"], ["mountain_foot", "clan_map", "faith_spine"], "黎巴嫩—敘利亞山地。", "arabic", { intelligence: 1 }),
  eth("jewish_ashkenazi", "阿什肯納茲猶太", "Ashkenazi Jewish", "uncommon", ["west", "russia", "middle_east"], ["diaspora_pack", "urban_crowd_read", "oral_memory", "multilingual_ear"], "中東歐城鎮離散與經書記憶傳統。", "jewish", { intelligence: 2, wealth: 1 }),
  eth("jewish_sephardi", "塞法迪猶太", "Sephardi Jewish", "uncommon", ["middle_east", "west", "africa"], ["diaspora_pack", "market_haggle", "multilingual_ear"], "伊比利放逐後的地中海商網。", "jewish", { intelligence: 2, charm: 1 }),
  eth("jewish_mizrahi", "米茲拉希猶太", "Mizrahi Jewish", "uncommon", ["middle_east"], ["market_haggle", "heat_slender_build", "multilingual_ear"], "中東與北非猶太社群。", "jewish", { charm: 1 }),
  eth("jewish_beta_israel", "貝塔以色列", "Beta Israel", "rare", ["africa", "middle_east"], ["mountain_foot", "diaspora_pack", "faith_spine"], "衣索比亞高原猶太社群。", "amhara", { health: 2 }),
  eth("coptic", "科普特", "Coptic", "uncommon", ["africa"], ["faith_spine", "craft_finger", "urban_crowd_read"], "埃及基督教少數。", "coptic", { intelligence: 1, mood: 1 }),
  eth("nubian", "努比亞", "Nubian", "rare", ["africa"], ["river_read", "oral_memory", "heat_slender_build"], "尼羅河中游。", "nubian", { health: 2 }),
];
