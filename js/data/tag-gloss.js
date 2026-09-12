/**
 * Lightweight hover glosses for every HUD tag.
 * Engine IDs stay English; chips show Chinese. Text is 10–20 字, cold, 1920–2025.
 */
import { ADULT_TAG_DATABASE } from "./adult-tags-database.js";
import { CONDITION_DATABASE } from "./conditions-database.js";
import { ETHNICITY_BY_ID, ETHNICITY_DATABASE } from "./ethnicities-database.js";
import { FIGURE_TAG_DATABASE } from "./figure-tags.js";
import { HOUSEHOLD_CLIMATE_TAGS } from "./household-climate.js";
import { MOOD_TAG_RULES } from "./mood-tags-database.js";
import { PARENT_APTITUDE_DATABASE } from "./parent-aptitudes-database.js";
import { PERP_CASTE_TAG_DATABASE } from "./perp-caste-tags-database.js";
import { LEDGER_TAG_RULES } from "./path-tags-database.js";
import { SCHOOL_TAG_DATABASE } from "./school-tags-database.js";
import { SOCIO_TAG_DATABASE } from "./socio-tags-database.js";
import { TRAIT_DATABASE } from "./traits-database.js";
import { TRAUMA_TAG_DATABASE } from "./trauma-tags-database.js";
import { WORLD_TAG_DATABASE } from "./world-event-tags.js";
import { WEALTH_TAG_RULES } from "./wealth-schema.js";
import { inferCategory } from "./tag-schema.js";
import {
  CLASS_ZH,
  CLIMATE_ZH,
  GEO_BAND_ZH,
  PATH_ZH,
  REGION_ZH,
} from "./ui-zh.js";
import { isDossierLeakSentence, scrubPublicText } from "./public-text.js";

const MAX_GLOSS = 32;

export function clipGloss(text, max = MAX_GLOSS) {
  let raw = String(text || "").replace(/\s+/g, "");
  raw = raw.replace(/（[^）]*）/g, "").replace(/\([^)]*\)/g, "");
  raw = raw.replace(/[。．.！？!?]+$/g, "");
  if (!raw) return "";
  const first = raw.split(/[，、；：]/)[0] || raw;
  const source = [...first].length >= 8 ? first : raw;
  const sliced = [...source].slice(0, max).join("");
  return /[。！？]$/.test(sliced) ? sliced : `${sliced}。`;
}

