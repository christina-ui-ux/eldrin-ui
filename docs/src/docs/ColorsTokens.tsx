// The Colors page's "Tokens" tab — builds the color-specific token data
// (primitives grouped by palette, semantic grouped by role category)
// and swatch previews on top of the shared TokenReferencePage shell
// (search, tables, sticky scrollspy nav — see that file). Component
// color tokens (e.g. button.primary.text) are deliberately not shown
// here — they live on their own component's docs page instead, next to
// that component's other tokens, not duplicated in this system-wide
// reference. Reads
// packages/eldrin-ui/src/tokens/generated.css directly, same as the
// rest of the docs pages, so it can't drift from what actually ships —
// regenerate with `npm run tokens:build` in packages/eldrin-ui, then
// reload.
import { useMemo } from 'react';
import generatedCss from '../../../packages/eldrin-ui/src/tokens/generated.css?raw';
import semanticSource from '../../../packages/eldrin-ui/tokens-source/semantic.json';
import { extractBlocks, extractVars, resolveValue } from './generatedCss';
import { PreviewBox, TokenReferencePage, type TokenGroup, type TokenRow } from './TokenReferencePage';

// Description column: a semantic token's own intent `$description`
// (ADR 0015) — read straight from tokens-source/semantic.json, since
// generated.css never carries intent metadata (build-tokens.mjs only
// validates it, it doesn't emit it — see that script's INTENT_TRACKED_SET
// comment). Primitives carry no intent of their own (DESIGN.md), so
// they get no Description column at all — TokenTable only renders it
// when at least one row in a given table actually has one.
type SemanticNode = { $description?: string; [key: string]: unknown };

function collectDescriptions(node: SemanticNode, path: string[], out: Map<string, string>) {
  if (typeof node.$description === 'string') {
    out.set(`--${path[0]}-${path.slice(1).join('-')}`, node.$description);
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    collectDescriptions(child as SemanticNode, [...path, key], out);
  }
}

function buildDescriptions(): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, node] of Object.entries(semanticSource as Record<string, SemanticNode>)) {
    collectDescriptions(node, [key], out);
  }
  return out;
}

// Semantic categories are matched by CSS var prefix, in display order.
const SEMANTIC_CATEGORIES = [
  { prefix: '--bg-fill-', label: 'Fill' },
  { prefix: '--bg-surface-', label: 'Surface' },
  { prefix: '--text-', label: 'Text' },
  { prefix: '--border-', label: 'Border' },
];

function isColorValue(value: string) {
  return /^#[0-9a-f]{3,8}$/i.test(value) || /^rgba?\(/i.test(value);
}

function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function ColorSwatch({ light, dark }: { light: string; dark?: string }) {
  return (
    <PreviewBox width={48} height={48}>
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        <div style={{ flex: 1, backgroundColor: light }} />
        {dark && <div style={{ flex: 1, backgroundColor: dark }} />}
      </div>
    </PreviewBox>
  );
}

function buildGroups(css: string): TokenGroup[] {
  const blocks = extractBlocks(css);
  const themeBlock = blocks.find((b) => b.selector === '@theme');
  const vars = themeBlock ? extractVars(themeBlock.body) : new Map<string, string>();
  const descriptions = buildDescriptions();

  const darkBlock = blocks.find((b) => b.selector === '[data-primitives="dark"]');
  const darkVars = darkBlock ? extractVars(darkBlock.body) : new Map<string, string>();

  // Primitives, grouped by palette name parsed off the CSS var
  // (--color-seagull-600 -> "Seagull"). Only the primitive layer ever
  // gets a dark override (see build-tokens.mjs's generateCss()) — a
  // semantic/component alias re-emits the same var() in every theme, so
  // it never shows up in the dark diff block itself.
  const paletteRows = new Map<string, TokenRow[]>();
  for (const [name, value] of vars) {
    if (!name.startsWith('--color-')) continue;
    const resolved = resolveValue(value, vars);
    if (!isColorValue(resolved)) continue;
    const match = /^--color-(.+)-(\d+)$/.exec(name);
    const palette = match ? capitalize(match[1]) : 'Other';
    const darkRaw = darkVars.get(name);
    const darkResolved = darkRaw ? resolveValue(darkRaw, vars) : undefined;
    const hasDark = darkResolved !== undefined && darkResolved !== resolved;
    const row: TokenRow = {
      name,
      value: hasDark ? `${resolved} / ${darkResolved}` : resolved,
      preview: <ColorSwatch light={resolved} dark={hasDark ? darkResolved : undefined} />,
    };
    paletteRows.set(palette, [...(paletteRows.get(palette) ?? []), row]);
  }
  const primitiveGroup: TokenGroup = {
    id: 'primitives',
    label: 'Primitives',
    children: [...paletteRows.entries()].map(([label, rows]) => ({
      id: `palette-${label.toLowerCase()}`,
      label,
      rows,
    })),
  };

  // Semantic, grouped by the fixed category list above.
  const semanticRows = new Map<string, TokenRow[]>();
  for (const [name, value] of vars) {
    const category = SEMANTIC_CATEGORIES.find((c) => name.startsWith(c.prefix));
    if (!category) continue;
    const resolved = resolveValue(value, vars);
    if (!isColorValue(resolved)) continue;
    const row: TokenRow = {
      name,
      value: resolved,
      description: descriptions.get(name),
      preview: <ColorSwatch light={resolved} />,
    };
    semanticRows.set(category.label, [...(semanticRows.get(category.label) ?? []), row]);
  }
  const semanticGroup: TokenGroup = {
    id: 'semantic',
    label: 'Semantic',
    children: SEMANTIC_CATEGORIES.map((c) => ({
      id: `semantic-${c.label.toLowerCase()}`,
      label: c.label,
      rows: semanticRows.get(c.label) ?? [],
    })).filter((sub) => sub.rows.length > 0),
  };

  return [primitiveGroup, semanticGroup].filter((group) => group.children.length > 0);
}

export function ColorsTokens() {
  const groups = useMemo(() => buildGroups(generatedCss), []);
  return (
    <TokenReferencePage
      heading="Color tokens"
      searchPlaceholder="Search color tokens by name or value…"
      groups={groups}
    />
  );
}
