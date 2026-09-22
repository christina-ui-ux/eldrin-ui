---
id: 0016
title: Bundled type-style tokens as a new `type` element, on IBM Plex Sans
status: proposed
date: 2026-09-17
superseded_by:
---

# Context

`tokens-source/` had no typography tokens at all — every existing
semantic token (`bg.*`, `text.*`, `border.*`) is a color. We needed to
add a baseline typography layer (font family, size, weight, line
height) before any component spec can say "use this text style"
instead of a hardcoded font-size/weight pair.

Two things needed deciding before writing the first token:

1. **What shape does a typography token take?** A Figma text style (and
   the DTCG spec's composite `typography` `$type`) bundles font-family,
   size, weight, and line-height into one named object. But
   `build-tokens.mjs` (ADR 0013) only ever resolves a token to a single
   scalar CSS value — either a literal (`formatLiteral()`, handling
   `color`/`number` today) or a `var()` alias to another single-value
   token. Making it resolve a composite object into several CSS
   properties from one token entry would be a real pipeline change, not
   a source-file change.
2. **What font?** No typeface was ever chosen for this project (a
   first draft of this ADR picked the OS default UI stack; that was
   revised before this ADR was accepted — see "Font" below).

## Decision

**Token shape.** A "text style" is a *named group* of ordinary scalar
semantic tokens, not one composite token — `type.<set>.<role>.size`,
`type.<set>.<role>.line-height`, `type.<set>.<role>.weight`,
`type.<set>.<role>.family`, and `type.<set>.<role>.letter-spacing`, five
sibling aliases sharing a role name. `type` is a new top-level semantic
element, a peer to `bg`/`text`/`border`/`icon`, not folded into `text`
(see `docs/glossary.yaml`'s "type element naming" entry for why: `text`
already names text *color*, and reusing it for typography would also
collide with Tailwind v4's own reserved `--text-*` font-size namespace).
Each role's `family` sub-token isn't a free value — it aliases one of
exactly two global tokens, `type.family.heading` or `type.family.body`
(see "Font" below for why there are two, not one). `letter-spacing`
similarly aliases a shared per-role primitive (`letterspacing.<role>` in
`type-primitives.json`, not per-set) — authored in `em`, so it scales
with font-size automatically and doesn't need a `ui`/`editorial`-specific
value, the same reasoning as the two shared family tokens. The role
vocabulary (`heading-1/2/3`, `body`, `body-small`, `caption`, `label`)
and the named weight steps (`regular`/`medium`/`semibold`/`bold`) are
both closed lists, recorded in `docs/glossary.yaml`.

**Style strategy: `set` is a second axis, alongside `role` — currently
populated by exactly one value, `ui`.** Every role lives under
`type.ui.*`, never bare `type.<role>.*` — the token shape keeps room for
a second set even though only one exists right now. This axis was
originally modeled on Carbon Design System's "style strategies" (its
productive/expressive type sets: see
https://carbondesignsystem.com/elements/typography/style-strategies/),
and a full second set, `editorial` — larger font sizes and more generous
line-heights, for content-led/marketing pages rather than task-focused
product UI — was designed, built, and then deferred before this ADR was
accepted: **only `ui` ships in `tokens-source/` today.** `editorial`'s
values (and the reasoning that produced them) live in this ADR's git
history, not in the current source tree; re-adding it is a matter of
restoring `fontsize.editorial.<role>` / `lineheight.editorial.<role>`
entries in the `scale-medium`/`scale-large` sets, a `type.editorial.*`
block in `semantic.json` mirroring `type.ui.*`, and widening
`build-tokens.mjs`'s `TYPE_ROLE_PATH` regex back to `(ui|editorial)` —
not a redesign. `docs/glossary.yaml`'s "type style strategy" entry still
records the intended `ui`/`editorial` vocabulary and per-set guidance
for whoever picks this back up. Keeping every token `ui`-qualified now,
rather than collapsing back to a flat `type.<role>.*` shape, is what
makes that restoration additive instead of a second rename.

Underneath the semantic layer, font-size and line-height are new
`fontsize`/`lineheight` groups inside the existing `scale-medium`/
`scale-large` sets (ADR 0007's `medium`/`large` scale axis), nested one
level deeper by `set` (`fontsize.ui.<role>`) — font-size scales with
`scale` the same way spacing does (roughly ×1.25 from medium to large);
line-height does not, since it's already a unitless ratio of font-size
and scales with it automatically. Font family and the weight steps live
in a new `type-primitives` set (registered in `build-tokens.mjs`'s
`SET_COLLECTION` and enabled in every theme), since neither varies by
light/dark, by scale, or by style-strategy set.

`build-tokens.mjs` gained one real extension: `formatLiteral()` now
handles `$type: "fontFamily"` (a DTCG type it didn't support before),
joining a font list into a CSS `font-family` value and quoting any
name containing whitespace.

**Bundled utility classes.** Wiring up five custom properties by hand
for every role turned out to be too slow in practice, so
`build-tokens.mjs` also emits one Tailwind v4 `@utility` block per
`type.<set>.<role>` bundle — `@utility ui-heading-1 { font-size:
var(--type-ui-heading-1-size); line-height: var(...); font-weight:
var(...); font-family: var(...); letter-spacing: var(...); }` — so a
component can write `className="ui-heading-1"` instead. This is a
second pipeline extension, appended to `generated.css` after the
`@theme` block (`buildUtilityBlocks()`, built once from the default
theme's resolved token list and grouped by a `type.(ui).<role>.
<property>` path match — the regex's alternation is currently just
`ui`, widen it back to `(ui|editorial)` if that set returns). Each
declaration stays a `var()` reference rather than a copied literal, so
the block needs no separate dark/large-theme variant — it always
resolves whatever the active theme's custom properties currently are.
The class name is `<set>-<role>` (`ui-heading-1`, ...) — always
set-qualified even with only one set active, no bare unqualified name,
so using one is never a silent guess at which set applies (see
`docs/glossary.yaml`'s "type utility class naming" entry). Tailwind v4's
`@utility` is tree-shaken like any built-in utility — a role that's
never used in a consumer's scanned source emits no CSS, so this doesn't
cost anything for roles a consumer never reaches for. The individual
custom properties documented above are untouched and still directly
usable — the utility class is sugar built from them, not a replacement.

**Font.** IBM Plex Sans, for both headings and body copy — via two
global tokens, `type.family.heading` and `type.family.body`, that
currently alias the same primitive (`family.plex-sans`). Two tokens
rather than one so a future divergence (e.g. a display face for
headings only) is a one-alias edit, not a per-role hunt for which
roles happen to be headings. The primitive falls back to the OS
default UI stack (`-apple-system, BlinkMacSystemFont, "Segoe UI",
Roboto, "Helvetica Neue", Arial, sans-serif`) if the webfont fails to
load. This package bundles no font files — a consuming app must load
IBM Plex Sans itself (e.g. a `<link>` to Google Fonts, or self-hosted
`@font-face`), the same kind of required root-level setup ADR 0007
already asks of a scale/theme provider.

## Alternatives considered

- **A composite `typography` token per role** (DTCG's own composite
  `$type`, resolving to one token with sub-fields) — rejected for now:
  would require `resolveTheme()`/`formatLiteral()` to emit multiple CSS
  properties from a single token entry, a materially larger pipeline
  change than adding one scalar `$type` branch. The three-scalar-alias
  bundle gets the same authoring/consumption experience (a component
  picks one named role) without that rewrite. A fifth property
  (`letter-spacing`) was added later without revisiting this — the
  scalar-alias approach still didn't need the resolver rewrite, and the
  bundled `@utility` classes (see "Bundled utility classes" above) solved
  the actual ergonomic complaint a composite token would have solved
  (typing one name instead of several), so the pressure to revisit never
  materialized. Reconsider only if a property needs to vary independently
  in a way `@utility` can't express.
- **Reuse `text.*` for typography** (`text.heading-1`, etc., alongside
  the existing `text.primary` color tokens) — rejected: `text.*` is
  already a color-role element, and it already happens to squat
  Tailwind v4's reserved `--text-*` (font-size) theme namespace, which
  is itself a pre-existing naming problem worth its own future look —
  compounding it with a second, unrelated meaning under the same name
  makes that worse, not better.
- **The OS default UI stack, no webfont** — this ADR's own first draft:
  zero load cost, matches each OS's own conventions. Reversed before
  acceptance in favor of IBM Plex Sans (see "Font" above); recorded in
  `docs/glossary.yaml`'s "type family split" entry as the place to
  revisit this again, not something to change ad hoc per component.
- **One global `type.family` token instead of a heading/body split** —
  rejected even though headings and body copy currently render in the
  exact same typeface: a single token can't express "headings might
  diverge later" without a later rename of every heading role's alias
  target, whereas two tokens pointing at the same value today cost
  nothing and absorb that change in one place.
- **Keep Carbon's own "productive"/"expressive" names for the two
  sets** — rejected in favor of `ui`/`editorial`: those two words say
  what each set is *for* without requiring a reader to already know
  Carbon's vocabulary, matching this project's general preference for
  familiar terms over spec-precise jargon (see `docs/glossary.yaml`'s
  "naming familiarity" pattern, applied the same way to `horizontal`/
  `vertical` over `inline`/`stack` elsewhere).
- **A single role list with no `set` axis, adding "compact" variants
  directly to the existing roles instead** (e.g. `body-compact`,
  `heading-1-compact`) — considered as a lighter-weight way to borrow
  Carbon's compact/regular pairing idea without the full productive/
  expressive split. Rejected: it can't express Carbon's actual
  distinction (task-focused product UI vs. content-led pages), only a
  density difference within one context, and this system doesn't yet
  have two type sets fighting for the same role names the way Carbon's
  IBM.com and Cloud console properties do.
- **Fluid (breakpoint-responsive) headings for the `editorial` set,
  matching Carbon's expressive set** — deferred, not rejected outright:
  Eldrin UI is a component library, not an editorial site with full-
  bleed marketing banners, so nothing today exercises a heading that
  needs to resize with the viewport. Revisit if a real consuming app's
  page needs one, rather than speculatively building the mechanism now.
- **A bare, unqualified utility class per role** (`.heading-1`, defaulting
  to one set — presumably `ui` — with the other set given some modifier
  or prefixed name) — rejected: a hidden default is a footgun once two
  sets exist side by side, since a consumer reaching for `heading-1`
  without checking would silently get whichever set happened to be the
  default, with no signal that an alternative exists. Every utility class
  names its set explicitly (`ui-heading-1` / `editorial-heading-1`)
  instead, at the cost of a few extra characters per class.
- **Collapsing back to a flat `type.<role>.*` shape (dropping the `set`
  axis entirely) now that only `ui` ships** — rejected: `editorial` is
  deferred, not abandoned, and a flat shape would mean re-adding it later
  requires renaming every existing token path and class
  (`type.heading-1` → `type.ui.heading-1`, `.heading-1` → `.ui-heading-1`)
  on top of adding the new set — two breaking changes instead of one
  additive one. Keeping the now-single-valued `set` axis costs one extra
  path segment everywhere today, in exchange for `editorial`'s eventual
  return costing nothing beyond adding its own values.

## Consequences

Easier: a component spec's "Tokens used" section can now say
`type.ui.body.size` / `type.ui.body.line-height` / `type.ui.body.weight`
instead of inventing a raw font-size number per component. The
`medium`/`large` scale axis (ADR 0007) now also drives type size
automatically, with no per-component wiring. Easier still, for the
common case: a component (or any Tailwind-scanned markup) can reach for
one class — `className="ui-heading-1"` — instead of wiring up all five
custom properties by hand; the bundled `@utility` classes exist for
exactly this.

Harder: a "bundled text style" is five separate CSS custom properties
underneath that class (size + line-height + weight + family +
letter-spacing) — a component author who *doesn't* use the `@utility`
class still has to remember to wire up all five for a role, the same
sharp edge ADR 0007 already flagged for scale/size wiring in general.
Each of the five per-role tokens also carries its own full intent block
(per ADR 0015, every `semantic.json` token is intent-tracked regardless
of category) — more repetitive to author than a single composite token
would have been, traded deliberately for not touching the resolver (see
"A composite `typography` token per role" above for why the bundled
utility classes made that trade-off cheaper to keep living with, even
after a fifth property was added). Adopting a real webfont also means
this package now has a documented, un-enforced dependency — nothing
fails loudly if a consuming app forgets to load IBM Plex Sans, it just
silently falls back to the OS stack.

Harder, from the `set` axis specifically: every `type` path and every
utility class carries a `ui` segment that, with only one set active,
currently distinguishes nothing — a small tax paid now so that
`editorial`'s eventual return (see "Style strategy" above) is additive
rather than a rename. A component spec's "Tokens used" section still has
to name the set (`type.ui.<role>`, not just `<role>`) even though there's
only one choice today.
