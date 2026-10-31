/*
 * WordPress slug uniqueness (wp_unique_post_slug / wp_unique_term_slug,
 * WP 7.1.4), storage-agnostic. Spec: plans/slug-wp-rules/WP-SLUG-SPEC.md §5, §10.
 */
import { SLUG_MAX_BYTES, encodedLength, truncateToEncoded } from './sanitize-title.js';

/** Slugs WP always suffixes for posts/pages: $wp_rewrite->feeds plus `embed`. */
export const WP_RESERVED_SLUGS: readonly string[] = Object.freeze(['feed', 'rdf', 'rss', 'rss2', 'atom', 'embed']);

/** WP hierarchical-post rule: `^(page)?\d+$` clashes with pagination (`2024`, `page2`). */
export function isNumericPageSlug(slug: string): boolean {
  return /^(page)?[0-9]+$/.test(slug);
}

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
export function suffixSlug(slug: string, n: number, maxBytes: number = SLUG_MAX_BYTES): string {
  const suffix = `-${n}`;
  let head = slug;
  if (encodedLength(head) + suffix.length > maxBytes) {
    head = truncateToEncoded(head, maxBytes - suffix.length);
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
export async function uniqueSlug(
  base: string,
  isTaken: (candidate: string) => boolean | Promise<boolean>,
  opts: UniqueSlugOptions = {},
): Promise<string> {
  if (!base) throw new Error('uniqueSlug: empty base slug (use the object id as the fallback)');
  const maxBytes = opts.maxBytes ?? SLUG_MAX_BYTES;
  const reserved = new Set(opts.reserved ?? WP_RESERVED_SLUGS);
  const fit = (s: string): string =>
    encodedLength(s) > maxBytes ? truncateToEncoded(s, maxBytes).replace(/-+$/, '') : s;
  const unusable = async (s: string): Promise<boolean> =>
    reserved.has(s) || (!!opts.numericNeedsSuffix && isNumericPageSlug(s)) || (await isTaken(s));

  let last = fit(base);
  if (!(await unusable(last))) return last;
  for (const a of opts.alt ?? []) {
    const c = fit(a);
    if (!c) continue;
    last = c;
    if (!(await unusable(c))) return c;
  }
  const cap = opts.maxAttempts ?? 100000;
  for (let n = 2; n < cap + 2; n++) {
    const c = suffixSlug(last, n, maxBytes);
    if (!(await isTaken(c))) return c;
  }
  throw new Error(`uniqueSlug: no free slug for "${base}" after ${cap} attempts`);
}
