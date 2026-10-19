/**
 * Personalization app types (M4.1 §3.1, contracts C1/C12/C34).
 *
 * Lives in the `@multi-stores/core` package (M5.3) together with
 * conditions.ts, evaluator.ts and display.ts; the apps import it from
 * `@multi-stores/core/personalization`. `fixtures/personalization-cases.json`
 * holds the cases the api and web specs run (see docs/SHARED-PACKAGE.md).
 * Pure code only: no Node, DOM, Nest or Prisma imports.
 */
// ---------------------------------------------------------------------------
// Field definitions
// ---------------------------------------------------------------------------
/** Every custom field type, M4.0 types plus the app-only ones. */
export const P_FIELD_TYPES = [
    'TEXT',
    'TEXTAREA',
    'NUMBER',
    'IMAGE',
    'FILE',
    'SELECT',
    'COLOR',
    'FONT',
    'DATE',
    'MULTI_IMAGE',
    'CHECKBOX_GROUP',
    'COLOR_PALETTE',
    'REPEATER',
];
/** Types that exist only with the personalization app (dropped by the legacy branch). */
export const APP_ONLY_TYPES = new Set([
    'CHECKBOX_GROUP',
    'COLOR_PALETTE',
    'REPEATER',
]);
/** Types a REPEATER child may have (D5). */
export const REPEATER_CHILD_TYPES = new Set([
    'TEXT',
    'TEXTAREA',
    'NUMBER',
    'SELECT',
    'FONT',
    'COLOR',
    'DATE',
    'CHECKBOX_GROUP',
    'COLOR_PALETTE',
]);
/** Ops of a visibility rule (§3.3). */
export const P_CONDITION_OPS = [
    'eq',
    'neq',
    'in',
    'nin',
    'gt',
    'gte',
    'lt',
    'lte',
    'set',
    'unset',
];
export const P_PRICING_MODES = ['fixed', 'per_option', 'per_char', 'per_item'];
/** `translation.messages` keys (C34) and the issue code each one overrides. */
export const P_MESSAGE_KEYS = {
    required: 'CUSTOM_FIELD_REQUIRED',
    pattern: 'CUSTOM_FIELD_INVALID_FORMAT',
    allowed_chars: 'CUSTOM_FIELD_INVALID_CHARS',
    equal_length: 'CUSTOM_FIELD_LENGTH_MISMATCH',
    max_length: 'CUSTOM_FIELD_TOO_LONG',
    min_checked: 'CUSTOM_FIELD_MIN_CHECKED',
    max_checked: 'CUSTOM_FIELD_MAX_CHECKED',
};
