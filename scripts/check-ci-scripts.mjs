#!/usr/bin/env node
/**
 * Every `npm run` in CI must resolve to a script that exists.
 *
 * check:links was wired into the workflow without ever being added to
 * package.json. It went unnoticed for a long time because the command was run
 * directly as `node scripts/check-links.mjs` locally — so the gate looked green
 * on a laptop and failed the moment CI reached it.
 *
 * This is the gate on the gates. It also flags scripts pointing at a file that
 * does not exist, which is the same failure one step later.
 *
 * Run: npm run check:ci
 */
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const scripts = pkg.scripts || {};
const problems = [];

/* 1. every npm run in a workflow resolves */
const workflows = fs.existsSync('.github/workflows')
  ? fs.readdirSync('.github/workflows').filter((f) => /\.ya?ml$/.test(f))
  : [];

for (const file of workflows) {
  const path = `.github/workflows/${file}`;
  const src = fs.readFileSync(path, 'utf8');
  src.split('\n').forEach((line, i) => {
    const m = line.match(/npm run ([a-z0-9:_-]+)/i);
    if (!m) return;
    if (!scripts[m[1]]) problems.push(`${path}:${i + 1}  npm run ${m[1]} — no such script in package.json`);
  });
}

/* 2. every script points at a file that exists */
for (const [name, cmd] of Object.entries(scripts)) {
  const m = cmd.match(/node\s+([\w./-]+\.mjs)/);
  if (m && !fs.existsSync(m[1])) problems.push(`package.json  ${name} → ${m[1]} does not exist`);
}

if (problems.length) {
  console.log('CI references scripts that will not run:\n');
  problems.forEach((p) => console.log('  ' + p));
  console.log(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`  ok  ${workflows.length} workflow(s), every npm run resolves`);
