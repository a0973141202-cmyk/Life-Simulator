/**
 * Archive UI binder. Engine stays in GameEngine; this file only paints DOM.
 * Required IDs are never renamed: current-year/age/location/environment,
 * stat-health/sanity/reputation/crisis, tags-container, event-history, choices-container.
 */

import { chronicleLineKey } from "./chronicle-key.js";
import { SHOW_REPUTATION_UI } from "./data/ui-config.js";
import { applyTheme } from "./theme-manager.js";
import { describeSocialFeedback, socialStanding } from "./social-feedback.js";
import { isDossierLeakSentence, isMetaPublicSentence, scrubPublicText } from "./data/public-text.js";
import { hasHan, isDebugCode, publicTagLabel, sanitizePublicLine, zhClimate } from "./data/ui-zh.js";
import { FIGURE_INDEX } from "./data/figures/catalog.js";
import { RELATION_LABEL } from "./data/figure-rules.js";
import { bindTagTooltips, decorateTagChip } from "./tag-tooltip.js";
import { readHallOfFame } from "./life-persist.js";
import { composeMementoCard } from "./memento.js";
import { inspectPublicLine } from "./text-monitor.js";
import { sanitizeChronicleText, splitChronicleUnits } from "./chronicle-sanitize.js";

const TAG_PRIORITY = new Set([
  "trauma", "school", "caste", "adult", "world", "figure",
  "mood", "socio", "path", "crime", "politics", "acquired", "household", "ledger", "social", "wealth", "kin",
  "ethnicity", "trait", "class", "climate", "region", "parent", "condition", "misc",
]);

const GATES = ["一", "二", "三"];
const CRISIS_COPY = {
  idle: "這一週還沒有人把你的名字寫進公開名單。",
  calm: "街上還沒有人當眾點你的名字，或把你從隊伍裏拖出去。",
  watch: "已經有人在盯你。排隊、盤問或閒話都比上週緊。",
  crisis: "街上已經公開點名。衙門或幫派只需要名單，不必講理。",
  ruin: "國家或幫派已經可以隨時把你收走。",
};

let onChoose = () => {};
let hallBrowseOpen = false;
let selectedHallId = null;
let onHallSelect = () => {};
let onHallClose = () => {};

function choose(index) {
  onChoose(index);
}