/** Explicit short copy. Keys are tag ids or public labels. */
export const TAG_GLOSS = Object.freeze({
  socio_extreme_poverty: "家裡幾乎沒有緩衝存糧。",
  socio_working_poor: "工時貼著糧價，沒有閒錢。",
  socio_merchant_capital: "帳冊、存貨與人情當家底。",
  socio_official_network: "門檻內外的規矩當母語學。",
  socio_gentry_estate: "禮儀與門楣比現金先保住。",
  socio_intellectual_house: "字被當成出路，也當成禍根。",
  socio_military_household: "遷徙、口令與突然的缺席。",
  socio_war_displacement: "出生地正在打仗或被遷走。",
  socio_refugee_camp: "戶籍臨時，水與學按配給。",
  socio_slum_density: "巷弄與共用龍頭構成社會。",
  socio_immigrant_insecurity: "口音、證件與「回去」並存。",
  socio_arctic_scarcity: "一年菜單取決於船班凍土。",
  socio_underground_life: "日光是配給，方向寫在岩壁。",

  trauma_hypervigilance: "神經改成全天值班。",
  trauma_flinch_body: "聲響未到，肩與手先縮。",
  trauma_shame_core: "你開始相信痛是自己該受。",
  trauma_self_blame: "把結構暴力譯成自己的錯。",
  trauma_rage_leak: "無處可去的怒在後來找出口。",
  trauma_dissociation: "痛開始前，意識先下班。",
  trauma_authority_terror: "制服入視野，身體先認罪。",
  trauma_attachment_starve: "靠近與逃離同時發生。",
  trauma_parentified: "童年被徵用成職務。",
  trauma_labor_scar: "身體被當成家裡的工具。",
  trauma_alcohol_house: "酒瓶與腳步比鐘更準。",
  trauma_cannot_ask_help: "開口等於惹來更大的罰。",
  trauma_cruelty_rehearsal: "被對待的方式成了草稿。",
  trauma_ptsd: "舊聲響會把整段場面拉回來。",
  trauma_melancholia: "起床與開口都先要談判。",
  trauma_persecution: "門縫與咳嗽都被讀成針對。",
  trauma_persona_crack: "為了活過那週，性子被改寫。",

  mood_depressed: "心情連續數週停在極低。",
  mood_euphoric: "心情連續數週停在極高。",

  school_bullied: "院子把你標成可下手的人。",
  school_bully: "你動手或指揮過對同學的傷害。",
  school_ringleader: "你開始分配誰挨打、誰交錢。",
  school_gang: "貢品、放風與報復寫進週課。",
  school_enforcer: "你的用途是手，用完可交出。",
  school_hated: "有人在等你一個人走。",
  school_record: "記過或約談已進校方檔案。",
  school_expelled: "學籍被切斷，街上先看見你。",
  school_snitch_marked: "開口換來的保護通常很短。",
  school_weapon: "刀棍進過校園與你的隨身。",
  school_lockdown: "你經歷過封鎖或走廊上的暴力。",
  school_climate_predatory: "這所學校把傷害當秩序。",

  adult_society_entry: "戶籍與市場開始按成人起算。",
  adult_labor_base: "身體被當成可替換零件。",
  adult_office_base: "你賣的是出席、表格與忍辱。",
  adult_commerce_base: "現金流比道德敘事先到。",
  adult_politics_base: "你靠近簽字權，也可被吐掉。",
  adult_underworld_base: "組織用你的腿，腿斷了可換。",
  adult_neet: "家庭變成最後的福利國家。",
  adult_burnout: "睡眠與關節被班表提前支取。",
  adult_office_politics: "你開始用別人當踏板或擋箭。",
  adult_debt: "利息比工作快，選擇面變窄。",
  wealth_bankrupt: "帳空了，債還在加，下一週先活。",
  wealth_indebted: "利息比工錢快，選擇面被債收窄。",
  wealth_street: "沒有能回去的門，睡在街沿或橋洞。",
  wealth_bonded: "工時拿去抵帳，身體先被用完。",
  wealth_collectors: "收帳的人不用講理，只要人還在。",
  wealth_fire_sale: "能當的東西先賣，價錢由對方定。",
  wealth_malnourished: "糧斷了以後，病和冷一起來。",
  wealth_climber: "餘錢剛夠改口令，街坊開始換稱呼。",
  wealth_ruined_name: "帳和臉一起破，以後問路更貴。",
  kin_orphan: "父母都不在冊。飯和門要自己找。",
  kin_grief: "至親剛不在。屋子裏還留著他們的位子。",
  kin_abandoned: "屋裏的人把門帶上，不再認你這張牀。",
  kin_betrayed: "至親把話傳到外頭，對你不利。",
  kin_rival_hot: "對頭這兩週專門堵你的路。",
  kin_widow: "伴侶不在了。同桌少一個人。",
  kin_bonded: "還有人肯替你擋一回或留一口飯。",
  kin_estranged: "至親決裂。見面比不見面更費。",
  acquired_class_rise: "從下面爬上來，戶口還沒改口。",
  acquired_class_fall: "從上面摔下來，舊體面先被賣掉。",
  adult_union: "開口換過條件，也換過黑名單。",
  adult_layoff: "位置被更便宜的人取代。",
  adult_scab: "你用別人的罷工換自己的班。",
  adult_labor_injury: "鑑定期沒有薪，身體先報銷。",
  adult_whistle: "報復通常比保護程序早到。",
  adult_graft: "把柄與你的用途綁在一起。",
  adult_shop_fail: "存貨、租與人情同時到期。",
  adult_gang_rank: "位階是貢品與動手次數。",
  adult_betrayer: "你把名單或貨交了出去。",
  adult_betrayed: "有人先動了，安全假設作廢。",
  adult_liquidated_mark: "滅口不必戲劇化，只是科目。",
  adult_breakdown: "睡眠、記憶與判斷開始掉件。",
  adult_promoted_thin: "升的是責任與把柄，不一定錢。",

  path_crime: "犯罪紀錄讓追查與暗巷變近。",
  path_narcotics: "地下貨流改寫港口與帳房。",
  path_militant: "暴力被當成政治語言使用。",
  path_politics: "派系、演說與清洗權重上升。",
  path_historical: "改寫時代的人會被時代反寫。",
  path_tycoon: "擴張讓壟斷與崩盤更容易到。",
  path_lawful: "體制內資歷是燃料，也是把柄。",
  acquired_wanted: "通緝值已跨過公開壓力閾值。",
  acquired_high_heat: "當週風聲緊，危機選項變重。",
  acquired_low_trust: "合法交易與動員都會打折。",
  acquired_infamy: "惡名在地下是通貨，在法庭是證。",
  acquired_low_opinion: "合法門路先關，地下門路先開。",
  acquired_low_credit: "盤查與擔保先假設你有問題。",
  acquired_imprisoned: "人身自由被國家或私刑收走。",
  acquired_underworld: "你已被街坊歸進地下那一頭。",
  acquired_fugitive: "你正在躲名單、關卡或討債。",
  acquired_snitch: "你把位置或名字交了出去。",
  acquired_graft: "好處與把柄寫在同一本帳。",
  acquired_exam_economy: "分數被當成家裡的期貨。",
  acquired_school_primary: "初等學籍已蓋過章。",
  acquired_school_secondary: "中等學歷進了可核對的檔。",
  acquired_school_university: "高等教育被寫進履歷欄。",
  acquired_married: "戶籍或街坊開始按成家起算。",
  acquired_desperate_survival: "匱乏把求生寫進反射。",
  acquired_starvation_thrift: "空碗教你把力氣留下。",
  acquired_plague_antibody: "同類熱病再來會慢一步。",
  acquired_pain_focus: "痛還在，下一步沒停。",
  acquired_cold_forged: "極寒週把耐寒重新叫醒。",
  acquired_heat_forged: "酷熱裡步距重新對上。",
  絕境求生: "匱乏把求生寫進反射。",
  餓慣了的胃口: "空碗教你把力氣留下。",
  熱病抗體: "同類熱病再來會慢一步。",
  痛裡還能動手: "痛還在，下一步沒停。",
  冷裡活下來: "極寒週把耐寒重新叫醒。",
  熱裡還能走: "酷熱裡步距重新對上。",
  通緝壓力: "通緝值已跨過公開壓力閾值。",
  風聲正緊: "當週風聲緊，危機選項變重。",
  信任破裂: "合法交易與動員都會打折。",
  社會信任破裂: "合法交易與動員都會打折。",
  惡名遠播: "惡名在地下是通貨，在法庭是證。",
  輿論翻臉: "合法門路先關，地下門路先開。",
  信用見底: "盤查與擔保先假設你有問題。",

  caste_contaminate: "你聽過那種否認，它佔用注意。",
  caste_revulsion: "身體先拒絕靠近，判斷也變窄。",
  caste_witness: "你見過制裁被做成節目。",
  caste_reputation: "有人把你與那欄罪名放一句。",
  caste_adjacent: "同房或說過話被讀成同類。",
  caste_enforcer: "你動手或起鬨，院子買短保護。",

  figure_witness: "你與一個歷史身體共用過半徑。",
  figure_orbit: "你被還在運轉的歷史機器看見。",
  figure_ally: "合作被寫進兩邊更長的名單。",
  figure_enemy: "敵對是清算隊列裡的一個位置。",
  figure_client: "你被用成手續，清算時先交出。",
  figure_hunted: "國家或集團開始用你的臉辦公。",
  figure_butterfly: "後續年表已偏離你記得的版本。",
  figure_failed_hand: "企圖被記錄，失敗更常留下手。",

  world_stray_fire: "你站過會飛鐵與玻璃的半徑。",
  world_curfew: "合法的戶外時間被切短。",
  world_famine_witness: "公共的粥與排隊寫進胃。",
  world_plague_queue: "體溫、口罩與空貨架是基建。",
  world_slum_tax: "沒有法院的稅，拒繳都進帳。",
  world_arctic_exposure: "風、冰與誤點補給先到達。",
  world_heat_exposure: "熱浪把戶外寫成醫療事件。",
  world_affluent_silence: "牆內的事被說成家務。",
  world_street_lookout: "你被用成眼睛，眼睛可被指認。",
  world_looter: "災難裡的短少會指向還能走的人。",
  world_informant: "你把位置或名字交出去。",
  world_raid_night: "門在不該響的時辰響。",
  world_blackout: "窗縫不能漏光，黑暗成紀律。",
  world_shelter_line: "地下室位置比成績先被記住。",
  world_epidemic_mark: "門上的紙比病本身活得久。",
  world_extractive_child: "童工時被當成家產抽取。",
  world_collapse_dust: "你吸過塌屋或火災那陣灰。",
  world_checkpoint: "通行證與搜查改寫了出門。",
  world_silent_witness: "你看見了，沒有把名字交出。",
  world_child_labor_street: "工資按童工匯率結算。",
  world_listed: "名單或檢舉把你或你家寫進去。",
  world_draft_notice: "兵役或勞役把名字寫進隊列。",
  world_mass_layoff: "工錢中斷比口號先到。",
  world_devaluation: "鈔票還在，能換的東西少了。",
  world_bias_queue: "發放按臉與口音排序。",
  world_border_run: "你走過關卡、水路或封鎖線。",

  household_volatile: "家中情緒與動手都不穩定。",
  household_alcohol: "照護者的酒改寫夜晚規則。",
  household_neglect: "溫飽與在場都不被當成義務。",
  household_extractive: "兒童的時間與工資當家產。",
  household_step_tension: "有人以「不是親生」來立威。",

  social_feared: "路人先把視線挪開。",
  social_shunned: "排隊與租屋都在少你一個位子。",
  social_cold: "招呼變短，沒人解釋為什麼。",
  social_ordinary: "沒人特別記得你。",
  social_trusted: "有人肯把名字和你放同桌。",
  social_courted: "門開得快，靠近的人各有帳。",

  parent_father_alive: "父親在戶口剛寫上時仍在冊。",
  parent_father_deceased: "父親在你能記事前已不在。",
  parent_mother_alive: "母親在戶口剛寫上時仍在冊。",
  parent_mother_deceased: "母親在你能記事前已不在。",
  lineage_mixed: "父系與母系出身不一致。",
  lineage_unmixed: "雙親出身被登記為同一系。",
  父親在世: "父親在戶口剛寫上時仍在冊。",
  父親已故: "父親在你能記事前已不在。",
  母親在世: "母親在戶口剛寫上時仍在冊。",
  母親已故: "母親在你能記事前已不在。",

  舊世界出身: "出生於戰爭全面改寫地圖之前。",
  戰後一代: "童年疊在重建、佔領與冷戰上。",
  轉型一代: "計劃、市場與邊境同時改寫。",
  全球一代: "資本、媒體與遷徙加速的年代。",
  數位原住民: "檔案與監視開始電子化的年代。",

  大都會: "密度、官署與市聲疊在同一條街。",
  城市: "街市、單位與戶籍比田埂更近。",
  港口: "貨物、船員與檢查先於街坊到。",
  工廠區: "汽笛與粉塵決定作息。",
  村子: "戶籍與糧秤比街燈更早到。",
  農村: "戶籍與糧秤比街燈更早到。",
  貧民窟: "非正式住房與共用龍頭構成社會。",
  極地: "補給與凍土路比性格先到。",
  地下街: "日光是配給，季節被岩層緩衝。",
  戰亂區: "武裝衝突改寫出門與睡眠。",
  "難民／流離營區": "臨時戶籍與配給水構成日常。",
  新都: "軸線比記憶更早被畫出來。",

  risk_sickle_trait: "瘧區常見的血球攜帶標記。",
  condition_sickle_trait: "溶血與疼痛危象已被寫進身體。",
  risk_thalassemia_trait: "地中海與南亞較常見的貧血攜帶。",
  condition_thalassemia_trait: "貧血表現已進入可被醫者看見。",
  risk_g6pd_deficiency: "某些藥物與豆類會觸發溶血。",
  condition_g6pd_deficiency: "溶血發作已被寫進病歷。",
  risk_color_vision_anomaly: "色覺辨識與同齡人不完全一樣。",
  condition_color_vision_anomaly: "色覺差異已影響工種與軍檢。",
  risk_myopia_risk: "近距離用眼的家族近視傾向。",
  condition_myopia_risk: "近視已進入需矯正的程度。",
  risk_asthma_atopy: "氣道與過敏的家族高反應。",
  condition_asthma_atopy: "氣喘或過敏已反覆發作。",
  risk_diabetes_t2_risk: "二型糖尿病的家族風險標記。",
  condition_diabetes_t2_risk: "血糖調節已進入病況。",
  risk_hypertension_risk: "血壓調節的家族偏向。",
  condition_hypertension_risk: "高血壓已進入需處理的區間。",
  risk_migraine_familial: "偏頭痛的家族發作傾向。",
  condition_migraine_familial: "偏頭痛已反覆打斷勞動。",
  risk_hearing_loss_risk: "感音聽力的家族風險。",
  condition_hearing_loss_risk: "聽力損失已影響對話與工種。",
  risk_hemophilia_carrier: "凝血因子的家族標記。",
  condition_hemophilia_carrier: "出血不易止，勞動因此變貴。",
  risk_celiac_risk: "麩質敏感的家族傾向。",
  condition_celiac_risk: "主食選擇被腸道反應收窄。",
  risk_rheumatoid_risk: "自體免疫關節的家族傾向。",
  condition_rheumatoid_risk: "關節發炎已影響勞動。",
  risk_congenital_murmur_risk: "心臟結構的家族提示。",
  condition_congenital_murmur_risk: "雜音或結構問題已被聽見。",
  risk_night_blindness_risk: "暗適應偏慢的家族傾向。",
  condition_night_blindness_risk: "夜路與燈火管制對你更險。",
  risk_high_hematocrit: "紅血球偏高的高原家族傾向。",
  condition_high_hematocrit: "血稠讓血栓與海拔反應變近。",

  env_polar_night: "此月日照極短或連續黑夜。",
  env_extreme_cold: "高緯或大陸型冬天的極端低溫。",
  env_midnight_sun: "高緯夏季的午夜太陽。",
  env_extreme_heat: "旱地或熱帶夏季的高熱。",
  env_monsoon: "季風帶雨季的潮濕與暴雨。",
  env_thin_air: "高海拔聚落終年氣壓較低。",
  env_dust_dry: "旱季的沙塵與缺水。",
  env_underground: "洞穴或地下街，季節被岩層緩衝。",
  env_high_latitude: "北極圈或近北極圈聚落。",
  date_winter: "此日在該半球屬冬季。",
  date_spring: "此日在該半球屬春季。",
  date_summer: "此日在該半球屬夏季。",
  date_autumn: "此日在該半球屬秋季。",
  date_wet_season: "低緯氣候在此月進入雨季。",
  date_dry_season: "低緯氣候在此月進入旱季。",
  date_leap_day: "閏年才存在的二月二十九日。",
  date_leap_year: "該年為格里曆閏年。",
  hemisphere_north: "緯度落在北半球。",
  hemisphere_south: "緯度落在南半球。",
  hemisphere_equatorial: "緯度落在赤道帶，四季不明。",
  極夜: "此月日照極短或連續黑夜。",
  極寒: "高緯或大陸型冬天的極端低溫。",
  嚴寒: "冷帶冬天把戶外寫成要命的活。",
  極晝: "高緯夏季的午夜太陽。",
  酷熱: "旱地或熱帶夏季的高熱。",
  "季風／雨季濕熱": "季風帶雨季的潮濕與暴雨。",
  稀薄空氣: "高海拔聚落終年氣壓較低。",
  乾旱揚塵: "旱季的沙塵與缺水。",
  地下環境: "洞穴或地下街，季節被岩層緩衝。",
  高緯極地: "北極圈或近北極圈聚落。",
  冬季: "此日在該半球屬冬季。",
  春季: "此日在該半球屬春季。",
  夏季: "此日在該半球屬夏季。",
  秋季: "此日在該半球屬秋季。",
  雨季: "低緯氣候在此月進入雨季。",
  旱季: "低緯氣候在此月進入旱季。",
  閏日出生: "閏年才存在的二月二十九日。",
  閏年: "該年為格里曆閏年。",
  北半球: "緯度落在北半球。",
  南半球: "緯度落在南半球。",
  赤道帶: "緯度落在赤道帶，四季不明。",
});

