import { Canvas, Markdown, type ModuleExport } from '@storybook/addon-docs/blocks';
import type { ComponentSpec } from './parseComponentSpec';

// Overview tab content, generated from the component's own spec (ADR
// 0011) rather than hand-written per component — section headings and
// their prose come straight from <NAME>.md's own `## ` sections, so
// there's one place to write this content (the spec), not two that can
// drift (see docs/decisions/0012-storybook-replaces-astro-docs-
// site.md). A section with no content yet (still a TODO stub) simply
// doesn't render — no fabricated placeholder text.

function Section({ title, body }: { title: string; body?: string }) {
  if (!body) return null;
  return (
    <section>
      <h2>{title}</h2>
      <Markdown>{body}</Markdown>
    </section>
  );
}

interface ComponentDocsOverviewProps {
  spec?: ComponentSpec;
  defaultStory: ModuleExport;
}

export function ComponentDocsOverview({ spec, defaultStory }: ComponentDocsOverviewProps) {
  const sections = spec?.sections ?? {};
  return (
    <>
      <section>
        <h2>Demo</h2>
        <Canvas of={defaultStory} />
      </section>
      <Section title="Usage" body={sections['Intent']} />
      <Section title="Do's and don'ts" body={sections["Do's and don'ts"]} />
      <Section title="Variants" body={sections['Variants']} />
      <Section title="Sizes" body={sections['Sizes']} />
      <Section title="States" body={sections['States']} />
      <Section title="Accessibility" body={sections['Accessibility']} />
      <Section title="Responsive behavior" body={sections['Responsive behavior']} />
      <Section title="Related components" body={sections['Related components']} />
    </>
  );
}
