/**
 * Recent Text History Buffer.
 * Records event ids, narrative templates, and choice stems for the last
 * ~8 bi-weekly turns so the next draw cannot reuse the same canned line.
 */

export const TEXT_HISTORY_TURNS = 8;
export const TEXT_HISTORY_CAP = 10;

function normalizeStem(text) {
  return String(text || "")
    .replace(/〔[^〕]*〕/g, "")
    .replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, "")
    .slice(0, 40);
}

function tooSimilar(left, right) {
  const a = normalizeStem(left);
  const b = normalizeStem(right);
  if (!a || !b) return false;
  if (a === b) return true;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (shorter.length >= 8 && longer.includes(shorter)) return true;
  let prefix = 0;
  while (prefix < shorter.length && shorter[prefix] === longer[prefix]) prefix += 1;
  return prefix >= 10;
}

function pushUnique(list, value, cap) {
  if (!value) return;
  const at = list.indexOf(value);
  if (at >= 0) list.splice(at, 1);
  list.push(value);
  if (list.length > cap) list.splice(0, list.length - cap);
}

export function emptyTextHistory() {
  return {
    turns: [],
    ids: [],
    templates: [],
    stems: [],
    choices: [],
  };
}

export function ensureTextHistory(character) {
  if (!character) return emptyTextHistory();
  if (!character.recentTextHistory || Array.isArray(character.recentTextHistory)) {
    character.recentTextHistory = emptyTextHistory();
  }
  const hist = character.recentTextHistory;
  if (!Array.isArray(hist.turns)) hist.turns = [];
  if (!Array.isArray(hist.ids)) hist.ids = [];
  if (!Array.isArray(hist.templates)) hist.templates = [];
  if (!Array.isArray(hist.stems)) hist.stems = [];
  if (!Array.isArray(hist.choices)) hist.choices = [];
  return hist;
}

function currentTurn(hist) {
  return hist.turns[hist.turns.length - 1] || null;
}

export function beginTextTurn(character, ctx = {}) {
  const hist = ensureTextHistory(character);
  hist.turns.push({
    year: ctx.year ?? ctx.time?.year ?? 0,
    week: ctx.week ?? ctx.time?.week ?? 0,
    turn: ctx.turn ?? ctx.time?.turn ?? 0,
    ids: [],
    templates: [],
    stems: [],
    choices: [],
  });
  if (hist.turns.length > TEXT_HISTORY_TURNS) {
    hist.turns.splice(0, hist.turns.length - TEXT_HISTORY_TURNS);
  }
  return hist;
}

export function rememberTextSnippet(character, record = {}) {
  if (!character) return emptyTextHistory();
  const hist = ensureTextHistory(character);
  let turn = currentTurn(hist);
  if (!turn) {
    beginTextTurn(character, {});
    turn = currentTurn(hist);
  }
  if (record.id) {
    pushUnique(turn.ids, record.id, TEXT_HISTORY_CAP);
    pushUnique(hist.ids, record.id, TEXT_HISTORY_CAP);
  }
  if (record.template) {
    pushUnique(turn.templates, record.template, TEXT_HISTORY_CAP);
    pushUnique(hist.templates, record.template, TEXT_HISTORY_CAP);
  }
  const stem = normalizeStem(record.stem || record.text);
  if (stem) {
    pushUnique(turn.stems, stem, TEXT_HISTORY_CAP);
    pushUnique(hist.stems, stem, TEXT_HISTORY_CAP);
  }
  const choice = normalizeStem(record.choice);
  if (choice) {
    pushUnique(turn.choices, choice, TEXT_HISTORY_CAP);
    pushUnique(hist.choices, choice, TEXT_HISTORY_CAP);
  }
  return hist;
}

export function rememberTextTurn(character, bundle = {}, ctx = {}) {
  beginTextTurn(character, ctx);
  for (const id of bundle.ids || []) rememberTextSnippet(character, { id });
  for (const template of bundle.templates || []) rememberTextSnippet(character, { template });
  for (const stem of bundle.stems || []) rememberTextSnippet(character, { stem });
  for (const choice of bundle.choices || []) rememberTextSnippet(character, { choice });
  return ensureTextHistory(character);
}

export function textOnCooldown(character, text) {
  if (!text) return false;
  const hist = ensureTextHistory(character);
  const key = normalizeStem(text);
  if (!key) return false;
  return hist.stems.some((row) => tooSimilar(row, key))
    || hist.choices.some((row) => tooSimilar(row, key));
}

export function templateOnCooldown(character, templateId) {
  if (!templateId) return false;
  return ensureTextHistory(character).templates.includes(templateId);
}

export function idOnTextHistory(character, id) {
  if (!id) return false;
  return ensureTextHistory(character).ids.includes(id);
}

export function filterFreshByText(pool, character, getText) {
  const read = typeof getText === "function" ? getText : (item) => item?.text || item;
  const fresh = (pool || []).filter((item) => !textOnCooldown(character, read(item)));
  return fresh.length ? fresh : (pool || []);
}

export function pickFreshText(rng, pool, character, fill = (item) => item) {
  const filled = (pool || []).map(fill).filter(Boolean);
  if (!filled.length) return "";
  const unused = filled.filter((line) => !textOnCooldown(character, line));
  const source = unused.length ? unused : filled;
  const picked = source[Math.floor((rng?.() ?? Math.random()) * source.length)];
  if (picked) rememberTextSnippet(character, { stem: picked });
  return picked || "";
}
