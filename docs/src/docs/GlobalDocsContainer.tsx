import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
import type { ModuleExport } from 'storybook/internal/types';
import type { PropsWithChildren, ReactNode } from 'react';
import { ComponentDocsHeader } from './ComponentDocsHeader';
import { ComponentDocsTabs } from './ComponentDocsTabs';
import { ComponentDocsOverview } from './ComponentDocsOverview';
import { ComponentDocsCode } from './ComponentDocsCode';
import { loadComponentSpec } from './parseComponentSpec';

// Global override of addon-docs' own DocsContainer (`parameters.docs.
// container` in preview.tsx — applies to every docs page, autodocs or
// attached-MDX alike). This is what makes the header+tabs layout
// automatic for every page, instead of each one needing its own
// <Name>.mdx hand-wiring ComponentDocsHeader/ComponentDocsTabs (the
// approach Button.mdx used before this).
//
// Two ways a story's meta opts in — every docs page uses one of them,
// there's no third "no header" page left:
//
//   1. A real component, spec-driven:
//        parameters: { componentDocs: { componentPath: 'packages/eldrin-ui/src/components/Button/Button.tsx' } }
//      componentPath is also used to find and parse the component's own
//      spec (<NAME>.md, ADR 0011) for the Overview tab's content —
//      section headings/prose come straight from the spec, not
//      hand-written here. Code tab is the import snippet + Controls
//      props table (ComponentDocsCode) — only a component has props.
//
//   2. A documentation page (nothing to derive from a component spec —
//      Tokens/Colors, Typography, Glossary, Introduction):
//        parameters: { pageDocs: { title: 'Typography', sourcePath: '...', tabs: [{ label: 'Overview', content: <Node/> }, { label: 'Tokens', content: <Node/> }] } }
//      `tabs` is an ordered, page-chosen list — there's no fixed
//      Overview/Code shape to conform to (a documentation page's tabs
//      are whatever that page actually needs; ask which tabs before
//      building a new one). `sourcePath` is optional (omitted, the
//      header's "Source" link doesn't render — e.g. Introduction, which
//      isn't one file). No Changelog tab is ever added here — that's a
//      component-page-only concept (see 1 above).

interface ComponentDocsParameter {
  componentPath: string;
}

interface PageDocsParameter {
  title: string;
  sourcePath?: string;
  tabs: { label: string; content: ReactNode }[];
}

type Resolved =
  | { kind: 'component'; componentPath: string; title: string; defaultStory: ModuleExport }
  | ({ kind: 'page' } & PageDocsParameter);

export function GlobalDocsContainer({ context, children, ...rest }: PropsWithChildren<DocsContainerProps>) {
  let resolved: Resolved | undefined;

  try {
    const story = context.storyById();
    const componentDocs = story.parameters?.componentDocs as ComponentDocsParameter | undefined;
    const pageDocs = story.parameters?.pageDocs as PageDocsParameter | undefined;
    if (componentDocs) {
      resolved = {
        kind: 'component',
        componentPath: componentDocs.componentPath,
        title: story.title.split('/').pop() ?? story.title,
        defaultStory: story.moduleExport,
      };
    } else if (pageDocs) {
      resolved = { kind: 'page', ...pageDocs };
    }
  } catch {
    // No CSF file backs this docs entry — resolved stays undefined,
    // falls through to default rendering below. Every current docs
    // page is CSF-backed (Glossary/Introduction included, per the
    // pageDocs case above), so this is a safety net, not an expected
    // path.
  }

  return (
    <DocsContainer context={context} {...rest}>
      {resolved?.kind === 'component' ? (
        <ComponentDocsTabs
          header={<ComponentDocsHeader title={resolved.title} componentPath={resolved.componentPath} />}
        >
          <ComponentDocsTabs.Overview>
            <ComponentDocsOverview
              spec={loadComponentSpec(resolved.componentPath)}
              defaultStory={resolved.defaultStory}
            />
          </ComponentDocsTabs.Overview>
          <ComponentDocsTabs.Code>
            <ComponentDocsCode componentName={resolved.title} defaultStory={resolved.defaultStory} />
          </ComponentDocsTabs.Code>
          <ComponentDocsTabs.Changelog />
        </ComponentDocsTabs>
      ) : resolved?.kind === 'page' ? (
        <ComponentDocsTabs
          header={<ComponentDocsHeader title={resolved.title} componentPath={resolved.sourcePath} />}
        >
          {resolved.tabs.map((tab) => (
            <ComponentDocsTabs.Panel key={tab.label} label={tab.label}>
              {tab.content}
            </ComponentDocsTabs.Panel>
          ))}
        </ComponentDocsTabs>
      ) : (
        children
      )}
    </DocsContainer>
  );
}
