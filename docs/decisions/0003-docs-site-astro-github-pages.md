---
id: 0003
title: docs/ is the Astro project root with a custom Tailwind layout, published to GitHub Pages
status: superseded
date: 2026-08-23
superseded_by: 0004
---

# Context

CLAUDE.md already named the intended stack ("`docs/` — Astro docs site
(coming soon)") but nothing existed yet: no Astro project, no chrome, no
hosting choice, no deploy pipeline.

**Where the Astro project lives.** `docs/` already holds non-site content
(`decisions/`, `glossary.yaml`) that predates the site and is the source
of truth for ADRs and naming — moving it under `src/content/` would fork
that source of truth into a site-owned copy.

**How the site is hosted.** A static site with no backend and no need
for a database — several platforms (Vercel, Netlify, Cloudflare Pages,
GitHub Pages) build and serve the same static output; the ones with
serverless/DB integrations built in aren't buying anything a static
Astro build needs.

**What renders the pages.** A first pass adopted Starlight
(`@astrojs/starlight`), Astro's official docs theme, via a
`<StarlightPage>` wrapper so it could keep reading `docs/decisions/` in
place. That was replaced before being accepted: the user asked
specifically for the layout and information architecture of
[astro-design-system](https://github.com/jordienr/astro-design-system)
(three-column sidebar + content + table-of-contents, sections defined in
a config file, plain markdown pages) instead of Starlight's UI. That
template's own repository is stale — last commit 2023-05-18, pinned to
`astro@^1.0.0-beta.5` and pre-1.0 integration versions
(`@astrojs/vue@^0.0.2`, `@astrojs/tailwind@^0.1.0`) that predate Astro's
current content-collection and integration APIs — so installing it as-is
would not resolve cleanly against current tooling. Its *structure* is
what's adapted here, rebuilt on current dependencies.

## Decision

**Project root and hosting:**

- **`docs/` is the Astro project root** — `docs/package.json`,
  `docs/astro.config.mjs`, `docs/src/`. It is a standalone Astro project
  with its own dependencies, not an npm workspace tied to the root
  `package.json`.
- **Existing `docs/decisions/` and `docs/glossary.yaml` stay where they
  are** and are read in place via Astro's content layer `glob()` loader
  (`docs/src/content.config.ts`, `base: 'decisions'`) rather than copied
  or moved into `src/content/`. They remain the source of truth; the
  site only renders them. ADR files matching `[0-9][0-9][0-9][0-9]-*.md`
  are picked up automatically — `docs/decisions/template.md` is excluded
  by that pattern (its placeholder values wouldn't pass the collection
  schema), so no manual registration step is needed per new ADR.
- **Hosting is GitHub Pages**, deployed by `.github/workflows/deploy-docs.yml`
  (`withastro/action` + `actions/deploy-pages`) on every push to `main`
  that touches `docs/**`. `astro.config.mjs` sets `site` and `base` for
  the `christina-ui-ux.github.io/eldrin-ui/` path.

**Site chrome:**

- **No documentation-site integration** (Starlight or otherwise) is
  used. The site's chrome is hand-built Astro components, styled with
  **Tailwind v4** (CSS-first, `@tailwindcss/vite` — matching the stack
  CLAUDE.md already specifies for the component library itself), not
  the original template's Tailwind v3 config-file + SCSS approach.
- **`src/config.ts`** holds `SITE` metadata and a static `SIDEBAR` array
  for sections that are plain content (`Core`, `Components`). The
  **"Architecture decisions" sidebar section is generated dynamically**
  in `LeftSidebar.astro` from the `decisions` collection instead — unlike
  the original template, where the sidebar is a fully static,
  hand-maintained list. This keeps the guarantee above that adding an
  ADR needs no site code changes.
- **`src/layouts/MainLayout.astro`** is the three-column layout (header,
  left sidebar, content, right-hand table of contents built from
  `headings`). It accepts either explicit `title`/`description`/`headings`
  props (used by `src/pages/decisions/*.astro`) or Astro's legacy
  `frontmatter` prop (used by plain `.md` pages under `src/pages/core/`
  via the `layout:` frontmatter field) — both forms are normalized to
  the same rendering path.
- **`src/lib/base.ts`** (`withBase()`) is the one place `import.meta.env.BASE_URL`
  handling lives. Every internal link in hand-written components uses it;
  every internal link inside markdown *body* content uses a relative path
  instead (see Consequences), since there's no framework rewriting those.

## Alternatives considered

- **Move `docs/decisions/*.md` and `docs/glossary.yaml` into
  `src/content/`** — rejected: would create two homes for the same
  source of truth (or require every future ADR to be written directly
  inside the Astro project), coupling the ADR process to the docs site's
  existence. The glob loader reads the existing location directly, so
  there is nothing to keep in sync.
- **Vercel or Netlify** — rejected: this is a static site with no
  backend; neither platform's differentiators (serverless functions,
  managed databases, preview-comment bots) apply here, and GitHub Pages
  is zero-cost, zero-additional-account for a repo already on GitHub.
- **npm workspace joining `docs/` to the root `package.json`** —
  rejected for now: the root package has no build tooling yet (no
  React/Vite deps installed) and the docs site's dependency graph
  (Astro) is unrelated to the component library's. Revisit if/when the
  root project grows real tooling that the docs site would also want to
  share.
- **Keep Starlight** — rejected: the user explicitly asked for the
  astro-design-system template's layout instead, and Starlight's own
  chrome (sidebar styling, search, theming) isn't reused here.
- **Use astro-design-system's exact dependency versions** — rejected:
  they target a 2022 pre-1.0 Astro beta and would not install or build
  against the current toolchain (see Context). Confirmed with the user
  before proceeding rather than assumed.
- **Move `docs/decisions/` into the sidebar's static config, hand-listed**
  — rejected for the same reason as moving it into `src/content/`: it
  would require a manual edit to `config.ts` per ADR, unlike the
  collection-driven approach actually used.

## Consequences

- Adding a new ADR is just: add `docs/decisions/000N-*.md` with valid
  frontmatter — it appears on the site (and its sidebar entry) on the
  next build, no site code changes required.
- The docs site has its own `node_modules`/lockfile, separate from the
  root project's; `npm install` at repo root does not install docs
  dependencies, and CI must `cd docs` (or use `path: docs`) before
  running Astro commands.
- Component blueprints and the glossary are not yet wired into the site
  (blueprint sections are still unwritten `TODO` prose, not structured
  frontmatter) — the components page marks this "coming soon" rather
  than rendering incomplete content. Wiring them is follow-up work, not
  a gap in this decision.
- The deploy workflow only triggers on changes under `docs/**`, so
  component/token work won't trigger unnecessary Pages deploys.
- No search, no dark mode, no i18n — all things Starlight would have
  provided for free. None are needed yet; revisit if the site grows
  enough to want them (that would be its own ADR, not a silent
  addition).
- Any link written inside markdown *body* content (not a hand-written
  `.astro` component prop) must be relative, not root-absolute — Astro's
  legacy markdown pages don't rewrite `/foo/` links for `base` the way a
  framework like Starlight does. `src/pages/core/introduction.md`'s link
  to the components page is `../../components/` for exactly this reason.
  Getting this wrong only 404s once deployed under the GitHub Pages
  `/eldrin-ui/` base — not in contexts that ignore `base`.
- New static sidebar sections (a `Patterns` section, for example) require
  a `SIDEBAR` entry in `src/config.ts` *and* a page — same manual step
  the original template required. Only "Architecture decisions" is
  automatic.
