#!/usr/bin/env node
// Enforces docs/glossary.yaml naming decisions against the codebase.
// See docs/decisions/0002-glossary-governance.md for the contract this
// script implements.
//
// Usage:
//   node scripts/lint-glossary.mjs            scan the whole repo
//   node scripts/lint-glossary.mjs <paths...>  scan only these files
//
// Exit code 1 if any `decided`-entry violation is found. `needs-decision`
// hits are reported as warnings and do not affect the exit code.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const GLOSSARY_PATH = join(ROOT, 'docs', 'glossary.yaml');

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.md']);

// Paths (relative to repo root, POSIX-style) excluded from the default
// walk. ADRs and the glossary itself legitimately name superseded/
// rejected terms as history, not violations.
const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist']);
const EXCLUDED_FILES = new Set([
  'docs/glossary.yaml',
]);
const EXCLUDED_PREFIXES = ['docs/decisions/'];

function toPosix(p) {
  return p.split(sep).join('/');
}

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = toPosix(relative(ROOT, full));
    const st = statSync(full);
    if (st.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry)) continue;
      walk(full, out);
    } else {
      if (EXCLUDED_FILES.has(rel)) continue;
      if (EXCLUDED_PREFIXES.some((p) => rel.startsWith(p))) continue;
      if (!SCAN_EXTENSIONS.has(extname(entry))) continue;
      out.push(full);
    }
  }
  return out;
}

function defaultTargets() {
  const files = [];
  walk(join(ROOT, 'packages'), files);
  walk(join(ROOT, 'docs'), files);
  for (const f of ['README.md', 'CLAUDE.md', 'DESIGN.md']) {
    const full = join(ROOT, f);
    try {
      statSync(full);
      files.push(full);
    } catch {
      // optional file, skip if missing
    }
  }
  return files;
}

function splitCandidates(term) {
  return term
    .split(/\s+vs\.?\s+|\/|,/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function escapeRegex(term) {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Matches a term as a standalone word: kebab-case, snake_case, quoted
// strings, plain prose ("brand", "bg-fill-brand", "brand_color").
function wordRegex(term) {
  return new RegExp(`\\b${escapeRegex(term)}\\b`, 'gi');
}

// Matches a term glued into camelCase/PascalCase identifiers
// ("isPressed", "onChecked") that the word-boundary regex above can't
// see, since `\b` doesn't fire between two word characters.
function camelRegex(term) {
  const capitalized = term[0].toUpperCase() + term.slice(1);
  return new RegExp(`(?<=[a-z0-9])${escapeRegex(capitalized)}(?![a-z])`, 'g');
}

function loadGlossary() {
  const raw = readFileSync(GLOSSARY_PATH, 'utf8');
  const doc = parseYaml(raw);
  return doc.entries ?? [];
}

function buildRules(entries) {
  const banned = []; // { pattern, term, category, canonical, source }
  const watched = []; // needs-decision candidates

  for (const entry of entries) {
    if (entry.status === 'decided') {
      const terms = [
        ...(entry.supersedes ? [entry.supersedes] : []),
        ...(entry.forbidden ?? []),
      ];
      for (const t of terms) {
        banned.push({
          patterns: [wordRegex(t), camelRegex(t)],
          term: t,
          category: entry.category,
          canonical: entry.term,
          decision: entry.decision,
        });
      }
    } else if (entry.status === 'needs-decision') {
      for (const t of splitCandidates(entry.term)) {
        watched.push({
          patterns: [wordRegex(t), camelRegex(t)],
          term: t,
          category: entry.category,
          entryTerm: entry.term,
        });
      }
    }
  }
  return { banned, watched };
}

function scanFile(file, banned, watched, errors, warnings) {
  const rel = toPosix(relative(ROOT, file));
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, i) => {
    for (const rule of banned) {
      const m = firstMatch(rule.patterns, line);
      if (m) {
        errors.push({
          file: rel,
          line: i + 1,
          match: m,
          canonical: rule.canonical,
          category: rule.category,
        });
      }
    }
    for (const rule of watched) {
      const m = firstMatch(rule.patterns, line);
      if (m) {
        warnings.push({
          file: rel,
          line: i + 1,
          match: m,
          entryTerm: rule.entryTerm,
          category: rule.category,
        });
      }
    }
  });
}

function firstMatch(patterns, line) {
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    const m = pattern.exec(line);
    if (m) return m[0];
  }
  return null;
}

function main() {
  const args = process.argv.slice(2);
  const entries = loadGlossary();
  const { banned, watched } = buildRules(entries);

  if (banned.length === 0 && watched.length === 0) {
    console.log('No enforceable glossary rules found (nothing to lint).');
    return;
  }

  const targets = args.length > 0 ? args.map((a) => resolve(process.cwd(), a)) : defaultTargets();

  const errors = [];
  const warnings = [];
  for (const file of targets) {
    scanFile(file, banned, watched, errors, warnings);
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log(`glossary lint: clean (${targets.length} files scanned, ${banned.length} banned terms checked)`);
    return;
  }

  if (errors.length > 0) {
    console.log(`\n${errors.length} glossary violation(s):\n`);
    for (const e of errors) {
      console.log(
        `  ${e.file}:${e.line}  "${e.match}" is superseded — use "${e.canonical}" (${e.category})`
      );
    }
  }

  if (warnings.length > 0) {
    console.log(`\n${warnings.length} needs-decision term(s) in use:\n`);
    for (const w of warnings) {
      console.log(
        `  ${w.file}:${w.line}  "${w.match}" — "${w.entryTerm}" (${w.category}) has no fixed decision yet; resolve in docs/glossary.yaml before this ships`
      );
    }
  }

  console.log('');
  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

main();
