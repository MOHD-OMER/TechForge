/**
 * Static validation for roadmap graph data. Runs in plain Node — no browser.
 * A graph that fails these checks would render a picture that contradicts its
 * own text, so this gates every roadmap page.
 */
import fs from 'node:fs';
import path from 'node:path';

export function readGraph(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/<script type="application\/json" id="rgGraph">([\s\S]*?)<\/script>/);
  if (!m) throw new Error(`No #rgGraph JSON block in ${htmlPath}`);
  return JSON.parse(m[1]);
}

export function validateGraph(graph, htmlPath) {
  const errors = [];
  const dir = path.dirname(htmlPath);
  const nodes = graph.nodes || [];
  const byId = new Map();

  for (const n of nodes) {
    if (!n.id) { errors.push(`node without id: ${JSON.stringify(n)}`); continue; }
    if (byId.has(n.id)) errors.push(`duplicate id: ${n.id}`);
    byId.set(n.id, n);
    if (!['spine', 'branch', 'detail'].includes(n.tier)) {
      errors.push(`${n.id}: tier must be spine|branch|detail, got ${n.tier}`);
    }
    // A node may deep-link into a section (page.html#sec-x). Check the file, not
    // the fragment — existsSync on "page.html#sec-x" is always false.
    if (n.href && !fs.existsSync(path.join(dir, n.href.split('#')[0]))) {
      errors.push(`${n.id}: href does not exist -> ${n.href}`);
    }
  }

  for (const n of nodes) {
    for (const a of n.after || []) {
      if (!byId.has(a)) errors.push(`${n.id}: after references unknown id "${a}"`);
    }
    if (n.bus && (n.after || []).length !== 1) {
      errors.push(`${n.id}: bus nodes must have exactly one parent`);
    }
  }

  // cycle detection
  const state = new Map();
  const visit = (id, trail) => {
    if (state.get(id) === 1) { errors.push(`cycle: ${trail.join(' -> ')}`); return; }
    if (state.get(id) === 2) return;
    state.set(id, 1);
    for (const a of (byId.get(id)?.after) || []) {
      if (byId.has(a)) visit(a, trail.concat(a));
    }
    state.set(id, 2);
  };
  for (const n of nodes) if (n.id) visit(n.id, [n.id]);

  // rank override legality
  const rank = computeRanks(nodes, byId, errors);
  for (const n of nodes) {
    if (n.rank === undefined) continue;
    const floor = (n.after || []).length
      ? 1 + Math.max(...n.after.map((a) => rank.get(a) ?? 0))
      : 0;
    if (n.rank < floor) {
      errors.push(`${n.id}: rank override ${n.rank} is above its prerequisites (min ${floor})`);
    }
  }

  // no two nodes in the same explicit cell
  const cells = new Map();
  for (const n of nodes) {
    if (n.rank === undefined || n.col === undefined) continue;
    const key = `${n.rank},${n.col}`;
    if (cells.has(key)) errors.push(`${n.id} and ${cells.get(key)} both pinned to cell ${key}`);
    cells.set(key, n.id);
  }

  return errors;
}

export function computeRanks(nodes, byId, errors = []) {
  const rank = new Map();
  const resolve = (id, seen = new Set()) => {
    if (rank.has(id)) return rank.get(id);
    if (seen.has(id)) return 0; // cycle already reported
    seen.add(id);
    const n = byId.get(id);
    if (!n) return 0;
    let r;
    if (n.bus) {
      // bus children stack under their parent; a malformed bus node with no
      // parent falls back to root rank (validateGraph reports the error).
      r = (n.after || []).length ? resolve(n.after[0], seen) : 0;
    } else if ((n.after || []).length) {
      r = 1 + Math.max(...n.after.map((a) => resolve(a, seen)));
    } else {
      r = 0;
    }
    if (n.rank !== undefined) r = Math.max(r, n.rank);
    rank.set(id, r);
    return r;
  };
  for (const n of nodes) if (n.id) resolve(n.id);
  return rank;
}

const argv1 = process.argv[1];
const expected = argv1 ? `file://${path.resolve(argv1).replace(/\\/g, '/')}` : null;
if (argv1 && (import.meta.url === expected || import.meta.url.endsWith(argv1.replace(/\\/g, '/')))) {
  const targets = process.argv.slice(2);
  // roadmaps/paths/ holds the career-path graphs, so walk instead of listing.
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name))
      : e.name.endsWith('.html') ? [path.join(dir, e.name)] : []);
  const files = targets.length ? targets : walk('roadmaps');
  let total = 0, skipped = 0;
  for (const f of files) {
    // roadmaps/ also holds the directory page and any tree-based roadmap, which
    // carry no graph block. Those are not failures, just not graphs.
    if (!fs.readFileSync(f, 'utf8').includes('id="rgGraph"')) { skipped++; continue; }
    const g = readGraph(f);
    const errs = validateGraph(g, f);
    total += errs.length;
    if (errs.length) {
      console.log(`FAIL ${f}`);
      errs.forEach((e) => console.log('  ' + e));
    } else {
      console.log(`  ok  ${f}: ${g.nodes.length} nodes`);
    }
  }
  if (total) { console.log(`\n${total} problem(s)`); process.exit(1); }
  console.log('\nAll graphs valid.');
}
