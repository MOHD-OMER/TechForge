/**
 * Backfill a section's sidebars so every page lists every lesson.
 *
 *   node tools/link-section.mjs <dir>
 *
 * Sidebars are hardcoded per page, so adding a lesson to an established
 * section reaches only the pages that get regenerated. Everything else keeps
 * a sidebar that does not mention the new page — which is how a lesson ends
 * up unreachable from all of its siblings. Run this after adding pages to a
 * section you did not generate wholesale. `npm run check:sidebars` gates it.
 */
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) throw new Error('usage: node tools/link-section.mjs <dir>');

const titleOf = (file) => {
  const h = fs.readFileSync(file, 'utf8');
  const m = h.match(/<h1 class="pg-title">([\s\S]*?)<\/h1>/)
    || h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
    || h.match(/<title>([^<|—]+)/);
  return (m ? m[1] : path.basename(file, '.html'))
    .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
};

let pages = 0, links = 0;
for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.html'))) {
  const f = path.join(dir, name);
  let html = fs.readFileSync(f, 'utf8');
  if (!html.includes('class="sb-link')) continue;

  const linked = new Set(
    [...html.matchAll(/<a class="sb-link[^"]*" href="([^"#][^"]*)"/g)].map((m) => m[1])
  );
  if (!linked.size) continue;              // this sidebar is an on-page TOC

  const missing = fs.readdirSync(dir)
    .filter((n) => n.endsWith('.html') && n !== 'index.html' && n !== name && !linked.has(n));
  if (!missing.length) continue;

  // match the shape of the last existing link so the added ones do not stand out
  const all = [...html.matchAll(/<a class="sb-link[^"]*" href="[^"#][^"]*">[\s\S]*?<\/a>/g)];
  const last = all[all.length - 1];
  if (!last) continue;
  const numInner = (last[0].match(/<span class="sb-num">([\s\S]*?)<\/span>/) || [])[1] || '';
  const marker = /<i class=/.test(numInner) ? '<i class="ti ti-file-text"></i>' : '•';

  const added = missing.map((n) =>
    `\n    <a class="sb-link" href="${n}"><span class="sb-num">${marker}</span>${titleOf(path.join(dir, n))}</a>`
  ).join('');

  const at = last.index + last[0].length;
  fs.writeFileSync(f, html.slice(0, at) + added + html.slice(at));
  pages++; links += missing.length;
}

console.log(`${dir}: added ${links} link(s) across ${pages} page(s)`);
