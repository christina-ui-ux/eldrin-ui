---
id: 0015
title: Token intent metadata lives inline in tokens-source/, not a separate intent.yaml
status: proposed
date: 2026-09-17
superseded_by:
---

# Context

ADR 0009 put per-token intent metadata (`usage`/`notFor`/`pairsWith`/
`status`) in a separate file, `packages/eldrin-ui/src/tokens/
intent.yaml`, keyed by an id that identified the token without touching
its value. The reason it had to be a *separate* file at all: under ADR
0008, `tokens-source/` was a raw Figma export, "never hand-edited" —
there was nowhere in the token JSON itself to write prose into.

ADR 0013 removed that constraint. `tokens-source/` is now hand-authored
directly in this repo; nothing about it is Figma-generated or
off-limits to edit. ADR 0014 (this same session) had already re-keyed
`intent.yaml` from a Figma `variableId` to the token's own path, but
kept it as a second file — worth revisiting given the file no longer
needs to exist for the reason it was created. Asked directly ("can we
solve this any other way?"), the answer is yes: DTCG tokens already
have a standard field for this, `$description`, plus `$extensions` for
anything structured beyond a single description string. Style
Dictionary + `@tokens-studio/sd-transforms` (ADR 0013's toolchain)
preserve both untouched through preprocessing and reference resolution
— verified directly (a token carrying `$description` and a
`$extensions["com.eldrin-ui.intent"]` block still has both, unchanged,
on `token.original` after `getPlatformTokens()`).

# Decision

- **`intent.yaml` is deleted.** Intent metadata for a semantic token
  lives directly on that token in `tokens-source/semantic.json`:
  - `$description` holds `usage` — DTCG's own field for this, not a
    custom one.
  - `$extensions["com.eldrin-ui.intent"]` holds everything else:
    `status` (`stable`/`experimental`/`deprecated`), `notFor`,
    `pairsWith` (list of CSS var names / dot paths), and — only once
    `status` is `deprecated` — `deprecated.replacement`. Namespaced
    under `com.eldrin-ui.*` per the DTCG convention for vendor
    extensions (the same pattern Figma used for `com.figma.*` under
    the old pipeline).
- **`role`/`classification` are dropped entirely, not relocated.**
  ADR 0009 stored them as derived, kept-in-sync labels for a human
  scanning a separate file with no other context. Inline, the token's
  own path (`bg.fill.interaction`) is right there next to its intent —
  recomputing role/classification from it on demand (same formula as
  before, see glossary's "semantic token naming formula" /
  "container / control" entries) costs nothing and has nothing left to
  drift out of sync.
- **No more reconciliation or stubbing.** ADR 0009's `tokens:build`
  used to write a stub entry into `intent.yaml` the first time it saw
  an unfamiliar token, because that token could have arrived from an
  export the author didn't type themselves. Under ADR 0013 every
  semantic token is typed into `tokens-source/semantic.json` by a human
  in the first place — they can write its `$description`/`$extensions`
  in the same edit. `tokens:build` now only reads and validates; it
  never writes back into `tokens-source/`.
- **The build gate is unchanged in substance, just re-targeted**:
  `tokens:build` still fails if any semantic token is
  `status: experimental` (the implicit default when
  `com.eldrin-ui.intent` is absent), `stable` with `$description` or
  `notFor` empty, or `deprecated` with no `deprecated.replacement`.
  Component/primitive/scale tokens are still excluded, for the same
  reasons ADR 0009 gave.
- `docs/glossary.yaml`'s "token intent metadata" entry and `DESIGN.md`
  are updated to describe the inline shape in place of a separate file.

# Alternatives considered

- **Keep `intent.yaml` as a separate file, just re-keyed (ADR 0014)**
  — this was this session's own prior decision, reversed on direct
  follow-up ("can we solve this any other way?"). It preserved a
  sync/key-matching problem (a rename requires editing two files in
  the same PR, per ADR 0014's own Consequences) that inlining removes
  outright — nothing to key-match when there's only one file.
- **Only `$description`, no `$extensions` block** — rejected:
  `notFor`/`pairsWith`/`status`/`deprecated.replacement` are
  structured data the build needs to parse and gate on, not prose; a
  single free-text field would need ad hoc parsing to recover them,
  reintroducing exactly the kind of fragile parsing ADR 0013 already
  moved away from.
- **Un-namespaced custom keys directly on the token (e.g. a bare
  `notFor` key next to `$value`)** — rejected: DTCG reserves top-level
  token keys starting with `$time` for the spec itself; a plain
  `notFor` key isn't spec-defined and isn't guaranteed to survive
  every DTCG-aware tool untouched the way `$extensions` (specifically
  designed for exactly this) is.
- **Move intent into `docs/glossary.yaml`** — not reconsidered here;
  ADR 0009 already rejected this on a shape mismatch (glossary is one
  row per naming decision across the whole system, not a
  usage/notFor/pairsWith block per token) that inlining into
  `tokens-source/` doesn't change.

# Consequences

Easier: one file to open, edit, and review per token — no second file
to keep in sync, no key-matching problem for a rename to break (ADR
0014's own stated cost). A new semantic token's value and its intent
are written and reviewed in the same PR hunk.

Harder: `tokens-source/semantic.json` is now denser — long `usage`
prose sits inline next to `$value`, so a diff that's "just changing a
color" and a diff that's "just changing documentation" are no longer
visually separable at the file level the way `generated.css` vs.
`intent.yaml` used to make them. Nothing currently verifies that
Tokens Studio's Figma Pull preserves an arbitrary `$extensions` block
the way it's confirmed to preserve `$description` — if Pull ever
strips `com.eldrin-ui.intent`, that's invisible on the code side (Pull
only flows into Figma) and would only surface as a Figma-side gap, not
a build failure here.
