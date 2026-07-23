/**
 * Roadmap flow-chart renderer. ES module, zero dependencies.
 *
 * Layout is a layered DAG: rank = 1 + max(rank of predecessors). Nodes sharing
 * a rank share a row; columns are assigned in declaration order. There is no
 * automatic crossing minimisation on purpose — authors reorder the array to get
 * the arrangement they want, which is easier to reason about than a heuristic.
 */

/** Bus children stack under their parent instead of entering the main grid. */
export function computeLayout(graph) {
  const nodes = graph.nodes || [];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const buses = new Map();
  for (const n of nodes) {
    // A malformed bus node (no parent) must not crash the layout — the
    // validator reports it; the renderer degrades by treating it as a root.
    if (!n.bus || !(n.after || []).length) continue;
    const parent = n.after[0];
    if (!buses.has(parent)) buses.set(parent, []);
    buses.get(parent).push(n.id);
  }

  const rank = new Map();
  const resolve = (id, seen = new Set()) => {
    if (rank.has(id)) return rank.get(id);
    if (seen.has(id)) return 0;
    seen.add(id);
    const n = byId.get(id);
    if (!n) return 0;
    let r = (n.after || []).length
      ? 1 + Math.max(...n.after.map((a) => resolve(a, seen)))
      : 0;
    if (n.rank !== undefined) r = Math.max(r, n.rank);
    rank.set(id, r);
    return r;
  };

  // A bus node with no parent falls back into the main grid rather than
  // vanishing from the page entirely.
  const main = nodes.filter((n) => !n.bus || !(n.after || []).length);
  for (const n of main) resolve(n.id);

  // assign columns per rank, honouring explicit col pins first
  const byRank = new Map();
  for (const n of main) {
    const r = rank.get(n.id);
    if (!byRank.has(r)) byRank.set(r, []);
    byRank.get(r).push(n);
  }

  const placed = new Map();
  let cols = 0;
  let maxRank = 0;
  for (const [r, list] of byRank) {
    const taken = new Set(list.filter((n) => n.col !== undefined).map((n) => n.col));
    let next = 0;
    for (const n of list) {
      let col = n.col;
      if (col === undefined) {
        while (taken.has(next)) next++;
        col = next++;
      }
      taken.add(col);
      cols = Math.max(cols, col + 1);
      maxRank = Math.max(maxRank, r);
      placed.set(n.id, { rank: r, col, node: n });
    }
  }

  return { placed, buses, cols, ranks: placed.size ? maxRank + 1 : 0 };
}
