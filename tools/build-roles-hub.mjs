/**
 * Generate roles/index.html — the "learn by role" hub.
 *
 * Clones the shell of roadmaps/index.html (same directory depth, so every
 * relative href in the chrome still resolves) and replaces the body.
 *
 * Cards carry three things derived from the roadmap itself, so the hub cannot
 * drift from what it links to:
 *   - the step/topic counts, via roadmap-meta
 *   - the list of progress keys the role covers, so the page can show how far
 *     through it you are and compare two roles without fetching anything
 *   - the prose, from tools/roles.json
 */
import fs from 'node:fs';
import { metaFor } from '../scripts/roadmap-meta.mjs';
import { topicsForRoadmap, coversForRoadmap } from '../scripts/roadmap-topics.mjs';

const spec = JSON.parse(fs.readFileSync('tools/roles.json', 'utf8'));
const shell = fs.readFileSync('roadmaps/index.html', 'utf8');

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const data = [];
/* One shared label dictionary rather than repeating every topic name in all
   eighteen roles. Roles carry indexes into it. */
const labels = [];
const labelIndex = new Map();
function keyOf(entry) {
  if (!labelIndex.has(entry.key)) {
    labelIndex.set(entry.key, labels.length);
    labels.push(entry.label);
  }
  return labelIndex.get(entry.key);
}

function card(role) {
  const page = 'roadmaps/paths/' + role.file;
  const meta = metaFor(page);
  if (!meta) throw new Error(`no graph for ${role.file}`);

  const id = role.file.replace('.html', '');
  const topics = topicsForRoadmap(page);
  const covers = coversForRoadmap(page).map(keyOf);
  data.push({ id, name: role.name, group: role.group, topics, covers });

  const skills = role.skills
    .map((s) => `<li>${esc(s)}</li>`).join('');

  return `        <article class="rl-card" data-role="${id}" data-group="${role.group}" style="--rd-c:${role.colour}">
          <div class="rl-head">
            <span class="rl-icon"><i class="ti ${role.icon}" aria-hidden="true"></i></span>
            <div class="rl-titles">
              <h3 class="rl-name">${esc(role.name)}</h3>
              <p class="rl-meta">${meta}</p>
            </div>
            <button type="button" class="rl-toggle" aria-expanded="false" aria-controls="rl-${id}"
              aria-label="What a ${esc(role.name)} does">
              <i class="ti ti-chevron-down" aria-hidden="true"></i>
            </button>
          </div>
          <p class="rl-progress" data-progress-for="${id}"></p>
          <div class="rl-wrap" data-open="false">
            <div class="rl-body" id="rl-${id}">
              <p class="rl-blurb">${esc(role.blurb)}</p>
              <p class="rl-day"><span class="rl-label">Day to day</span>${esc(role.day)}</p>
              <div class="rl-skills">
                <span class="rl-label">You will learn</span>
                <ul>${skills}</ul>
              </div>
              <p class="rl-aliases"><span class="rl-label">Also called</span>${esc(role.aliases.join(' · '))}</p>
              <a class="rl-start" href="../${page}">Start the roadmap <i class="ti ti-arrow-right" aria-hidden="true"></i></a>
            </div>
          </div>
        </article>`;
}

const sections = spec.groups.map((g) => {
  const cards = spec.roles.filter((r) => r.group === g.id).map(card).join('\n');
  return `  <section class="rd-section" aria-labelledby="${g.id}" data-group-section="${g.id}">
    <h2 class="rd-band" id="${g.id}">${esc(g.label)}</h2>
    <div class="rl-grid">
${cards}
    </div>
  </section>`;
}).join('\n\n');

const filters = spec.groups
  .map((g) => `<button type="button" class="rl-chip" data-filter="${g.id}">${esc(g.label)}</button>`)
  .join('\n        ');

const controls = `  <div class="rl-controls">
    <div class="rl-filters" role="group" aria-label="Filter roles by kind">
        <button type="button" class="rl-chip is-on" data-filter="all" aria-pressed="true">All roles</button>
        ${filters}
    </div>
    <div class="rl-sort">
      <label for="rlSort">Sort</label>
      <select id="rlSort">
        <option value="default">Grouped</option>
        <option value="progress">Furthest along</option>
        <option value="written">Most written</option>
        <option value="az">A–Z</option>
      </select>
    </div>
  </div>`;

/* Below the roles, not above them: comparing two things you have not read about
   yet is backwards. */
const compare = `  <section class="rl-compare" aria-labelledby="rlCompareH">
    <h2 class="rl-compare-h" id="rlCompareH">Compare two roles</h2>
    <p class="rl-compare-sub">Most of a career change is work you have already done. This counts the whole roadmap for each role, including topics still to be written.</p>
    <div class="rl-compare-picks">
      <label for="rlA">First role</label>
      <select id="rlA"></select>
      <label for="rlB">Second role</label>
      <select id="rlB"></select>
    </div>
    <div class="rl-compare-out" id="rlCompareOut" aria-live="polite"></div>
  </section>`;

const body =
  `<main class="rd-page" id="mainContent">
  <div class="rd-hero">
    <h1 class="rd-title">Learn by Role</h1>
    <p class="rd-sub">Pick the job you are working toward and follow it end to end. Every role is the real roadmap for that field, not just the parts TechForge has written — topics without a lesson yet are marked <strong>soon</strong>.</p>
  </div>

${controls}

${sections}

${compare}

  <script type="application/json" id="rolesData">
${JSON.stringify({ labels, roles: data }, null, 2)}
  </script>
</main>`;

let html = shell.replace(/<main class="rd-page" id="mainContent">[\s\S]*?<\/main>/, body);

const desc = 'Pick a career and follow it end to end: frontend, backend, full stack, mobile, games, AI and ML, data science, data engineering, DevOps, cloud, SRE, security, QA, architecture and blockchain.';
html = html
  .replace(/<title>[^<]*<\/title>/, '<title>Learn by Role — TechForge</title>')
  .replace(/(<meta name="description" content=")[^"]*(")/, `$1${desc}$2`)
  .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${desc}$2`)
  .replace(/(<meta property="og:title" content=")[^"]*(")/, '$1Learn by Role — TechForge$2')
  .replace(/(<link rel="canonical" href="https:\/\/techforge-dev\.vercel\.app\/)roadmaps\/index\.html(")/, '$1roles/index.html$2')
  .replace(/class="tb-link current"/g, 'class="tb-link"')
  .replace(/(<a class="tb-link" href="\.\.\/roles\/index\.html">)/g, '<a class="tb-link current" href="../roles/index.html">');

// the hub needs its own stylesheet and behaviour, alongside the shared chrome
if (!html.includes('css/roles.css')) {
  html = html.replace(
    /(<link href="\.\.\/assets\/css\/platform\.css\?v=\d+" rel="stylesheet"\/>)/,
    '$1\n  <link href="../assets/css/roles.css?v=1" rel="stylesheet"/>'
  );
}
if (!html.includes('js/roles.js')) {
  html = html.replace(
    /(<script src="\.\.\/assets\/js\/platform\.js\?v=\d+"><\/script>)/,
    '$1\n<script src="../assets/js/roles.js?v=1"></script>'
  );
}

fs.mkdirSync('roles', { recursive: true });
fs.writeFileSync('roles/index.html', html);
console.log(`roles/index.html: ${spec.roles.length} roles in ${spec.groups.length} groups, ` +
  `${data.reduce((n, r) => n + r.topics.length, 0)} tracked topics`);
