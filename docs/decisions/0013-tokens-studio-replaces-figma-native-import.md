---
id: 0013
title: Code is the source of truth for tokens; Tokens Studio Pull mirrors it into Figma
status: proposed
date: 2026-09-16
superseded_by:
---

# Context

ADR 0008 built a pipeline around Figma's *native* Variables export: a
designer manually exports DTCG JSON from Figma's own UI, drops it into
`tokens-source/`, and `npm run tokens:build` turns it into
`generated.css`. That's a hand-managed step on the design side —
someone has to remember to export and hand the file to engineering (or
commit it themselves) every time a token changes — and it makes Figma
the authority: code only ever reacts to whatever Figma happened to
export.

This ADR started out proposing the opposite hand-off — Tokens Studio's
Git sync *pushing* Figma-authored tokens into this repo, an automated
version of the same Figma-is-authoritative flow. That direction is
superseded within this same ADR, per explicit direction: **code is now
the single source of truth for tokens, full stop** — Figma is a
downstream view of what's in the repo, not an input to it.

This still builds on real research into Tokens Studio for Figma (a
plugin, distinct from Figma's own native Variables panel), verified
against current official docs (docs.tokens.studio) rather than assumed
from training data — the same caution ADR 0012 applied to Storybook.
What changes is which direction its Git sync feature is used in:

- Tokens Studio's Git sync is symmetric — **Pull** (repo → Figma) is
  exactly as first-class an operation as **Push** (Figma → repo), same
  underlying file structure either way.
- Git sync in **folder mode** reads/writes one JSON file per token
  **set**, plus `$metadata.json` (set order) and `$themes.json` (which
  sets are `enabled`/`source`/`disabled` per named theme) — docs
  explicitly recommend folder mode for engineering consumption, which
  applies just as well when engineering is the author, not just the
  consumer.
- Tokens Studio supports both a legacy JSON format (`value`/`type`)
  and DTCG (`$value`/`$type`); DTCG is opt-in in plugin settings, and
  is what this repo already speaks throughout (ADR 0008,
  `docs/glossary.yaml`).
- References use `{group.path.token}` syntax in both formats.
- **Theme Groups** (for organizing genuinely independent axes, e.g. a
  `mode` group with light/dark alongside a separate `scale` group with
  medium/large) are a **Pro-license** plugin feature; the Figma file
  this repo's tokens live in is currently on the free tier (Pro
  upgrade planned, not yet done) — same constraint as before, still
  worked around by three flat themes rather than grouped ones (see
  Decision).
- An official Style Dictionary preprocessor exists for exactly this
  file structure: `@tokens-studio/sd-transforms`. A maintained
  reference implementation, `tokens-studio/sd-tailwindv4`, already
  does "Tokens Studio JSON → Tailwind v4 `@theme` CSS with
  `[data-theme]`-scoped override blocks" — the same output shape ADR
  0008 already committed to. None of this depended on which direction
  authored the JSON, so it carries over unchanged.

# Decision

- **This supersedes ADR 0008 entirely.** The Figma-native export path
  (manual export, `tokens-source/*.tokens.json` per Figma mode,
  `build-tokens.mjs`'s hand-rolled DTCG/`$extensions.com.figma.*`
  parsing) is retired, per explicit direction to fully replace rather
  than run both pipelines side by side.
- **Token JSON is hand-authored directly in the repo**, in Tokens
  Studio's own folder-mode shape (`$metadata.json`, `$themes.json`, one
  file per set) — not exported from Figma, not generated from some
  other intermediate format. Same target directory ADR 0008 already
  designated for this, `packages/eldrin-ui/tokens-source/`, now
  populated by engineers editing JSON directly instead of a Figma
  export landing there.
- **`packages/eldrin-ui/tokens-source/` is removed from `.gitignore`.**
  Under ADR 0008 the directory held a Figma export that was never
  itself committed (only the generated `generated.css` was tracked) —
  fine when Figma was authoritative, but incompatible with "a token
  change is a normal, reviewed code change" (below): a gitignored file
  never reaches a real branch for Tokens Studio to Pull from, and never
  shows up in a PR diff for review either.
- **A token change is a normal code change**: edited on a branch,
  reviewed in a normal PR, merged to `main` — no Figma-triggered
  branch or push-gating workflow needed, because nothing pushes from
  Figma into this pipeline any more.
- **Tokens Studio's Git sync is configured to Pull, not Push**,
  against that same `tokens-source/` location. Whoever maintains the
  Figma file clicks Pull after a token PR merges, to bring Figma's view
  back in sync with code. This is the one still-manual, still-easy-to-
  forget step in the loop — see Consequences — but it no longer risks
  code drifting from a designer's unreviewed export, only Figma
  temporarily lagging behind merged, reviewed code.
