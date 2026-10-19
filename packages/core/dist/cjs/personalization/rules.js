"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERSONALIZATION_LIMITS = exports.CUSTOMER_UPLOAD_ERROR_CODES = exports.CUSTOM_FIELD_DEFINITION_ERROR_CODES = exports.CUSTOM_FIELD_ISSUE_CODES = exports.FILE_FIELD_TYPES = exports.FIELD_TYPES = void 0;
exports.stripVariationSelectors = stripVariationSelectors;
exports.charCount = charCount;
exports.isPlainObject = isPlainObject;
exports.normalizeFieldValues = normalizeFieldValues;
exports.lineKey = lineKey;
exports.readValidationRules = readValidationRules;
exports.readLinkedValidation = readLinkedValidation;
exports.resolveLinkTarget = resolveLinkTarget;
exports.compilePattern = compilePattern;
exports.compileAllowedChars = compileAllowedChars;
exports.patternProblem = patternProblem;
exports.isValidPattern = isValidPattern;
exports.isPatternSafe = isPatternSafe;
exports.isValidAllowedChars = isValidAllowedChars;
exports.fileRefPath = fileRefPath;
exports.isFileRefPath = isFileRefPath;
exports.validatePersonalization = validatePersonalization;
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
exports.FIELD_TYPES = [
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
];
/** Field types whose value is a file reference (stored as `file_url`). */
exports.FILE_FIELD_TYPES = ['IMAGE', 'FILE', 'MULTI_IMAGE'];
/** Issues a customer value can produce (cart, quote, order). */
exports.CUSTOM_FIELD_ISSUE_CODES = [
    'CUSTOM_FIELD_REQUIRED',
    'CUSTOM_FIELD_TOO_SHORT',
    'CUSTOM_FIELD_TOO_LONG',
    'CUSTOM_FIELD_INVALID_NUMBER',
    'CUSTOM_FIELD_NUMBER_TOO_SMALL',
    'CUSTOM_FIELD_NUMBER_TOO_LARGE',
    'CUSTOM_FIELD_INVALID_FORMAT',
    'CUSTOM_FIELD_INVALID_CHARS',
    'CUSTOM_FIELD_LENGTH_MISMATCH',
    'CUSTOM_FIELD_COMBINED_TOO_LONG',
    'CUSTOM_FIELD_INVALID_OPTION',
    'CUSTOM_FIELD_INVALID_COLOR',
    'CUSTOM_FIELD_INVALID_DATE',
    'CUSTOM_FIELD_INVALID_FILE',
    'CUSTOM_FIELD_TOO_MANY_FILES',
    'CUSTOM_FIELD_INVALID_PAYLOAD',
];
/**
 * Codes raised when a merchant saves a field definition (dashboard → API),
 * plus the defensive delete code. Not produced by `validatePersonalization`.
 */
