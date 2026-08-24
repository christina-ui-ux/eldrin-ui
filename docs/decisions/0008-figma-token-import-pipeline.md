---
id: 0008
title: Figma token import pipeline (tokens-source/ + build-tokens.mjs)
status: proposed
date: 2026-08-24
superseded_by:
---

# Context

Design tokens need to flow from Figma (where they're authored as
Figma Variables) into `eldrin-ui` as CSS, without a designer or
engineer hand-transcribing values on every change. Figma can export
its variables natively as JSON in the W3C Design Tokens Community
Group (DTCG) format, with an added `$extensions["com.figma.*"]` block
carrying Figma-specific metadata (variable id, scopes, and — for a
variable collection with multiple modes — `modeName`).

The first real export available (`space` — the scale primitive
introduced in ADR 0007) came as two files, `scale-large.tokens.json`
and `scale-medium.tokens.json`: the same variable collection exported
twice, once per Figma mode, each file carrying its own
`$extensions.com.figma.modeName`. Any import pipeline has to resolve
that a `large`/`medium` pair is two modes of *one* collection, not two
unrelated token sets.

We needed a place to drop these exports, a script to turn them into
usable CSS, and a naming/output convention — before more exports
(primitives, semantics, components) arrive and the pattern has to be
retrofitted.

## Decision

- Raw Figma exports are dropped, unmodified, into
  `packages/eldrin-ui/tokens-source/*.json`. This directory holds only
  Figma's own DTCG output — never hand-edited.
- `packages/eldrin-ui/scripts/build-tokens.mjs` (`npm run tokens:build`,
  runnable from the repo root too) reads every file in
  `tokens-source/`, resolves each file's DTCG token tree, and writes a
  single generated `packages/eldrin-ui/src/tokens/generated.css`.
  Generated CSS is committed (there's no install-time build step for
  this package), headed with an explicit "AUTO-GENERATED, do not
  hand-edit" comment.
- **Collection/mode grouping**: a file's collection name is its
  filename with the `-<modeName>` suffix stripped, where `modeName`
  comes from that file's own `$extensions.com.figma.modeName` — never
  guessed from the filename alone. `scale-large.tokens.json` +
  `scale-medium.tokens.json` (mode `large`/`medium`) merge into one
  `scale` collection this way.
- **Output namespace**: each top-level DTCG group maps to a Tailwind
  v4 `@theme` namespace via an explicit table in the script (e.g.
  `space` → `--spacing-*`), rather than mirroring the source group
  name verbatim. Mapping `space` to Tailwind's own `--spacing-*`
  namespace means Tailwind auto-generates its normal utilities
  (`p-4`, `gap-8`, `w-12`, …) from *our* scale instead of its built-in
  rem-based one — no separate utility layer needed.
- **Multi-mode output**: a collection with only one mode emits its
  values directly inside the unscoped `@theme` block. A collection
  with multiple modes requires an explicit default mode configured in
  the script (`DEFAULT_MODE`) — that default mode's values go in the
  unscoped `@theme` block, every other mode gets a
  `[data-<collection>="<mode>"]` override block layered after it. For
  `scale`, the default is `medium` per ADR 0007; a future root
  scale/theme provider only needs to toggle the `data-scale` attribute.
- The pipeline supports what real exports have actually contained:
  numbers, strings, and DTCG `color` values (`{colorSpace, components,
  alpha, hex}`, emitted as the `hex` string when opaque, `rgba(...)`
  otherwise). It still fails loudly with a specific error — not a
  silent guess — on any other `$type`/value shape.
