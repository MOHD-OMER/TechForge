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

// 6. reverse drift: a "soon" node whose page now exists must be reported, and
//    one whose page is still missing must not be — the check is worthless if it
//    fires either always or never.
{
  const written = mkGraph([
    { id: 'root', tier: 'spine' },
    { id: 'x', tier: 'branch', after: ['root'], status: 'soon', href: '../dsa/arrays.html' },
  ]);
  assert.ok(
    validateGraph(written, 'roadmaps/probe.html').some((e) => e.includes('now exists')),
    'expected reverse-drift error for a soon node whose page exists'
  );

  const unwritten = mkGraph([
    { id: 'root', tier: 'spine' },
    { id: 'x', tier: 'branch', after: ['root'], status: 'soon', href: '../frontend/react.html' },
  ]);
  assert.deepEqual(
    validateGraph(unwritten, 'roadmaps/probe.html'), [],
    'a soon node pointing at a page that does not exist yet is the normal case'
  );
}

// 7. an unknown status value is rejected
{
  const graph = mkGraph([{ id: 'root', tier: 'spine', status: 'maybe' }]);
  assert.ok(
    validateGraph(graph, 'roadmaps/probe.html').some((e) => e.includes('status must be')),
    'expected an error for an unrecognised status'
  );
}

console.log('OK: 7/7 validate-graphs regression checks passed');
