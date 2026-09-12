import { DAYS_PER_TURN, MAX_AGE, PLAY_AGE_MAX, PLAY_AGE_MIN, TURNS_PER_YEAR, TURNS_TO_AGE_18 } from "./constants.js";
import {
  addDays,
  anniversaryOnYear,
  compareYmd,
  dateFromTurn,
  dateFromWeek,
  daysBetween,
  formatDate,
  makeDate,
  turnOfYear,
  weekOfYear,
  yearsElapsed,
} from "./data/calendar.js";

function coerceDate(value) {
  if (!value) return null;
  if (Number.isInteger(value.year) && Number.isInteger(value.month) && Number.isInteger(value.day)) {
    return value.iso ? value : makeDate(value.year, value.month, value.day);
  }
  return null;
}

export function resolveBirthDate(characterOrDate, birthWeek) {
  const direct = coerceDate(characterOrDate);
  if (direct) return direct;
  if (characterOrDate?.birthDate) {
    const nested = coerceDate(characterOrDate.birthDate);
    if (nested) return nested;
  }
  if (Number.isInteger(characterOrDate?.birthYear) && characterOrDate?.birthMonth && characterOrDate?.birthDay) {
    return makeDate(characterOrDate.birthYear, characterOrDate.birthMonth, characterOrDate.birthDay);
  }
  if (Number.isInteger(characterOrDate?.birthYear)) {
    return dateFromWeek(characterOrDate.birthYear, characterOrDate.birthWeek || birthWeek || 1);
  }
  if (typeof characterOrDate === "number") {
    return dateFromWeek(characterOrDate, birthWeek || 1);
  }
  return makeDate(1920, 1, 1);
}

export function clockToDate(clock) {
  if (clock?.iso && clock.year && clock.month && clock.day) {
    return clock.weekdayLabel ? clock : makeDate(clock.year, clock.month, clock.day);
  }
  if (clock?.year && clock?.month && clock?.day) return makeDate(clock.year, clock.month, clock.day);
  if (clock?.year && clock?.turn) return dateFromTurn(clock.year, clock.turn);
  if (clock?.year && clock?.week) return dateFromWeek(clock.year, clock.week);
  return makeDate(1920, 1, 1);
}

/** Date of the `turnIndex`-th fortnight (0–23) after the birthday of `ageYears`. */
export function dateAtAgeTurn(birth, ageYears, turnIndex) {
  const startYear = birth.year + Math.max(0, Math.floor(ageYears));
  const start = anniversaryOnYear(birth, startYear);
  const end = anniversaryOnYear(birth, startYear + 1);
  const span = Math.max(1, daysBetween(start, end));
  const slot = Math.max(0, Math.min(TURNS_PER_YEAR - 1, Math.floor(turnIndex) || 0));
  const offset = Math.round((slot / TURNS_PER_YEAR) * span);
  return addDays(start, offset);
}

export function turnsToAge(ageYears) {
  return Math.max(0, Math.floor(ageYears)) * TURNS_PER_YEAR;
}

function stampClock(date, totalTurnsLived) {
  const lived = Math.max(0, Math.floor(totalTurnsLived) || 0);
  const turnInYear = lived % TURNS_PER_YEAR;
  return {
    year: date.year,
    month: date.month,
    day: date.day,
    iso: date.iso,
    week: date.week,
    turn: turnInYear + 1,
    weekday: date.weekday,
    weekdayLabel: date.weekdayLabel,
    monthLabel: date.monthLabel,
    totalTurnsLived: lived,
    totalWeeksLived: lived,
  };
}

export function createClock(birthYearOrDate, birthWeek) {
  const date = resolveBirthDate(birthYearOrDate, birthWeek);
  return stampClock(date, 0);
}

/** Jump the clock to an exact birthday (leaplings use Feb 28 in common years). */
export function createClockAtAge(birthYearOrDate, ageYears = PLAY_AGE_MIN, birthWeek) {
  const birth = resolveBirthDate(birthYearOrDate, birthWeek);
  const targetAge = Math.max(0, Math.floor(ageYears));
  const date = dateAtAgeTurn(birth, targetAge, 0);
  return stampClock(date, turnsToAge(targetAge));
}

