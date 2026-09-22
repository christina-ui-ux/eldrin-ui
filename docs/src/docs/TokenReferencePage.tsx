// Shared shell for a token-reference page (search bar, grouped tables of
// Name/Value/Preview, a sticky right-hand "Content" nav that tracks
// scroll position) — laid out to match a reference design-system
// token-reference page. Used by both TypographyTokens.tsx and
// ColorsTokens.tsx; each of those only builds its own `groups` data and
// `preview` renderers (a font sample vs. a color swatch) — everything
// about search/layout/scrollspy lives here once.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export interface TokenRow {
  name: string;
  value: string;
  preview: ReactNode;
  /**
   * Optional per-row description (a semantic token's own intent
   * `$description`, e.g.) — primitives and other tokens with no intent
   * of their own simply omit it. A table only renders the Description
   * column at all if at least one of its rows has one.
   */
  description?: string;
}

export interface TokenSubgroup {
  id: string;
  label: string;
  rows: TokenRow[];
}

export interface TokenGroup {
  id: string;
  label: string;
  children: TokenSubgroup[];
}

export function PreviewBox({
  children,
  width = 72,
  height = 48,
}: {
  children: ReactNode;
  width?: number;
  height?: number;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

function matchesQuery(row: TokenRow, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    row.name.toLowerCase().includes(q) ||
    row.value.toLowerCase().includes(q) ||
    (row.description?.toLowerCase().includes(q) ?? false)
  );
}

// Every column gets the same left+right padding — Storybook's default
// docs-table stylesheet puts a border on each th/td, not just around
// the outside of the table, so each column sits flush against its own
// divider line unless it has its own inset (relying on a neighboring
// column's padding for a shared gap doesn't work here, since there's a
// border sitting exactly between them).
const tableHeaderStyle: CSSProperties = {
  textAlign: 'left',
  fontSize: 13,
  color: '#64748b',
  fontWeight: 600,
  padding: '12px 24px',
  borderBottom: '1px solid #e2e8f0',
};

const tableCellStyle: CSSProperties = {
  padding: '20px 24px',
};

function TokenTable({ rows }: { rows: TokenRow[] }) {
  const hasDescriptions = rows.some((row) => row.description);
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={tableHeaderStyle}>Name</th>
          <th style={tableHeaderStyle}>Value</th>
          {hasDescriptions && <th style={tableHeaderStyle}>Description</th>}
          <th style={tableHeaderStyle}>Preview</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={tableCellStyle}>
              <code
                style={{
                  backgroundColor: '#f1f5f9',
                  borderRadius: 4,
                  padding: '6px 10px',
                  fontSize: 13,
                  color: '#1e293b',
                }}
              >
                {row.name}
              </code>
            </td>
            <td style={{ ...tableCellStyle, fontFamily: 'monospace', fontSize: 13, color: '#334155' }}>
              {row.value}
            </td>
            {hasDescriptions && (
              <td style={{ ...tableCellStyle, fontSize: 13, color: '#334155', maxWidth: 360 }}>
                {row.description ?? '—'}
              </td>
            )}
            <td style={tableCellStyle}>{row.preview}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NavLink({
  id,
  label,
  activeId,
  onClick,
  indent = true,
  bold = false,
}: {
  id: string;
  label: string;
  activeId: string;
  onClick: (id: string) => void;
  indent?: boolean;
  bold?: boolean;
}) {
  const isActive = activeId === id;
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        backgroundColor: 'transparent',
        border: 'none',
        borderLeft: isActive ? '2px solid #24709D' : '2px solid transparent',
        padding: `4px 0 4px ${indent ? 16 : 8}px`,
        marginBottom: 2,
        color: isActive ? '#24709D' : '#334155',
        fontWeight: isActive || bold ? 600 : 400,
        cursor: 'pointer',
        fontSize: 13,
      }}
    >
      {label}
    </button>
  );
}

export function TokenReferencePage({
  heading,
  searchPlaceholder,
  groups,
}: {
  heading: string;
  searchPlaceholder: string;
  groups: TokenGroup[];
}) {
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>(groups[0]?.id ?? '');
  const headingRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    function onScroll() {
      // This tab's content stays mounted (just `hidden`) while a
      // sibling tab is active — a `display: none` ancestor collapses
      // every heading's rect to 0, so exclude anything not actually
      // laid out right now rather than trust a measurement taken while
      // hidden. Sorted by DOM position (not Map insertion order, which
      // isn't reliable since registerHeading is a fresh closure every
      // render) — walk top-to-bottom and keep the last heading that's
      // scrolled past the threshold, falling back to the topmost one.
      const byPosition = [...headingRefs.current.entries()]
        .filter(([, el]) => el.offsetParent !== null)
        .map(([id, el]) => [id, el.getBoundingClientRect().top] as const)
        .sort((a, b) => a[1] - b[1]);
      let current = byPosition[0]?.[0] ?? '';
      for (const [id, top] of byPosition) {
        if (top <= 120) current = id;
      }
      if (current) setActiveId(current);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function registerHeading(id: string) {
    return (el: HTMLElement | null) => {
      if (el) headingRefs.current.set(id, el);
      else headingRefs.current.delete(id);
    };
  }

  function jumpTo(id: string) {
    headingRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const filteredGroups = groups
    .map((group) => ({
      ...group,
      children: group.children
        .map((sub) => ({ ...sub, rows: sub.rows.filter((row) => matchesQuery(row, query)) }))
        .filter((sub) => sub.rows.length > 0),
    }))
    .filter((group) => group.children.length > 0);

  return (
    <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ marginBottom: 24 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 999,
              border: '1px solid #e2e8f0',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {filteredGroups.length === 0 && <p style={{ color: '#64748b' }}>No tokens match "{query}".</p>}

        {filteredGroups.map((group, i) => (
          <div key={group.id}>
            <h2 ref={registerHeading(group.id)} style={{ marginBottom: 8 }}>
              {i === 0 ? heading : group.label}
            </h2>
            {group.children.map((sub) => (
              <section key={sub.id} style={{ marginBottom: 32 }}>
                <h3 ref={registerHeading(sub.id)} style={{ marginBottom: 12 }}>
                  {sub.label}
                </h3>
                <TokenTable rows={sub.rows} />
              </section>
            ))}
          </div>
        ))}
      </div>

      <nav style={{ width: 180, flexShrink: 0, position: 'sticky', top: 16, fontSize: 13 }}>
        <div style={{ color: '#94a3b8', fontWeight: 600, letterSpacing: 0.5, marginBottom: 8 }}>CONTENT</div>
        {groups.map((group, i) => (
          <div key={group.id} style={{ marginTop: i === 0 ? 0 : 12 }}>
            <NavLink
              id={group.id}
              label={i === 0 ? heading : group.label}
              activeId={activeId}
              onClick={jumpTo}
              indent={false}
              bold={i > 0}
            />
            {group.children.map((sub) => (
              <NavLink key={sub.id} id={sub.id} label={sub.label} activeId={activeId} onClick={jumpTo} indent />
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
}