function $(id) {
  return document.getElementById(id);
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function text(id, value) {
  const node = $(id);
  if (node) node.textContent = value == null || value === "" ? "—" : String(value);
}

function bindReputationUi() {
  document.body.classList.toggle("hide-reputation-ui", !SHOW_REPUTATION_UI);
  const meter = document.querySelector('.meter[data-stat="reputation"]');
  if (meter) {
    meter.hidden = !SHOW_REPUTATION_UI;
    meter.setAttribute("aria-hidden", SHOW_REPUTATION_UI ? "false" : "true");
  }
  const title = $("vitals-title");
  if (title) title.textContent = SHOW_REPUTATION_UI ? "體徵與公開評價" : "體徵與危機";
  const plate = document.querySelector(".vitals-plate");
  if (plate) plate.setAttribute("aria-label", SHOW_REPUTATION_UI ? "體徵、聲望與危機" : "體徵與危機");
}

function setMeter(statId, value) {
  const num = clamp(value);
  text(statId, String(num).padStart(2, "0"));
  const meter = document.querySelector(`.meter:has(#${statId})`) || $(statId)?.closest(".meter");
  if (meter) meter.style.setProperty("--fill", String(num));
}

function sanityOf(state) {
  return clamp(state.stats?.sanity ?? state.stats?.mood ?? 50);
}

function reputationOf(state) {
  const standing = socialStanding(state.ledger || state.character || {});
  return clamp(standing.reputation);
}

function crisisOf(state) {
  const pressure = state.pressure?.score ?? 0;
  const career = state.career?.crisis || 0;
  const world = state.world?.pressure || 0;
  const inertia = state.history?.inertia || 0;
  return clamp(Math.max(pressure, career, world * 0.85, inertia));
}

function crisisLevel(state, score) {
  if (state.gameOver) return "ruin";
  const named = state.pressure?.level;
  if (named && named !== "calm") return named;
  if (score >= 70) return "ruin";
  if (score >= 48) return "crisis";
  if (score >= 28) return "watch";
  return state.ready ? "calm" : "idle";
}

function figureName(id) {
  return FIGURE_INDEX[id]?.name || "一位公開人物";
}

function visibleTags(state) {
  const records = state.character?.tagRecords || [];
  const visible = new Set(state.character?.visibleTags || []);
  const picked = [];
  const seen = new Set();
  for (const record of records) {
    if (record.hidden) continue;
    if (visible.size && !visible.has(record.id)) continue;
    if (!TAG_PRIORITY.has(record.category)) continue;
    if (String(record.id || "").startsWith("current_")) continue;
    if (/^date_\d/.test(record.id || "")) continue;
    const label = publicTagLabel(record);
    if (!label || isDebugCode(label) || isDossierLeakSentence(label)) continue;
    if (seen.has(label)) continue;
    seen.add(label);
    picked.push({ ...record, label });
    if (picked.length >= 28) break;
  }
  return picked;
}

function renderTags(state) {
  const root = $("tags-container");
  if (!root) return;
  bindTagTooltips();
  root.replaceChildren();
  const tags = visibleTags(state);
  if (!tags.length) {
    const empty = document.createElement("p");
    empty.className = "tags-empty";
    empty.textContent = "目前沒有可被街坊叫得出來的標記。";
    root.append(empty);
    return;
  }
  for (const record of tags) {
    const chip = document.createElement("span");
    chip.className = "tag";
    chip.dataset.cat = record.category || "";
    chip.textContent = record.label;
    decorateTagChip(chip, record);
    root.append(chip);
  }
}

function renderCrisis(state) {
  const score = crisisOf(state);
  const level = crisisLevel(state, score);
  const box = $("crisis-alert");
  if (box) box.dataset.level = level;
  const ledger = state.ledger || {};
  const bits = [];
  if (SHOW_REPUTATION_UI) {
    if (ledger.wanted) bits.push(`通緝 ${Math.round(ledger.wanted)}`);
    if (ledger.heat) bits.push(`熱度 ${Math.round(ledger.heat)}`);
    if (ledger.infamy) bits.push(`惡名 ${Math.round(ledger.infamy)}`);
    if (ledger.reputation != null) bits.push(`聲望 ${Math.round(ledger.reputation)}`);
    if (ledger.socialCredit != null) bits.push(`社會信用 ${Math.round(ledger.socialCredit)}`);
  } else if (state.ready) {
    bits.push(describeSocialFeedback(ledger, {
      salt: (state.time?.totalWeeksLived || 0) + (ledger.reputation || 0),
      upheaval: state.upheaval,
      ctx: {
        narrativeFacts: {
          year: state.time?.year,
          city: state.character?.cityName || "",
          upheavalLabel: state.upheaval?.label || "",
        },
      },
    }));
  }
  if (state.history?.inertia) bits.push(SHOW_REPUTATION_UI
    ? `年表偏移 ${Math.round(state.history.inertia)}`
    : (state.history.inertia >= 12 ? "街上開始傳另一套說法，和你記得的對不上。" : "街上的說法還沒跟你記得的那套拆開。"));
  if (state.history?.rewritten) bits.push("街上開始傳另一套說法，和你記得的對不上。");
  if (state.wealth?.line) bits.push(state.wealth.line);
  if (state.kin?.line) bits.push(state.kin.line);
  const endedFatal = Boolean(state.ending?.fatal || state.ending?.kind === "death");
  text("crisis-alert-text", state.gameOver
    ? (endedFatal ? "當事人已死。檔案已封存。" : "這一局到此為止。檔案已封存。")
    : CRISIS_COPY[level] || CRISIS_COPY.idle);
  text("crisis-alert-sub", bits.length
    ? bits.join(" · ")
    : (SHOW_REPUTATION_UI
      ? "街對你的態度寫在這裡。"
      : "街對你的態度寫在這裡。"));
}

function renderFigureLog(state) {
  const list = $("figure-log-list");
  const status = $("figure-log-status");
  const inertia = $("figure-inertia");
  if (!list) return;
  list.replaceChildren();
  const history = state.history || {};
  const relations = Object.entries(history.relations || {});
  const divergences = history.divergences || [];
  const rows = [];

  for (const [id, rel] of relations) {
    rows.push({
      id,
      butterfly: false,
      who: figureName(id),
      rel: RELATION_LABEL[rel] || "公開交集",
      note: history.lastFigureId === id ? "最近一次公開交集。" : "你們已經有過公開交集。",
    });
  }
  for (const row of divergences.slice(-8).reverse()) {
    rows.push({
      id: row.figureId,
      butterfly: true,
      who: figureName(row.figureId),
      rel: row.label || "這條街的說法開始不一樣",
      note: row.note || `${row.year || "?"}年，這條街的說法開始跟以前不一樣。`,
    });
  }

  if (!rows.length) {
    if (status) {
      status.hidden = false;
      status.textContent = history.lastFigureId
        ? `最近目擊：${figureName(history.lastFigureId)}。還沒有人把你們寫成一夥，也還沒有人把你們寫成對頭。`
        : "街上還沒有人把你和某個名人寫成一夥，也還沒寫成對頭。";
    }
  } else if (status) {
    status.hidden = true;
  }

  for (const row of rows.slice(0, 10)) {
    const li = document.createElement("li");
    if (row.butterfly) li.classList.add("is-butterfly");
    const who = document.createElement("div");
    who.className = "who";
    who.textContent = row.who;
    const rel = document.createElement("div");
    rel.className = "rel";
    rel.textContent = row.rel;
    const note = document.createElement("div");
    note.className = "note";
    note.textContent = sanitizePublicLine(row.note) || "";
    li.append(who, rel, note);
    list.append(li);
  }

  if (inertia) {
    const value = Math.round(history.inertia || 0);
    inertia.hidden = value <= 0 && !history.rewritten;
    inertia.textContent = history.rewritten || value >= 12
      ? "街上開始傳另一套說法，和你記得的對不上。"
      : "街上的說法還沒跟你記得的那套拆開。";
  }
}

function paragraph(textValue) {
  let clean = scrubPublicText(sanitizePublicLine(textValue) || "");
  if (!clean || isDossierLeakSentence(clean) || isMetaPublicSentence(clean)) return null;
  const p = document.createElement("p");
  p.textContent = clean;
  return p;
}

function scrollEventHistoryToLatest(root) {
  if (!root) return;
  const pin = () => {
    root.scrollTop = root.scrollHeight;
  };
  pin();
  requestAnimationFrame(pin);
}

function isOpeningJournal(entry = {}) {
  return /出生|意識萌芽/.test(entry.title || "")
    || /落地|第一次分得清|一名[男女]嬰|出生紀錄/.test(entry.text || "");
}

function publicLines(raw, year, seen, ctx = {}) {
  const cleaned = sanitizeChronicleText(String(raw || ""), {
    ...ctx,
    year,
    narrativeFacts: {
      year,
      city: ctx.character?.cityName || "",
      ...(ctx.narrativeFacts || {}),
    },
  }, { maxUnits: 8 });
  const units = splitChronicleUnits(cleaned);
  return units
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/落地|第一次分得清|前兩週開始按|一名[男女]嬰|出生紀錄|意識萌芽/.test(line))
    .filter((line) => !isDossierLeakSentence(line))
    .filter((line) => {
      const years = [...line.matchAll(/((?:1[89]|20)\d{2})\s*年/g)].map((row) => Number(row[1]));
      return !year || !years.length || years.every((stamp) => stamp === year);
    })
    .map((line) => scrubPublicText(sanitizePublicLine(line) || line))
    .filter(Boolean)
    .filter((line) => !isMetaPublicSentence(line))
    .filter((line) => inspectPublicLine(line, {
      ...ctx,
      year,
      character: ctx.character,
    }, { skipVariety: true }).ok)
    .filter((line) => {
      const key = chronicleLineKey(line);
      if (!key || seen.has(key)) return false;
      if (/(?:1[89]|20)\d{2}年/.test(line)) {
        if (seen.has("year:lead")) return false;
        seen.add("year:lead");
      }
      seen.add(key);
      return true;
    });
}

