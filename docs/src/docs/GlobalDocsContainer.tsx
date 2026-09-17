import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
import type { ModuleExport } from 'storybook/internal/types';
import type { PropsWithChildren } from 'react';
import { ComponentDocsHeader } from './ComponentDocsHeader';
import { ComponentDocsTabs } from './ComponentDocsTabs';
import { ComponentDocsOverview } from './ComponentDocsOverview';
import { ComponentDocsCode } from './ComponentDocsCode';
import { loadComponentSpec } from './parseComponentSpec';

// Global override of addon-docs' own DocsContainer (`parameters.docs.
// container` in preview.tsx — applies to every docs page, autodocs or
// attached-MDX alike). This is what makes the header+tabs layout
// automatic for every component, instead of each one needing its own
// <Name>.mdx hand-wiring ComponentDocsHeader/ComponentDocsTabs (the
// approach Button.mdx used before this).
//
// A component opts in with one line on its story's meta:
//   parameters: { componentDocs: { componentPath: 'packages/eldrin-ui/src/components/Button/Button.tsx' } }
// componentPath is also used to find and parse the component's own
// spec (<NAME>.md, ADR 0011) for the Overview tab's content — section
// headings/prose come straight from the spec, not hand-written here,
// so there's one place to fill them in.
//
// Docs pages with no componentDocs parameter (Glossary, Introduction,
// Tokens/Colors — none of which are a single component with a spec)
// fall through to addon-docs' normal rendering, untouched.

interface ComponentDocsParameter {
  componentPath: string;
}

interface Resolved {
  componentPath: string;
  title: string;
  defaultStory: ModuleExport;
}

export function GlobalDocsContainer({ context, children, ...rest }: PropsWithChildren<DocsContainerProps>) {
  let resolved: Resolved | undefined;

  try {
    const story = context.storyById();
    const componentDocs = story.parameters?.componentDocs as ComponentDocsParameter | undefined;
    if (componentDocs) {
      resolved = {
        componentPath: componentDocs.componentPath,
        title: story.title.split('/').pop() ?? story.title,
        defaultStory: story.moduleExport,
      };
    }
  } catch {
    // No CSF file backs this docs entry (e.g. unattached MDX like
    // Glossary/Introduction) — resolved stays undefined, falls through
    // to default rendering below.
  }

  return (
    <DocsContainer context={context} {...rest}>
      {resolved ? (
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
      ) : (
        children
      )}
    </DocsContainer>
  );
}
