#!/usr/bin/env node
// Enforces that every component's <NAME>.md spec is actually filled in,
// not left as the TODO stub CLAUDE.md's template produces.
// See docs/decisions/0011-spec-single-source-of-truth.md (why the spec is
// authoritative and the required section list) and
// docs/decisions/0010-blueprint-completeness-lint.md (the completeness
// contract this script implements — carried over from the blueprint name).
//
// Usage:
//   node scripts/check-specs.mjs

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url));
const COMPONENTS_DIR = join(PACKAGE_ROOT, 'src', 'components');

const REQUIRED_SECTIONS = [
  'Intent',
  'Anatomy',
  'Variants',
  'Sizes',
  'States',
  'Tokens used',
  'Content guidelines',
  'Accessibility',
  'Responsive behavior',
  'Props',
  "Do's and don'ts",
  'Related components',
];

function isUnwritten(text) {
  const trimmed = text.trim();
  return trimmed.length === 0 || /\bTODO\b/.test(trimmed);
}

function checkSpec(dirName, filePath) {
  const issues = [];
  const content = readFileSync(filePath, 'utf8');

  const classificationMatch = content.match(/^classification:\s*(.*)$/m);
  const classification = classificationMatch?.[1]?.trim() ?? '';
  if (!/^(container|control)$/.test(classification)) {
    issues.push(
      `classification is "${classification || '(missing)'}" — must be exactly "container" or "control"`
    );
  }

  const rationaleMatch = content.match(/^rationale:\s*(.*)$/m);
  const rationale = rationaleMatch?.[1] ?? '';
  if (isUnwritten(rationale)) {
    issues.push('rationale is still unwritten (TODO)');
  }

  const headingPositions = [...content.matchAll(/^## (.+)$/gm)].map((m) => ({
    name: m[1].trim(),
    index: m.index,
    end: m.index + m[0].length,
  }));

  for (const name of REQUIRED_SECTIONS) {
    const heading = headingPositions.find((h) => h.name === name);
    if (!heading) {
      issues.push(`missing "## ${name}" section`);
      continue;
    }
    const nextIndex = headingPositions.find((h) => h.index > heading.index)?.index ?? content.length;
    const body = content.slice(heading.end, nextIndex);
    if (isUnwritten(body)) {
      issues.push(`"## ${name}" section is still unwritten (TODO)`);
    }
  }

  return issues;
}

function findSpecs() {
  const found = [];
  for (const dirName of readdirSync(COMPONENTS_DIR)) {
    const dirPath = join(COMPONENTS_DIR, dirName);
    if (!statSync(dirPath).isDirectory()) continue;
    const specPath = join(dirPath, `${dirName.toUpperCase()}.md`);
    try {
      statSync(specPath);
    } catch {
      found.push({ dirName, specPath, missing: true });
      continue;
    }
    found.push({ dirName, specPath, missing: false });
  }
  return found;
}

function main() {
  const specs = findSpecs();
  const results = [];

  for (const spec of specs) {
    if (spec.missing) {
      results.push({ dirName: spec.dirName, issues: [`no ${spec.dirName.toUpperCase()}.md spec found`] });
      continue;
    }
    const issues = checkSpec(spec.dirName, spec.specPath);
    if (issues.length > 0) {
      results.push({ dirName: spec.dirName, issues });
    }
  }

  if (results.length === 0) {
    console.log(`check:specs: clean (${specs.length} spec(s) reviewed)`);
    return;
  }

  console.log(`\n${results.length} of ${specs.length} spec(s) incomplete:\n`);
  for (const r of results) {
    console.log(`  ${r.dirName}:`);
    for (const issue of r.issues) {
      console.log(`    - ${issue}`);
    }
  }
  console.log('');
  process.exitCode = 1;
}

main();
