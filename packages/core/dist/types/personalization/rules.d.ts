/**
 * Personalization field rules (M4.0) — the single source of truth.
 *
 * Lives in the `@multi-stores/core` package (M5.3): api, web and dashboard
 * import it from `@multi-stores/core/personalization/rules`; never copy it
 * into an app. `fixtures/personalization.vectors.json` holds the vectors that
 * the api and web specs run against this module (see docs/SHARED-PACKAGE.md).
 *
 * Pure code only: no Node, DOM, Nest or Prisma imports, and nothing that
 * depends on the ICU version (lengths are code points, not graphemes — C14).
 */
export declare const FIELD_TYPES: readonly ["TEXT", "TEXTAREA", "NUMBER", "IMAGE", "FILE", "SELECT", "COLOR", "FONT", "DATE", "MULTI_IMAGE"];
export type FieldType = (typeof FIELD_TYPES)[number];
/** Field types whose value is a file reference (stored as `file_url`). */
export declare const FILE_FIELD_TYPES: readonly FieldType[];
/** The subset of a ProductCustomField row the rules need. */
export interface FieldDef {
    id: string;
    name: string;
    type: FieldType | string;
    is_required: boolean;
    options?: unknown;
    validation_rules?: unknown;
    linked_validation?: unknown;
    sort_order?: number | null;
}
/** Issues a customer value can produce (cart, quote, order). */
export declare const CUSTOM_FIELD_ISSUE_CODES: readonly ["CUSTOM_FIELD_REQUIRED", "CUSTOM_FIELD_TOO_SHORT", "CUSTOM_FIELD_TOO_LONG", "CUSTOM_FIELD_INVALID_NUMBER", "CUSTOM_FIELD_NUMBER_TOO_SMALL", "CUSTOM_FIELD_NUMBER_TOO_LARGE", "CUSTOM_FIELD_INVALID_FORMAT", "CUSTOM_FIELD_INVALID_CHARS", "CUSTOM_FIELD_LENGTH_MISMATCH", "CUSTOM_FIELD_COMBINED_TOO_LONG", "CUSTOM_FIELD_INVALID_OPTION", "CUSTOM_FIELD_INVALID_COLOR", "CUSTOM_FIELD_INVALID_DATE", "CUSTOM_FIELD_INVALID_FILE", "CUSTOM_FIELD_TOO_MANY_FILES", "CUSTOM_FIELD_INVALID_PAYLOAD"];
export type IssueCode = (typeof CUSTOM_FIELD_ISSUE_CODES)[number];
/**
 * Codes raised when a merchant saves a field definition (dashboard → API),
 * plus the defensive delete code. Not produced by `validatePersonalization`.
 */
