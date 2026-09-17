import type { Preview } from '@storybook/react-vite'
import './preview.css';
import { GlobalDocsContainer } from '../src/docs/GlobalDocsContainer';

const preview: Preview = {
  // Every story file's `meta.component` gets an auto-generated docs page
  // (props table from the component's TypeScript types + JSDoc), no MDX
  // hand-authoring per component. Currently sparse — every component's
  // .types.ts is still an empty {} interface (ADR 0011/0012) — but the
  // wiring is ready the moment a spec fills in real props.
  tags: ['autodocs'],
  parameters: {
    // Applies the shared header+tabs layout to every component's docs
    // page automatically (GlobalDocsContainer reads the component's
    // spec via a `componentDocs.componentPath` parameter on its
    // meta — see that file). Docs pages that aren't a single component
    // (Glossary, Introduction, Tokens/Colors) render unchanged.
    docs: {
      container: GlobalDocsContainer,
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    // Top-level sidebar groups, in reading order: overview docs first,
    // then design foundations, then components. Anything not listed
    // here falls back to alphabetical, after the listed groups.
    options: {
      storySort: {
        order: ['Docs Overview', 'Foundation', 'Actions'],
      },
    },
  },
};

export default preview;