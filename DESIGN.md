# DESIGN.md

AI context for designers and Figma tooling.

## Purpose

This file gives design tools (Figma plugins, Token Studio, Figma MCP) the
context needed to keep design and code in sync for Eldrin UI.

## Tokens

Tokens live in `packages/eldrin-ui/src/tokens/` and are the source of truth. Each token carries
intent metadata:

- **purpose** — what the token is for
- **anti-purpose** — what it is explicitly not for
- **accessibility** — any contrast/sizing requirements it must satisfy

## Components

Each component under `packages/eldrin-ui/src/components/<Name>/` has a blueprint
(`<NAME>.md`) describing its anatomy, states, and token usage — intended to
stay in sync with the corresponding Figma component.

## Status

Figma library + Token Studio sync and Figma MCP drift detection are planned
(see README "Next").
