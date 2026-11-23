/*
 * Store link references (M165).
 *
 * A link field (section url, repeater row, rich-text href, custom menu url) can
 * hold a stable reference to a store resource instead of a typed URL:
 *
 *   product:<uuid>[?query][#hash]
 *
 * The storefront resolves it server side to the canonical product URL of the
 * rendered locale and market. `collection:` and `page:` share the grammar and
 * are reserved for later; only `product` is parsed into a reference today.
 * This is the only place the grammar exists (api, web and dashboard import it).
 */

/** Kinds that use the `<kind>:<uuid>` grammar (recognised or reserved). */
export const STORE_LINK_REF_KINDS = ['product', 'collection', 'page'] as const;
export type StoreLinkRefKind = (typeof STORE_LINK_REF_KINDS)[number];

/** Kinds that are resolved today. */
export type ResolvedStoreLinkRefKind = 'product';

export interface StoreLinkRef {
  kind: ResolvedStoreLinkRefKind;
  /** Lowercase uuid. */
  id: string;
  /** `?query` and/or `#hash` kept from the value, or ''. */
  tail: string;
}

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/** Strict product reference grammar (case-insensitive). Group 1 = id, group 2 = tail. */
export const PRODUCT_REF_RE = new RegExp(`^product:(${UUID})([?#].*)?$`, 'i');

/** Any `<kind>:<uuid>` reference, recognised or reserved. */
const ANY_REF_RE = new RegExp(`^(product|collection|page):(${UUID})([?#].*)?$`, 'i');

/** Cheap prefix test for "this string may contain a product reference". */
export const PRODUCT_REF_MARKER = 'product:';

/**
 * Parses a link value. Returns the reference for `product:<uuid>` (leading and
 * trailing whitespace ignored), or null for anything else, including reserved
 * kinds that are not resolved yet.
 */
export function parseStoreLinkRef(value: unknown): StoreLinkRef | null {
  if (typeof value !== 'string') return null;
  const m = PRODUCT_REF_RE.exec(value.trim());
  if (!m) return null;
  return { kind: 'product', id: m[1].toLowerCase(), tail: m[2] ?? '' };
}

/**
 * True for any `<kind>:<uuid>` value with a known or reserved kind, so a
 * future kind is never mistaken for an external URL.
 */
export function isStoreLinkRef(value: unknown): boolean {
  return typeof value === 'string' && ANY_REF_RE.test(value.trim());
}

/** Canonical `product:<id>` string (lowercase id) with an optional tail. */
export function formatProductRef(id: string, tail = ''): string {
  const t = tail && /^[?#]/.test(tail) ? tail : '';
  return `${PRODUCT_REF_MARKER}${String(id).trim().toLowerCase()}${t}`;
}
