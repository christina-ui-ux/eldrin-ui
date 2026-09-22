// The Typography page's "Tokens" tab — builds the typography-specific
// token data (family/weight/role rows, the generated `@utility` class
// list, and their font-sample previews) on top of the shared
// TokenReferencePage shell (search, tables, sticky scrollspy nav — see
// that file). The "Utility classes" group lists the bundled `ui-<role>`
// classes build-tokens.mjs generates (ADR 0016's "Bundled utility
// classes") — same underlying values as the per-property rows in the
// set group below, just the fast-path class name instead of the five
// custom properties it sets. `SETS` stays an array of one (`ui` —
// `editorial` was designed and deferred, see ADR 0016's "Style
// strategy") rather than being inlined away, so restoring a second set
// later is additive here too. Reads
// packages/eldrin-ui/src/tokens/generated.css directly, same as the
// rest of the docs pages, so it can't drift from what actually ships —
// regenerate with `npm run tokens:build` in packages/eldrin-ui, then
// reload.
import { useMemo } from 'react';
import generatedCss from '../../../packages/eldrin-ui/src/tokens/generated.css?raw';
import { extractBlocks, extractVars, resolveValue } from './generatedCss';
import { PreviewBox, TokenReferencePage, type TokenGroup, type TokenRow, type TokenSubgroup } from './TokenReferencePage';

const SETS = ['ui'] as const;
const ROLES = ['heading-1', 'heading-2', 'heading-3', 'body', 'body-small', 'caption', 'label'] as const;
const WEIGHT_STEPS = ['regular', 'medium', 'semibold', 'bold'] as const;

function buildGroups(css: string): TokenGroup[] {
  const blocks = extractBlocks(css);
  const themeBlock = blocks.find((b) => b.selector === '@theme');
  const vars = themeBlock ? extractVars(themeBlock.body) : new Map<string, string>();
  const get = (name: string) => resolveValue(vars.get(name) ?? '', vars);

  const familyHeading = get('--type-family-heading');
  const familyBody = get('--type-family-body');

  const familyRows: TokenRow[] = [
    {
      name: '--type-family-heading',
      value: familyHeading,
      preview: <PreviewBox><span style={{ fontFamily: familyHeading }}>Ag</span></PreviewBox>,
    },
    {
      name: '--type-family-body',
      value: familyBody,
      preview: <PreviewBox><span style={{ fontFamily: familyBody }}>Ag</span></PreviewBox>,
    },
  ];

  const weightRows: TokenRow[] = WEIGHT_STEPS.map((step) => {
    const value = get(`--weight-${step}`);
    return {
      name: `--weight-${step}`,
      value,
      preview: (
        <PreviewBox>
          <span style={{ fontFamily: familyBody, fontWeight: value }}>Ag</span>
        </PreviewBox>
      ),
    };
  });

  const utilityClassGroups: TokenSubgroup[] = SETS.map((set) => {
    const rows: TokenRow[] = ROLES.map((role) => {
      const family = get(`--type-${set}-${role}-family`);
      const weight = get(`--type-${set}-${role}-weight`);
      const size = get(`--type-${set}-${role}-size`);
      const lineHeight = get(`--type-${set}-${role}-line-height`);
      const letterSpacing = get(`--type-${set}-${role}-letter-spacing`);

      return {
        name: `.${set}-${role}`,
        value: 'font-size, line-height, font-weight, font-family, letter-spacing',
        description: `${size} / ${lineHeight} / ${weight} / ${letterSpacing}`,
        preview: (
          <PreviewBox width={140}>
            <span style={{ fontFamily: family, fontWeight: weight, fontSize: size, letterSpacing, whiteSpace: 'nowrap' }}>
              Ag
            </span>
          </PreviewBox>
        ),
      };
    });

    return { id: `utility-${set}`, label: `${set} set`, rows };
  });

  const setGroups: TokenGroup[] = SETS.map((set) => {
    const roleGroups: TokenSubgroup[] = ROLES.map((role) => {
      const family = get(`--type-${set}-${role}-family`);
      const weight = get(`--type-${set}-${role}-weight`);
      const size = get(`--type-${set}-${role}-size`);
      const lineHeight = get(`--type-${set}-${role}-line-height`);
      const letterSpacing = get(`--type-${set}-${role}-letter-spacing`);

      const rows: TokenRow[] = [
        {
          name: `--type-${set}-${role}-size`,
          value: size,
          preview: (
            <PreviewBox>
              <span style={{ fontFamily: family, fontWeight: weight, fontSize: size, whiteSpace: 'nowrap' }}>Ag</span>
            </PreviewBox>
          ),
        },
        {
          name: `--type-${set}-${role}-line-height`,
          value: lineHeight,
          preview: (
            <PreviewBox>
              <span style={{ fontFamily: family, fontSize: 13, lineHeight, textAlign: 'center' }}>
                Ag
                <br />
                Ag
              </span>
            </PreviewBox>
          ),
        },
        {
          name: `--type-${set}-${role}-weight`,
          value: weight,
          preview: (
            <PreviewBox>
              <span style={{ fontFamily: family, fontWeight: weight }}>Ag</span>
            </PreviewBox>
          ),
        },
        {
          name: `--type-${set}-${role}-family`,
          value: family,
          preview: (
            <PreviewBox>
              <span style={{ fontFamily: family, fontWeight: weight }}>Ag</span>
            </PreviewBox>
          ),
        },
        {
          name: `--type-${set}-${role}-letter-spacing`,
          value: letterSpacing,
          preview: (
            <PreviewBox>
              <span style={{ fontFamily: family, fontWeight: weight, letterSpacing, whiteSpace: 'nowrap' }}>
                Agile
              </span>
            </PreviewBox>
          ),
        },
      ];

      return { id: `${set}-role-${role}`, label: role, rows };
    });

    return { id: `set-${set}`, label: `${set} set`, children: roleGroups };
  });

  return [
    {
      id: 'primitives',
      label: 'Primitives',
      children: [
        { id: 'family', label: 'Family', rows: familyRows },
        { id: 'weight', label: 'Weight', rows: weightRows },
      ],
    },
    { id: 'utility-classes', label: 'Utility classes', children: utilityClassGroups },
    ...setGroups,
  ];
}

export function TypographyTokens() {
  const groups = useMemo(() => buildGroups(generatedCss), []);
  return (
    <TokenReferencePage
      heading="Typography tokens"
      searchPlaceholder="Search type tokens by name or value…"
      groups={groups}
    />
  );
}