export declare const CUSTOM_FIELD_DEFINITION_ERROR_CODES: readonly ["CUSTOM_FIELD_INVALID_PATTERN", "CUSTOM_FIELD_INVALID_ALLOWED_CHARS", "CUSTOM_FIELD_INVALID_LINK", "CUSTOM_FIELD_NAME_TAKEN", "CUSTOM_FIELD_IN_USE", "CUSTOM_FIELD_INVALID_RULES"];
export type CustomFieldDefinitionErrorCode = (typeof CUSTOM_FIELD_DEFINITION_ERROR_CODES)[number];
/** Customer upload codes (M4.0 WP-B; `UPLOAD_*` codes of UploadsService are reused as-is). */
export declare const CUSTOMER_UPLOAD_ERROR_CODES: readonly ["CUSTOMER_UPLOAD_TYPE_NOT_ALLOWED", "CUSTOMER_UPLOAD_EXPIRED", "CUSTOMER_UPLOAD_NOT_FOUND", "CUSTOMER_UPLOAD_PURGED", "CUSTOMER_UPLOAD_QUOTA", "CUSTOMER_UPLOAD_STORAGE_FULL"];
export type CustomerUploadErrorCode = (typeof CUSTOMER_UPLOAD_ERROR_CODES)[number];
export interface IssueParams {
    min?: number;
    max?: number;
    length?: number;
    allowed?: string;
    target?: string;
}
export interface Issue {
    code: IssueCode;
    /** '' for a payload-level issue that belongs to no field. */
    field_id: string;
    field_name: string;
    params?: IssueParams;
}
/** A value after canonicalization C (see `normalizeFieldValues`). */
export type NormalizedValue = string | number | boolean | NormalizedValue[] | {
    [key: string]: NormalizedValue;
};
export type NormalizedValues = Record<string, NormalizedValue>;
export type LinkedValidation = {
    type: 'equal_length';
    target: string;
    fill_char?: string;
} | {
    type: 'max_combined';
    target: string;
    max: number;
};
export interface ValidationRules {
    min_length?: number;
    max_length?: number;
    pattern?: string;
    allowed_chars?: string;
}
export interface ValidatePersonalizationInput {
    fields: FieldDef[];
    values: unknown;
    /** Creator-filled values (custom products), keyed by field id: the field is
     *  skipped and this value injected, whatever the customer sent. */
    prefilled?: Record<string, string>;
    /** File reference check; default = `isFileRefPath` (path pattern only). */
    isFileRef?: (url: string) => boolean;
    /** M4.1 seam. Hidden fields are dropped and never required. Default: all visible. */
    isVisible?: (field: FieldDef, values: NormalizedValues) => boolean;
    /**
     * Runs a merchant `pattern` against a value; true = the value matches.
     * Default: a plain `RegExp` test (the browser). The API passes a tester
     * with a hard timeout that fails closed (ReDoS guard). Only called for
     * patterns that compile and inputs within `maxPatternInputChars`.
     */
    patternTester?: PatternTester;
}
/** See `ValidatePersonalizationInput.patternTester`. */
export type PatternTester = (pattern: string, input: string, field: FieldDef) => boolean;
export interface ValidatePersonalizationResult {
    ok: boolean;
    issues: Issue[];
    /** Normalized values of known, visible fields (+ injected prefilled ones). */
    values: NormalizedValues;
}
export declare const PERSONALIZATION_LIMITS: {
    /** Keys in one values object (any nesting level). */
    readonly maxKeys: 100;
    /** Code points in one string value (TEXTAREA). Also caps regex input (ReDoS, W6). */
    readonly maxStringChars: 5000;
    /** Items in one array value (M4.1 checkbox groups allow up to 50). */
    readonly maxArrayItems: 50;
    /** Nesting depth of objects/arrays (M4.1 repeaters need 2–3). */
    readonly maxDepth: 4;
    /** Files in one MULTI_IMAGE value. */
    readonly maxFiles: 20;
    /** Characters in a FONT value when the field has no option list. */
    readonly maxFontChars: 100;
    /** Characters of a merchant `pattern` / `allowed_chars` body. */
    readonly maxPatternLength: 200;
    readonly maxAllowedCharsLength: 200;
    /** Code points of a value checked against a merchant `pattern` (ReDoS guard). */
    readonly maxPatternInputChars: 500;
};
/** Removes U+FE0E/U+FE0F (text/emoji presentation selectors). */
export declare function stripVariationSelectors(s: string): string;
/**
 * Length used by every rule (K4/C14): Unicode code points after NFC and after
 * removing U+FE0E/U+FE0F. U+2764 U+FE0F counts 1, a ZWJ family of three counts 5.
 */
export declare function charCount(s: string): number;
export declare function isPlainObject(v: unknown): v is Record<string, unknown>;
/**
 * Canonicalization C as an object (M4.0 §1.2): non-objects become `{}`;
 * strings NFC + trimmed, empties dropped; finite numbers and booleans kept;
 * arrays keep their order (empty scalars dropped, object elements kept in
 * place); nested objects normalized recursively; null/undefined/NaN dropped;
 * keys sorted by code unit. Variation selectors are kept (W17).
 */
export declare function normalizeFieldValues(v: unknown): NormalizedValues;
/**
 * Cart line key (M4.0 §1.2, C11). '' means "no personalization and no
 * design", which merges exactly like before M4.0. Uses an array of pairs, not
 * an object, because JS orders integer-like object keys first.
 */
