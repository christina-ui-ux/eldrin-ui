// Parses a component spec file (<NAME>.md, see ADR 0011) into its
// frontmatter-like `classification`/`rationale` lines and its `## `
// sections, keyed by heading text exactly as written. No structure is
// invented beyond what the spec file already has — e.g. "Do's and
// don'ts" stays one section, not split into two, since the spec itself
// doesn't split it. Author-facing HTML comments (`<!-- one bullet per
// x: ... -->`) are stripped; they're instructions for whoever fills in
// the spec, not content for a docs-page reader.

export interface ComponentSpec {
  classification?: string;
  rationale?: string;
  sections: Record<string, string>;
}

function stripAuthorComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, '').trim();
}

export function parseComponentSpec(raw: string): ComponentSpec {
  const lines = raw.split('\n');
  const sections: Record<string, string> = {};
  let currentHeading: string | null = null;
  let currentLines: string[] = [];
  let classification: string | undefined;
  let rationale: string | undefined;

  function flush() {
    if (currentHeading) {
      sections[currentHeading] = stripAuthorComments(currentLines.join('\n'));
    }
  }

  for (const line of lines) {
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      currentHeading = heading[1].trim();
      currentLines = [];
      continue;
    }
    if (currentHeading) {
      currentLines.push(line);
    } else {
      const classificationMatch = /^classification:\s*(.+)$/.exec(line);
      if (classificationMatch) classification = classificationMatch[1].trim();
      const rationaleMatch = /^rationale:\s*(.+)$/.exec(line);
      if (rationaleMatch) rationale = rationaleMatch[1].trim();
    }
  }
  flush();

  return { classification, rationale, sections };
}

const specFiles = import.meta.glob('../../../packages/eldrin-ui/src/components/*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Derives a spec's glob key from a component's source path, e.g.
 * "packages/eldrin-ui/src/components/Button/Button.tsx" -> the folder
 * name "Button", used to look up
 * "../../../packages/eldrin-ui/src/components/Button/BUTTON.md". */
function componentFolderName(componentPath: string): string | undefined {
  const parts = componentPath.split('/');
  const index = parts.indexOf('components');
  return index === -1 ? undefined : parts[index + 1];
}

export function loadComponentSpec(componentPath: string): ComponentSpec | undefined {
  const folder = componentFolderName(componentPath);
  if (!folder) return undefined;
  const key = `../../../packages/eldrin-ui/src/components/${folder}/${folder.toUpperCase()}.md`;
  const raw = specFiles[key];
  return raw ? parseComponentSpec(raw) : undefined;
}