exports.CUSTOM_FIELD_DEFINITION_ERROR_CODES = [
    'CUSTOM_FIELD_INVALID_PATTERN',
    'CUSTOM_FIELD_INVALID_ALLOWED_CHARS',
    'CUSTOM_FIELD_INVALID_LINK',
    'CUSTOM_FIELD_NAME_TAKEN',
    'CUSTOM_FIELD_IN_USE',
    'CUSTOM_FIELD_INVALID_RULES',
];
/** Customer upload codes (M4.0 WP-B; `UPLOAD_*` codes of UploadsService are reused as-is). */
exports.CUSTOMER_UPLOAD_ERROR_CODES = [
    'CUSTOMER_UPLOAD_TYPE_NOT_ALLOWED',
    'CUSTOMER_UPLOAD_EXPIRED',
    'CUSTOMER_UPLOAD_NOT_FOUND',
    'CUSTOMER_UPLOAD_PURGED',
    /** 429: the per-IP daily upload byte budget is used up. */
    'CUSTOMER_UPLOAD_QUOTA',
    /** 503: the server is low on disk space; try again later. */
    'CUSTOMER_UPLOAD_STORAGE_FULL',
];
// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------
exports.PERSONALIZATION_LIMITS = {
    /** Keys in one values object (any nesting level). */
    maxKeys: 100,
    /** Code points in one string value (TEXTAREA). Also caps regex input (ReDoS, W6). */
    maxStringChars: 5000,
    /** Items in one array value (M4.1 checkbox groups allow up to 50). */
    maxArrayItems: 50,
    /** Nesting depth of objects/arrays (M4.1 repeaters need 2–3). */
    maxDepth: 4,
    /** Files in one MULTI_IMAGE value. */
    maxFiles: 20,
    /** Characters in a FONT value when the field has no option list. */
    maxFontChars: 100,
    /** Characters of a merchant `pattern` / `allowed_chars` body. */
    maxPatternLength: 200,
    maxAllowedCharsLength: 200,
    /** Code points of a value checked against a merchant `pattern` (ReDoS guard). */
    maxPatternInputChars: 500,
};
// ---------------------------------------------------------------------------
// Strings
// ---------------------------------------------------------------------------
const VARIATION_SELECTORS = /[\uFE0E\uFE0F]/g;
/** Removes U+FE0E/U+FE0F (text/emoji presentation selectors). */
function stripVariationSelectors(s) {
    return s.replace(VARIATION_SELECTORS, '');
}
/**
 * Length used by every rule (K4/C14): Unicode code points after NFC and after
 * removing U+FE0E/U+FE0F. U+2764 U+FE0F counts 1, a ZWJ family of three counts 5.
 */
