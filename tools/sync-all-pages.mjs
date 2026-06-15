/**
 * Sync TechForge HTML pages: platform scripts, CSS versions, page chrome.
 * Run: node tools/sync-all-pages.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadTopics, renderSectionSidebar, renderTopbarActions, renderLayoutShell } from './section-sidebar.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const FULL_GUIDE_META = {
  'devops/git.html': { id: 'devops/git', section: 'devops' },
  'databases/sql.html': { id: 'db/sql', section: 'databases' },
  'databases/mongodb.html': { id: 'db/mongodb', section: 'databases' },
  'system-design/django.html': { id: 'sd/django', section: 'system-design' },
  'system-design/flask.html': { id: 'sd/flask', section: 'system-design' },
  'system-design/fastapi.html': { id: 'sd/fastapi', section: 'system-design' },
};

const SECTION_HUB_PATHS = {
  'devops/index.html': 'devops',
  'databases/index.html': 'databases',
  'system-design/index.html': 'system-design',
};

let topicsCache = null;
function getTopicsManifest() {
  if (!topicsCache) topicsCache = loadTopics();
  return topicsCache;
}

/** Wrap section hub pages in .layout + grid sidebar (matches Python/DSA). */
function injectSectionHubLayout(html, rel) {
  const sectionKey = SECTION_HUB_PATHS[rel];
  if (!sectionKey || html.includes('id="sidebar"')) return html;

  const section = getTopicsManifest()[sectionKey];
  if (!section) return html;

  html = html.replace(/<div class="topbar-actions">[\s\S]*?<\/div>/i, renderTopbarActions());

  const sidebarHtml = renderSectionSidebar(section, { isHub: true, onPageLinks: [] });
  const pageRe = /<div class="page(?:\s+page-wide)?"\s+id="mainContent">([\s\S]*?)<\/div>(?=\s*(?:<button|<script|<\/body))/i;
  const m = html.match(pageRe);
  if (!m) return html;

  const inner = m[1].trimEnd();
  const mainInner = `    <div class="page page-wide">\n${inner}\n    </div>`;
  const layout = renderLayoutShell(sidebarHtml, mainInner);
  return html.replace(pageRe, layout);
}

function walk(dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      if (name === 'node_modules' || name === '.git' || name === 'tools') continue;
      walk(full, list);
    } else if (name.endsWith('.html')) {
      list.push(full);
    }
  }
  return list;
}

const BASE_URL = 'https://tech-forge-dev.vercel.app';

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

/** Ensure single canonical, theme-color, and OG/Twitter meta on every page. */
function injectSeoMeta(html, rel) {
  if (!html.includes('<head')) return html;

  // Remove duplicate canonical tags (keep first)
  let canonSeen = false;
  html = html.replace(/<link rel="canonical"[^>]*>\s*/gi, (m) => {
    if (canonSeen) return '';
    canonSeen = true;
    return m;
  });

  // theme-color after viewport
  if (!html.includes('name="theme-color"')) {
    html = html.replace(
      /(<meta name="viewport"[^>]*>)/i,
      '$1\n<meta name="theme-color" content="#030508"/>'
    );
  }

  const canonical = rel === 'index.html'
    ? `${BASE_URL}/`
    : `${BASE_URL}/${rel}`;

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : 'TechForge';
  const descMatch = html.match(/<meta name="description" content="([^"]*)"/i);
  const desc = descMatch ? descMatch[1] : 'TechForge — free interactive CS learning.';
  const ogTitle = pageTitle.includes('TechForge') ? pageTitle : `${pageTitle.replace(/\s*\|.*$/, '').trim()} — TechForge`;

  const ogBlock = `  <meta property="og:title" content="${escAttr(ogTitle)}"/>
  <meta property="og:description" content="${escAttr(desc)}"/>
  <meta property="og:type" content="website"/>
  <meta property="og:image" content="${BASE_URL}/assets/og-image.png"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:image" content="${BASE_URL}/assets/og-image.png"/>`;

  if (!html.includes('rel="canonical"')) {
    const block = `  <link rel="canonical" href="${canonical}"/>
${ogBlock}`;
    html = html.replace(/<\/title>/i, `</title>\n${block}`);
  } else if (!html.includes('property="og:image"')) {
    html = html.replace(/<link rel="canonical"[^>]*>/i, (m) => `${m}\n${ogBlock}`);
  }

  // Normalize homepage canonical trailing slash
  if (rel === 'index.html') {
    html = html.replace(
      /<link rel="canonical" href="https:\/\/tech-forge-dev\.vercel\.app\/?"\s*\/>/i,
      `<link rel="canonical" href="${BASE_URL}/"/>`
    );
  }

  return html;
}

