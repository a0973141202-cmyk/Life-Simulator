import { isForbiddenEthnicity, FORBIDDEN_NOTE } from "./forbidden-groups.js";
import { AFRICA } from "./ethnicities/africa.js";
import { AMERICAS } from "./ethnicities/americas.js";
import { EAST_ASIA } from "./ethnicities/east-asia.js";
import { EUROPE } from "./ethnicities/europe.js";
import { INNER_ASIA } from "./ethnicities/inner-asia.js";
import { MIDDLE_EAST } from "./ethnicities/middle-east.js";
import { OCEANIA } from "./ethnicities/oceania.js";
import { SOUTH_ASIA } from "./ethnicities/south-asia.js";
import { SOUTHEAST_ASIA } from "./ethnicities/southeast-asia.js";
import { SUPPLEMENT } from "./ethnicities/supplement.js";
import { eth } from "./ethnicity-factory.js";

const TAIWAN_INDIGENOUS = [
  eth("amis", "阿美族", "Amis", "rare", ["taiwan"], ["sea_balance", "humidity_pace", "oral_memory"], "臺灣東海岸平原。", "formosa", { charm: 2, health: 1 }),
  eth("atayal", "泰雅族", "Atayal", "rare", ["taiwan"], ["forest_path", "mountain_foot", "long_range_track"], "臺灣北部山區。", "formosa", { health: 3 }),
  eth("paiwan", "排灣族", "Paiwan", "rare", ["taiwan"], ["mountain_foot", "craft_finger", "clan_map"], "南臺灣山地。", "formosa", { charm: 1 }),
  eth("bunun", "布農族", "Bunun", "rare", ["taiwan"], ["mountain_foot", "oral_memory"], "中央山脈高音口傳。", "formosa", { health: 2 }),
  eth("rukai", "魯凱族", "Rukai", "rare", ["taiwan"], ["mountain_foot", "craft_finger"], "南臺灣。", "formosa"),
  eth("puyuma", "卑南族", "Puyuma", "rare", ["taiwan"], ["sea_balance", "clan_map"], "臺東平原。", "formosa"),
  eth("tsou", "鄒族", "Tsou", "rare", ["taiwan"], ["forest_path", "mountain_foot"], "阿里山。", "formosa"),
  eth("saisiyat", "賽夏族", "Saisiyat", "rare", ["taiwan"], ["forest_path", "oral_memory"], "苗栗—新竹山地。", "formosa"),
  eth("tao", "達悟／雅美", "Tao / Yami", "rare", ["taiwan"], ["sea_balance", "island_resource_map", "storm_sea_read"], "蘭嶼（有定期交通，非封閉隔離）。", "formosa", { health: 2 }),
  eth("truku", "太魯閣族", "Truku", "rare", ["taiwan"], ["mountain_foot", "forest_path"], "立霧溪流域。", "formosa", { health: 2 }),
  eth("seediq", "賽德克族", "Seediq", "rare", ["taiwan"], ["forest_path", "mountain_foot", "oral_memory"], "南投山地。", "formosa", { health: 2 }),
  eth("kavalan", "噶瑪蘭族", "Kavalan", "rare", ["taiwan"], ["sea_balance", "river_read"], "宜蘭平原。", "formosa"),
  eth("sakizaya", "撒奇萊雅族", "Sakizaya", "rare", ["taiwan"], ["sea_balance", "oral_memory"], "花蓮。", "formosa"),
  eth("indigenous_formosa", "臺灣原住民族（廣義）", "Taiwanese Indigenous", "rare", ["taiwan"], ["forest_path", "sea_balance", "oral_memory"], "南島語族在臺灣的總稱標籤，細項見各族。", "formosa", { health: 3, charm: 1 }),
  eth("thao", "邵族", "Thao", "rare", ["taiwan"], ["lake_read", "oral_memory", "clan_map"], "日月潭邵族（與漢人社會長期往來）。", "formosa"),
  eth("kanakanavu", "卡那卡那富", "Kanakanavu", "rare", ["taiwan"], ["mountain_foot", "forest_path"], "高雄山地。", "formosa"),
  eth("hlaalua", "拉阿魯哇", "Hla'alua / Saaroa", "rare", ["taiwan"], ["mountain_foot", "oral_memory"], "高雄桃源。", "formosa"),
  eth("kaxabu", "噶哈巫", "Kaxabu", "rare", ["taiwan"], ["river_read", "oral_memory"], "中部平埔（接觸社會）。", "formosa"),
];

const extraAliases = [
  eth("filipino", "菲律賓諸族", "Filipino", "common", ["se_asia"], ["sea_balance", "urban_crowd_read", "diaspora_pack", "humidity_pace"], "菲律賓群島多語社會的總稱。", "filipino", { charm: 2, mood: 1 }),
  eth("azeri", "亞塞拜然（別名）", "Azeri", "uncommon", ["middle_east", "russia"], ["market_haggle", "steppe_endurance"], "與 azerbaijani 同族網絡。", "turkish", { charm: 1 }),
];

const RAW = [
  ...EAST_ASIA,
  ...TAIWAN_INDIGENOUS,
  ...SOUTHEAST_ASIA,
  ...SOUTH_ASIA,
  ...INNER_ASIA,
  ...MIDDLE_EAST,
  ...EUROPE,
  ...AFRICA,
  ...AMERICAS,
  ...OCEANIA,
  ...SUPPLEMENT,
  ...extraAliases,
];

function validate(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (isForbiddenEthnicity(item)) {
      throw new Error(`Forbidden ethnicity leaked into database: ${item.id}`);
    }
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

export const ETHNICITY_DATABASE = validate(RAW);
export const ETHNICITY_BY_ID = Object.fromEntries(ETHNICITY_DATABASE.map((item) => [item.id, item]));
export const ETHNICITY_COUNT = ETHNICITY_DATABASE.length;
export { FORBIDDEN_NOTE };
