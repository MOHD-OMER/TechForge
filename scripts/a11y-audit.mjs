#!/usr/bin/env node
/**
 * WCAG 2.1 AA audit script — dev-only tooling, not shipped to prod.
 *
 * Serves the repo root as static files, crawls every *.html page, and runs
 * axe-core against each one twice (default dark theme, and forced
 * `html.light`) since contrast rules differ per theme.
 *
 * Usage:
 *   npm run a11y                # scan everything, print report, write a11y-report.json
 *   npm run a11y -- --fail-on=serious   # exit non-zero if any critical/serious found (for CI)
 *
 * Excludes: node_modules, .git, docs/ (not part of the shipped site).
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = 4173;
const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'docs', 'scripts']);
const FAIL_ON = (process.argv.find((a) => a.startsWith('--fail-on=')) || '--fail-on=serious')
  .split('=')[1];
const SEVERITY_ORDER = ['minor', 'moderate', 'serious', 'critical'];

function walkHtmlFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      walkHtmlFiles(full, out);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.mjs': 'application/javascript', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

function startServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(ROOT, urlPath);
    if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
  return new Promise((resolve) => server.listen(PORT, () => resolve(server)));
}

async function scanPage(context, urlPath) {
  const page = await context.newPage();
  try {
    // 'load' instead of 'networkidle': the site registers a service worker
    // on window.load and that can keep background activity going, which
    // makes networkidle unreliable (hangs until its own timeout on some
    // pages). 'load' is what axe needs — full DOM + stylesheets applied.
    await page.goto(`http://localhost:${PORT}${urlPath}`, { waitUntil: 'load', timeout: 10000 });
    // Let webfonts, canvas draws, and any load-time count-up/RAF animations
    // settle before axe samples computed styles. Several DSA pages run a
    // canvas visualizer + animated stat counters on load; scanning too early
    // makes axe's contrast checker sample pre-paint colors, producing bogus
    // near-1:1 fg/bg ratios that don't match any real CSS token.
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.waitForTimeout(300);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    return { violations: results.violations };
  } finally {
    await page.close();
  }
}

async function main() {
  const files = walkHtmlFiles(ROOT).map((f) => '/' + path.relative(ROOT, f).replace(/\\/g, '/'));
  console.log(`Found ${files.length} HTML pages.`);

  const server = await startServer();
  const browser = await chromium.launch();

  // One persistent context per theme, reused across every page — avoids
  // re-downloading Google Fonts / Tabler icon webfont from CDN on every
  // single one of the 252 loads, which was the main source of slowness.
  // reducedMotion: 'reduce' triggers the site's own `@media (prefers-reduced-motion:
  // reduce)` rule, which collapses .fade-up/.delay-N load animations to ~0.01ms.
  // Without this, axe can sample elements mid fade-in (opacity < 1, mid-transform),
  // which drags foreground color toward the background and produces bogus
  // near-1:1 contrast ratios that have nothing to do with the real, settled styles.
  const darkContext = await browser.newContext({ reducedMotion: 'reduce' });
  const lightContext = await browser.newContext({ reducedMotion: 'reduce' });
  await lightContext.addInitScript(() => {
    try { localStorage.setItem('tf-theme', 'light'); } catch (e) {}
  });
  const contexts = { dark: darkContext, light: lightContext };

  // Warm each context's HTTP cache before the timed scan loop. The first
  // CDN-referencing page a fresh context loads pays cold DNS + TLS + full
  // download for the Tabler icon CSS and Google Fonts (404.html references
  // nothing external, so /about.html used to be that victim and flaked
  // against the 10s goto timeout). One throwaway load with a generous
  // timeout absorbs that cost; failures here are non-fatal by design.
  for (const ctx of Object.values(contexts)) {
    const warm = await ctx.newPage();
    try {
      await warm.goto(`http://localhost:${PORT}/about.html`, { waitUntil: 'load', timeout: 45000 });
    } catch { /* warmup is best-effort */ }
    await warm.close();
  }

  const allResults = []; // { url, theme, violations }
  const failures = [];   // { url, theme, error }

  const total = files.length * 2;
  let done = 0;
  for (const urlPath of files) {
    for (const theme of ['dark', 'light']) {
      done++;
      process.stdout.write(`  [${done}/${total}] ${urlPath} (${theme}) ... `);
      try {
        let result;
        try {
          result = await scanPage(contexts[theme], urlPath);
        } catch (firstErr) {
          // One retry absorbs transient flakes (CDN hiccup, slow first paint)
          // so a single timeout doesn't mark the page as unscanned.
          result = await scanPage(contexts[theme], urlPath);
        }
        const { violations } = result;
        allResults.push({ url: urlPath, theme, violations });
        console.log(violations.length ? `${violations.length} violation(s)` : 'clean');
      } catch (err) {
        failures.push({ url: urlPath, theme, error: String(err.message || err) });
        console.log(`SKIPPED (${err.message || err})`);
      }
    }
  }

  await darkContext.close();
  await lightContext.close();
  await browser.close();
  server.close();

  // Group by rule id across all pages/themes.
  const byRule = new Map();
  for (const { url, theme, violations } of allResults) {
    for (const v of violations) {
      if (!byRule.has(v.id)) {
        byRule.set(v.id, { id: v.id, impact: v.impact, help: v.help, pages: new Set() });
      }
      byRule.get(v.id).pages.add(`${url} [${theme}]`);
    }
  }

  const grouped = [...byRule.values()]
    .map((r) => ({ ...r, pages: [...r.pages], count: r.pages.size }))
    .sort((a, b) => {
      const sevDiff = SEVERITY_ORDER.indexOf(b.impact) - SEVERITY_ORDER.indexOf(a.impact);
      return sevDiff !== 0 ? sevDiff : b.count - a.count;
    });

  console.log('\n=== Violations by rule (worst first) ===\n');
  for (const r of grouped) {
    console.log(`[${r.impact || 'unknown'}] ${r.id} — ${r.help} (${r.count} page/theme loads)`);
  }
  if (grouped.length === 0) console.log('None. Clean run.');

  if (failures.length) {
    console.log(`\n=== ${failures.length} page(s) failed to scan (see report json) ===`);
  }

  const reportPath = path.join(ROOT, 'a11y-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), grouped, failures, raw: allResults }, null, 2));
  console.log(`\nFull report written to ${reportPath}`);

  const failThreshold = SEVERITY_ORDER.indexOf(FAIL_ON);
  const shouldFail = grouped.some((r) => SEVERITY_ORDER.indexOf(r.impact) >= failThreshold);
  if (shouldFail) {
    console.error(`\nFAIL: found violations at or above "${FAIL_ON}" severity.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