function assetRoot(relPath) {
  const depth = relPath.split('/').length - 1;
  return depth === 0 ? 'assets/' : '../'.repeat(depth) + 'assets/';
}

function syncFile(filePath) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const hasTopbar = html.includes('class="topbar"') || html.includes("class='topbar'");
  if (!hasTopbar) return false;

  const rootPrefix = assetRoot(rel);

  // CSS version bumps
  const cssReplacements = [
    [/forge_base\.css\?v=\d+/g, 'forge_base.css?v=6'],
    [/lesson\.css\?v=\d+/g, 'lesson.css?v=2'],
    [/platform\.css\?v=\d+/g, 'platform.css?v=2'],
    [/hub\.css\?v=\d+/g, 'hub.css?v=1'],
    [/forge_base\.css"(?!\\?)/g, 'forge_base.css?v=6"'],
  ];
  for (const [re, rep] of cssReplacements) {
    const next = html.replace(re, rep);
    if (next !== html) { html = next; changed = true; }
  }

  // platform.css in head when missing
  if (!html.includes('platform.css') && hasTopbar) {
    html = html.replace(
      /(<link[^>]+forge_base\.css[^>]*>\s*)/i,
      `$1  <link href="${rootPrefix}css/platform.css?v=2" rel="stylesheet"/>\n`
    );
    changed = true;
  }

  // Skip link (inside body)
  if (!html.includes('skip-link') && html.includes('<body')) {
    html = html.replace(
      /<body([^>]*)>/i,
      '<body$1>\n<a href="#mainContent" class="skip-link">Skip to content</a>'
    );
    if (!html.includes('id="mainContent"')) {
      html = html.replace(/<div class="layout"/i, '<div class="layout" id="mainContent"');
      html = html.replace(/<div class="page"(?! id)/i, '<div class="page" id="mainContent"');
      html = html.replace(/<div class="lesson-layout"/i, '<div class="lesson-layout" id="mainContent"');
    }
    changed = true;
  }

  // lesson.css for legacy learning pages (bookmark/complete buttons)
  if (html.includes('data-topic-id') && !html.includes('lesson.css')) {
    html = html.replace(
      /(<link[^>]+platform\.css[^>]*>\s*)/i,
      `$1  <link href="${rootPrefix}css/lesson.css?v=2" rel="stylesheet"/>\n`
    );
    if (!html.includes('platform.css')) {
      html = html.replace(
        /(<link[^>]+forge_base\.css[^>]*>\s*)/i,
        `$1  <link href="${rootPrefix}css/lesson.css?v=2" rel="stylesheet"/>\n`
      );
    }
    changed = true;
  }

  // hub.css for all section hub index pages
  if (/\/(devops|databases|system-design|dsa|python|aiml|interview)\/index\.html$/.test(rel) && !html.includes('hub.css')) {
    html = html.replace(
      /(<link[^>]+forge_base\.css[^>]*>\s*)/i,
      `$1  <link href="${rootPrefix}css/hub.css?v=1" rel="stylesheet"/>\n`
    );
    changed = true;
  }

  // Progress bar id normalization
  if (html.includes('id="pbar"')) {
    html = html.replace(/id="pbar"/g, 'id="progressFill"');
    changed = true;
  }

  // Ensure progress bar exists
  if (!html.includes('progress-bar') && hasTopbar) {
    html = html.replace(
      /(<header class="topbar"[\s\S]*?<\/header>)/i,
      `$1\n<div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>`
    );
    changed = true;
  }

  // Ensure back-top button
  if (!html.includes('id="backTop"') && hasTopbar) {
    const scriptsIdx = html.search(/<script[^>]+utils\.js/i);
    const insertAt = scriptsIdx >= 0 ? scriptsIdx : html.lastIndexOf('</body>');
    const btn = '<button type="button" class="back-top" id="backTop" aria-label="Back to top">⬡</button>\n';
    html = html.slice(0, insertAt) + btn + html.slice(insertAt);
    changed = true;
  }

  // Full guide body metadata
  const guideMeta = FULL_GUIDE_META[rel];
  if (guideMeta && !html.includes('data-topic-id')) {
    html = html.replace(
      /<body([^>]*)>/i,
      `<body$1 data-topic-id="${guideMeta.id}" data-section="${guideMeta.section}">`
    );
    changed = true;
  }

  // Auto data-topic-id for section pages without it
  if (!html.includes('data-topic-id') && !guideMeta && rel.includes('/')) {
    const parts = rel.split('/');
    const section = parts[0];
    const slug = parts[parts.length - 1].replace('.html', '');
    if (!['index.html'].includes(parts[parts.length - 1]) || parts.length > 2) {
      const idPrefix = { dsa: 'dsa', python: 'py', aiml: 'aiml', interview: 'iv' }[section] || section;
      if (['dsa', 'python', 'aiml', 'interview'].includes(section)) {
        html = html.replace(/<body([^>]*)>/i, `<body$1 data-topic-id="${idPrefix}/${slug}" data-section="${section}">`);
        changed = true;
      }
    }
  }

  // Script stack: topics-manifest + site-index + utils + platform (skip homepage)
  const skipPlatformStack = rel === 'index.html';
  const needsManifest = !skipPlatformStack && !html.includes('topics-manifest.js');
  const needsSiteIndex = !skipPlatformStack && !html.includes('site-index.js');
  const needsPlatform = !skipPlatformStack && !html.includes('platform.js');

  if (skipPlatformStack) {
    let stripped = html;
    stripped = stripped.replace(/\s*<script[^>]+src="[^"]*topics-manifest\.js[^"]*"[^>]*><\/script>/gi, '');
    stripped = stripped.replace(/\s*<script[^>]+src="[^"]*site-index\.js[^"]*"[^>]*><\/script>/gi, '');
    stripped = stripped.replace(/\s*<script[^>]+src="[^"]*platform\.js[^"]*"[^>]*><\/script>/gi, '');
    stripped = stripped.replace(/\s*<link[^>]+href="[^"]*platform\.css[^"]*"[^>]*>\s*/gi, '');
    if (stripped !== html) { html = stripped; changed = true; }
  } else if (needsManifest || needsSiteIndex || needsPlatform) {
    const insertBlock = [
      needsManifest ? `  <script src="${rootPrefix}js/topics-manifest.js"></script>` : '',
      needsSiteIndex ? `  <script src="${rootPrefix}js/site-index.js"></script>` : '',
      needsPlatform ? `  <script src="${rootPrefix}js/platform.js?v=3"></script>` : '',
    ].filter(Boolean).join('\n');

    const utilsMatch = html.match(/<script[^>]+src="[^"]*utils\.js[^"]*"[^>]*><\/script>/i);
    if (utilsMatch) {
      html = html.replace(utilsMatch[0], insertBlock + '\n' + utilsMatch[0]);
    } else {
      html = html.replace(
        '</body>',
        insertBlock + '\n  <script src="' + rootPrefix + 'js/utils.js"></script>\n</body>'
      );
    }
    changed = true;
  } else if (html.includes('platform.js') && !html.includes('platform.js?v=3')) {
    html = html.replace(/platform\.js(\?v=\d+)?/g, 'platform.js?v=3');
    changed = true;
  }

  if (needsSiteIndex === false && !html.includes('site-index.js')) {
    // handled above
  }

  // Add site-index after manifest if manifest exists but site-index missing
  if (!skipPlatformStack && html.includes('topics-manifest.js') && !html.includes('site-index.js')) {
    html = html.replace(
      /(<script[^>]+topics-manifest\.js[^>]*><\/script>)/i,
      `$1\n  <script src="${rootPrefix}js/site-index.js"></script>`
    );
    changed = true;
  }

  // ── HTML structure fixups (always run) ──
  const fixups = fixHtmlStructure(html, rel);
  if (fixups !== html) {
    html = fixups;
    changed = true;
  }

  // Remove empty dsa.css link (styles consolidated in lesson.css / forge_base)
  if (html.includes('dsa.css')) {
    const stripped = html.replace(/\s*<link[^>]+href="[^"]*dsa\.css[^"]*"[^>]*>\s*/gi, '\n');
    if (stripped !== html) { html = stripped; changed = true; }
  }

  // SEO: canonical, OG, theme-color
  const seoNext = injectSeoMeta(html, rel);
  if (seoNext !== html) { html = seoNext; changed = true; }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
  }
  return changed;
}

