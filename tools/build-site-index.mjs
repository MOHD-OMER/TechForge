/**
 * Build TF_SITE_INDEX from all HTML pages for global search.
 * Run: node tools/build-site-index.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const SECTION_LABELS = {
  dsa: 'DSA',
  python: 'Python',
  devops: 'DevOps',
  'system-design': 'System Design',
  databases: 'Database Systems',
  aiml: 'AI/ML',
  interview: 'Interview',
};

const SECTION_ICONS = {
  dsa: '📊',
  python: '🐍',
  devops: '⎇',
  'system-design': '🏗️',
  databases: '🗄️',
  aiml: '🤖',
  interview: '🎯',
};

const SKIP = new Set(['index.html']);

function walk(dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      // .claude holds agent worktrees: full copies of the site that would
      // otherwise land in the index as duplicate search results.
      if (name === 'node_modules' || name === '.git' || name === '.claude') continue;
      walk(full, list);
    } else if (name.endsWith('.html')) {
      list.push(full);
    }
  }
  return list;
}

function parsePage(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  const parts = rel.split('/');
  const file = parts[parts.length - 1];
  if (file === 'index.html' && parts.length === 1) return null;

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  let title = titleMatch ? titleMatch[1].replace(/\s*—\s*TechForge.*$/i, '').trim() : file.replace('.html', '');
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
  const desc = descMatch ? descMatch[1].slice(0, 120) : title;

  let sectionKey;
  let href;
  if (parts.length === 1) {
    sectionKey = 'home';
    href = file;
  } else {
    sectionKey = parts[0];
    href = parts.slice(-2).join('/');
  }

  if (sectionKey === 'home' && file === 'about.html') {
    sectionKey = 'about';
  }

  const section = SECTION_LABELS[sectionKey] || sectionKey;
  const icon = SECTION_ICONS[sectionKey] || '📄';
  const id = sectionKey + '/' + file.replace('.html', '');

  /* The real progress key, read off the page rather than derived: a page's
     data-topic-id does not follow from its path (system-design/cdn.html is
     sd/cdn, programming/javascript/dom.html is js/dom). Anything that wants to
     know whether a lesson is finished needs this, and `id` above is a synthetic
     search key that only looks like it would do. `path` is the full repo-
     relative path — `href` is the last two segments, which is a relative link,
     not something you can match on. */
  const topicMatch = html.match(/data-topic-id="([^"]+)"/);

  return {
    id,
    title,
    desc,
    icon,
    section,
    sectionKey,
    href,
    path: rel,
    topic: topicMatch ? topicMatch[1] : null,
    depth: html.includes('lesson-layout') || html.includes('class="layout"') ? 'guide' : 'page',
  };
}

const files = walk(root);
const pages = files.map(parsePage).filter(Boolean);
pages.sort((a, b) => a.href.localeCompare(b.href));

const out = `/**
 * Auto-generated site-wide search index. Regenerate: node tools/build-site-index.mjs
 */
(function () {
  window.TF_SITE_INDEX = ${JSON.stringify(pages, null, 2)};

  if (window.TF_TOPIC_INDEX && window.TF_SITE_INDEX) {
    var seen = {};
    window.TF_TOPIC_INDEX.forEach(function (t) { seen[t.href] = true; });
    window.TF_SITE_INDEX.forEach(function (p) {
      if (!seen[p.href]) window.TF_TOPIC_INDEX.push(p);
    });
  } else if (window.TF_SITE_INDEX && !window.TF_TOPIC_INDEX) {
    window.TF_TOPIC_INDEX = window.TF_SITE_INDEX.slice();
  }
})();
`;

const outPath = path.join(root, 'assets/js/site-index.js');
fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote', outPath, 'with', pages.length, 'pages');
