/**
 * Regenerate the parts of README.md that go stale.
 *
 * The README claimed 29 DSA topics, 26 system-design guides, 23 DevOps guides
 * and 275 pages long after those were 30, 32, 33 and 335. It also listed two
 * scripts that no longer exist and omitted eight that do, and its file tree was
 * missing seven whole sections. Every one of those is derivable from the repo,
 * so none of them is written by hand any more.
 *
 *   node tools/sync-readme.mjs           rewrite the generated blocks
 *   node tools/sync-readme.mjs --check   fail if they have drifted (CI)
 *
 * Everything between a <!-- x:start --> / <!-- x:end --> pair is owned by this
 * script. Prose outside those markers is hand-written and never touched.
 */
import fs from 'node:fs';
import path from 'node:path';

const README = 'README.md';

/* ── facts ─────────────────────────────────────────────────────────── */
const SKIP = new Set(['node_modules', '.git', '.claude', 'docs', '.github']);
const walk = (d, out = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!SKIP.has(e.name)) walk(path.join(d, e.name), out); }
    else if (e.name.endsWith('.html')) out.push(path.join(d, e.name));
  }
  return out;
};

const lessons = (dir) => {
  try {
    return fs.readdirSync(dir).filter((f) => f.endsWith('.html') && f !== 'index.html').length;
  } catch { return 0; }
};

const lessonsDeep = (dir) => {
  try { return walk(dir).filter((f) => !f.endsWith(`${path.sep}index.html`)).length; }
  catch { return 0; }
};

/* The curated, user-facing track list, in the order the home page offers them.
   A fourth field overrides how the count is derived, for the tracks whose pages
   do not live in their own directory — Roles is a hub over roadmaps/paths. */
const TRACKS = [
  ['Roadmaps', 'roadmaps', 'Every topic and career path, as a followable route'],
  ['Roles', 'roles', 'Career paths with progress, filtering and comparison',
    () => fs.readdirSync('roadmaps/paths').filter((f) => f.endsWith('.html')).length],
  ['DSA', 'dsa', 'Algorithms and data structures, with Canvas visualizers'],
  ['Programming', 'programming', 'Python, JavaScript, TypeScript, Java and C++'],
  ['Frontend', 'frontend', 'The browser platform, React, tooling and accessibility'],
  ['Backend', 'backend', 'Node, API design, data access and transactions'],
  ['System Design', 'system-design', 'Distributed systems, plus architecture practice'],
  ['Databases', 'databases', 'A full SQL guide and fourteen engine deep-dives'],
  ['DevOps', 'devops', 'Containers, CI/CD, cloud, reliability and cost'],
  ['OS & Networks', 'systems', 'Operating systems, networking, security, theory'],
  ['Data', 'data', 'Statistics, experimentation, pipelines and modelling'],
  ['AI / ML', 'aiml', 'ML through generative systems and their evaluation'],
  ['QA & Testing', 'qa', 'The pyramid, automation, API and load testing'],
  ['Mobile', 'mobile', 'Native and cross-platform, lifecycle to release'],
  ['Game Development', 'games', 'Maths, engines, graphics, physics and netcode'],
  ['Blockchain', 'blockchain', 'Consensus, smart contracts, tooling and security'],
  ['Interview Prep', 'interview', 'Question banks, flashcards and a timed quiz'],
];

const questions = fs.readdirSync('interview')
  .filter((f) => f.endsWith('.html') && f !== 'index.html')
  .reduce((n, f) => n + (fs.readFileSync(path.join('interview', f), 'utf8').match(/class="qna-item"/g) || []).length, 0);

const roadmaps =
  fs.readdirSync('roadmaps').filter((f) => f.endsWith('.html') && f !== 'index.html').length +
  fs.readdirSync('roadmaps/paths').filter((f) => f.endsWith('.html')).length;