function appendClip(root, { kicker, title, body, year, seen, log, ctx }) {
  const lines = publicLines(body, year, seen, ctx).map((line) => paragraph(line)).filter(Boolean);
  if (!lines.length && !title) return;
  const article = document.createElement("article");
  article.className = log ? "clip clip-log" : "clip clip-lead";
  if (kicker) {
    const kick = document.createElement("p");
    kick.className = "clip-kicker";
    kick.textContent = kicker;
    article.append(kick);
  }
  if (title) {
    const heading = document.createElement("h3");
    heading.textContent = title;
    article.append(heading);
  }
  if (lines.length) {
    for (const line of lines) article.append(line);
  } else {
    const empty = paragraph("這一期沒有可公開的文字。");
    if (empty) article.append(empty);
  }
  root.append(article);
}

function renderEvent(state) {
  const root = $("event-history");
  if (!root) return;
  root.replaceChildren();

  const event = state.currentEvent || {};
  const liveYear = Number(state.time?.year);
  const paintCtx = {
    year: liveYear,
    ageYears: state.time?.ageYears,
    character: state.character,
    stats: state.stats,
    tags: state.character?.tags || state.tags,
  };

  // Past clips: keep only the last two choice records so the panel stays
  // an archival fortnight, not a wall of recycled years.
  const pastSeen = new Set();
  const past = (state.journal || [])
    .filter((entry) => !isOpeningJournal(entry))
    .filter((entry) => !isMetaPublicSentence(`${entry.title || ""}${entry.text || ""}`))
    .slice(-2);
  for (const entry of past) {
    appendClip(root, {
      kicker: entry.year && entry.month ? `${entry.year}年${entry.month}月` : (entry.year ? `${entry.year}年` : ""),
      title: entry.title && !/死亡證明|封閉測試/.test(entry.title) ? entry.title : "",
      body: entry.text,
      year: Number(entry.year) || liveYear,
      seen: pastSeen,
      log: true,
      ctx: paintCtx,
    });
  }

  // Current fortnight uses its own dedupe set so prior clips cannot blank it out.
  const leadSeen = new Set();
  const lead = document.createElement("article");
  lead.className = "clip clip-lead";
  const lockedKind = event.breakdown?.lockedTriad ? "撐不住了" : "";
  if (lockedKind) {
    const kicker = document.createElement("p");
    kicker.className = "clip-kicker";
    kicker.textContent = lockedKind;
    lead.append(kicker);
  }
  const title = document.createElement("h3");
  title.textContent = state.character
    ? `${state.character.name || "未名"} · ${state.stage?.label || ""}`
    : "尚未開檔";
  lead.append(title);
  const year = liveYear;
  const narrative = publicLines(event.narrative || state.message || "", year, leadSeen, paintCtx);
  const lines = narrative.map((line) => paragraph(line)).filter(Boolean);
  if (!lines.length) {
    const empty = paragraph(state.ready ? "本期沒有可公開的文字。" : "從五歲起，每一期只寫這兩週發生的事。");
    if (empty) lead.append(empty);
  } else {
    for (const line of lines) lead.append(line);
  }
  root.append(lead);

  if (state.gameOver && state.ending) {
    const banner = document.createElement("article");
    banner.className = "ending-banner";
    const h = document.createElement("h3");
    const res = state.ending.resolution || {};
    const rawTitle = res.title || "";
    h.textContent = /封閉測試/.test(rawTitle)
      ? "人生結算"
      : (rawTitle
        || (state.ending.kind === "session_close" ? "人生結算" : (state.ending.fatal === false ? "高齡結算" : "死亡證明")));
    const epitaph = scrubPublicText(String(res.epitaph || state.ending.epitaph || "")
      .replace(/封閉測試[^。]*/g, "")
      .replace(/測試版本[^。]*/g, ""));
    const endingLine = paragraph(epitaph || (state.ending.fatal === false ? "這一局到此為止。" : "當事人已死。"));
    banner.append(h);
    if (endingLine) banner.append(endingLine);
    root.append(banner);
  }

  scrollEventHistoryToLatest(root);
}

