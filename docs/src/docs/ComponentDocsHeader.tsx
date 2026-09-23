import type { ReactNode } from 'react';

// Header content above the tab navigation (structure only, not
// content — adapted from reviewing another design system's Storybook;
// see docs/decisions/0012-storybook-replaces-astro-docs-site.md). No
// wrapping element of its own: rendered via ComponentDocsTabs' `header`
// prop, inside the same .content block as the tablist, so the tab row
// sits directly under the title rather than in a separate block.
// Docs-site tooling, not part of the design system — used only by
// GlobalDocsContainer (docs/src/docs/GlobalDocsContainer.tsx).

interface ComponentDocsHeaderProps {
  /** Page display name, e.g. "Button", "Typography". */
  title: string;
  /**
   * Full-width slot directly under the title, above the tabs — reserved
   * for a future Alerts component (deprecation/experimental notices,
   * etc.), not built yet. Renders nothing, at no extra height, until a
   * caller passes something.
   */
  alerts?: ReactNode;
}

export function ComponentDocsHeader({ title, alerts }: ComponentDocsHeaderProps) {
  return (
    <>
      {/* `.header > div` is a preview.css selector (max-width: 1000px;
          margin: 0 auto) that centers header content to match `.content`
          below it — this wrapper exists so the title lines up, not for
          any layout need of its own. */}
      <div style={{ width: '100%' }}>
        <h1 style={{ margin: 0 }}>{title}</h1>
      </div>
      {alerts && <div style={{ width: '100%', marginTop: 16 }}>{alerts}</div>}
    </>
  );
}
