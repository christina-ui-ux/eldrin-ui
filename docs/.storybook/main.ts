import type { StorybookConfig } from '@storybook/react-vite';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Resolves the absolute path of a package — needed in projects using Yarn
 * PnP or set up within a monorepo (this one).
 */
function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    // Component stories live next to each component's spec (ADR 0011,
    // ADR 0012), not under docs/ — this is the single source outside
    // docs/ that Storybook reads. Docs-page layout (header, tabs,
    // Overview content) is applied globally from GlobalDocsContainer
    // (docs/src/docs/), not per-component .mdx — a component only
    // needs a `parameters.componentDocs` entry on its story's meta.
    '../../packages/eldrin-ui/src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [getAbsolutePath('@storybook/addon-a11y'), getAbsolutePath('@storybook/addon-docs')],
  framework: getAbsolutePath('@storybook/react-vite'),
  viteFinal: async (viteConfig) => {
    // Match ADR 0003/0004's astro.config.mjs `base: '/eldrin-ui'` for the
    // GitHub Pages project-page subpath — only for production builds;
    // `storybook dev` still serves from `/`.
    if (process.env.NODE_ENV === 'production') {
      viteConfig.base = '/eldrin-ui/';
    }
    return viteConfig;
  },
};
export default config;
