"use strict";
/**
 * Visibility conditions and option counts (M4.1 §3.3, D6).
 * Part of `@multi-stores/core/personalization` (see types.ts). Pure code only.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.readConditions = readConditions;
exports.findOptionConfig = findOptionConfig;
exports.leadingInt = leadingInt;
exports.optionCount = optionCount;
exports.isValueSet = isValueSet;
exports.evaluateRule = evaluateRule;
exports.evaluateConditions = evaluateConditions;
const rules_js_1 = require("./rules.js");
const types_js_1 = require("./types.js");
const OPS = new Set(types_js_1.P_CONDITION_OPS);
/** Reads `conditions` leniently; null = no conditions (always visible). */
function readConditions(raw) {
    if (!(0, rules_js_1.isPlainObject)(raw) || !Array.isArray(raw.rules))
        return null;
    const rules = [];
    for (const r of raw.rules) {
        if (!(0, rules_js_1.isPlainObject)(r))
            continue;
        if (r.source !== 'option' && r.source !== 'field')
            continue;
        if (typeof r.key !== 'string' || r.key === '')
            continue;
        if (typeof r.op !== 'string' || !OPS.has(r.op))
            continue;
        const rule = { source: r.source, key: r.key, op: r.op };
        const v = r.value;
        if (typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v)))
            rule.value = v;
        else if (Array.isArray(v))
            rule.value = v.filter((x) => typeof x === 'string' || typeof x === 'number').map(String);
        rules.push(rule);
    }
    if (rules.length === 0)
        return null;
    return { match: raw.match === 'any' ? 'any' : 'all', rules };
}
/** The `variant_option_config` entry for an option name (exact match). */
function findOptionConfig(ctx, option) {
    const list = Array.isArray(ctx.optionConfig) ? ctx.optionConfig : [];
    return list.find((o) => o && o.name === option) ?? null;
}
/** Leading integer of an option value ("2 Inskriptioner" → 2, "3-produkter" → 3); null when none. */
function leadingInt(v) {
    const m = /^\s*(\d{1,6})/.exec(v);
    return m ? Number(m[1]) : null;
}
function countOf(v) {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0)
        return null;
    return Math.floor(v);
}
/**
 * Numeric value of the chosen option value (D6): `map[v]` → `valueMeta[v].count`
 * → leading integer of `v` → 0. No selection → 0.
 */
function optionCount(ctx, count) {
    const v = ctx.variantOptions?.[count.option];
    if (typeof v !== 'string' || v === '')
        return 0;
    const fromMap = count.map && Object.prototype.hasOwnProperty.call(count.map, v) ? countOf(count.map[v]) : null;
    if (fromMap !== null)
        return fromMap;
    const valueMeta = findOptionConfig(ctx, count.option)?.valueMeta;
    // Own keys only: an option value such as "constructor" must not read the prototype.
    const meta = valueMeta && typeof valueMeta === 'object' && Object.prototype.hasOwnProperty.call(valueMeta, v)
        ? valueMeta[v]
        : undefined;
    const fromMeta = meta && typeof meta === 'object' ? countOf(meta.count) : null;
    if (fromMeta !== null)
        return fromMeta;
    return leadingInt(v) ?? 0;
}
/** True when a canonical value counts as "set" (non-empty). `false` is the explicit-none checkbox marker. */
function isValueSet(v) {
    if (v === undefined || v === null || v === false)
        return false;
    if (typeof v === 'string')
        return v.trim() !== '';
    if (Array.isArray(v))
        return v.length > 0;
    if ((0, rules_js_1.isPlainObject)(v))
        return Object.keys(v).length > 0;
    return true;
}
function ruleValues(rule) {
    const v = rule.value;
    if (Array.isArray(v))
        return v.map(String);
    if (v === undefined)
        return [];
    return [String(v)];
}
function toNumber(v) {
    if (typeof v === 'number')
        return v;
    if (typeof v !== 'string')
        return NaN;
    const s = v.trim();
    if (s === '')
        return NaN;
    // Decimal comma as typed in sv/de/fr/tr (same rule as the NUMBER check).
    const t = s.indexOf('.') < 0 && s.indexOf(',') === s.lastIndexOf(',') ? s.replace(',', '.') : s;
    return /^-?(?:\d+\.?\d*|\.\d+)$/.test(t) ? Number(t) : NaN;
}
function compare(op, left, right) {
    if (!Number.isFinite(left) || !Number.isFinite(right))
        return false;
    switch (op) {
        case 'gt':
            return left > right;
        case 'gte':
            return left >= right;
        case 'lt':
            return left < right;
        case 'lte':
            return left <= right;
        default:
            return false;
    }
}
/** Evaluates one rule (§3.3). A missing value makes every op false except `unset`. */
function evaluateRule(rule, ctx, fieldValue) {
    const raw = rule.source === 'option' ? ctx.variantOptions?.[rule.key] : fieldValue(rule.key);
    const present = isValueSet(raw);
    if (rule.op === 'unset')
        return !present;
    if (!present)
        return false;
    if (rule.op === 'set')
        return true;
    if (rule.op === 'gt' || rule.op === 'gte' || rule.op === 'lt' || rule.op === 'lte') {
        const left = rule.source === 'option' ? optionCount(ctx, { option: rule.key }) : toNumber(raw);
        return compare(rule.op, left, toNumber(rule.value));
    }
    // String ops. A list value (CHECKBOX_GROUP) matches when it contains a value.
    const have = Array.isArray(raw)
        ? raw.filter((x) => typeof x === 'string' || typeof x === 'number').map(String)
        : typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean'
            ? [String(raw)]
            : [];
    const want = ruleValues(rule);
    const hit = want.some((w) => have.includes(w));
    switch (rule.op) {
        case 'eq':
        case 'in':
            return hit;
        case 'neq':
        case 'nin':
            return !hit;
        default:
            return false;
    }
}
/** Visibility of a field: no conditions → visible; `all` / `any` over its rules. */
function evaluateConditions(conditions, ctx, fieldValue) {
    const c = readConditions(conditions);
    if (!c)
        return true;
    return c.match === 'any'
        ? c.rules.some((r) => evaluateRule(r, ctx, fieldValue))
        : c.rules.every((r) => evaluateRule(r, ctx, fieldValue));
}