/** Move skip-link inside body; progress bar after topbar; normalize back-top */
function fixHtmlStructure(html, rel = '') {
  // Skip link wrongly placed before <body>
  html = html.replace(
    /<\/head>\s*<a href="#mainContent" class="skip-link">Skip to content<\/a>\s*(<body[^>]*>)/i,
    '</head>\n$1\n<a href="#mainContent" class="skip-link">Skip to content</a>'
  );

  // Progress bar before topbar → after topbar header (skip-link may sit between body and progress bar)
  const progressBeforeTopbar = /<body[^>]*>[\s\S]*?<div class="progress-bar"><div class="progress-fill" id="progressFill"><\/div><\/div>[\s\S]*?<header class="topbar"[\s\S]*?<\/header>/i;
  if (progressBeforeTopbar.test(html) && !/<header class="topbar"[\s\S]*?<\/header>\s*<div class="progress-bar"/i.test(html)) {
    html = html.replace(
      /<div class="progress-bar"><div class="progress-fill" id="progressFill"><\/div><\/div>\s*/i,
      ''
    );
    html = html.replace(
      /(<header class="topbar"[\s\S]*?<\/header>)/i,
      '$1\n<div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>'
    );
  }

  // Normalize back-top control
  html = html.replace(
    /<button([^>]*class="back-top"[^>]*id="backTop"[^>]*)>↑<\/button>/gi,
    '<button type="button" class="back-top" id="backTop" aria-label="Back to top">⬡</button>'
  );
  html = html.replace(
    /<a([^>]*class="back-top"[^>]*id="backTop"[^>]*)>[^<]*<\/a>/gi,
    '<button type="button" class="back-top" id="backTop" aria-label="Back to top">⬡</button>'
  );

  // Correct script load order: manifest → site-index → utils → platform
  html = fixScriptOrder(html);

  // Section hubs: grid sidebar like Python/DSA (DevOps, System Design, Databases)
  html = injectSectionHubLayout(html, rel);

  // Mobile nav: one toggle on sidebar pages; strip legacy duplicate scripts/CSS
  html = fixMobileNav(html);

  return html;
}

