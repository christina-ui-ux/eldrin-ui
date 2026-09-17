import { Controls, Source, type ModuleExport } from '@storybook/addon-docs/blocks';

interface ComponentDocsCodeProps {
  /** Component export name, e.g. "Button" — used for the import snippet. */
  componentName: string;
  defaultStory: ModuleExport;
}

export function ComponentDocsCode({ componentName, defaultStory }: ComponentDocsCodeProps) {
  return (
    <>
      <section>
        <h2>Import</h2>
        <Source code={`import { ${componentName} } from 'eldrin-ui';`} language="tsx" />
      </section>
      <section>
        <h2>Properties</h2>
        <Controls of={defaultStory} />
      </section>
    </>
  );
}
