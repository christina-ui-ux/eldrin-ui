---
title: Introduction
description: What Eldrin UI is and how its documentation is organized.
layout: ../../layouts/MainLayout.astro
---

Eldrin UI is a React component library that ships design tokens with
intent metadata and components with machine-readable blueprints, so both
humans and AI agents can reason about *why* a token or component exists,
not just what it renders.

## Design tokens

Tokens live in `packages/eldrin-ui/src/tokens/` and document their intent — what they're
for, what they're not for — and their accessibility requirements.

## Component blueprints

Every component ships a `<NAME>.md` blueprint alongside its
implementation, stating its `classification` (container/control) and the
`rationale` behind it. See the [components overview](../../components/)
for the current list.

## Architecture decisions

Structural decisions — token architecture, classification rules, build
pipeline changes — are recorded as ADRs, listed in the sidebar under
"Architecture decisions".
