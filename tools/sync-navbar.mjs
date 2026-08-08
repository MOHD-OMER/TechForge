/**
 * The navbar, in one place.
 *
 * Every page carries its own copy of the top nav — 275 of them — so adding a
 * section, renaming one, or changing the order used to mean a find-and-replace
 * across the whole site and a page that quietly kept the old list. This renders
 * the canonical nav for a given page depth and writes it into every page.
 *
 *   node tools/sync-navbar.mjs           rewrite every page
 *   node tools/sync-navbar.mjs --check   fail if any page has drifted (CI)
 *
 * Primary items are the learning path most people are on. Everything else lives
 * behind "More" — reachable in two clicks instead of competing for attention in
 * a row of eleven equal-weight links.
 */
import fs from 'node:fs';
import path from 'node:path';

const under = (dir) => (p) => p.startsWith(dir + '/');

/* `short` and `icon` are for the mobile grid, which is tighter than the bar and
   is rendered from this same list — it used to be a hand-maintained copy on
   238 pages and had drifted three sections behind. */
const PRIMARY = [
  { href: 'index.html', label: 'Home', short: 'Home', icon: 'ti-home', match: (p) => p === 'index.html' },
  { href: 'roadmaps/index.html', label: 'Roadmaps', short: 'Roadmaps', icon: 'ti-route', match: under('roadmaps') },
  { href: 'roles/index.html', label: 'Roles', short: 'Roles', icon: 'ti-briefcase', match: under('roles') },
  { href: 'programming/index.html', label: 'Programming', short: 'Programming', icon: 'ti-code', match: under('programming') },
  { href: 'dsa/index.html', label: 'DSA', short: 'DSA', icon: 'ti-chart-bar', match: under('dsa') },
  { href: 'system-design/index.html', label: 'System Design', short: 'Sys Design', icon: 'ti-building', match: under('system-design') },
  { href: 'interview/index.html', label: 'Interview', short: 'Interview', icon: 'ti-target', match: under('interview') },
];

/* Everything not on the primary row. A menu that listed only some of the
   sections would just move the old problem — Frontend, Data, Game Dev and
   AI/ML had no navbar entry at all — so this is the full remainder, grouped. */
const MORE = [
  {
    label: 'Core tracks',
    items: [
      { href: 'frontend/index.html', label: 'Frontend', short: 'Frontend', icon: 'ti-browser', match: under('frontend') },
      { href: 'databases/index.html', label: 'Databases', short: 'Databases', icon: 'ti-database', match: under('databases') },
      { href: 'devops/index.html', label: 'DevOps', short: 'DevOps', icon: 'ti-server-cog', match: under('devops') },
      { href: 'systems/index.html', label: 'OS &amp; Networks', short: 'OS &amp; Networks', icon: 'ti-cpu', match: under('systems') },
    ],
  },
  {
    label: 'Specialisms',
    items: [
      { href: 'data/index.html', label: 'Data', short: 'Data', icon: 'ti-chart-donut', match: under('data') },
      { href: 'aiml/index.html', label: 'AI &amp; ML', short: 'AI &amp; ML', icon: 'ti-robot', match: under('aiml') },
      { href: 'games/index.html', label: 'Game Dev', short: 'Game Dev', icon: 'ti-device-gamepad-2', match: under('games') },
    ],
  },
];

const MORE_ITEMS = MORE.flatMap((g) => g.items);

const ABOUT = { href: 'about.html', label: 'About', short: 'About', icon: 'ti-info-circle', match: (p) => p === 'about.html' };

const ALL = [...PRIMARY, ...MORE_ITEMS, ABOUT];

