/*
 * WordPress remove_accents() (WP 7.1.4, wp-includes/formatting.php), ported to
 * operate on Unicode code points. See plans/slug-wp-rules/WP-SLUG-SPEC.md §2/§12.
 *
 * Every key of the base map is a single NFC code point, so a per-code-point
 * lookup after NFC is exactly equivalent to WP's strtr() over UTF-8 bytes.
 */

/** WP 7.1.4 remove_accents base map: 311 entries, in source order. */
export const WP_REMOVE_ACCENTS_BASE: Readonly<Record<string, string>> = {
  'ª': 'a', // U+00AA
  'º': 'o', // U+00BA
  'À': 'A', // U+00C0
  'Á': 'A', // U+00C1
  'Â': 'A', // U+00C2
  'Ã': 'A', // U+00C3
  'Ä': 'A', // U+00C4
  'Å': 'A', // U+00C5
  'Æ': 'AE', // U+00C6
  'Ç': 'C', // U+00C7
  'È': 'E', // U+00C8
  'É': 'E', // U+00C9
  'Ê': 'E', // U+00CA
  'Ë': 'E', // U+00CB
  'Ì': 'I', // U+00CC
  'Í': 'I', // U+00CD
  'Î': 'I', // U+00CE
  'Ï': 'I', // U+00CF
  'Ð': 'D', // U+00D0
  'Ñ': 'N', // U+00D1
  'Ò': 'O', // U+00D2
  'Ó': 'O', // U+00D3
  'Ô': 'O', // U+00D4
  'Õ': 'O', // U+00D5
  'Ö': 'O', // U+00D6
  'Ù': 'U', // U+00D9
  'Ú': 'U', // U+00DA
  'Û': 'U', // U+00DB
  'Ü': 'U', // U+00DC
  'Ý': 'Y', // U+00DD
  'Þ': 'TH', // U+00DE
  'ß': 's', // U+00DF
  'à': 'a', // U+00E0
  'á': 'a', // U+00E1
  'â': 'a', // U+00E2
  'ã': 'a', // U+00E3
  'ä': 'a', // U+00E4
  'å': 'a', // U+00E5
  'æ': 'ae', // U+00E6
  'ç': 'c', // U+00E7
  'è': 'e', // U+00E8
  'é': 'e', // U+00E9
  'ê': 'e', // U+00EA
  'ë': 'e', // U+00EB
  'ì': 'i', // U+00EC
  'í': 'i', // U+00ED
  'î': 'i', // U+00EE
  'ï': 'i', // U+00EF
  'ð': 'd', // U+00F0
  'ñ': 'n', // U+00F1
  'ò': 'o', // U+00F2
  'ó': 'o', // U+00F3
  'ô': 'o', // U+00F4
  'õ': 'o', // U+00F5
  'ö': 'o', // U+00F6
  'ø': 'o', // U+00F8
  'ù': 'u', // U+00F9
  'ú': 'u', // U+00FA
  'û': 'u', // U+00FB
  'ü': 'u', // U+00FC
  'ý': 'y', // U+00FD
  'þ': 'th', // U+00FE
  'ÿ': 'y', // U+00FF
  'Ø': 'O', // U+00D8
  'Ā': 'A', // U+0100
  'ā': 'a', // U+0101
  'Ă': 'A', // U+0102
  'ă': 'a', // U+0103
  'Ą': 'A', // U+0104
  'ą': 'a', // U+0105
  'Ć': 'C', // U+0106
  'ć': 'c', // U+0107
  'Ĉ': 'C', // U+0108
  'ĉ': 'c', // U+0109
  'Ċ': 'C', // U+010A
  'ċ': 'c', // U+010B
  'Č': 'C', // U+010C
  'č': 'c', // U+010D
  'Ď': 'D', // U+010E
  'ď': 'd', // U+010F
  'Đ': 'D', // U+0110
  'đ': 'd', // U+0111
  'Ē': 'E', // U+0112
  'ē': 'e', // U+0113
  'Ĕ': 'E', // U+0114
  'ĕ': 'e', // U+0115
  'Ė': 'E', // U+0116
  'ė': 'e', // U+0117
  'Ę': 'E', // U+0118
  'ę': 'e', // U+0119
  'Ě': 'E', // U+011A
  'ě': 'e', // U+011B
  'Ĝ': 'G', // U+011C
  'ĝ': 'g', // U+011D
  'Ğ': 'G', // U+011E
  'ğ': 'g', // U+011F
  'Ġ': 'G', // U+0120
  'ġ': 'g', // U+0121
  'Ģ': 'G', // U+0122
  'ģ': 'g', // U+0123
  'Ĥ': 'H', // U+0124
  'ĥ': 'h', // U+0125
  'Ħ': 'H', // U+0126
  'ħ': 'h', // U+0127
  'Ĩ': 'I', // U+0128
  'ĩ': 'i', // U+0129
  'Ī': 'I', // U+012A
  'ī': 'i', // U+012B
  'Ĭ': 'I', // U+012C
  'ĭ': 'i', // U+012D
  'Į': 'I', // U+012E
  'į': 'i', // U+012F
  'İ': 'I', // U+0130
  'ı': 'i', // U+0131
  'Ĳ': 'IJ', // U+0132
  'ĳ': 'ij', // U+0133
  'Ĵ': 'J', // U+0134
  'ĵ': 'j', // U+0135
  'Ķ': 'K', // U+0136
  'ķ': 'k', // U+0137
  'ĸ': 'k', // U+0138
  'Ĺ': 'L', // U+0139
  'ĺ': 'l', // U+013A
  'Ļ': 'L', // U+013B
  'ļ': 'l', // U+013C
  'Ľ': 'L', // U+013D
  'ľ': 'l', // U+013E
  'Ŀ': 'L', // U+013F
  'ŀ': 'l', // U+0140
  'Ł': 'L', // U+0141
  'ł': 'l', // U+0142
  'Ń': 'N', // U+0143
  'ń': 'n', // U+0144
  'Ņ': 'N', // U+0145
  'ņ': 'n', // U+0146
  'Ň': 'N', // U+0147
  'ň': 'n', // U+0148
  'ŉ': 'n', // U+0149
  'Ŋ': 'N', // U+014A
  'ŋ': 'n', // U+014B
  'Ō': 'O', // U+014C
  'ō': 'o', // U+014D
  'Ŏ': 'O', // U+014E
  'ŏ': 'o', // U+014F
  'Ő': 'O', // U+0150
  'ő': 'o', // U+0151
  'Œ': 'OE', // U+0152
  'œ': 'oe', // U+0153
  'Ŕ': 'R', // U+0154
  'ŕ': 'r', // U+0155
  'Ŗ': 'R', // U+0156
  'ŗ': 'r', // U+0157
  'Ř': 'R', // U+0158
  'ř': 'r', // U+0159
  'Ś': 'S', // U+015A
  'ś': 's', // U+015B
  'Ŝ': 'S', // U+015C
  'ŝ': 's', // U+015D
  'Ş': 'S', // U+015E
  'ş': 's', // U+015F
  'Š': 'S', // U+0160
  'š': 's', // U+0161
  'Ţ': 'T', // U+0162
  'ţ': 't', // U+0163
  'Ť': 'T', // U+0164
  'ť': 't', // U+0165
  'Ŧ': 'T', // U+0166
  'ŧ': 't', // U+0167
  'Ũ': 'U', // U+0168
  'ũ': 'u', // U+0169
  'Ū': 'U', // U+016A
  'ū': 'u', // U+016B
  'Ŭ': 'U', // U+016C
  'ŭ': 'u', // U+016D
  'Ů': 'U', // U+016E
  'ů': 'u', // U+016F
  'Ű': 'U', // U+0170
  'ű': 'u', // U+0171
  'Ų': 'U', // U+0172
  'ų': 'u', // U+0173
  'Ŵ': 'W', // U+0174
  'ŵ': 'w', // U+0175
  'Ŷ': 'Y', // U+0176
  'ŷ': 'y', // U+0177
  'Ÿ': 'Y', // U+0178
  'Ź': 'Z', // U+0179
  'ź': 'z', // U+017A
  'Ż': 'Z', // U+017B
  'ż': 'z', // U+017C
  'Ž': 'Z', // U+017D
  'ž': 'z', // U+017E
  'ſ': 's', // U+017F
  'Ə': 'E', // U+018F
  'ǝ': 'e', // U+01DD
  'Ș': 'S', // U+0218
  'ș': 's', // U+0219
  'Ț': 'T', // U+021A
  'ț': 't', // U+021B
  '€': 'E', // U+20AC
  '£': '', // U+00A3
  'Ơ': 'O', // U+01A0
  'ơ': 'o', // U+01A1
  'Ư': 'U', // U+01AF
  'ư': 'u', // U+01B0
  'Ầ': 'A', // U+1EA6
  'ầ': 'a', // U+1EA7
  'Ằ': 'A', // U+1EB0
  'ằ': 'a', // U+1EB1
  'Ề': 'E', // U+1EC0
  'ề': 'e', // U+1EC1
  'Ồ': 'O', // U+1ED2
  'ồ': 'o', // U+1ED3
  'Ờ': 'O', // U+1EDC
  'ờ': 'o', // U+1EDD
  'Ừ': 'U', // U+1EEA
  'ừ': 'u', // U+1EEB
  'Ỳ': 'Y', // U+1EF2
  'ỳ': 'y', // U+1EF3
  'Ả': 'A', // U+1EA2
  'ả': 'a', // U+1EA3
  'Ẩ': 'A', // U+1EA8
  'ẩ': 'a', // U+1EA9
  'Ẳ': 'A', // U+1EB2
  'ẳ': 'a', // U+1EB3
  'Ẻ': 'E', // U+1EBA
  'ẻ': 'e', // U+1EBB
  'Ể': 'E', // U+1EC2
  'ể': 'e', // U+1EC3
  'Ỉ': 'I', // U+1EC8
  'ỉ': 'i', // U+1EC9
  'Ỏ': 'O', // U+1ECE
  'ỏ': 'o', // U+1ECF
  'Ổ': 'O', // U+1ED4
  'ổ': 'o', // U+1ED5
  'Ở': 'O', // U+1EDE
  'ở': 'o', // U+1EDF
  'Ủ': 'U', // U+1EE6
  'ủ': 'u', // U+1EE7
  'Ử': 'U', // U+1EEC
  'ử': 'u', // U+1EED
  'Ỷ': 'Y', // U+1EF6
  'ỷ': 'y', // U+1EF7
  'Ẫ': 'A', // U+1EAA
  'ẫ': 'a', // U+1EAB
  'Ẵ': 'A', // U+1EB4
  'ẵ': 'a', // U+1EB5
  'Ẽ': 'E', // U+1EBC
  'ẽ': 'e', // U+1EBD
  'Ễ': 'E', // U+1EC4
  'ễ': 'e', // U+1EC5
  'Ỗ': 'O', // U+1ED6
  'ỗ': 'o', // U+1ED7
  'Ỡ': 'O', // U+1EE0
  'ỡ': 'o', // U+1EE1
  'Ữ': 'U', // U+1EEE
  'ữ': 'u', // U+1EEF
  'Ỹ': 'Y', // U+1EF8
  'ỹ': 'y', // U+1EF9
  'Ấ': 'A', // U+1EA4
  'ấ': 'a', // U+1EA5
  'Ắ': 'A', // U+1EAE
  'ắ': 'a', // U+1EAF
  'Ế': 'E', // U+1EBE
  'ế': 'e', // U+1EBF
  'Ố': 'O', // U+1ED0
  'ố': 'o', // U+1ED1
  'Ớ': 'O', // U+1EDA
  'ớ': 'o', // U+1EDB
  'Ứ': 'U', // U+1EE8
  'ứ': 'u', // U+1EE9
  'Ạ': 'A', // U+1EA0
  'ạ': 'a', // U+1EA1
  'Ậ': 'A', // U+1EAC
  'ậ': 'a', // U+1EAD
  'Ặ': 'A', // U+1EB6
  'ặ': 'a', // U+1EB7
  'Ẹ': 'E', // U+1EB8
  'ẹ': 'e', // U+1EB9
  'Ệ': 'E', // U+1EC6
  'ệ': 'e', // U+1EC7
  'Ị': 'I', // U+1ECA
  'ị': 'i', // U+1ECB
  'Ọ': 'O', // U+1ECC
  'ọ': 'o', // U+1ECD
  'Ộ': 'O', // U+1ED8
  'ộ': 'o', // U+1ED9
  'Ợ': 'O', // U+1EE2
  'ợ': 'o', // U+1EE3
  'Ụ': 'U', // U+1EE4
  'ụ': 'u', // U+1EE5
  'Ự': 'U', // U+1EF0
  'ự': 'u', // U+1EF1
  'Ỵ': 'Y', // U+1EF4
  'ỵ': 'y', // U+1EF5
  'ɑ': 'a', // U+0251
  'Ǖ': 'U', // U+01D5
  'ǖ': 'u', // U+01D6
  'Ǘ': 'U', // U+01D7
  'ǘ': 'u', // U+01D8
  'Ǎ': 'A', // U+01CD
  'ǎ': 'a', // U+01CE
  'Ǐ': 'I', // U+01CF
  'ǐ': 'i', // U+01D0
  'Ǒ': 'O', // U+01D1
  'ǒ': 'o', // U+01D2
  'Ǔ': 'U', // U+01D3
  'ǔ': 'u', // U+01D4
  'Ǚ': 'U', // U+01D9
  'ǚ': 'u', // U+01DA
  'Ǜ': 'U', // U+01DB
  'ǜ': 'u', // U+01DC
};

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
export function resolveWpAccentLocale(locale: string | null | undefined): WpAccentLocale {
  if (!locale) return 'default';
  const parts = String(locale).trim().split(/[-_]/);
  const lang = (parts[0] ?? '').toLowerCase();
  const region = (parts[1] ?? '').toUpperCase();
  const rest = parts.slice(2);
  if (lang.startsWith('de')) return 'de';
  // WP compares the full locale string exactly, so only bare `xx_YY` forms
  // (no variant suffix) match these branches.
  if (rest.length > 0) return 'default';
  if (lang === 'da' && (region === '' || region === 'DK')) return 'da_DK';
  if (lang === 'ca' && region === '') return 'ca';
  if (lang === 'sr' && (region === '' || region === 'RS')) return 'sr_RS';
  if (lang === 'bs' && (region === '' || region === 'BA')) return 'sr_RS';
  return 'default';
}

