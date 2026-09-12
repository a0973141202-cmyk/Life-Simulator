/**
 * Procedural narrative matrix for generic weeks:
 * hunger / illness / family / labor / play / money.
 * Tokens: {year} {place} {city} {country} {class} {eraDetail} {classDetail} {tagColor} {verb}
 */

function band(id, years, details) {
  return { id, years, ...details };
}

export const VARIATOR_KINDS = Object.freeze([
  "hunger", "illness", "family", "labor", "play", "money",
]);

export const ERA_BANDS = Object.freeze([
  band("twenties", [1920, 1929], {
    hunger: "糧店時開時關，有人把樹皮和糠混進鍋",
    illness: "退燒藥貴，診所的燈常常不亮",
    family: "家裏用巴掌和口令管人，鄰里比巡警先到",
    labor: "田、碼頭或作坊按日結，童工不算新聞",
    play: "能玩的空隙夾在打水和看弟妹中間",
    money: "銀元、銅板和人情同一本帳",
  }),
  band("thirties", [1930, 1939], {
    hunger: "失業隊伍排到巷口，配給麵包發綠也有人搶",
    illness: "營養不良先腫腿，再輪到咳嗽和瀉",
    family: "飯不夠時先扣最小的那一碗",
    labor: "廠門縮班，田裏的人被徵去修路或挖壕",
    play: "空襲演習或街頭口號打斷跳房子",
    money: "工錢拖欠，舖子把隔夜貨當新鮮賣",
  }),
  band("forties", [1940, 1949], {
    hunger: "配給本比鍋準，空襲過後糧店先關門",
    illness: "傷口在潮氣裏化膿，磺胺和床位都按人情",
    family: "有人被徵走，屋裏剩下的人輪流看門",
    labor: "搬沙包、縫軍服或去工廠頂缺",
    play: "警報一響，遊戲改成認防空洞的方向",
    money: "金飾縫進衣擺，鈔票一週一個價",
  }),
  band("fifties", [1950, 1959], {
    hunger: "公共食堂或配給窗口按勺計，排隊比鐘準",
    illness: "單位醫務室先問成分，再問燒到幾度",
    family: "成分和戶口本決定誰能進哪一扇門",
    labor: "工分、指標或加班都寫在牆上",
    play: "課後仍要拾廢鐵或幫廚",
    money: "票比錢管用：糧票、布票、油票",
  }),
  band("sixties", [1960, 1969], {
    hunger: "定量再縮一圈，鍋底的糊也要刮乾淨",
    illness: "缺藥的週，退燒靠冷毛巾和等",
    family: "一句話能被寫進檢討，家裏先把嘴管住",
    labor: "勞動現場比課堂長，手裂了仍要交量",
    play: "跳皮筋之前先看今天能不能出門",
    money: "票證和關係同時短缺",
  }),
  band("seventies", [1970, 1979], {
    hunger: "定量還在，黑市的油和糖只認熟臉",
    illness: "合作醫療或廠醫先發退熱片，針劑要等",
    family: "屋裏仍按輩分分肉，客人來才開燈",
    labor: "夜班和義務勞動搶同一晚的睡眠",
    play: "彈珠和紙牌要躲管事的大人",
    money: "補貼少、排隊長，櫃檯常說沒有了",
  }),
  band("late", [1980, 2025], {
    hunger: "有人先看見貨架，有人仍只看見空碗和漲價",
    illness: "掛號、自費藥和退燒貼同時存在",
    family: "房租和學費開始跟巴掌搶管教權",
    labor: "加班、下崗或臨時工按週結",
    play: "能玩的時間仍要先做完家裏的活",
    money: "鈔票重新變重，人情沒有變輕",
  }),
]);

