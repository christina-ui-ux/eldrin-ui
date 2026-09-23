// General "how tokens work here" overview — not tied to one token
// category. Foundation/Colors and Foundation/Typography cover their own
// categories in depth; this page is the map that points to them, plus
// the parts (layering, intent metadata, build pipeline) that aren't
// specific to any one category. Overview only, no Tokens/Code tab —
// there's no single generated file this page is "the source" of.

export function Tokens() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section>
        <p>
          Tokens are hand-authored in <code>packages/eldrin-ui/tokens-source/</code> and carry
          intent metadata inline — what a token is for, what it's explicitly not for — so both
          humans and AI agents can reason about <em>why</em> a token exists, not just what value
          it resolves to.
        </p>
      </section>

      <section>
        <h2>Layers</h2>
        <p>
          Four layers, each built from the one before it via <code>npm run tokens:build</code>{' '}
          (Style Dictionary), compiling down to <code>packages/eldrin-ui/src/tokens/generated.css</code>:
        </p>
        <ul>
          <li>
            <strong>Primitive</strong> — raw values with no meaning of their own (a color ramp
            step, a type family). No intent block: there's nothing to explain yet.
          </li>
          <li>
            <strong>Scale</strong> — spacing/font-size steps, doubled under a <code>medium</code>/
            <code>large</code> axis a consuming app picks at the root. Also no intent block.
          </li>
          <li>
            <strong>Semantic</strong> — the layer components actually use (<code>bg.*</code>,{' '}
            <code>text.*</code>, <code>border.*</code>, <code>type.*</code>). Aliases primitives,
            and is where intent metadata lives. A component's <code>classification</code> decides
            which semantic set it draws from — <code>container</code> uses{' '}
            <code>bg-surface-*</code> + base text/icon tokens, <code>control</code> uses{' '}
            <code>bg-fill-*</code> + <code>onFill</code> text/icon tokens.
          </li>
          <li>
            <strong>Component</strong> — tokens scoped to one component, when a semantic token
            isn't specific enough. Rationale for these lives in that component's own{' '}
            <code>&lt;NAME&gt;.md</code> spec instead of an intent block.
          </li>
        </ul>
      </section>

      <section>
        <h2>Intent metadata</h2>
        <p>
          Every semantic token in <code>tokens-source/semantic.json</code> carries:
        </p>
        <ul>
          <li>
            <strong>$description</strong> — what the token is for.
          </li>
          <li>
            <strong>notFor</strong> — what it's explicitly not for, to head off a plausible-
            looking misuse.
          </li>
          <li>
            <strong>pairsWith</strong> — other tokens it's designed to be used alongside, e.g. a
            fill paired with the text token contrast-verified against it.
          </li>
          <li>
            <strong>status</strong> — <code>stable</code> / <code>experimental</code> /{' '}
            <code>deprecated</code> (a deprecated entry names its <code>replacement</code>).
          </li>
        </ul>
      </section>

      <section>
        <h2>Where to look next</h2>
        <p>
          <strong>Foundation/Colors</strong> and <strong>Foundation/Typography</strong> render the
          generated tokens for those two categories. Naming decisions and the vocabulary behind
          them live in <strong>Docs Overview/Glossary</strong> (<code>docs/glossary.yaml</code>).
          The full designer-facing reference is <code>DESIGN.md</code>.
        </p>
      </section>
    </div>
  );
}
