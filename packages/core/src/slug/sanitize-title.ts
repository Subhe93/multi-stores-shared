/*
 * WordPress sanitize_title() in 'save' context (WP 7.1.4): remove_accents()
 * followed by sanitize_title_with_dashes($title, '', 'save'), ported to work
 * on Unicode code points and to return the slug DECODED (Unicode, NFC) instead
 * of WP's percent-encoded post_name. The two forms are a bijection for every
 * slug made of valid UTF-8. Spec: plans/slug-wp-rules/WP-SLUG-SPEC.md §3, §4, §7.
 *
 * Intentional differences from WP (spec §7 a-c):
 *  - literal `%xx` sequences in the input that form valid UTF-8 are decoded
 *    (`Hello%20World` -> `hello-world`, WP keeps `hello%20world`); sequences
 *    that do not form valid UTF-8 lose their `%` (`50%AB` -> `50ab`);
 *  - the final value is NFC-normalized (WP only normalizes inside remove_accents);
 *  - lowercasing uses JS toLowerCase(), except that capital sigma always maps
 *    to `σ` (as PHP 8.2 mb_strtolower does), never to the final form `ς`.
 */
import { removeAccents } from './remove-accents.js';

/** WP's post_name limit: 200 bytes of the percent-encoded slug. */
export const SLUG_MAX_BYTES = 200;

export interface SanitizeTitleOptions {
  /**
   * Content locale of the store (plays the role of WP's get_locale()).
   * Only `de*`, `da`/`da_DK`, `ca`, `sr`/`sr_RS`, `bs`/`bs_BA` change the
   * output; see resolveWpAccentLocale().
   */
  locale?: string | null;
  /** Encoded-byte budget (default 200). Use Infinity to disable truncation. */
  maxBytes?: number;
}

// ---------------------------------------------------------------- helpers

/** Replaces lone surrogates by U+FFFD (String.prototype.toWellFormed fallback). */
export function toWellFormed(s: string): string {
  let out = '';
  let last = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff) {
      const n = i + 1 < s.length ? s.charCodeAt(i + 1) : 0;
      if (n >= 0xdc00 && n <= 0xdfff) {
        i++;
        continue;
      }
      out += s.slice(last, i) + REPLACEMENT_CHAR;
      last = i + 1;
    } else if (c >= 0xdc00 && c <= 0xdfff) {
      out += s.slice(last, i) + REPLACEMENT_CHAR;
      last = i + 1;
    }
  }
  return last === 0 ? s : out + s.slice(last);
}

const utf8Length = (cp: number): number => (cp < 0x80 ? 1 : cp < 0x800 ? 2 : cp < 0x10000 ? 3 : 4);

/** Cost of one code point in WP's utf8_uri_encode() budget: ASCII 1, else 3 per UTF-8 byte. */
const encodedCost = (cp: number): number => (cp < 0x80 ? 1 : 3 * utf8Length(cp));

/** Length of the slug once percent-encoded the way WP stores it (ASCII 1, other 3 x UTF-8 bytes). */
export function encodedLength(slug: string): number {
  let n = 0;
  for (const ch of slug) n += encodedCost(ch.codePointAt(0)!);
  return n;
}

/**
 * Keeps the longest prefix whose encoded length is <= maxBytes, never
 * splitting a code point (WP utf8_uri_encode($s, $length): stop at the first
 * character that does not fit).
 */
export function truncateToEncoded(slug: string, maxBytes: number): string {
  if (!(maxBytes < Infinity)) return slug;
  let n = 0;
  let end = 0;
  for (const ch of slug) {
    n += encodedCost(ch.codePointAt(0)!);
    if (n > maxBytes) return slug.slice(0, end);
    end += ch.length;
  }
  return slug;
}

/**
 * Lowercasing used for slugs: JS toLowerCase() (full Unicode mapping, not
 * locale-specific, so `I` -> `i` even for Turkish) with capital sigma always
 * mapped to `σ` like PHP 8.2 mb_strtolower (JS would produce `ς` at word end).
 */
export function slugLowercase(s: string): string {
  return s.replace(CAPITAL_SIGMA, SMALL_SIGMA).toLowerCase();
}

const isHex = (c: number): boolean =>
  (c >= 0x30 && c <= 0x39) || (c >= 0x41 && c <= 0x46) || (c >= 0x61 && c <= 0x66);

