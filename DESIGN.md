# DESIGN.md

AI context for designers and Figma tooling.

## Purpose

This file gives design tools (Figma plugins, Token Studio, Figma MCP) the
context needed to keep design and code in sync for Eldrin UI.

## Tokens

Tokens are hand-authored in `packages/eldrin-ui/tokens-source/` (Tokens Studio
folder-mode JSON) and are the source of truth; `npm run tokens:build` compiles them to
`packages/eldrin-ui/src/tokens/generated.css` (see
`docs/decisions/0013-tokens-studio-replaces-figma-native-import.md`). Semantic tokens
carry intent metadata inline, right on the token in `tokens-source/semantic.json` (see
`docs/decisions/0015-token-intent-inline-in-source.md`):

- **$description** — what the token is for
- **$extensions["com.eldrin-ui.intent"].notFor** — what it is explicitly not for
- **...pairsWith** — other tokens it's designed to be used alongside for accessibility (e.g. a
  bg fill paired with the text token contrast-verified against it)
- **...status** — stable / experimental / deprecated (deprecated entries name their `replacement`)

Primitive and scale/spacing tokens are raw values with no intent of their own; component tokens'
rationale lives in that component's own `<NAME>.md` blueprint instead — neither carries an
intent block.

### Typography

Typography is a bundled-role model, not a single composite token (see
`docs/decisions/0016-typography-token-model.md`): each role — `heading-1`, `heading-2`,
`heading-3`, `body`, `body-small`, `caption`, `label` (closed list, `docs/glossary.yaml`) — is
four sibling semantic tokens, `type.<role>.size` / `.line-height` / `.weight` / `.family`. `type`
is its own top-level element, kept separate from `text.*` (which names text *color*, not
typography — see the glossary's "type element naming" entry for why reusing `text.*` here was
rejected). Font size scales with the `medium`/`large` scale axis (ADR 0007) the same way spacing
does; line height doesn't, since it's already a unitless ratio of font size.

Every role's `family` sub-token aliases one of two global tokens: `type.family.heading` for
`heading-1`/`heading-2`/`heading-3`, `type.family.body` for the rest. Both currently point to the
same typeface, IBM Plex Sans (glossary: "type family split") — kept as two tokens rather than one
so headings and body copy can diverge later by editing a single alias. This package doesn't
bundle the font file; a consuming app loads IBM Plex Sans itself.

A component picks a role and applies all four sub-tokens together — there is no single
`text-heading-1`-style shorthand class yet.

## Components

Each component under `packages/eldrin-ui/src/components/<Name>/` has a spec
(`<NAME>.md`) describing its classification, anatomy, variants, sizes,
states, tokens, props, and more. The spec is the **single source of
truth** for the component (see
`docs/decisions/0011-spec-single-source-of-truth.md`): both the code and
the Figma component are generated from it, and neither is independently
authoritative. Edit the spec first, then generate or update the Figma
component from it, rather than hand-editing the Figma instance directly.
The spec's `## Tokens used` section is what a generator binds to Figma
variables — see `docs/decisions/0015-token-intent-inline-in-source.md` for how
those variables already map to CSS vars and carry their own intent.

## Status

Figma library + Token Studio sync are planned (see README "Next"). Spec →
Figma generation is the current direction (ADR 0011); Figma MCP drift
detection (reconciling a hand-edited Figma instance back into its spec) is
explicitly not the model — regenerating/overwriting from the spec is.
