/**
 * Grouped personalization display (M4.1 §3.5, contracts C1/C18/C24).
 * Part of `@multi-stores/core/personalization` (see types.ts); it imports
 * nothing, so it can be consumed alone. Pure code only.
 *
 * Input rows are evaluator lines, cart display entries or order snapshot
 * rows already resolved to text (`snapshotLabel` gives `label`/`value`,
 * `snapshotGroupLabel` gives `group_label`).
 */
export interface PDisplayRow {
    label: string;
    value: string | null;
    group_key?: string | null;
    group_index?: number | null;
    /** Resolved text, or a `{locale: text}` map (read with `locale`/`primary`). */
    group_label?: string | Record<string, unknown> | null;
    /** 'FIELD' (default) | 'OPTION' | 'DESIGN'. */
    source?: string | null;
    hex?: string | null;
    meta?: {
        hex?: unknown;
    } | null;
    sort_order?: number | null;
}
export interface PDisplayEntry {
    label: string;
    value: string | null;
    hex?: string;
    source: string;
}
export interface PDisplayGroup {
    key: string;
    index: number;
    label: string;
    entries: PDisplayEntry[];
}
export interface PDisplayGroups {
    groups: PDisplayGroup[];
    flat: {
        label: string;
        value: string | null;
        hex?: string;
    }[];
}
export interface BuildGroupsOptions {
    locale?: string | null;
    primary?: string | null;
    /** Label when a row has no group label (e.g. the i18n `personalization.itemN`). */
    defaultGroupLabel?: (index: number, key: string) => string;
}
/** `map[locale]` → `[primary]` → `.en` → first non-empty; null when none. */
export declare function pickLocaleLabel(map: unknown, locale?: string | null, primary?: string | null): string | null;
/**
 * Group label of a snapshot row (C18): `group_label` by locale → primary →
 * en → first; null when the row is not grouped or has no label.
 */
export declare function snapshotGroupLabel(row: {
    group_index?: number | null;
    group_label?: unknown;
}, locale?: string | null, primary?: string | null): string | null;
/** True when any row belongs to a repeater item (the trigger for grouped rendering). */
export declare function hasPersonalizationGroups(rows: readonly {
    group_index?: number | null;
}[] | null | undefined): boolean;
/**
 * Splits rows into repeater groups (sorted by index, then key in first-seen
 * order) and flat rows. Rows keep their order (`sort_order`, then input
 * position). `source='OPTION'` rows outside a group are skipped: the variant
 * line already shows the option.
 */
export declare function buildPersonalizationGroups(rows: readonly PDisplayRow[] | null | undefined, opts?: BuildGroupsOptions): PDisplayGroups;
/** One-line text of a group ("KARIN, Röd"): entry values joined by `sep`. */
export declare function groupValueText(group: PDisplayGroup, sep?: string): string;