- **Aliases**: Figma's exporter does *not* use the DTCG `{a.b.c}`
  alias-string syntax. It bakes every alias's resolved literal directly
  into `$value`, and separately records the real relationship in
  `$extensions.com.figma.aliasData` (`targetVariableName`,
  `targetVariableSetName`). The pipeline uses that relationship instead
  of the baked literal: an aliased token is emitted as
  `var(--target-var-name)`, not a copy of the value. This keeps the
  primitive → semantic → component chain (`docs/glossary.yaml`'s
  "token layer order" entry: "component tokens are pure aliases into
  the semantic layer") real in the generated CSS — changing a
  primitive's value cascades to everything referencing it without
  needing to regenerate the whole file, and a broken/renamed source
  token fails the build (`buildVarRegistry` check) instead of silently
  falling back to a stale hardcoded color.
- Primitives (`primitives-light.tokens.json` /
  `primitives-dark.tokens.json`) group colors under a Figma palette
  name (e.g. `seagull`) rather than a type-describing name, so the
  pipeline prefixes every token in the `primitives` collection with a
  `color` segment (`seagull.300` → `color.seagull.300` →
  `--color-seagull-300`) via an explicit `COLLECTION_PREFIX` table.
  `semantics`/`components` need no such prefix — their own top-level
  groups (`bg`, `button`) are already descriptive, matching the
  semantic token naming formula directly.
- `primitives` is a second multi-mode collection alongside `scale`,
  with modes `light`/`dark` (a theme axis, unrelated to `scale`'s
  medium/large). Its default (unscoped) mode is `light`; `dark` is a
  `[data-primitives="dark"]` override, following the same generic
  `[data-<collection>="<mode>"]` pattern as `scale`'s
  `[data-scale="large"]` — no separate `data-theme` convention was
  introduced for this.
- Token *intent* metadata (purpose/anti-purpose/accessibility, per
  CLAUDE.md) is explicitly out of scope for this pipeline. Figma
  variable exports carry no such field; intent stays hand-authored in
  `src/tokens/index.ts`, addressed separately once real primitive/
  semantic exports exist to write intent docs against.

## Alternatives considered

- **Tokens Studio plugin format instead of Figma's native export** —
  not applicable here: the actual exports available are Figma's native
  DTCG output (confirmed against real sample files), not Tokens Studio
  shape. `DESIGN.md`'s earlier mention of "Token Studio sync" as a
  planned integration is a separate, not-yet-built path.
- **Plain `:root` custom properties instead of Tailwind `@theme`** —
  rejected for namespaces (like `space`) that should drive Tailwind's
  own utility generation; would require a hand-maintained utility layer
  duplicating what `@theme` gives for free.
- **Guessing a Figma mode name from the filename suffix alone** (e.g.
  splitting `scale-large` into `scale` + `large` without checking the
  file's own metadata) — rejected: fragile the moment a collection name
  itself contains a hyphen, and the file already states its mode
  unambiguously via `$extensions.com.figma.modeName`.
- **Taking the baked `$value` literal as-is, ignoring `aliasData`** —
  rejected once real `semantics.tokens.json`/`components.tokens.json`
  exports showed the actual shape: every layer would duplicate the
  same hardcoded color, silently breaking the primitive → semantic →
  component chain the glossary already commits to, and a changed
  primitive wouldn't cascade without re-exporting every dependent file.

## Consequences

Easier: dropping a new Figma export into `tokens-source/` and running
one script is now the entire import path for scale/spacing and
primitive/semantic/component color tokens; adding a new multi-mode
collection later only needs one `DEFAULT_MODE` entry (and, if its
group names aren't self-describing, one `COLLECTION_PREFIX` entry).
Changing a primitive color and re-exporting cascades through semantics
and components automatically via `var()`, with no per-layer edits.

Harder: any future export using a `$type` other than `number`/
`string`/`color` (typography composites, shadows, etc.) will hit the
script's deliberate failure path and needs the parser extended before
it imports — expected friction, not a bug, given no real sample of
that shape exists yet. `generated.css` being a committed build
artifact means a stale regeneration (forgetting `npm run tokens:build`
after editing `tokens-source/`) is a manual-step risk until/unless this
gets wired into CI. A renamed or deleted source token that something
still aliases now fails the build loudly (`buildVarRegistry` check)
rather than silently keeping a stale value — intentional, but it does
mean a primitive rename requires updating its dependents in the same
Figma export batch.
