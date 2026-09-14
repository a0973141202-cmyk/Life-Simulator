/**
 * Independent chronicle sanitizer.
 * Splits 本期紀事 into sentence units, drops duplicates / pulse echoes /
 * contradictory pairs, then re-assembles a cold archival paragraph set.
 */
import { chronicleLineKey } from "./chronicle-key.js";
import { textsTooSimilar, normalizeChoiceText } from "./choice-similarity.js";
import { scrubPublicText, scrubRiddleText, isDossierLeakSentence } from "./data/public-text.js";
import { composeFortnightRecord, lockChronicleToClock, scrubEraCopy } from "./dynamic-prose.js";
import { scanNarrativeFacts } from "./narrative-facts.js";
import { publicTagLabel } from "./data/ui-zh.js";
import { composeMemeFortnight, composeMemeTagBeat, isMemeLegendCharacter } from "./meme-chronicle.js";
import { composeWeekScene } from "./week-scene.js";

const SENTENCE_SPLIT = /(?<=[。！？])\s*|\n+/;
const YEAR_GLUE = /((?:1[89]|20)\d{2}年[^。！？\n]{4,80}?)(?=(?:1[89]|20)\d{2}年)/g;

const CONTRADICTION_PAIRS = Object.freeze([
  [/少碰一次關卡/, /更難走完/],
  [/還能先付/, /口袋是空的|付不出/],
  [/還沒有人特別記得你/, /名冊上有你的名字|通緝/],
  [/睡得著/, /睡不好|神智差/],
  [/體格還撐得住/, /體格撐不住|走路會喘/],
]);

const PULSE_RE = /街上這兩週|聽得到的是|看得到的是|時局是|檔案比成績厚|清點戶口|半夜敲門/;

function cleanUnit(text, facts) {
  return lockChronicleToClock(
    scrubEraCopy(scrubRiddleText(scrubPublicText(String(text || "").trim())), facts),
    facts,
  ).replace(/\s+/g, " ").trim();
}

function endPunct(text) {
  const raw = String(text || "").trim();
  if (!raw) return "";
  return /[。！？]$/.test(raw) ? raw : `${raw}。`;
}

function stemKey(text) {
  const compact = normalizeChoiceText(text);
  if (!compact) return "";
  if (PULSE_RE.test(String(text || ""))) return "pulse:street";
  const key = chronicleLineKey(text);
  if (key.startsWith("pulse:")) return "pulse:street";
  return key || compact.slice(0, 18);
}

function unitsTooClose(left, right) {
  if (!left || !right) return false;
  if (stemKey(left) && stemKey(left) === stemKey(right)) return true;
  if (textsTooSimilar(left, right)) return true;
  const a = normalizeChoiceText(left);
  const b = normalizeChoiceText(right);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  // Shared long historical noun phrase (檔案比成績厚 / 清點戶口)
  const shared = ["檔案比成績厚", "清點戶口", "半夜敲門抓人", "冷戰政治壓力", "打水或看火"];
  const hit = shared.filter((needle) => a.includes(needle) && b.includes(needle));
  if (hit.length && (a.includes("街上") || b.includes("街上") || a.includes("聽得") || b.includes("聽得"))) {
    return true;
  }
  return false;
}

function contradicts(left, right) {
  return CONTRADICTION_PAIRS.some(([a, b]) => (
    (a.test(left) && b.test(right)) || (b.test(left) && a.test(right))
  ));
}

/**
 * Split chronicle blob into atomic sentence units.
 */
export function splitChronicleUnits(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  // Break before year stamps that start a new clause (need real whitespace).
  // Do NOT match zero-width before mid-clause years like 「這兩週是1987年」.
  const yearBroken = raw
    .replace(/\s+((?:1[89]|20)\d{2}年)/g, "\n$1")
    .replace(YEAR_GLUE, "$1\n");
  const units = [];
  for (const block of yearBroken.split(SENTENCE_SPLIT)) {
    const piece = String(block || "").trim();
    if (!piece) continue;
    // Also break mid-line contradictory follow pairs glued without punctuation.
    const pairBreak = piece
      .replace(/(少碰一次關卡)\s*(?=(?:1[89]|20)\d{2}年)/g, "$1。")
      .replace(/(更難走完)\s*(?=(?:1[89]|20)\d{2}年)/g, "$1。");
    for (const part of pairBreak.split(SENTENCE_SPLIT)) {
      const bit = String(part || "").trim();
      if (bit) units.push(bit);
    }
  }
  return units;
}

