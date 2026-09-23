// Overview tab content for the Typography documentation page (usage
// guidance — how to apply the bundle, when to reach for which role).
// The Tokens tab (the exhaustive, generated value listing) lives in
// TypographyTokens.tsx instead — wired up as a separate tab via
// GlobalDocsContainer's `pageDocs` parameter (Typography.stories.tsx).
// See ADR 0016 for the bundled-role token model documented here, and
// docs/glossary.yaml's "type scale roles" entry for the closed role
// list. Its own top-level Foundation page, not nested under
// Foundation/Colors — typography is a large enough surface (family
// split, weight steps, seven roles) to warrant its own place in the
// sidebar rather than a third tab alongside Colors.
//
// `ui` is the only type set today. An `editorial` set (larger, more
// generous sizing for content-led pages, modeled on Carbon Design
// System's style strategies) was designed and built, then deferred —
// see ADR 0016's "Style strategy" section. Every token/class stays
// `ui`-qualified rather than bare (`type.ui.heading-1`, `.ui-heading-1`)
// specifically so re-adding `editorial` later is additive, not a rename.
import type { CSSProperties } from 'react';
import generatedCss from '../../../packages/eldrin-ui/src/tokens/generated.css?raw';
import { extractBlocks, extractVars, resolveValue } from './generatedCss';

const SETS = ['ui'] as const;
const ROLES = ['heading-1', 'heading-2', 'heading-3', 'body', 'body-small', 'caption', 'label'] as const;
const WEIGHT_STEPS = ['regular', 'medium', 'semibold', 'bold'] as const;

type SetName = (typeof SETS)[number];

interface RoleStyle {
  set: SetName;
  role: string;
  fontFamily: string;
  size: string;
  largeSize: string;
  lineHeight: string;
  weight: string;
  letterSpacing: string;
}

function buildRoleStyles(css: string) {
  const blocks = extractBlocks(css);
  const themeBlock = blocks.find((b) => b.selector === '@theme');
  const vars = themeBlock ? extractVars(themeBlock.body) : new Map<string, string>();

  const largeBlock = blocks.find((b) => b.selector === '[data-scale="large"]');
  const largeVars = largeBlock ? extractVars(largeBlock.body) : new Map<string, string>();

  const families = {
    heading: resolveValue(vars.get('--type-family-heading') ?? '', vars),
    body: resolveValue(vars.get('--type-family-body') ?? '', vars),
  };

  const weights = WEIGHT_STEPS.map((step) => ({
    step,
    value: resolveValue(vars.get(`--weight-${step}`) ?? '', vars),
  }));

  const roles: RoleStyle[] = SETS.flatMap((set) =>
    ROLES.map((role) => {
      const sizeVar = `--type-${set}-${role}-size`;
      const largeRaw = largeVars.get(sizeVar);
      return {
        set,
        role,
        fontFamily: resolveValue(vars.get(`--type-${set}-${role}-family`) ?? '', vars),
        size: resolveValue(vars.get(sizeVar) ?? '', vars),
        largeSize: largeRaw ? resolveValue(largeRaw, largeVars) : resolveValue(vars.get(sizeVar) ?? '', vars),
        lineHeight: resolveValue(vars.get(`--type-${set}-${role}-line-height`) ?? '', vars),
        weight: resolveValue(vars.get(`--type-${set}-${role}-weight`) ?? '', vars),
        letterSpacing: resolveValue(vars.get(`--type-${set}-${role}-letter-spacing`) ?? '', vars),
      };
    })
  );

  return { families, weights, roles };
}

function roleStyle(role: RoleStyle): CSSProperties {
  return {
    fontFamily: role.fontFamily,
    fontSize: role.size,
    lineHeight: role.lineHeight,
    fontWeight: role.weight,
    letterSpacing: role.letterSpacing,
  };
}

const ROLE_GUIDANCE: Record<(typeof ROLES)[number], { use: string; notFor: string }> = {
  'heading-1': {
    use: "The page's own title, or a top-level section title. Usually appears once per page.",
    notFor: 'a subsection title (use heading-2) or body copy.',
  },
  'heading-2': {
    use: 'A subsection title beneath a heading-1.',
    notFor: "the page's own title, or body copy.",
  },
  'heading-3': {
    use: 'The smallest heading step — a card, panel, or grouped-content title beneath a heading-2.',
    notFor: 'a page or subsection title, or body copy.',
  },
  body: {
    use: 'Default paragraph copy — the size most on-screen reading text uses.',
    notFor: 'headings, fine print, or text set on a control (use label).',
  },
  'body-small': {
    use: 'A reduced-size body copy for secondary or supporting text blocks alongside primary body copy.',
    notFor: 'primary reading copy (use body), headings, or captions.',
  },
  caption: {
    use: 'The smallest text role — fine print, timestamps, metadata set beneath primary content.',
    notFor: 'primary reading copy, or text set on a control (use label).',
  },
  label: {
    use: "Text set on or directly alongside a control — a button label, an input's own label, a tag.",
    notFor: 'free-standing prose (use body/body-small) or headings.',
  },
};

