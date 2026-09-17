import { Children, isValidElement, useState, type ReactElement, type ReactNode } from 'react';

// Storybook has no built-in Overview/Code/Changelog tab navigation for
// a docs page — this reimplements that page shape by
// hand (structure only, not content, copied from reviewing another
// design system's Storybook; see docs/decisions/0012-storybook-
// replaces-astro-docs-site.md) as a plain client-side tab switcher.
// Docs-site tooling, not part of the design system — used only by
// GlobalDocsContainer (docs/src/docs/GlobalDocsContainer.tsx).

interface TabPanelProps {
  children?: ReactNode;
}

function definePanel(label: string, defaultContent?: ReactNode) {
  function Panel({ children }: TabPanelProps) {
    return <>{children ?? defaultContent}</>;
  }
  Panel.tabLabel = label;
  return Panel;
}

const Overview = definePanel('Overview');
const Code = definePanel('Code');
const Changelog = definePanel(
  'Changelog',
  <p>No per-component changelog exists yet — see the repo's commit history.</p>,
);

function ComponentDocsTabsImpl({ header, children }: { header?: ReactNode; children: ReactNode }) {
  const panels = Children.toArray(children).filter(isValidElement) as ReactElement<
    TabPanelProps,
    { tabLabel: string }
  >[];
  const [active, setActive] = useState(0);

  return (
    <>
      {/* header (e.g. <ComponentDocsHeader>) shares this content block
          with the tablist, so the tab row sits directly under the title. */}
      <div className="header">
        {header}
        <div role="tablist" className="tablist">
          {panels.map((panel, i) => {
            const label = (panel.type as { tabLabel?: string }).tabLabel ?? `Tab ${i + 1}`;
            const isActive = active === i;
            return (
              <button
                key={label}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(i)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #24709D' : '2px solid transparent',
                  background: 'none',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#161B3E' : '#594C5B',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="content">
        {panels.map((panel, i) => (
          <div key={i} hidden={active !== i}>
            {panel}
          </div>
        ))}
      </div>
    </>
  );
}

export const ComponentDocsTabs = Object.assign(ComponentDocsTabsImpl, {
  Overview,
  Code,
  Changelog,
});
