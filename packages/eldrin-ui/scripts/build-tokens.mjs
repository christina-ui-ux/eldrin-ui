#!/usr/bin/env node
// Generates Tailwind v4 @theme CSS from hand-authored token source in
// Tokens Studio's folder-mode shape ($metadata.json + $themes.json +
// one JSON file per set) in tokens-source/. Code is the single source
// of truth here — Tokens Studio's Git sync only ever Pulls this into
// Figma, never pushes into this repo. See
// docs/decisions/0013-tokens-studio-replaces-figma-native-import.md.
//
// Usage:
//   node scripts/build-tokens.mjs
//
// Each of the three themes declared in tokens-source/$themes.json
// (light-medium/dark/large) is resolved independently to a flat token
// tree via Style Dictionary + @tokens-studio/sd-transforms — multi-set
// merging and {a.b.c} reference resolution reuse that maintained
// toolchain rather than a hand-rolled parser (ADR 0013's explicit
// reason for replacing the old Figma-export build-tokens.mjs).
//
// light-medium is the default (unscoped) theme; dark/large are each
// diffed against it and only the CSS vars whose value actually differs
// are emitted into their override block. A semantic/component token
// that aliases another token is emitted as var(--target), not a copy
// of the resolved value, so it's never part of either diff — only the
// primitive/scale leaf values a theme actually swaps ever show up in
// [data-primitives="dark"] / [data-scale="large"].
//
// A semantic token's intent (usage/notFor/status/pairsWith) is
// hand-authored inline in its own entry in tokens-source/semantic.json
// — $description holds usage, $extensions["com.eldrin-ui.intent"]
// holds the rest. See docs/decisions/0015-token-intent-inline-in-source.md.
// This script only reads and validates that block; it never writes
// back into tokens-source/.

import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from '@tokens-studio/sd-transforms';
import StyleDictionary from 'style-dictionary';

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url));
const SOURCE_DIR = join(PACKAGE_ROOT, 'tokens-source');
const OUTPUT_PATH = join(PACKAGE_ROOT, 'src', 'tokens', 'generated.css');

register(StyleDictionary);

// Every tokens-source/ set's generic collection, for CSS namespace
// purposes — extend this whenever a new set is added (same
// register-it-by-hand convention ADR 0008/0009 already accepted for
// DEFAULT_MODE/COLLECTION_PREFIX).
const SET_COLLECTION = {
  'primitives-light': 'primitives',
  'primitives-dark': 'primitives',
  'type-primitives': 'type-primitives',
  'scale-medium': 'scale',
  'scale-large': 'scale',
  semantic: 'semantic',
  component: 'component',
};

// Collections whose paths need a namespace prefix before CSS var
// naming — primitives' top-level group is a palette name ("seagull"),
// not "color", so every primitives path is prefixed before namespace
// resolution: "seagull.300" -> "color.seagull.300" -> "--color-seagull-300".
// semantic/component/scale group names are already descriptive.
const COLLECTION_PREFIX = { primitives: 'color' };

// Top-level path group -> Tailwind @theme namespace, for groups whose
// source name doesn't match the CSS namespace directly.
const NAMESPACES = { space: 'spacing' };

// Unit appended to a bare number, keyed by the CSS namespace (scale
// tokens are unitless numbers in tokens-source/). fontsize/lineheight
// group names are written without a hyphen in tokens-source/ so this
// lookup (which only reads formatLiteral()'s first hyphen-segment of
// the CSS var name) resolves correctly — a hyphenated group name like
// "font-size" would collapse to just "font" here.
const UNITS = { spacing: 'px', fontsize: 'px', letterspacing: 'em' };

// Maps a `type.<set>.<role>.<property>` semantic token's last path segment
// to the CSS property the generated `@utility` bundle sets it on — see
// buildUtilityBlocks() below and docs/decisions/0016-typography-token-model.md's
// "Bundled utility classes" section.
const TYPE_ROLE_PROPERTY_CSS = {
  size: 'font-size',
  'line-height': 'line-height',
  weight: 'font-weight',
  family: 'font-family',
  'letter-spacing': 'letter-spacing',
};
// Only `ui` exists today — `editorial` was designed and then deferred
// (see docs/decisions/0016-typography-token-model.md's "Style strategy"
// section); add it back to this alternation when tokens-source/ has
// `type.editorial.*` tokens again.
const TYPE_ROLE_PATH = /^type\.(ui)\.([a-z0-9-]+)\.(size|line-height|weight|family|letter-spacing)$/;

// The only set whose tokens carry intent — primitives/scale are raw
// values consumed by the layers above them, component is a pure alias
// into semantic (see docs/glossary.yaml's "token layer order" entry).
const INTENT_TRACKED_SET = 'semantic';
const INTENT_EXTENSION_KEY = 'com.eldrin-ui.intent';
const INTENT_STATUSES = new Set(['stable', 'experimental', 'deprecated']);