export const PREFIX_GLOSS = Object.freeze({
  ethnicity_: "血統在戶口與街坊裡先被歸類。",
  trait_: "先天體質或感官的偏向。",
  parent_trait_: "父母留下的能力偏向。",
  parent_: "家庭結構寫在戶口上。",
  lineage_: "血統與戶籍交叉的位置。",
  acquired_: "後來被街坊或檔案加上的標記。",
  climate_: "出生地的長期氣候條件。",
  class_: "原生家庭的階級位置。",
  wealth_: "現金、負債與破產在這一期留下的記號。",
  kin_: "家人、伴侶或對頭在這一期留下的牽絆。",
  region_: "地緣與政權覆蓋的範圍。",
  settlement_: "戶籍出生地的地理位置。",
  socio_: "原生家庭的資源與位移條件。",
  trauma_: "創傷在身體與判斷上留下的紀錄。",
  school_: "校園位置、處分或加害紀錄。",
  adult_: "成年後的職位、債務或檔案。",
  path_: "街坊開始把你往哪一頭歸類。",
  caste_: "監獄或街坊種姓的株連標記。",
  world_: "這一期公共事件留下的位置。",
  figure_: "與公開歷史身體的交集紀錄。",
  social_: "路人對你的公開態度。",
  mood_: "連續數週心情停在極端區間。",
  household_: "家裡的照護與動手氣候。",
  condition_: "已表現出來的生理標記。",
  risk_: "家族或攜帶狀態的健康標記。",
  env_: "出生或當日的極端環境條件。",
  date_: "曆法寫在身上的季節或日期。",
  hemisphere_: "出生地相對赤道的半球位置。",
  ledger_: "帳本跨過閾值後的公開壓力。",
  crime_: "犯罪紀錄留下的公開標記。",
  politics_: "政治檔案留下的公開標記。",
  hook_: "出身條件會改寫能碰上的事。",
  current_: "這一期天氣、季節或環境的即時條件。",
  daily_: "這一期日常位置留下的標記。",
});

