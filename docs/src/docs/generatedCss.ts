// Shared by the generated-CSS-backed docs pages (TokensColors, Typography):
// parses packages/eldrin-ui/src/tokens/generated.css directly so a docs page
// can't drift from what actually ships. generated.css's `@theme { ... }`
// block is Tailwind v4 source, not standalone CSS — this docs bundle drops
// Tailwind processing entirely (ADR 0012), so an unprocessed `var(--x)`
// reference never resolves on its own; resolveValue() follows the alias
// chain by hand down to the literal value each token ultimately points to.

export interface VarEntry {
  name: string;
  value: string;
  resolved: string;
}

export function extractBlocks(source: string): { selector: string; body: string }[] {
  const blocks: { selector: string; body: string }[] = [];
  const blockRegex = /(@theme|\[data-[\w-]+="[\w-]+"\])\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(source))) {
    blocks.push({ selector: match[1], body: match[2] });
  }
  return blocks;
}

export function extractVars(body: string): Map<string, string> {
  const vars = new Map<string, string>();
  const varRegex = /--([\w-]+):\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = varRegex.exec(body))) {
    vars.set(`--${match[1]}`, match[2].trim());
  }
  return vars;
}

export function resolveValue(rawValue: string, vars: Map<string, string>): string {
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
