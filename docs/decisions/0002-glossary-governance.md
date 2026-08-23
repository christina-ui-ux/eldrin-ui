---
id: 0002
title: docs/glossary.yaml is the naming-decision source of truth, enforced by a lint script
status: accepted
date: 2026-08-23
superseded_by:
---

# Context

`docs/glossary.yaml` records naming decisions (which exact term won,
which terms it superseded, and why) across components, tokens, and
docs. On its own, a file like this only helps if two things are true:
someone actually checks it before introducing new terminology, and a
superseded term that sneaks into code or docs anyway gets caught. A
glossary nobody consults or nobody enforces just drifts out of sync
with the codebase the same way an un-enforced style guide does.

The glossary's own header already states the intended discipline
(check before naming something new; don't silently pick a term for a
`needs-decision` entry). What's missing is (1) a written-down decision
that this is how the project works, so it doesn't depend on someone
remembering the header comment, and (2) a mechanical way to catch
violations instead of relying on review-time attention alone.

## Decision

`docs/glossary.yaml` is the authoritative source of truth for naming
decisions in this codebase. Specifically:

- **Before introducing a new term** for a concept that might already
  have a name (a color role, a state, a structural role, an
  abbreviation), check `docs/glossary.yaml` first. If a `decided`
  entry covers it, use that term exactly — don't introduce a synonym.
- **If the concept isn't covered**, add a `needs-decision` entry rather
  than picking a term silently. The entry gets a real `decision` once
  someone actually decides.
- **Enforcement is mechanical, not just review-time**: `scripts/lint-glossary.mjs`
  (run via `npm run lint:glossary`) scans the codebase for terms a
  `decided` entry has superseded or explicitly forbidden, and warns on
  terms tied to a `needs-decision` entry so they surface before they
  quietly become the de facto choice.
- Each `decided` entry may carry a `forbidden: [...]` list (in addition
  to `supersedes`) — the explicit, structured list of strings the
  linter checks for. The linter reads this field directly rather than
  parsing the free-text `decision`/`rationale` prose, so its behavior
  doesn't depend on how a sentence happens to be worded.
- The linter treats `decided`-entry hits as errors (non-zero exit) and
  `needs-decision` hits as warnings (does not fail the run) — a
  superseded term is a known-wrong answer, an undecided term is a
  flag for a human, not a build break.
- Scope for now: `scripts/lint-glossary.mjs` is a manually-run script
  (`npm run lint:glossary`). There is no CI pipeline or pre-commit hook
  in this repo yet, so it isn't wired into either — that's a follow-up
  once those exist, not a gap in this decision.

## Alternatives considered

- **Glossary as documentation only, enforced by review** — rejected:
  this is what the glossary already was before this ADR, and the
  problem it doesn't solve is exactly what motivated writing the
  linter — a superseded term (`brand`, `critical`) is easy to miss in
  review once it's buried in a token string or prop value.
- **Parse forbidden terms out of the `decision`/`rationale` prose**
  instead of adding a `forbidden` field — rejected: makes the linter's
  behavior depend on incidental sentence phrasing (e.g. requiring
  `never '<word>' for` in the decision text), which is fragile and
  couples documentation prose to tooling behavior. An explicit field
  keeps the two concerns separate.
- **ESLint plugin/rule** instead of a standalone script — rejected for
  now: there's no ESLint (or any build tooling) configured in this
  repo yet, and the glossary needs to cover prose in `.md` files
  (blueprints, README, CLAUDE.md) as well as source, which is outside
  ESLint's normal remit. A standalone Node script covers both without
  waiting on a broader tooling setup. Revisit once ESLint exists for
  other reasons.
- **Fail the lint run on `needs-decision` usage too** — rejected: that
  would block legitimate in-progress work (e.g. drafting a component
  that needs *some* placeholder token name before caution/warning is
  settled) rather than surfacing it for a decision. A warning is
  enough to make it visible.

## Consequences

- Adding a new `decided` entry with a `supersedes` or `forbidden`
  value automatically extends lint coverage — no linter code changes
  needed for the common case.
- Entries whose forbidden alternatives can't be expressed as a
  literal string list (e.g. a structural rule rather than a word
  choice) aren't caught by this linter and still rely on review.
- `npm run lint:glossary` is a manual step until CI/pre-commit exists;
  a superseded term can still land between glossary updates and
  someone remembering to run it.
- The word/camelCase matching is a heuristic (word-boundary and
  camelCase-boundary regex, case-insensitive) — it can false-positive
  on unrelated prose (e.g. "brand" used in an ordinary English
  sentence) and won't catch every disguised form. Treat its output as
  a review aid to check, not an auto-authoritative gate.