const DEFAULT_THEME = 'light-medium';
const OVERRIDE_SELECTORS = {
  dark: '[data-primitives="dark"]',
  large: '[data-scale="large"]',
};

const GENERATED_HEADER = `/* AUTO-GENERATED by scripts/build-tokens.mjs — do not edit by hand.
 * Source: tokens-source/ (Tokens Studio folder-mode JSON — see ADR 0013)
 * Regenerate: npm run tokens:build
 */
`;

function loadThemes() {
  const metadata = JSON.parse(readFileSync(join(SOURCE_DIR, '$metadata.json'), 'utf8'));
  const themes = JSON.parse(readFileSync(join(SOURCE_DIR, '$themes.json'), 'utf8'));
  return { setOrder: metadata.tokenSetOrder, themes };
}

function activeSets(theme, setOrder) {
  return setOrder.filter((set) => theme.selectedTokenSets[set] === 'enabled');
}

function collectionOf(setName) {
  const name = SET_COLLECTION[setName];
  if (!name) {
    throw new Error(`Set "${setName}" has no SET_COLLECTION entry — add one in build-tokens.mjs.`);
  }
  return name;
}

function cssVarName(path, setName) {
  const prefix = COLLECTION_PREFIX[collectionOf(setName)];
  const [group, ...rest] = prefix ? [prefix, ...path] : path;
  const namespace = NAMESPACES[group] ?? group;
  return `--${namespace}-${rest.join('-')}`;
}

function isAlias(token) {
  return typeof token.original.$value === 'string' && /^\{.*\}$/.test(token.original.$value);
}

function formatLiteral(token, varName) {
  const { $type } = token;
  const raw = token.original.$value;
  if ($type === 'color') {
    if (typeof raw !== 'string') {
      throw new Error(
        `Token "${token.path.join('.')}" has a $type "color" value that isn't a string: ${JSON.stringify(raw)}`
      );
    }
    return raw;
  }
  if ($type === 'number') {
    const namespace = varName.slice(2).split('-')[0];
    return `${raw}${UNITS[namespace] ?? ''}`;
  }
  if ($type === 'fontFamily') {
    const names = Array.isArray(raw) ? raw : [raw];
    return names.map((name) => (/\s/.test(name) ? `"${name}"` : name)).join(', ');
  }
  throw new Error(
    `Token "${token.path.join('.')}" has an unsupported $type "${$type}". ` +
      `Extend build-tokens.mjs's formatLiteral() to handle it.`
  );
}

// Resolves one theme (a list of active sets) to a Map<varName, cssValue>,
// via Style Dictionary + the tokens-studio preprocessor for multi-set
// merge and {a.b.c} reference resolution — not a copy of the resolved
// literal for an alias, but var(--target) indirection, computed from
// the source $value (still "{a.b.c}" pre-resolution) rather than the
// preprocessor's own flattened $value.
async function resolveTheme(setNames) {
  const sourceFiles = setNames.map((name) => join(SOURCE_DIR, `${name}.json`));
  const sd = new StyleDictionary({
    source: sourceFiles,
    preprocessors: ['tokens-studio'],
    platforms: { css: { transformGroup: 'tokens-studio' } },
  });
  const dictionary = await sd.getPlatformTokens('css');

  const knownSets = new Set(setNames);
  const resolved = dictionary.allTokens.map((token) => {
    const setName = basename(token.filePath, '.json');
    if (!knownSets.has(setName)) {
      throw new Error(`Token "${token.path.join('.')}" came from an unexpected file "${token.filePath}".`);
    }
    return { token, setName, rawPath: token.path.join('.'), varName: cssVarName(token.path, setName) };
  });

  const varNameByRawPath = new Map(resolved.map((r) => [r.rawPath, r.varName]));

  const entries = new Map();
  for (const { token, rawPath, varName } of resolved) {
    if (isAlias(token)) {
      const targetPath = token.original.$value.slice(1, -1);
      const targetVarName = varNameByRawPath.get(targetPath);
      if (!targetVarName) {
        throw new Error(
          `Token "${rawPath}" aliases "${targetPath}", which doesn't resolve to any token active in this ` +
            `theme (${setNames.join(', ')}) — check tokens-source/ for a missing or renamed source token.`
        );
      }
      entries.set(varName, `var(${targetVarName})`);
    } else {
      entries.set(varName, formatLiteral(token, varName));
    }
  }
  return { entries, resolved };
}

