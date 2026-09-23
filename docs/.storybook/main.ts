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
  // Storybook's own sidebar marks a story that's never had its status
  // set (e.g. by a test/a11y run) with an icon-only "+" glyph — its
  // meaning ("New") is only exposed as an aria-label, invisible to a
  // sighted user. There's no public API to swap that icon for a text
  // badge, so this reaches into the manager UI's own CSS via the one
  // supported extension point for it (managerHead) instead, keyed off
  // the stable aria-label/data-testid contract rather than Storybook's
  // internal (hashed, version-specific) class names. If a Storybook
  // upgrade changes that aria-label's wording, this selector silently
  // stops matching — check here first if the badge disappears.
  managerHead: (head) => `${head}
    <style>
      button[data-testid="tree-change-status-button"][aria-label="Change status: New"] {
        width: auto;
        padding: 0 5px;
        border-radius: 3px;
        background: #24709D;
      }
      button[data-testid="tree-change-status-button"][aria-label="Change status: New"] svg {
        display: none;
      }
      button[data-testid="tree-change-status-button"][aria-label="Change status: New"]::after {
        content: "NEW";
        display: block;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.02em;
        line-height: 14px;
        color: #fff;
      }
    </style>
  `,
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
