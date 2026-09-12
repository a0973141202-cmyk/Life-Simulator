/**
 * Cross-life anti-repetition ring.
 * Survives 重新投胎 / 重置 via sessionStorage; falls back to module memory
 * when storage is missing (Node validators, private mode).
 */

export const OPENING_REPEAT_CAP = 12;
export const OPENING_EVENT_HINT_LIVES = 3;
export const SESSION_REPEAT_KEY = "lifesim.openingOutlines";

const memory = [];

function storage() {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

export function loadSessionRepeat() {
  const store = storage();
  if (!store) return memory;
  try {
    const raw = store.getItem(SESSION_REPEAT_KEY);
    if (!raw) return memory;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memory.splice(0, memory.length, ...parsed.filter(Boolean).slice(-OPENING_REPEAT_CAP));
    }
  } catch {
    /* keep in-memory ring */
  }
  return memory;
}

function persist() {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(SESSION_REPEAT_KEY, JSON.stringify(memory.slice(-OPENING_REPEAT_CAP)));
  } catch {
    /* quota / private mode */
  }
}

export function recentOpeningRecords() {
  return loadSessionRepeat().slice();
}

export function rememberSessionOpening(record) {
  if (!record) return recentOpeningRecords();
  const ring = loadSessionRepeat();
  ring.push({
    outline: record.outline || "",
    slotIds: Array.isArray(record.slotIds) ? record.slotIds.slice() : [],
    stems: Array.isArray(record.stems) ? record.stems.slice(0, 6) : [],
    eventOutlines: Array.isArray(record.eventOutlines) ? record.eventOutlines.slice(0, 8) : [],
    yearBand: record.yearBand || "",
    kind: record.kind || "",
    classId: record.classId || "",
    upheavalId: record.upheavalId || "",
  });
  if (ring.length > OPENING_REPEAT_CAP) ring.splice(0, ring.length - OPENING_REPEAT_CAP);
  persist();
  return ring.slice();
}

export function recentOpeningSlotIds() {
  const ids = new Set();
  for (const row of recentOpeningRecords()) {
    for (const id of row.slotIds || []) ids.add(id);
  }
  return ids;
}

export function recentSessionEventOutlines() {
  const out = [];
  const rows = recentOpeningRecords().slice(-OPENING_EVENT_HINT_LIVES);
  for (const row of rows) {
    for (const outline of row.eventOutlines || []) {
      if (outline && !out.includes(outline)) out.push(outline);
    }
  }
  return out;
}

export function openingComboOnCooldown(outline, slotIds = []) {
  const rows = recentOpeningRecords();
  if (!rows.length) return false;
  if (outline && rows.some((row) => row.outline === outline)) return true;
  const incoming = new Set(slotIds.filter(Boolean));
  if (incoming.size >= 3) {
    for (const row of rows.slice(-6)) {
      const prev = new Set(row.slotIds || []);
      let hit = 0;
      for (const id of incoming) if (prev.has(id)) hit += 1;
      if (hit >= 3) return true;
    }
  }
  const last = rows[rows.length - 1];
  if (last && outline && last.yearBand && last.kind && last.classId && last.upheavalId) {
    const bits = String(outline).split(":");
    if (
      bits[0] === last.yearBand
      && bits[1] === last.kind
      && bits[2] === last.classId
      && bits[3] === last.upheavalId
    ) {
      return true;
    }
  }
  return false;
}

export function resetSessionRepeat() {
  memory.splice(0, memory.length);
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(SESSION_REPEAT_KEY);
  } catch {
    /* ignore */
  }
}