export function TypographyOverview() {
  const { roles } = buildRoleStyles(generatedCss);
  const heading1 = roles.find((r) => r.role === 'heading-1')!;
  const body = roles.find((r) => r.role === 'body')!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section>
        <h2>Usage</h2>
        <p>
          Typography is a <em>bundled-role</em> model: pick one of seven named roles, and apply its
          five sibling properties together — <code>size</code>, <code>line-height</code>,{' '}
          <code>weight</code>, <code>family</code>, <code>letter-spacing</code> — rather than
          choosing a font size on its own. The fast path is one class, a generated Tailwind{' '}
          <code>@utility</code> named <code>ui-&lt;role&gt;</code>:
        </p>
        <pre style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
          <code>{`<h1 className="ui-heading-1">…</h1>`}</code>
        </pre>
        <p>
          That class is generated from, and stays interchangeable with, the same five custom
          properties — reach for those directly only when a component genuinely needs to split
          the bundle apart (e.g. a CSS-in-JS style object, or overriding just one property on top
          of the class):
        </p>
        <pre style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
          <code>{`.my-heading {
  font-family: var(--type-ui-heading-1-family);
  font-size: var(--type-ui-heading-1-size);
  line-height: var(--type-ui-heading-1-line-height);
  font-weight: var(--type-ui-heading-1-weight);
  letter-spacing: var(--type-ui-heading-1-letter-spacing);
}`}</code>
        </pre>
        <p>
          Both the token path and the class name are <code>ui</code>-qualified even though it's the
          only type set right now — <code>type.ui.heading-1</code>, <code>.ui-heading-1</code>,
          never a bare <code>heading-1</code>. An <code>editorial</code> set (larger, more
          generously spaced, for content-led pages) was designed and deferred; keeping the
          qualifier means adding it back is additive, not a rename.
        </p>
        <p>
          Text <em>color</em> is a separate concern, governed by the <code>text.*</code> color
          tokens (see the Colors page) — a role says how big and how heavy; pair it with the
          right <code>text.*</code> token for contrast.
        </p>
      </section>

      <section>
        <h2>Choosing a role</h2>
        <p>
          The role vocabulary is closed (see <code>docs/glossary.yaml</code>) — extend it there
          before inventing a new one in a component spec.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ROLES.map((role) => (
            <div key={role}>
              <div style={{ fontFamily: 'monospace', fontWeight: 600, marginBottom: 4 }}>type.ui.{role}</div>
              <div>{ROLE_GUIDANCE[role].use}</div>
              <div style={{ color: '#64748b' }}>Not for: {ROLE_GUIDANCE[role].notFor}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Two families, one typeface today</h2>
        <p>
          Heading roles (<code>heading-1/2/3</code>) use <code>type.family.heading</code>; every
          other role uses <code>type.family.body</code>. Both currently resolve to the same
          typeface, IBM Plex Sans — kept as two separate tokens so headings can later get their
          own display face by editing one alias, without touching every heading role. This
          package doesn't bundle the font file; a consuming app loads IBM Plex Sans itself.
        </p>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <p style={roleStyle(heading1)}>Heading sample</p>
          <p style={roleStyle(body)}>Body copy sample</p>
        </div>
      </section>

      <section>
        <h2>Scale</h2>
        <p>
          <code>size</code> scales automatically with the systemwide <code>medium</code>/
          <code>large</code> scale axis — roughly ×1.25 from medium to large, the same
          as spacing. <code>line-height</code> and <code>letter-spacing</code> do not scale on
          their own: <code>line-height</code> is already a unitless ratio of <code>size</code>,
          and <code>letter-spacing</code> is authored in <code>em</code>, so both stay correct as
          size changes without their own medium/large value. Never override a role's{' '}
          <code>line-height</code> independently of its <code>size</code> — they're designed as a
          pair (see each token's <code>pairsWith</code> intent in{' '}
          <code>tokens-source/semantic.json</code>).
        </p>
      </section>
    </div>
  );
}

export function Typography() {
  return <TypographyOverview />;
}
