/*
 * Tests for @multi-stores/core/slug (WordPress 7.1.4 sanitize_title port).
 * Runs against the committed builds (dist/esm and dist/cjs); scripts/check.mjs
 * guarantees they equal a fresh build of src/.
 *
 *   node --test test/*.test.mjs
 *
 * Non-ASCII test strings are built with String.fromCodePoint (U()) so the file
 * stays readable without escape sequences.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, test } from 'node:test';
import * as esm from '../dist/esm/slug/index.js';

const require = createRequire(import.meta.url);
const cjs = require('../dist/cjs/slug/index.js');
const VECTORS = JSON.parse(readFileSync(new URL('../fixtures/slug.wp-vectors.json', import.meta.url), 'utf8'));

const U = (...cps) => String.fromCodePoint(...cps);
const MEEM = U(0x645);
const FIRE = U(0x1f525);

const {
  sanitizeTitle,
  sanitizeAsciiHandle,
  uniqueSlug,
  suffixSlug,
  normalizeSlugForLookup,
  encodeSlugForUrl,
  encodedLength,
  truncateToEncoded,
  resolveWpAccentLocale,
  removeAccents,
  stripTags,
  isNumericPageSlug,
  WP_RESERVED_SLUGS,
  WP_REMOVE_ACCENTS_BASE,
  SLUG_MAX_BYTES,
} = esm;

// Rows (1-based, spec section 11) where we intentionally differ from WP:
// literal %xx in the title is decoded instead of kept (spec section 7 (a)).
const DEVIATIONS = new Map([
  [42, { wp: 'rabatt-50%ab', ours: 'rabatt-50ab' }],
  [43, { wp: 'hello%20world', ours: 'hello-world' }],
]);

describe('WP 7.1.4 vectors (fixtures/slug.wp-vectors.json)', () => {
  test('fixture has 92 vectors', () => assert.equal(VECTORS.length, 92));

  VECTORS.forEach((v, i) => {
    const row = i + 1;
    test(`#${row} ${JSON.stringify(v.input).slice(0, 60)} [${v.locale}]`, () => {
      const got = sanitizeTitle(v.input, { locale: v.locale });
      assert.equal(got, v.ours, 'esm output');
      assert.equal(cjs.sanitizeTitle(v.input, { locale: v.locale }), got, 'cjs == esm');
      assert.equal(got, got.normalize('NFC'), 'output is NFC');
      assert.ok(encodedLength(got) <= SLUG_MAX_BYTES, 'within 200 encoded bytes');
      const dev = DEVIATIONS.get(row);
      if (dev) {
        assert.equal(v.wpPostName, dev.wp);
        assert.equal(got, dev.ours);
        assert.notEqual(encodeSlugForUrl(got), v.wpPostName);
        return;
      }
      // Compare with the real WP value, decoded.
      const wpDecoded = decodeURIComponent(v.wpPostName).normalize('NFC');
      assert.equal(v.wpDecoded.normalize('NFC'), wpDecoded, 'fixture wpDecoded is consistent');
      assert.equal(got, wpDecoded, 'decoded WP post_name');
      // Our URL form is byte-identical to the WP permalink segment.
      assert.equal(encodeSlugForUrl(got), v.wpPostName, 'URL encoding == WP post_name');
      // Lookup of the WP URL (any hex case) and of the decoded slug finds it.
      assert.equal(normalizeSlugForLookup(v.wpPostName), got);
      assert.equal(normalizeSlugForLookup(v.wpPostName.replace(/%[0-9a-f]{2}/g, (m) => m.toUpperCase())), got);
      assert.equal(normalizeSlugForLookup(got), got);
      // Re-saving the stored slug the way WP does (encoded) keeps it unchanged.
      assert.equal(sanitizeTitle(encodeSlugForUrl(got), { locale: v.locale }), got, 're-save is stable');
    });
  });

  test('re-sanitizing the DECODED slug is stable except where remove_accents still applies', () => {
    const changed = VECTORS.map((v, i) => [i + 1, v])
      .filter(([, v]) => sanitizeTitle(v.ours, { locale: v.locale }) !== v.ours)
      .map(([row]) => row);
    // 14: straße (en) -> strase; 78: svärfar (decoded from %C3%A4) -> svarfar.
    assert.deepEqual(changed, [14, 78]);
  });
});

describe('remove_accents map and locales', () => {
  test('base map has the 311 WP entries, all single code points', () => {
    const keys = Object.keys(WP_REMOVE_ACCENTS_BASE);
    assert.equal(keys.length, 311);
    for (const k of keys) assert.equal([...k].length, 1, k);
  });

  test('resolveWpAccentLocale maps short codes and WP/BCP-47 forms', () => {
    const cases = {
      de: 'de', de_DE: 'de', 'de-DE': 'de', 'de-ch': 'de', de_AT: 'de', de_DE_formal: 'de', DE: 'de',
      da: 'da_DK', da_DK: 'da_DK', 'da-DK': 'da_DK', 'da-dk': 'da_DK', da_SE: 'default',
      ca: 'ca', ca_ES: 'default',
      sr: 'sr_RS', sr_RS: 'sr_RS', 'sr-RS': 'sr_RS', bs: 'sr_RS', bs_BA: 'sr_RS', sr_ME: 'default',
      sv: 'default', sv_SE: 'default', ar: 'default', en: 'default', en_US: 'default', fr: 'default',
      tr: 'default', nb: 'default', fa_IR: 'default', '': 'default',
    };
    for (const [loc, want] of Object.entries(cases)) assert.equal(resolveWpAccentLocale(loc), want, loc);
    assert.equal(resolveWpAccentLocale(undefined), 'default');
    assert.equal(resolveWpAccentLocale(null), 'default');
  });

  test('acceptance examples', () => {
    assert.equal(sanitizeTitle('Kl' + U(0xe4) + 'der', { locale: 'sv' }), 'klader');
    assert.equal(sanitizeTitle('Present till sv' + U(0xe4) + 'rfar', { locale: 'sv' }), 'present-till-svarfar');
    const gift = U(0x647, 0x62f, 0x64a, 0x629) + ' ' + U(0x644, 0x623, 0x645, 0x64a);
    assert.equal(sanitizeTitle(gift, { locale: 'ar' }), gift.replace(' ', '-'));
  });

  test('German: our short `de` behaves like WP de_DE', () => {
    const title = 'Gr' + U(0xf6, 0xdf) + 'e ' + U(0xdc) + 'ber ' + U(0xc4) + 'pfel';
    for (const loc of ['de', 'de_DE', 'de-DE', 'de-CH']) {
      assert.equal(sanitizeTitle(title, { locale: loc }), 'groesse-ueber-aepfel', loc);
    }
    assert.equal(sanitizeTitle(title, { locale: 'sv' }), 'grose-uber-apfel');
    assert.equal(sanitizeTitle(title), 'grose-uber-apfel');
    // Capital sharp s: only the German branch maps it.
    assert.equal(sanitizeTitle('STRA' + U(0x1e9e) + 'E', { locale: 'de' }), 'strasse');
    assert.equal(sanitizeTitle('STRA' + U(0x1e9e) + 'E', { locale: 'en' }), 'stra' + U(0xdf) + 'e');
  });

  test('Danish: our short `da` behaves like WP da_DK', () => {
    const title = U(0xc6) + 'ble p' + U(0xe5) + ' ' + U(0xc6) + 'r' + U(0xf8);
    assert.equal(sanitizeTitle(title, { locale: 'da' }), 'aeble-paa-aeroe');
    assert.equal(sanitizeTitle(title, { locale: 'da-DK' }), 'aeble-paa-aeroe');
    assert.equal(sanitizeTitle(title, { locale: 'sv' }), 'aeble-pa-aero');
  });

  test('Catalan l.l, Serbian/Bosnian dj', () => {
    const paral = 'Paral' + U(0xb7) + 'lel';
    assert.equal(sanitizeTitle(paral, { locale: 'ca' }), 'parallel');
    assert.equal(sanitizeTitle(paral, { locale: 'ca_ES' }), 'paral' + U(0xb7) + 'lel');
    const djordje = U(0x110) + 'or' + U(0x111) + 'e';
    assert.equal(sanitizeTitle(djordje, { locale: 'sr' }), 'djordje');
    assert.equal(sanitizeTitle(djordje, { locale: 'bs' }), 'djordje');
    assert.equal(sanitizeTitle(djordje, { locale: 'bs_BA' }), 'djordje');
    assert.equal(sanitizeTitle(djordje, { locale: 'hr' }), 'dorde');
  });

  test('Swedish uses the default map (no sv branch)', () => {
    const t = U(0xc5, 0xc4, 0xd6) + ' ' + U(0xe5, 0xe4, 0xf6);
    assert.equal(sanitizeTitle(t, { locale: 'sv' }), 'aao-aao');
    assert.equal(sanitizeTitle(t, { locale: 'sv_SE' }), 'aao-aao');
  });

  test('removeAccents leaves ASCII untouched and composes NFD', () => {
    assert.equal(removeAccents('plain ascii'), 'plain ascii');
    assert.equal(removeAccents('Cafe' + U(0x301)), 'Cafe');
    assert.equal(removeAccents(U(0x627, 0x654)), U(0x623)); // composes to alef with hamza above
  });
});

describe('200 encoded-byte limit', () => {
  test('ASCII keeps 200 characters', () => {
    assert.equal(sanitizeTitle('a'.repeat(250)), 'a'.repeat(200));
  });

  test('Arabic letters cost 6: 33 letters fit, never a split character', () => {
    assert.equal(sanitizeTitle(MEEM.repeat(40)), MEEM.repeat(33));
    assert.equal(encodedLength(MEEM.repeat(33)), 198);
    assert.equal(sanitizeTitle('ab' + MEEM.repeat(40)), 'ab' + MEEM.repeat(33));
    assert.equal(encodedLength('ab' + MEEM.repeat(33)), 200);
  });

  test('tashkeel counts toward the limit', () => {
    const withHaraka = (MEEM + U(0x64e)).repeat(20); // 40 code points, 6 bytes each
    assert.equal(sanitizeTitle(withHaraka), (MEEM + U(0x64e)).repeat(16) + MEEM);
  });

  test('emoji cost 12 and are never split', () => {
    assert.equal(sanitizeTitle(FIRE.repeat(20)), FIRE.repeat(16));
    assert.equal(encodedLength(FIRE), 12);
    assert.equal(sanitizeTitle('a' + FIRE.repeat(3), { maxBytes: 13 }), 'a' + FIRE);
    assert.equal(sanitizeTitle('a' + FIRE.repeat(3), { maxBytes: 24 }), 'a' + FIRE);
    assert.equal(sanitizeTitle('a' + FIRE.repeat(3), { maxBytes: 12 }), 'a');
  });

  test('ZWJ counts before it is deleted (cut happens before punctuation removal)', () => {
    const family = U(0x1f468, 0x200d, 0x1f469, 0x200d, 0x1f467);
    // 12 + 9 + 12 + 9 + 12 = 54 encoded bytes before the ZWJs are removed.
    assert.equal(sanitizeTitle(family, { maxBytes: 54 }), U(0x1f468, 0x1f469, 0x1f467));
    assert.equal(sanitizeTitle(family, { maxBytes: 53 }), U(0x1f468, 0x1f469));
  });

  test('cut point is before punctuation removal, like WP', () => {
    // 199 x + "!" fit the budget; "!" is removed afterwards, "y" was cut.
    assert.equal(sanitizeTitle('x'.repeat(199) + '!!!y'), 'x'.repeat(199));
    // Trailing dash after the cut is trimmed.
    assert.equal(sanitizeTitle('x'.repeat(199) + ' yy'), 'x'.repeat(199));
  });

  test('Arabic long title matches WP (vector 83)', () => {
    const v = VECTORS[82];
    const got = sanitizeTitle(v.input, { locale: v.locale });
    assert.equal(encodedLength(got), 197);
  });

  test('custom and disabled budgets', () => {
    assert.equal(sanitizeTitle('hello world', { maxBytes: 5 }), 'hello');
    assert.equal(sanitizeTitle('a'.repeat(300), { maxBytes: Infinity }), 'a'.repeat(300));
  });

  test('truncateToEncoded / encodedLength helpers', () => {
    assert.equal(encodedLength('abc'), 3);
    assert.equal(encodedLength(U(0xe4)), 6);
    assert.equal(encodedLength(U(0x4e2d)), 9);
    assert.equal(truncateToEncoded('ab' + U(0xe4) + 'c', 7), 'ab');
    assert.equal(truncateToEncoded('ab' + U(0xe4) + 'c', 8), 'ab' + U(0xe4));
    assert.equal(truncateToEncoded('abc', 0), '');
  });
});

describe('sanitizeTitle details', () => {
  test('empty results', () => {
    for (const s of ['', '!!!', '   ', '-', '<b></b>', '&amp;']) assert.equal(sanitizeTitle(s), '', JSON.stringify(s));
  });

  test('percent handling (intentional difference: valid UTF-8 octets are decoded)', () => {
    assert.equal(sanitizeTitle('50% off'), '50-off');
    assert.equal(sanitizeTitle('sv%C3%A4rfar', { locale: 'de' }), 'sv' + U(0xe4) + 'rfar'); // decoded after folding, as WP
    assert.equal(sanitizeTitle('a%E2%80%94b'), 'a-b'); // encoded em dash -> dash
    assert.equal(sanitizeTitle('a%2Fb'), 'a-b'); // encoded slash -> dash
    assert.equal(sanitizeTitle('100%25'), '100'); // decoded % is removed
    assert.equal(sanitizeTitle('a%C3b'), 'ac3b'); // lone lead byte: % dropped
    assert.equal(sanitizeTitle('%C3%A4%FF'), U(0xe4) + 'ff'); // valid part decoded, invalid byte loses %
    assert.equal(sanitizeTitle('%ED%A0%80x'), 'eda080x'); // encoded surrogate is invalid UTF-8
    assert.equal(sanitizeTitle('%C0%AF'), 'c0af'); // overlong
  });

  test('strip_tags semantics', () => {
    assert.equal(stripTags('<a href=">">x'), 'x');
    assert.equal(stripTags('<!-- comment -->x'), 'x');
    assert.equal(stripTags('<?php echo 1 ?>z'), 'z');
    assert.equal(stripTags('<!DOCTYPE html>q'), 'q');
    assert.equal(stripTags('a < b'), 'a < b');
    assert.equal(stripTags('x<y z'), 'x');
    assert.equal(sanitizeTitle('a < b > c'), 'a-b-c');
  });

  test('save-context replacements on decoded characters', () => {
    assert.equal(sanitizeTitle('a' + U(0x2009) + 'b' + U(0x202f) + 'c' + U(0x2028) + 'd'), 'a-b-c-d');
    assert.equal(sanitizeTitle('a&nbsp;b&#8211;c&mdash;d'), 'a-b-c-d');
    assert.equal(sanitizeTitle(U(0xab) + 'x' + U(0xbb) + U(0x2122) + U(0xa9) + U(0x200f)), 'x');
    assert.equal(sanitizeTitle('3' + U(0xd7) + '4'), '3x4');
    assert.equal(sanitizeTitle('snake_case stays'), 'snake_case-stays');
  });

  test('Arabic and Persian specifics are kept as in WP', () => {
    const tatweel = U(0x645, 0x631, 0x62d, 0x640, 0x640, 0x628, 0x627);
    assert.equal(sanitizeTitle(tatweel), tatweel);
    const digits = U(0x661, 0x662, 0x663);
    assert.equal(sanitizeTitle(digits), digits);
    const comma = U(0x627, 0x60c, 0x628); // Arabic comma kept
    assert.equal(sanitizeTitle(comma), comma);
    const zwnj = U(0x646, 0x6cc, 0x645, 0x200c, 0x641);
    assert.equal(sanitizeTitle(zwnj), U(0x646, 0x6cc, 0x645, 0x641));
  });

  test('Greek capital sigma lowercases to sigma, not final sigma (PHP 8.2 parity)', () => {
    assert.equal(sanitizeTitle(U(0x39f, 0x394, 0x39f, 0x3a3)), U(0x3bf, 0x3b4, 0x3bf, 0x3c3));
  });

  test('lone surrogates become U+FFFD instead of throwing', () => {
    assert.equal(sanitizeTitle('a' + String.fromCharCode(0xd800) + 'b'), 'a' + U(0xfffd) + 'b');
  });

  test('non-string-ish input is tolerated', () => {
    assert.equal(sanitizeTitle(undefined), '');
    assert.equal(sanitizeTitle(null), '');
  });
});

describe('sanitizeAsciiHandle (store slug, market key)', () => {
  const cases = [
    ['Min Butik', undefined, 'min-butik'],
    ['Caf' + U(0xe9) + '_Str' + U(0xf6) + 'm', 'sv', 'cafestrom'],
    [U(0x645, 0x62a, 0x62c, 0x631) + ' Namez', 'ar', 'namez'],
    ['Gr' + U(0xf6, 0xdf) + 'e', 'de', 'groesse'],
    ['--A--B--', undefined, 'a-b'],
    ['Hello%20World', undefined, 'hello-world'],
    ['', undefined, ''],
    [U(0x4e2d, 0x6587), undefined, ''],
    ['STRA' + U(0x1e9e) + 'E shop', 'en', 'strae-shop'],
    ['a.b.c', undefined, 'a-b-c'],
  ];
  for (const [input, locale, want] of cases) {
    test(`${JSON.stringify(input)} [${locale ?? '-'}] -> ${want}`, () => {
      const got = sanitizeAsciiHandle(input, { locale });
      assert.equal(got, want);
      assert.match(got, /^([a-z0-9]+(-[a-z0-9]+)*)?$/);
    });
  }

  test('maxBytes applies to the ASCII result', () => {
    assert.equal(sanitizeAsciiHandle('abc-def', { maxBytes: 5 }), 'abc-d');
    assert.equal(sanitizeAsciiHandle('abcd-ef', { maxBytes: 5 }), 'abcd');
    assert.equal(sanitizeAsciiHandle(MEEM.repeat(100) + ' shop', { maxBytes: 16 }), 'shop');
  });
});

describe('uniqueSlug (spec section 10)', () => {
  const takenIn = (...slugs) => {
    const set = new Set(slugs);
    return (c) => set.has(c);
  };

  test('free slug is returned unchanged', async () => {
    assert.equal(await uniqueSlug('svarfar', takenIn()), 'svarfar');
  });

  test('first duplicate gets -2, then -3', async () => {
    assert.equal(await uniqueSlug('svarfar', takenIn('svarfar')), 'svarfar-2');
    assert.equal(await uniqueSlug('svarfar', takenIn('svarfar', 'svarfar-2')), 'svarfar-3');
  });

  test('async isTaken', async () => {
    const set = new Set(['a', 'a-2']);
    assert.equal(await uniqueSlug('a', async (c) => set.has(c)), 'a-3');
  });

  test('numeric page slugs (numericNeedsSuffix)', async () => {
    assert.equal(await uniqueSlug('2024', takenIn(), { numericNeedsSuffix: true }), '2024-2');
    assert.equal(await uniqueSlug('page3', takenIn(), { numericNeedsSuffix: true }), 'page3-2');
    assert.equal(await uniqueSlug('2024', takenIn()), '2024');
    assert.equal(await uniqueSlug('page-3', takenIn(), { numericNeedsSuffix: true }), 'page-3');
    assert.ok(isNumericPageSlug('page12') && isNumericPageSlug('7') && !isNumericPageSlug('a7'));
  });

  test('reserved slugs (WP feeds + embed by default)', async () => {
    assert.deepEqual([...WP_RESERVED_SLUGS], ['feed', 'rdf', 'rss', 'rss2', 'atom', 'embed']);
    assert.equal(await uniqueSlug('feed', takenIn()), 'feed-2');
    assert.equal(await uniqueSlug('rss2', takenIn()), 'rss2-2');
    assert.equal(await uniqueSlug('embed', takenIn()), 'embed-2');
    assert.equal(await uniqueSlug('feed', takenIn(), { reserved: [] }), 'feed');
    const reserved = [...WP_RESERVED_SLUGS, 'cart', 'checkout'];
    assert.equal(await uniqueSlug('cart', takenIn(), { reserved }), 'cart-2');
    assert.equal(await uniqueSlug('cart', takenIn('cart-2'), { reserved }), 'cart-3');
  });

  test('200-char ASCII slug taken -> first 198 chars, rtrim dash, -2', async () => {
    const v = VECTORS[81];
    const base = sanitizeTitle(v.input, { locale: v.locale });
    assert.equal(base.length, 200);
    const got = await uniqueSlug(base, takenIn(base));
    assert.equal(got, base.slice(0, 198).replace(/-+$/, '') + '-2');
    assert.ok(got.endsWith('lorem-ips-2'));
    assert.equal(got.length, 200);
  });

  test('ab + 33 Arabic letters (200 encoded) taken -> 32 letters + -2 (196); -10 -> 197', async () => {
    const base = 'ab' + MEEM.repeat(33);
    assert.equal(encodedLength(base), 200);
    const got = await uniqueSlug(base, takenIn(base));
    assert.equal(got, 'ab' + MEEM.repeat(32) + '-2');
    assert.equal(encodedLength(got), 196);
    const taken = [base, ...Array.from({ length: 8 }, (_, k) => suffixSlug(base, k + 2))];
    const got10 = await uniqueSlug(base, takenIn(...taken));
    assert.equal(got10, 'ab' + MEEM.repeat(32) + '-10');
    assert.equal(encodedLength(got10), 197);
  });

  test('scope is the caller\'s: cross-taxonomy duplicates are allowed', async () => {
    const productTag = takenIn(); // "shoes" exists only in another scope
    assert.equal(await uniqueSlug('shoes', productTag, { reserved: [] }), 'shoes');
  });

  test('hierarchical: <slug>-<parent> first, then numbering on the last candidate', async () => {
    assert.equal(await uniqueSlug('red', takenIn('red'), { alt: ['red-shirts'] }), 'red-shirts');
    assert.equal(await uniqueSlug('red', takenIn('red', 'red-shirts'), { alt: ['red-shirts'] }), 'red-shirts-2');
    assert.equal(
      await uniqueSlug('red', takenIn('red', 'red-shirts'), { alt: ['red-shirts', 'red-shirts-clothes'] }),
      'red-shirts-clothes',
    );
    // alt is not used when the base is free.
    assert.equal(await uniqueSlug('red', takenIn(), { alt: ['red-shirts'] }), 'red');
  });

  test('base longer than the budget is fitted first', async () => {
    assert.equal(await uniqueSlug('a'.repeat(210), takenIn()), 'a'.repeat(200));
    assert.equal(await uniqueSlug('abc-def', takenIn(), { maxBytes: 4 }), 'abc');
  });

  test('empty base throws; attempts are capped', async () => {
    await assert.rejects(() => uniqueSlug('', takenIn()));
    await assert.rejects(() => uniqueSlug('x', () => true, { maxAttempts: 5 }));
  });

  test('suffixSlug never produces -1 and fits the budget', () => {
    assert.equal(suffixSlug('abc', 2), 'abc-2');
    assert.equal(suffixSlug('abc-def', 2, 6), 'abc-2');
    assert.equal(suffixSlug(FIRE.repeat(17), 2, 200), FIRE.repeat(16) + '-2');
  });
});

describe('normalizeSlugForLookup (WP query context, decoded storage)', () => {
  const svarfar = 'sv' + U(0xe4) + 'rfar';
  const marhaba = U(0x645, 0x631, 0x62d, 0x628, 0x627);

  test('NFD input is composed', () => {
    assert.equal(normalizeSlugForLookup('sva' + U(0x308) + 'rfar'), svarfar);
  });

  test('percent-decoding with uppercase and lowercase hex', () => {
    assert.equal(normalizeSlugForLookup('%D9%85%D8%B1%D8%AD%D8%A8%D8%A7'), marhaba);
    assert.equal(normalizeSlugForLookup('%d9%85%d8%b1%d8%ad%d8%a8%d8%a7'), marhaba);
    assert.equal(normalizeSlugForLookup('SV%C3%A4RFAR'), svarfar);
    assert.equal(normalizeSlugForLookup('sva%CC%88rfar'), svarfar); // encoded NFD
    assert.equal(normalizeSlugForLookup('kl%C3%A4der'), 'kl' + U(0xe4) + 'der');
  });

  test('no accent folding, no punctuation changes', () => {
    assert.equal(normalizeSlugForLookup('Kl' + U(0xe4) + 'der'), 'kl' + U(0xe4) + 'der');
    assert.equal(normalizeSlugForLookup('Hello_World'), 'hello_world');
    assert.equal(normalizeSlugForLookup(U(0x39f, 0x394, 0x39f, 0x3a3)), U(0x3bf, 0x3b4, 0x3bf, 0x3c3));
  });

  test('malformed sequences are left as they are (and lowercased)', () => {
    assert.equal(normalizeSlugForLookup('100%'), '100%');
    assert.equal(normalizeSlugForLookup('%zz'), '%zz');
    assert.equal(normalizeSlugForLookup('a%C3'), 'a%c3');
    assert.equal(normalizeSlugForLookup('%E0%A4%A'), '%e0%a4%a');
    assert.equal(normalizeSlugForLookup('%C0%AF'), '%c0%af');
    assert.equal(normalizeSlugForLookup('%ED%A0%80'), '%ed%a0%80');
    assert.equal(normalizeSlugForLookup('%C3%A4%FF'), U(0xe4) + '%ff');
    assert.equal(normalizeSlugForLookup('a' + String.fromCharCode(0xdc00)), 'a' + U(0xfffd));
  });

  test('round trip with encodeSlugForUrl for every vector', () => {
    for (const v of VECTORS) {
      assert.equal(normalizeSlugForLookup(encodeSlugForUrl(v.ours)), v.ours);
      assert.equal(normalizeSlugForLookup(encodeURIComponent(v.ours)), v.ours); // uppercase hex
    }
  });
});

describe('encodeSlugForUrl', () => {
  test('lowercase hex per segment, ASCII slug unchanged', () => {
    assert.equal(encodeSlugForUrl('hello-world_2'), 'hello-world_2');
    assert.equal(encodeSlugForUrl(U(0x645, 0x631, 0x62d, 0x628, 0x627)), '%d9%85%d8%b1%d8%ad%d8%a8%d8%a7');
    assert.equal(encodeSlugForUrl('parent/kl' + U(0xe4) + 'der'), 'parent/kl%c3%a4der');
    assert.equal(encodeSlugForUrl('a b?c#d'), 'a%20b%3fc%23d');
    assert.equal(encodeSlugForUrl(''), '');
  });

  test('lone surrogates do not throw', () => {
    assert.equal(encodeSlugForUrl('a' + String.fromCharCode(0xd800)), 'a%ef%bf%bd');
  });
});

describe('cjs and esm builds export the same API', () => {
  test('same export names', () => {
    assert.deepEqual(Object.keys(cjs).filter((k) => k !== '__esModule').sort(), Object.keys(esm).sort());
  });
});
