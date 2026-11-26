/*
 * Tests for the `ui.transform` text transforms of @multi-stores/core/personalization
 * (M173 adds 'capitalize'). Runs against the committed builds (dist/esm and
 * dist/cjs); scripts/check.mjs guarantees they equal a fresh build of src/.
 *
 *   node --test test/*.test.mjs
 *
 * Non-ASCII test strings are built with String.fromCodePoint (U()) so the file
 * stays readable without escape sequences.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, test } from 'node:test';
import * as esm from '../dist/esm/personalization/index.js';

const require = createRequire(import.meta.url);
const cjs = require('../dist/cjs/personalization/index.js');

const U = (...cps) => String.fromCodePoint(...cps);
const A_RING = U(0xe5); // a with ring
const A_RING_UP = U(0xc5);
const A_UML = U(0xe4); // a with diaeresis
const A_UML_UP = U(0xc4);
const O_UML = U(0xf6); // o with diaeresis
const O_UML_UP = U(0xd6);
const U_UML = U(0xfc); // u with diaeresis
const U_UML_UP = U(0xdc);
const SHARP_S = U(0xdf); // German sharp s (upper case is "SS")
const SHARP_S_UP = U(0x1e9e); // capital sharp s
const I_DOT_UP = U(0x130); // capital I with dot (lower case is "i" + U+0307: two code points)
const DOTLESS_I = U(0x131);
const HEART = U(0x2764);
const VS16 = U(0xfe0f);
const FIRE = U(0x1f525); // astral: one code point, two UTF-16 units
const DESERET_UP = U(0x10400); // astral letter with a case pair
const DESERET_LOW = U(0x10428);
const FI_LIGATURE = U(0xfb01); // upper case is "FI": two code points
const SIGMA_UP = U(0x3a3);

const cpLen = (s) => Array.from(s).length;

for (const [label, mod] of [['esm', esm], ['cjs', cjs]]) {
  const { capitalizeFirst, applyTextTransform, normalizeText, charCount } = mod;

  describe(`capitalizeFirst (${label})`, () => {
    test('ASCII: first letter upper, the rest lower', () => {
      assert.equal(capitalizeFirst('aNNA'), 'Anna');
      assert.equal(capitalizeFirst('ANNA'), 'Anna');
      assert.equal(capitalizeFirst('anna'), 'Anna');
    });

    test('whole value, not per word', () => {
      assert.equal(capitalizeFirst('aNNA mARIA'), 'Anna maria');
      assert.equal(capitalizeFirst('ANNA-MARIA'), 'Anna-maria');
    });

    test('empty, single character, already correct', () => {
      assert.equal(capitalizeFirst(''), '');
      assert.equal(capitalizeFirst('a'), 'A');
      assert.equal(capitalizeFirst('A'), 'A');
      assert.equal(capitalizeFirst('Anna'), 'Anna');
    });

    test('Swedish letters', () => {
      assert.equal(capitalizeFirst(`${A_RING}SA`), `${A_RING_UP}sa`);
      assert.equal(capitalizeFirst(`${A_UML_UP}LG`), `${A_UML_UP}lg`);
      assert.equal(capitalizeFirst(`${O_UML}RJAN`), `${O_UML_UP}rjan`);
      assert.equal(capitalizeFirst(`BJ${O_UML_UP}RN`), `Bj${O_UML}rn`);
      assert.equal(capitalizeFirst(`M${A_RING_UP}NS ${A_UML_UP}R`), `M${A_RING}ns ${A_UML}r`);
    });

    test('German letters: no length change for the sharp s', () => {
      assert.equal(capitalizeFirst(`${U_UML}BER`), `${U_UML_UP}ber`);
      assert.equal(capitalizeFirst(`M${U_UML_UP}LLER`), `M${U_UML}ller`);
      // A leading sharp s would upper-case to "SS": left unchanged.
      assert.equal(capitalizeFirst(`${SHARP_S}ETA`), `${SHARP_S}eta`);
      // A sharp s after the first letter is already lower case.
      assert.equal(capitalizeFirst(`STRA${SHARP_S}E`), `Stra${SHARP_S}e`);
      // The capital sharp s stays in first position and lowers elsewhere.
      assert.equal(capitalizeFirst(`${SHARP_S_UP}ETA`), `${SHARP_S_UP}eta`);
      assert.equal(capitalizeFirst(`STRA${SHARP_S_UP}E`), `Stra${SHARP_S}e`);
    });

    test('a leading digit or symbol stays, the rest is still lower-cased', () => {
      assert.equal(capitalizeFirst('1ANNA'), '1anna');
      assert.equal(capitalizeFirst('2026 ANNA'), '2026 anna');
      assert.equal(capitalizeFirst(`${HEART}ANNA`), `${HEART}anna`);
      assert.equal(capitalizeFirst('-aNNA'), '-anna');
    });

    test('leading whitespace is skipped (the server trims it anyway)', () => {
      assert.equal(capitalizeFirst('  aNNA '), '  Anna ');
      assert.equal(capitalizeFirst('   '), '   ');
    });

    test('surrogate pairs and emoji are kept whole', () => {
      assert.equal(capitalizeFirst(`${FIRE}ANNA`), `${FIRE}anna`);
      assert.equal(capitalizeFirst(`aN${FIRE}NA${HEART}${VS16}`), `An${FIRE}na${HEART}${VS16}`);
      assert.equal(capitalizeFirst(`${DESERET_LOW}${DESERET_UP}`), `${DESERET_UP}${DESERET_LOW}`);
      // A lone surrogate is passed through.
      const lone = String.fromCharCode(0xd83d);
      assert.equal(capitalizeFirst(`${lone}AB`), `${lone}ab`);
    });

    test('mappings that would change the length are left unchanged', () => {
      assert.equal(capitalizeFirst(`D${I_DOT_UP}L`), `D${I_DOT_UP}l`);
      assert.equal(capitalizeFirst(`${FI_LIGATURE}SK`), `${FI_LIGATURE}sk`);
    });

    test('locale independent: no Turkish casing', () => {
      assert.equal(capitalizeFirst('iLK'), 'Ilk');
      assert.equal(capitalizeFirst('KIZ'), 'Kiz');
      assert.equal(capitalizeFirst(`${DOTLESS_I}L`), 'Il');
    });

    test('never changes the code point count or the UTF-16 length; idempotent', () => {
      const samples = [
        '',
        'a',
        'aNNA',
        `${SHARP_S}TRA${SHARP_S_UP}E`,
        `${I_DOT_UP}STANBUL ${I_DOT_UP}`,
        `${FI_LIGATURE}${FI_LIGATURE}`,
        `${FIRE}${DESERET_UP}${DESERET_UP}`,
        `  ${A_RING}SA`,
        `1${O_UML_UP}${U_UML_UP}`,
        `${HEART}${VS16}EVA`,
        `${U(0x149)}AB`,
        `${U(0x1f0)}X`,
        `${U(0x390)}${SIGMA_UP}`,
        `${U(0x39f)}${U(0x394)}${U(0x39f)}${SIGMA_UP}`,
        `${U(0x1c4)}${U(0x1c5)}${U(0x1c6)}`,
      ];
      for (const s of samples) {
        const out = capitalizeFirst(s);
        assert.equal(out.length, s.length, `UTF-16 length of ${JSON.stringify(s)}`);
        assert.equal(cpLen(out), cpLen(s), `code points of ${JSON.stringify(s)}`);
        assert.equal(charCount(out), charCount(s), `charCount of ${JSON.stringify(s)}`);
        assert.equal(capitalizeFirst(out), out, `idempotent for ${JSON.stringify(s)}`);
      }
    });
  });

  describe(`applyTextTransform / normalizeText (${label})`, () => {
    test('capitalize uses capitalizeFirst', () => {
      assert.equal(applyTextTransform('aNNA', 'capitalize'), 'Anna');
      assert.equal(normalizeText('  aNNA  ', 'capitalize'), 'Anna');
      assert.equal(normalizeText(`eVA${HEART}${VS16}`, 'capitalize'), `Eva${HEART}`);
      // Decomposed input is composed first, then capitalized.
      assert.equal(normalizeText(`a${U(0x30a)}SA`, 'capitalize'), `${A_RING_UP}sa`);
    });

    test('uppercase, none, absent and unknown values behave as before', () => {
      assert.equal(applyTextTransform(`stra${SHARP_S}e`, 'uppercase'), 'STRASSE');
      assert.equal(normalizeText(` ${A_RING}sa `, 'uppercase'), `${A_RING_UP}SA`);
      for (const tr of ['none', undefined, null, 'Capitalize', 'title', '']) {
        assert.equal(applyTextTransform('aNNA', tr), 'aNNA');
        assert.equal(normalizeText(' aNNA ', tr), 'aNNA');
      }
    });

    test('normalizeText is stable when run on its own output', () => {
      for (const s of [' aNNA ', `${SHARP_S}TRA${SHARP_S_UP}E`, `1${A_RING_UP}SA`, `${FIRE}ANNA`]) {
        const once = normalizeText(s, 'capitalize');
        assert.equal(normalizeText(once, 'capitalize'), once);
      }
    });
  });
}
