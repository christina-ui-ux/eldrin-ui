---
id: 0004
title: Root is an npm workspace root; library lives in packages/eldrin-ui, docs/ joins the workspace
status: proposed
date: 2026-08-23
superseded_by:
---

# Context

The repo started as two disconnected npm projects: the component library at
repo root (`src/tokens/`, `src/components/`, root `package.json`), and
`docs/` as a fully standalone Astro project with its own `package.json`,
lockfile, and `node_modules` (decided in [[0003]] — see that ADR's Decision
section, "not an npm workspace tied to the root `package.json`"). `0003`
named this as a "for now" call, to be revisited "if/when the root project
grows real tooling that the docs site would also want to share."

Two things changed since `0003`: the docs site is now itself an install
target with real tooling (Astro/Tailwind/Vite), and the design system is
intended to eventually be published as an npm package to consumers outside
this repo. Publishing a package cleanly wants an unambiguous package
boundary — "this directory is what ships" — which the flat root layout
doesn't give. This is also, structurally, the cheapest point at which to
make this move: every component under `src/` was still a `TODO`-stubbed
placeholder with no real implementation, and nothing in `docs/src/**`
imported from root `src/` or vice versa, so there is no cross-project
coupling to untangle.

## Decision

- **The repo root is a private npm workspace root**: root `package.json` is
  `"private": true`, has no `dependencies` of its own beyond shared
  root-level tooling (currently just `yaml`, used by
  `scripts/lint-glossary.mjs`), and declares `"workspaces": ["packages/*",
  "docs"]`.
- **The component library lives at `packages/eldrin-ui/`** (`packages/eldrin-ui/src/tokens/`,
  `packages/eldrin-ui/src/components/<Name>/`), with its own
  `packages/eldrin-ui/package.json` (`name: "eldrin-ui"`). This is the
  directory that will eventually be published — it stays `"private": true`
  until that's an actual decision to publish, not a side effect of this
  restructure.
- **`docs/` joins the workspace** as a sibling package
  (`docs/package.json`, unchanged: `name: "eldrin-ui-docs"`,
  `"private": true`). It keeps its own `astro.config.mjs`, `src/`,
  `decisions/`, and `glossary.yaml` exactly where `0003` put them — only
  its dependency installation moves to the workspace root.
- **One hoisted `node_modules/` and one root `package-lock.json`** cover
  both packages. `docs/node_modules` and `docs/package-lock.json` are
  deleted; installs and workspace-scoped commands (`npm run dev -w docs`)
  run from repo root.
- Everything else `0003` decided — Astro as the site, GitHub Pages hosting
  via `withastro/action` + `actions/deploy-pages`, `docs/decisions/` and
  `docs/glossary.yaml` read in place via the content-collection `glob()`
  loader, hand-built (non-Starlight) chrome, the relative-link requirement
  inside markdown body content — is unchanged and still in effect. This ADR
  only revises the "standalone install, not a workspace" part of that
  decision.

## Alternatives considered

- **Leave the two projects separate (status quo)** — rejected: this is
  exactly the condition `0003` named as the trigger to revisit ("if/when
  the root project grows real tooling that the docs site would also want to
  share"), and that condition has now arrived.
- **pnpm or Turborepo workspaces** — rejected: two packages don't need a
  task-graph runner or a different package manager; plain npm workspaces
  cover "one install, one lockfile, one place to run scoped scripts" with
  no added tooling.
- **Defer the restructure until closer to actually publishing** — rejected:
  every component currently is an empty stub and nothing imports across the
  `docs/` ↔ library boundary, so this is the lowest-friction point this
  move will ever be at. Waiting only adds more files, more cross-references,
  and (once `docs/` is committed) more git history to carry through the
  move.

## Consequences

- `.github/workflows/deploy-docs.yml` needs no change: its `path: docs`
  input to `withastro/action` already scopes install/build to `docs/`
  internally, and its `paths: ['docs/**', ...]` trigger filter still means
  library-only changes under `packages/eldrin-ui/**` don't trigger a Pages
  deploy.
- Local setup is now `npm install` once at repo root, not a separate
  install inside `docs/`.
- `scripts/lint-glossary.mjs`'s default scan target changed from `src/` to
  `packages/` (recursive, so it still reaches
  `packages/eldrin-ui/src/**`).
- Future packages (if any) live under `packages/*` and are picked up by the
  existing `workspaces` glob with no further config changes.
