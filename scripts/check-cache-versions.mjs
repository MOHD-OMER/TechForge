#!/usr/bin/env node
/**
 * Assets are served with a one-year immutable cache (see vercel.json), so the
 * only thing that makes a returning visitor fetch a changed file is the ?v=
 * query string. Edit a stylesheet without bumping it and the fix ships to
 * nobody who has visited before — which is exactly how the AI/ML lesson
 * buttons kept rendering unstyled after their CSS was written.
 *
 * Fails when an asset's contents changed more recently than the last commit
 * that touched its ?v= reference.
 *
 * Run: npm run check:cache
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const git = (cmd) => {
  try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return ''; }
};

const walk = (d, out = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
};

const pages = walk('.');
const assets = [];
for (const dir of ['assets/css', 'assets/js']) {
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (f.endsWith('.css') || f.endsWith('.js')) assets.push(path.posix.join(dir, f));
  }
}

const stale = [];
let checked = 0;

for (const asset of assets) {
  const base = path.basename(asset);
  const re = new RegExp(base.replace(/\./g, '\\.') + '\\?v=(\\d+)');

  let version = null, ref = null;
  for (const p of pages) {
    const m = fs.readFileSync(p, 'utf8').match(re);
    if (m) { version = m[1]; ref = p; break; }
  }
  if (!version) continue;      // not cache-busted, nothing to check
  checked++;

  const contentDate = Number(git(`git log -1 --format=%ct -- "${asset}"`) || 0);
  const bumpDate = Number(git(`git log -1 --format=%ct -S "${base}?v=${version}" -- "${ref}"`) || 0);

  // bumpDate 0 means this version string is not in history yet: it was just
  // bumped in the working tree, which is the state we want, not a failure
  if (bumpDate === 0) continue;

  if (contentDate > bumpDate) {
    stale.push({
      asset, version,
      content: git(`git log -1 --format=%ad --date=short -- "${asset}"`),
      bumped: git(`git log -1 --format=%ad --date=short -S "${base}?v=${version}" -- "${ref}"`),
    });
  }
}

if (!stale.length) {
  console.log(`  ok  ${checked} versioned assets, none stale`);
  process.exit(0);
}

console.log('Assets changed after their ?v= was last bumped — returning visitors still get the old file:\n');
for (const s of stale) {
  console.log(`  ${s.asset}?v=${s.version}`);
  console.log(`      content changed ${s.content}, version last bumped ${s.bumped}`);
}
console.log(`\n${stale.length} stale asset(s). Bump the ?v= across every page that references them.`);
process.exit(1);
