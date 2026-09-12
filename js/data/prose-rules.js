/**
 * Core voice for event copy, system logs, triad options, and NPC speech.
 *
 * 主體敘述直白清晰、拒絕謎語人；NPC 語言依個性而定.
 *
 * Two layers:
 *   System — fact, conflict, cost. No riddles. The player should know the
 *            situation and the interest at stake before choosing.
 *   NPC    — quoted speech follows that person's class, temper, and how they
 *            presently like / dislike / fear the protagonist. Slang, probing,
 *            stammering, or arrogance are character, not engine mysticism.
 *            The system still glosses what they actually want.
 *
 * Never: verbose colloquial recap; oracular grammar; replacing a player action
 * with a metaphor the player must guess. Fog may hide numbers, not the door.
 */

export const PROSE_VOICE_NOTE =
  "主體敘述直白清晰、拒絕謎語人：局勢與利害寫在明處。NPC 怎麼說話看個性與對你的態度，不是系統在出謎。";

export const SYSTEM_VOICE_NOTE =
  "客觀環境、事件主體、危機與後果用乾淨白話。精煉、不拐彎。禁止故作高深。";

export const NPC_VOICE_NOTE =
  "對話口吻跟這個人的個性、階級、當下情緒、以及對你的好惡／懼怕走。黑話、傲慢、支吾是性格造成的資訊落差，不是謎語。";

export const NPC_GLOSS_NOTE =
  "NPC 可以含糊。系統必須補一句他到底要什麼、不從會怎樣。";

export const PROSE_COST_NOTE =
  "用乾淨的白話文點出利益衝突、心理壓迫或生存危機。讀完就選，不先解謎。";

export const PROSE_BAN_NOTE =
  "禁止冗長流水帳，禁止故作高深的謎語人文法。隱性標籤可以改帳，不可以把行動改成暗號。NPC 黑話不算謎語人，前提是系統已點明利害。";

/** Fog may hide numbers. It may not hide what the door does. */
export const FOG_KEEPS_ACTION = true;

export const RIDDLE_PATTERNS = Object.freeze([
  /還沒有名字的東西/,
  /把影子留在原地/,
  /數到三再眨眼/,
  /體內有一枚尚未被公開的標籤/,
  /借這扇門出門/,
  /把運氣從左邊口袋換到右邊/,
  /對鏡子練習一種還不屬於你的表情/,
  /水平線像一句沒寫完/,
  /空氣已經像它/,
  /選擇比較像門的那道光/,
  /命運的風鈴/,
  /暗影在呼吸中交織/,
  /命運在風中/,
  /光影交織/,
  /呼吸中交織/,
  /尚未被公開的命運/,
  /聽起來輕的那一步/,
  /帳從別處扣/,
  /舊傷先發制人/,
  /好處變薄/,
  /字面像好處/,
  /日子普通得像/,
  /出路像很多扇門/,
]);

/** Abstract stems swapped for a concrete fact the player can act on. */
export const RIDDLE_REPLACEMENTS = Object.freeze([
  [/命運的風鈴在風中搖晃/g, "街上有人在喊名字、敲門或清點戶口"],
  [/命運的風鈴/g, "戶口清點或敲門聲"],
  [/暗影在呼吸中交織/g, "巷裡有人跟在後面，呼吸聽得見"],
  [/戰爭的影子一天比一天近/g, "徵兵、空襲與逃難的消息一天比一天近"],
  [/仍是總力戰的影子/g, "仍在配給、徵召與空襲裡"],
  [/武裝的影子/g, "持槍的人或巡邏隊"],
  [/心情像陰天/g, "睡不好、提不起勁、容易發呆"],
  [/日子普通得像一碗白水/g, "這一週沒有新病，也沒有新的工"],
  [/出路像很多扇門/g, "眼前能選的是找工、求人，或繼續挨餓"],
  [/這扇門不預告/g, "這個選項不預告"],
  [/這扇門先讓你/g, "這個選項先讓你"],
  [/借這扇門出門/g, "從這條路離開"],
  [/本週沒有可選的門/g, "本期沒有可執行的動作"],
  [/聽起來輕的那一步，帳從別處扣。?/g, "這一步做完，接下來可能發燒、挨打、被扣飯，或被人記住把柄。"],
  [/聽起來輕。實際會扣時間、留下把柄，或讓你受傷。/g, "這件事看起來不費力。做完仍可能浪費半天、被人抓住把柄，或把人弄傷。"],
  [/舊傷在這個情境裡先發制人：好處變薄，身體先記得痛。/g, "舊傷口或舊巴掌一碰上類似的場面就先痛：原本能緩一口氣的好處沒了。"],
  [/舊傷先發制人/g, "舊傷口先痛起來"],
  [/好處變薄。?/g, "能換到的飯、藥或讓路變少了。"],
  [/名單先於你的解釋被打開。好處變薄。/g, "名冊先被打開，還沒輪到你解釋。能領的糧、能走的門變少了。"],
  [/處分紀錄在這個情境裡先被打開。好處變薄。/g, "處分紀錄先被拿出來給人看。這次能少挨的罰、能過的門變少了。"],
  [/動盪讓普通也變薄。?/g, "時局一緊，沒人特別害你，也沒人記得讓路。"],
  [/字面像好處。帳會從健康、把柄或時間裡扣。/g, "字面上像占便宜。做完可能發燒、被人抓住把柄，或白白耗掉半天。"],
  [/身體在收費/g, "發燒、咳嗽或腿腫都要躺著熬"],
  [/按缺眠計價/g, "第二天走路發飄、眼皮抬不起來"],
  [/按組織壞死計價/g, "手指或腳趾發黑、失去知覺"],
  [/以生命計價/g, "被抓到可能打死或餓死"],
  [/按敵我識別計價/g, "被當成間諜或逃兵來搜身、扣押"],
  [/用冷毛巾與等待計價/g, "只能用冷毛巾擦汗，等燒自己退"],
  [/睡眠變薄/g, "夜裡反覆醒來，睡不夠"],
  [/庫存變薄/g, "柴、糧或存糧又少了一截"],
  [/配給本卻變薄/g, "配給本上能領的份量又少了一格"],
  [/體面的理由在桌前變薄/g, "桌上沒人再聽體面的理由，只看口音和衣服"],
  [/判斷變薄、步子變快/g, "興奮過頭：話多、步子快、容易判斷錯"],
  [/帳從別處扣/g, "後果從發燒、扣飯或挨打上表現出來"],
  [/這一週的因果對不齊，帳還是入了。?/g, "這一期做的事和後來發生的對不上，燒、扣飯或被點名仍照樣來。"],
  [/後果不必對得上動機。帳還是會入。/g, "用意是好的，燒、扣飯或被抓住把柄仍可能發生。"],
  [/本週混沌檔/g, "本期結果"],
]);

export const VERBOSE_BAN_PATTERNS = Object.freeze([
  /然後呢然後呢/,
  /總而言之總而言之/,
]);