function fixMobileNav(html) {
  const hasSidebar = html.includes('id="sidebar"');

  // Always prefer grid sidebar toggle when sidebar exists
  if (hasSidebar) {
    html = html.replace(/<div class="topbar-actions">[\s\S]*?<\/div>/i, renderTopbarActions());
  }

  if (hasSidebar) {
    // Remove duplicate top-nav hamburger (grid sidebar is the single mobile menu)
    html = html.replace(
      /\s*<button[^>]*\bid="navToggle"[^>]*class="[^"]*nav-toggle[^"]*"[^>]*>[\s\S]*?<\/button>/gi,
      ''
    );
    html = html.replace(
      /\s*<button[^>]*class="[^"]*nav-toggle[^"]*"[^>]*\bid="navToggle"[^>]*>[\s\S]*?<\/button>/gi,
      ''
    );
    // Per-page overrides that forced both toggles visible
    html = html.replace(/\s*header\.topbar \.nav-toggle\s*\{[^}]*\}\s*/g, '');
    // Duplicate mobile grid styles now live in forge_base.css
    html = html.replace(/\.tf-mobile-home-nav\s*\{[^}]+\}\s*/g, '');
    html = html.replace(/\.tf-mhn-label\s*\{[^}]+\}\s*/g, '');
    html = html.replace(/\.tf-mhn-grid\s*\{[^}]+\}\s*/g, '');
    html = html.replace(/\.tf-mhn-item(?:\:[^{]+)?\s*\{[^}]+\}\s*/g, '');
    html = html.replace(/\.tf-mhn-icon\s*\{[^}]+\}\s*/g, '');
    html = html.replace(/\.tf-mhn-text\s*\{[^}]+\}\s*/g, '');
    html = html.replace(/\.tf-mhn-divider\s*\{[^}]+\}\s*/g, '');
    html = html.replace(/@media\s*\(min-width:\s*901px\)\s*\{\s*\.tf-mobile-home-nav\s*\{[^}]+\}\s*\}\s*/g, '');
    // Legacy per-page full-screen mobile nav CSS (replaced by sidebar grid nav)
    html = html.replace(/\n\s*\/\* ── MOBILE NAV[\s\S]*?header\.topbar \.topbar-actions \{[^}]+\}\s*\}\s*/g, '\n');
    html = html.replace(/<style id="tf-mobile-nav-css">\s*@media \(min-width: 901px\) \{ \}\s*<\/style>\s*/g, '');
  }

  // Legacy inline toggles duplicate utils.js and use wrong CSS classes (.closed / .mobile-open)
  html = html.replace(
    /const sidebarToggle = document\.getElementById\('sidebarToggle'\);[\s\S]*?if \(navToggle\) navToggle\.addEventListener\('click', toggleNav\);\s*\n/g,
    ''
  );

  return html;
}

