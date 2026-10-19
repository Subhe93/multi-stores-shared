/**
 * Personalization evaluator (M4.1 §3.2, D3/D4/D5/D8/D10, contracts C1/C14/C15/C34).
 * Part of `@multi-stores/core/personalization` (see types.ts). Pure code only.
 *
 * `evaluatePersonalization(defs, raw, ctx)`:
 * - app off → the M4.0 validator (`validatePersonalization`) on top-level
 *   fields of M4.0 types, unchanged (legacy branch, D10);
 * - app on → visibility, normalization, validation (per-field checks still
 *   delegated to `validatePersonalization`), repeaters, price and lines.
 *   Fields without M4.1 features keep exactly the M4.0 values and issues.
 */
import { type LocaleText, type PContext, type PErrorCode, type PFieldDef, type PLine, type PLineMeta, type PPricingMode, type PResult, type PTranslation, type PUi } from './types.js';
/** Largest accepted modifier: 1 000 000.00 (keeps every sum a safe integer). */
export declare const MAX_PRICE_MINOR = 100000000;
/**
 * Largest per-unit delta (one line or the sum), in minor units: what a
 * Decimal(10,2) column holds (99 999 999.99). Anything above, or any amount
 * that is not a safe integer, is the `PERSONALIZATION_PRICE_TOO_HIGH` error,
 * never a silent 0.
 */
export declare const MAX_DELTA_MINOR = 9999999999;
/**
 * Converts a non-negative amount (number or decimal string, '.' or ',') to
 * integer minor units, rounding half up on the decimal text. Negative,
 * non-numeric or too large amounts give 0 (modifiers are ≥ 0, Q6).
 */
export declare function toMinorUnits(v: unknown): number;
/** Formats integer minor units as a two-decimal string ("12.50"). */
export declare function formatMinorUnits(minor: number): string;
/** First code points of `s` (NFC) whose `charCount` is at most `max`; VS15/16 are kept but not counted. */
export declare function truncateChars(s: string, max: number): string;
/**
 * Inserts `ch` at a UTF-16 caret (namez ❤ button, A L671-690). Refused (null)
 * when `charCount(value) >= max`. The caret never splits a surrogate pair.
 */
export declare function insertAtCaret(value: string, caret: number, ch: string, max?: number | null): {
    value: string;
    caret: number;
} | null;
/** True when a field uses any M4.1 feature (app-only type, parent, conditions, pricing, repeat, ui). */
export declare function isAdvancedField(def: PFieldDef): boolean;
export declare function readUi(raw: unknown): PUi;
export interface ReadPricing {
    mode: PPricingMode;
    amountMinor: number;
    optionPricesMinor: Record<string, number>;
}
export declare function readPricing(raw: unknown): ReadPricing | null;
export interface ReadRepeat {
    option: string;
    map: Record<string, number> | null;
    start: number;
    max: number;
    leadFields: string[];
    leadOptions: string[];
}
/** Max repeater instances (config validator: `max` 1..20). */
export declare const MAX_REPEAT_INSTANCES = 20;
export declare function readRepeat(raw: unknown): ReadRepeat | null;
/** Item indexes of a repeater: `start_index .. min(N, start_index + max - 1)` (namez "q ≥ i and q > 1" = start 2). */
export declare function repeaterIndexes(def: PFieldDef, ctx: Pick<PContext, 'variantOptions' | 'optionConfig'>): number[];
/** Option strings of a field, NFC + trimmed (same reading as the M4.0 option check). */
export declare function optionValues(options: unknown): string[];
export interface PaletteEntry {
    value: string;
    hex: string | null;
}
/**
 * COLOR_PALETTE choices: `ui.palette_from_option` (that option's values ∩
 * values on active variants, hex from `colorMap`), else `options` with
 * `ui.palette_hex`.
 */
export declare function resolvePalette(def: PFieldDef, ctx: Pick<PContext, 'optionConfig' | 'activeOptionValues'>): PaletteEntry[];
/** App-mode text normalization (D7): NFC, strip VS15/16, trim, then `ui.transform`. */
export declare function normalizeText(s: string, transform?: string | null): string;
/**
 * CHECKBOX_GROUP selection. Key absent → `ui.default_checked` (PPOM default);
 * present but empty (`[]`, `null`, `''`, `false`) → none. Values are NFC +
 * trimmed, deduplicated and returned in option order; `invalid` lists values
 * that are not options. `false` is the canonical "explicitly none" marker
 * when the field has defaults, so re-evaluating canonical values is stable.
 */
export declare function checkboxSelection(def: PFieldDef, rawContainer: unknown): {
    list: string[];
    invalid: string[];
    canonical: string[] | false | undefined;
};
/** Translation row for display: locale → primary → en → first. */
export declare function pickFieldTranslation(translations: readonly PTranslation[] | null | undefined, locale?: string | null, primary?: string | null): PTranslation | undefined;
/** `map[locale]` → `[primary]` → `.en` → first non-empty (same chain as the snapshot reader). */
export declare function localeText(map: unknown, locale?: string | null, primary?: string | null): string | null;
/** `translation.messages[key]` (same translation row as the label), `{i}` replaced; '' when none. */
export declare function fieldMessage(def: PFieldDef, code: PErrorCode, ctx: Pick<PContext, 'locale' | 'primaryLocale'>, index?: number): string;
/** Top-level defs and children per parent, from a flat list (`parent_id`) and/or a tree (`children`). */
export declare function splitFieldTree(defs: readonly PFieldDef[]): {
    top: PFieldDef[];
    childrenOf: Map<string, PFieldDef[]>;
};
/**
 * Evaluates a product's personalization for one cart/order line (M4.1 §3.2).
 * Price, values and lines are computed from the definitions only; nothing the
 * client sends besides the raw values is trusted (D4).
 */
export declare function evaluatePersonalization(defs: readonly PFieldDef[], raw: unknown, ctx: PContext): PResult;
/**
 * The C1 columns of one line for `buildOrderValues(…, {lines})`. Keys whose
 * value is null are left out (Prisma JSON columns need an absent key, not
 * null). The upload id and file classification stay with the builder.
 */
export interface PSnapshotColumns {
    custom_field_id: string | null;
    value?: string;
    file_url?: string;
    field_name: string;
    field_type?: string;
    field_label?: LocaleText;
    display_value?: LocaleText;
    sort_order: number;
    group_key?: string;
    group_index?: number;
    group_label?: LocaleText;
    source: 'FIELD' | 'OPTION';
    price_delta: string;
    meta?: PLineMeta;
}
export declare function lineSnapshotColumns(line: PLine): PSnapshotColumns;
