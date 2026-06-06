#!/usr/bin/env node
/**
 * Source-level encoding guard (prevention, runs in milliseconds, no browser).
 *
 * Fails the build if any text source file:
 *   1. is not valid UTF-8 (e.g. saved as Windows-1252), or
 *   2. contains a U+FFFD replacement character, or
 *   3. contains a literal '?' inside an arrow span (class="ar">?) - always
 *      corruption of the ? glyph, never legitimate copy.
 *
 * This is the "shift-left" counterpart to tests/content.spec.ts: it stops the
 * bug before it reaches a render. Keep the checks content-agnostic.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOTS = ['src', 'public'];
const TEXT_EXT = new Set([
  '.astro',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.css',
  '.html',
  '.svg',
  '.md',
  '.json',
  '.txt',
]);

const decoder = new TextDecoder('utf-8', { fatal: true });
const problems = [];

function lineColAt(buf, byteIndex) {
  let line = 1;
  let col = 1;
  for (let i = 0; i < byteIndex && i < buf.length; i++) {
    if (buf[i] === 0x0a) {
      line++;
      col = 1;
    } else {
      col++;
    }
  }
  return { line, col };
}

function check(file) {
  const buf = fs.readFileSync(file);

  // 1. valid UTF-8?
  try {
    decoder.decode(buf);
  } catch {
    // locate first invalid byte for a helpful message
    let bad = -1;
    for (let i = 0; i < buf.length; i++) {
      try {
        new TextDecoder('utf-8', { fatal: true }).decode(buf.slice(0, i + 1));
      } catch {
        bad = i;
        break;
      }
    }
    const { line, col } = lineColAt(buf, bad < 0 ? 0 : bad);
    problems.push(
      `${file}:${line}:${col}  invalid UTF-8 byte 0x${(buf[bad] ?? 0).toString(16)} ` +
        `(file is likely saved as Windows-1252; re-save as UTF-8)`
    );
    return;
  }

  const text = buf.toString('utf8');

  // 2. literal replacement characters
  const idx = text.indexOf('\uFFFD');
  if (idx !== -1) {
    const ln = text.slice(0, idx).split('\n').length;
    problems.push(`${file}:${ln}  contains U+FFFD replacement character`);
  }

  // 3. corrupted arrow glyph
  const m = text.match(/class=["']ar["']>\?/);
  if (m) {
    const ln = text.slice(0, m.index).split('\n').length;
    problems.push(`${file}:${ln}  arrow span contains a literal '?' (should be the U+2197 arrow)`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (TEXT_EXT.has(path.extname(e.name))) check(p);
  }
}

for (const r of ROOTS) walk(r);

if (problems.length) {
  console.error('Encoding check failed:\n' + problems.map((p) => '  ' + p).join('\n'));
  process.exit(1);
}
console.log('Encoding check passed (UTF-8 clean).');
