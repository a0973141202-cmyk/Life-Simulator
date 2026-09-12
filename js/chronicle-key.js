/**
 * Shared de-dupe key for chronicle assembly and UI rendering.
 * Compact 22 characters; edema / fever / pulse collapse to one stem.
 */
export function chronicleLineKey(text) {
  const compact = String(text || "").replace(/\s/g, "");
  if (!compact) return "";
  if (/水腫/.test(compact) && /腿/.test(compact)) return "edema-body";
  if (/冷毛巾/.test(compact) && /燒/.test(compact)) return "fever-body";
  if (/時局/.test(compact)) return `pulse:${compact.slice(0, 22)}`;
  return compact.slice(0, 22);
}