export const CATEGORY_GLOSS = Object.freeze({
  ethnicity: PREFIX_GLOSS.ethnicity_,
  trait: PREFIX_GLOSS.trait_,
  parent: PREFIX_GLOSS.parent_,
  lineage: PREFIX_GLOSS.lineage_,
  acquired: PREFIX_GLOSS.acquired_,
  climate: PREFIX_GLOSS.climate_,
  class: PREFIX_GLOSS.class_,
  region: PREFIX_GLOSS.region_,
  settlement: PREFIX_GLOSS.settlement_,
  socio: PREFIX_GLOSS.socio_,
  trauma: PREFIX_GLOSS.trauma_,
  school: PREFIX_GLOSS.school_,
  adult: PREFIX_GLOSS.adult_,
  path: PREFIX_GLOSS.path_,
  caste: PREFIX_GLOSS.caste_,
  world: PREFIX_GLOSS.world_,
  figure: PREFIX_GLOSS.figure_,
  social: PREFIX_GLOSS.social_,
  mood: PREFIX_GLOSS.mood_,
  household: PREFIX_GLOSS.household_,
  condition: PREFIX_GLOSS.condition_,
  env: PREFIX_GLOSS.env_,
  date: PREFIX_GLOSS.date_,
  hemisphere: PREFIX_GLOSS.hemisphere_,
  hook: PREFIX_GLOSS.hook_,
  current: PREFIX_GLOSS.current_,
  daily: PREFIX_GLOSS.daily_,
  parentTrait: PREFIX_GLOSS.parent_trait_,
  wealth: PREFIX_GLOSS.wealth_,
  kin: PREFIX_GLOSS.kin_,
  misc: "街坊能叫得出來的公開標記。",
});