/**
 * Keep first unique unit; drop near-duplicates and contradiction partners of kept lines.
 * At most one leading year-stamp; later year prefixes are stripped or dropped.
 */
export function dedupeChronicleUnits(units = [], facts = {}, maxUnits = 7) {
  const kept = [];
  let sawYear = false;
  let sawAge = false;
  for (const raw of units) {
    let unit = cleanUnit(raw, facts);
    if (!unit || isDossierLeakSentence(unit)) continue;
    if (/接下來三步|才能過下一期|已寫在下面/.test(unit)) continue;
    const yearHit = /(?:1[89]|20)\d{2}年/.test(unit);
    if (yearHit) {
      if (sawYear) {
        unit = unit.replace(/^(?:1[89]|20)\d{2}年[，、]?\s*/, "").trim();
        if (!unit || unit.length < 6) continue;
        if (/^這兩週/.test(unit) && kept.some((row) => /這兩週/.test(row))) continue;
      } else {
        sawYear = true;
      }
    }
    if (/\d+\s*歲/.test(unit)) {
      if (sawAge && !yearHit) {
        // Drop bare age echoes after the first dossier line already stated age.
        if (/^當事人\s*\d+\s*歲|^[\d]+歲的/.test(unit.replace(/\s/g, ""))) continue;
      }
      sawAge = true;
    }
    if (kept.some((row) => unitsTooClose(row, unit) || contradicts(row, unit))) continue;
    kept.push(unit.replace(/[。！？]+$/g, ""));
    if (kept.length >= maxUnits) break;
  }
  return kept;
}

function tagBeat(ctx = {}, options = []) {
  if (isMemeLegendCharacter(ctx.character)) {
    return composeMemeTagBeat(() => 0.44, ctx, options);
  }
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  const drivers = [...new Set(
    (options || []).flatMap((row) => row.driverTags || []).map(String).filter(Boolean),
  )];
  const tags = drivers.length ? drivers : (facts.tags || ctx.tags || []).map(String);
  const city = facts.city || "此地";
  const year = facts.year || "";
  if (tags.some((tag) => tag.startsWith("trauma_"))) {
    return `舊傷口一碰就痛，${city}這兩週仍要按傷勢能做的事排活`;
  }
  if (tags.some((tag) => tag.startsWith("persona_"))) {
    if (tags.includes("persona_banana_legend") || tags.includes("persona_meme_dancer") || tags.includes("persona_brazil_samba") || tags.includes("persona_invincible_smile")) {
      return `${city}這兩週仍有巴西森巴與無敵笑容：舞步換掌聲，也換下一頓的口糧`;
    }
    if (tags.includes("persona_aniki_wrestle") || tags.includes("persona_biochem") || tags.includes("persona_forest_fairy")) {
      return `${city}這兩週仍是體育館燈與森之夜色：勞動與危機先交給身子扛，名聲隨之`;
    }
    if (tags.includes("persona_loyal_bond") || tags.includes("persona_deep_philosophy")) {
      return `重情重義這兩週先伸手：同伴低谷時他不肯先鬆開`;
    }
    if (tags.includes("persona_beast_senpai") || tags.includes("persona_stench_foul") || tags.includes("persona_shimokita_labor") || tags.includes("persona_114514") || tags.includes("persona_natsumikan") || tags.includes("persona_onmad_classic")) {
      return `下北澤這兩週仍是打工班表與夏蜜柑的酸：野獸氣息與危機一起來，薪水卻不一定準時`;
    }
    if (tags.includes("persona_high_roller") || tags.includes("persona_quit_ahead")) {
      return `${city}這兩週帳本與賭注並排，該搏的搏，該收的收`;
    }
    if (tags.includes("persona_brotherhood")) return `義氣這兩週還寫在走路的方式裏，朋友一喊就不先鬆手`;
    if (tags.includes("persona_principled")) return `底線寫死，不正當的路他看都不看`;
    if (tags.includes("persona_cat_keeper")) return `巷口簷下還有認得他的貓，飯與水都要先記一筆`;
    if (tags.includes("persona_loyal_friend")) return `同伴的事他仍記在心上，比自己的閑話先到`;
    if (tags.includes("persona_faithful")) return `答應過的人，他這兩週仍不改口`;
    if (tags.includes("persona_gentle")) return `語氣不衝，庄口的人都還肯跟他說話`;
    return `${city}這兩週，他仍按吃得起苦的那一套把活做完`;
  }
  if (tags.some((tag) => tag.startsWith("household_"))) {
    return `屋裏仍有人動手、鎖門，或把飯扣下來`;
  }
  if (tags.some((tag) => tag.startsWith("kin_") || tag.startsWith("parent_"))) {
    const who = facts.motherAlive && facts.motherName
      ? `母親${facts.motherName}`
      : (facts.fatherAlive && facts.fatherName ? `父親${facts.fatherName}` : "屋裏還在的人");
    return `${who}還管得著這兩週的飯與門`;
  }
  if (tags.some((tag) => tag.startsWith("wealth_") || tag.startsWith("socio_"))) {
    return `${year}年在${city}，這一戶能公開說出口的體面就那麼一點`;
  }
  if (tags.some((tag) => tag.startsWith("ethnicity_") || tag.startsWith("lineage_"))) {
    const eth = tags.find((tag) => tag.startsWith("ethnicity_"));
    const label = (eth && publicTagLabel(eth)) || "出身";
    return `口音和${label}在檢查時先於解釋`;
  }
  if (tags.some((tag) => tag.startsWith("school_"))) {
    return `${city}的院子裏仍有人攔路或勒索`;
  }
  if (ctx.weekEncounter?.pressure === "papers") {
    return `核名冊的人在核戶口。口音和衣服先於解釋`;
  }
  if (ctx.weekEncounter?.pressure === "hunger") {
    return `空碗比功課先到`;
  }
  return "";
}

