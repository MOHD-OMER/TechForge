/**
 * Generate a lesson page (and its section hub) from an existing one.
 *
 * Clones devops/nginx.html — a one-level-deep lesson, so every relative href in
 * the shared chrome already resolves for a new top-level section — and swaps
 * the head, the sidebar and the article. Cloning rather than templating means a
 * new page inherits the navbar, search, theme toggle, service worker and the
 * "Mark complete" button that writes to tf_completed_topics, all of which the
 * roles hub and dashboard now depend on.
 *
 *   node tools/build-lesson.mjs <spec.json>
 */
import fs from 'node:fs';
import path from 'node:path';

const LESSON_SHELL = 'devops/nginx.html';
const HUB_SHELL = 'devops/index.html';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function sidebar(spec, current) {
  const groups = spec.sidebar.map((g) => {
    const links = g.topics.map((t) => {
      const active = t.file === current ? ' active' : '';
      return `    <a class="sb-link${active}" href="${t.file}"><span class="sb-num"><i class="ti ${t.icon}"></i></span>${esc(t.title)}</a>`;
    }).join('\n');
    return `    <div class="sidebar-label">${esc(g.label)}</div>\n${links}`;
  }).join('\n');
  return `    <a class="sb-link" href="index.html"><span class="sb-num">⬡</span>Section hub</a>\n${groups}`;
}

function head(html, { title, section, desc, file }) {
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)} — ${esc(section)} | TechForge</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)} — ${esc(section)} | TechForge$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`)
    .replace(/(<link rel="canonical" href="https:\/\/techforge-dev\.vercel\.app\/)[^"]*(")/, `$1${file}$2`);
}

function buildLesson(spec, page) {
  let html = fs.readFileSync(LESSON_SHELL, 'utf8');
  const file = `${spec.dir}/${page.file}`;

  html = head(html, { title: page.title, section: spec.label, desc: page.desc, file });

  html = html.replace(
    /<body data-topic-id="[^"]*" data-section="[^"]*">/,
    `<body data-topic-id="${page.topicId}" data-section="${spec.key}">`
  );

  /* The shell came from another section, so it carries that section's "current"
     navbar highlight. Clear it, then re-apply only if this section has its own
     navbar entry — a new section reached through Roles or Roadmaps has none,
     and highlighting the wrong one is worse than highlighting nothing. */
  html = html.replace(/class="tb-link current"/g, 'class="tb-link"');
  if (spec.navHref) {
    html = html.replace(
      new RegExp(`(<a class="tb-link" href="${spec.navHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">)`),
      `<a class="tb-link current" href="${spec.navHref}">`
    );
  }

  // the section's own contents list
  html = html.replace(
    /(<a class="sb-link" href="index\.html"><span class="sb-num">⬡<\/span>Section hub<\/a>)[\s\S]*?(\n\s*<\/aside>)/,
    () => sidebar(spec, page.file) + '\n  </aside>'
  );

  const article =
    `  <main class="main">\n` +
    `    <div class="lesson-breadcrumb"><a href="index.html">← ${esc(spec.label)} Hub</a></div>\n` +
    `    <header class="pg-head">\n` +
    `      <div class="pg-crumb">${esc(spec.label)} · Guide</div>\n` +
    `      <h1 class="pg-title">${esc(page.title)}</h1>\n` +
    `      <p class="pg-sub">${esc(page.sub)}</p>\n` +
    `      <div class="pg-badges tf-learning-actions">\n` +
    `        <span class="lesson-meta-tag" id="lessonReadTime">— min read</span>\n` +
    `        <span class="badge b-accent">${esc(spec.label)}</span>\n` +
    `        <button type="button" class="lesson-btn" id="lessonBookmark"><i class="ti ti-star"></i> Save</button>\n` +
    `        <button type="button" class="lesson-btn" id="lessonComplete">Mark complete</button>\n` +
    `      </div>\n` +
    `    </header>\n` +
    page.sections.join('\n') + '\n' +
    `  </main>`;

  html = html.replace(/<main class="main">[\s\S]*?<\/main>/, article);

  fs.writeFileSync(file, html);
  console.log(`  ${file}`);
}

function buildHub(spec) {
  let html = fs.readFileSync(HUB_SHELL, 'utf8');
  const file = `${spec.dir}/index.html`;

  html = head(html, { title: spec.hubTitle, section: 'TechForge', desc: spec.hubDesc, file });
  // head() appends "| TechForge"; a hub does not also need it in the section slot
  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(spec.hubTitle)} — TechForge</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(spec.hubTitle)} — TechForge$2`);
  html = html.replace(
    /<body([^>]*)data-section="[^"]*"/,
    `<body$1data-section="${spec.key}"`
  );
  html = html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/, (m) => m.replace(/>([^<]+)</, `>${esc(spec.hubTitle)}<`));
  html = html.replace(/class="tb-link current"/g, 'class="tb-link"');
  html = html.replace(/tfRenderHub\('[^']*',\s*'[^']*'\)/, `tfRenderHub('${spec.key}', '${spec.key}HubTopics')`);
  html = html.replace(/id="devopsHubTopics"/, `id="${spec.key}HubTopics"`);

  fs.writeFileSync(file, html);
  console.log(`  ${file} (hub)`);
}

const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
fs.mkdirSync(spec.dir, { recursive: true });
buildHub(spec);
spec.pages.forEach((p) => buildLesson(spec, p));
console.log(`${spec.pages.length} lesson page(s) + hub in ${spec.dir}/`);
