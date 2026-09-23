// Ported from the old docs/src/pages/tokens/colors.astro (Astro→Storybook
// migration, ADR 0012). Overview tab content (usage guidance) for the
// Colors documentation page. The Tokens tab (the exhaustive, generated
// value listing) lives in ColorsTokens.tsx instead — wired up as a
// separate tab via GlobalDocsContainer's `pageDocs` parameter
// (TokensColors.stories.tsx). See Typography.tsx's header comment for
// why the Overview/Tokens split exists.

export function ColorsOverview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section>
        <h2>Layers</h2>
        <p>
          Colors resolve through three layers, each a `var()` alias into the one below it (see
          the glossary's "token layer order"): <strong>primitive</strong> (the raw palette, e.g.{' '}
          <code>seagull.600</code>) → <strong>semantic</strong> (a role name, e.g.{' '}
          <code>bg.fill.interaction</code>) → <strong>component</strong> (a component's own name
          for a semantic token, e.g. <code>button.primary.text</code>). A component always
          reaches for its own component token, never a semantic or primitive one directly — that
          indirection is what lets a semantic re-alias (say, swapping which primitive{' '}
          <code>bg.fill.interaction</code> points to) reach every component that uses it without
          editing the component.
        </p>
      </section>

      <section>
        <h2>Surface vs. fill</h2>
        <p>
          Which semantic set a component draws from is fixed by its classification: a{' '}
          <strong>container</strong> component (Card, Modal — accepts child content)
          uses <code>bg.surface.*</code>, paired with the base text/icon tokens (no suffix). A{' '}
          <strong>control</strong> component (Button, Badge — atomic) uses <code>bg.fill.*</code>,
          and <em>must</em> pair it with the matching <code>onFill</code> text/icon variant (e.g.{' '}
          <code>text.on-fill-primary</code>) — never a base text token on a <code>bg.fill.*</code>
          , since contrast against a fill color is only guaranteed by its own <code>onFill</code>{' '}
          pair.
        </p>
      </section>

      <section>
        <h2>Accessibility pairing</h2>
        <p>
          A semantic color token's intent metadata (<code>tokens-source/semantic.json</code>)
          names the tokens it's contrast-verified against in <code>pairsWith</code> — e.g.{' '}
          <code>bg.fill.error</code> pairs with <code>text.on-fill-error</code>. Follow that
          pairing rather than picking a text color that merely looks right; it's the only
          contrast guarantee the token system makes.
        </p>
      </section>

      <section>
        <h2>Dark mode</h2>
        <p>
          Only the primitive layer swaps between light and dark (<code>[data-primitives="dark"]
          </code>). Semantic and component tokens never need their own dark variant — as plain{' '}
          <code>var()</code> aliases, they automatically follow whichever primitive is active.
        </p>
      </section>
    </div>
  );
}

export function TokenColors() {
  return <ColorsOverview />;
}
