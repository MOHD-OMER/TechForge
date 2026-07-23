/**
 * Regression coverage for scripts/validate-graphs.mjs.
 * Run: node scripts/test-validate-graphs.mjs
 */
import assert from 'node:assert/strict';
import { readGraph, validateGraph } from './validate-graphs.mjs';

function mkGraph(nodes) {
  return { nodes };
}

// 1. bus node with no `after` must not throw and must report the bus-parent error
{
  const graph = mkGraph([{ id: 'a', tier: 'detail', bus: true }]);
  const errors = validateGraph(graph, 'roadmaps/probe.html');
  assert.ok(Array.isArray(errors), 'expected errors array, not a throw');
  assert.ok(
    errors.some((e) => e.includes('bus nodes must have exactly one parent')),
    `expected bus-parent error, got: ${JSON.stringify(errors)}`
  );
}

// 2. bus node with two parents must report the bus-parent error
{
  const graph = mkGraph([
    { id: 'p1', tier: 'spine' },
    { id: 'p2', tier: 'spine' },
    { id: 'b', tier: 'detail', bus: true, after: ['p1', 'p2'] },
  ]);
  const errors = validateGraph(graph, 'roadmaps/probe.html');
  assert.ok(
    errors.some((e) => e.includes('bus nodes must have exactly one parent')),
    `expected bus-parent error, got: ${JSON.stringify(errors)}`
  );
}

// 3. a cycle is reported
{
  const graph = mkGraph([
    { id: 'x', tier: 'spine', after: ['y'] },
    { id: 'y', tier: 'spine', after: ['x'] },
  ]);
  const errors = validateGraph(graph, 'roadmaps/probe.html');
  assert.ok(
    errors.some((e) => e.startsWith('cycle:')),
    `expected cycle error, got: ${JSON.stringify(errors)}`
  );
}

// 4. a rank override below its predecessor floor is reported
{
  const graph = mkGraph([
    { id: 'root', tier: 'spine' },
    { id: 'child', tier: 'spine', after: ['root'], rank: 0 },
  ]);
  const errors = validateGraph(graph, 'roadmaps/probe.html');
  assert.ok(
    errors.some((e) => e.includes('rank override')),
    `expected rank override error, got: ${JSON.stringify(errors)}`
  );
}

// 5. a valid graph (roadmaps/dsa.html) returns an EMPTY errors array
{
  const graph = readGraph('roadmaps/dsa.html');
  const errors = validateGraph(graph, 'roadmaps/dsa.html');
  assert.deepEqual(errors, [], `expected no errors, got: ${JSON.stringify(errors)}`);
}

console.log('OK: 5/5 validate-graphs regression checks passed');
