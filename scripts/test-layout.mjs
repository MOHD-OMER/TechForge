import assert from 'node:assert/strict';
import { readGraph } from './validate-graphs.mjs';
import { computeLayout } from '../assets/js/roadmap-graph.js';

const graph = readGraph('roadmaps/dsa.html');
const { placed, buses } = computeLayout(graph);

// roots sit at rank 0
assert.equal(placed.get('bigo').rank, 0, 'bigo should be rank 0');

// a child ranks below every parent
let parentChildChecks = 0;
for (const [id, p] of placed) {
  const node = p.node;
  for (const a of node.after || []) {
    assert.ok(p.rank > placed.get(a).rank, `${id} must rank below ${a}`);
    parentChildChecks++;
  }
}
assert.ok(parentChildChecks > 0, 'parent/child rank checks should not be vacuous');

// rank override respected
assert.equal(placed.get('dp').rank, 6, 'dp override should hold');

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

// regression: rank override that skips intermediate ranks should give ranks = max + 1
const skipGraph = {
  nodes: [
    { id: 'root' },
    { id: 'child', after: ['root'] },
    { id: 'deep', after: ['child'], rank: 10 },
  ],
};
const { ranks: skipRanks } = computeLayout(skipGraph);
assert.equal(skipRanks, 11, 'rank override at 10 should give ranks = 11, not count of distinct ranks');
