"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WP_RESERVED_SLUGS = void 0;
exports.isNumericPageSlug = isNumericPageSlug;
exports.suffixSlug = suffixSlug;
exports.uniqueSlug = uniqueSlug;
/*
 * WordPress slug uniqueness (wp_unique_post_slug / wp_unique_term_slug,
 * WP 7.1.4), storage-agnostic. Spec: plans/slug-wp-rules/WP-SLUG-SPEC.md §5, §10.
 */
const sanitize_title_js_1 = require("./sanitize-title.js");
/** Slugs WP always suffixes for posts/pages: $wp_rewrite->feeds plus `embed`. */
exports.WP_RESERVED_SLUGS = Object.freeze(['feed', 'rdf', 'rss', 'rss2', 'atom', 'embed']);
/** WP hierarchical-post rule: `^(page)?\d+$` clashes with pagination (`2024`, `page2`). */
function isNumericPageSlug(slug) {
    return /^(page)?[0-9]+$/.test(slug);
}
/** Appends `-n` to `slug`, truncating it first so the result fits `maxBytes` (WP _truncate_post_slug). */
function suffixSlug(slug, n, maxBytes = sanitize_title_js_1.SLUG_MAX_BYTES) {
    const suffix = `-${n}`;
    let head = slug;
    if ((0, sanitize_title_js_1.encodedLength)(head) + suffix.length > maxBytes) {
        head = (0, sanitize_title_js_1.truncateToEncoded)(head, maxBytes - suffix.length);
    }
    return head.replace(/-+$/, '') + suffix;
}
/**
 * Returns `base` when it is free, otherwise the first free candidate among
 * `alt`, then `<last>-2`, `<last>-3`, ... (the first duplicate gets `-2`,
 * never `-1`). A slug is unusable when `isTaken` says so, when it is in
 * `reserved`, or (with `numericNeedsSuffix`) when it matches `^(page)?\d+$`.
 * Numbered candidates are only checked with `isTaken`, as in WP.
 *
 * `base` and `alt` are expected to be sanitized already (sanitizeTitle);
 * an empty base throws, because WP then falls back to the object ID, which
 * only the caller knows.
 */
async function uniqueSlug(base, isTaken, opts = {}) {
    if (!base)
        throw new Error('uniqueSlug: empty base slug (use the object id as the fallback)');
    const maxBytes = opts.maxBytes ?? sanitize_title_js_1.SLUG_MAX_BYTES;
    const reserved = new Set(opts.reserved ?? exports.WP_RESERVED_SLUGS);
    const fit = (s) => (0, sanitize_title_js_1.encodedLength)(s) > maxBytes ? (0, sanitize_title_js_1.truncateToEncoded)(s, maxBytes).replace(/-+$/, '') : s;
    const unusable = async (s) => reserved.has(s) || (!!opts.numericNeedsSuffix && isNumericPageSlug(s)) || (await isTaken(s));
    let last = fit(base);
    if (!(await unusable(last)))
        return last;
    for (const a of opts.alt ?? []) {
        const c = fit(a);
        if (!c)
            continue;
        last = c;
        if (!(await unusable(c)))
            return c;
    }
    const cap = opts.maxAttempts ?? 100000;
    for (let n = 2; n < cap + 2; n++) {
        const c = suffixSlug(last, n, maxBytes);
        if (!(await isTaken(c)))
            return c;
    }
    throw new Error(`uniqueSlug: no free slug for "${base}" after ${cap} attempts`);
}
