/**
 * Swedish identity numbers: personnummer, samordningsnummer and
 * organisationsnummer (Luhn mod 10 over the 10 significant digits).
 *
 * Lives in `@multi-stores/core/se-id`; api, web and dashboard import it from
 * there. No Node or DOM dependence. Personnummer checks need "today" (the
 * century of a 10-digit number, no birth date in the future); callers may
 * pass `now`, otherwise the current clock is read once per call.
 */

/**
 * Luhn (mod 10) check over a string of digits, check digit last. Walking from
 * the right, every second digit is doubled and its digit sum taken.
 * False for an empty string or any non-digit character.
 */
export function luhnValid(digits: string): boolean {
  if (digits.length === 0 || !/^[0-9]+$/.test(digits)) return false;
  let total = 0;
  let position = 0;
  for (let i = digits.length - 1; i >= 0; i -= 1, position += 1) {
    const value = digits.charCodeAt(i) - 48;
    const weighted = position % 2 === 1 ? value * 2 : value;
    total += weighted > 9 ? weighted - 9 : weighted;
  }
  return total % 10 === 0;
}

/**
 * The 10 digits a Swedish org number / personnummer checksum runs over.
 * Accepts "556016-0680", "5560160680", a 12-digit form with a century
 * (18/19/20) and the "16" prefix some registers put in front of org numbers.
 * Whitespace, "-" and "+" are ignored. Null when the shape is wrong.
 */
export function normalizeSwedishOrgNumber(raw: string): string | null {
  const compact = raw.replace(/[\s\-+]/g, '');
  if (!/^[0-9]+$/.test(compact)) return null;
  if (compact.length === 10) return compact;
  if (compact.length === 12 && ['16', '18', '19', '20'].includes(compact.slice(0, 2))) {
    return compact.slice(2);
  }
  return null;
}

export interface ParsedPersonnummer {
  /** YYMMDDNNNC, the digits the checksum runs over. */
  digits10: string;
  /** 19 or 20 when the input carried a 4-digit year; null for 10 digits. */
  century: number | null;
  /** True for a samordningsnummer (day of month + 60). */
  samordning: boolean;
}

const TEN_DIGITS = /^([0-9]{6})([-+]?)([0-9]{4})$/;
const TWELVE_DIGITS = /^(19|20)([0-9]{6})-?([0-9]{4})$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** True when day/month is a real date in `year`. */
function isCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  if (month === 2 && day === 29) return isLeapYear(year);
  return day <= MONTH_DAYS[month - 1]!;
}

/** Comparable YYYYMMDD number. */
function dateKey(year: number, month: number, day: number): number {
  return year * 10000 + month * 100 + day;
}

/**
 * Parses a Swedish personnummer or samordningsnummer.
 *
 * Accepted shapes (whitespace anywhere is ignored):
 *   - YYMMDD-NNNC, YYMMDDNNNC (under 100 years old), YYMMDD+NNNC (100 or
 *     older)
 *   - YYYYMMDD-NNNC, YYYYMMDDNNNC with century 19 or 20
 * Rules: month 01-12; day 01-31, or 61-91 for a samordningsnummer (the real
 * day + 60); the date must exist in the birth year; the birth date may not
 * be after `now`; Luhn over the 10 digits. A 10-digit number takes the
 * latest century that puts the birth date on or before `now`, one century
 * earlier with "+" (the Skatteverket rule). Returns null when any rule fails.
 */
export function parsePersonnummer(
  raw: unknown,
  now: Date = new Date(),
): ParsedPersonnummer | null {
  if (typeof raw !== 'string') return null;
  const input = raw.replace(/\s+/g, '');
  let date6: string;
  let serial: string;
  let century: number | null = null;
  let plus = false;
  const long = TWELVE_DIGITS.exec(input);
  if (long) {
    century = Number(long[1]);
    date6 = long[2]!;
    serial = long[3]!;
  } else {
    const short = TEN_DIGITS.exec(input);
    if (!short) return null;
    date6 = short[1]!;
    plus = short[2] === '+';
    serial = short[3]!;
  }
  const yy = Number(date6.slice(0, 2));
  const month = Number(date6.slice(2, 4));
  let day = Number(date6.slice(4, 6));
  const samordning = day >= 61 && day <= 91;
  if (samordning) day -= 60;
  const today = dateKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
  let year: number;
  if (century !== null) {
    year = century * 100 + yy;
  } else {
    year = Math.floor(now.getFullYear() / 100) * 100 + yy;
    if (dateKey(year, month, day) > today) year -= 100;
    if (plus) year -= 100;
  }
  if (!isCalendarDate(year, month, day)) return null;
  if (dateKey(year, month, day) > today) return null;
  const digits10 = date6 + serial;
  if (!luhnValid(digits10)) return null;
  return { digits10, century, samordning };
}

/** True for a well-formed personnummer or samordningsnummer (see `parsePersonnummer`). */
export function isValidPersonnummer(raw: unknown, now?: Date): boolean {
  return parsePersonnummer(raw, now) !== null;
}
