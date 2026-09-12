/**
 * Permanent core: one living file, one fate.
 * Until the current life ends by death or a normal play-window close,
 * the session must not replace, switch, or roll a new character.
 * Closed-beta year/age caps do not relax this lock.
 */

export function lifeIsActive(session) {
  return Boolean(session?.character) && session.gameOver !== true;
}

export function canBeginNewLife(session) {
  if (!session) return true;
  if (!session.character) return true;
  return session.gameOver === true;
}

export function refuseNewLife(session) {
  const state = typeof session?.getGameState === "function" ? session.getGameState() : null;
  return {
    ok: false,
    error: "life_locked",
    message: "當前人生尚未結束，不能另開檔案。",
    state,
  };
}

export function beginNewLifeOrRefuse(session, start) {
  if (!canBeginNewLife(session)) {
    return refuseNewLife(session);
  }
  return start();
}
