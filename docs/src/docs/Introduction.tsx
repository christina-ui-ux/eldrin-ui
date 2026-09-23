// Converted from the old attached-MDX Introduction.mdx to a CSF story so
// it's picked up by GlobalDocsContainer's `pageDocs` parameter (same
// header+tabs treatment every other docs page gets) — an unattached MDX
// file has no story behind it for GlobalDocsContainer to read parameters
// from. No Code tab: Introduction isn't one file with a "source" to show.
//
// This is the landing page for someone arriving from GitHub, not just a
// contributor already in the repo — pitch, current status, and roadmap
// come first, ahead of the token/spec mechanics detail. Status/roadmap
// content is kept in sync with README.md's "What I'm exploring"/"The
// plan" by hand (no shared source yet) — update both when either changes.

export function Introduction() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section>
        <p>
          Eldrin UI is a React component library that ships design tokens with intent metadata
          and components with machine-readable specs, so both humans and AI agents can reason
          about <em>why</em> a token or component exists, not just what it renders.
        </p>
        <p>
          Most component libraries ship components. Eldrin UI is an attempt to ship{' '}
          <strong>meaning</strong> alongside them — every token carries what it's for, what it's
          not for, and its accessibility requirements; every component is defined by a spec,
          written before any code, that both a human and an AI agent can read and act on.
        </p>
      </section>

      <section>
        <h2>Status</h2>
        <p>
          <strong>Early-stage experiment</strong> — the token system is the furthest along: a
          four-layer pipeline (primitive → scale → semantic → component) with intent metadata on
          every semantic token, compiled by Style Dictionary. Five components have specs written
          (<strong>Foundation</strong>, <strong>Button</strong>, <strong>Input</strong>,{' '}
          <strong>Badge</strong>, <strong>Card</strong>), but none are implemented yet — every one
          is still a stub. <strong>Button</strong> is closest: it already has its own component
          tokens and a Storybook story slot wired up, waiting on a real implementation.
        </p>
      </section>

      <section>
        <h2>Roadmap</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <strong>Now</strong>
            <ul>
              <li>Token system with intent metadata, on a stable Style Dictionary pipeline</li>
              <li>Specs written for five components</li>
              <li>This Storybook docs site — tokens, glossary, and component pages as they land</li>
            </ul>
          </div>
          <div>
            <strong>Next</strong>
            <ul>
              <li>Real component implementations, starting with Button, rendered live here</li>
              <li>Figma library with Token Studio sync</li>
              <li>Figma MCP integration for automated drift detection between design and code</li>
            </ul>
          </div>
          <div>
            <strong>Later</strong>
            <ul>
              <li>Full component coverage</li>
              <li>Contribution guidelines</li>
              <li>Theming support</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2>Design tokens</h2>
        <p>
          Tokens are hand-authored in <code>packages/eldrin-ui/tokens-source/</code> and document
          their intent — what they're for, what they're not for — and their accessibility
          requirements. See <strong>Foundation/Tokens</strong> for how the system fits together,{' '}
          <strong>Foundation/Colors</strong> for the generated color palette, and{' '}
          <strong>Foundation/Typography</strong> for the type system.
        </p>
      </section>

      <section>
        <h2>Component specs</h2>
        <p>
          Every component ships a <code>&lt;NAME&gt;.md</code> spec alongside its implementation,
          stating its <code>classification</code> (container/control) and the{' '}
          <code>rationale</code> behind it. The spec is the single source of truth generating both
          the implementation and the Figma component. Component stories live next to each component's spec
          under <code>packages/eldrin-ui/src/components/&lt;Name&gt;/</code>.
        </p>
      </section>
    </div>
  );
}