const LOCALE_OVERRIDES: Readonly<Record<Exclude<WpAccentLocale, 'ca' | 'default'>, Readonly<Record<string, string>>>> = {
  de: { 'Ä': 'Ae', 'ä': 'ae', 'Ö': 'Oe', 'ö': 'oe', 'Ü': 'Ue', 'ü': 'ue', 'ẞ': 'SS', 'ß': 'ss' },
  da_DK: { 'Æ': 'Ae', 'æ': 'ae', 'Ø': 'Oe', 'ø': 'oe', 'Å': 'Aa', 'å': 'aa' },
  sr_RS: { 'Đ': 'DJ', 'đ': 'dj' },
};

// eslint-disable-next-line no-control-regex
const NON_ASCII = /[^\x00-\x7F]/;

/**
 * WP remove_accents($text, $locale) for valid Unicode text: NFC, then the base
 * map with the locale overrides applied on top. ASCII-only text is returned
 * unchanged (as in WP).
 */
export function removeAccents(text: string, locale?: string | null): string {
  if (!NON_ASCII.test(text)) return text;
  let s = text.normalize('NFC');
  const branch = resolveWpAccentLocale(locale);
  // Catalan: the only multi-character key; strtr() prefers the longest key,
  // and no single-character key overlaps it, so a left-to-right replace is equivalent.
  if (branch === 'ca') s = s.split('l·l').join('ll');
  const overrides = branch === 'de' || branch === 'da_DK' || branch === 'sr_RS' ? LOCALE_OVERRIDES[branch] : undefined;
  let out = '';
  for (const ch of s) {
    const o = overrides?.[ch];
    if (o !== undefined) out += o;
    else {
      const b = WP_REMOVE_ACCENTS_BASE[ch];
      out += b !== undefined ? b : ch;
    }
  }
  return out;
}
