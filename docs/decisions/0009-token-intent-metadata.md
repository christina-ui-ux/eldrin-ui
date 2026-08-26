---
id: 0009
title: Token intent metadata lives in intent.yaml, keyed by Figma variableId
status: proposed
date: 2026-08-26
superseded_by:
---

# Context

CLAUDE.md and DESIGN.md require every design token to document intent —
purpose, anti-purpose, and accessibility requirements. ADR 0008
explicitly scoped this out of the Figma import pipeline: Figma's native
variable export carries no such field, and intent was left to be
"addressed separately once real primitive/semantic exports exist to
write intent docs against." Those exports now exist
(`primitives-*`, `semantics`, `components` in `tokens-source/`), so this
decision picks the mechanism.

Two things had to be decided: where the intent data lives, and what key
identifies a token in it. The obvious first choice — key by the
generated CSS var name (`--bg-fill-primary`) — breaks the moment
someone renames the variable in Figma: the old name in the intent file
no longer matches anything, silently orphaning the entry, while the
newly-named token ships with no intent at all.

Every leaf token in `tokens-source/` already carries a
`$extensions.com.figma.variableId` (e.g. `"VariableID:10:79"`) — Figma's
own internal id for the variable. It's confirmed stable across what
actually varies in the real exports: `primitives-light.tokens.json` and
`primitives-dark.tokens.json` both give `seagull/50` the identical id
`VariableID:10:68`, even though the two files are separate exports for
separate modes. A rename changes the variable's name, not its id.

# Decision

- Intent metadata lives in `packages/eldrin-ui/src/tokens/intent.yaml`,
  hand-authored, separate from `tokens-source/` (Figma-only, per ADR
  0008 — never hand-edited) and separate from `generated.css`
  (auto-generated CSS, not a place for prose).
- Each entry is keyed by the token's `com.figma.variableId`, not its
  derived CSS var name. The var name and dot-notation path are stored
  as informational labels (`token`, `path`) on the entry, kept in sync
  automatically — they're for a human scanning the file, not the lookup
  key.
- Each entry carries:
  - `token`/`path` — the CSS var name and dot-notation path, derived
    and kept in sync automatically, not hand-authored (as above).
  - `role` — one of `bg`/`surface`/`fill`/`text`/`border`/`icon`, also
    derived (not hand-authored): the family segment (`surface`/`fill`)
    for a `bg.*` token, the element segment itself (`text`/`border`/
    `icon`) otherwise, per `docs/glossary.yaml`'s semantic token naming
    formula (`{element}.{family}.{concept}.{state}.{context}`, family
    only present when element is `bg`).
  - `classification` — `container` | `control` | `null`, derived from
    `role`. Mirrors the glossary's "container / control" component-
    classification entry back onto the surface/fill structural axis
    it's built on: `role: surface` -> `container`, `role: fill` ->
    `control` (per the glossary's "surface / fill" entry: surface is
    background for container components, fill is background for atomic
    control components). `null` when `role` isn't surface/fill — a
    text/border/icon token has no such axis.
  - `status` — `stable` | `experimental` | `deprecated`, hand-authored.
    This is also the review gate (see below): a token stays
    `experimental` — the stub default — until a human reviews it.
  - `deprecated` — present only once `status` is `deprecated`; holds
    `replacement`, the token that takes over. `tokens:build` stubs this
    block in (`replacement: null`) the moment `status` flips to
    `deprecated` — an empty `replacement` fails the build, same as an
    unreviewed `experimental` entry does (see below).
  - `usage` — what the token is for (DESIGN.md's "purpose", renamed).
  - `notFor` — what it's explicitly not for (DESIGN.md's
    "anti-purpose", renamed).
  - `pairsWith` — a list of other tokens (var name or dot path) this
    one is designed to be used alongside for accessibility — e.g. a
    `bg.fill.*` token's list naming the `text.onFill.*` token it's
    been contrast-checked against — replacing a single free-text
    "accessibility" field with an explicit, checkable relationship.
- `packages/eldrin-ui/scripts/build-tokens.mjs` reconciles
  `intent.yaml` on every `tokens:build` run, via the `yaml` package's
  `Document`/`parseDocument` API (already a root devDependency, used
  the same way by `scripts/lint-glossary.mjs`) so hand-written comments
  and existing entries survive a rewrite untouched:
  - a token with no entry gets a stub appended (`status: experimental`,
    `usage`/`notFor` null, `pairsWith` empty) — so the entry that's
    about to fail the build (see below) is already sitting on disk,
    ready to edit, rather than only named in an error message.
  - an existing entry's `token`/`path`/`role`/`classification` labels
    are refreshed if the export renamed the underlying variable;
    `status`/`usage`/`notFor`/`pairsWith`/`deprecated` — anything a
    human wrote — is left alone.
  - an entry whose `variableId` no longer appears in `tokens-source/`
    is reported to the console as orphaned but never auto-deleted —
    removing it is a human decision, same reasoning as why the script
    never deletes a var it doesn't recognize elsewhere.
- After reconciling and writing the file, `tokens:build` fails
  (`collectReviewIssues`, nonzero exit, all issues listed together)
  if any tracked token is unreviewed:
  - `status: experimental` (the stub default).
  - `status: stable` with `usage` or `notFor` still empty — closes the
    loophole of flipping status to `stable` without writing anything.
  - `status: deprecated` with no `deprecated.replacement`.
  An outright invalid `status` value (not one of the three) also fails
  the build, as a distinct, earlier check. `generated.css` is still
  written before this check runs, so a local consumer (the playground,
  say) keeps working off the latest tokens while the intent gap gets
  fixed — it's `tokens:build`'s own exit code, not `generated.css`,
  that carries the failure.