const CLASS_GLOSS = Object.freeze({
  peasant: "家裡幾乎沒有餘糧，孩子認田埂。",
  artisan: "手藝是家裡唯一的護身符。",
  worker: "工資按日或按週，生活貼機器。",
  merchant: "帳冊、秤砣與人情同樣重要。",
  intellectual: "書架比飯桌擠，字能改命也能惹禍。",
  official: "門檻內外規矩不同，先學察色。",
  military: "靴聲、口令與突然遷徙是背景。",
  gentry: "體面與空帳簿住在同一個屋簷。",
  immigrant: "口音與證件同時決定能不能留下。",
});

const CLIMATE_GLOSS = Object.freeze({
  tropical: "全年濕熱，疫病與黴菌更常到。",
  subtropical: "暖濕季節長，雨與熱輪流到。",
  temperate: "四季可辨，冬天仍要存糧。",
  continental: "冬夏極端，爐火與糧倉是基建。",
  cold: "嚴寒把戶外寫成要命的活。",
  arid: "水與沙塵決定一年菜單。",
  highland: "稀薄空氣比官署更先到達。",
  mediterranean: "乾夏與濕冬輪流改寫農事。",
  monsoon: "雨季與旱季比日曆更準。",
  polar: "極晝極夜改寫睡眠與補給。",
  tropical_savanna: "草原雨季短，旱季更長。",
  subpolar: "亞寒帶冬天把勞動切短。",
});

