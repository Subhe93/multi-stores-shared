/** WP's post_name limit: 200 bytes of the percent-encoded slug. */
export declare const SLUG_MAX_BYTES = 200;
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
/** Replaces lone surrogates by U+FFFD (String.prototype.toWellFormed fallback). */
export declare function toWellFormed(s: string): string;
/** Length of the slug once percent-encoded the way WP stores it (ASCII 1, other 3 x UTF-8 bytes). */
export declare function encodedLength(slug: string): number;
/**
 * Keeps the longest prefix whose encoded length is <= maxBytes, never
 * splitting a code point (WP utf8_uri_encode($s, $length): stop at the first
 * character that does not fit).
 */
export declare function truncateToEncoded(slug: string, maxBytes: number): string;
/**
 * Lowercasing used for slugs: JS toLowerCase() (full Unicode mapping, not
 * locale-specific, so `I` -> `i` even for Turkish) with capital sigma always
 * mapped to `σ` like PHP 8.2 mb_strtolower (JS would produce `ς` at word end).
 */
export declare function slugLowercase(s: string): string;
/**
 * Decodes `%xx` octets that form valid UTF-8 (any case). For an octet that is
 * not part of a valid UTF-8 sequence, `invalid` decides: 'keep' leaves the
 * `%xx` text untouched, 'drop-percent' removes the `%` and keeps the two hex
 * digits. Other text, including stray `%`, is returned unchanged.
 */
export declare function decodePercentOctets(s: string, invalid: 'keep' | 'drop-percent'): string;
/**
 * PHP strip_tags() without allowed tags (php_strip_tags_ex state machine).
 * Every character it inspects is ASCII, so running it on UTF-16 code units is
 * equivalent to PHP running it on UTF-8 bytes. `<` followed by a non-space
 * starts a tag that runs to `>` or to the end of the string; quotes inside a
 * tag hide `>`; `<!-- ... -->`, `<!...>` and `<? ... ?>` are removed.
 */
export declare function stripTags(s: string): string;
/**
 * WP sanitize_title($title) in 'save' context, returning the decoded (NFC)
 * slug. Returns '' when nothing is left (WP would return the fallback, e.g.
 * the post ID; callers decide).
 */
export declare function sanitizeTitle(input: string, opts?: SanitizeTitleOptions): string;
/**
 * Sanitizer for DNS-like ASCII identifiers (store slug, market key):
 * sanitizeTitle() (accent folding with the locale), then everything outside
 * [a-z0-9-] is dropped (including `_` and non-Latin letters), dashes are
 * collapsed and trimmed. `maxBytes` (default 200) is applied to the final
 * ASCII result, so non-Latin text does not eat the budget.
 */
export declare function sanitizeAsciiHandle(input: string, opts?: SanitizeTitleOptions): string;
/**
 * WP 'query'-context equivalent for our decoded storage: turns an incoming
 * URL segment (raw or already decoded) into the form slugs are stored in.
 * Percent-decodes octets that form valid UTF-8 (malformed sequences are left
 * as they are), then NFC and lowercase. No accent folding, no punctuation
 * changes: `/svärfar` does not match `svarfar`, exactly as in WP.
 */
export declare function normalizeSlugForLookup(raw: string): string;
/**
 * Encodes a slug (or a `/`-separated slug path) for use in a URL path:
 * encodeURIComponent per segment, with lowercase hex like WP permalinks,
 * so `مرحبا` -> `%d9%85%d8%b1%d8%ad%d8%a8%d8%a7`.
 */
export declare function encodeSlugForUrl(slug: string): string;
