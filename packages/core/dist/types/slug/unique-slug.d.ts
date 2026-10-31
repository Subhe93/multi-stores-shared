/** Slugs WP always suffixes for posts/pages: $wp_rewrite->feeds plus `embed`. */
export declare const WP_RESERVED_SLUGS: readonly string[];
/** WP hierarchical-post rule: `^(page)?\d+$` clashes with pagination (`2024`, `page2`). */
export declare function isNumericPageSlug(slug: string): boolean;
export interface UniqueSlugOptions {
    /**
     * Slugs that are always suffixed even when free. Defaults to
     * WP_RESERVED_SLUGS; pass `[...WP_RESERVED_SLUGS, ...ownList]` to extend it,
     * or `[]` for none (WP terms have no reserved list).
     */
    reserved?: readonly string[];
    /** Apply the WP page rule: `^(page)?\d+$` always gets a suffix. Default false. */
    numericNeedsSuffix?: boolean;
    /** Encoded-byte budget (default 200), as in sanitizeTitle(). */
    maxBytes?: number;
    /**
     * Candidates tried, in order, when `base` is not usable, before numbering
     * (WP hierarchical terms: `<slug>-<parent>`, `<slug>-<parent>-<grandparent>`).
     * When all are taken, the `-N` suffix goes on the LAST candidate, as WP does
     * (`red-shirts-2`).
     */
    alt?: readonly string[];
    /** Safety cap on numbered attempts (default 100000). */
    maxAttempts?: number;
}
/** Appends `-n` to `slug`, truncating it first so the result fits `maxBytes` (WP _truncate_post_slug). */
export declare function suffixSlug(slug: string, n: number, maxBytes?: number): string;
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
export declare function uniqueSlug(base: string, isTaken: (candidate: string) => boolean | Promise<boolean>, opts?: UniqueSlugOptions): Promise<string>;