const REGION_GLOSS = Object.freeze({
  china: "中國大陸的戶籍、糧與政權覆蓋。",
  taiwan: "臺灣島的殖民、省籍與口岸史。",
  hongkong: "港澳口岸的殖民與轉口秩序。",
  japan: "日本列島的帝國、戰敗與重建。",
  korea: "朝鮮半島的殖民、分裂與戰爭。",
  mongolia: "草原與邊境政權反覆改寫。",
  se_asia: "季風、口岸與殖民邊界重疊。",
  south_asia: "種姓、季風與帝國遺產並存。",
  middle_east: "石油、邊界與帝國委任殘留。",
  africa: "殖民邊界與獨立後的國家機器。",
  russia: "俄蘇地帶的計劃、清洗與嚴寒。",
  west: "歐美工業、戰爭與福利國家。",
  latin_america: "莊園、軍政府與城市貧民窟。",
  oceania: "島嶼、移民與原住民並置。",
  arctic: "極圈補給、凍土與季節黑暗。",
});

const GEO_BAND_GLOSS = Object.freeze({
  affluent_safe: "牆內的水電先到，街上較少公開暴力。",
  ordinary: "一般城廂或鄉鎮，官署與市集都在步行距離。",
  industrial: "粉塵、汽笛與工傷比診所更近。",
  rural: "醫藥與官署都遠，糧秤先到。",
  slum: "非正式住房與共用龍頭構成社會。",
  camp: "臨時戶籍與配給水構成日常。",
  warzone: "武裝衝突改寫出門與睡眠。",
  arctic: "補給與凍土路比性格先到。",
  underground: "日光是配給，季節被岩層緩衝。",
  disaster: "這一期天氣或地質先改寫出門。",
});

