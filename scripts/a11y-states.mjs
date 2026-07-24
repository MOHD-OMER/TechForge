/**
 * Accessibility audit for progress-dependent UI states.
 *
 * Why this exists alongside a11y-audit.mjs: that script loads every page with a
 * fresh browser context, so localStorage is always empty. Anything styled only
 * once a user has made progress — a completed milestone, a milestone still
 * waiting on its prerequisites — never renders during that sweep, and so is
 * never audited. A `.rm-node.done { opacity: .72 }` rule shipped exactly that
 * way: invisible to CI, below contrast for anyone who had ticked something off.
 *
 * This seeds roughly half of each roadmap path as complete, then runs axe over
 * every path in both themes with done / pending / current cards on screen.
 *
 * Usage: npm run a11y:states
 */
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4192;
const ROOT = process.cwd();
const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'text/plain' });
    res.end(data);
  });
});
await new Promise((r) => server.listen(PORT, r));
const BASE = `http://localhost:${PORT}`;

const src = fs.readFileSync('roadmaps.html', 'utf8');
const match = src.match(/const PATHS = \[[\s\S]*?\n\];/);
if (!match) {
  console.error('Could not find the PATHS array in roadmaps.html.');
  server.close();
  process.exit(1);
}
const PATHS = new Function(match[0] + '; return PATHS;')();

const failures = [];
const browser = await chromium.launch();

for (const theme of ['dark', 'light']) {
  for (const [idx, p] of PATHS.entries()) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1400 } });
    const page = await context.newPage();

    const milestoneIndexes = p.nodes.map((n, i) => (n.href ? i : -1)).filter((i) => i >= 0);
    const seedCount = Math.ceil(milestoneIndexes.length / 2);

    await page.goto(`${BASE}/roadmaps.html`);
    await page.evaluate(([pathId, themeName, seeded]) => {
      localStorage.clear();
      localStorage.setItem('tf-theme', themeName);
      seeded.forEach((i) => localStorage.setItem(`tf_rm_${pathId}_${i}`, '1'));
    }, [p.id, theme, milestoneIndexes.slice(0, seedCount)]);

    await page.goto(`${BASE}/roadmaps.html`, { waitUntil: 'networkidle' });
    await page.locator('.rm-tab').nth(idx).click();
    // Wait out the staggered entrance. Animation.finished is unusable here: the
    // hero dot pulses infinitely, so its promise never settles.
    await page.waitForTimeout(1400);

    const onScreen = await page.evaluate(() => ({
      done: document.querySelectorAll('.rm-node.done').length,
      pending: document.querySelectorAll('.rm-node.locked').length,
      current: document.querySelectorAll('.rm-node.current').length,
    }));

    // Guard against the audit quietly passing because it rendered nothing new.
    if (!onScreen.done) {
      failures.push(`${theme} ${p.id}: seeding produced no completed milestones, so this run proves nothing`);
    }

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

    if (serious.length) {
      for (const v of serious) {
        for (const node of v.nodes) {
          const d = (node.any && node.any[0] && node.any[0].data) || {};
          const detail = d.contrastRatio
            ? `ratio=${d.contrastRatio} need=${d.expectedContrastRatio} fg=${d.fgColor} bg=${d.bgColor}`
            : (node.failureSummary || '').split('\n')[0];
          failures.push(`${theme} ${p.id} [${v.id}] ${(node.target || []).join(' ')} ${detail}`);
        }
      }
      console.log(`FAIL  ${theme} ${p.id}`);
    } else {
      console.log(`  ok  ${theme} ${p.id}: clean (${onScreen.done} done, ${onScreen.pending} pending, ${onScreen.current} current on screen)`);
    }

    await context.close();
  }
}

// ---- topic roadmap flow chart: done nodes only render once progress is seeded,
//      so the standard sweep never sees the .rg-done styling. ----
const rgSrc = fs.readFileSync('roadmaps/dsa.html', 'utf8');
const rgMatch = rgSrc.match(/<script type="application\/json" id="rgGraph">([\s\S]*?)<\/script>/);
const rgGraph = rgMatch ? JSON.parse(rgMatch[1]) : { id: 'dsa', nodes: [] };
const rgLinked = rgGraph.nodes.filter((n) => n.href).map((n) => n.id);

for (const theme of ['dark', 'light']) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1600 } });
  const page = await context.newPage();
  await page.goto(`${BASE}/roadmaps/dsa.html`);
  await page.evaluate(([gid, themeName, ids]) => {
    localStorage.clear();
    localStorage.setItem('tf-theme', themeName);
    ids.forEach((id) => localStorage.setItem(`tf_rg_${gid}_${id}`, '1'));
  }, [rgGraph.id, theme, rgLinked.slice(0, Math.ceil(rgLinked.length / 2))]);
  await page.goto(`${BASE}/roadmaps/dsa.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const done = await page.evaluate(() => document.querySelectorAll('.rg-nodewrap.rg-done').length);
  if (!done) failures.push(`${theme} dsa-roadmap: seeding produced no done nodes, so this run proves nothing`);

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  if (serious.length) {
    for (const v of serious) {
      for (const node of v.nodes) {
        const d = (node.any && node.any[0] && node.any[0].data) || {};
        const detail = d.contrastRatio ? `ratio=${d.contrastRatio} need=${d.expectedContrastRatio} fg=${d.fgColor} bg=${d.bgColor}` : (node.failureSummary || '').split('\n')[0];
        failures.push(`${theme} dsa-roadmap [${v.id}] ${(node.target || []).join(' ')} ${detail}`);
      }
    }
    console.log(`FAIL  ${theme} dsa-roadmap`);
  } else {
    console.log(`  ok  ${theme} dsa-roadmap: clean (${done} done nodes on screen)`);
  }
  await context.close();
}

await browser.close();
server.close();

if (failures.length) {
  console.log(`\n=== ${failures.length} violation(s) ===`);
  failures.forEach((f) => console.log('  ' + f));
  process.exit(1);
}
console.log('\nNone. Clean run.');
