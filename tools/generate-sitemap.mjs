/**
 * Regenerate sitemap.xml with correct priorities.
 * Run: node tools/generate-sitemap.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const BASE = 'https://tech-forge-dev.vercel.app';

function walk(dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === '.git' || name === 'tools') continue;
      walk(full, list);
    } else if (name.endsWith('.html')) {
      list.push(path.relative(root, full).replace(/\\/g, '/'));
    }
  }
  return list;
}

function priority(rel) {
  if (rel === 'index.html') return '1.0';
  if (/\/index\.html$/.test(rel)) return '0.9';
  if (rel.startsWith('interview/')) return '0.8';
  return '0.7';
}

const pages = walk(root).sort();
const urls = pages.map((rel) => {
  const loc = rel === 'index.html' ? `${BASE}/` : `${BASE}/${rel}`;
  return `  <url><loc>${loc}</loc><changefreq>weekly</changefreq><priority>${priority(rel)}</priority></url>`;
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(root, 'sitemap.xml'), xml, 'utf8');
console.log('Wrote sitemap.xml with', pages.length, 'URLs');