const PLACE_GLOSS = Object.freeze({
  口岸: "貨物、船員與檢查先於街坊到。",
  港口: "貨物、船員與檢查先於街坊到。",
  貧民窟: "非正式住房與共用龍頭構成社會。",
  高密度: "樓縫切光，水電從牆縫長出來。",
  戰亂區: "武裝衝突改寫出門與睡眠。",
  農村: "戶籍與糧秤比街燈更早到。",
  平原: "平坦農地或城郊，風與路都長。",
  山城: "階梯與霧比街名更早決定方向。",
  江河: "碼頭、洪水與船班改寫出門。",
  運河: "船閘與駁船比街名更早決定方向。",
  運河區: "船閘與駁船比街名更早決定方向。",
  鐵路: "軌道比官署更早把人運走。",
  島嶼: "潮汐、淡水與船班構成邊界。",
  都會: "密度、官署與市聲疊在同一條街。",
  工業: "汽笛與粉塵決定作息。",
  工廠: "汽笛比雞鳴更準時。",
  難民營: "臨時戶籍與配給水構成日常。",
  高原: "稀薄空氣比官署更先到達。",
  寒帶: "嚴寒把戶外寫成要命的活。",
  沙漠: "水與船班決定一年菜單。",
  地下: "日光是配給，方向寫在岩壁。",
  殖民: "官方語言與稅先於街坊到。",
  隔離: "居住與通行按種族或階級切開。",
  商業: "行情與人情寫在同一本帳。",
  政治: "官署與清洗比市聲更近。",
  古都: "城牆與衙門比新街名更老。",
  戶籍: "冊比記憶更早把人寫清楚。",
  勞力: "身體被當成可出工的家產。",
  貧困: "家裡幾乎沒有緩衝存糧。",
  土地: "田畝與稅冊比工資更先到。",
  手藝: "手藝是家裡唯一的護身符。",
  作坊: "鋸末或針線氣味常年在屋裡。",
  市井: "街市比單位更早決定活路。",
  勞工: "工資按日或按週，生活貼機器。",
  城市: "街市、單位與戶籍比田埂更近。",
  資本: "帳冊與存貨是家裡的基礎設施。",
  流動: "人與貨都按行情搬家。",
  書香: "字被當成出路，也當成禍根。",
  學識: "書架比飯桌更擠。",
  輿論: "公開評價能開路，也能關路。",
  權貴: "門檻內外規矩不同。",
  人脈: "介紹比考試更先開門。",
  體制: "單位與檔案決定誰能留下。",
  軍旅: "靴聲、口令與突然遷徙是背景。",
  紀律: "口令比解釋更早到達。",
  動盪: "遷徙與缺席是童年節奏。",
  舊族: "禮儀與門楣比現金先保住。",
  禮教: "體面是隔音材料。",
  沒落: "發黃字畫與空帳簿同住。",
});

const FALLBACK = "街坊能叫得出來的公開標記。";

function coldObservation(text) {
  let raw = String(text || "");
  raw = raw.replace(/（[^）]*）/g, "").replace(/\([^)]*\)/g, "");
  raw = raw.replace(/[A-Za-z][A-Za-z0-9+\-]{1,}/g, "");
  raw = raw.replace(/經典民族誌[^。；]*/g, "");
  raw = raw.replace(/生理學題材[^。；]*/g, "");
  raw = raw.replace(/被反覆測量[^。；]*/g, "");
  raw = raw.replace(/有大量紀錄[^。；]*/g, "");
  raw = raw.replace(/接觸社會[^。；]*/g, "");
  raw = raw.split(/[；;]/)[0] || raw;
  return raw.replace(/\s+/g, " ").replace(/[、，\s]+$/g, "").trim();
}

function ethnicityObservation(row = {}) {
  const obs = coldObservation(row.observation);
  const regionId = (row.regions || [])[0];
  const geo = REGION_ZH[regionId] || REGION_GLOSS[regionId] || "";
  if (obs && geo && !obs.includes(geo)) return `${geo}。${obs}`;
  if (obs) return obs;
  if (geo) return `${geo}的血統在戶口與街坊裡先被歸類`;
  return PREFIX_GLOSS.ethnicity_;
}

const LOOKUP = (() => {
  const map = Object.create(null);

  const put = (id, label, text) => {
    const gloss = clipGloss(text);
    if (!gloss) return;
    if (id && !map[id]) map[id] = gloss;
    if (label && !map[label]) map[label] = gloss;
  };

  for (const row of SOCIO_TAG_DATABASE) put(row.tag || `socio_${row.id}`, row.label, TAG_GLOSS[row.tag] || row.reason);
  for (const row of TRAUMA_TAG_DATABASE) put(row.id, row.label, TAG_GLOSS[row.id] || row.reason);
  for (const row of MOOD_TAG_RULES) put(row.tag, row.label, TAG_GLOSS[row.tag] || row.reason);
  for (const row of SCHOOL_TAG_DATABASE) put(row.id, row.label, TAG_GLOSS[row.id] || row.reason);
  for (const row of ADULT_TAG_DATABASE) put(row.id, row.label, TAG_GLOSS[row.id] || row.reason);
  for (const row of LEDGER_TAG_RULES) put(row.tag || row.id, row.label, TAG_GLOSS[row.tag] || TAG_GLOSS[row.id] || row.reason);
  for (const row of PERP_CASTE_TAG_DATABASE) put(row.id, row.label, TAG_GLOSS[row.id] || row.reason);
  for (const row of FIGURE_TAG_DATABASE) put(row.id, row.label, TAG_GLOSS[row.id] || row.reason);
  for (const row of WORLD_TAG_DATABASE) put(row.id, row.label, TAG_GLOSS[row.id] || row.reason);
  for (const row of WEALTH_TAG_RULES) put(row.id, row.label, TAG_GLOSS[row.id] || row.label);
  for (const row of HOUSEHOLD_CLIMATE_TAGS) put(row.id, row.label, TAG_GLOSS[row.id] || row.reason);
  for (const row of TRAIT_DATABASE) put(row.tag, row.label, row.description);
  for (const row of PARENT_APTITUDE_DATABASE) put(row.tag, row.label, row.description);
  for (const row of CONDITION_DATABASE) {
    put(row.tag, row.label, TAG_GLOSS[row.tag] || row.observation || row.description);
    if (row.expressedTag) {
      put(row.expressedTag, row.expressedLabel, TAG_GLOSS[row.expressedTag] || row.observation);
    }
  }
  for (const row of ETHNICITY_DATABASE) {
    put(row.tag || `ethnicity_${row.id}`, row.label, ethnicityObservation(row));
  }
  for (const [id, label] of Object.entries(CLASS_ZH)) {
    put(`class_${id}`, label, CLASS_GLOSS[id] || PREFIX_GLOSS.class_);
  }
  for (const [id, label] of Object.entries(CLIMATE_ZH)) {
    put(`climate_${id}`, label, CLIMATE_GLOSS[id] || PREFIX_GLOSS.climate_);
  }
  for (const [id, label] of Object.entries(REGION_ZH)) {
    put(`region_${id}`, label, REGION_GLOSS[id] || PREFIX_GLOSS.region_);
  }
  for (const [id, label] of Object.entries(PATH_ZH)) {
    put(`path_${id}`, label, TAG_GLOSS[`path_${id}`] || PREFIX_GLOSS.path_);
  }
  for (const [id, label] of Object.entries(GEO_BAND_ZH)) {
    put(id, label, GEO_BAND_GLOSS[id] || label);
  }
  for (const [id, label] of Object.entries(PLACE_GLOSS)) put(id, id, label);

  for (const [key, text] of Object.entries(TAG_GLOSS)) {
    map[key] = clipGloss(text);
  }
  return Object.freeze(map);
})();

