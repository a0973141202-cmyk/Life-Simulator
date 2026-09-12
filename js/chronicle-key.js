/**
 * Shared de-dupe key for chronicle assembly and UI rendering.
 * Compact 22 characters; edema / fever / pulse collapse to one stem.
 */
export function chronicleLineKey(text) {
  const compact = String(text || "").replace(/\s/g, "");
  if (!compact) return "";
  if (/水腫/.test(compact) && /腿/.test(compact)) return "edema-body";
  if (/冷毛巾/.test(compact) && /燒/.test(compact)) return "fever-body";
  if (/嚴寒|哈氣在門框|手指和腳趾發白/.test(compact)) return "cold-body";
  if (/中暑|口乾、頭暈/.test(compact)) return "heat-body";
  if (/雨季/.test(compact) && /衣服/.test(compact)) return "rain-body";
  if (/時局/.test(compact) || /街上這兩週/.test(compact) || /街上聽得到/.test(compact) || /看得到的是/.test(compact)) {
    return "pulse:street";
  }
  if (/檔案比成績厚|清點戶口|半夜敲門抓人/.test(compact) && /街|聽|傳/.test(compact)) {
    return "pulse:street";
  }
  return compact.slice(0, 22);
}