function renderNav(rel) {
  const up = '../'.repeat(rel.split('/').length - 1);
  const to = (href) => up + href;
  const link = (item) =>
    `    <a class="tb-link${item.match(rel) ? ' current' : ''}" href="${to(item.href)}">${item.label}</a>`;

  const openInMore = MORE_ITEMS.some((m) => m.match(rel));
  const moreBody = MORE.map((g) =>
    [`        <div class="tb-more-label">${g.label}</div>`].concat(
      g.items.map((m) =>
        `        <a class="tb-more-item${m.match(rel) ? ' current' : ''}" href="${to(m.href)}">${m.label}</a>`)
    ).join('\n')
  ).join('\n');

  return [
    '  <nav class="tb-nav" id="topNav">',
    ...PRIMARY.map(link),
    '    <div class="tb-more" id="tbMore">',
    `      <button type="button" class="tb-link tb-more-btn${openInMore ? ' current' : ''}" id="tbMoreBtn" aria-expanded="false" aria-controls="tbMoreMenu">More<span class="tb-more-chev" aria-hidden="true"><i class="ti ti-chevron-down"></i></span></button>`,
    '      <div class="tb-more-menu" id="tbMoreMenu" aria-labelledby="tbMoreBtn">',
    moreBody,
    '      </div>',
    '    </div>',
    link(ABOUT),
    '  </nav>',
  ].join('\n');
}

/* The mobile hamburger opens one of two panels depending on whether the page
   has a section sidebar. Both are the same list of links in different class
   names, so both are rendered from ALL rather than kept by hand. */
function renderGrid(rel, prefix) {
  const up = '../'.repeat(rel.split('/').length - 1);
  return ALL.map((s) =>
    `        <a class="tf-${prefix}-item" href="${up}${s.href}">` +
    `<span class="tf-${prefix}-icon"><i class="ti ${s.icon}"></i></span>` +
    `<span class="tf-${prefix}-text">${s.short}</span></a>`
  ).join('\n');
}

const SKIP = new Set(['node_modules', '.git', '.claude', 'docs', 'tools', 'scripts', '.github']);
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(path.join(dir, e.name), out); }
    else if (e.name.endsWith('.html')) out.push(path.join(dir, e.name));
  }
  return out;
}

const NAV_RE = /[ \t]*<nav class="tb-nav" id="topNav">[\s\S]*?<\/nav>/;
/* Most pages are CRLF. Matching a bare \n here silently found nothing and the
   mobile grids kept their stale list while the bar was updated. */
const MHN_RE = /(<div class="tf-mhn-grid">\r?\n)[\s\S]*?(\r?\n[ \t]*<\/div>)/;
const HMP_RE = /(<div class="tf-hmp-grid">\r?\n)[\s\S]*?(\r?\n[ \t]*<\/div>)/;
const eolOf = (s) => (s.includes('\r\n') ? '\r\n' : '\n');

const check = process.argv.includes('--check');
const drifted = [];
let changed = 0, skipped = 0;

for (const file of walk('.')) {
  const rel = file.replace(/\\/g, '/').replace(/^\.\//, '');
  const html = fs.readFileSync(file, 'utf8');
  if (!NAV_RE.test(html)) { skipped++; continue; }

  const eol = eolOf(html);
  const nl = (s) => (eol === '\n' ? s : s.replace(/\n/g, eol));

  let next = html.replace(NAV_RE, nl(renderNav(rel)));
  next = next.replace(MHN_RE, (m, open, close) => open + nl(renderGrid(rel, 'mhn')) + close);
  next = next.replace(HMP_RE, (m, open, close) => open + nl(renderGrid(rel, 'hmp')) + close);
  if (next === html) continue;
  if (check) { drifted.push(rel); continue; }
  fs.writeFileSync(file, next);
  changed++;
}

if (check) {
  if (drifted.length) {
    console.log('Pages whose navbar has drifted from tools/sync-navbar.mjs:\n');
    drifted.forEach((f) => console.log('  ' + f));
    console.log(`\n${drifted.length} page(s) — run: node tools/sync-navbar.mjs`);
    process.exit(1);
  }
  console.log('  ok  every navbar matches the canonical one');
} else {
  console.log(`navbar synced on ${changed} page(s); ${skipped} page(s) have no topbar`);
}
