/**
 * Detection patterns for the live text logic filter.
 * These are fail-closed scanners, not player-facing sentence banks.
 */

export const STRENUOUS_ACTION_PATTERNS = Object.freeze([
  /狂奔|飛奔|猛撲|衝刺|連跳|全力奔跑|瘋跑|徹夜狂歡/,
  /扛麻袋|連夜趕路|通宵搬|搏鬥到天亮|扭打一整夜|連搬三趟/,
  /把人從地上拽起來猛|上房揭瓦|重體力/,
]);

export const LUXURY_SPEND_PATTERNS = Object.freeze([
  /揮霍|一擲千金|出手闊綽|大手大腳|隨手買下/,
  /金條|豪宅|轎車|珠寶|筵席|酒樓擺滿|巨資|買下整棟/,
]);

export const ADULT_ROLE_PATTERNS = Object.freeze([
  /仕途|應酬|職場|升遷|官場|交易所|入股|投票/,
  /娶親|嫁妝|納稅完|當兵入伍/,
]);

export const INFANT_ROLE_PATTERNS = Object.freeze([
  /工頭喊|遲到的罰金|工廠汽笛|當兵入伍|娶親|嫁妝|入股/,
]);

export const SCHOOLYARD_ONLY_PATTERNS = Object.freeze([
  /院子裡踢|點名冊|學籍被撕/,
]);

export const ABSURD_CAUSE_PATTERNS = Object.freeze([
  /趁(?!宵禁|戒嚴|封城|清人|封鎖)[^，。]{1,16}還沒把門封死/,
]);
