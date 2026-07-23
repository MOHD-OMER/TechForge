/**
 * Roadmap flow-chart renderer. Classic script, zero dependencies.
 *
 * Deliberately NOT an ES module: browsers block module loading over file://
 * (origin "null"), and every other page on this site opens by double-clicking
 * the HTML. A module here would make roadmap pages the only ones that need a
 * server. Exposed on window instead, matching topics-manifest.js and
 * site-index.js. Node tooling loads this file by reading and evaluating it —
 * see scripts/test-layout.mjs.
 *
 * Layout is a layered DAG: rank = 1 + max(rank of predecessors). Nodes sharing
 * a rank share a row; columns are assigned in declaration order. There is no
 * automatic crossing minimisation on purpose — authors reorder the array to get
 * the arrangement they want, which is easier to reason about than a heuristic.
 */
(function (global) {
'use strict';

/** Bus children stack under their parent instead of entering the main grid. */
function computeLayout(graph) {
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

const key = (gid, nid) => `tf_rg_${gid}_${nid}`;
function isDone(gid, nid) {
  try { return localStorage.getItem(key(gid, nid)) === '1'; } catch (e) { return false; }
}
function setDone(gid, nid, v) {
  try { v ? localStorage.setItem(key(gid, nid), '1') : localStorage.removeItem(key(gid, nid)); }
  catch (e) { /* private mode */ }
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

function mount(container, graph) {
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

  const svg = container.querySelector('.rg-edges');
  const wrap = container.querySelector('.rg-wrap');

  function draw() {
    // Below the collapse breakpoint the grid is a single column and the SVG is
    // hidden by CSS; drawing would be wasted work.
    if (window.innerWidth <= 760) { svg.innerHTML = ''; return; }

    const box = wrap.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.setAttribute('width', box.width);
    svg.setAttribute('height', box.height);

    const at = (id) => {
      const el = container.querySelector(`[data-id="${id}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        top:    { x: r.left - box.left + r.width / 2, y: r.top - box.top },
        bottom: { x: r.left - box.left + r.width / 2, y: r.bottom - box.top },
      };
    };

    const parts = [];
    for (const [id, p] of placed) {
      for (const a of p.node.after || []) {
        const from = at(a), to = at(id);
        if (!from || !to) continue;
        const done = isDone(graph.id, a) && isDone(graph.id, id);
        const straight = p.node.curve === false
          || Math.abs(from.bottom.x - to.top.x) < 2;
        const d = straight
          ? `M${from.bottom.x},${from.bottom.y} L${to.top.x},${to.top.y}`
          : `M${from.bottom.x},${from.bottom.y}`
            + ` C${from.bottom.x},${(from.bottom.y + to.top.y) / 2}`
            + ` ${to.top.x},${(from.bottom.y + to.top.y) / 2}`
            + ` ${to.top.x},${to.top.y}`;
        parts.push(`<path d="${d}" class="rg-edge${done ? ' rg-edge-done' : ''}"/>`);
      }
    }
    svg.innerHTML = parts.join('');
  }

  // Debounced + rAF. Writing layout synchronously inside a ResizeObserver
  // callback triggers "ResizeObserver loop completed with undelivered
  // notifications", which surfaces as a console error.
  let pending = 0, timer = 0;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(draw);
    }, 60);
  };

  new ResizeObserver(schedule).observe(wrap);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  schedule();

  return { refresh: schedule };
}

global.TFRoadmapGraph = { computeLayout: computeLayout, mount: mount, isDone: isDone, setDone: setDone };
}(typeof window !== "undefined" ? window : globalThis));
