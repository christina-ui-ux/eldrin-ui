import type { ReactNode } from 'react';

// Header content above the tab navigation (structure only, not
// content — adapted from reviewing another design system's Storybook;
// see docs/decisions/0012-storybook-replaces-astro-docs-site.md). That
// example's own banner content (a promo for their own AI skills
// library, a notice that their docs platform moved) is Wix-specific
// and not reproduced — the title + utility-links row and the alert
// slot below it are the only two pieces of that layout that apply
// here. No wrapping element of its own: rendered via ComponentDocsTabs'
// `header` prop, inside the same .content block as the tablist, so the
// tab row sits directly under the title rather than in a separate
// block. Docs-site tooling, not part of the design system — used only
// by GlobalDocsContainer (docs/src/docs/GlobalDocsContainer.tsx).

const GITHUB_REPO = 'https://github.com/christina-ui-ux/eldrin-ui';
const GITHUB_BRANCH = 'main';

interface ComponentDocsHeaderProps {
  /** Page display name, e.g. "Button", "Typography". */
  title: string;
  /**
   * Path to the source file this page documents, relative to the repo
   * root — the "Source" link is omitted when a page has no single file
   * that represents it (e.g. Introduction).
   */
  componentPath?: string;
  /**
   * Full-width slot directly under the title, above the tabs — reserved
   * for a future Alerts component (deprecation/experimental notices,
   * etc.), not built yet. Renders nothing, at no extra height, until a
   * caller passes something.
   */
  alerts?: ReactNode;
}

export function ComponentDocsHeader({ title, componentPath, alerts }: ComponentDocsHeaderProps) {
  const sourceHref = componentPath ? `${GITHUB_REPO}/blob/${GITHUB_BRANCH}/${componentPath}` : undefined;
  const issueHref = `${GITHUB_REPO}/issues/new`;

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 16,
          flexWrap: 'wrap',
          width: '100%',
        }}
      >
        <h1 style={{ margin: 0 }}>{title}</h1>
        <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
          <a href={issueHref} target="_blank" rel="noreferrer" style={{ color: '#24709D' }}>
            Report an issue
          </a>
          {sourceHref && (
            <a href={sourceHref} target="_blank" rel="noreferrer" style={{ color: '#24709D' }}>
              {'</>'} Source
            </a>
          )}
        </div>
      </div>
      {alerts && <div style={{ width: '100%', marginTop: 16 }}>{alerts}</div>}
    </>
  );
}
