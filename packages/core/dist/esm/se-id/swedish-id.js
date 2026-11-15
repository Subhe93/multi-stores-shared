/**
 * Swedish identity numbers: personnummer, samordningsnummer and
 * organisationsnummer (Luhn mod 10 over the 10 significant digits).
 *
 * Lives in `@multi-stores/core/se-id`; api, web and dashboard import it from
 * there. Pure code: no Node, DOM or clock dependence (a 10-digit number has
 * no reliable century without "today", so every plausible century is tried).
 */
/**
 * Luhn (mod 10) check over a string of digits, check digit last. Walking from
 * the right, every second digit is doubled and its digit sum taken.
 * False for an empty string or any non-digit character.
 */
export function luhnValid(digits) {
    if (digits.length === 0 || !/^[0-9]+$/.test(digits))
        return false;
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
export function normalizeSwedishOrgNumber(raw) {
    const compact = raw.replace(/[\s\-+]/g, '');
    if (!/^[0-9]+$/.test(compact))
        return null;
    if (compact.length === 10)
        return compact;
    if (compact.length === 12 && ['16', '18', '19', '20'].includes(compact.slice(0, 2))) {
        return compact.slice(2);
    }
    return null;
}
const TEN_DIGITS = /^([0-9]{6})[-+]?([0-9]{4})$/;
const TWELVE_DIGITS = /^(18|19|20)([0-9]{6})-?([0-9]{4})$/;
function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
/** True when day/month is a real date in at least one of the candidate years. */
function isCalendarDate(month, day, years) {
    if (month < 1 || month > 12 || day < 1)
        return false;
    if (month === 2 && day === 29)
        return years.some(isLeapYear);
    return day <= MONTH_DAYS[month - 1];
}
/**
 * Parses a Swedish personnummer or samordningsnummer.
 *
 * Accepted shapes (whitespace anywhere is ignored):
 *   - YYMMDD-NNNC, YYMMDD+NNNC (100+ years old), YYMMDDNNNC
 *   - YYYYMMDD-NNNC, YYYYMMDDNNNC with century 18, 19 or 20
 * Rules: month 01-12; day 01-31, or 61-91 for a samordningsnummer (the real
 * day + 60); the date must exist (29 Feb of a 10-digit number passes when any
 * candidate century makes the year a leap year); Luhn over the 10 digits.
 * Returns null when any rule fails.
 */
export function parsePersonnummer(raw) {
    if (typeof raw !== 'string')
        return null;
    const input = raw.replace(/\s+/g, '');
    let date6;
    let serial;
    let century = null;
    const long = TWELVE_DIGITS.exec(input);
    if (long) {
        century = Number(long[1]);
        date6 = long[2];
        serial = long[3];
    }
    else {
        const short = TEN_DIGITS.exec(input);
        if (!short)
            return null;
        date6 = short[1];
        serial = short[2];
    }
    const yy = Number(date6.slice(0, 2));
    const month = Number(date6.slice(2, 4));
    let day = Number(date6.slice(4, 6));
    const samordning = day >= 61 && day <= 91;
    if (samordning)
        day -= 60;
    const years = century === null ? [1800 + yy, 1900 + yy, 2000 + yy] : [century * 100 + yy];
    if (!isCalendarDate(month, day, years))
        return null;
    const digits10 = date6 + serial;
    if (!luhnValid(digits10))
        return null;
    return { digits10, century, samordning };
}
/** True for a well-formed personnummer or samordningsnummer (see `parsePersonnummer`). */
export function isValidPersonnummer(raw) {
    return parsePersonnummer(raw) !== null;
}
