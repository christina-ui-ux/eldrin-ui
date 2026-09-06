---
name: tokens-build
description: Run the eldrin-ui token build (npm run tokens:build) and report the result. Use whenever the user wants to (re)build/regenerate tokens, has just dropped a Figma export into tokens-source/, or asks to run the tokens build without leaving Claude Code.
---

# Run tokens:build

1. Run this from the repo root (no `cd` needed):
   ```
   npm run tokens:build
   ```
   This runs `packages/eldrin-ui/scripts/build-tokens.mjs`, which
   reads `packages/eldrin-ui/tokens-source/*.json`, reconciles
   `packages/eldrin-ui/src/tokens/intent.yaml`, and writes
   `packages/eldrin-ui/src/tokens/generated.css`. Pipeline details:
   `docs/decisions/0008-figma-token-import-pipeline.md` and
   `docs/decisions/0009-token-intent-metadata.md`.

2. **On success**: report what changed (`git diff --stat` for
   `generated.css` and `intent.yaml` is enough) — don't just say "done".

3. **On failure, quote the exact thrown message** (the script always
   throws a specific string — never summarize it away) and translate it
   into the precise action, per which error it is:

   - **Broken alias** (`Token "X" aliases "Y" in collection "Z", which
     resolves to unknown var "..."`) → **this is the Figma-fix case.**
     Tell the user directly: *"In Figma, check the variable **Y** in
     collection **Z** — it's been renamed or deleted, but the token at
     path **X** in your last export still points to it. Either restore/
     rename it back in Figma, or repoint token X's alias to its new
     variable, then re-export **Z** and re-run."* Pull `X`/`Y`/`Z`
     straight out of the message — don't make the user re-read the
     stack trace themselves.

   - **intent.yaml review gate** (`N token(s) in intent.yaml need
     review...` followed by one line per token) → this is NOT a Figma
     fix, it's a doc-fill-in step. List every offending token name and
     its specific reason (`experimental` / `stable` with empty usage-
     notFor / `deprecated` with no replacement) exactly as the message
     states it, then offer to fill in `usage`/`notFor` — but don't
     invent the wording unprompted, ask what the token is for if it's
     not obvious from context.

   - **Unrecognized `$type`/value shape** (`Token "X" has an
     unsupported $type "..."` or the DTCG-alias-string error) → NOT a
     Figma fix either — it's a pipeline limitation (ADR 0008 only
     supports `number`/`string`/`color`). Say so plainly: the export
     itself is fine, `build-tokens.mjs` needs extending before this
     token can import. Don't suggest changing anything in Figma for
     this one.

   - **Two files claiming the same mode** (`Collection "X" has two
     files claiming mode "Y"`) → a `tokens-source/` file-naming/export
     issue, not Figma: point to the two conflicting files.

4. Never hand-edit `generated.css` or files in `tokens-source/` to
   "fix" a build failure — fix the source export in Figma or
   `intent.yaml` instead, per whichever case above actually applies.
