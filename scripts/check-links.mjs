/**
 * Every local href and src must resolve to a real file, relative to the page.
 *
 * The lychee job in CI checks the deployed site, where a root-absolute path
 * like /assets/js/pyrun.js resolves fine. Opened from disk it does not, and
 * this project supports opening pages from disk — 219 pages linked the
 * dashboard that way and eleven Python pages loaded Pyodide that way, so
 * neither worked offline. That is the gap this closes.
 */
import fs from 'node:fs';
import path from 'node:path';

const dirs = process.argv.slice(2).length ? process.argv.slice(2) : ['.'];
const skip = new Set(['node_modules', '.git', '.claude', 'docs', '.superpowers']);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? (skip.has(e.name) ? [] : walk(path.join(d, e.name)))
    : e.name.endsWith('.html') ? [path.join(d, e.name)] : []);

let checked = 0, bad = 0;
for (const dir of dirs) {
  for (const f of walk(dir)) {
    /* Strip code samples first. A lesson teaching ES modules literally shows
       src="app.js" inside a <code> block; that is content, not a link. */
    const html = fs.readFileSync(f, 'utf8')
      .replace(/<pre[\s\S]*?<\/pre>/g, '')
      .replace(/<code[\s\S]*?<\/code>/g, '');
    const base = path.dirname(f);
    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const raw = m[1];
      if (/^(https?:|mailto:|data:|about:|#|\/\/)/.test(raw)) continue;
      // hrefs built inside inline scripts are not literals
      if (raw.includes("' +") || raw.includes('${') || raw === '...') continue;
      const target = path.normalize(path.join(base, raw.split('#')[0].split('?')[0]));
      if (!target || target.endsWith(path.sep)) continue;
      checked++;
      if (!fs.existsSync(target)) { console.log(`DEAD ${f} -> ${raw}`); bad++; }
    }
  }
}
console.log(bad ? `\n${bad} dead of ${checked}` : `  ok  ${checked} links resolve`);
process.exit(bad ? 1 : 0);
