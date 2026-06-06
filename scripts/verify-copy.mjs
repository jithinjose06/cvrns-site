#!/usr/bin/env node
/**
 * Build-time copy guard: ensures critical glyphs were not deleted or replaced
 * with placeholders. Complements check-encoding.mjs (which catches corruption).
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'src';
const ARROW = '\u2197';
const MIDDOT = '\u00b7';
const EM_DASH = '\u2014';

const problems = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.astro')) checkFile(p);
  }
}

function checkFile(file) {
  const text = fs.readFileSync(file, 'utf8');

  const arSpans = (text.match(/class="ar"/g) || []).length;
  const arrows = (text.match(/\u2197/g) || []).length;
  if (arSpans > 0 && arrows < arSpans) {
    problems.push(
      `${file}: ${arSpans} arrow span(s) but only ${arrows} NE ARROW glyph(s) (U+2197)`
    );
  }

  if (text.includes('class="ar">?')) {
    problems.push(`${file}: arrow span contains literal '?' (corrupted glyph)`);
  }
}

walk(ROOT);

// Spot-check high-value copy that broke in production before.
const spotChecks = [
  {
    file: 'src/pages/store.astro',
    mustInclude: [MIDDOT, ARROW],
    label: 'store middot + checkout arrow',
  },
  {
    file: 'src/pages/index.astro',
    mustInclude: [EM_DASH, ARROW, MIDDOT],
    label: 'home em dash, arrows, middot',
  },
  {
    file: 'src/pages/music.astro',
    mustInclude: [EM_DASH, MIDDOT, ARROW],
    label: 'music em dash, middot, arrows',
  },
];

for (const { file, mustInclude, label } of spotChecks) {
  if (!fs.existsSync(file)) {
    problems.push(`${file}: missing (spot check: ${label})`);
    continue;
  }
  const text = fs.readFileSync(file, 'utf8');
  for (const ch of mustInclude) {
    if (!text.includes(ch)) {
      problems.push(
        `${file}: missing ${JSON.stringify(ch)} (U+${ch.codePointAt(0).toString(16)}) -- ${label}`
      );
    }
  }
}

if (problems.length) {
  console.error('Copy verification failed:\n' + problems.map((p) => '  ' + p).join('\n'));
  process.exit(1);
}

console.log('Copy verification passed (critical glyphs present).');
