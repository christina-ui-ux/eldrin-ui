---
id: 0001
title: Component rationale field selects its background, text, and icon token set
status: accepted
date: 2026-08-22
superseded_by:
---

# Context

Component blueprints classify each component (container/control), but
classification alone doesn't say *why* — and that "why" is what
determines which background, text, and icon tokens a component should
use. Without a place to record that reasoning and a fixed mapping from
classification to token set, the reasoning either lives in someone's
head or gets re-derived every time a token gets wired up.

## Decision

Every component blueprint (`<NAME>.md`) includes a `rationale` field
alongside its `classification`. The rationale explains why the
component is classified the way it is, and that classification
determines its token set:

- **`container`** components use the `bg-surface-*` token set for
  background, paired with the base text/icon tokens (no special
  suffix) — surface backgrounds are low-saturation and the base
  text/icon tokens are guaranteed to meet contrast against them.
- **`control`** components use the `bg-fill-*` token set for
  background. Any component using a `bg-fill-*` token MUST pair it
  with the `onFill` variant of text/icon tokens (e.g. `text-onFill-*`,
  `icon-onFill-*`) — never the base text/icon tokens. Fill backgrounds
  are more saturated/interactive, so contrast against them can only be
  guaranteed by their matching `onFill` tokens.

Token-set decisions for a component should be traceable back to its
blueprint's `rationale` field rather than guessed from its name or
visual similarity to another component.

## Alternatives considered

- **Classification field alone, no rationale** — rejected: a label like
  `container` or `control` doesn't carry enough information to explain
  *why* a component ended up with a given token set; two components
  with the same classification can need different tokens for different
  reasons.
- **A separate token-mapping document** — rejected: splits the "why"
  from the component it describes, and drifts out of sync as
  components change independently of the mapping doc.
- **One shared text/icon token set for both surface and fill
  backgrounds** — rejected: base text/icon tokens aren't guaranteed to
  meet contrast requirements against `bg-fill-*` backgrounds, which
  defeats the point of tokens carrying accessibility intent.
- **Hardcoding fill-paired text/icon colors (e.g. `text-white`)
  instead of an `onFill` relationship** — rejected: hardcodes a color
  rather than a relationship to its background, so it breaks under
  theming/dark mode where the fill color itself can change.

## Consequences

- Every component blueprint must fill in `rationale` before
  implementation is considered done (per CLAUDE.md conventions).
- Every `bg-fill-*` token in `src/tokens/` must have a matching
  `onFill` text token and `onFill` icon token defined alongside it.
- A `control`-classified component referencing base (non-`onFill`)
  text/icon tokens is a contrast bug, not a style choice — worth a
  lint/review check once the token system is implemented.
