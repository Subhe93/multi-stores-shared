/*
 * Tests for @multi-stores/core/link-ref (M165 store link references).
 * Runs against the committed builds (dist/esm and dist/cjs).
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { describe, test } from 'node:test';
import * as esm from '../dist/esm/link-ref/index.js';

const require = createRequire(import.meta.url);
const cjs = require('../dist/cjs/link-ref/index.js');

const ID = '0f8b2c4e-1a2b-4c3d-8e9f-a0b1c2d3e4f5';

for (const [name, mod] of [['esm', esm], ['cjs', cjs]]) {
  const { parseStoreLinkRef, isStoreLinkRef, formatProductRef, PRODUCT_REF_RE } = mod;
  describe(`link-ref (${name})`, () => {
    test('parses a plain product reference', () => {
      assert.deepEqual(parseStoreLinkRef(`product:${ID}`), { kind: 'product', id: ID, tail: '' });
    });
    test('uppercase id and scheme are accepted, id is lowercased', () => {
      assert.deepEqual(parseStoreLinkRef(`PRODUCT:${ID.toUpperCase()}`), { kind: 'product', id: ID, tail: '' });
    });
    test('keeps a query or hash tail', () => {
      assert.equal(parseStoreLinkRef(`product:${ID}?variant=3#reviews`).tail, '?variant=3#reviews');
      assert.equal(parseStoreLinkRef(`product:${ID}#x`).tail, '#x');
    });
    test('ignores surrounding whitespace', () => {
      assert.equal(parseStoreLinkRef(`  product:${ID}  `).id, ID);
    });
    test('rejects malformed values', () => {
      for (const v of ['product:', 'product:abc', `product:${ID}x`, `product:${ID}/x`, 'javascript:alert(1)',
        `product:javascript:alert(1)`, `/products/${ID}`, '', null, undefined, 42, {}]) {
        assert.equal(parseStoreLinkRef(v), null, String(v));
      }
    });
    test('reserved kinds are refs but not parsed', () => {
      assert.equal(parseStoreLinkRef(`collection:${ID}`), null);
      assert.equal(isStoreLinkRef(`collection:${ID}`), true);
      assert.equal(isStoreLinkRef(`page:${ID}#a`), true);
      assert.equal(isStoreLinkRef(`product:${ID}`), true);
      assert.equal(isStoreLinkRef('product:abc'), false);
      assert.equal(isStoreLinkRef('https://x.se'), false);
      assert.equal(isStoreLinkRef('mailto:a@b.se'), false);
    });
    test('formatProductRef round trip', () => {
      assert.equal(formatProductRef(ID.toUpperCase()), `product:${ID}`);
      assert.equal(formatProductRef(ID, '?a=1'), `product:${ID}?a=1`);
      assert.equal(formatProductRef(ID, 'bad'), `product:${ID}`);
      const back = parseStoreLinkRef(formatProductRef(ID, '#h'));
      assert.deepEqual(back, { kind: 'product', id: ID, tail: '#h' });
      assert.ok(PRODUCT_REF_RE.test(formatProductRef(ID)));
    });
  });
}
