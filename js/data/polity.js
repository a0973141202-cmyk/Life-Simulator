/**
 * Year-local polity names. The 1949 split is a geographic rule:
 * mainland China and Taiwan do not share a regime label after that year.
 */
export const CHINA_SPLIT_YEAR = 1949;

function foldTw(text) {
  return String(text || "").replace(/台/g, "臺");
}

export function isTaiwanPlace(country, region) {
  if (region === "taiwan") return true;
  return /臺灣|台灣/.test(String(country || ""));
}

export function isMainlandChinaPlace(country, region) {
  const raw = String(country || "");
  if (isTaiwanPlace(raw, region)) return false;
  if (region === "hongkong" || region === "mongolia" || region === "korea" || region === "japan") {
    return false;
  }
  if (/香港|澳門|蒙古/.test(raw)) return false;
  if (region === "china") return true;
  return /中華民國|中華人民共和國|(^|／)中國(／|$)|滿洲國|關東州/.test(raw);
}

function taiwanPolity(year) {
  const y = Number(year);
  if (Number.isFinite(y) && y <= 1945) return "日本／臺灣";
  if (Number.isFinite(y) && y < CHINA_SPLIT_YEAR) return "中華民國／臺灣";
  return "中華民國／臺灣省";
}

function mainlandPolity(year, raw) {
  const y = Number(year);
  const out = String(raw || "").trim();
  if (Number.isFinite(y) && y < CHINA_SPLIT_YEAR) {
    if (/滿洲國|關東州|日本/.test(out) && y <= 1945) {
      return out.replace(/(^|／)中國(?=／|$)/g, "$1中華民國") || "中華民國";
    }
    if (/西藏/.test(out)) {
      return out.replace(/(^|／)中國(?=／|$)/g, "$1中華民國") || "西藏／中華民國";
    }
    if (out && out !== "中國" && out !== "中華人民共和國") {
      return foldTw(out).replace(/(^|／)中國(?=／|$)/g, "$1中華民國").replace(/^中華人民共和國$/, "中華民國");
    }
    return "中華民國";
  }
  return "中華人民共和國";
}

export function canonicalizeCountry(country, year, region) {
  const raw = String(country || "").trim();
  const y = Number(year);
  if (isTaiwanPlace(raw, region)) {
    if (Number.isFinite(y) && y <= 1945 && /日本/.test(raw)) return foldTw(raw);
    return taiwanPolity(y);
  }
  if (isMainlandChinaPlace(raw, region) || (!raw && region === "china") || raw === "中國") {
    return mainlandPolity(y, raw);
  }
  let out = foldTw(raw);
  if (!Number.isFinite(y)) return out;
  if (y < CHINA_SPLIT_YEAR) {
    return out.replace(/(^|／)中國(?=／|$)/g, "$1中華民國");
  }
  return out.replace(/(^|／)中國(?=／|$)/g, "$1中華人民共和國");
}
