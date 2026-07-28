/**
 * Generates a topic roadmap page per track, on the shared flow-chart renderer.
 *
 * Everything here comes from this site's own pages: the trunk is the track's
 * module order, and each module's branches are the sections that module already
 * has, deep-linked by the anchor id already in its markup. Nothing is authored
 * from an outside source, so the result is original to TechForge.
 *
 * Usage: node tools/build-roadmaps.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

/* Module order per track. Foundations first, then structure, then the advanced
   material that depends on it, ending with practice and the question bank —
   the same basics-to-advanced progression each track already teaches in. */
const TRACKS = [
  { id: 'javascript', title: 'JavaScript', accent: 'var(--js)', icon: 'ti-brand-javascript',
    dir: 'programming/javascript', hub: 'Programming', hubIcon: 'ti-brand-javascript',
    lede: 'Every JavaScript topic on TechForge in the order the track teaches it.',
    order: ['basics', 'control', 'collections', 'functions', 'oop', 'dom', 'async', 'modules', 'programs'],
    bands: { basics: 'Foundations', collections: 'Core language', dom: 'The browser', async: 'Concurrency', programs: 'Apply it' },
    interview: '../interview/js-interview.html' },

  { id: 'typescript', title: 'TypeScript', accent: 'var(--ts)', icon: 'ti-brand-typescript',
    dir: 'programming/typescript', hub: 'Programming', hubIcon: 'ti-brand-typescript',
    lede: 'The TypeScript type system, from annotations through to type-level programming.',
    order: ['basics', 'functions', 'objects', 'unions', 'generics', 'advanced-types', 'oop', 'tooling', 'programs'],
    bands: { basics: 'Foundations', unions: 'Composing types', generics: 'Type-level', tooling: 'Toolchain', programs: 'Apply it' } },

  { id: 'java', title: 'Java', accent: 'var(--orange)', icon: 'ti-coffee',
    dir: 'programming/java', hub: 'Programming', hubIcon: 'ti-coffee',
    lede: 'Java from syntax and collections through OOP, streams and concurrency.',
    order: ['basics', 'control', 'methods', 'oop', 'collections', 'exceptions', 'streams', 'concurrency', 'programs'],
    bands: { basics: 'Foundations', oop: 'Structure', streams: 'Modern Java', programs: 'Apply it' },
    interview: '../interview/java-interview.html' },

  { id: 'cpp', title: 'C++', accent: 'var(--blue)', icon: 'ti-braces',
    dir: 'programming/cpp', hub: 'Programming', hubIcon: 'ti-braces',
    lede: 'C++ from syntax to pointers, templates and the modern standard library.',
    order: ['basics', 'control', 'functions', 'pointers', 'oop', 'containers', 'templates', 'modern', 'programs'],
    bands: { basics: 'Foundations', pointers: 'Memory', templates: 'Generic code', programs: 'Apply it' },
    interview: '../interview/cpp-interview.html' },

  { id: 'os', title: 'Operating Systems', accent: 'var(--red)', icon: 'ti-cpu',
    dir: 'systems/os', hub: 'OS & Networks', hubIcon: 'ti-cpu',
    lede: 'What runs underneath your code: processes, memory, scheduling and concurrency.',
    order: ['processes', 'memory', 'scheduling', 'concurrency', 'deadlocks', 'filesystems', 'io', 'boot'],
    bands: { processes: 'Execution', concurrency: 'Sharing', filesystems: 'Storage' },
    interview: '../interview/os-interview.html' },

  { id: 'networking', title: 'Networking', accent: 'var(--cyan)', icon: 'ti-network',
    dir: 'systems/networking', hub: 'OS & Networks', hubIcon: 'ti-network',
    lede: 'How machines talk: the stack, the transport layer, and the protocols on top.',
    order: ['stack', 'tcp-udp', 'routing', 'dns', 'http', 'sockets', 'realtime', 'url-journey'],
    bands: { stack: 'The stack', dns: 'Naming', http: 'The web', realtime: 'Live data' },
    interview: '../interview/networking-interview.html' },

  { id: 'security', title: 'Security', accent: 'var(--purple)', icon: 'ti-shield-lock',
    dir: 'systems/security', hub: 'OS & Networks', hubIcon: 'ti-shield-lock',
    lede: 'Threat models, cryptography, and the attacks worth knowing by name.',
    order: ['fundamentals', 'crypto', 'authentication', 'web-security', 'network-security', 'app-security', 'incident-response'],
    bands: { fundamentals: 'Foundations', authentication: 'Identity', 'web-security': 'Attacks', 'incident-response': 'Response' },
    interview: '../interview/security-interview.html' },

  { id: 'theory', title: 'Theory of Computation', accent: 'var(--purple)', icon: 'ti-math-function',
    dir: 'systems/theory', hub: 'OS & Networks', hubIcon: 'ti-math-function',
    lede: 'What machines can compute, what they cannot, and how long it takes.',
    order: ['automata', 'regular-languages', 'grammars', 'turing-machines', 'decidability', 'complexity', 'reductions', 'p-vs-np'],
    bands: { automata: 'Machines', 'turing-machines': 'Universality', complexity: 'Cost' } },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Title of a page, from its own h1. */
function pageTitle(file) {
  const html = fs.readFileSync(file, 'utf8');
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return path.basename(file, '.html');
  return m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

/** Sections of a page: each h2 that carries an id, in document order. */
function pageSections(file) {
  const html = fs.readFileSync(file, 'utf8');
  const out = [];
  // an id-bearing wrapper followed by the h2 that titles it
  for (const m of html.matchAll(/id="(sec-[a-z0-9-]+)"[\s\S]{0,400}?<h2[^>]*>([\s\S]*?)<\/h2>/gi)) {
    const title = m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
    if (!title || /quiz/i.test(title)) continue;      // quizzes are not a topic
    if (out.some((o) => o.id === m[1])) continue;
    out.push({ id: m[1], t: title });
  }
  return out;
}

const shell = fs.readFileSync('roadmaps/dsa.html', 'utf8');
let built = 0;

for (const track of TRACKS) {
  const nodes = [];
  let prev = null;

  for (const slug of track.order) {
    const file = path.join(track.dir, `${slug}.html`);
    if (!fs.existsSync(file)) { console.log(`  skip ${track.id}: no ${file}`); continue; }

    const rel = path.relative('roadmaps', file).split(path.sep).join('/');
    const node = { id: slug, t: pageTitle(file), href: rel, tier: 'spine' };
    if (track.bands[slug]) node.g = track.bands[slug];
    if (prev) node.after = [prev];
    nodes.push(node);

    for (const sec of pageSections(file)) {
      nodes.push({ id: `${slug}-${sec.id}`, t: sec.t, href: `${rel}#${sec.id}`,
        tier: 'detail', after: [slug], bus: true });
    }
    prev = slug;
  }
  if (!nodes.length) { console.log(`  skip ${track.id}: no pages`); continue; }

  if (track.interview && fs.existsSync(track.interview.replace('../', ''))) {
    nodes.push({ id: 'interview', t: 'Interview Questions', href: track.interview,
      tier: 'spine', g: 'Prove it', after: [prev] });
  }

  const graph = { id: track.id, title: track.title, accent: track.accent, nodes };
  let html = shell.replace(/<script type="application\/json" id="rgGraph">[\s\S]*?<\/script>/,
    `<script type="application/json" id="rgGraph">\n${JSON.stringify(graph, null, 2)}\n</script>`);

  const desc = `${track.lede} Every node opens a TechForge lesson.`;
  const swaps = [
    [/<title>[^<]*<\/title>/, `<title>${esc(track.title)} Roadmap — TechForge</title>`],
    [/(<meta name="description" content=")[^"]*/, `$1${esc(desc)}`],
    [/(<meta property="og:title" content=")[^"]*/, `$1${esc(track.title)} Roadmap — TechForge`],
    [/(<meta property="og:description" content=")[^"]*/, `$1${esc(track.lede)}`],
    [/(<link rel="canonical" href="https:\/\/techforge-dev\.vercel\.app\/)[^"]*/, `$1roadmaps/${track.id}.html`],
    [/<h1 class="rg-h1">[^<]*<\/h1>/, `<h1 class="rg-h1">${esc(track.title)} Roadmap</h1>`],
    [/<p class="rg-lede">[\s\S]*?<\/p>/, `<p class="rg-lede">${esc(track.lede)} Follow the trunk down; the pills beside each step are the sections inside that lesson.</p>`],
    [/<a href="\.\.\/dsa\/index\.html"><i class="ti ti-chart-bar" aria-hidden="true"><\/i>DSA Hub<\/a>/,
     `<a href="../${track.dir}/index.html"><i class="ti ${track.hubIcon}" aria-hidden="true"></i>${esc(track.hub)}</a>`],
    [/<body data-section="dsa">/, '<body data-section="roadmaps">'],
  ];
  for (const [re, to] of swaps) html = html.replace(re, to);

  fs.writeFileSync(`roadmaps/${track.id}.html`, html, 'utf8');
  const spine = nodes.filter((n) => n.tier === 'spine').length;
  console.log(`  ok  ${track.id}.html: ${nodes.length} nodes (${spine} steps, ${nodes.length - spine} sections)`);
  built++;
}
console.log(`\nbuilt ${built} roadmaps`);
