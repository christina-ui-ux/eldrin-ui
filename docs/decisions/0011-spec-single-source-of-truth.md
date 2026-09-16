---
id: 0011
title: Component spec is the single source of truth for code and the generated Figma component
status: proposed
date: 2026-09-15
superseded_by:
---

# Context

Every component ships a `<NAME>.md` file (originally called a
"blueprint"), stating `classification`/`rationale` (ADR 0001) and
checked for completeness by a lint script (ADR 0010). Today that file
is descriptive: it's written before implementation, but nothing
consumes it mechanically — the code, and any corresponding Figma
component, are each authored and kept in sync by hand, independently.
All five existing files (`Badge`, `Button`, `Card`, `Foundation`,
`Input`) are still the literal TODO stub the template produces.

We're adopting spec-driven design (SDD): the spec stops being a
description written *alongside* the code and Figma component, and
becomes the **single source of truth** they're both generated from.
Concretely, that means: the spec is the only place a lasting design or
behavior decision is recorded, and both downstream artifacts —
implementation code and the Figma component — are produced from it and
can be regenerated from it at any time. Neither downstream artifact is
independently authoritative.

ADR 0010 considered and rejected "a structured, non-markdown format with
a CLI query layer" as premature at the time. This decision doesn't
revisit that rejection — it's new information (SDD wasn't the working
model when 0010 was written, and there was no concrete generation use
case to design against) applied within the boundary 0010 already
accepted: the file stays markdown, human-readable, and git-diffable.
What changes is that each section's body now needs to be *reliably*
parseable by a generator, not just present, because something now reads
it mechanically instead of only a human.

Separately, ADR 0008 already established a one-way pipeline — Figma
Variables → `tokens-source/` → `generated.css` — for token *values*.
That pipeline is unaffected by this decision. This ADR covers a
different artifact (component *structure*: anatomy, variants, sizes,
states, token bindings, props) flowing in the opposite direction (spec →
Figma, and spec → code).

## Decision

- **The spec is the single source of truth.** For any given component,
  `packages/eldrin-ui/src/components/<Name>/<NAME>.md` is the only place
  a design or behavior decision is made. Its code implementation and its
  Figma component are both *generated artifacts* — produced from the
  spec, and reproducible from it at any time. A change made directly to
  the code or directly to the Figma instance, without updating the spec
  first, is not a lasting change: the next regeneration overwrites it.
  This is a generate-or-update (overwrite) model, not a two-way
  diff/reconciliation model — there is deliberately no drift detection
  that reconciles a hand-edit back into the spec.
- The required section list covers the full set a component needs before
  both artifacts can be generated from it, in this order: `Intent`,
  `Anatomy`, `Variants`, `Sizes`, `States`, `Tokens used`, `Content
  guidelines`, `Accessibility`, `Responsive behavior`, `Props`, `Do's and
  don'ts`, `Related components`. A lint script enforces presence of all
  twelve (`packages/eldrin-ui/scripts/check-specs.mjs`, `npm run
  check:specs`).
- The list-shaped sections are written as one bullet per entry, each line
  shaped `- <key>: <value>`, so a generator can read them without a
  bespoke parser per component:
  - `Anatomy`: `- <part>: <role>` (e.g. `- label: text node showing the button's action`)
  - `Variants`: `- <name>: <prop>=<value>[, <prop>=<value>...]` — note here
    whether every product in a multi-product system shares these variants
    or a product carries exceptions.
  - `Sizes`: `- <size>: height=<token>, padding=<token>, iconSize=<token>, fontSize=<token>`
    — exact per-size values, expressed as tokens, never raw values.
  - `States`: `- <state>: <description>`, naming which tokens change
    (color/border/shadow) for that state. `loading` specifically must say
    whether the label stays visible or is replaced by the spinner, and
    whether the control is disabled while loading.
  - `Tokens used`: `- <part/state>: <token>` — every visual property
    (color, spacing, radius, typography) maps to a token, never a raw
    value; this is the section a generator binds to Figma variables.
  - `Props`: `- <propName>: <type> = <default>[, figma=<FigmaPropertyName>]`
    — kept 1:1 with the Figma component's own properties, so code props
    and Figma properties never drift into two separate naming schemes.
  The remaining sections (`Intent`, `Content guidelines`, `Accessibility`,
  `Responsive behavior`, `Do's and don'ts`, `Related components`) stay
  prose — they don't reduce to single-line key/value facts, so forcing a
  bullet format on them would lose information rather than structure it.
- The spec-to-code and spec-to-Figma generators are separate, not-yet-
  built pieces of tooling. This decision settles that the spec is
  authoritative and what it must contain — not the generators'
  implementation.

## Alternatives considered

- **Spec stays descriptive; code and Figma are each authored and kept in
  sync by hand** — the status quo, rejected: it's exactly the drift risk
  SDD exists to remove, and gives no mechanical way to check that
  "the spec" is what's actually implemented or shown in Figma.
- **Two-way diff/reconciliation** (detect drift between a hand-edited
  Figma component and its spec, flag it, let a human decide) —
  considered, rejected for now: a real cost (a designer's direct Figma
  tweak gets clobbered on regeneration) but explicitly preferred over
  the added complexity of drift detection and merge resolution, and it
  would compromise the "single source of truth" a hand-edit can quietly
  become authoritative simply by never being reconciled. Worth
  revisiting if overwrite-on-regenerate causes real friction once the
  pipeline exists.
- **Non-markdown structured format with a CLI query layer** (ADR 0010's
  rejected alternative) — still rejected: the bullet-list convention
  gets a generator enough structure without giving up a plain-markdown,
  git-diffable file. Revisit only if that convention proves too fragile
  to parse reliably in practice.

## Consequences

Easier: there's exactly one place to make a lasting change per
component, and one place to look to know what a component is supposed
to be — no separate doc, code, and Figma component that can each say
something different. A future generator can regex/line-parse the five
bulleted sections (`Anatomy`, `Variants`, `Sizes`, `States`, `Tokens
used`, `Props`) without per-component special-casing.

Harder: all five existing specs (`Badge`, `Button`, `Card`, `Foundation`,
`Input`) now have twelve required sections to fill in, not six, before
`check:specs` passes. Contributors need to internalize that the
generated code and the generated Figma component are not where lasting
changes belong — edits made only there are overwritten on the next
regeneration from spec. The generators that actually do this don't exist
yet; until they do, specs are hand-written descriptions with no
automated consumer, and "single source of truth" is a rule being
adopted ahead of the tooling that enforces it.