function renderChoices(state) {
  const root = $("choices-container");
  if (!root) {
    console.error("LifeSim: 找不到 #choices-container，無法繪製選項按鈕");
    return;
  }
  root.replaceChildren();
  const options = state.currentEvent?.options || [];
  if (state.gameOver || !options.length) {
    const empty = document.createElement("p");
    empty.className = "choices-empty";
    empty.textContent = state.gameOver
      ? "人生已結束。見結算面板。已做過的選擇不能撤回。"
      : "本期沒有可執行的動作。";
    root.append(empty);
    return;
  }
  options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice choice-btn";
    if (option.style === "fog" || option.effectsHidden) btn.classList.add("is-fog");
    if (option.butterfly) btn.classList.add("is-butterfly");
    btn.dataset.index = String(option.index ?? index);
    const gate = document.createElement("span");
    gate.className = "choice-index";
    gate.textContent = GATES[index] || String(index + 1);
    const body = document.createElement("span");
    body.className = "choice-text";
    body.textContent = sanitizePublicLine(option.text) || "（空白選項）";
    btn.append(gate, body);
    btn.addEventListener("click", () => choose(Number(btn.dataset.index)));
    root.append(btn);
  });
}

function render(state) {
  try {
    paintArchive(state);
  } catch (error) {
    console.error("LifeSim: 畫面繪製失敗", error);
    showBootError(error);
  }
}

