/**
 * Archive UI binder. Engine stays in GameEngine; this file only paints DOM.
 * Required IDs are never renamed: current-year/age/location/environment,
 * stat-health/sanity/reputation/crisis, tags-container, event-history, choices-container.
 */

import { SHOW_REPUTATION_UI } from "./data/ui-config.js";
import { applyTheme } from "./theme-manager.js";
import { describeSocialFeedback, socialStanding } from "./social-feedback.js";
import { hasHan, isDebugCode, publicTagLabel, sanitizePublicLine, zhClimate } from "./data/ui-zh.js";
import { FIGURE_INDEX } from "./data/figures/catalog.js";
import { RELATION_LABEL } from "./data/figure-rules.js";

const TAG_PRIORITY = new Set([
  "trauma", "school", "caste", "adult", "world", "figure",
  "mood", "socio", "path", "crime", "politics", "acquired", "household", "ledger", "social",
  "ethnicity", "trait", "class", "climate", "region", "parent", "lineage", "condition", "misc",
]);

const GATES = ["一", "二", "三"];
const CRISIS_COPY = {
  idle: "這一週還沒有人把你的名字寫進公開清算。",
  calm: "街上還沒有人當眾點你的名字，或把你從隊伍裏拖出去。",
  watch: "已被注視。通緝、熱度或醜聞正在累積，清算窗口已打開。",
  crisis: "清算已經公開。權力集團不必公正，只需要名單。",
  ruin: "毀滅性代價已在帳上。國家機器或地下秩序隨時可以收場。",
};

let onChoose = () => {};

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
  return FIGURE_INDEX[id]?.name || id || "未知人物";
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
    if (!label || isDebugCode(label)) continue;
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
    bits.push(describeSocialFeedback(ledger, { salt: (state.time?.totalWeeksLived || 0) + (ledger.reputation || 0) }));
  }
  if (state.history?.inertia) bits.push(SHOW_REPUTATION_UI
    ? `歷史慣性 ${Math.round(state.history.inertia)}`
    : (state.history.inertia >= 12 ? "後續年表已經開始偏離你記得的版本。" : "年表仍按原軌走。"));
  if (state.history?.rewritten) bits.push("年表已被改寫");
  text("crisis-alert-text", state.gameOver
    ? (state.ending?.reason || "檔案已封存。")
    : CRISIS_COPY[level] || CRISIS_COPY.idle);
  text("crisis-alert-sub", bits.length
    ? bits.join(" · ")
    : (SHOW_REPUTATION_UI
      ? "預留：通緝、熱度、歷史慣性將在此疊加顯示。"
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
      rel: RELATION_LABEL[rel] || rel,
      note: history.lastFigureId === id ? "最近一次公開交集。" : "你們已經有過公開交集。",
    });
  }
  for (const row of divergences.slice(-8).reverse()) {
    rows.push({
      id: row.figureId,
      butterfly: true,
      who: figureName(row.figureId),
      rel: row.label || "蝴蝶效應",
      note: row.note || `${row.year || "?"}年，這條街的說法開始跟以前不一樣。`,
    });
  }

  if (!rows.length) {
    if (status) {
      status.hidden = false;
      status.textContent = history.lastFigureId
        ? `最近目擊：${figureName(history.lastFigureId)}。還沒有人把你們寫成一夥，也還沒有人把你們寫成對頭。`
        : "尚無公開交集。人物只在其發跡窗口與地理範圍內入場。";
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
    inertia.textContent = history.rewritten
      ? `歷史慣性 ${value} · 後續年表已改寫`
      : `歷史慣性 ${value}`;
  }
}

