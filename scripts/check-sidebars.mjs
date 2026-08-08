/**
 * Every lesson in a section must list every other lesson in that section.
 *
 * Sidebars are hardcoded per page. Adding a page therefore reaches only the
 * pages that get regenerated — a new lesson can exist, be in the manifest, be
 * in search, and still be unreachable from any of its own siblings.
 *
 * Compares each page's sidebar against the .html files actually in its
 * directory, so a page added and never linked fails the build.
 */
import fs from 'node:fs';
import path from 'node:path';

const skip = new Set(['node_modules', '.git', '.claude', 'docs', '.superpowers']);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? (skip.has(e.name) ? [] : walk(path.join(d, e.name)))
    : e.name.endsWith('.html') ? [path.join(d, e.name)] : []);

const errors = [];
const byDir = {};

for (const f of walk('.')) {
  const html = fs.readFileSync(f, 'utf8');
  // only pages carrying a section sidebar are in scope
  if (!html.includes('class="sb-link')) continue;
  const dir = path.dirname(f);
  (byDir[dir] = byDir[dir] || []).push(f);
}

for (const [dir, files] of Object.entries(byDir)) {
  if (dir === '.') continue;                       // repo root is not a section

  const onDisk = new Set(
    fs.readdirSync(dir).filter((n) => n.endsWith('.html') && n !== 'index.html')
  );
  if (!onDisk.size) continue;

  for (const f of files) {
    const html = fs.readFileSync(f, 'utf8');
    const linked = new Set(
      [...html.matchAll(/<a class="sb-link[^"]*" href="([^"#][^"]*)"/g)].map((m) => m[1])
    );
    /* Some sections give the sidebar over to an on-page table of contents
       instead of a list of siblings — every link is a #fragment. That is a
       different design, not a missing link. */
    if (!linked.size) continue;

    // a page does not link to itself
    const self = path.basename(f);
    const missing = [...onDisk].filter((n) => n !== self && !linked.has(n));
    if (missing.length) {
      errors.push(`${f.replace(/\\/g, '/')}: sidebar omits ${missing.join(', ')}`);
    }

    /* Every lesson ends with prev/next. Without it the reader finishes a page
       and has nowhere obvious to go, which is how a generated page dead-ends
       while looking finished. */
    if (self !== 'index.html' && !html.includes('class="page-nav"')) {
      errors.push(`${f.replace(/\\/g, '/')}: no prev/next navigation at the end of the lesson`);
    }
  }
}

if (errors.length) {
  console.log('Pages whose sidebar does not list every lesson in their section:\n');
  errors.forEach((e) => console.log('  ' + e));
  if (errors.length > 40) console.log(`  … and ${errors.length - 40} more`);
  console.log(`\n${errors.length} problem(s)`);
  process.exit(1);
}
console.log(`  ok  every section sidebar lists all of its lessons`);