function prefixGloss(id) {
  const raw = String(id || "");
  for (const [prefix, text] of Object.entries(PREFIX_GLOSS)) {
    if (raw.startsWith(prefix)) return text;
  }
  return "";
}

function placeGloss(label) {
  const raw = String(label || "");
  if (PLACE_GLOSS[raw]) return PLACE_GLOSS[raw];
  if (/口岸|港口|港區|商埠/.test(raw)) return PLACE_GLOSS["口岸"];
  if (/貧民|貧民窟|高密度/.test(raw)) return PLACE_GLOSS["貧民窟"];
  if (/戰亂|戰區|圍城/.test(raw)) return PLACE_GLOSS["戰亂區"];
  if (/農村|鄉村|縣村/.test(raw)) return PLACE_GLOSS["農村"];
  if (/工業|工廠|礦/.test(raw)) return PLACE_GLOSS["工業"];
  if (/難民|營區/.test(raw)) return PLACE_GLOSS["難民營"];
  if (/高原|高海拔/.test(raw)) return PLACE_GLOSS["高原"];
  if (/沙漠|旱地|戈壁/.test(raw)) return PLACE_GLOSS["沙漠"];
  if (/北極|寒帶|極地/.test(raw)) return PLACE_GLOSS["寒帶"];
  if (/都會|都市|首都/.test(raw)) return PLACE_GLOSS["都會"];
  if (/地下|礦坑|穴居/.test(raw)) return PLACE_GLOSS["地下"];
  if (/運河/.test(raw)) return PLACE_GLOSS["運河"];
  return "";
}

function liveCurrentGloss(id) {
  const raw = String(id || "");
  if (raw.startsWith("current_env_")) {
    const envId = raw.replace(/^current_/, "");
    return TAG_GLOSS[envId] || PREFIX_GLOSS.env_;
  }
  if (raw.startsWith("current_date_")) {
    const dateId = raw.replace(/^current_/, "");
    return TAG_GLOSS[dateId] || PREFIX_GLOSS.date_;
  }
  return PREFIX_GLOSS.current_;
}

function ethnicityFromRecord(id, label) {
  const bare = String(id || "").replace(/^ethnicity_/, "");
  const row = ETHNICITY_BY_ID[bare]
    || ETHNICITY_DATABASE.find((item) => item.tag === id || item.label === label);
  return row ? ethnicityObservation(row) : "";
}

export function composeTagGloss(record = {}) {
  const id = String(record.id || "").trim();
  const label = String(record.label || "").trim();
  const category = record.category || inferCategory(id);
  const raw = LOOKUP[id]
    || LOOKUP[label]
    || TAG_GLOSS[id]
    || TAG_GLOSS[label]
    || ethnicityFromRecord(id, label)
    || (id.startsWith("current_") ? liveCurrentGloss(id) : "")
    || prefixGloss(id)
    || placeGloss(label)
    || CATEGORY_GLOSS[category]
    || FALLBACK;
  const clean = scrubPublicText(clipGloss(raw, MAX_GLOSS));
  if (!clean || isDossierLeakSentence(clean)) return FALLBACK;
  return clean;
}

export function tagGloss(record = {}) {
  return composeTagGloss(record);
}

export { LOOKUP as TAG_GLOSS_INDEX };
