---
id: 0014
title: intent.yaml keyed by token path, not Figma variableId
status: superseded
date: 2026-09-17
superseded_by: 0015
---

# Context

ADR 0009 keyed `intent.yaml` by each token's Figma `com.figma.variableId`
specifically to survive a Figma-side rename: the id is stable across a
rename, the derived CSS var name isn't, so keying by the derived name
would silently orphan hand-written intent the moment someone renamed a
variable in Figma.

ADR 0013 replaced the entire pipeline this was built for. Token JSON is
now hand-authored directly in `tokens-source/`, in Tokens Studio's
folder-mode shape — not exported from Figma. The new source files carry
no `$extensions.com.figma.*` block at all, so there is no `variableId`
left for `intent.yaml` to key on: `scripts/build-tokens.mjs`'s ADR
0013 rewrite already had to stop reading it. ADR 0013 itself flagged
this gap in its own Consequences section without resolving it: "ADR
0009 itself isn't updated by this ADR, but the concern it was solving
no longer applies the same way." This ADR is that resolution.

# Decision

- `intent.yaml` entries are keyed by the token's own dot-notation path
  (e.g. `bg.fill.interaction`), taken directly from `tokens-source/`'s
  own JSON structure — not a derived/generated id.
- A rename is no longer a silent event to detect after the fact. Under
  ADR 0013, a token rename is a normal, reviewed code change: the same
  PR that renames `bg.fill.interaction` to `bg.fill.primary` in
  `tokens-source/semantic.json` also renames the `intent.yaml` key, by
  hand, in the same diff. `tokens:build` still reports the old key as
  orphaned (never auto-deleted) if that rename step is missed, the same
  safety net ADR 0009 already had for an unmatched id.
- The `path` field that ADR 0009 stored on each entry (informational,
  kept in sync automatically) is dropped — it would now just duplicate
  the entry's own key. `token` (the derived CSS var name) stays, since
  it's still a real transformation of the key, not a copy of it.
- Everything else ADR 0009 decided — where intent.yaml lives, the
  `role`/`classification`/`status`/`deprecated`/`usage`/`notFor`/
  `pairsWith` fields, the stub-on-first-sight / never-delete-only-flag
  reconciliation behavior, the build-gate on unreviewed tokens, scoping
  intent to semantic tokens only — carries over unchanged. This ADR
  only replaces the key.
- `docs/glossary.yaml`'s "token intent metadata" entry is updated to
  describe path-based keying in place of `variableId`.

# Alternatives considered

- **Keep keying by variableId, treat every existing entry as
  permanently orphaned** — rejected: there's no mechanism left to
  populate a `variableId` for a hand-authored token that never touched
  Figma, so this would just be ADR 0009's key forever, unpopulated for
  anything written after ADR 0013.
- **Key by the derived CSS var name** — this is exactly the option ADR
  0009 rejected, for exactly the reason ADR 0009 gave (silently
  orphaned on rename). That reasoning assumed an *unreviewed* Figma
  export could rename a variable without anyone deciding to update
  `intent.yaml` in the same breath. Under ADR 0013 a rename is a
  reviewed code change in this repo, not an external event — but the
  token's own path is exactly as stable as the var name derived from
  it (one is a mechanical transform of the other), so keying by path
  instead of the derived name has no downside and reads better in a
  diff.

# Consequences

Easier: a new semantic token can be hand-authored and reviewed without
any Figma round-trip to mint an id for it first. `intent.yaml` reads
naturally next to `tokens-source/semantic.json` — the same key
identifies the token in both places, rather than requiring a
cross-reference through the `path` label to connect them.

Harder: a rename is now two hand-edits in the same PR (the token's path
in `tokens-source/` and its key in `intent.yaml`) with nothing enforcing
they move together beyond `tokens:build`'s orphan report after the
fact — the same manual-discipline gap ADR 0009 accepted for the
`variableId` case, just shifted onto a human doing both edits instead
of a script relabeling automatically. All eleven existing `intent.yaml`
entries were migrated by hand alongside this ADR (their `variableId`
key replaced by the `path` value each entry already stored), a
one-time cost that confirmed the mapping is exact — every existing
entry's stored `path` already matched a real key in `tokens-source/
semantic.json`.