/**
 * Decodes `%xx` octets that form valid UTF-8 (any case). For an octet that is
 * not part of a valid UTF-8 sequence, `invalid` decides: 'keep' leaves the
 * `%xx` text untouched, 'drop-percent' removes the `%` and keeps the two hex
 * digits. Other text, including stray `%`, is returned unchanged.
 */
export function decodePercentOctets(s: string, invalid: 'keep' | 'drop-percent'): string {
  if (s.indexOf('%') < 0) return s;
  let out = '';
  let i = 0;
  const n = s.length;
  const octetAt = (p: number): number =>
    p + 2 < n && s.charCodeAt(p) === 0x25 && isHex(s.charCodeAt(p + 1)) && isHex(s.charCodeAt(p + 2))
      ? parseInt(s.slice(p + 1, p + 3), 16)
      : -1;
  while (i < n) {
    const b0 = octetAt(i);
    if (b0 < 0) {
      out += s[i];
      i++;
      continue;
    }
    // Determine the sequence length and the valid range of the second byte
    // (rejects overlongs, surrogates and code points above U+10FFFF).
    let len = 0;
    let lo = 0x80;
    let hi = 0xbf;
    if (b0 < 0x80) len = 1;
    else if (b0 >= 0xc2 && b0 <= 0xdf) len = 2;
    else if (b0 >= 0xe0 && b0 <= 0xef) {
      len = 3;
      if (b0 === 0xe0) lo = 0xa0;
      if (b0 === 0xed) hi = 0x9f;
    } else if (b0 >= 0xf0 && b0 <= 0xf4) {
      len = 4;
      if (b0 === 0xf0) lo = 0x90;
      if (b0 === 0xf4) hi = 0x8f;
    }
    let cp = -1;
    if (len === 1) cp = b0;
    else if (len > 1) {
      cp = b0 & (len === 2 ? 0x1f : len === 3 ? 0x0f : 0x07);
      for (let k = 1; k < len; k++) {
        const b = octetAt(i + 3 * k);
        const min = k === 1 ? lo : 0x80;
        const max = k === 1 ? hi : 0xbf;
        if (b < min || b > max) {
          cp = -1;
          break;
        }
        cp = (cp << 6) | (b & 0x3f);
      }
    }
    if (cp >= 0) {
      out += String.fromCodePoint(cp);
      i += 3 * len;
    } else {
      out += invalid === 'keep' ? s.slice(i, i + 3) : s.slice(i + 1, i + 3);
      i += 3;
    }
  }
  return out;
}

const isCSpace = (c: string | undefined): boolean =>
  c === ' ' || c === '\t' || c === '\n' || c === '\v' || c === '\f' || c === '\r';

/**
 * PHP strip_tags() without allowed tags (php_strip_tags_ex state machine).
 * Every character it inspects is ASCII, so running it on UTF-16 code units is
 * equivalent to PHP running it on UTF-8 bytes. `<` followed by a non-space
 * starts a tag that runs to `>` or to the end of the string; quotes inside a
 * tag hide `>`; `<!-- ... -->`, `<!...>` and `<? ... ?>` are removed.
 */
