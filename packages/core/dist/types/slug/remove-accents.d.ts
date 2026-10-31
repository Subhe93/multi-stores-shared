/** WP 7.1.4 remove_accents base map: 311 entries, in source order. */
export declare const WP_REMOVE_ACCENTS_BASE: Readonly<Record<string, string>>;
/** The WP locale branches of remove_accents() that change its output. */
export type WpAccentLocale = 'de' | 'da_DK' | 'ca' | 'sr_RS' | 'default';
/**
 * Maps a locale (our short codes such as `de`, `sv`, `ar`, or WP/BCP-47 forms
 * such as `de_DE`, `de-CH`, `da-DK`) to the remove_accents() branch WP takes:
 *
 * - any locale starting with `de` (`de`, `de_DE`, `de-AT`, `de_DE_formal`, ...)
 *   -> German branch (WP: `str_starts_with($locale, 'de')`);
 * - `da`, `da_DK` -> Danish branch (WP: exact `da_DK`; our short `da` maps to it);
 * - `ca` -> Catalan branch (WP: exact `ca`);
 * - `sr`, `sr_RS`, `bs`, `bs_BA` -> Serbian/Bosnian branch (WP: exact `sr_RS`/`bs_BA`;
 *   our short codes map to them);
 * - everything else (sv, ar, en, fr, tr, nb, fa, ...) -> the default map.
 *
 * `-` and `_` are interchangeable and case is ignored.
 */
export declare function resolveWpAccentLocale(locale: string | null | undefined): WpAccentLocale;
/**
 * WP remove_accents($text, $locale) for valid Unicode text: NFC, then the base
 * map with the locale overrides applied on top. ASCII-only text is returned
 * unchanged (as in WP).
 */
export declare function removeAccents(text: string, locale?: string | null): string;
