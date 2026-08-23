# CLAUDE.md — apps/playground

AI context for Claude Code working specifically in this workspace member.
See the root `CLAUDE.md` and `DESIGN.md` for the design system's own
conventions — this file only covers what's different in here.

## Purpose

This app exists to test whether `eldrin-ui` can actually be prototyped
with — building real screens against the library (imported live from
`packages/eldrin-ui`, no publish step) to see whether a token or component
holds up in practice.

## What belongs here vs. in the design system

- **Stays in `apps/playground`**: anything specific to whatever is being
  prototyped — screen layouts, business logic, copy, one-off styling. This
  code is disposable and is *not* held to the library's blueprint or
  token-intent conventions; it's a consumer, not part of the system.
- **Goes back to `packages/eldrin-ui`**: anything a prototype reveals
  that's actually about the design system itself — a missing token, a
  component variant that should exist, a classification that doesn't hold
  up under real use. That becomes a change to the library (an updated
  blueprint, token, or — if it changes a *rule* other components follow —
  a new ADR, per the root `CLAUDE.md`'s process), not a local workaround
  left sitting in playground code.

When a prototype surfaces a design-system finding, say so explicitly
rather than quietly patching around it here.

## Structure

Each distinct prototype scenario is self-contained under
`src/prototypes/<slug>/`:

- `index.tsx` — default-exports the prototype's root component.
- `NOTES.md` (optional) — what this prototype is testing and any findings,
  written for a human/AI landing here later, not just the prototype's
  author in the moment.

New prototypes are registered in `src/prototypes/index.ts` (one array
entry: `slug`, `title`, `description`, lazy-loaded `Component`) — that
list drives both routing and the home page's link list, so adding a
prototype never means hand-wiring a route. `App.tsx` and `main.tsx` are
shared app shell (routing, layout) — prototype-specific code never lives
there.
