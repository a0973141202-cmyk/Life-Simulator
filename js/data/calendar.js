/**
 * Gregorian calendar helpers (1920–2025).
 * Leap years follow the 4/100/400 rule. February 29 only exists in leap years.
 */

export const MONTH_DAYS = Object.freeze([0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);

export const MONTH_LABELS = Object.freeze([
  "", "一月", "二月", "三月", "四月", "五月", "六月",
  "七月", "八月", "九月", "十月", "十一月", "十二月",
]);

export const WEEKDAY_LABELS = Object.freeze(["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]);

export function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year, month) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return MONTH_DAYS[month] || 0;
}

export function isValidGregorianDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(year, month)) return false;
  return true;
}

export function dayOfYear(year, month, day) {
  let total = day;
  for (let m = 1; m < month; m += 1) total += daysInMonth(year, m);
  return total;
}

export function weekOfYear(year, month, day) {
  const doy = dayOfYear(year, month, day);
  return Math.min(52, Math.max(1, Math.ceil(doy / 7)));
}

/** Civil-year fortnight index 1–24 (Jan 1 starts period 1). */
export function turnOfYear(year, month, day) {
  const doy = dayOfYear(year, month, day);
  const yearDays = isLeapYear(year) ? 366 : 365;
  return Math.min(24, Math.max(1, Math.ceil((doy * 24) / yearDays)));
}

export function weekdayIndex(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function dateOrdinal(year, month, day) {
  return year * 10000 + month * 100 + day;
}

export function makeDate(year, month, day) {
  if (!isValidGregorianDate(year, month, day)) {
    throw new Error(`Invalid Gregorian date: ${year}-${month}-${day}`);
  }
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const weekday = weekdayIndex(year, month, day);
  return {
    year,
    month,
    day,
    iso,
    week: weekOfYear(year, month, day),
    turn: turnOfYear(year, month, day),
    dayOfYear: dayOfYear(year, month, day),
    weekday,
    weekdayLabel: WEEKDAY_LABELS[weekday],
    monthLabel: MONTH_LABELS[month],
    leapDay: month === 2 && day === 29,
    leapYear: isLeapYear(year),
  };
}

export function randomDateInYear(rng, year, { minMonth = 1, minDay = 1, maxMonth = 12, maxDay = null } = {}) {
  const start = dateOrdinal(year, minMonth, minDay);
  const endDay = maxDay ?? daysInMonth(year, maxMonth);
  const end = dateOrdinal(year, maxMonth, endDay);
  if (end < start) {
    return makeDate(year, minMonth, Math.min(minDay, daysInMonth(year, minMonth)));
  }
  const span = [];
  for (let month = minMonth; month <= maxMonth; month += 1) {
    const from = month === minMonth ? minDay : 1;
    const to = month === maxMonth ? endDay : daysInMonth(year, month);
    for (let day = from; day <= to; day += 1) span.push([month, day]);
  }
  const pick = span[Math.floor(rng() * span.length)] || [minMonth, minDay];
  return makeDate(year, pick[0], pick[1]);
}

export function addDays(date, days) {
  const utc = Date.UTC(date.year, date.month - 1, date.day + days);
  const next = new Date(utc);
  return makeDate(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
}

export function yearsElapsed(birth, current) {
  let years = current.year - birth.year;
  const hadBirthday = current.month > birth.month
    || (current.month === birth.month && current.day >= birth.day);
  if (!hadBirthday) years -= 1;
  return Math.max(0, years);
}

export function formatDate(date) {
  if (!date) return "";
  return `${date.year}年${date.month}月${date.day}日（${date.weekdayLabel}）`;
}

export function compareYmd(a, b) {
  return dateOrdinal(a.year, a.month, a.day) - dateOrdinal(b.year, b.month, b.day);
}

export function dateFromDayOfYear(year, doy) {
  const cap = isLeapYear(year) ? 366 : 365;
  let remaining = Math.max(1, Math.min(cap, Math.floor(doy)));
  for (let month = 1; month <= 12; month += 1) {
    const dim = daysInMonth(year, month);
    if (remaining <= dim) return makeDate(year, month, remaining);
    remaining -= dim;
  }
  return makeDate(year, 12, 31);
}

export function dateFromWeek(year, week) {
  const capped = Math.max(1, Math.min(52, Math.floor(week) || 1));
  return dateFromDayOfYear(year, (capped - 1) * 7 + 1);
}

export function dateFromTurn(year, turn) {
  const yearDays = isLeapYear(year) ? 366 : 365;
  const capped = Math.max(1, Math.min(24, Math.floor(turn) || 1));
  const doy = Math.min(yearDays, Math.floor((capped - 1) * yearDays / 24) + 1);
  return dateFromDayOfYear(year, doy);
}

export function anniversaryOnYear(birth, year) {
  if (birth.month === 2 && birth.day === 29 && !isLeapYear(year)) {
    return makeDate(year, 2, 28);
  }
  return makeDate(year, birth.month, Math.min(birth.day, daysInMonth(year, birth.month)));
}

export function daysBetween(a, b) {
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86400000);
}

export function parseDateInput(input) {
  if (!input) return null;
  if (typeof input === "string") {
    const match = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) return null;
    return makeDate(Number(match[1]), Number(match[2]), Number(match[3]));
  }
  if (input.birthDate) return parseDateInput(input.birthDate);
  const year = input.year ?? input.birthYear;
  const month = input.month ?? input.birthMonth;
  const day = input.day ?? input.birthDay;
  if (year && month && day) return makeDate(year, month, day);
  return null;
}
