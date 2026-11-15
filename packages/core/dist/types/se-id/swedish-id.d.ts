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
    /** 19 or 20 when the input carried a 4-digit year; null for 10 digits. */
    century: number | null;
    /** True for a samordningsnummer (day of month + 60). */
    samordning: boolean;
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
export declare function parsePersonnummer(raw: unknown, now?: Date): ParsedPersonnummer | null;
/** True for a well-formed personnummer or samordningsnummer (see `parsePersonnummer`). */
export declare function isValidPersonnummer(raw: unknown, now?: Date): boolean;
