/**
 * Browser localStorage autosave. One living file, one key.
 * The slot is overwritten after every fortnight; it is cleared only
 * when a finished life is allowed to be replaced.
 */
export const SAVE_KEY = "century_life_save";
export const SAVE_VERSION = 1;

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
    return data;
  } catch {
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
