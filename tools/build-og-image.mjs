/**
 * Render assets/og-image.png from the site's own data.
 *
 * The previous card was drawn once and never updated: it advertised 7 tracks,
 * 70+ topics and 200+ questions long after those were 16, 335 and 433. Every
 * figure below is read from the topics manifest and the filesystem, so
 * regenerating it is the only way it can be wrong.
 *
 *   node tools/build-og-image.mjs            → assets/og-image.png
 *   node tools/build-og-image.mjs --check    → fail if the stats have drifted
 *
 * Playwright is already a devDependency for the accessibility audit; this reuses
 * it as a renderer rather than adding an image library.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { chromium } from 'playwright';

const OUT = 'assets/og-image.png';
const STATS = 'assets/og-image.stats.json';
const SITE = 'techforge-dev.vercel.app';

/* ── the numbers, from the site itself ─────────────────────────────── */
function facts() {
  const skip = new Set(['node_modules', '.git', '.claude', 'docs', '.github']);
  const walk = (d, out = []) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { if (!skip.has(e.name)) walk(path.join(d, e.name), out); }
      else if (e.name.endsWith('.html')) out.push(path.join(d, e.name));
    }
    return out;
  };

  const roadmaps =
    fs.readdirSync('roadmaps').filter((f) => f.endsWith('.html') && f !== 'index.html').length +
    fs.readdirSync('roadmaps/paths').filter((f) => f.endsWith('.html')).length;

  /* one .qna-item per question in each bank */
  const questions = fs.readdirSync('interview')
    .filter((f) => f.endsWith('.html') && f !== 'index.html')
    .reduce((n, f) => n + (fs.readFileSync(path.join('interview', f), 'utf8').match(/class="qna-item"/g) || []).length, 0);

  /* a track is what the home page offers as one — the curated user-facing list,
     rather than the manifest, which splits some and omits others */
  const tracks = (fs.readFileSync('index.html', 'utf8').match(/class="topic-card/g) || []).length;

  return { tracks, pages: walk('.').length, roadmaps, questions };
}

/* ── the card ──────────────────────────────────────────────────────── */
const card = (f) => `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background: #07090f;
    font-family: 'IBM Plex Sans', sans-serif;
    color: #e2e8f4;
    position: relative;
  }
  /* the same dot grid the site uses behind its hero */
  body::before {
    content: ''; position: absolute; inset: 0;
    background-image: radial-gradient(rgba(77,158,247,.13) 1px, transparent 1px);
    background-size: 26px 26px;
  }
  body::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(1000px 460px at 78% 8%, rgba(34,211,238,.10), transparent 70%),
                radial-gradient(760px 420px at 6% 96%, rgba(77,158,247,.10), transparent 70%);
  }
  .wrap { position: relative; z-index: 1; padding: 52px 60px; height: 100%; display: flex; flex-direction: column; }
  .cols { display: flex; gap: 46px; flex: 1; }
  .left { width: 640px; display: flex; flex-direction: column; }
  .right { flex: 1; display: flex; align-items: center; }

  /* a miniature of the roadmap the site renders: a spine, step cards, and the
     badge that turns into a tick once a lesson is done */
  .road { position: relative; width: 100%; padding-left: 34px; }
  .road::before {
    content: ''; position: absolute; left: 11px; top: 12px; bottom: 12px; width: 2px;
    background: linear-gradient(#4d9ef7, #22d3ee 55%, #1f2d42);
    border-radius: 2px;
  }
  .step { position: relative; margin-bottom: 14px; }
  .step:last-child { margin-bottom: 0; }
  .dot {
    position: absolute; left: -34px; top: 16px; width: 24px; height: 24px; border-radius: 7px;
    background: #0d1117; border: 1.5px solid var(--c); color: var(--c);
    display: flex; align-items: center; justify-content: center;
    font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700;
  }
  .card {
    background: rgba(13,17,23,.9); border: 1px solid #1f2d42; border-radius: 13px;
    padding: 13px 15px 14px;
  }
  .card .t { font-size: 15.5px; font-weight: 600; letter-spacing: -.01em; }
  .card .rows { margin-top: 9px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .row {
    display: flex; align-items: stretch; overflow: hidden;
    border: 1px solid color-mix(in srgb, var(--c) 30%, #1f2d42);
    border-radius: 8px; background: #141b26;
  }
  .row .b {
    width: 22px; display: flex; align-items: center; justify-content: center;
    font-family: 'JetBrains Mono', monospace; font-size: 9.5px; font-weight: 700;
    color: color-mix(in srgb, var(--c) 78%, #8da0bb);
    background: color-mix(in srgb, var(--c) 10%, transparent);
    border-right: 1px solid color-mix(in srgb, var(--c) 22%, #1f2d42);
  }
  .row.done .b { background: var(--c); color: #04070d; }
  .row .l { padding: 5px 9px; font-size: 11.5px; color: #a9b8d0; line-height: 1.35; }
  .row.done .l { text-decoration: line-through; text-decoration-color: color-mix(in srgb, var(--c) 70%, transparent); }

  .brand { display: flex; align-items: center; gap: 14px; }
  .brand img { width: 46px; height: 46px; border-radius: 10px; display: block; }
  .brand .name { font-size: 30px; font-weight: 700; letter-spacing: .06em; }
  .brand .name b { color: #4d9ef7; font-weight: 700; }

  .eyebrow {
    margin-top: 40px;
    display: inline-flex; align-items: center; gap: 10px; align-self: flex-start;
    font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 500;
    letter-spacing: .16em; text-transform: uppercase; color: #8da0bb;
    border: 1px solid #1f2d42; border-radius: 999px; padding: 8px 16px;
    background: rgba(20,27,38,.7);
  }
  .eyebrow i { width: 7px; height: 7px; border-radius: 50%; background: #22d3ee; display: block; }

  h1 { margin-top: 24px; font-size: 58px; line-height: 1.05; font-weight: 700; letter-spacing: -.022em; }
  h1 span { color: #4d9ef7; }

  .lede { margin-top: 18px; font-size: 19px; line-height: 1.5; color: #a9b8d0; }
  .lede b { color: #e2e8f4; font-weight: 600; }

  .stats { margin-top: auto; display: flex; gap: 12px; }
  .stat {
    flex: 1; padding: 18px 20px 16px;
    background: rgba(20,27,38,.82); border: 1px solid #1f2d42; border-radius: 14px;
  }
  .stat .n { font-size: 34px; font-weight: 700; letter-spacing: -.02em; }
  .stat .l {
    margin-top: 4px; font-family: 'JetBrains Mono', monospace;
    font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: #8da0bb;
  }
  .stat:nth-child(1) .n { color: #4d9ef7; }
  .stat:nth-child(2) .n { color: #22d3ee; }
  .stat:nth-child(3) .n { color: #34d399; }
  .stat:nth-child(4) .n { color: #a78bfa; }

  .foot {
    margin-top: 22px; padding-top: 18px; border-top: 1px solid #16202e;
    display: flex; align-items: center; justify-content: space-between;
    font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #8da0bb;
  }
  .foot .url { color: #e2e8f4; }
  .foot .tag { letter-spacing: .1em; text-transform: uppercase; font-size: 12px; }
</style></head>
<body>
  <div class="wrap">
    <div class="brand">
      <img src="icon-192.png" alt="">
      <div class="name">TECH<b>FORGE</b></div>
    </div>

    <div class="cols">
      <div class="left">
        <div class="eyebrow"><i></i> Free forever &nbsp;·&nbsp; No account &nbsp;·&nbsp; No ads</div>

        <h1>Computer science,<br><span>end to end.</span></h1>

        <p class="lede">
          Guided roadmaps where every node opens a real lesson &mdash; algorithms
          and system design through backend, data, security and interview prep.
          <b>Understand it, don't memorise it.</b>
        </p>

        <div class="stats">
          <div class="stat"><div class="n">${f.tracks}</div><div class="l">Tracks</div></div>
          <div class="stat"><div class="n">${f.roadmaps}</div><div class="l">Roadmaps</div></div>
          <div class="stat"><div class="n">${f.pages}</div><div class="l">Lessons</div></div>
          <div class="stat"><div class="n">${f.questions}</div><div class="l">Questions</div></div>
        </div>
      </div>

      <div class="right">
        <div class="road">
          <div class="step" style="--c:#4d9ef7">
            <div class="dot">01</div>
            <div class="card">
              <div class="t">Data Structures</div>
              <div class="rows">
                <div class="row done"><div class="b">&check;</div><div class="l">Big-O notation</div></div>
                <div class="row done"><div class="b">&check;</div><div class="l">Arrays &amp; strings</div></div>
                <div class="row"><div class="b">3</div><div class="l">Hash tables</div></div>
                <div class="row"><div class="b">4</div><div class="l">Trees &amp; graphs</div></div>
              </div>
            </div>
          </div>
          <div class="step" style="--c:#22d3ee">
            <div class="dot">02</div>
            <div class="card">
              <div class="t">System Design</div>
              <div class="rows">
                <div class="row done"><div class="b">&check;</div><div class="l">Caching</div></div>
                <div class="row"><div class="b">2</div><div class="l">Load balancing</div></div>
                <div class="row"><div class="b">3</div><div class="l">Consistency</div></div>
                <div class="row"><div class="b">4</div><div class="l">Sharding</div></div>
              </div>
            </div>
          </div>
          <div class="step" style="--c:#34d399">
            <div class="dot">03</div>
            <div class="card">
              <div class="t">Interview Prep</div>
              <div class="rows">
                <div class="row"><div class="b">1</div><div class="l">Patterns checklist</div></div>
                <div class="row"><div class="b">2</div><div class="l">Timed quiz</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="foot">
      <span class="url">${SITE}</span>
      <span class="tag">Open source &nbsp;·&nbsp; MIT</span>
    </div>
  </div>
</body></html>`;

/* ── run ───────────────────────────────────────────────────────────── */
const f = facts();
const check = process.argv.includes('--check');

if (check) {
  if (!fs.existsSync(STATS)) {
    console.log(`  ${OUT} has no recorded stats — run: node tools/build-og-image.mjs`);
    process.exit(1);
  }
  const was = JSON.parse(fs.readFileSync(STATS, 'utf8'));
  const drift = Object.keys(f).filter((k) => was[k] !== f[k]);
  if (drift.length) {
    console.log('The social preview no longer matches the site:\n');
    drift.forEach((k) => console.log(`  ${k}: image says ${was[k]}, site has ${f[k]}`));
    console.log('\nRun: node tools/build-og-image.mjs');
    process.exit(1);
  }
  console.log(`  ok  og-image matches the site (${f.tracks} tracks, ${f.roadmaps} roadmaps, ${f.pages} lessons, ${f.questions} questions)`);
  process.exit(0);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });

/* inline the logo so the page has no relative requests to resolve */
const html = card(f).replace(
  'src="icon-192.png"',
  `src="data:image/png;base64,${fs.readFileSync('assets/icon-192.png').toString('base64')}"`
);
await page.setContent(html, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: OUT });
await browser.close();

fs.writeFileSync(STATS, JSON.stringify(f, null, 2) + '\n');
console.log(`wrote ${OUT} — ${f.tracks} tracks, ${f.roadmaps} roadmaps, ${f.pages} lessons, ${f.questions} interview questions`);