function paintArchive(state) {
  bindReputationUi();
  applyTheme(state);
  if (!state?.ready) {
    text("current-year", "—");
    text("current-age", "—");
    text("current-location", "—");
    text("current-environment", "—");
    text("character-name", "尚未開檔");
    text("file-seed", "—");
    text("era-name", "—");
    text("life-stage", "—");
    text("life-progress", "");
    text("week-label", "等待開檔");
    setMeter("stat-health", 0);
    setMeter("stat-sanity", 0);
    if (SHOW_REPUTATION_UI) setMeter("stat-reputation", 0);
    setMeter("stat-means", 0);
    setMeter("stat-crisis", 0);
    renderTags({ character: { tagRecords: [] } });
    renderCrisis({ pressure: { level: "idle", score: 0 } });
    renderFigureLog({ history: {} });
    renderEvent(state || { message: "尚未開局。" });
    renderChoices({ currentEvent: { options: [] } });
    renderDeathResolution(state);
    return;
  }

  const character = state.character || {};
  const time = state.time || {};
  const city = character.cityName || "";
  const country = character.country || "";
  const placeKind = String(character.settlementKindLabel || "");
  const kindOk = /港口|貧民窟|戰亂|工廠|村子|農村|難民|地下街|極地|新都|城市|大城/.test(placeKind);
  const season = character.natalEnvironment?.seasonLabel || "";
  const climate = zhClimate(character.climate) || (hasHan(character.climate) ? character.climate : "");
  const envBits = [kindOk ? placeKind : "", climate, season]
    .filter((bit) => bit && !isDebugCode(bit) && !/聚落|依附|學齡|課後|開局|主血脈/.test(bit));
  const uniqueEnv = [...new Set(envBits)];
  const location = character.currentPlaceLabel
    || character.birthplaceLabel
    || (country && city ? `${country}，${city}` : "")
    || city
    || country;

  text("current-year", `${time.year}年`);
  text("current-age", `${time.ageYears}歲`);
  text("current-location", location);
  text("current-environment", uniqueEnv.join(" · ") || "—");
  text("character-name", character.name || "未名");
  text("file-seed", String(state.seed ?? "—"));
  text("era-name", state.era?.name || "—");
  text("life-stage", state.stage?.label || "—");
  text("life-progress", [
    state.lifeProgress?.arcLabel,
    state.lifeProgress?.dueTitle ? `待決：${state.lifeProgress.dueTitle}` : "",
    state.career?.sectorLabel || "",
    (() => {
      const job = String(state.character?.occupation || "").trim();
      if (!job || job === "無" || job === "—" || job === "-") return "";
      return job;
    })(),
  ].filter(Boolean).join(" · "));
  text("week-label", time.label || "—");

  setMeter("stat-health", state.stats?.health);
  setMeter("stat-sanity", sanityOf(state));
  if (SHOW_REPUTATION_UI) setMeter("stat-reputation", reputationOf(state));
  setMeter("stat-means", state.wealth?.means ?? state.character?.means ?? 40);
  setMeter("stat-crisis", crisisOf(state));

  renderTags(state);
  renderCrisis(state);
  renderFigureLog(state);
  renderEvent(state);
  renderChoices(state);
  renderDeathResolution(state);
  syncNewFileControl(state);
  document.body.classList.toggle("is-over", Boolean(state.gameOver));
}

