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

// spine nodes occupy the centre column; branches take a side. Sub-items follow
// whichever column their parent landed in, so a spine node's sub-items are
// legitimately centre too.
for (const [id, p] of placed) {
  if (p.node.tier === 'spine') {
    assert.equal(p.col, 1, id + ' is a spine node and belongs in the centre column');
  } else if (p.inBus) {
    const parent = placed.get((p.node.after || [])[0]);
    assert.ok(parent, id + ' is a sub-item and must have a placed parent');
    assert.equal(p.col, parent.col, id + ' must share its parent column');
    assert.ok(p.rank > parent.rank, id + ' must sit below its parent');
  } else {
    assert.ok(p.col === 0 || p.col === 2, id + ' is a branch and belongs to one side');
  }
}

// the spine keeps dependency order top to bottom
const spineRows = [...placed.values()].filter((p) => p.node.tier === 'spine')
  .sort((a, b) => a.rank - b.rank).map((p) => p.node.id);
assert.equal(spineRows[0], 'bigo', 'Big-O should head the spine');
assert.ok(spineRows.indexOf('graph') > spineRows.indexOf('bst'), 'graphs come after trees');

// bus children are grouped under their parent, not ranked into the main grid
assert.deepEqual(buses.get('sorting'), ['bubble', 'selection', 'insertion', 'merge', 'quick', 'heapsort']);
// Sub-items now take their own grid rows rather than stacking inside one cell —
// stacking made that cell six pills tall and blew a 214px hole in the row beside it.
assert.ok(placed.has('bubble'), 'sub-items get their own row');
assert.equal(placed.get('bubble').col, placed.get('sorting').col, 'sub-item shares its parent column');
assert.ok(placed.get('bubble').rank > placed.get('sorting').rank, 'sub-item sits below its parent');
const sortKids = ['bubble', 'selection', 'insertion', 'merge', 'quick', 'heapsort'].map((id) => placed.get(id).rank);
assert.deepEqual(sortKids, sortKids.slice().sort((a, b) => a - b), 'sub-items keep declaration order downward');
assert.equal(new Set(sortKids).size, sortKids.length, 'each sub-item gets a distinct row');

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
