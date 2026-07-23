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

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function nodeHTML(n) {
  const icon = n.i ? `<i class="ti ${esc(n.i)}" aria-hidden="true"></i>` : '';
  const desc = n.s ? `<span class="rg-desc">${esc(n.s)}</span>` : '';
  const chips = (n.k || []).length
    ? `<span class="rg-chips">${n.k.map((k) => `<span>${esc(k)}</span>`).join('')}</span>` : '';
  const body = `<span class="rg-title">${icon}${esc(n.t)}</span>${desc}${chips}`;
  const cls = `rg-node rg-${n.tier}`;
  // No href means a category with no page of its own: a label, not a link.
  return n.href
    ? `<a class="${cls}" href="${esc(n.href)}" data-id="${esc(n.id)}">${body}</a>`
    : `<div class="${cls} rg-group" data-id="${esc(n.id)}">${body}</div>`;
}

export function mount(container, graph) {
  const { placed, buses } = computeLayout(graph);
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));

  const cells = [...placed.entries()].sort((a, b) =>
    a[1].rank - b[1].rank || a[1].col - b[1].col);

  const items = cells.map(([id, p]) => {
    const kids = buses.get(id) || [];
    const bus = kids.length
      ? `<div class="rg-bus">${kids.map((k) => nodeHTML(byId.get(k))).join('')}</div>`
      : '';
    const label = p.node.g ? `<span class="rg-group-label">${esc(p.node.g)}</span>` : '';
    return `<li class="rg-cell" style="grid-row:${p.rank + 1};grid-column:${p.col + 1}">`
      + label + nodeHTML(p.node) + bus + '</li>';
  }).join('');

  container.innerHTML =
    `<div class="rg-wrap">
       <svg class="rg-edges" aria-hidden="true" focusable="false"></svg>
       <ol class="rg-grid">${items}</ol>
     </div>`;

  return { refresh() {} }; // replaced in Task 4
}