function cardFromEnding(state) {
  const ending = state?.ending;
  if (!ending) return null;
  return ending.memento || composeMementoCard({
    character: state.character,
    time: state.time,
    ending,
    resolution: ending.resolution,
    seed: state.seed,
    turnCount: state.turnCount,
  });
}

function paintMementoCard(card, fallback = {}) {
  const res = fallback.resolution || {};
  const character = fallback.character || {};
  const ending = fallback.ending || {};
  text("death-kicker", card?.kicker || res.kicker || (ending.fatal === false ? "這一局到此為止" : "當事人已死"));
  text("death-resolution-title", card?.title || res.title || (ending.fatal === false ? "人生結算" : "死亡證明"));
  text("death-name", card?.name || res.name || character.name || "未名");
  text("death-birthplace", card?.birthplace || res.birthplace || character.birthplaceLabel || "出生地未登記");
  text("death-age", card?.ageLine || res.ageLine || (card?.ageYears != null ? `享年 ${card.ageYears} 歲` : "—"));
  text("death-weeks", card?.weeksLine || (card?.weeksLived != null ? `存活 ${card.weeksLived} 週` : "—"));
  text("death-year", card?.yearLine || res.yearLine || (card?.endYear ? `${card.endYear}年` : "—"));
  text("death-cause", card?.cause || res.cause || ending.reason || "原因未登記");
  text("death-era", card?.eraPressure || res.eraPressure || "");
  const tagsRoot = $("memento-tags");
  if (tagsRoot) {
    tagsRoot.replaceChildren();
    const tags = card?.tags || [];
    if (!tags.length) {
      const empty = document.createElement("p");
      empty.className = "memento-tags-empty";
      empty.textContent = "這一世沒有留下可被街坊叫得出來的創傷或稀有標記。";
      tagsRoot.append(empty);
    } else {
      bindTagTooltips();
      for (const record of tags) {
        const chip = document.createElement("span");
        chip.className = "tag";
        chip.dataset.cat = record.category || "";
        chip.textContent = record.label;
        decorateTagChip(chip, record);
        tagsRoot.append(chip);
      }
    }
  }
}

