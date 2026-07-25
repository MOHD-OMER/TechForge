/**
 * Rendered-behaviour checks for the roadmap flow chart.
 *
 * The layout maths are covered by test-layout.mjs (pure Node). This drives the
 * page in a real browser to catch what only shows up once it renders: node and
 * edge counts, the bus-edge bundling, the hover chain, the mobile collapse,
 * reduced-motion, and horizontal-overflow regressions.
 *
 * Usage: npm run check:graph
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = 4193;
const ROOT = process.cwd();
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'text/plain' }); res.end(d); });
});
await new Promise((r) => server.listen(PORT, r));
const BASE = `http://localhost:${PORT}`;
const PAGE = `${BASE}/roadmaps/dsa.html`;

const fails = [];
const ok = (m) => console.log('  ok  ' + m);
const bad = (m) => { fails.push(m); console.log('FAIL  ' + m); };

const browser = await chromium.launch();

// ---- desktop render ----
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await page.goto(PAGE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const r = await page.evaluate(() => {
    const grid = document.querySelector('.rg-grid');
    const sortIds = ['bubble', 'selection', 'insertion', 'merge', 'quick', 'heapsort'];
    let diagToSort = 0;
    document.querySelectorAll('.rg-edge:not(.rg-edge-bus)').forEach((p) => { if (sortIds.includes(p.dataset.to)) diagToSort++; });
    return {
      nodes: document.querySelectorAll('.rg-node').length,
      links: document.querySelectorAll('a.rg-node').length,
      edges: document.querySelectorAll('.rg-edge').length,
      busEdges: document.querySelectorAll('.rg-edge-bus').length,
      diagToSort,
      cols: getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
      overflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  r.nodes === 32 ? ok(`${r.nodes} nodes rendered`) : bad(`expected 32 nodes, got ${r.nodes}`);
  r.edges > 0 ? ok(`${r.edges} edges (${r.busEdges} bus)`) : bad('no edges drawn');
  r.diagToSort === 0 ? ok('sort children bundled into a bus, no diagonal fan-out') : bad(`${r.diagToSort} diagonals still hit sort children`);
  r.cols === 3 ? ok('three columns (spine + two sides)') : bad(`expected 3 columns, got ${r.cols}`);
  r.overflow <= 0 ? ok('no horizontal page overflow') : bad(`overflows ${r.overflow}px`);

  // every link resolves
  const hrefs = await page.locator('a.rg-node').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  for (const h of hrefs) {
    const resp = await page.request.get(new URL(h, PAGE).toString());
    if (resp.status() !== 200) bad(`${h} -> ${resp.status()}`);
  }
  ok(`${hrefs.length} node links all 200`);

  // hovering a node lights its whole prerequisite chain back to the root
  const lit = await page.evaluate(async () => {
    document.querySelector('[data-id="dijkstra"]').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 120));
    return {
      nodes: [...document.querySelectorAll('.rg-lit')].map((e) => e.dataset.id).sort(),
      edges: document.querySelectorAll('.rg-edge-lit').length,
    };
  });
  lit.nodes.includes('bigo') && lit.nodes.includes('graph') && lit.edges > 0
    ? ok(`hover lights the chain (${lit.nodes.length} nodes, ${lit.edges} edges)`)
    : bad(`chain highlight broken: ${lit.nodes.join(',')} / ${lit.edges} edges`);

  errs.length === 0 ? ok('no console errors') : bad('console: ' + errs[0].slice(0, 100));
  await page.close();
}

// ---- mobile keeps the chart ----
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto(PAGE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1400);
  const r = await page.evaluate(() => ({
    nodes: document.querySelectorAll('.rg-node').length,
    edges: document.querySelectorAll('.rg-edge').length,
    cols: getComputedStyle(document.querySelector('.rg-grid')).gridTemplateColumns.split(' ').filter(Boolean).length,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
  }));
  r.cols === 3 && r.edges > 0 && r.overflow <= 0
    ? ok(`mobile keeps the chart (${r.nodes} nodes, ${r.edges} edges, no page overflow)`)
    : bad(`mobile broke: cols=${r.cols} edges=${r.edges} overflow=${r.overflow}`);
  await page.close();
}

// ---- reduced motion ----
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(PAGE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => ({
    animating: [...document.querySelectorAll('.rg-cell, .rg-edge')].filter((e) => getComputedStyle(e).animationName !== 'none').length,
    allVisible: [...document.querySelectorAll('.rg-cell')].every((e) => getComputedStyle(e).opacity === '1'),
    edges: document.querySelectorAll('.rg-edge').length,
  }));
  r.animating === 0 && r.allVisible && r.edges > 0
    ? ok('reduced motion: nothing animates, everything visible, edges drawn')
    : bad(`reduced motion broke: animating=${r.animating} visible=${r.allVisible} edges=${r.edges}`);
  await page.close();
}

await browser.close();
server.close();
console.log(fails.length ? `\n=== ${fails.length} FAILURES ===\n` + fails.join('\n') : '\n=== ALL GREEN ===');
process.exit(fails.length ? 1 : 0);