export const CLASS_DETAILS = Object.freeze({
  peasant: {
    hunger: "糠、樹皮、清水湯，或把發黴的黑麵包切掉綠的再吃",
    illness: "請不起大夫，燒和瀉就在炕上熬",
    family: "田埂上的活比年紀先分下來",
    labor: "水桶、鋤頭和看場，從天亮收到天黑",
    play: "田埂上跳一步就算玩，被喊回去就結束",
    money: "餘糧幾乎沒有，欠的是種籽和人情報",
  },
  worker: {
    hunger: "廠食堂的冷饅頭、清湯，或把配給麵包泡軟再嚥",
    illness: "醫務室先問你還能不能上工",
    family: "倒班讓屋裏總有人睡著、總有人餓著",
    labor: "汽笛比雞鳴準，加班寫在出勤簿",
    play: "工房後巷踢罐子，被工頭看見就散",
    money: "工錢按週或按日，扣了罰金只剩夠買糧",
  },
  artisan: {
    hunger: "活沒送來就停伙，釘子和麵搶同一筆錢",
    illness: "手裂、眼傷比發燒先被檢查，因為手就是飯碗",
    family: "作臺和飯桌是同一張",
    labor: "鋸末、針線或補鍋，活做不完不能睡",
    play: "邊看火邊玩，火滅了玩也沒了",
    money: "顧客賒帳，家裏先餓",
  },
  merchant: {
    hunger: "舖子裏賣不掉的隔夜貨先填自家的胃",
    illness: "還能站櫃檯就先不關門",
    family: "行情比搖籃曲先被小孩學會",
    labor: "秤、帳冊和看店，關門才算這一週過完",
    play: "櫃檯後面數銅板，被當成幫忙不算玩",
    money: "帳上的虧比臉上的笑先到",
  },
  intellectual: {
    hunger: "稿費或薪水沒來，米缸見底仍要留一盞燈",
    illness: "燒糊了稿紙比燒糊了粥更常見",
    family: "一句話要先想會不會惹禍再出口",
    labor: "抄、教、譯或寫大字報，手比胃先酸",
    play: "舊書邊角折成玩具，被看見要收回去",
    money: "字能換飯，也能換一次被約談",
  },
  official: {
    hunger: "廳堂還掛著字，配給本上能領的份量又少了一格，客人來才開葷",
    illness: "先找熟識的醫官，再決定要不要請假",
    family: "門檻內外兩套規矩，孩子先學看臉色",
    labor: "開會、蓋章、寫材料，比搬磚更耗夜",
    play: "院子裏能跑，巷口不一定能去",
    money: "薪水按級，送禮和挨剋是同一本帳",
  },
  military: {
    hunger: "軍糧或留下的家屬配給，有一頓沒一頓",
    illness: "營醫或巡診先看還能不能走隊列",
    family: "靴聲一停，屋裏就要重新分活",
    labor: "搬彈藥箱、縫補或幫廚，口令比鐘準",
    play: "玩也排成隊，解散才算真正的玩",
    money: "津貼晚到，家裏先借鄰里的鹽",
  },
  gentry: {
    hunger: "廳堂還掛著字，米缸卻空了半截",
    illness: "舊年號的藥方不一定配得到藥",
    family: "體面和空帳簿共一個屋簷",
    labor: "從前使喚人的活，現在自己做，仍要裝沒事",
    play: "院子能玩，大門一出就要低頭",
    money: "當掉的是首飾，留下的是面子",
  },
  immigrant: {
    hunger: "兩種口音搶同一口粥，箱子比家具更像家",
    illness: "診所先問你從哪來，再問燒到幾度",
    family: "家裏同時說兩種話，對外只准說一種",
    labor: "最髒、最晚的工輪到新來的人",
    play: "巷口的孩子不一定讓你加入",
    money: "匯款和房租哪一筆先到期，哪一筆就先餓",
  },
});

export const TAG_COLORS = Object.freeze({
  neg: [
    "舊傷口一碰就痛；通緝或家裏的巴掌一上來，傷口先裂開",
    "空碗、鎖門或被點名，這一週沒有多餘的力氣裝沒事",
    "負面記號先於姓名：誰都能把你從隊伍裏拎出來",
  ],
  pos: [
    "還有一口熱的，或有人肯讓路，代價只是暫時少一點",
    "手裏還有沒做完的功課或能換糧的手藝",
    "有人記得你的名字，排隊時肯幫你擋一下",
  ],
  mixed: [
    "有人讓路，也有人扣飯。兩樣同一週發生",
    "手藝或功課還在，傷口和欠帳也在",
  ],
  plain: [
    "這一週沒有新的病，也沒有新的工，但舊的都還在",
    "能走的路還是那幾條：打水、買糧、關門",
  ],
});

export const FRAMES = Object.freeze({});
export const CHOICE_FRAMES = Object.freeze({});

export const FOOD_BY_CLASS = Object.freeze({
  peasant: "發黴的黑麵包或糠餅",
  worker: "冷饅頭或配給麵包",
  artisan: "隔夜的鍋底",
  merchant: "舖子裏賣不掉的隔夜貨",
  intellectual: "米缸底的碎米",
  official: "配給本上剩餘的那一勺",
  military: "留下的軍糧餅",
  gentry: "當舖沒收走的陳米",
  immigrant: "兩種口音搶的那口粥",
});
