---
id: 0010
title: Component blueprint completeness enforced by a lint script
status: proposed
date: 2026-08-27
superseded_by:
---

# Context

CLAUDE.md already states the rule: every component ships a `<NAME>.md`
blueprint, stating its `classification` and `rationale`, "before
implementation is considered done." In practice, nothing checks that.
All five existing blueprints (`Badge`, `Button`, `Card`, `Foundation`,
`Input`) are still the literal TODO stub CLAUDE.md's own template
produces — `classification`/`rationale` and every section (`Intent`,
`Anatomy`, `Variants`, `States`, `Tokens used`, `Accessibility`) unwritten.
A documented convention with no mechanical check is exactly the gap ADR
0002 already named for `docs/glossary.yaml` and closed with a lint
script, and the gap ADR 0009 closed for token intent with a build-time
review gate. Blueprints had the documented discipline but not the
enforcement half of that pattern.

A bigger structural change — converting blueprints to a structured,
non-markdown format with a CLI query layer over them — was considered
and set aside as premature at Eldrin UI's current scale (5 components,
blueprints not yet written). The smaller, reversible step available now
is enforcing that the existing markdown blueprint format is actually
filled in — the same rigor `intent.yaml` already gets, without changing
the file format itself.

# Decision

- `packages/eldrin-ui/scripts/check-blueprints.mjs` (run via
  `npm run check:blueprints`, from the root or the `eldrin-ui`
  workspace) scans every `packages/eldrin-ui/src/components/<Name>/<NAME>.md`
  and fails (non-zero exit, all issues listed together) if:
  - `classification` is anything other than exactly `container` or
    `control`.
  - `rationale` is empty or still contains the literal word `TODO`.
  - Any of the required sections — `Intent`, `Anatomy`, `Variants`,
    `States`, `Tokens used`, `Accessibility` — is missing, empty, or
    still contains `TODO`.
  - A component directory has no `<NAME>.md` file at all.
- The check only verifies a section has been *written*, not that its
  content is accurate — the same shallow-but-mechanical guarantee
  `intent.yaml`'s review gate gives for `usage`/`notFor`.
- Scope for now: a manually-run script, like `lint:glossary` — not
  wired into CI or a pre-commit hook (neither exists in this repo
  yet), and not merged into `tokens:build` (blueprints aren't tokens;
  keeping the scripts separate keeps each one's failure message about
  one thing).

# Alternatives considered

- **Wire the check into `tokens:build`** — rejected: `tokens:build`
  reconciles Figma token exports; component blueprint completeness is
  an unrelated pipeline. Keeping them separate keeps a failing build
  message unambiguous about which convention broke.
- **Adopt a structured, non-markdown per-component metadata format now**
  (e.g. a typed JS/JSON file plus a CLI query layer) — rejected for
  this decision: a real option worth revisiting once the library has
  more than 5 components and the markdown blueprints prove genuinely
  hard for agents to consume reliably, but it's a bigger, less
  reversible structural change than this repo's current scale calls
  for. If pursued later, it needs its own ADR rather than folding into
  this one.
- **Content-quality checks (e.g. minimum word count, required
  sub-fields per section)** — rejected: turns a mechanical presence
  check into something that guesses at "good enough" prose, which is
  a worse false-positive/false-negative tradeoff than just catching
  the unambiguous TODO-stub case.

# Consequences

Easier: a blueprint can no longer silently ship as a TODO stub once
someone remembers to run the check — `npm run check:blueprints` names
exactly which component and which field/section is still unwritten, the
same way `lint:glossary` and `tokens:build`'s review gate already do
for their own files.

Harder: running this today fails immediately for all five existing
components, all still TODO — by design, a forcing function rather than
a quiet warning, but real friction if any of those components need to
ship before their blueprint is written (no CI/pre-commit hook exists
yet to make that friction automatic, so it depends on someone actually
running the script — same manual-enforcement gap ADR 0002 accepted for
`lint:glossary`). The check also can't catch a *wrong* classification
or a rationale that's filled in but doesn't actually justify the
container/control choice — only a human review catches that, same
limit `intent.yaml`'s gate already accepts.
