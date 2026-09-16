import Markdown from 'react-markdown';
import { parse } from 'yaml';
import glossaryRaw from '../../glossary.yaml?raw';
import curationRaw from './glossary-storybook.yaml?raw';

interface GlossaryEntry {
  term: string;
  category: string;
  decision: string;
  rationale?: string;
  status: string;
}

const { entries } = parse(glossaryRaw) as { entries: GlossaryEntry[] };
const { terms: selectedTerms } = parse(curationRaw) as { terms: string[] };

// Order and membership come from glossary-storybook.yaml, not from
// glossary.yaml's own entry order — a hand-picked subset, not a filter
// over "everything decided".
const selected = selectedTerms
  .map((term) => entries.find((entry) => entry.term === term))
  .filter((entry): entry is GlossaryEntry => Boolean(entry));

export function GlossaryPage() {
  if (selected.length === 0) {
    return (
      <p>
        No terms selected yet — add entries to{' '}
        <code>docs/src/docs/glossary-storybook.yaml</code>.
      </p>
    );
  }
  return (
    <dl>
      {selected.map((entry) => (
        <div key={entry.term}>
          <dt>
            <h3>{entry.term}</h3>
            <p>
              <em>{entry.category}</em>
            </p>
          </dt>
          <dd>
            <Markdown>{entry.decision}</Markdown>
            {entry.rationale && <Markdown>{entry.rationale}</Markdown>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
