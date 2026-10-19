"use strict";
/**
 * Grouped personalization display (M4.1 §3.5, contracts C1/C18/C24).
 * Part of `@multi-stores/core/personalization` (see types.ts); it imports
 * nothing, so it can be consumed alone. Pure code only.
 *
 * Input rows are evaluator lines, cart display entries or order snapshot
 * rows already resolved to text (`snapshotLabel` gives `label`/`value`,
 * `snapshotGroupLabel` gives `group_label`).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickLocaleLabel = pickLocaleLabel;
exports.snapshotGroupLabel = snapshotGroupLabel;
exports.hasPersonalizationGroups = hasPersonalizationGroups;
exports.buildPersonalizationGroups = buildPersonalizationGroups;
exports.groupValueText = groupValueText;
function isRecord(v) {
    return v !== null && typeof v === 'object' && !Array.isArray(v);
}
/** `map[locale]` → `[primary]` → `.en` → first non-empty; null when none. */
function pickLocaleLabel(map, locale, primary) {
    if (typeof map === 'string')
        return map !== '' ? map : null;
    if (!isRecord(map))
        return null;
    const ok = (v) => typeof v === 'string' && v !== '';
    for (const key of [locale, primary, 'en'])
        if (key && ok(map[key]))
            return map[key];
    for (const v of Object.values(map))
        if (ok(v))
            return v;
    return null;
}
/**
 * Group label of a snapshot row (C18): `group_label` by locale → primary →
 * en → first; null when the row is not grouped or has no label.
 */
function snapshotGroupLabel(row, locale, primary) {
    if (typeof row.group_index !== 'number')
        return null;
    return pickLocaleLabel(row.group_label, locale, primary);
}
function hexOf(row) {
    if (typeof row.hex === 'string' && row.hex !== '')
        return row.hex;
    const h = row.meta?.hex;
    return typeof h === 'string' && h !== '' ? h : undefined;
}
/** True when any row belongs to a repeater item (the trigger for grouped rendering). */
function hasPersonalizationGroups(rows) {
    return Array.isArray(rows) && rows.some((r) => typeof r?.group_index === 'number');
}
/**
 * Splits rows into repeater groups (sorted by index, then key in first-seen
 * order) and flat rows. Rows keep their order (`sort_order`, then input
 * position). `source='OPTION'` rows outside a group are skipped: the variant
 * line already shows the option.
 */
function buildPersonalizationGroups(rows, opts = {}) {
    const list = (Array.isArray(rows) ? rows : [])
        .map((row, i) => ({ row, i }))
        .sort((a, b) => {
        const sa = a.row.sort_order ?? Number.POSITIVE_INFINITY;
        const sb = b.row.sort_order ?? Number.POSITIVE_INFINITY;
        if (sa !== sb)
            return sa < sb ? -1 : 1;
        return a.i - b.i;
    })
        .map((x) => x.row);
    const groups = [];
    const flat = [];
    const keyOrder = [];
    for (const row of list) {
        const source = row.source || 'FIELD';
        const hex = hexOf(row);
        if (typeof row.group_index !== 'number') {
            if (source === 'OPTION')
                continue;
            flat.push(hex ? { label: row.label, value: row.value, hex } : { label: row.label, value: row.value });
            continue;
        }
        const key = row.group_key ?? '';
        if (!keyOrder.includes(key))
            keyOrder.push(key);
        let group = groups.find((g) => g.key === key && g.index === row.group_index);
        if (!group) {
            const label = pickLocaleLabel(row.group_label, opts.locale, opts.primary) ??
                (opts.defaultGroupLabel ? opts.defaultGroupLabel(row.group_index, key) : String(row.group_index));
            group = { key, index: row.group_index, label, entries: [] };
            groups.push(group);
        }
        const entry = { label: row.label, value: row.value, source };
        if (hex)
            entry.hex = hex;
        group.entries.push(entry);
    }
    groups.sort((a, b) => keyOrder.indexOf(a.key) - keyOrder.indexOf(b.key) || a.index - b.index);
    return { groups, flat };
}
/** One-line text of a group ("KARIN, Röd"): entry values joined by `sep`. */
function groupValueText(group, sep = ', ') {
    return group.entries
        .map((e) => e.value)
        .filter((v) => typeof v === 'string' && v !== '')
        .join(sep);
}
