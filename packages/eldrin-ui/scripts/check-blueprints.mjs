#!/usr/bin/env node
// Enforces that every component's <NAME>.md blueprint is actually
// filled in, not left as the TODO stub CLAUDE.md's template produces.
// See docs/decisions/0010-blueprint-completeness-lint.md for the
// contract this script implements.
//
// Usage:
//   node scripts/check-blueprints.mjs

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url));
const COMPONENTS_DIR = join(PACKAGE_ROOT, 'src', 'components');

const REQUIRED_SECTIONS = [
  'Intent',
  'Anatomy',
  'Variants',
  'States',
  'Tokens used',
  'Accessibility',
];

function isUnwritten(text) {
  const trimmed = text.trim();
  return trimmed.length === 0 || /\bTODO\b/.test(trimmed);
}

function checkBlueprint(dirName, filePath) {
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

function findBlueprints() {
  const found = [];
  for (const dirName of readdirSync(COMPONENTS_DIR)) {
    const dirPath = join(COMPONENTS_DIR, dirName);
    if (!statSync(dirPath).isDirectory()) continue;
    const blueprintPath = join(dirPath, `${dirName.toUpperCase()}.md`);
    try {
      statSync(blueprintPath);
    } catch {
      found.push({ dirName, blueprintPath, missing: true });
      continue;
    }
    found.push({ dirName, blueprintPath, missing: false });
  }
  return found;
}

function main() {
  const blueprints = findBlueprints();
  const results = [];

  for (const bp of blueprints) {
    if (bp.missing) {
      results.push({ dirName: bp.dirName, issues: [`no ${bp.dirName.toUpperCase()}.md blueprint found`] });
      continue;
    }
    const issues = checkBlueprint(bp.dirName, bp.blueprintPath);
    if (issues.length > 0) {
      results.push({ dirName: bp.dirName, issues });
    }
  }

  if (results.length === 0) {
    console.log(`check:blueprints: clean (${blueprints.length} blueprint(s) reviewed)`);
    return;
  }

  console.log(`\n${results.length} of ${blueprints.length} blueprint(s) incomplete:\n`);
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
