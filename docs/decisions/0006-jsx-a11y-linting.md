---
id: 0006
title: Accessibility lint rules (jsx-a11y) are enforced on packages/eldrin-ui via oxlint
status: proposed
date: 2026-08-24
superseded_by:
---

# Context

Every component blueprint (`<NAME>.md`) carries an `## Accessibility`
section, but nothing checked that a component actually met it — component
implementations are still pending, so there was no automated a11y signal
anywhere in the repo, and `packages/eldrin-ui` had no lint configuration
at all (only `apps/playground` did, via `oxlint`).

Two real options for closing that gap: static lint rules that run on every
JSX write, or a runtime test suite (component render + `axe`) that asserts
against the blueprint's `Accessibility` section directly. The runtime
route needs an actual test framework, which the repo doesn't have yet, and
is far more valuable once components render real markup.

## Decision

- `packages/eldrin-ui` gets its own `.oxlintrc.json`, enabling the
  `jsx-a11y` plugin (built into `oxlint`, already the toolchain used by
  `apps/playground` — no second linter/toolchain added) alongside the
  `react`, `typescript`, and `oxc` plugins already used there.
- `apps/playground`'s existing `.oxlintrc.json` also enables `jsx-a11y`,
  since prototype code renders real markup too.
- `packages/eldrin-ui/package.json` gains a `lint` script (`oxlint`) and
  `oxlint` as a devDependency, matching the version range already used by
  `apps/playground`.
- This is a floor, not the full a11y story: it catches static JSX mistakes
  (missing `alt`, bad `aria-*`, non-interactive elements with click
  handlers, etc.) but not runtime/interaction issues like focus order or
  dynamic `aria` state changes.

## Alternatives considered

- **`eslint-plugin-jsx-a11y` (via ESLint)** — rejected: would add a second
  lint toolchain running alongside `oxlint` for one plugin's worth of
  rules, when `oxlint` already ships equivalent `jsx-a11y` rules natively.
- **Runtime a11y tests now (`vitest` + `@testing-library/react` +
  `axe`)** — rejected for now: component implementations are still
  pending, so there's no real markup yet for `axe` to assert against, and
  this would also be the repo's first test framework, itself a build
  pipeline decision worth its own ADR at the point it's actually needed.
  Revisit once components render real markup and blueprint `Accessibility`
  sections have real content — likely alongside that same ADR.
- **Storybook + its a11y addon** — rejected: evaluated separately: for a
  5-component library with no visual-regression or CSF-driven workflow
  need yet, Storybook would duplicate what `apps/playground` (live
  prototyping) and `docs/` (blueprint presentation) already cover, purely
  to get an a11y addon that `oxlint`'s `jsx-a11y` plugin already provides
  at lint time.

## Consequences

- `npm run lint` in `packages/eldrin-ui` now catches static a11y mistakes
  at write time, in the actual library source — previously only
  `apps/playground` was linted at all.
- Every new component's JSX is checked against `jsx-a11y` rules as soon as
  it's written, before any implementation is considered done.
- Static rules can't catch everything a blueprint's `Accessibility`
  section might require (e.g. correct focus management on open/close) —
  that gap stays open until runtime a11y testing is added.