function fixScriptOrder(html) {
  const tags = [];
  const re = /<script[^>]+src="([^"]*(?:topics-manifest|site-index|utils|platform)\.js[^"]*)"[^>]*><\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    tags.push({ full: m[0], src: m[1] });
  }
  if (tags.length < 2) return html;

  const order = ['topics-manifest.js', 'site-index.js', 'utils.js', 'platform.js'];
  const sorted = [...tags].sort((a, b) => {
    const ai = order.findIndex((k) => a.src.includes(k));
    const bi = order.findIndex((k) => b.src.includes(k));
    return ai - bi;
  });
  const currentOrder = tags.map((t) => t.src).join('|');
  const targetOrder = sorted.map((t) => t.src).join('|');
  if (currentOrder === targetOrder) return html;

  let out = html;
  for (const t of tags) {
    out = out.replace(t.full, '');
  }
  const anchor = out.search(/<script/i);
  const insertAt = anchor >= 0 ? anchor : out.lastIndexOf('</body>');
  const block = sorted.map((t) => t.full).join('\n  ') + '\n';
  out = out.slice(0, insertAt) + block + out.slice(insertAt);
  return out;
}

const files = walk(root);
let count = 0;
for (const f of files) {
  if (syncFile(f)) {
    count++;
    console.log('Synced', path.relative(root, f).replace(/\\/g, '/'));
  }
}
console.log('Done. Updated', count, 'files.');
