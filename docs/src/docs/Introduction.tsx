// Converted from the old attached-MDX Introduction.mdx to a CSF story so
// it's picked up by GlobalDocsContainer's `pageDocs` parameter (same
// header+tabs treatment every other docs page gets) — an unattached MDX
// file has no story behind it for GlobalDocsContainer to read parameters
// from. No Code tab: Introduction isn't one file with a "source" to show.

export function Introduction() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section>
        <p>
          Eldrin UI is a React component library that ships design tokens with intent metadata
          and components with machine-readable specs, so both humans and AI agents can reason
          about <em>why</em> a token or component exists, not just what it renders.
        </p>
      </section>

      <section>
        <h2>Design tokens</h2>
        <p>
          Tokens are hand-authored in <code>packages/eldrin-ui/tokens-source/</code> and document
          their intent — what they're for, what they're not for — and their accessibility
          requirements. See <strong>Foundation/Colors</strong> for the generated color palette
          and <strong>Foundation/Typography</strong> for the type system.
        </p>
      </section>

      <section>
        <h2>Component specs</h2>
        <p>
          Every component ships a <code>&lt;NAME&gt;.md</code> spec alongside its implementation,
          stating its <code>classification</code> (container/control) and the{' '}
          <code>rationale</code> behind it. The spec is the single source of truth generating both
          the implementation and the Figma component (see ADR 0011 in{' '}
          <code>docs/decisions/</code>). Component stories live next to each component's spec
          under <code>packages/eldrin-ui/src/components/&lt;Name&gt;/</code>.
        </p>
      </section>
    </div>
  );
}