// Bundles every `type.<set>.<role>.*` role into one `@utility <set>-<role>`
// block (Tailwind v4's custom-utility at-rule — tree-shaken the same as any
// built-in utility, only emitted into a consumer's build if that class name
// is actually used) so a component can write one class instead of wiring up
// four or five separate custom properties by hand. Built once from the
// default theme's resolved token list — a `var()` reference, not a copied
// literal, so the same block stays correct under the dark/large override
// selectors without needing its own per-theme variants.
function buildUtilityBlocks(resolved) {
  const bundles = new Map();
  for (const { rawPath, varName } of resolved) {
    const match = TYPE_ROLE_PATH.exec(rawPath);
    if (!match) continue;
    const [, set, role, property] = match;
    const key = `${set}-${role}`;
    if (!bundles.has(key)) bundles.set(key, new Map());
    bundles.get(key).set(property, varName);
  }

  const blocks = [];
  for (const [className, props] of bundles) {
    const declarations = [...props].map(([property, varName]) => `  ${TYPE_ROLE_PROPERTY_CSS[property]}: var(${varName});`);
    blocks.push(`@utility ${className} {\n${declarations.join('\n')}\n}`);
  }
  return blocks.join('\n\n');
}

function generateCss(themeEntries, orderedVarNames) {
  const defaultEntries = themeEntries.get(DEFAULT_THEME);
  const lines = [GENERATED_HEADER, '@theme {'];
  for (const varName of orderedVarNames) {
    lines.push(`  ${varName}: ${defaultEntries.get(varName)};`);
  }
  lines.push('}');

  for (const [themeId, selector] of Object.entries(OVERRIDE_SELECTORS)) {
    const entries = themeEntries.get(themeId);
    const overrideLines = orderedVarNames
      .filter((varName) => entries.get(varName) !== defaultEntries.get(varName))
      .map((varName) => `  ${varName}: ${entries.get(varName)};`);
    if (overrideLines.length === 0) continue;
    lines.push('', `${selector} {`, ...overrideLines, '}');
  }
  return lines.join('\n') + '\n';
}

// ---- intent validation ----
// Intent lives inline on each semantic token in tokens-source/semantic.json
// ($description for usage, $extensions["com.eldrin-ui.intent"] for
// status/notFor/pairsWith/deprecated) — see ADR 0015. Nothing here is
// written back to tokens-source/; a semantic token with no intent block
// at all is treated as the implicit "experimental" (not yet reviewed)
// default, same as ADR 0009's stub used to be before a human filled it in.
function collectIntentIssues(resolved) {
  const issues = [];
  for (const { token, setName, rawPath } of resolved) {
    if (collectionOf(setName) !== INTENT_TRACKED_SET) continue;

    const intent = token.original.$extensions?.[INTENT_EXTENSION_KEY] ?? {};
    const usage = token.original.$description;
    const { status = 'experimental', notFor, deprecated } = intent;

    if (!INTENT_STATUSES.has(status)) {
      throw new Error(
        `Token "${rawPath}" has $extensions["${INTENT_EXTENSION_KEY}"].status "${status}" — must be one of ` +
          `${[...INTENT_STATUSES].join('/')}.`
      );
    }

    if (status === 'experimental') {
      issues.push(
        `${rawPath}: status is "experimental" (or missing) — not yet reviewed. Fill in $description/notFor ` +
          `and set status to "stable" (or "deprecated") in tokens-source/semantic.json.`
      );
    } else if (status === 'stable' && (!usage || !notFor)) {
      issues.push(`${rawPath}: status is "stable" but $description/notFor is empty — fill both in before marking stable.`);
    } else if (status === 'deprecated' && !deprecated?.replacement) {
      issues.push(`${rawPath}: status is "deprecated" but deprecated.replacement is empty.`);
    }
  }
  return issues;
}

async function main() {
  const { setOrder, themes } = loadThemes();

  const themeEntries = new Map();
  let defaultResolved = null;
  for (const theme of themes) {
    const setNames = activeSets(theme, setOrder);
    const { entries, resolved } = await resolveTheme(setNames);
    themeEntries.set(theme.id, entries);
    if (theme.id === DEFAULT_THEME) defaultResolved = resolved;
  }
  if (!defaultResolved) {
    throw new Error(`No theme named "${DEFAULT_THEME}" found in tokens-source/$themes.json.`);
  }

  const orderedVarNames = [...themeEntries.get(DEFAULT_THEME).keys()];
  const themeCss = generateCss(themeEntries, orderedVarNames);
  const utilityCss = buildUtilityBlocks(defaultResolved);
  const css = utilityCss ? `${themeCss}\n${utilityCss}\n` : themeCss;
  writeFileSync(OUTPUT_PATH, css, 'utf8');
  console.log(`tokens:build wrote ${relative(PACKAGE_ROOT, OUTPUT_PATH)}`);

  const issues = collectIntentIssues(defaultResolved);
  if (issues.length > 0) {
    throw new Error(
      `${issues.length} token(s) in tokens-source/semantic.json need intent review before tokens:build can pass:\n` +
        issues.map((m) => `  - ${m}`).join('\n')
    );
  }
}

try {
  await main();
} catch (err) {
  console.error(`tokens:build failed: ${err.message}`);
  process.exitCode = 1;
}
