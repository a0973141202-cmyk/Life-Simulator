/**
 * Front-end display toggles. Engine meters stay in Character / ledger
 * regardless of these flags.
 *
 * 方案 A：聲望、惡名、社會信用只活在底層，不畫數字或條狀圖。
 * 改回顯示時把 SHOW_REPUTATION_UI 設為 true 即可；HUD 的 #stat-reputation 仍保留。
 */

export const SHOW_REPUTATION_UI = false;
