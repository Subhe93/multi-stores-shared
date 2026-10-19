# `@multi-stores/core` — the shared package (M5.3)

One copy of the pure modules that the api, the storefront (web) and the
dashboard must run identically. It replaced the byte-copied "mirror" files and
the `scripts/sync-*.mjs` scripts that kept them in sync.

Location: `multi-stores-shared/packages/core` (its own `package.json`, no
dependencies, not a workspace).

## What lives there

| Import path | Source | Used by |
|---|---|---|
| `@multi-stores/core/designer` | `src/designer/design-renderer.ts` (RENDERER_VERSION, `renderDesign`, template/state types) | api (server render page + services), web (designer, lazy chunk), dashboard (template editor, previews) |
| `@multi-stores/core/designer/hash` | `src/designer/renderer-hash.ts` (generated `RENDERER_SHA256`) | package/app specs only |
| `@multi-stores/core/personalization` | barrel of the five modules below | web, dashboard |
| `@multi-stores/core/personalization/rules` | M4.0 field rules (`validatePersonalization`, `charCount`, patterns, error codes, ...) | api, web, dashboard (`src/lib/customFields.ts` re-exports a subset) |
| `@multi-stores/core/personalization/types` · `/conditions` · `/evaluator` · `/display` | M4.1 evaluator and grouped display | api, web |
| `@multi-stores/core/fixtures/personalization.vectors.json` | M4.0 rule vectors | api `rules.spec.ts`, web `rules.spec.ts` |
| `@multi-stores/core/fixtures/personalization-cases.json` | M4.1 evaluator cases | api `evaluator.spec.ts`, web `evaluator.spec.ts` |
| `@multi-stores/core/tools/check-no-copies.mjs` | mirror guard (CLI) | app specs / dashboard check script, `scripts/check.mjs` |

The legacy root package `@multi-stores/shared` (`src/types`, `src/constants`,
...) is unchanged and still not installed by any app; its hand-maintained
"Mirror of ... keep in sync" counterparts in the apps (store-apps registry,
b2b/invoice/market types) are not part of this package yet.

## Package layout and build

```
packages/core/
  src/                 TypeScript sources (relative imports end in .js)
  fixtures/            JSON vectors/cases run by the app specs
  dist/esm/            ES modules  -> "import" condition (Next/Turbopack, vitest, Node ESM)
  dist/cjs/            CommonJS    -> "require" condition (Nest build, jest, api runtime)
  dist/types/          declarations -> "types" condition
  scripts/build.mjs    regenerates src/designer/renderer-hash.ts, then tsc twice
  scripts/check.mjs    dist == fresh build, hash pinned, no copies in the sibling apps
  tools/check-no-copies.mjs
```

`dist/` is **committed** (see `.gitignore`), so neither the apps nor the
production server ever build this package: `git pull` is enough. The build
uses the TypeScript of `multi-stores-shared/node_modules`.

## How to change a shared module

1. Edit the file under `packages/core/src/` (never a copy in an app — there
   are none, and the guard fails if one appears).
2. `cd multi-stores-shared/packages/core && npm run build` (rewrites `dist/`
   and, for the renderer, `src/designer/renderer-hash.ts`).
3. Renderer only: if the drawn output changes, bump `RENDERER_VERSION` and
   regenerate the goldens (api `design-renderer.golden.spec.ts`; the web
   golden spec and the api parity spec must then pass unchanged).
4. `npm test` here (from the repo root or `packages/core`): fails on a stale
   `dist/`, a stale hash or a copy in a sibling app.
5. Run the app suites that use the module (api `npx jest`, web `npm test`,
   dashboard `npm test`). No app change is needed unless an exported API
   changed. Commit shared together with any app commits that depend on it.

`RENDERER_SHA256` keeps its meaning: the sha256 of `design-renderer.ts` with
LF line endings. It identifies the renderer source the committed build was
made from; the api and web `core-package` specs compare it with the source in
the linked package, so a forgotten `npm run build` fails their tests too.

## How each app consumes it

All three declare `"@multi-stores/core": "file:../multi-stores-shared/packages/core"`
in `dependencies`; `npm install`/`npm ci` creates a symlink (a junction on
Windows) in `node_modules/@multi-stores/core`. **Never delete
`node_modules` through a tool that follows junctions/symlinks**: it would
empty this package in the shared repo.

- **api** (NestJS, CommonJS, `moduleResolution: nodenext`): imports
  `@multi-stores/core/...` and gets `dist/cjs` + `dist/types`. The designer
  render page serves `require.resolve('@multi-stores/core/designer')` (the
  zero-import CJS file) as `/renderer.js` (`render-page.ts`). Jest loads the
  same CJS files (they are excluded from ts-jest by `transformIgnorePatterns`).
  Specs: `src/common/core-package.spec.ts` (resolution, renderer hash, mirror
  guard), `common/personalization/{rules,evaluator}.spec.ts` (vectors/cases),
  `modules/designer/render/design-renderer.parity.golden.spec.ts` (server CJS
  build vs the ESM build the web bundles).
- **web** (Next 16/Turbopack, vitest): imports `@multi-stores/core/...` and
  gets `dist/esm`. `next.config.ts` sets `turbopack.root` and
  `outputFileTracingRoot` to the parent folder of the repos, because
  Turbopack only reads files inside its root. The renderer is imported only by
  the designer components, which product pages load lazily (`next/dynamic`),
  so plain product pages ship no renderer code. Specs:
  `src/lib/designer/core-package.spec.ts`,
  `src/lib/personalization/{rules,evaluator}.spec.ts`.
- **dashboard** (Next 16/Turbopack, node:test): imports
  `@multi-stores/core/designer` and, through `src/lib/customFields.ts`,
  `@multi-stores/core/personalization/rules`; same `next.config.ts` root
  setting as the web. `npm test` (also the `prebuild`) runs
  `scripts/check-personalization-codes.mjs`: every error code of the package
  has a message in the six locales, and the mirror guard passes.

## Mirror guard

`tools/check-no-copies.mjs <repoRoot>...` scans `src/`, `test/`, `scripts/`
and `prisma/` of each repo and fails when a file contains a full package
source/fixture, shares 25+ long lines with the package sources (partial or
outdated copy), or carries an old mirror marker (`MIRROR (M4`,
`BEGIN MIRROR`, files generated by the removed sync scripts).

## Production

The four repos are sibling directories on the server too. Pull
`multi-stores-shared` before building the apps; nothing is built in it. See
`multi-stores-api/docs/DEPLOY-M4.md` §10.
