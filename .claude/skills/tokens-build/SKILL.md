---
name: tokens-build
description: Run the eldrin-ui token build (npm run tokens:build) and report the result. Use whenever the user wants to (re)build/regenerate tokens, has just hand-edited a set file in tokens-source/, or asks to run the tokens build without leaving Claude Code.
---

# Run tokens:build

1. Run this from the repo root (no `cd` needed):
   ```
   npm run tokens:build
   ```
   This runs `packages/eldrin-ui/scripts/build-tokens.mjs`, which reads
   `packages/eldrin-ui/tokens-source/` (Tokens Studio folder-mode JSON:
   `$metadata.json`, `$themes.json`, one file per set — hand-authored,
   code is the source of truth), resolves each theme via Style
   Dictionary + `@tokens-studio/sd-transforms`, validates each semantic
   token's inline intent block (`$description` +
   `$extensions["com.eldrin-ui.intent"]` in `tokens-source/semantic.json`
   — the script only reads this, never writes it), and writes
   `packages/eldrin-ui/src/tokens/generated.css`. Pipeline details:
   `docs/decisions/0013-tokens-studio-replaces-figma-native-import.md`
   and `docs/decisions/0015-token-intent-inline-in-source.md`.

2. **On success**: report what changed (`git diff --stat` for
   `generated.css` and any touched `tokens-source/*.json` is enough) —
   don't just say "done".

3. **On failure, quote the exact thrown message** (the script always
   throws a specific string — never summarize it away) and translate it
   into the precise action, per which error it is. Tokens are hand-
   authored directly in this repo (not exported from Figma), so every
   fix below is a normal code edit inside `tokens-source/` — there is
   no separate Figma-side step and no second file to touch:

   - **Broken alias** (`Token "X" aliases "Y", which doesn't resolve to
     any token active in this theme (...)`) → token `X` (path from its
     own set file) references `{Y}`, but `Y` isn't defined by any set
     active in that theme. Point to the specific set file `X` lives in
     and say `Y` needs to exist (check for a typo or a rename that
     wasn't carried through) in whichever set that theme actually
     enables — cross-check `tokens-source/$themes.json`.

   - **Intent review gate** (`N token(s) in tokens-source/semantic.json
     need intent review...` followed by one line per token) → a
     doc-fill-in step, not a source bug. List every offending token
     name and its specific reason (`experimental`/missing block,
     `stable` with empty `$description`/`notFor`, `deprecated` with no
     `deprecated.replacement`) exactly as the message states it, then
     offer to fill in the token's `$description` and
     `$extensions["com.eldrin-ui.intent"]` block directly in
     `tokens-source/semantic.json` — but don't invent the wording
     unprompted, ask what the token is for if it's not obvious from
     context.

   - **Unrecognized `$type`** (`Token "X" has an unsupported $type
     "..."`) → a pipeline limitation (`formatLiteral()` in
     `build-tokens.mjs` only handles `color`/`number`). Say so plainly:
     the source token is fine, `build-tokens.mjs` needs extending
     before this `$type` can build.

   - **Missing SET_COLLECTION entry** (`Set "X" has no SET_COLLECTION
     entry`) → a new file was added to `tokens-source/` (or
     `$metadata.json`/`$themes.json` references one) without
     registering it in `build-tokens.mjs`'s `SET_COLLECTION` map. Add
     an entry there mapping the set to its generic collection
     (`primitives`/`scale`/`semantic`/`component`, or a new one).

   - **No theme named "light-medium"** → `tokens-source/$themes.json`
     is missing the default theme the build expects, or it's been
     renamed; check that file directly.

4. Never hand-edit `generated.css` to "fix" a build failure — fix the
   actual source in `tokens-source/` instead, per whichever case above
   applies. `tokens-source/` files themselves *are* directly hand-
   edited (per ADR 0013, this is a normal reviewed code change, not
   something read-only awaiting a Figma export) — that now includes a
   semantic token's own intent block, per ADR 0015.
