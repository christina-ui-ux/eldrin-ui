# CLAUDE.md

AI context for Claude Code working in this repo.

## Project

Eldrin UI — a React component library that ships design tokens with intent
metadata and components with machine-readable blueprints, so both humans and
AI agents can reason about *why* a token or component exists, not just *what*
it renders.

## Stack

- React + TypeScript
- Tailwind CSS v4
- Vite
- No ShadCN — every component is built from scratch

## Structure

- npm workspace root (`package.json`, `"workspaces": ["packages/*", "apps/*", "docs"]`)
- `packages/eldrin-ui/src/tokens/` — design tokens with intent metadata
- `packages/eldrin-ui/src/components/<Name>/` — component + its blueprint (`<NAME>.md`) + types
- `apps/playground/` — Vite app for prototyping against the library (workspace-linked to `packages/eldrin-ui`, never published)
- `docs/` — Astro docs site, workspace member

## Conventions

- Every component ships a `<NAME>.md` blueprint alongside its `.tsx` and
  `.types.ts` files before implementation is considered done. Each
  blueprint states its `classification` (container/control) and the
  `rationale` behind it — the rationale is also what determines which
  token set the component draws from: `container` uses `bg-surface-*`
  + base text/icon tokens, `control` uses `bg-fill-*` + `onFill`
  text/icon tokens (see `docs/decisions/0001-component-token-set-selection.md`).
- Every design token should document intent (what it's for, what it's not
  for) and accessibility requirements.

See `DESIGN.md` for design-system context aimed at designers and Figma.

## Architecture Decision Records

Significant structural decisions — token architecture, classification
rules, file/folder conventions, build pipeline changes, naming
conventions — are recorded in `docs/decisions/`, one file per decision,
using `docs/decisions/template.md`. Files are named
`NNNN-short-title.md` with a zero-padded, sequential id
(e.g. `0001-token-naming-convention.md`) — the id is part of the
filename, not just the frontmatter, so the highest existing id is a
directory listing away.

**Before proposing a structural change:**
List `docs/decisions/` and check whether the topic is already covered.
If an ADR addresses it, treat its decision as current unless there's
genuinely new information — don't silently re-propose an alternative
that's already documented as rejected in that ADR's "Alternatives
considered" section.

**When you make a significant structural change:**
Write a new ADR from the template, numbered sequentially (highest
existing id + 1), alongside the change itself. Draft it and let Isy
confirm before treating it as settled — not because it needs approval,
but because a structural decision an agent commits without a human
actually reading it defeats the point of writing it down at all.

**What counts as "significant" (needs an ADR) vs. not:**
Classifying a single new component as container/control does NOT need
an ADR — that's covered by its own `classification` and `rationale`
fields in the component's `<NAME>.md` blueprint. An ADR is for
decisions that change the *rules* other components will follow.

**If a decision is later reversed:**
Do not delete or edit the old ADR. Set its `status` to `superseded` and
`superseded_by` to the new ADR's id.
