/**
 * Visibility conditions and option counts (M4.1 §3.3, D6).
 * Part of `@multi-stores/core/personalization` (see types.ts). Pure code only.
 */
import { type PConditionRule, type PConditions, type PContext, type POptionConfig } from './types.js';
/** Value of an earlier field as conditions see it (canonical; `undefined` = missing/hidden). */
export type PFieldValueLookup = (name: string) => unknown;
/** Reads `conditions` leniently; null = no conditions (always visible). */
export declare function readConditions(raw: unknown): PConditions | null;
/** The `variant_option_config` entry for an option name (exact match). */
export declare function findOptionConfig(ctx: Pick<PContext, 'optionConfig'>, option: string): POptionConfig | null;
/** Leading integer of an option value ("2 Inskriptioner" → 2, "3-produkter" → 3); null when none. */
export declare function leadingInt(v: string): number | null;
/**
 * Numeric value of the chosen option value (D6): `map[v]` → `valueMeta[v].count`
 * → leading integer of `v` → 0. No selection → 0.
 */
export declare function optionCount(ctx: Pick<PContext, 'variantOptions' | 'optionConfig'>, count: {
    option: string;
    map?: Record<string, number> | null;
}): number;
/** True when a canonical value counts as "set" (non-empty). `false` is the explicit-none checkbox marker. */
export declare function isValueSet(v: unknown): boolean;
/** Evaluates one rule (§3.3). A missing value makes every op false except `unset`. */
export declare function evaluateRule(rule: PConditionRule, ctx: Pick<PContext, 'variantOptions' | 'optionConfig'>, fieldValue: PFieldValueLookup): boolean;
/** Visibility of a field: no conditions → visible; `all` / `any` over its rules. */
export declare function evaluateConditions(conditions: unknown, ctx: Pick<PContext, 'variantOptions' | 'optionConfig'>, fieldValue: PFieldValueLookup): boolean;
