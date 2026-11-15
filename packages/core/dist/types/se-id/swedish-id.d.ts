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
export declare function luhnValid(digits: string): boolean;
/**
 * The 10 digits a Swedish org number / personnummer checksum runs over.
 * Accepts "556016-0680", "5560160680", a 12-digit form with a century
 * (18/19/20) and the "16" prefix some registers put in front of org numbers.
 * Whitespace, "-" and "+" are ignored. Null when the shape is wrong.
 */
export declare function normalizeSwedishOrgNumber(raw: string): string | null;
export interface ParsedPersonnummer {
    /** YYMMDDNNNC, the digits the checksum runs over. */
    digits10: string;
    /** 18, 19 or 20 when the input carried a 4-digit year; null for 10 digits. */
    century: number | null;
    /** True for a samordningsnummer (day of month + 60). */
    samordning: boolean;
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
export declare function parsePersonnummer(raw: unknown): ParsedPersonnummer | null;
/** True for a well-formed personnummer or samordningsnummer (see `parsePersonnummer`). */
export declare function isValidPersonnummer(raw: unknown): boolean;
