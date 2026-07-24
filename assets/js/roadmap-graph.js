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

  // A bus stack rendered inside its parent's cell made that one cell six pills
  // tall, which stretched the whole grid row and left a 214px hole beside it.
  // Giving each child its own row keeps row heights uniform.
  const placeWithBus = (node, r, col) => {
    placed.set(node.id, { rank: r, col, node });
    let next = r + 1;
    for (const kid of buses.get(node.id) || []) {
      const k = byId.get(kid);
      if (k) placed.set(kid, { rank: next++, col, node: k, inBus: true });
    }
    return next;
  };

  for (const s of spine) {
    const afterSpine = placeWithBus(s, row, 1);
    const kids = branchesBy.get(s.id) || [];

    // Place parents before their own children so a child can inherit the side
    // its parent landed on. Without this a sub-branch can alternate to the
    // opposite column and its connector swings right across the whole graph.
    const depthIn = (n) => {
      let d = 0, cur = n, guard = 0;
      while (cur && guard++ < 50) {
        const p = byId.get((cur.after || [])[0]);
        if (!p || p.tier === 'spine') break;
        d++; cur = p;
      }
      return d;
    };
    const ordered = kids.slice().sort((a, b) => depthIn(a) - depthIn(b));

    let left = row, right = row, alt = 0;
    for (const k of ordered) {
      let side;
      if (k.col === 0 || k.col === 2) {
        side = k.col;                                   // explicit pin wins
      } else {
        const parent = placed.get((k.after || [])[0]);
        side = parent && parent.col !== 1 ? parent.col  // stay under the parent
             : (alt++ % 2 === 0 ? 0 : 2);               // else alternate sides
      }
      if (side === 0) left = placeWithBus(k, left, 0);
      else right = placeWithBus(k, right, 2);
    }
    row = Math.max(afterSpine, left, right);
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
  if (!n.href) return `<div class="${cls} rg-group" data-id="${esc(n.id)}"${tip}>${body}</div>`;
  // A grouping node is a label; every real topic gets a tick to mark it done.
  // The tick is a sibling button, not inside the <a> — a button in a link is
  // invalid and un-clickable.
  return `<div class="rg-nodewrap">`
    + `<a class="${cls}" href="${esc(n.href)}" data-id="${esc(n.id)}"${tip}>${body}</a>`
    + `<button type="button" class="rg-check" data-toggle="${esc(n.id)}" aria-pressed="false"`
    + ` aria-label="Mark ${esc(n.t)} done" title="Mark done">`
    + `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button></div>`;
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
    let label = '';
    if (p.node.g && !labelled.has(p.node.g)) {
      labelled.add(p.node.g);
      label = `<span class="rg-group-label">${esc(p.node.g)}</span>`;
    }
    // Stagger by row so the graph assembles top-down; capped so a long roadmap
    // does not leave its last nodes waiting behind a queue of delays.
    const delay = Math.min(p.rank, 14) * 45;
    // Bus children are indented so a stack still reads as belonging to the node
    // above it, now that they sit in their own rows rather than one cell.
    const cls = `rg-cell rg-at-${p.col}${p.inBus ? ' rg-in-bus' : ''}`;
    return `<li class="${cls}" style="grid-row:${p.rank + 1};grid-column:${p.col + 1};animation-delay:${delay}ms">`
      + label + nodeHTML(p.node) + '</li>';
  }).join('');

  // The scroller is what keeps a wide graph inside the content column instead of
  // sprawling over the sidebar. tabindex makes it keyboard-reachable, which axe
  // requires of any scrollable region.
  const total = graph.nodes.filter((n) => n.href).length;
  container.innerHTML =
    `<div class="rg-shell" style="--rg-accent:${esc(graph.accent || 'var(--blue)')}">
       <div class="rg-progress">
         <div class="rg-progress-track"><div class="rg-progress-fill" id="rgFill"></div></div>
         <span class="rg-progress-count" id="rgCount">0 / ${total} done</span>
         <button type="button" class="rg-reset" id="rgReset">Reset</button>
       </div>
       <div class="rg-scroll" tabindex="0" role="group" aria-label="${esc(graph.title || 'Roadmap')} flow chart">
         <div class="rg-wrap">
           <svg class="rg-edges" aria-hidden="true" focusable="false"></svg>
           <ol class="rg-grid">${items}</ol>
         </div>
       </div>
     </div>`;

  const svg = container.querySelector('.rg-edges');
  const wrap = container.querySelector('.rg-wrap');

  function draw() {
    // Connectors are drawn at every width. Mobile keeps the same chart, scaled
    // down and horizontally scrollable, so the lines are what still make it read
    // as a flow chart rather than a list of pills.
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

    // Bus edges: one trunk down past a parent's sub-items with a short stub into
    // each, instead of N separate diagonals fanning out. Six sort algorithms
    // under one node produced six near-parallel strokes that read as noise.
    const busDrawn = new Set();
    for (const [pid, kids] of buses) {
      const parent = at(pid);
      const pp = placed.get(pid);
      if (!parent || !pp || !kids.length) continue;
      const rows = kids.map((k) => at(k)).filter(Boolean);
      if (!rows.length) continue;

      const onLeft = pp.col === 0;
      const trunkX = onLeft ? parent.x + parent.w - 14 : parent.x + 14;
      const lastY = rows[rows.length - 1].cy;
      const allDone = isDone(graph.id, pid) && kids.every((k) => isDone(graph.id, k));
      const cls = `rg-edge rg-edge-bus${allDone ? ' rg-edge-done' : ''}`;

      parts.push(`<path d="M${trunkX},${parent.y + parent.h} L${trunkX},${lastY}" class="${cls}" data-from="${esc(pid)}" data-to="${esc(pid)}"/>`);
      rows.forEach((r, i) => {
        const stubX = onLeft ? r.x + r.w : r.x;
        parts.push(`<path d="M${trunkX},${r.cy} L${stubX},${r.cy}" class="${cls}" data-from="${esc(pid)}" data-to="${esc(kids[i])}"/>`);
      });
      kids.forEach((k) => busDrawn.add(k));
    }

    for (const [id, p] of placed) {
      if (busDrawn.has(id)) continue;   // already covered by its bus trunk
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
        parts.push(`<path d="${d}" class="rg-edge${done ? ' rg-edge-done' : ''}" data-from="${esc(a)}" data-to="${esc(id)}"/>`);
      }
    }
    svg.innerHTML = parts.join('');

    // Each path needs its own length for the draw animation; a shared constant
    // makes short edges snap and long ones crawl.
    svg.querySelectorAll('.rg-edge').forEach((p, i) => {
      const len = Math.ceil(p.getTotalLength ? p.getTotalLength() : 400);
      p.style.setProperty('--rg-len', len);
      p.style.animationDelay = `${Math.min(i, 14) * 45 + 120}ms`;
    });
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

  // ---- progress --------------------------------------------------------------
  // Reflect done state onto the existing DOM (never rebuild — that would restart
  // the entrance animation and lose scroll position), then repaint the edges so
  // completed links pick up the accent.
  const counted = graph.nodes.filter((n) => n.href);
  function syncProgress() {
    let done = 0;
    for (const n of counted) {
      const on = isDone(graph.id, n.id);
      if (on) done++;
      const wrapEl = container.querySelector(`[data-id="${n.id}"]`);
      if (wrapEl) wrapEl.closest('.rg-nodewrap').classList.toggle('rg-done', on);
      const btn = container.querySelector(`[data-toggle="${n.id}"]`);
      if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    const pct = total ? Math.round((done / total) * 100) : 0;
    const fill = container.querySelector('#rgFill');
    const label = container.querySelector('#rgCount');
    if (fill) fill.style.transform = `scaleX(${pct / 100})`;
    if (label) label.textContent = `${done} / ${total} done`;
    schedule();
  }

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-toggle]');
    if (btn) {
      const id = btn.getAttribute('data-toggle');
      const now = !isDone(graph.id, id);
      setDone(graph.id, id, now);
      if (now) { btn.classList.add('rg-pop'); setTimeout(() => btn.classList.remove('rg-pop'), 360); }
      syncProgress();
      return;
    }
    if (e.target.closest('#rgReset')) {
      if (!window.confirm('Reset your progress on this roadmap?')) return;
      counted.forEach((n) => setDone(graph.id, n.id, false));
      syncProgress();
    }
  });
  syncProgress();

  // ---- ancestry highlighting -------------------------------------------------
  // Walking `after` upward gives the full prerequisite chain for any node.
  const chainOf = (id, acc = new Set(), guard = 0) => {
    if (guard > 60 || acc.has(id)) return acc;
    acc.add(id);
    const n = byId.get(id);
    for (const a of (n && n.after) || []) chainOf(a, acc, guard + 1);
    return acc;
  };

  const clearLit = () => {
    container.querySelectorAll('.rg-lit').forEach((e) => e.classList.remove('rg-lit'));
    container.querySelectorAll('.rg-edge-lit').forEach((e) => e.classList.remove('rg-edge-lit'));
  };

  const light = (id) => {
    clearLit();
    const chain = chainOf(id);
    chain.forEach((cid) => {
      const el = container.querySelector(`[data-id="${cid}"]`);
      if (el) el.classList.add('rg-lit');
    });
    container.querySelectorAll('.rg-edge').forEach((p) => {
      if (chain.has(p.getAttribute('data-from')) && chain.has(p.getAttribute('data-to'))) {
        p.classList.add('rg-edge-lit');
      }
    });
  };

  // Pointer and keyboard both drive it, so the affordance is not mouse-only.
  container.addEventListener('mouseover', (e) => {
    const el = e.target.closest('[data-id]');
    if (el) light(el.getAttribute('data-id'));
  });
  container.addEventListener('mouseleave', clearLit, true);
  container.addEventListener('focusin', (e) => {
    const el = e.target.closest('[data-id]');
    if (el) light(el.getAttribute('data-id'));
  });
  container.addEventListener('focusout', clearLit);

  return { refresh: schedule };
}

global.TFRoadmapGraph = { computeLayout: computeLayout, mount: mount, isDone: isDone, setDone: setDone };
}(typeof window !== "undefined" ? window : globalThis));
