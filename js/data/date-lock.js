/**
 * Exact-date lock between a Gregorian Y-M-D and a settlement's existence window.
 * Founding / closing month-day only apply on the first / last available year.
 */
import {
  dateOrdinal,
  daysInMonth,
  isValidGregorianDate,
  parseDateInput,
  randomDateInYear,
} from "./calendar.js";

export function settlementDateWindow(settlement, year) {
  let minMonth = 1;
  let minDay = 1;
  let maxMonth = 12;
  let maxDay = daysInMonth(year, 12);

  if (year === settlement.availableFrom) {
    minMonth = settlement.fromMonth || 1;
    minDay = settlement.fromDay || 1;
  }
  if (year === settlement.availableTo) {
    maxMonth = settlement.toMonth || 12;
    maxDay = settlement.toDay || daysInMonth(year, maxMonth);
  }

  minDay = Math.min(minDay, daysInMonth(year, minMonth));
  maxDay = Math.min(maxDay, daysInMonth(year, maxMonth));

  if (dateOrdinal(year, minMonth, minDay) > dateOrdinal(year, maxMonth, maxDay)) {
    minMonth = 1;
    minDay = 1;
    maxMonth = 12;
    maxDay = daysInMonth(year, 12);
  }

  return { minMonth, minDay, maxMonth, maxDay };
}

export function isDateInSettlementWindow(settlement, year, month, day) {
  if (!isValidGregorianDate(year, month, day)) return false;
  const window = settlementDateWindow(settlement, year);
  const ord = dateOrdinal(year, month, day);
  return ord >= dateOrdinal(year, window.minMonth, window.minDay)
    && ord <= dateOrdinal(year, window.maxMonth, window.maxDay);
}

export function randomBirthDateForSettlement(rng, settlement, year) {
  return randomDateInYear(rng, year, settlementDateWindow(settlement, year));
}

export { parseDateInput };
