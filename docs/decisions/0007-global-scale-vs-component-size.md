---
id: 0007
title: Separate global `scale` from per-component `size`
status: accepted
date: 2026-08-24
superseded_by:
---

# Context

Touch targets need to be larger on touch devices than on mouse/desktop
for accessibility (WCAG 2.5.5 / 2.5.8) — a button sized correctly for a
cursor is too small to reliably tap with a finger.

While researching how existing systems solve this, two different
approaches turned up. One approach, found by inspecting a design
system's Figma component library directly, gives every single
component — down to the smallest size — its own boolean "small screen"
variant, which increases padding/touch-target size independent of the
component's normal size. This value could not be found as a documented
prop in that system's published component API, suggesting it may be a
Figma-only simulation of responsive behavior rather than something
implemented the same way in code.

A structurally different approach separates a systemwide "Scale"
setting (`medium` | `large`, defaulted from device pointer type) from
"Size" (a per-component t-shirt variant like S/M/L). Scale is set once,
at the application root, and cascades to every component via CSS
custom property indirection — no component needs its own boolean for
this.

We needed to decide which model to build `eldrin-ui`'s sizing system on
before implementing more than one sized component, since retrofitting
this after several components exist would mean touching every one of
them individually.

## Decision

We will adopt a two-axis model: a global `scale` context
(`medium` | `large`), auto-detected from device pointer type via a
media query, settable once at a root provider/theme wrapper and
overridable there — separate from a per-component `size` t-shirt
variant that resizes a single component instance independent of scale.

No individual component gets its own "is this a touch context" prop.

## Alternatives considered

- **Boolean prop per component** (mirroring the Figma-only "small
  screen" variant literally as e.g. `<Button smallScreen />`) —
  rejected because it
  doesn't scale as a pattern: every new component must remember to add
  and wire the prop individually, and a forgotten one fails silently
  (the same class of bug as Astryx's progress bar quietly falling back
  to a default when a token wasn't wired — see the naming glossary
  discussion). Nothing catches the omission at build time.

- **Pure CSS media query per component, no context at all** — viable
  and simpler than the boolean-prop option, but rejected as the final
  design because it can't be manually overridden per instance without
  CSS specificity workarounds, and gives component logic no way to
  branch on the current scale in JS if that's ever needed (e.g.
  conditionally rendering different content, not just different
  sizing). The chosen approach keeps the automatic media-query-driven
  default but adds a manual override path via a root provider.

## Consequences

Easier: adding a new component never requires remembering to wire up
touch-target logic — it inherits the correct sizing automatically via
the CSS variable cascade, the same way every other component does.
Correct behavior is the default, not something each component author
has to opt into. Also DRY at the CSS level: a component's rules always
reference a generic property variable; only the active scale/size pair
determines which concrete token that variable resolves to — no
duplicated rule blocks per size.

Harder: every consumer of `eldrin-ui` now needs to wrap their app in a
root provider/theme component for scale to work at all — this is one
more piece of required setup compared to a component that "just works"
with no wrapper. The CSS custom property indirection is also one layer
more abstract than a plain class-based override, which can make
debugging computed styles slightly less direct (you're tracing through
a variable reassignment, not reading a single rule). Pointer-type
auto-detection isn't perfect for hybrid devices (e.g. a laptop with a
touchscreen) — the manual override on the provider exists specifically
to handle that gap, and needs to stay documented as an escape hatch,
not just an edge case nobody remembers exists.