const pages = walk('.').length;
const tracks = (fs.readFileSync('index.html', 'utf8').match(/class="topic-card/g) || []).length;

/* ── generated blocks ──────────────────────────────────────────────── */
const blocks = {};

blocks.stats = [
  `| | |`,
  `|---|---|`,
  `| Lessons | **${pages}** pages, every one hand-written |`,
  `| Roadmaps | **${roadmaps}** — ${fs.readdirSync('roadmaps').filter((f) => f.endsWith('.html') && f !== 'index.html').length} topic, ${fs.readdirSync('roadmaps/paths').filter((f) => f.endsWith('.html')).length} career paths |`,
  `| Interview questions | **${questions}** across ${lessons('interview')} banks |`,
  `| Tracks | **${tracks}** |`,
  `| Runtime dependencies | **0** |`,
].join('\n');

const NESTED = new Set(['systems', 'programming', 'roadmaps']);

blocks.tracks = [
  '| Track | Pages | Covers |',
  '|---|---|---|',
  ...TRACKS.map(([label, dir, covers, override]) => {
    const n = override ? override() : NESTED.has(dir) ? lessonsDeep(dir) : lessons(dir);
    return `| [${label}](${dir}/index.html) | ${n} | ${covers} |`;
  }),
].join('\n');

const describe = {
  'assets/css': 'Design system and per-section styles',
  'assets/js': 'Progress, search, roadmap renderer, topic manifest',
  tools: 'Generators — pages, roadmaps, navbar, search index, social card',
  scripts: 'Verification suite; each one is a CI gate',
  roadmaps: 'Topic and career roadmaps, rendered from embedded graphs',
};

blocks.structure = [
  '| Path | Contents |',
  '|---|---|',
  ...Object.entries(describe).map(([p, d]) => {
    const n = p.startsWith('assets') || p === 'tools' || p === 'scripts'
      ? fs.readdirSync(p).filter((f) => !f.startsWith('.')).length + ' files'
      : lessonsDeep(p) + ' pages';
    return `| \`${p}/\` | ${d} — ${n} |`;
  }),
  `| \`sw.js\` · \`manifest.json\` | Service worker and PWA metadata |`,
  `| \`vercel.json\` | Headers, CSP, caching and redirects |`,
].join('\n');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const GATE_DESC = {
  'check:ci': 'Every `npm run` in CI resolves to a script that exists',
  'validate:graphs': 'Roadmap graphs — cycles, dangling prerequisites, dead links',
  'check:anchors': 'Every roadmap anchor points at a heading that exists',
  'check:sections': 'Every section is reachable from the home page',
  'check:links': 'Every local link resolves from disk, not only when served',
  'check:sidebars': 'Every lesson is listed by its siblings and ends with prev/next',
  'check:navbar': 'No page has drifted from the generated navbar',
  'check:entities': 'No bare ampersands in HTML text',
  'check:cache': 'No versioned asset is stale against its last edit',
  'check:readme': 'This README matches the repository',
  'check:og': 'The social card matches the site',
  a11y: 'axe-core over every page in both themes',
};
blocks.gates = [
  '| Gate | Checks |',
  '|---|---|',
  ...Object.keys(GATE_DESC).filter((k) => pkg.scripts[k]).map((k) => `| \`npm run ${k}\` | ${GATE_DESC[k]} |`),
].join('\n');

/* ── apply ─────────────────────────────────────────────────────────── */
let src = fs.readFileSync(README, 'utf8');
const eol = src.includes('\r\n') ? '\r\n' : '\n';
const missing = [];

for (const [name, body] of Object.entries(blocks)) {
  const re = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!re.test(src)) { missing.push(name); continue; }
  src = src.replace(re, `$1${eol}${body.split('\n').join(eol)}${eol}$2`);
}

if (missing.length) {
  console.log(`README is missing marker pair(s): ${missing.join(', ')}`);
  process.exit(1);
}

const current = fs.readFileSync(README, 'utf8');
if (process.argv.includes('--check')) {
  if (src !== current) {
    console.log('README.md has drifted from the repository.\n\n  Run: node tools/sync-readme.mjs');
    process.exit(1);
  }
  console.log(`  ok  README matches the repository (${pages} pages, ${roadmaps} roadmaps, ${questions} questions)`);
} else {
  fs.writeFileSync(README, src);
  console.log(`README synced — ${pages} pages, ${roadmaps} roadmaps, ${questions} questions, ${tracks} tracks`);
}