export function isPastPlayAge(clock, birthYearOrDate, birthWeek, maxAge = PLAY_AGE_MAX) {
  return getAgeParts(clock, birthYearOrDate, birthWeek).ageYears > maxAge;
}

export function getAgeParts(clock, birthYearOrDate, birthWeek) {
  const current = clockToDate(clock);
  const birth = resolveBirthDate(birthYearOrDate, birthWeek);
  const totalDays = Math.max(0, daysBetween(birth, current));
  const lived = Number.isFinite(clock?.totalTurnsLived)
    ? Math.max(0, Math.floor(clock.totalTurnsLived))
    : Math.floor(totalDays / (365.2425 / TURNS_PER_YEAR));
  const ageYears = Math.floor(lived / TURNS_PER_YEAR);
  const ageTurnsRemainder = lived % TURNS_PER_YEAR;
  const thisAnniv = anniversaryOnYear(birth, current.year);
  const rawLast = compareYmd(current, thisAnniv) >= 0
    ? thisAnniv
    : anniversaryOnYear(birth, current.year - 1);
  const lastBirthday = compareYmd(rawLast, birth) < 0 ? birth : rawLast;
  const sinceBirthday = Math.max(0, daysBetween(lastBirthday, current));
  return {
    ageYears,
    ageTurnsRemainder,
    ageWeeksRemainder: ageTurnsRemainder,
    totalTurnsLived: lived,
    totalWeeksLived: lived,
    totalDaysLived: totalDays,
    calendarAgeYears: yearsElapsed(birth, current),
    sinceBirthdayDays: sinceBirthday,
  };
}

export function advanceClock(clock, birthYearOrDate, birthWeek) {
  const current = clockToDate(clock);
  const birth = birthYearOrDate != null ? resolveBirthDate(birthYearOrDate, birthWeek) : null;
  const lived = (
    Number.isFinite(clock?.totalTurnsLived)
      ? clock.totalTurnsLived
      : (birth ? getAgeParts(clock, birth).totalTurnsLived : Math.floor(clock?.totalWeeksLived || 0))
  ) + 1;
  const date = birth
    ? dateAtAgeTurn(birth, Math.floor(lived / TURNS_PER_YEAR), lived % TURNS_PER_YEAR)
    : addDays(current, DAYS_PER_TURN);
  return stampClock(date, lived);
}

export function isPastMaxAge(clock, birthYearOrDate, birthWeek) {
  return getAgeParts(clock, birthYearOrDate, birthWeek).ageYears >= MAX_AGE;
}

export function formatTime(clock, birthYearOrDate, birthWeek) {
  const date = clockToDate(clock);
  const age = getAgeParts(clock, birthYearOrDate, birthWeek);
  const turn = age.ageTurnsRemainder + 1;
  return {
    year: date.year,
    month: date.month,
    day: date.day,
    iso: date.iso,
    week: date.week,
    turn,
    weekday: date.weekday,
    weekdayLabel: date.weekdayLabel,
    monthLabel: date.monthLabel,
    ageYears: age.ageYears,
    ageTurnsRemainder: age.ageTurnsRemainder,
    ageWeeksRemainder: age.ageTurnsRemainder,
    totalTurnsLived: age.totalTurnsLived,
    totalWeeksLived: age.totalTurnsLived,
    totalDaysLived: age.totalDaysLived,
    dateLabel: formatDate(date),
    label: `${formatDate(date)} · 第 ${turn} 期 · ${age.ageYears} 歲又 ${age.ageTurnsRemainder} 個兩週`,
    biweekly: true,
    turnsPerYear: TURNS_PER_YEAR,
    daysPerTurn: DAYS_PER_TURN,
  };
}

export { weekOfYear, turnOfYear, TURNS_PER_YEAR, DAYS_PER_TURN, TURNS_TO_AGE_18 };
