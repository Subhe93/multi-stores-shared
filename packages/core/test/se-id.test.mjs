/*
 * Tests for @multi-stores/core/se-id (personnummer, samordningsnummer,
 * org number, Luhn). Runs against the committed builds (dist/esm and
 * dist/cjs); scripts/check.mjs guarantees they equal a fresh build of src/.
 *
 *   node --test test/*.test.mjs
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, test } from 'node:test';
import * as esm from '../dist/esm/se-id/index.js';

const require = createRequire(import.meta.url);
const cjs = require('../dist/cjs/se-id/index.js');

const PERSONNUMMER = [
  // [input, expected parse result or null, note]
  ['811218-9876', { digits10: '8112189876', century: null, samordning: false }, 'classic 10 digits with hyphen'],
  ['8112189876', { digits10: '8112189876', century: null, samordning: false }, '10 digits, no separator'],
  [' 811218 - 9876 ', { digits10: '8112189876', century: null, samordning: false }, 'whitespace ignored'],
  ['121212+1212', { digits10: '1212121212', century: null, samordning: false }, '"+" separator (100+ years)'],
  ['19121212-1212', { digits10: '1212121212', century: 19, samordning: false }, '12 digits with hyphen'],
  ['191212121212', { digits10: '1212121212', century: 19, samordning: false }, '12 digits, no separator'],
  ['890161-2344', { digits10: '8901612344', century: null, samordning: true }, 'samordningsnummer (day 61)'],
  ['000229-1235', { digits10: '0002291235', century: null, samordning: false }, '29 Feb 2000 (leap candidate)'],
  ['20000229-1235', { digits10: '0002291235', century: 20, samordning: false }, '29 Feb 2000, 12 digits'],
  ['811218-9877', null, 'bad Luhn'],
  ['19000229-1235', null, '29 Feb 1900 is not a date'],
  ['010229-1234', null, '29 Feb in 1801/1901/2001: never a leap year'],
  ['811318-9876', null, 'month 13'],
  ['810001-0000', null, 'month 00'],
  ['810431-0000', null, '31 April'],
  ['811232-0000', null, 'day 32'],
  ['811292-0000', null, 'day 92 (beyond samordning range)'],
  ['811200-0000', null, 'day 00'],
  ['17811218-9876', null, 'century 17'],
  ['18121212-1212', null, 'century 18 (born in the 1800s)'],
  ['20301231-1233', null, 'birth date in the future (12 digits)'],
  ['000229+1235', null, '"+" puts 29 Feb in 1900: not a date'],
  ['19811218+9876', null, '"+" only in the 10-digit form'],
  ['811218-987', null, 'too short'],
  ['81121898761', null, '11 digits'],
  ['8112-18-9876', null, 'separator in the wrong place'],
  ['abcdef-ghij', null, 'letters'],
  ['', null, 'empty'],
];

for (const [label, mod] of [['esm', esm], ['cjs', cjs]]) {
  describe(`se-id (${label})`, () => {
    test('parsePersonnummer vectors', () => {
      for (const [input, expected, note] of PERSONNUMMER) {
        assert.deepEqual(mod.parsePersonnummer(input), expected, `${note}: ${JSON.stringify(input)}`);
        assert.equal(mod.isValidPersonnummer(input), expected !== null, note);
      }
    });

    test('dates are checked against now (injected)', () => {
      const now = new Date(2026, 10, 15, 12, 0, 0);
      // 12 digits: today passes, tomorrow does not.
      assert.deepEqual(mod.parsePersonnummer('20261115-1230', now), {
        digits10: '2611151230',
        century: 20,
        samordning: false,
      });
      assert.equal(mod.parsePersonnummer('20261116-1239', now), null);
      assert.equal(mod.isValidPersonnummer('20261116-1239', now), false);
      // 10 digits: a date later this year resolves to the previous century.
      assert.notEqual(mod.parsePersonnummer('261201-1235', now), null);
      assert.notEqual(mod.parsePersonnummer('261115-1230', now), null);
      // Tomorrow with "-" is 1926 (valid); the same with "+" is 1826 (valid date).
      assert.notEqual(mod.parsePersonnummer('261116-1239', now), null);
      // 29 Feb 2000 with "-" passes; with "+" it is 1900 (not a leap year).
      assert.notEqual(mod.parsePersonnummer('000229-1235', now), null);
      assert.equal(mod.parsePersonnummer('000229+1235', now), null);
    });

    test('non-string input is invalid', () => {
      for (const v of [null, undefined, 8112189876, {}, []]) {
        assert.equal(mod.parsePersonnummer(v), null);
        assert.equal(mod.isValidPersonnummer(v), false);
      }
    });

    test('luhnValid', () => {
      assert.equal(mod.luhnValid('5560160680'), true);
      assert.equal(mod.luhnValid('8112189876'), true);
      assert.equal(mod.luhnValid('8112189877'), false);
      assert.equal(mod.luhnValid('0'), true);
      assert.equal(mod.luhnValid(''), false);
      assert.equal(mod.luhnValid('55601606a0'), false);
    });

    test('normalizeSwedishOrgNumber', () => {
      assert.equal(mod.normalizeSwedishOrgNumber('556016-0680'), '5560160680');
      assert.equal(mod.normalizeSwedishOrgNumber('5560160680'), '5560160680');
      assert.equal(mod.normalizeSwedishOrgNumber(' 556016 0680 '), '5560160680');
      assert.equal(mod.normalizeSwedishOrgNumber('165560160680'), '5560160680');
      assert.equal(mod.normalizeSwedishOrgNumber('198112189876'), '8112189876');
      assert.equal(mod.normalizeSwedishOrgNumber('218112189876'), null);
      assert.equal(mod.normalizeSwedishOrgNumber('12345'), null);
      assert.equal(mod.normalizeSwedishOrgNumber('55601A-0680'), null);
    });
  });
}