- `docs/glossary.yaml` gets a `token-structure` entry documenting this
  convention at a glance (where it lives, the key, the status
  vocabulary), the same way it already documents "token layer order"
  and the "semantic token naming formula."
- Only `semantics` tokens get intent entries. `primitives`, `scale`,
  and `components` are all excluded — `INTENT_EXCLUDED_COLLECTIONS` in
  `build-tokens.mjs` — for two distinct reasons:
  - `primitives`/`scale` are raw values consumed by the layers above
    them, not tokens that carry independent role/meaning of their own
    (the glossary's "token layer order" entry already draws this line:
    "primitives are raw values, owned separately"). `--color-seagull-300`
    and `--spacing-24` are for consumption by the semantic/component
    layer, not places to attach a `purpose`.
  - `components` tokens are pure aliases into the semantic layer (same
    "token layer order" entry). A component token's rationale — which
    semantic role it aliases and why — is already the specific job of
    that component's own `<NAME>.md` blueprint (CLAUDE.md/DESIGN.md's
    `classification`/`rationale` + "token usage"), and its accessibility
    properties are inherited from the semantic token it points to, not
    independent. `--button-primary-background` writing its own
    `purpose` in `intent.yaml` would just be a second copy of what
    `Button.md` already states, free to drift from it.
  Reconciliation actively removes any existing `intent.yaml` entry
  belonging to an excluded collection, rather than merely no longer
  adding new ones — so a previously-generated stub doesn't linger as
  dead weight.

# Alternatives considered

- **Key by CSS var name** — rejected: breaks silently on any Figma-side
  rename, which is exactly the failure this decision needs to survive.
- **Reconciliation as visibility only, no build gate on completeness**
  — this was the first version of this decision, chosen so the author
  could scan `intent.yaml` for what's missing without a build error
  naming one token at a time. Reversed on explicit follow-up
  instruction: for this project, an unreviewed token shipping silently
  is not an acceptable outcome, so the build now fails until every
  tracked token is reviewed. `generated.css` is regenerated regardless
  (see Decision) so this isn't a full revert to "broken alias" style
  blocking — only `tokens:build`'s own exit code is gated, keeping a
  local consumer of the CSS unblocked while intent catches up.
- **Store intent directly in `docs/glossary.yaml`** — rejected: the
  glossary is "naming decisions across the system," one row per term
  (ADR 0002); a `usage`/`notFor`/`pairsWith` block per individual
  semantic token is a different shape of data at a different volume.
  The glossary gets a pointer entry instead, per ADR-vs-glossary
  practice (structural/systemic conventions go in an ADR + a short
  glossary pointer, not the full content duplicated into the
  glossary).
- **A single free-text `accessibility` field instead of `pairsWith`** —
  rejected in favor of an explicit list of the tokens it's meant to be
  paired with: a list of token references can at least be checked to
  exist (the same way an alias target is checked in `generated.css`),
  where free prose like "must maintain 3:1 contrast" can't be verified
  by anything short of a human re-reading it.
- **Also give `components` tokens their own `intent.yaml` entry** —
  rejected: a component token has no meaning independent of the
  semantic token it aliases plus the component's own reason for
  choosing that role, and the latter is already required to live in
  that component's `<NAME>.md` blueprint. Tracking it twice invites the
  two copies to disagree with no mechanism to catch it.
- **Plain `parse`/`stringify` round-trip instead of the `Document` CST
  API** — rejected: a naive round-trip through `yaml`'s plain
  `parse`/`stringify` would discard this file's own header comment (and
  any comment an author later adds next to an entry) on the very next
  `tokens:build`. The `Document`/`parseDocument` API existed for this
  reason and needed no new dependency.

# Consequences

Easier: a semantic token can no longer ship undocumented — `tokens:build`
fails until `usage`/`notFor` are written and `status` is set
deliberately, so there's no silent "I'll get to it later" state to fall
into. A designer or engineer can run `tokens:build` after any Figma
export and immediately see, via a normal `git diff` on `intent.yaml`
plus the build's own failure output, which tokens are new and what
exactly is missing — without cross-referencing `generated.css` by hand.
A Figma-side rename no longer orphans hand-written intent silently; the
entry's labels update automatically and the content stays attached to
the right token. A token can't quietly go from `stable` to `deprecated`
without a filled-in `deprecated.replacement`, and flipping `status` to
`stable` without writing `usage`/`notFor` no longer passes either.

Harder: every new semantic token export now blocks `tokens:build`
immediately, for everyone, until someone writes its context — a batch
export of several new tokens means several entries need review before
the build is green again, which is by design here but is real friction
if a change needs to land before that review happens (no escape hatch
is provided; see `--no-verify`-style overrides being off-limits per
this project's own conventions). A `pairsWith` entry is never validated
against the actual token registry (unlike an alias target in
`generated.css`), so a typo'd or renamed reference there fails silently
rather than loudly — a gap this decision leaves open rather than
closes. The
`INTENT_EXCLUDED_COLLECTIONS` set is a manual list, not derived from
anything structural about a collection — a future collection that's
also raw-consumption-only or alias-only needs a human to remember to
add it here, the same kind of manual-config risk ADR 0008 already
accepts for `DEFAULT_MODE`/`COLLECTION_PREFIX`. Scoping intent.yaml to
`semantics` alone also means a component's *reason* for choosing a
given semantic role lives only in that component's blueprint — nothing
cross-links a semantic token's `intent.yaml` entry to the components
that consume it, so finding "everywhere `bg.fill.primary` is used and
why" still means grepping component blueprints by hand.
