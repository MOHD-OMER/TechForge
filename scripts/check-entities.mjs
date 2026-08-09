#!/usr/bin/env node
/**
 * A bare `&` in text is a parse error.
 *
 * Browsers recover from it silently, so nothing looks wrong — but the Nu
 * validator does not, and it reports the damage rather than the cause: two
 * database pages failed CI with "start tag a seen but an element of the same
 * type was already open", pointing at a line one below a perfectly balanced
 * `Interview Q&A</a>`. It took a bisect to find, and the same text had been
 * sitting in 163 files passing validation, because whether Nu notices depends
 * on what surrounds it.
 *
 * This is the deterministic version: any `&` in text that does not begin a
 * character reference fails the build, wherever it sits.
 *
 * Run: npm run check:entities
 */
import fs from 'node:fs';
import path from 'node:path';

const SKIP = new Set(['node_modules', '.git', '.claude', 'docs', '.github']);
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(path.join(dir, e.name), out); }
    else if (e.name.endsWith('.html')) out.push(path.join(dir, e.name));
  }
  return out;
}

/* named, decimal or hex — anything else after the & is bare */
const BARE = /&(?!(?:[a-zA-Z][a-zA-Z0-9]{1,31}|#\d{1,7}|#[xX][0-9a-fA-F]{1,6});)/g;
/* skip script and style bodies, and everything inside a tag */
const NON_TEXT = /<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<[^>]*>/g;

const problems = [];

for (const file of walk('.')) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = file.split(path.sep).join('/').replace(/^\.\//, '');

  let i = 0, m;
  NON_TEXT.lastIndex = 0;
  const scan = (text, offset) => {
    let b;
    BARE.lastIndex = 0;
    while ((b = BARE.exec(text))) {
      const at = offset + b.index;
      const line = src.slice(0, at).split('\n').length;
      problems.push(`${rel}:${line}  ${src.slice(Math.max(0, at - 30), at + 12).replace(/\s+/g, ' ').trim()}`);
    }
  };

  while ((m = NON_TEXT.exec(src))) {
    scan(src.slice(i, m.index), i);
    i = m.index + m[0].length;
  }
  scan(src.slice(i), i);
}

if (problems.length) {
  console.log('Bare ampersands in HTML text (write &amp;):\n');
  problems.slice(0, 40).forEach((p) => console.log('  ' + p));
  if (problems.length > 40) console.log(`  … and ${problems.length - 40} more`);
  console.log(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log('  ok  no bare ampersands in HTML text');
