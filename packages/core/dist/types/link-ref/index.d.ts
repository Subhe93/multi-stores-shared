/** Kinds that use the `<kind>:<uuid>` grammar (recognised or reserved). */
export declare const STORE_LINK_REF_KINDS: readonly ["product", "collection", "page"];
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
/** Strict product reference grammar (case-insensitive). Group 1 = id, group 2 = tail. */
export declare const PRODUCT_REF_RE: RegExp;
/** Cheap prefix test for "this string may contain a product reference". */
export declare const PRODUCT_REF_MARKER = "product:";
/**
 * Parses a link value. Returns the reference for `product:<uuid>` (leading and
 * trailing whitespace ignored), or null for anything else, including reserved
 * kinds that are not resolved yet.
 */
export declare function parseStoreLinkRef(value: unknown): StoreLinkRef | null;
/**
 * True for any `<kind>:<uuid>` value with a known or reserved kind, so a
 * future kind is never mistaken for an external URL.
 */
export declare function isStoreLinkRef(value: unknown): boolean;
/** Canonical `product:<id>` string (lowercase id) with an optional tail. */
export declare function formatProductRef(id: string, tail?: string): string;