export function stripTags(s: string): string {
  if (s.indexOf('<') < 0 && s.indexOf('>') < 0 && s.indexOf('\0') < 0) return s;
  let out = '';
  let state = 0;
  let depth = 0;
  let inQ = '';
  let lc = '';
  let br = 0;
  let isXml = false;
  const n = s.length;
  for (let p = 0; p < n; p++) {
    const c = s[p];
    const prev = (k: number): string => (p - k >= 0 ? s[p - k] : '');
    switch (state) {
      case 0:
        if (c === '\0') break;
        if (c === '<') {
          if (inQ) break;
          if (isCSpace(s[p + 1])) {
            out += c;
            break;
          }
          lc = '<';
          state = 1;
          break;
        }
        if (c === '>') {
          if (depth) {
            depth--;
            break;
          }
          if (inQ) break;
          out += c;
          break;
        }
        out += c;
        break;
      case 1:
        if (c === '<') {
          if (inQ) break;
          if (isCSpace(s[p + 1])) break;
          depth++;
        } else if (c === '>') {
          if (depth) {
            depth--;
            break;
          }
          if (inQ) break;
          lc = '>';
          if (isXml && prev(1) === '-') break;
          inQ = '';
          state = 0;
          isXml = false;
        } else if (c === '"' || c === "'") {
          if (p !== 0 && (!inQ || c === inQ)) inQ = inQ ? '' : c;
        } else if (c === '!') {
          if (prev(1) === '<') {
            state = 3;
            lc = c;
          }
        } else if (c === '?') {
          if (prev(1) === '<') {
            br = 0;
            state = 2;
          }
        }
        break;
      case 2:
        if (c === '(') {
          if (lc !== '"' && lc !== "'") {
            lc = '(';
            br++;
          }
        } else if (c === ')') {
          if (lc !== '"' && lc !== "'") {
            lc = ')';
            br--;
          }
        } else if (c === '>') {
          if (depth) {
            depth--;
            break;
          }
          if (inQ) break;
          if (!br && lc !== '"' && prev(1) === '?') {
            inQ = '';
            state = 0;
          }
        } else if (c === '"' || c === "'") {
          if (p >= 1 && prev(1) !== '\\') {
            if (lc === c) lc = '';
            else if (lc !== '\\') lc = c;
          }
          if (p !== 0 && (!inQ || c === inQ)) inQ = inQ ? '' : c;
        } else if (c === 'l' || c === 'L') {
          if (
            p > 4 &&
            (prev(1) === 'm' || prev(1) === 'M') &&
            (prev(2) === 'x' || prev(2) === 'X') &&
            prev(3) === '?' &&
            prev(4) === '<'
          ) {
            state = 1;
            isXml = true;
          }
        }
        break;
      case 3:
        if (c === '>') {
          if (depth) {
            depth--;
            break;
          }
          if (inQ) break;
          inQ = '';
          state = 0;
        } else if (c === '"' || c === "'") {
          if (p !== 0 && prev(1) !== '\\' && (!inQ || c === inQ)) inQ = inQ ? '' : c;
        } else if (c === '-') {
          if (prev(1) === '-' && prev(2) === '!') state = 4;
        } else if (c === 'E' || c === 'e') {
          // <!DOCTYPE ...> is handled like a normal tag.
          if (p > 6 && s.slice(p - 6, p).toLowerCase() === 'doctyp') state = 1;
        }
        break;
      case 4:
        if (c === '>' && prev(1) === '-' && prev(2) === '-') {
          inQ = '';
          state = 0;
        }
        break;
    }
  }
  return out;
}

// Save-context replacements of sanitize_title_with_dashes(), in WP order,
// expressed on decoded characters instead of %xx text.
// Code points are listed numerically so the source stays ASCII.
const charClass = (cps: readonly number[]): RegExp =>
  new RegExp('[' + cps.map((c) => String.fromCharCode(c)).join('') + ']', 'g');
const range = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, k) => from + k);
// -> '-': NBSP, non-breaking hyphen, en dash, em dash.
const SAVE_DASH_CHARS = charClass([0xa0, 0x2011, 0x2013, 0x2014]);
const SAVE_DASH_ENTITIES = ['&nbsp;', '&#8209;', '&#160;', '&ndash;', '&#8211;', '&mdash;', '&#8212;'];
// Deleted: soft hyphen, inverted ! and ?, guillemets, curly quotes, bullet,
// (c) (r) degree, ellipsis, TM, acute accents, combining marks U+0301 U+0341
// U+0300 U+0304 U+030C, ZWSP ZWNJ ZWJ LRM RLM, LRE..RLO, BOM, U+FFFC.
const SAVE_DELETE_CHARS = charClass([
  0xad, 0xa1, 0xbf, 0xab, 0xbb, 0x2039, 0x203a, 0x2018, 0x2019, 0x201c, 0x201d, 0x201a, 0x201b, 0x201e, 0x201f,
  0x2022, 0xa9, 0xae, 0xb0, 0x2026, 0x2122, 0xb4, 0x2ca, 0x301, 0x341, 0x300, 0x304, 0x30c, 0x200b, 0x200c,
  0x200d, 0x200e, 0x200f, 0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0xfeff, 0xfffc,
]);
// -> '-': U+2000..U+200A wide spaces, line and paragraph separators, narrow NBSP.
const SAVE_SPACE_CHARS = charClass([...range(0x2000, 0x200a), 0x2028, 0x2029, 0x202f]);
const TIMES = charClass([0xd7]);
const CAPITAL_SIGMA = charClass([0x3a3]);
const SMALL_SIGMA = String.fromCharCode(0x3c3);
const REPLACEMENT_CHAR = String.fromCharCode(0xfffd);