- **Six sets**, matching the existing primitive → semantic → component
  layering (`docs/glossary.yaml`'s "token layer order") and the two
  independent variation axes ADR 0008 already established (color mode,
  scale):
  - `primitives-light` / `primitives-dark` — identical token paths,
    different literal values.
  - `scale-medium` / `scale-large` — same pairing, for the spacing/
    radius primitive (ADR 0007).
  - `semantic` — aliases into whichever primitives set is active.
  - `component` — aliases into `semantic`.
- **Three themes, not a four-way cartesian product**, each isolating
  exactly one axis for diffing (see build approach below), and
  designed to work today on the free tier without Theme Groups —
  needing no redesign later, just relabeling into groups once Pro is
  available:
  - `light-medium` (the default/base): `primitives-light`,
    `scale-medium`, `semantic`, `component` enabled.
  - `dark`: identical, but `primitives-dark` enabled in place of
    `primitives-light` — isolates exactly the tokens that change for
    dark mode.
  - `large`: identical to the default, but `scale-large` enabled in
    place of `scale-medium` — isolates exactly the tokens that change
    for the large scale.
- **Style Dictionary + `@tokens-studio/sd-transforms` replace
  `build-tokens.mjs`'s hand-rolled parser** — reusing a maintained
  preprocessor built for this exact file structure instead of
  reimplementing multi-set resolution, reference/alias math, and value
  normalization by hand. The **output shape is unchanged from ADR
  0008**: one committed `generated.css`, a single unscoped `@theme`
  block for the `light-medium` default, plus
  `[data-primitives="dark"]`/`[data-scale="large"]` override blocks —
  not one CSS file per theme. Build approach: resolve all three themes
  to flat token trees, diff `dark` and `large` each against
  `light-medium`, emit only the keys that actually differ into their
  respective override block — the same default-plus-deltas shape ADR
  0008 already used.
- **Not fully specified yet, and deliberately so**: the exact Style
  Dictionary config, transform order, and CSS-emission logic need a
  real hand-authored token set to build and verify against — none
  exists yet (the sets/themes above haven't been created as actual
  files in `tokens-source/` at the time of this ADR). Treat this
  Decision section as the target shape; the actual `scripts/`-level
  implementation is a follow-up, not fabricated ahead of real files to
  test against.

# Alternatives considered

- **Figma/Tokens Studio pushes into the repo** (this ADR's own first
  draft, same session) — reversed per explicit direction: code is now
  the single source of truth, full stop, not just "more automated than
  a manual Figma export."
- **Push a Figma REST API write to sync code → Figma directly**, rather
  than reusing Tokens Studio's Pull — not investigated once Tokens
  Studio's existing, already-documented Pull operation turned out to
  do exactly this with zero new integration surface; revisit only if
  Tokens Studio's Pull proves insufficient in practice.
- **Extend `build-tokens.mjs` to parse this JSON shape directly** —
  rejected: an official, maintained toolchain
  (`@tokens-studio/sd-transforms` + the `sd-tailwindv4` reference
  implementation) already solves multi-set/theme resolution and alias
  math for this exact source format and this exact Tailwind v4 target;
  reimplementing that by hand would just reintroduce bugs the official
  tooling has already worked through.
- **Run the Figma-native and code-first pipelines in parallel** —
  rejected per explicit direction: full replacement.
- **Theme Groups for scale × color-mode as two independent, Figma-UI-
  visible dimensions** — deferred, not rejected: currently blocked by
  the free-tier license; the three-flat-theme design here produces the
  identical build output without them and needs no rework once Pro is
  available, only relabeling those same three themes into groups.
- **Legacy Tokens Studio format (`value`/`type`)** — rejected: this
  repo already speaks DTCG (`$value`/`$type`) throughout; standardizing
  on DTCG avoids a parser that has to detect and branch on two token
  shapes.
- **A four-theme cartesian product** (`light-medium`, `light-large`,
  `dark-medium`, `dark-large`) — rejected: three themes that each
  isolate one axis (see Decision) produce the same two override blocks
  with less to maintain, since `dark-large` is never actually needed —
  the CSS cascade already combines the `dark` and `large` override
  blocks correctly when both `data-` attributes are set at once.

# Consequences

Easier: a token change is now exactly like any other code change —
branch, PR, review, merge — with no separate Figma-triggered workflow
or push-gating infrastructure to build or maintain. Code can never
drift from an unreviewed Figma export, because Figma is no longer a
place changes originate. The build still reuses a maintained official
preprocessor and a real reference implementation for the same
Tailwind v4 target, instead of hand-rolled DTCG/Figma-`$extensions`
parsing that only this repo maintained.

Harder: hand-authoring Tokens Studio's JSON shape directly (aliases,
`$value`/`$type`, one file per set) requires understanding that shape
— a real ergonomics cost compared to picking a color in Figma's UI,
for whoever edits token values day to day. Pulling into Figma is a
manual, easy-to-forget step, same risk ADR 0013's first draft had for
pushing — it just moved to the other side of the workflow, and now
means Figma temporarily lags behind merged code rather than code
lagging behind an unreviewed export. The free tier's lack of Theme
Groups still means Tokens Studio's own Figma-side UI won't visually
label scale/color-mode as two dimensions — invisible to the build
pipeline, a real gap until the Pro upgrade lands. This ADR's Style
Dictionary config is a target shape, not a working build yet — it
needs real files in `tokens-source/` to implement and test against.
ADR 0009's `intent.yaml` keying (originally by Figma `variableId`,
chosen to survive a Figma-side rename) actually gets *simpler* here:
with code authoritative, a token's own path (e.g. `color.seagull.600`)
is a fine, stable key — a rename is now an explicit line in the same
reviewed PR that makes it, not a silent event to detect after the
fact. ADR 0009 itself isn't updated by this ADR, but the concern it
was solving no longer applies the same way.