/**
 * Build a lean, option-aligned fortnight record.
 * Prefers unified week-scene paragraph (era-novel tone) over dossier stacks.
 */
export function composeAlignedChronicle(rng, ctx = {}, options = []) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const roll = typeof rng === "function" ? rng : (() => 0.41);
  const scene = composeWeekScene(roll, ctx, options);
  if (scene?.chronicle) {
    // Keep as one flowing paragraph; sanitizer may still split on 。 for dedupe.
    return scene.chronicle;
  }
  let intro = String(ctx.weekEncounter?.intro || "").trim();
  if (isMemeLegendCharacter(ctx.character)) {
    intro = composeMemeFortnight(roll, ctx) || intro;
  }
  if (!intro) {
    intro = composeFortnightRecord(roll, ctx);
  }
  let pressureBeat = "";
  const pressure = String(ctx.weekEncounter?.pressure || "");
  if (pressure === "papers") {
    pressureBeat = `核名冊的人在核戶口。口音和衣服先於解釋`;
  } else if (pressure === "hunger") {
    pressureBeat = Number(facts.age || 0) >= 20
      ? `空碗與房租比名聲先到`
      : `空碗比功課先到`;
  } else if (facts.pulseTitle) {
    pressureBeat = `街上這兩週聽得到${facts.pulseTitle}`;
  } else if (facts.upheavalLabel) {
    pressureBeat = `街上這兩週聽得到${facts.upheavalLabel}`;
  }
  const units = dedupeChronicleUnits([
    intro,
    tagBeat(ctx, options),
    pressureBeat,
  ], facts, 5);
  return units.map(endPunct).join("\n").trim();
}

/**
 * Hard gate: sanitize any chronicle blob before UI.
 */
export function sanitizeChronicleText(text, ctx = {}, extras = {}) {
  const facts = ctx.narrativeFacts || scanNarrativeFacts(ctx);
  ctx.narrativeFacts = facts;
  const maxUnits = Number(extras.maxUnits || 7);
  const units = dedupeChronicleUnits(splitChronicleUnits(text), facts, maxUnits);
  if (!units.length) {
    const fallback = composeAlignedChronicle(() => 0.37, ctx, extras.options || []);
    return fallback || lockChronicleToClock(`${facts.year || ""}年，${facts.place || "此地"}。這兩週先過眼前的事。`, facts);
  }
  return units.map(endPunct).join("\n").trim();
}

export {
  unitsTooClose as chronicleUnitsTooClose,
  stemKey as chronicleStemKey,
};
