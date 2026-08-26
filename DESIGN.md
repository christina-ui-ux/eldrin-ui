# DESIGN.md

AI context for designers and Figma tooling.

## Purpose

This file gives design tools (Figma plugins, Token Studio, Figma MCP) the
context needed to keep design and code in sync for Eldrin UI.

## Tokens

Tokens live in `packages/eldrin-ui/src/tokens/` and are the source of truth. Semantic tokens
carry intent metadata in `packages/eldrin-ui/src/tokens/intent.yaml` (see
`docs/decisions/0009-token-intent-metadata.md`):

- **usage** — what the token is for
- **notFor** — what it is explicitly not for
- **pairsWith** — other tokens it's designed to be used alongside for accessibility (e.g. a
  bg fill paired with the text token contrast-verified against it)
- **role** — its structural category (bg / surface / fill / text / border / icon)
- **status** — stable / experimental / deprecated (deprecated entries name their `replacement`)

Primitive and scale/spacing tokens are raw values with no intent of their own; component tokens'
rationale lives in that component's own `<NAME>.md` blueprint instead — neither gets an
`intent.yaml` entry.

## Components

Each component under `packages/eldrin-ui/src/components/<Name>/` has a blueprint
(`<NAME>.md`) describing its anatomy, states, and token usage — intended to
stay in sync with the corresponding Figma component.

## Status

Figma library + Token Studio sync and Figma MCP drift detection are planned
(see README "Next").
