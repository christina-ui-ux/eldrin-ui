import Markdown from 'react-markdown';

// Reads every ADR directly from docs/decisions/*.md via Vite's raw-import
// glob — the same "read in place, no copy, no drift" property the old
// Astro content-collection loader gave (see ADR 0003/0012): adding a new
// ADR file needs zero changes here, it just appears on next reload.
// template.md is excluded by the numeric-prefix pattern.
const files = import.meta.glob('../../decisions/[0-9][0-9][0-9][0-9]-*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

interface Decision {
  id: number;
  title: string;
  status: string;
  date: string;
  supersededBy: number | null;
  body: string;
}

function parseFrontmatter(raw: string): Decision {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('ADR file missing frontmatter block');
  }
  const [, frontmatter, body] = match;
  const fields: Record<string, string> = {};
  for (const line of frontmatter.split('\n')) {
    const fieldMatch = line.match(/^(\w+):\s*(.*)$/);
    if (fieldMatch) fields[fieldMatch[1]] = fieldMatch[2].trim();
  }
  return {
    id: Number(fields.id),
    title: fields.title,
    status: fields.status,
    date: fields.date,
    supersededBy: fields.superseded_by ? Number(fields.superseded_by) : null,
    body: body.trim(),
  };
}

const decisions = Object.values(files)
  .map(parseFrontmatter)
  .sort((a, b) => b.id - a.id);

function pad(id: number) {
  return String(id).padStart(4, '0');
}

export function DecisionsPage() {
  return (
    <div>
      <ul>
        {decisions.map((d) => (
          <li key={d.id}>
            <a href={`#adr-${pad(d.id)}`}>
              {pad(d.id)} — {d.title}
            </a>{' '}
            ({d.status}
            {d.supersededBy ? `, superseded by ${pad(d.supersededBy)}` : ''})
          </li>
        ))}
      </ul>
      <hr />
      {decisions.map((d) => (
        <section key={d.id} id={`adr-${pad(d.id)}`}>
          <h2>
            {pad(d.id)} — {d.title}
          </h2>
          <p>
            <strong>{d.status}</strong>
            {d.supersededBy ? ` · superseded by ${pad(d.supersededBy)}` : ''} · {d.date}
          </p>
          <Markdown>{d.body}</Markdown>
        </section>
      ))}
    </div>
  );
}
