---
id: 0005
title: packages/eldrin-ui exposes a single public entry point (barrel + package.json exports)
status: proposed
date: 2026-08-23
superseded_by:
---

# Context

Until now, `packages/eldrin-ui/package.json` had no `main`, `types`, or
`exports` field, and there was no `src/index.ts` — nothing outside the
package itself ever imported from it, so there was nothing to resolve.
The library is now starting to be consumed by other workspace members, so
it needs a real, resolvable module for a consumer to import from.

## Decision

- `packages/eldrin-ui/src/index.ts` is the library's single public entry
  point — a barrel re-exporting every component and its prop type
  (`Foundation`, `Button`, `Input`, `Badge`, `Card`, and their `*Props`
  types).
- `packages/eldrin-ui/package.json` declares `"main"`, `"types"`, and
  `"exports": { ".": "./src/index.ts" }`, all pointing directly at that
  file — no build step; consumers resolve straight to TypeScript source
  (their own bundler transforms it on demand). This is a pre-publish
  state — revisit once the library is actually built/published as a real
  package.
- Every component added to the library must be re-exported from this
  barrel to be reachable by any consumer — that's the rule other
  components now implicitly follow.

## Alternatives considered

- **Per-component subpath exports** (`eldrin-ui/Button`, `eldrin-ui/Input`,
  ...) instead of one barrel — rejected for now: better tree-shaking
  granularity, but adds real ceremony (an `exports` map entry per
  component) for a library that's still only 5 components. Revisit if
  component count and bundle-size pressure both grow enough to justify it.
- **No defined entry point** (consumers reach directly into
  `packages/eldrin-ui/src/components/<Name>/<Name>.tsx`) — rejected:
  bypasses the package boundary entirely, and would break every consumer's
  imports the moment an internal file moves.

## Consequences

- `import { Button } from 'eldrin-ui'` resolves for any workspace member.
- Type-checking a consumer now transitively type-checks
  `packages/eldrin-ui/src/**` under the consumer's own `tsconfig` rules —
  this already surfaced one real issue (unused `props` params in
  components whose implementation is still pending), fixed by prefixing
  them with `_`.
- Adding a new component isn't "done" from a consumption standpoint until
  it's re-exported from `src/index.ts`, in addition to shipping its
  blueprint per the root `CLAUDE.md`'s existing convention.