function charCount(s) {
    return Array.from(stripVariationSelectors(s.normalize('NFC'))).length;
}
// ---------------------------------------------------------------------------
// Canonicalization C (cart line key, stored values)
// ---------------------------------------------------------------------------
function isPlainObject(v) {
    if (v === null || typeof v !== 'object' || Array.isArray(v))
        return false;
    const proto = Object.getPrototypeOf(v);
    return proto === Object.prototype || proto === null;
}
/** Normalizes one value; `undefined` means "drop it". */
function normalizeValue(v, inArray) {
    if (typeof v === 'string') {
        const s = v.normalize('NFC').trim();
        return s === '' ? undefined : s;
    }
    if (typeof v === 'number')
        return Number.isFinite(v) ? v : undefined;
    if (typeof v === 'boolean')
        return v;
    if (Array.isArray(v)) {
        const out = [];
        for (const el of v) {
            if (isPlainObject(el)) {
                // C11 amendment: object elements stay at their index ({} allowed) so
                // repeater instances never shift.
                out.push(normalizeObject(el));
                continue;
            }
            const n = normalizeValue(el, true);
            if (n !== undefined)
                out.push(n);
        }
        return out.length === 0 ? undefined : out;
    }
    if (isPlainObject(v)) {
        const o = normalizeObject(v);
        // An empty object inside an array is kept by the caller; as an entry
        // value it means "nothing", like '' or null.
        return !inArray && Object.keys(o).length === 0 ? undefined : o;
    }
    return undefined; // null, undefined, NaN, functions, dates, ...
}
function normalizeObject(o) {
    const keys = Object.keys(o).sort(compareCodeUnits);
    const out = {};
    for (const k of keys) {
        const n = normalizeValue(o[k], false);
        if (n !== undefined)
            out[k] = n;
    }
    return out;
}
function compareCodeUnits(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
/**
 * Canonicalization C as an object (M4.0 §1.2): non-objects become `{}`;
 * strings NFC + trimmed, empties dropped; finite numbers and booleans kept;
 * arrays keep their order (empty scalars dropped, object elements kept in
 * place); nested objects normalized recursively; null/undefined/NaN dropped;
 * keys sorted by code unit. Variation selectors are kept (W17).
 */
function normalizeFieldValues(v) {
    return isPlainObject(v) ? normalizeObject(v) : {};
}
/** Deterministic, key-order-free encoding: objects become `{o: [[k, v], ...]}`. */
function encodeForKey(v) {
    if (Array.isArray(v))
        return v.map(encodeForKey);
    if (v !== null && typeof v === 'object') {
        return {
            o: Object.keys(v)
                .sort(compareCodeUnits)
                .map((k) => [k, encodeForKey(v[k])]),
        };
    }
    return v;
}
/**
 * Cart line key (M4.0 §1.2, C11). '' means "no personalization and no
 * design", which merges exactly like before M4.0. Uses an array of pairs, not
 * an object, because JS orders integer-like object keys first.
 */
function lineKey(customFields, designId) {
    const normalized = normalizeFieldValues(customFields);
    const keys = Object.keys(normalized).sort(compareCodeUnits);
    const design = typeof designId === 'string' && designId !== '' ? designId : null;
    if (keys.length === 0 && design === null)
        return '';
    const pairs = keys.map((k) => [k, encodeForKey(normalized[k])]);
    return JSON.stringify(['v1', design, pairs]);
}
// ---------------------------------------------------------------------------
// Merchant rules (validation_rules, linked_validation)
// ---------------------------------------------------------------------------
function toInt(v) {
    if (typeof v === 'number' && Number.isFinite(v))
        return Math.trunc(v);
    if (typeof v === 'string' && /^\s*-?\d+\s*$/.test(v))
        return parseInt(v, 10);
    return undefined;
}
/** Reads `validation_rules` leniently (legacy rows store numbers as strings). */
function readValidationRules(raw) {
    if (!isPlainObject(raw))
        return {};
    const out = {};
    const min = toInt(raw.min_length);
    const max = toInt(raw.max_length);
    if (min !== undefined)
        out.min_length = min;
    if (max !== undefined)
        out.max_length = max;
    if (typeof raw.pattern === 'string' && raw.pattern !== '')
        out.pattern = raw.pattern;
    if (typeof raw.allowed_chars === 'string' && raw.allowed_chars !== '') {
        out.allowed_chars = raw.allowed_chars;
    }
    return out;
}
/**
 * Reads `linked_validation` (K3/C16). Legacy `target_field_id` is read as
 * `target`. `max_combined` without a numeric `max` is ignored (null).
 */
function readLinkedValidation(raw) {
    if (!isPlainObject(raw))
        return null;
    const target = typeof raw.target === 'string' && raw.target.trim() !== ''
        ? raw.target.trim()
        : typeof raw.target_field_id === 'string' && raw.target_field_id.trim() !== ''
            ? raw.target_field_id.trim()
            : null;
    if (!target)
        return null;
    if (raw.type === 'equal_length') {
        // fill_char pads one character at a time: anything but exactly one code
        // point (C14 counting) is ignored.
        const fill = typeof raw.fill_char === 'string' && charCount(raw.fill_char) === 1
            ? raw.fill_char
            : undefined;
        return fill === undefined
            ? { type: 'equal_length', target }
            : { type: 'equal_length', target, fill_char: fill };
    }
    if (raw.type === 'max_combined') {
        const max = toInt(raw.max);
        if (max === undefined || max < 1)
            return null;
        return { type: 'max_combined', target, max };
    }
    return null;
}
function bySortOrder(a, b) {
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
}
/**
 * Resolves a link target: by name first (lowest sort_order wins on duplicate
 * names), then by id for legacy rows; never the field itself.
 */
function resolveLinkTarget(link, fields, self) {
    const others = fields.filter((f) => f.id !== self.id);
    const byName = others.filter((f) => f.name === link.target).sort(bySortOrder);
    if (byName.length > 0)
        return byName[0];
    return others.find((f) => f.id === link.target) ?? null;
}
/** Compiles a merchant `pattern` exactly like the storefront always did (no `u` flag). */
function compilePattern(pattern) {
    if (typeof pattern !== 'string' || pattern === '')
        return null;
    if (pattern.length > exports.PERSONALIZATION_LIMITS.maxPatternLength)
        return null;
    try {
        return new RegExp(pattern);
    }
    catch {
        return null;
    }
}
/** True when the body has an unescaped `[` or `]` (it would break out of the class). */
function hasUnescapedBracket(body) {
    for (let i = 0; i < body.length; i++) {
        const c = body[i];
        if (c === '\\') {
            i++;
            continue;
        }
        if (c === '[' || c === ']')
            return true;
    }
    return false;
}
/**
 * Compiles an `allowed_chars` character-class body as-is (C15):
 * `^[<body>]*$` with the `u` flag. Returns null when the body is empty, too
 * long, has an unescaped bracket or does not compile.
 */
function compileAllowedChars(body) {
    if (typeof body !== 'string' || body === '')
        return null;
    if (body.length > exports.PERSONALIZATION_LIMITS.maxAllowedCharsLength)
        return null;
    if (hasUnescapedBracket(body))
        return null;
    try {
        return new RegExp('^[' + body + ']*$', 'u');
    }
    catch {
        return null;
    }
}
/**
 * Save-time check for `pattern` (API DTO and dashboard): null when the
 * pattern may be saved. `too_long` over `maxPatternLength`, `invalid` when it
 * does not compile, `unsafe` when `isPatternSafe` refuses it.
 */
function patternProblem(pattern) {
    if (typeof pattern !== 'string' || pattern === '')
        return 'invalid';
    if (pattern.length > exports.PERSONALIZATION_LIMITS.maxPatternLength)
        return 'too_long';
    if (compilePattern(pattern) === null)
        return 'invalid';
    return isPatternSafe(pattern) ? null : 'unsafe';
}
/** Save-time check for `pattern` (API DTO and dashboard). */
function isValidPattern(pattern) {
    return patternProblem(pattern) === null;
}
const DIGIT_RANGES = [[48, 57]];
const WORD_RANGES = [[48, 57], [65, 90], [95, 95], [97, 122]];
const SPACE_RANGES = [
    [9, 13],
    [32, 32],
    [160, 160],
    [0x1680, 0x1680],
    [0x2000, 0x200a],
    [0x2028, 0x2029],
    [0x202f, 0x202f],
    [0x205f, 0x205f],
    [0x3000, 0x3000],
    [0xfeff, 0xfeff],
];
/** `\d`, `\w`, `\s` as code ranges; null for anything else. */
function escapeRanges(n) {
    if (n === 'd')
        return DIGIT_RANGES;
    if (n === 'w')
        return WORD_RANGES;
    if (n === 's')
        return SPACE_RANGES;
    return null;
}
/**
 * Code ranges of a positive character class body (`a-zA-Z0-9`, `\d`, `_-`),
 * or null when the body is negated or uses anything the overlap check does
 * not model (the class then counts as "may start with anything").
 */
function classRanges(body) {
    if (body.startsWith('^'))
        return null;
    const out = [];
    let i = 0;
    // One class item: a code point, -1 for an escape already added to `out`,
    // null when the item is not modelled.
    const readOne = () => {
        const c = body[i];
        if (c === '\\') {
            const n = body[i + 1];
            if (n === undefined)
                return null;
            i += 2;
            const r = escapeRanges(n);
            if (r) {
                out.push(...r);
                return -1;
            }
            if (/[DWSbBpPux0-9k]/.test(n))
                return null;
            return n.codePointAt(0) ?? null;
        }
        i++;
        return c.codePointAt(0) ?? null;
    };
    while (i < body.length) {
        const lo = readOne();
        if (lo === null)
            return null;
        if (lo === -1)
            continue;
        if (body[i] === '-' && i + 1 < body.length) {
            i++;
            const hi = readOne();
            if (hi === null || hi === -1 || hi < lo)
                return null;
            out.push([lo, hi]);
            continue;
        }
        out.push([lo, lo]);
    }
    return out;
}
function rangesOverlap(a, b) {
    return a.some(([alo, ahi]) => b.some(([blo, bhi]) => alo <= bhi && blo <= ahi));
}
/** True when two first atoms may match the same character. */
function atomsOverlap(a, b) {
    if (a.kind === 'other' || b.kind === 'other' || a.kind === 'empty' || b.kind === 'empty')
        return true;
    if (a.kind === 'char' && b.kind === 'char')
        return a.ch.toLowerCase() === b.ch.toLowerCase();
    if (a.kind === 'class' && b.kind === 'class')
        return rangesOverlap(a.ranges, b.ranges);
    const ch = a.kind === 'char' ? a : b;
    const cls = a.kind === 'class' ? a : b;
    const code = ch.ch.codePointAt(0) ?? -1;
    return rangesOverlap([[code, code]], cls.ranges);
}
/** True when two alternatives may start with the same character. */
function alternativesOverlap(alts) {
    for (let i = 0; i < alts.length; i++) {
        for (let j = i + 1; j < alts.length; j++) {
            if (atomsOverlap(alts[i].first, alts[j].first))
                return true;
        }
    }
    return false;
}
/**
 * Reads a quantifier at `i`: its end index and maximum count (Infinity when
 * unbounded), or null when there is none. A `{` that is not a valid
 * quantifier is a literal (non-`u` regex syntax).
 */
function readQuantifier(p, i) {
    const c = p[i];
    let end;
    let max;
    if (c === '*' || c === '+') {
        end = i + 1;
        max = Infinity;
    }
    else if (c === '?') {
        end = i + 1;
        max = 1;
    }
    else if (c === '{') {
        const m = /^\{(\d+)(,(\d*))?\}/.exec(p.slice(i));
        if (!m)
            return null;
        end = i + m[0].length;
        max = m[2] === undefined ? Number(m[1]) : m[3] === '' ? Infinity : Number(m[3]);
    }
    else {
        return null;
    }
    if (p[end] === '?')
        end++; // lazy
    return { end, max };
}
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
function isPatternSafe(pattern) {
    const p = pattern;
    const newFrame = () => ({
        nestedQuantifier: false,
        alts: [{ first: { kind: 'empty' }, atoms: 0, quantified: 0 }],
    });
    const stack = [newFrame()];
    const top = () => stack[stack.length - 1];
    const current = () => {
        const alts = top().alts;
        return alts[alts.length - 1];
    };
    // Records an atom of the current alternative (the first one is kept).
    const atom = (a) => {
        const alt = current();
        alt.atoms++;
        if (alt.first.kind === 'empty')
            alt.first = a;
    };
    // Applies a quantifier after an atom: the next index, or -1 when unsafe.
    const quantify = (i, group) => {
        const q = readQuantifier(p, i);
        if (!q)
            return i;
        current().quantified++;
        if (group)
            top().nestedQuantifier = true;
        if (group && q.max > 1) {
            if (group.nestedQuantifier)
                return -1;
            if (group.alts.some((a) => a.atoms === 1 && a.quantified > 0))
                return -1;
            if (group.alts.length > 1 && alternativesOverlap(group.alts))
                return -1;
        }
        return q.end;
    };
    let i = 0;
    while (i < p.length) {
        const c = p[i];
        if (c === '\\') {
            const n = p[i + 1];
            if (n === undefined)
                return false;
            if (/[1-9k]/.test(n))
                return false; // backreference
            const ranges = escapeRanges(n);
            atom(ranges ? { kind: 'class', ranges } : /[DWSbB]/.test(n) ? { kind: 'other' } : { kind: 'char', ch: n });
            i = quantify(i + 2, null);
        }
        else if (c === '[') {
            let j = i + 1;
            if (p[j] === '^')
                j++;
            // A `]` right away closes the class (`[]` / `[^]` in JS).
            while (j < p.length && p[j] !== ']')
                j += p[j] === '\\' ? 2 : 1;
            if (j >= p.length)
                return false;
            const ranges = classRanges(p.slice(i + 1, j));
            atom(ranges ? { kind: 'class', ranges } : { kind: 'other' });
            i = quantify(j + 1, null);
        }
        else if (c === '(') {
            let body = i + 1;
            if (p[i + 1] === '?') {
                const kind = p[i + 2];
                if (kind === ':')
                    body = i + 3;
                else if (kind === '<' && p[i + 3] !== '=' && p[i + 3] !== '!') {
                    const close = p.indexOf('>', i + 3);
                    if (close < 0)
                        return false;
                    body = close + 1;
                }
                else
                    return false; // lookaround or unknown group
            }
            atom({ kind: 'other' });
            stack.push(newFrame());
            i = body;
        }
        else if (c === ')') {
            if (stack.length < 2)
                return false;
            const group = stack.pop();
            if (group.nestedQuantifier || group.alts.some((a) => a.quantified > 0)) {
                top().nestedQuantifier = true;
            }
            i = quantify(i + 1, group);
        }
        else if (c === '|') {
            top().alts.push({ first: { kind: 'empty' }, atoms: 0, quantified: 0 });
            i++;
        }
        else if (c === '^' || c === '$') {
            i++;
        }
        else {
            atom(c === '.' ? { kind: 'other' } : { kind: 'char', ch: c });
            i = quantify(i + 1, null);
        }
        if (i < 0)
            return false;
    }
    return stack.length === 1;
}
/** Save-time check for `allowed_chars` (API DTO and dashboard). */
function isValidAllowedChars(body) {
    return compileAllowedChars(body) !== null;
}
// ---------------------------------------------------------------------------
// File references
// ---------------------------------------------------------------------------
const FILE_REF_PATH = /^\/uploads\/(?:custom-fields|customer-uploads|customer-previews)\/[A-Za-z0-9_-][A-Za-z0-9._-]{0,199}$/;
/** Path of a relative or absolute (http/https) URL; null when it is neither. */
function fileRefPath(url) {
    if (typeof url !== 'string')
        return null;
    if (url.startsWith('/'))
        return url;
    const m = /^https?:\/\/[^/?#\s]+(\/[^?#\s]*)$/i.exec(url);
    return m ? m[1] : null;
}
/** Default `isFileRef`: path pattern only, any host (the server adds a host check). */
function isFileRefPath(url) {
    const p = fileRefPath(url);
    return p !== null && FILE_REF_PATH.test(p);
}
// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------
/** Structural caps on the raw payload (DoS guard). */
function payloadWithinLimits(v, depth) {
    if (typeof v === 'string')
        return charCountRaw(v) <= exports.PERSONALIZATION_LIMITS.maxStringChars;
    if (Array.isArray(v)) {
        if (depth >= exports.PERSONALIZATION_LIMITS.maxDepth)
            return false;
        if (v.length > exports.PERSONALIZATION_LIMITS.maxArrayItems)
            return false;
        return v.every((el) => payloadWithinLimits(el, depth + 1));
    }
    if (isPlainObject(v)) {
        if (depth >= exports.PERSONALIZATION_LIMITS.maxDepth)
            return false;
        const keys = Object.keys(v);
        if (keys.length > exports.PERSONALIZATION_LIMITS.maxKeys)
            return false;
        return keys.every((k) => payloadWithinLimits(v[k], depth + 1));
    }
    return true;
}
/**
 * Code points of a raw string for the payload cap, without normalizing huge
 * inputs: UTF-16 length is an upper bound, and half of it a lower bound.
 */
function charCountRaw(s) {
    const max = exports.PERSONALIZATION_LIMITS.maxStringChars;
    if (s.length <= max)
        return s.length;
    if (s.length > max * 2)
        return s.length;
    return charCount(s);
}
function isBlank(v) {
    return v === undefined;
}
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const NUMERIC_RE = /^-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/;
/**
 * Reads a decimal comma (`1,5`, as typed in sv/de/fr/tr) as a point: only a
 * single comma with no point is converted. The stored value is unchanged.
 */
function decimalPoint(s) {
    return s.indexOf('.') < 0 && s.indexOf(',') === s.lastIndexOf(',') ? s.replace(',', '.') : s;
}
function isRealDate(s) {
    const m = DATE_RE.exec(s);
    if (!m)
        return false;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (mo < 1 || mo > 12 || d < 1)
        return false;
    const dim = new Date(Date.UTC(y, mo, 0)).getUTCDate();
    return d <= dim;
}
function textOf(v) {
    if (typeof v === 'string')
        return v;
    if (typeof v === 'number')
        return String(v);
    return null;
}
function optionList(options) {
    if (!Array.isArray(options))
        return [];
    return options
        .filter((o) => typeof o === 'string' || typeof o === 'number')
        .map((o) => String(o).normalize('NFC').trim())
        .filter((o) => o !== '');
}
/** Checks one present value against its field's own rules (links are separate). */
function checkValue(field, value, isFileRef, patternTester) {
    const rules = readValidationRules(field.validation_rules);
    switch (field.type) {
        case 'TEXT':
        case 'TEXTAREA': {
            const s = textOf(value);
            if (s === null)
                return { code: 'CUSTOM_FIELD_INVALID_PAYLOAD' };
            const len = charCount(s);
            if (rules.min_length !== undefined && len < rules.min_length) {
                return { code: 'CUSTOM_FIELD_TOO_SHORT', params: { min: rules.min_length } };
            }
            if (rules.max_length !== undefined && len > rules.max_length) {
                return { code: 'CUSTOM_FIELD_TOO_LONG', params: { max: rules.max_length } };
            }
            if (rules.pattern) {
                const re = compilePattern(rules.pattern);
                // An invalid merchant regex is ignored (fail-open, as the storefront always did).
                if (re) {
                    // ReDoS guard: a pattern only ever sees a bounded input.
                    if (len > exports.PERSONALIZATION_LIMITS.maxPatternInputChars) {
                        return {
                            code: 'CUSTOM_FIELD_TOO_LONG',
                            params: { max: exports.PERSONALIZATION_LIMITS.maxPatternInputChars },
                        };
                    }
                    const ok = patternTester ? patternTester(rules.pattern, s, field) : re.test(s);
                    if (!ok)
                        return { code: 'CUSTOM_FIELD_INVALID_FORMAT' };
                }
            }
            if (rules.allowed_chars) {
                const re = compileAllowedChars(rules.allowed_chars);
                if (re && !re.test(stripVariationSelectors(s))) {
                    return { code: 'CUSTOM_FIELD_INVALID_CHARS', params: { allowed: rules.allowed_chars } };
                }
            }
            return null;
        }
        case 'NUMBER': {
            let n;
            const text = typeof value === 'string' ? decimalPoint(value) : null;
            if (typeof value === 'number')
                n = value;
            else if (text !== null && NUMERIC_RE.test(text))
                n = Number(text);
            else
                return { code: 'CUSTOM_FIELD_INVALID_NUMBER' };
            if (!Number.isFinite(n))
                return { code: 'CUSTOM_FIELD_INVALID_NUMBER' };
            // W12: NUMBER bounds reuse min_length/max_length.
            if (rules.min_length !== undefined && n < rules.min_length) {
                return { code: 'CUSTOM_FIELD_NUMBER_TOO_SMALL', params: { min: rules.min_length } };
            }
            if (rules.max_length !== undefined && n > rules.max_length) {
                return { code: 'CUSTOM_FIELD_NUMBER_TOO_LARGE', params: { max: rules.max_length } };
            }
            return null;
        }
        case 'SELECT':
        case 'FONT': {
            const s = textOf(value);
            if (s === null)
                return { code: 'CUSTOM_FIELD_INVALID_OPTION' };
            const opts = optionList(field.options);
            if (opts.length > 0) {
                return opts.includes(s) ? null : { code: 'CUSTOM_FIELD_INVALID_OPTION' };
            }
            if (field.type === 'FONT' && charCount(s) > exports.PERSONALIZATION_LIMITS.maxFontChars) {
                return { code: 'CUSTOM_FIELD_INVALID_OPTION' };
            }
            return null;
        }
        case 'COLOR':
            return typeof value === 'string' && COLOR_RE.test(value)
                ? null
                : { code: 'CUSTOM_FIELD_INVALID_COLOR' };
        case 'DATE':
            return typeof value === 'string' && isRealDate(value)
                ? null
                : { code: 'CUSTOM_FIELD_INVALID_DATE' };
        case 'IMAGE':
        case 'FILE':
            return typeof value === 'string' && isFileRef(value)
                ? null
                : { code: 'CUSTOM_FIELD_INVALID_FILE' };
        case 'MULTI_IMAGE': {
            const list = typeof value === 'string' ? [value] : Array.isArray(value) ? value : null;
            if (list === null)
                return { code: 'CUSTOM_FIELD_INVALID_FILE' };
            if (list.length > exports.PERSONALIZATION_LIMITS.maxFiles) {
                return { code: 'CUSTOM_FIELD_TOO_MANY_FILES', params: { max: exports.PERSONALIZATION_LIMITS.maxFiles } };
            }
            return list.every((u) => typeof u === 'string' && isFileRef(u))
                ? null
                : { code: 'CUSTOM_FIELD_INVALID_FILE' };
        }
        default:
            // Unknown types (e.g. added by a later milestone) are not checked here.
            return null;
    }
}
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
function validatePersonalization(input) {
    const fields = [...(input.fields ?? [])].sort(bySortOrder);
    const raw = input.values;
    if (raw !== null && raw !== undefined && !isPlainObject(raw)) {
        return payloadIssue();
    }
    if (raw && !payloadWithinLimits(raw, 0))
        return payloadIssue();
    const isFileRef = input.isFileRef ?? isFileRefPath;
    const isVisible = input.isVisible ?? (() => true);
    const all = normalizeFieldValues(raw);
    // Known fields only; prefilled values replace whatever the customer sent.
    // A prefilled entry that normalizes to nothing (empty or blank) does not
    // count as prefilled: the field is then validated like any other (M5 A12).
    const prefilled = {};
    for (const [id, rawPre] of Object.entries(input.prefilled ?? {})) {
        const pre = normalizeValue(rawPre, false);
        if (pre !== undefined && !isBlank(pre))
            prefilled[id] = pre;
    }
    const known = {};
    for (const f of fields) {
        const v = Object.prototype.hasOwnProperty.call(prefilled, f.id) ? prefilled[f.id] : all[f.id];
        if (v !== undefined)
            known[f.id] = v;
    }
    const visible = fields.filter((f) => isVisible(f, known));
    const values = {};
    for (const f of visible) {
        if (known[f.id] !== undefined)
            values[f.id] = known[f.id];
    }
    const issues = [];
    const failed = new Set();
    for (const f of visible) {
        if (Object.prototype.hasOwnProperty.call(prefilled, f.id))
            continue;
        const v = values[f.id];
        if (isBlank(v)) {
            if (f.is_required) {
                issues.push({ code: 'CUSTOM_FIELD_REQUIRED', field_id: f.id, field_name: f.name });
                failed.add(f.id);
            }
            continue;
        }
        const problem = checkValue(f, v, isFileRef, input.patternTester);
        if (problem) {
            issues.push({ ...problem, field_id: f.id, field_name: f.name });
            failed.add(f.id);
        }
    }
    // Linked rules, checked on the field that carries them.
    for (const f of visible) {
        if (failed.has(f.id) || Object.prototype.hasOwnProperty.call(prefilled, f.id))
            continue;
        const link = readLinkedValidation(f.linked_validation);
        if (!link)
            continue;
        const target = resolveLinkTarget(link, fields, f);
        if (!target || !visible.includes(target))
            continue;
        const own = values[f.id] !== undefined ? textOf(values[f.id]) : null;
        const other = values[target.id] !== undefined ? textOf(values[target.id]) : null;
        if (link.type === 'equal_length') {
            if (own === null || other === null)
                continue;
            const otherLen = charCount(other);
            if (charCount(own) !== otherLen) {
                issues.push({
                    code: 'CUSTOM_FIELD_LENGTH_MISMATCH',
                    field_id: f.id,
                    field_name: f.name,
                    params: { length: otherLen, target: target.name },
                });
            }
        }
        else {
            const total = (own === null ? 0 : charCount(own)) + (other === null ? 0 : charCount(other));
            if (total > link.max) {
                issues.push({
                    code: 'CUSTOM_FIELD_COMBINED_TOO_LONG',
                    field_id: f.id,
                    field_name: f.name,
                    params: { max: link.max, target: target.name },
                });
            }
        }
    }
    if (issues.length > 1) {
        const order = new Map(fields.map((f, i) => [f.id, i]));
        issues.sort((a, b) => (order.get(a.field_id) ?? 0) - (order.get(b.field_id) ?? 0));
    }
    return { ok: issues.length === 0, issues, values };
}
function payloadIssue() {
    return {
        ok: false,
        issues: [{ code: 'CUSTOM_FIELD_INVALID_PAYLOAD', field_id: '', field_name: '' }],
        values: {},
    };
}
