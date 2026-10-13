/**
 * Every roadmap node href carrying a #fragment must point at an id that really
 * exists. validate-graphs only checks that the file is there, so a renamed or
 * imagined section anchor would ship as a link that silently lands at the top
 * of the page.
 */
import fs from 'node:fs';
import path from 'node:path';

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.html') ? [path.join(d, e.name)] : []);

const ids = new Map();
const idsOf = (file) => {
  if (!ids.has(file)) {
    const html = fs.readFileSync(file, 'utf8');
    ids.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return ids.get(file);
};

let bad = 0, checked = 0;
for (const page of walk('roadmaps')) {
  const html = fs.readFileSync(page, 'utf8');
  const m = html.match(/id="rgGraph">([\s\S]*?)<\/script>/);
  if (!m) continue;
  const dir = path.dirname(page);
  for (const n of JSON.parse(m[1]).nodes) {
    if (!n.href || !n.href.includes('#')) continue;
    // a soon node points at where its page will live; nothing to check yet
    if (n.status === 'soon') continue;
    const [file, frag] = n.href.split('#');
    const target = path.join(dir, file);
    if (!fs.existsSync(target)) { console.log(`MISSING FILE ${page} ${n.id} -> ${n.href}`); bad++; continue; }
    checked++;
    if (!idsOf(target).has(frag)) { console.log(`DEAD ANCHOR  ${page} ${n.id} -> ${n.href}`); bad++; }
  }
}
console.log(bad ? `\n${bad} bad of ${checked} anchors` : `  ok  all ${checked} roadmap anchors resolve`);
process.exit(bad ? 1 : 0);