export declare function lineKey(customFields: unknown, designId?: string | null): string;
/** Reads `validation_rules` leniently (legacy rows store numbers as strings). */
export declare function readValidationRules(raw: unknown): ValidationRules;
/**
 * Reads `linked_validation` (K3/C16). Legacy `target_field_id` is read as
 * `target`. `max_combined` without a numeric `max` is ignored (null).
 */
export declare function readLinkedValidation(raw: unknown): LinkedValidation | null;
/**
 * Resolves a link target: by name first (lowest sort_order wins on duplicate
 * names), then by id for legacy rows; never the field itself.
 */
export declare function resolveLinkTarget(link: LinkedValidation, fields: FieldDef[], self: FieldDef): FieldDef | null;
/** Compiles a merchant `pattern` exactly like the storefront always did (no `u` flag). */
export declare function compilePattern(pattern: string): RegExp | null;
/**
 * Compiles an `allowed_chars` character-class body as-is (C15):
 * `^[<body>]*$` with the `u` flag. Returns null when the body is empty, too
 * long, has an unescaped bracket or does not compile.
 */
export declare function compileAllowedChars(body: string): RegExp | null;
/** Why a merchant `pattern` is refused at save time. */
export type PatternProblem = 'invalid' | 'too_long' | 'unsafe';
/**
 * Save-time check for `pattern` (API DTO and dashboard): null when the
 * pattern may be saved. `too_long` over `maxPatternLength`, `invalid` when it
 * does not compile, `unsafe` when `isPatternSafe` refuses it.
 */
export declare function patternProblem(pattern: string): PatternProblem | null;
/** Save-time check for `pattern` (API DTO and dashboard). */
export declare function isValidPattern(pattern: string): boolean;
/**
 * ReDoS heuristic for merchant patterns (no `re2`, M4.0; relaxed in M5 A10).
 * Refuses:
 * - backreferences (`\1`, `\k<name>`) and lookarounds (`(?=`, `(?!`, `(?<=`, `(?<!`);
 * - a group repeated more than once (`*`, `+`, `{n,}`, `{n,m}` with m > 1)
 *   whose body, or one of its alternatives, is a single quantified atom
 *   (`^(a+)+$`, `^(a{1,3}){2}$`, `^(a+|b+)+$`), or that holds a quantified
 *   nested group or a quantifier inside one (`^((a+)b)+$`);
 * - such a repeated group whose alternatives may start with the same
 *   character (`(a|ab)*`, `(\d|[0-9])+`); disjoint classes are fine
 *   (`([A-Z]|[a-z])+`).
 * A repeated group of several quantified atoms (`^(?:[a-z]+\s?)+$`, the
 * "words with an optional separator" idiom) is accepted: on the server every
 * pattern runs under the vm timeout (`pattern-tester.ts`), which is the
 * guard for anything this heuristic lets through. Polynomial cases such as
 * `.*.*` pass; they are bounded by `maxPatternInputChars` and that timeout.
 */
export declare function isPatternSafe(pattern: string): boolean;
/** Save-time check for `allowed_chars` (API DTO and dashboard). */
export declare function isValidAllowedChars(body: string): boolean;
/** Path of a relative or absolute (http/https) URL; null when it is neither. */
export declare function fileRefPath(url: string): string | null;
/** Default `isFileRef`: path pattern only, any host (the server adds a host check). */
export declare function isFileRefPath(url: string): boolean;
/**
 * Validates and normalizes a line's personalization values (M4.0 §4.2).
 *
 * - `values` must be a plain object (null/undefined = none) within
 *   PERSONALIZATION_LIMITS, else one `CUSTOM_FIELD_INVALID_PAYLOAD` issue.
 * - Keys that are not a field id of the product are dropped (not an error).
 * - Prefilled fields are skipped and their value injected; hidden fields are
 *   dropped and never required.
 * - At most one issue per field; issues are ordered by `sort_order`.
 */
export declare function validatePersonalization(input: ValidatePersonalizationInput): ValidatePersonalizationResult;
