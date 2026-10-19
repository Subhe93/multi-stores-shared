#!/usr/bin/env node
/*
 * Package check (M5.3), run by `npm test` in packages/core:
 *   1. src/designer/renderer-hash.ts pins the current renderer source;
 *   2. the committed dist/ equals a fresh build of src/ (no stale dist);
 *   3. no sibling app repo (multi-stores-api/-web/-dashboard, when checked
 *      out next to multi-stores-shared) carries a copy of a package module.
 */
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { build, HASH_FILE, lf, pkgRoot, rendererHashModule } from './build.mjs';
import { findCopies } from '../tools/check-no-copies.mjs';

const failures = [];

if (!existsSync(HASH_FILE) || lf(readFileSync(HASH_FILE, 'utf8')) !== rendererHashModule()) {
  failures.push('src/designer/renderer-hash.ts is stale (run `npm run build`)');
}

function list(dir, base = dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) list(p, base, out);
    else out.push(relative(base, p).replace(/\\/g, '/'));
  }
  return out.sort();
}

const tmp = mkdtempSync(join(tmpdir(), 'ms-core-'));
try {
  // Build into a temp dir without touching the committed hash file.
  build(join(tmp, 'dist'), { writeHash: false });
  const fresh = list(join(tmp, 'dist'));
  const committed = list(join(pkgRoot, 'dist'));
  if (fresh.join('\n') !== committed.join('\n')) {
    failures.push(`dist/ file list differs from a fresh build (run \`npm run build\`)`);
  } else {
    for (const f of fresh) {
      const a = lf(readFileSync(join(tmp, 'dist', f), 'utf8'));
      const b = lf(readFileSync(join(pkgRoot, 'dist', f), 'utf8'));
      if (a !== b) failures.push(`dist/${f} is stale (run \`npm run build\`)`);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

const workspace = resolve(pkgRoot, '../../..');
const repos = ['multi-stores-api', 'multi-stores-web', 'multi-stores-dashboard']
  .map((r) => join(workspace, r))
  .filter((r) => existsSync(r));
for (const f of findCopies(repos)) failures.push(`${relative(workspace, f.file)}: ${f.reason}`);

if (failures.length > 0) {
  console.error(`@multi-stores/core check failed (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`@multi-stores/core OK: dist matches src, renderer hash pinned, no copies in ${repos.length} app repo(s).`);
