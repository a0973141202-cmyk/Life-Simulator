/**
 * Browser localStorage autosave. One living file, one key.
 * The slot is overwritten after every fortnight; it is cleared only
 * when a finished life is allowed to be replaced, or when the client
 * build / save schema is incompatible with a stale cache.
 */
export const SAVE_KEY = "century_life_save";
/** Bumped when option/age-gate schema makes old living saves unsafe to resume. */
export const SAVE_VERSION = 2;
export const CLIENT_BUILD_KEY = "century_client_build";
export const HALL_KEY = "century_hall_of_fame";
export const HALL_VERSION = 1;
const HALL_CAP = 48;

function storage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Resolve cache-bust / reset hints from the page URL.
 * `?v=age-gate-fix-5` stamps the client build; `?reset=1` forces wipe.
 */
export function clientBootHints(search = "") {
  const raw = String(search || (typeof location !== "undefined" ? location.search : "") || "");
  const params = new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw);
  const build = String(params.get("v") || params.get("build") || "").trim();
  const reset = ["1", "true", "yes"].includes(String(params.get("reset") || params.get("clearSave") || "").toLowerCase());
  return { build, reset };
}

/**
 * Drop living saves that belong to an older client build or save schema.
 * Returns why a wipe happened (or null if the slot was kept).
 */
export function purgeStaleClientState(hints = null) {
  const store = storage();
  if (!store) return { wiped: false, reason: "no_storage" };
  const boot = hints || clientBootHints();
  let reason = null;
  if (boot.reset) reason = "url_reset";
  const previousBuild = store.getItem(CLIENT_BUILD_KEY) || "";
  if (!reason && boot.build && previousBuild && previousBuild !== boot.build) {
    reason = "client_build_changed";
  }
  const raw = store.getItem(SAVE_KEY);
  if (!reason && raw) {
    try {
      const data = JSON.parse(raw);
      if (data?.version != null && Number(data.version) !== SAVE_VERSION) {
        reason = "save_version_mismatch";
      }
    } catch {
      reason = "save_corrupt";
    }
  }
  if (boot.build) {
    try {
      store.setItem(CLIENT_BUILD_KEY, boot.build);
    } catch {
      /* ignore quota */
    }
  }
  if (!reason) return { wiped: false, reason: null, build: boot.build || previousBuild || null };
  clearLifeSave();
  return { wiped: true, reason, build: boot.build || previousBuild || null };
}

export function snapshotEngine(engine) {
  if (!engine?.character || !engine.clock) return null;
  const raw = typeof engine.toJSON === "function"
    ? engine.toJSON()
    : engine;
  const character = raw.character ? cloneJson(raw.character) : null;
  if (character) delete character.tagStore;
  return {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    seed: raw.seed,
    rngState: raw.rngState,
    character,
    clock: raw.clock ? cloneJson(raw.clock) : null,
    currentEvent: raw.currentEvent ? cloneJson(raw.currentEvent) : null,
    lastResult: raw.lastResult ? cloneJson(raw.lastResult) : null,
    journal: cloneJson(raw.journal || []),
    turnCount: raw.turnCount || 0,
    gameOver: Boolean(raw.gameOver),
    ending: raw.ending ? cloneJson(raw.ending) : null,
  };
}

export function readLifeSave() {
  const store = storage();
  if (!store) return null;
  const raw = store.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!data?.character || !data?.clock) return null;
    if (data.version != null && Number(data.version) !== SAVE_VERSION) {
      clearLifeSave();
      return null;
    }
    return data;
  } catch {
    clearLifeSave();
    return null;
  }
}

export function writeLifeSave(engine) {
  const store = storage();
  if (!store) return false;
  const payload = snapshotEngine(engine);
  if (!payload) return false;
  try {
    store.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function clearLifeSave() {
  const store = storage();
  if (!store) return false;
  try {
    store.removeItem(SAVE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function hasLifeSave() {
  return Boolean(readLifeSave());
}

export function readHallOfFame() {
  const store = storage();
  if (!store) return [];
  const raw = store.getItem(HALL_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    const cards = Array.isArray(data?.cards) ? data.cards : (Array.isArray(data) ? data : []);
    return cards.filter((row) => row && row.name);
  } catch {
    return [];
  }
}

function persistHall(cards) {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(HALL_KEY, JSON.stringify({
      version: HALL_VERSION,
      savedAt: Date.now(),
      cards: cards.slice(0, HALL_CAP),
    }));
    return true;
  } catch {
    return false;
  }
}

export function writeHallCard(card) {
  if (!card?.name) return false;
  const id = card.id || [card.seed, card.birthYear, card.endYear, card.name, card.weeksLived ?? 0].join("·");
  const next = { ...card, id, savedAt: card.savedAt || Date.now() };
  const cards = readHallOfFame().filter((row) => row.id !== id);
  cards.unshift(next);
  return persistHall(cards);
}

export function hasHallOfFame() {
  return readHallOfFame().length > 0;
}
