// Ported from the old docs/src/pages/tokens/colors.astro (Astro→Storybook
// migration, ADR 0012). Reads the real generated CSS rather than
// duplicating color values by hand, so this page can't drift from what
// actually ships. Regenerate with `npm run tokens:build` in
// packages/eldrin-ui, then reload.
import generatedCss from '../../../packages/eldrin-ui/src/tokens/generated.css?raw';

interface VarEntry {
  name: string;
  value: string;
  resolved: string;
  dark?: string;
}

function extractBlocks(source: string): { selector: string; body: string }[] {
  const blocks: { selector: string; body: string }[] = [];
  const blockRegex = /(@theme|\[data-[\w-]+="[\w-]+"\])\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(source))) {
    blocks.push({ selector: match[1], body: match[2] });
  }
  return blocks;
}

function extractVars(body: string): Map<string, string> {
  const vars = new Map<string, string>();
  const varRegex = /--([\w-]+):\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = varRegex.exec(body))) {
    vars.set(`--${match[1]}`, match[2].trim());
  }
  return vars;
}

// generated.css's `@theme { ... }` block is Tailwind v4 source, not
// standalone CSS — an unprocessed `var(--x)` reference in a component
// token never resolves to a color in this docs bundle, which drops
// Tailwind processing entirely (ADR 0012). Follow the reference chain
// by hand instead, down to the literal hex value each token ultimately
// aliases.
function resolveValue(rawValue: string, vars: Map<string, string>): string {
  let value = rawValue;
  const seen = new Set<string>();
  while (true) {
    const match = /^var\((--[\w-]+)\)$/.exec(value.trim());
    if (!match) return value;
    const varName = match[1];
    if (seen.has(varName)) return value;
    seen.add(varName);
    const next = vars.get(varName);
    if (next === undefined) return value;
    value = next;
  }
}

function buildTokenGroups(css: string) {
  const blocks = extractBlocks(css);
  const themeBlock = blocks.find((b) => b.selector === '@theme');
  const themeVars = themeBlock ? extractVars(themeBlock.body) : new Map<string, string>();

  const overrideBlocks = blocks
    .filter((b) => b.selector !== '@theme')
    .map((b) => ({ selector: b.selector, vars: extractVars(b.body) }));

  const darkOverride = overrideBlocks.find((b) => b.selector === '[data-primitives="dark"]');

  const primitives: VarEntry[] = [];
  const semantics: VarEntry[] = [];
  const components: VarEntry[] = [];

  for (const [name, value] of themeVars) {
    const resolved = resolveValue(value, themeVars);
    if (name.startsWith('--color-')) {
      const darkRaw = darkOverride?.vars.get(name);
      primitives.push({
        name,
        value,
        resolved,
        dark: darkRaw ? resolveValue(darkRaw, themeVars) : undefined,
      });
    } else if (/^var\(--color-/.test(value)) {
      semantics.push({ name, value, resolved });
    } else if (/^var\(--/.test(value)) {
      components.push({ name, value, resolved });
    }
  }

  return { primitives, semantics, components };
}

function Swatch({ token }: { token: VarEntry }) {
  const hasDark = token.dark && token.dark !== token.resolved;
  return (
    <div style={{ overflow: 'hidden', borderRadius: 8, border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', height: 64 }}>
        <div style={{ flex: 1, background: token.resolved }} />
        {hasDark && (
          <div style={{ flex: 1, background: token.dark }} />
        )}
      </div>
      <div style={{ padding: 8, fontSize: 12 }}>
        <div style={{ fontFamily: 'monospace', fontWeight: 500 }}>{token.name}</div>
        <div style={{ color: '#64748b' }}>
          {token.value}
          {hasDark && <> / {token.dark}</>}
        </div>
      </div>
    </div>
  );
}

function SwatchGrid({ tokens }: { tokens: VarEntry[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 16,
      }}
    >
      {tokens.map((t) => (
        <Swatch key={t.name} token={t} />
      ))}
    </div>
  );
}

export function TokenColors() {
  const { primitives, semantics, components } = buildTokenGroups(generatedCss);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <p>
        Generated from <code>packages/eldrin-ui/src/tokens/generated.css</code>, itself built
        from the raw Figma exports in <code>packages/eldrin-ui/tokens-source/</code> (see ADR
        0008). This story reads that file directly — it can't drift from what actually ships, but
        it also won't reflect a new export until you run <code>npm run tokens:build</code> in{' '}
        <code>packages/eldrin-ui</code>.
      </p>

      <section>
        <h2>Primitives</h2>
        <p>
          The raw color palette. <code>primitives</code> defaults to its <code>light</code> mode;{' '}
          <code>dark</code> is shown alongside where the export defines an override.
        </p>
        <SwatchGrid tokens={primitives} />
      </section>

      <section>
        <h2>Semantic</h2>
        <p>
          Aliases into the primitive layer, named by role rather than palette (see the glossary's
          "semantic token naming formula").
        </p>
        <SwatchGrid tokens={semantics} />
      </section>

      <section>
        <h2>Component</h2>
        <p>Pure aliases into the semantic layer, scoped to one component's own token names.</p>
        <SwatchGrid tokens={components} />
      </section>
    </div>
  );
}