function paragraph(textValue) {
  const clean = sanitizePublicLine(textValue);
  if (!clean) return null;
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

function renderEvent(state) {
  const root = $("event-history");
  if (!root) return;
  root.replaceChildren();

  const event = state.currentEvent || {};
  const lead = document.createElement("article");
  lead.className = "clip clip-lead";
  const kicker = document.createElement("p");
  kicker.className = "clip-kicker";
  kicker.textContent = event.turningPoint?.lockedTriad
    ? "人生轉折"
    : event.figure?.lockedTriad
      ? "歷史人物現場"
      : event.worldEvent?.lockedTriad
        ? "時空事件"
        : "本期紀事";
  const title = document.createElement("h3");
  title.textContent = state.character
    ? `${state.character.name || "未名"} · ${state.stage?.label || ""}`
    : "尚未開檔";
  lead.append(kicker, title);
  const narrative = String(event.narrative || state.message || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line, index, all) => all.findIndex((row) => row.slice(0, 18) === line.slice(0, 18)) === index);
  const lines = narrative.map((line) => paragraph(line)).filter(Boolean);
  if (!lines.length) {
    const empty = paragraph(state.ready ? "本期沒有可公開的文字。" : "按下「開新檔案」。從五歲起，每一期只寫這兩週發生的事。");
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
    h.textContent = res.title
      || (state.ending.kind === "session_close" ? "人生結算" : (state.ending.fatal === false ? "高齡結算" : "死亡證明"));
    const endingLine = paragraph(res.epitaph || state.ending.epitaph || state.ending.detail || state.ending.reason || "");
    banner.append(h);
    if (endingLine) banner.append(endingLine);
    root.append(banner);
  }

  root.scrollTop = 0;
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
  const daily = state.dailyState?.label || character.settlementKindLabel || "";
  const season = character.natalEnvironment?.seasonLabel || "";
  const climate = zhClimate(character.climate) || (hasHan(character.climate) ? character.climate : "");
  const envBits = [daily, character.settlementKindLabel, climate, season]
    .filter((bit) => bit && !isDebugCode(bit));
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
    state.lifeProgress?.dueTitle ? `轉折：${state.lifeProgress.dueTitle}` : "",
  ].filter(Boolean).join(" · "));
  text("week-label", time.label || "—");

  setMeter("stat-health", state.stats?.health);
  setMeter("stat-sanity", sanityOf(state));
  if (SHOW_REPUTATION_UI) setMeter("stat-reputation", reputationOf(state));
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

function renderDeathResolution(state) {
  const root = $("death-resolution");
  if (!root) return;
  const ending = state?.ending;
  const show = Boolean(state?.gameOver && ending);
  root.hidden = !show;
  root.setAttribute("aria-hidden", show ? "false" : "true");
  document.body.classList.toggle("has-death-panel", show);
  if (!show) return;
  const res = ending.resolution || {};
  const character = state.character || {};
  text("death-kicker", res.kicker || (ending.fatal === false ? "這一局到此為止" : "當事人已死"));
  text("death-resolution-title", res.title || (ending.fatal === false ? "人生結算" : "死亡證明"));
  text("death-name", res.name || character.name || "未名");
  text("death-birthplace", res.birthplace || character.birthplaceLabel || "出生地未登記");
  text("death-age", res.ageLine || `活到 ${ending.ageYears ?? state.time?.ageYears ?? "?"} 歲`);
  text("death-year", res.yearLine || (ending.year ? `${ending.year}年` : (state.time?.year ? `${state.time.year}年` : "—")));
  text("death-cause", res.cause || ending.reason || ending.detail || "原因未登記");
  text("death-era", res.eraPressure || state.era?.summary || "");
  const button = $("btn-rebirth");
  if (button) button.textContent = res.rebirthLabel || "重新投胎（開新局）";
}

function syncNewFileControl(state) {
  const button = $("btn-new-file");
  if (!button) return;
  const locked = Boolean(state?.ready && !state.gameOver);
  button.disabled = locked;
  button.setAttribute("aria-disabled", locked ? "true" : "false");
  button.title = locked ? "當前人生尚未結束，不能另開檔案。" : "開新檔案";
}

export function renderLifeSim(state, handlers = {}) {
  if (typeof handlers.onChoose === "function") onChoose = handlers.onChoose;
  render(state);
}

export function showBootError(error) {
  const root = $("event-history");
  if (!root) {
    console.error("LifeSim: 找不到 #event-history，無法顯示錯誤", error);
    return;
  }
  root.replaceChildren();
  root.append(paragraph(`開檔失敗：${error?.message || error}`));
  scrollEventHistoryToLatest(root);
}