function renderHallList(cards, currentId) {
  const list = $("hall-of-fame-list");
  if (!list) return;
  list.replaceChildren();
  if (!cards.length) {
    const empty = document.createElement("li");
    const note = document.createElement("p");
    note.className = "hall-empty";
    note.textContent = "紀念館還是空的。一條人生結束後，卡片會留在這裡。";
    empty.append(note);
    list.append(empty);
    return;
  }
  for (const card of cards) {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hall-card";
    if (card.id === currentId) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
    const name = document.createElement("span");
    name.className = "hall-card-name";
    name.textContent = card.name || "未名";
    const meta = document.createElement("span");
    meta.className = "hall-card-meta";
    const span = [card.birthYear, card.endYear].filter((year) => year != null).join("–");
    meta.textContent = [
      span ? `${span}年` : "",
      card.ageYears != null ? `${card.ageYears}歲` : "",
      card.weeksLived != null ? `${card.weeksLived}週` : "",
    ].filter(Boolean).join(" · ");
    button.append(name, meta);
    button.addEventListener("click", () => {
      selectedHallId = card.id;
      onHallSelect(card);
    });
    item.append(button);
    list.append(item);
  }
}

let overlayBound = false;

function bindDeathOverlay() {
  const root = $("death-resolution");
  if (!root || overlayBound) return;
  overlayBound = true;
  root.addEventListener("click", (event) => {
    if (event.target !== root) return;
    if (root.dataset.mode !== "browse") return;
    closeHallOfFame();
    onHallClose();
  });
}

function renderDeathResolution(state) {
  const root = $("death-resolution");
  if (!root) return;
  bindDeathOverlay();
  const ending = state?.ending;
  const settle = Boolean(state?.gameOver && ending);
  const browse = hallBrowseOpen && !settle;
  const show = settle || browse;
  root.hidden = !show;
  root.setAttribute("aria-hidden", show ? "false" : "true");
  root.dataset.mode = settle ? "settle" : (browse ? "browse" : "");
  document.body.classList.toggle("has-death-panel", show);
  const rebirth = $("btn-rebirth");
  const closeBtn = $("btn-hall-close");
  if (rebirth) {
    rebirth.hidden = !settle;
    rebirth.textContent = ending?.resolution?.rebirthLabel || "接受命運，開啟新的一生";
  }
  if (closeBtn) closeBtn.hidden = !browse;
  if (!show) return;
  const hall = readHallOfFame();
  const liveCard = settle ? cardFromEnding(state) : null;
  const featured = (selectedHallId && hall.find((row) => row.id === selectedHallId))
    || liveCard
    || hall[0]
    || null;
  if (featured) selectedHallId = featured.id;
  if (featured || settle) {
    paintMementoCard(featured, {
      resolution: ending?.resolution,
      character: state?.character,
      ending,
    });
  } else {
    paintMementoCard({
      kicker: "紀念館",
      title: "尚無結案人生",
      name: "—",
      birthplace: "—",
      ageLine: "—",
      weeksLine: "—",
      yearLine: "—",
      cause: "還沒有人在這部裝置上走完一生。",
      tags: [],
    });
  }
  renderHallList(hall, featured?.id || selectedHallId);
}

export function openHallOfFame(cardId = null) {
  hallBrowseOpen = true;
  selectedHallId = cardId;
}

export function closeHallOfFame() {
  hallBrowseOpen = false;
  selectedHallId = null;
}

export function isHallBrowseOpen() {
  return hallBrowseOpen;
}

function syncNewFileControl(state) {
  const button = $("btn-new-file");
  if (!button) return;
  button.hidden = true;
  button.disabled = true;
  button.tabIndex = -1;
  button.setAttribute("aria-hidden", "true");
  button.setAttribute("aria-disabled", "true");
  button.removeAttribute("title");
  void state;
}

export function renderLifeSim(state, handlers = {}) {
  if (typeof handlers.onChoose === "function") onChoose = handlers.onChoose;
  if (typeof handlers.onHallSelect === "function") onHallSelect = handlers.onHallSelect;
  if (typeof handlers.onHallClose === "function") onHallClose = handlers.onHallClose;
  render(state);
}

export function showBootError(error) {
  const root = $("event-history");
  if (!root) {
    console.error("LifeSim: 找不到 #event-history，無法顯示錯誤", error);
    return;
  }
  root.replaceChildren();
  root.append(paragraph("開檔失敗。這份檔案無法公開讀出。"));
  scrollEventHistoryToLatest(root);
}
