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

/**
 * Spine layout: one trunk down the middle, branches hanging left and right.
 *
 * Three columns only — left (0), spine (1), right (2) — so the graph stays as
 * narrow as the content column and grows downward instead of sideways. A wide
 * N-lane grid needed horizontal scrolling and overlapped the sidebar; depth is
 * free on a page that already scrolls vertically.
 *
 * Rows are allocated sequentially: each spine node takes a row, and its branches
 * take the rows beneath it, alternating sides.
 */
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

  // Dependency depth, used only to order the spine top to bottom.
  const depth = new Map();
  const resolve = (id, seen = new Set()) => {
    if (depth.has(id)) return depth.get(id);
    if (seen.has(id)) return 0;
    seen.add(id);
    const n = byId.get(id);
    if (!n) return 0;
    let d = (n.after || []).length
      ? 1 + Math.max(...n.after.map((a) => resolve(a, seen)))
      : 0;
    if (n.rank !== undefined) d = Math.max(d, n.rank);
    depth.set(id, d);
    return d;
  };
  for (const n of nodes) resolve(n.id);

  const isBus = (n) => n.bus && (n.after || []).length;
  const laid = nodes.filter((n) => !isBus(n));

  /** Nearest spine ancestor — the trunk node a branch hangs off. */
  const anchorOf = (n) => {
    let cur = n, guard = 0;
    while (cur && guard++ < 50) {
      const parent = (cur.after || [])[0];
      if (!parent) return null;
      const p = byId.get(parent);
      if (!p) return null;
      if (p.tier === 'spine') return p.id;
      cur = p;
    }
    return null;
  };

  const spine = laid.filter((n) => n.tier === 'spine')
    .sort((a, b) => depth.get(a.id) - depth.get(b.id));

  const branchesBy = new Map();
  const orphans = [];
  for (const n of laid) {
    if (n.tier === 'spine') continue;
    const a = anchorOf(n);
    if (a === null) { orphans.push(n); continue; }
    if (!branchesBy.has(a)) branchesBy.set(a, []);
    branchesBy.get(a).push(n);
  }

  const placed = new Map();
  let row = 0;

  // Anything with no spine ancestor still gets a place rather than vanishing.
  for (const n of orphans) placed.set(n.id, { rank: row++, col: 1, node: n });

  for (const s of spine) {
    placed.set(s.id, { rank: row, col: 1, node: s });
    const kids = branchesBy.get(s.id) || [];
    let left = row, right = row;
    kids.forEach((k, i) => {
      // An explicit col pin wins; otherwise alternate sides.
      const side = k.col === 0 || k.col === 2 ? k.col : (i % 2 === 0 ? 0 : 2);
      const at = side === 0 ? left++ : right++;
      placed.set(k.id, { rank: at, col: side, node: k });
    });
    row = Math.max(row + 1, left, right);
  }

  return { placed, buses, cols: 3, ranks: row };
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
  // Compact by design: a roadmap is scanned, not read. The one-line description
  // stays in the data and rides along as a tooltip rather than as body copy,
  // which is what let 31 nodes sprawl across the page before.
  const body = `<span class="rg-title">${icon}${esc(n.t)}</span>`;
  const cls = `rg-node rg-${n.tier}`;
  const tip = n.s ? ` title="${esc(n.s)}"` : '';
  if (n.href) return `<a class="${cls}" href="${esc(n.href)}" data-id="${esc(n.id)}"${tip}>${body}</a>`;
  return `<div class="${cls} rg-group" data-id="${esc(n.id)}"${tip}>${body}</div>`;
}

function mount(container, graph) {
  const { placed, buses } = computeLayout(graph);
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));

  const cells = [...placed.entries()].sort((a, b) =>
    a[1].rank - b[1].rank || a[1].col - b[1].col);

  // A group label marks where a band starts. Repeating it on every member of the
  // band (Foundations, Foundations, ...) is noise, so only the first node in
  // declaration order carries it.
  const labelled = new Set();

  const items = cells.map(([id, p]) => {
    const kids = buses.get(id) || [];
    const bus = kids.length
      ? `<div class="rg-bus">${kids.map((k) => nodeHTML(byId.get(k))).join('')}</div>`
      : '';
    let label = '';
    if (p.node.g && !labelled.has(p.node.g)) {
      labelled.add(p.node.g);
      label = `<span class="rg-group-label">${esc(p.node.g)}</span>`;
    }
    return `<li class="rg-cell rg-at-${p.col}" style="grid-row:${p.rank + 1};grid-column:${p.col + 1}">`
      + label + nodeHTML(p.node) + bus + '</li>';
  }).join('');

  // The scroller is what keeps a wide graph inside the content column instead of
  // sprawling over the sidebar. tabindex makes it keyboard-reachable, which axe
  // requires of any scrollable region.
  container.innerHTML =
    `<div class="rg-scroll" tabindex="0" role="group" aria-label="${esc(graph.title || 'Roadmap')} flow chart">
       <div class="rg-wrap">
         <svg class="rg-edges" aria-hidden="true" focusable="false"></svg>
         <ol class="rg-grid">${items}</ol>
       </div>
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
        x: r.left - box.left, y: r.top - box.top,
        w: r.width, h: r.height,
        cx: r.left - box.left + r.width / 2,
        cy: r.top - box.top + r.height / 2,
      };
    };

    const parts = [];
    for (const [id, p] of placed) {
      for (const a of p.node.after || []) {
        const from = at(a), to = at(id);
        if (!from || !to) continue;
        const done = isDone(graph.id, a) && isDone(graph.id, id);
        const fromCol = (placed.get(a) || {}).col;
        let d;
        if (fromCol === p.col) {
          // Same column: straight drop from one pill to the next.
          d = `M${from.cx},${from.y + from.h} L${to.cx},${to.y}`;
        } else {
          // Trunk to branch: leave the parent's side, run out, then in.
          // Short elbows read as structure; long diagonals read as noise.
          const goingRight = to.cx > from.cx;
          const sx = goingRight ? from.x + from.w : from.x;
          const sy = from.cy;
          const ex = goingRight ? to.x : to.x + to.w;
          const ey = to.cy;
          const mid = sx + (ex - sx) / 2;
          d = `M${sx},${sy} C${mid},${sy} ${mid},${ey} ${ex},${ey}`;
        }
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
