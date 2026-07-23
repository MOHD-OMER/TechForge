import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readGraph } from './validate-graphs.mjs';

/**
 * roadmap-graph.js is a classic browser script, not an ES module — modules are
 * blocked over file://, and roadmap pages must open by double-clicking like
 * every other page on the site. So load it the way the browser would: evaluate
 * it against a stand-in global and read what it exposes.
 */
function loadRoadmapGraph() {
  const src = fs.readFileSync('assets/js/roadmap-graph.js', 'utf8');
  const globalShim = {};
  new Function('window', 'globalThis', `${src}\n;return window.TFRoadmapGraph;`)(globalShim, globalShim);
  if (!globalShim.TFRoadmapGraph) throw new Error('roadmap-graph.js did not expose TFRoadmapGraph');
  return globalShim.TFRoadmapGraph;
}

const { computeLayout } = loadRoadmapGraph();

const graph = readGraph('roadmaps/dsa.html');
const { placed, buses } = computeLayout(graph);

// spine nodes occupy the centre column
for (const [id, p] of placed) {
  if (p.node.tier === 'spine') assert.equal(p.col, 1, id + ' is a spine node and belongs in the centre column');
  else assert.ok(p.col === 0 || p.col === 2, id + ' is a branch and belongs to one side');
}

// the spine keeps dependency order top to bottom
const spineRows = [...placed.values()].filter((p) => p.node.tier === 'spine')
  .sort((a, b) => a.rank - b.rank).map((p) => p.node.id);
assert.equal(spineRows[0], 'bigo', 'Big-O should head the spine');
assert.ok(spineRows.indexOf('graph') > spineRows.indexOf('bst'), 'graphs come after trees');

// bus children are grouped under their parent, not ranked into the main grid
assert.deepEqual(buses.get('sorting'), ['bubble', 'selection', 'insertion', 'merge', 'quick', 'heapsort']);
assert.ok(!placed.has('bubble'), 'bus children are not placed in the main grid');

// no two nodes share a cell
const seen = new Set();
for (const [id, p] of placed) {
  const key = `${p.rank},${p.col}`;
  assert.ok(!seen.has(key), `cell collision at ${key} (${id})`);
  seen.add(key);
}

console.log(`layout ok: ${placed.size} placed, ${buses.size} bus groups`);

// only three columns, ever — that is what keeps the graph inside the content column
const usedCols = new Set([...placed.values()].map((p) => p.col));
assert.ok([...usedCols].every((c) => c >= 0 && c <= 2), 'columns must stay within 0..2');