/**
 * WP sanitize_title($title) in 'save' context, returning the decoded (NFC)
 * slug. Returns '' when nothing is left (WP would return the fallback, e.g.
 * the post ID; callers decide).
 */
export function sanitizeTitle(input: string, opts: SanitizeTitleOptions = {}): string {
  const maxBytes = opts.maxBytes ?? SLUG_MAX_BYTES;
  let s = toWellFormed(String(input ?? ''));
  // 1. remove_accents (save context only).
  s = removeAccents(s, opts.locale);
  // 2. strip_tags.
  s = stripTags(s);
  // 3-4. Octet handling (intentional difference: valid UTF-8 octets are
  //      decoded instead of kept as %xx text), then every other '%' goes.
  s = decodePercentOctets(s, 'drop-percent');
  s = s.replace(/%/g, '');
  // 5. mb_strtolower + utf8_uri_encode($title, 200): the budget is applied
  //    here, before any punctuation is removed, exactly where WP cuts.
  s = slugLowercase(s);
  s = truncateToEncoded(s, maxBytes);
  // 7. Save-context replacements.
  s = s.replace(SAVE_DASH_CHARS, '-');
  for (const e of SAVE_DASH_ENTITIES) s = s.split(e).join('-');
  s = s.replace(/\//g, '-');
  s = s.replace(SAVE_DELETE_CHARS, '');
  s = s.replace(SAVE_SPACE_CHARS, '-');
  s = s.replace(TIMES, 'x');
  // 8. Entities (PCRE '.' excludes only "\n").
  s = s.replace(/&[^\n]+?;/g, '');
  // 9. Dots become dashes.
  s = s.replace(/\./g, '-');
  // 10. Delete every ASCII character outside [a-z0-9 _-]; keep all non-ASCII.
  s = s.replace(/[^a-z0-9 _-]/g, (ch) => (ch.charCodeAt(0) < 0x80 ? '' : ch));
  // 11-13. Spaces -> dash, collapse dashes, trim dashes.
  s = s.replace(/ +/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return s.normalize('NFC');
}

/**
 * Sanitizer for DNS-like ASCII identifiers (store slug, market key):
 * sanitizeTitle() (accent folding with the locale), then everything outside
 * [a-z0-9-] is dropped (including `_` and non-Latin letters), dashes are
 * collapsed and trimmed. `maxBytes` (default 200) is applied to the final
 * ASCII result, so non-Latin text does not eat the budget.
 */
export function sanitizeAsciiHandle(input: string, opts: SanitizeTitleOptions = {}): string {
  const maxBytes = opts.maxBytes ?? SLUG_MAX_BYTES;
  let s = sanitizeTitle(input, { locale: opts.locale, maxBytes: Infinity });
  s = s.replace(/[^a-z0-9-]+/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  if (s.length > maxBytes) s = s.slice(0, maxBytes).replace(/-+$/, '');
  return s;
}

/**
 * WP 'query'-context equivalent for our decoded storage: turns an incoming
 * URL segment (raw or already decoded) into the form slugs are stored in.
 * Percent-decodes octets that form valid UTF-8 (malformed sequences are left
 * as they are), then NFC and lowercase. No accent folding, no punctuation
 * changes: `/svärfar` does not match `svarfar`, exactly as in WP.
 */
export function normalizeSlugForLookup(raw: string): string {
  let s = toWellFormed(String(raw ?? ''));
  s = decodePercentOctets(s, 'keep');
  return slugLowercase(s).normalize('NFC');
}

/**
 * Encodes a slug (or a `/`-separated slug path) for use in a URL path:
 * encodeURIComponent per segment, with lowercase hex like WP permalinks,
 * so `مرحبا` -> `%d9%85%d8%b1%d8%ad%d8%a8%d8%a7`.
 */
export function encodeSlugForUrl(slug: string): string {
  return toWellFormed(String(slug ?? ''))
    .split('/')
    .map((seg) => encodeURIComponent(seg).replace(/%[0-9A-F]{2}/g, (m) => m.toLowerCase()))
    .join('/');
}
