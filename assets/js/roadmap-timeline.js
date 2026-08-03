/* Roadmap timeline renderer.
 *
 * Reads the same #rgGraph JSON block the flow chart used, so the data stays a
 * single validated source (scripts/validate-graphs.mjs still gates it) and the
 * generator in tools/build-roadmaps.mjs needs no changes.
 *
 * Shape of the render: spine nodes become numbered steps down a central line;
 * whatever hangs off a step — its page sections on a topic roadmap, its
 * optional detours on a career path — becomes that card's bullet list.
 *
 * Classic script, not a module: these pages must open from disk, and ES modules
 * are blocked over file:// (origin null).
 */
(function (global) {
  'use strict';

  /* Colour follows the band, not the step. PRODUCT.md principle 3: the accent
     is wayfinding, so the hue answers "which phase am I in", rather than just
     making the page stripy. */
  var BAND_COLOURS = [
    'var(--cyan)', 'var(--blue)', 'var(--purple)', 'var(--green)',
    'var(--amber)', 'var(--teal)', 'var(--orange)', 'var(--red)',
  ];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* Walk the `after` chain so steps appear in teaching order rather than
     whatever order the JSON happens to list them in. */
  function orderSpine(nodes) {
    var spine = nodes.filter(function (n) { return n.tier === 'spine'; });
    var byId = {};
    spine.forEach(function (n) { byId[n.id] = n; });

    var incoming = {};
    spine.forEach(function (n) {
      (n.after || []).forEach(function (a) {
        if (byId[a]) incoming[n.id] = (incoming[n.id] || 0) + 1;
      });
    });

    var out = [];
    var seen = {};
    var roots = spine.filter(function (n) { return !incoming[n.id]; });
    var queue = roots.length ? roots.slice() : spine.slice(0, 1);

    while (queue.length) {
      var n = queue.shift();
      if (!n || seen[n.id]) continue;
      seen[n.id] = true;
      out.push(n);
      // whichever step lists this one as its prerequisite comes next
      spine.forEach(function (m) {
        if (!seen[m.id] && (m.after || []).indexOf(n.id) !== -1) queue.push(m);
      });
    }
    // anything unreachable (malformed data) still gets shown, at the end
    spine.forEach(function (n) { if (!seen[n.id]) out.push(n); });
    return out;
  }

  /* Group every non-spine node under exactly one step. A career-path detour can
     name two prerequisites (its own, plus the step it follows); attaching it to
     each would print it twice. It belongs at the point it becomes available,
     which is its latest prerequisite in teaching order. */
  function groupChildren(nodes, steps) {
    var order = {};
    steps.forEach(function (s, i) { order[s.id] = i; });

    var buckets = {};
    steps.forEach(function (s) { buckets[s.id] = []; });

    nodes.forEach(function (n) {
      if (n.tier === 'spine') return;
      var owner = null, best = -1;
      (n.after || []).forEach(function (a) {
        if (order[a] !== undefined && order[a] > best) { best = order[a]; owner = a; }
      });
      if (owner === null) owner = steps.length ? steps[0].id : null;
      if (owner !== null && buckets[owner]) buckets[owner].push(n);
    });
    return buckets;
  }

  function render(mount, graph) {
    var nodes = graph.nodes || [];
    var steps = orderSpine(nodes);
    if (!steps.length) return null;

    /* one colour per band, in the order the bands first appear */
    var bandColour = {};
    var bandCount = 0;
    steps.forEach(function (s) {
      var band = s.g || '';
      if (band && !bandColour[band]) {
        bandColour[band] = BAND_COLOURS[bandCount % BAND_COLOURS.length];
        bandCount++;
      }
    });
    var fallback = graph.accent || 'var(--blue)';

    var buckets = groupChildren(nodes, steps);

    var road = document.createElement('div');
    road.className = 'rt-road';

    var fill = document.createElement('div');
    fill.className = 'rt-fill';
    road.appendChild(fill);

    var list = document.createElement('ol');
    list.className = 'rt-steps';

    var lastBand = null;
    steps.forEach(function (step, i) {
      var colour = bandColour[step.g] || fallback;
      var kids = buckets[step.id] || [];

      var li = document.createElement('li');
      li.className = 'rt-step';
      li.dataset.colour = colour;

      var showBand = step.g && step.g !== lastBand;
      lastBand = step.g || lastBand;

      var bullets = kids.map(function (k) {
        var label = esc(k.t);
        var optional = k.tier === 'branch' ? '<span class="rt-opt">optional</span>' : '';
        return k.href
          ? '<li><a href="' + esc(k.href) + '">' + label + '</a>' + optional + '</li>'
          : '<li>' + label + optional + '</li>';
      }).join('');

      var icon = step.i
        ? '<i class="ti ' + esc(step.i) + '" aria-hidden="true"></i>'
        : String(i + 1);

      li.innerHTML =
        '<div class="rt-card" style="--c:' + colour + '">' +
          '<div class="rt-chip">' + icon + '</div>' +
          '<div class="rt-body">' +
            (showBand ? '<div class="rt-band">' + esc(step.g) + '</div>' : '') +
            '<a class="rt-title" href="' + esc(step.href || '#') + '">' + esc(step.t) + '</a>' +
            (step.s ? '<p class="rt-desc">' + esc(step.s) + '</p>' : '') +
            (bullets ? '<ul class="rt-list">' + bullets + '</ul>' : '') +
          '</div>' +
        '</div>' +
        '<div class="rt-node" style="--c:' + colour + '">' +
          (i + 1 < 10 ? '0' : '') + (i + 1) +
        '</div>';

      list.appendChild(li);
    });

    road.appendChild(list);
    mount.appendChild(road);
    return { road: road, fill: fill, steps: Array.prototype.slice.call(list.children) };
  }

  /* ── scroll behaviour: spine fill, active node, mini-map, pill ────── */
  function wire(view) {
    var reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var steps = view.steps;
    var current = -1;

    if (!reduced && 'IntersectionObserver' in global) {
      var seen = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('rt-seen'); seen.unobserve(e.target); }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
      steps.forEach(function (s) { seen.observe(s); });
    } else {
      steps.forEach(function (s) { s.classList.add('rt-seen'); });
    }

    /* mini-map: real buttons in a nav, so it is reachable by keyboard and
       announced as navigation rather than as decoration */
    var map = document.createElement('nav');
    map.className = 'rt-map';
    map.setAttribute('aria-label', 'Roadmap steps');
    var dots = steps.map(function (step, i) {
      var title = (step.querySelector('.rt-title') || {}).textContent || ('Step ' + (i + 1));
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'rt-dot';
      dot.style.setProperty('--c', step.dataset.colour || 'var(--blue)');
      dot.setAttribute('aria-label', 'Step ' + (i + 1) + ': ' + title);
      dot.addEventListener('click', function () { goTo(i); });
      map.appendChild(dot);
      return dot;
    });
    document.body.appendChild(map);

    /* Visual echo of the mini-map. aria-hidden: the same information is already
       available from the mini-map buttons, and a live region announcing every
       step on scroll would be noise for a screen reader. */
    var pill = document.createElement('div');
    pill.className = 'rt-pill';
    pill.setAttribute('aria-hidden', 'true');
    document.body.appendChild(pill);

    function setActive(i) {
      if (i === current || i < 0 || i >= steps.length) return;
      current = i;
      steps.forEach(function (s, n) {
        var node = s.querySelector('.rt-node');
        if (node) node.classList.toggle('rt-active', n === i);
      });
      dots.forEach(function (d, n) {
        if (n === i) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      pill.style.setProperty('--c', steps[i].dataset.colour || 'var(--blue)');
      pill.innerHTML = 'STEP <strong>' + (i + 1) + '</strong> OF ' + steps.length;
    }

    function goTo(i) {
      i = Math.max(0, Math.min(steps.length - 1, i));
      steps[i].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      setActive(i);
    }

    function update() {
      var rect = view.road.getBoundingClientRect();
      var mid = global.innerHeight * 0.5;
      var pct = Math.max(0, Math.min(1, (mid - rect.top) / (rect.height || 1)));
      view.fill.style.transform = 'translateX(-50%) scaleY(' + pct + ')';

      var inside = rect.top < mid && rect.bottom > mid;
      pill.classList.toggle('rt-on', inside);
      if (!inside) return;

      var closest = 0, best = Infinity;
      steps.forEach(function (s, i) {
        var r = s.getBoundingClientRect();
        var d = Math.abs((r.top + r.height / 2) - mid);
        if (d < best) { best = d; closest = i; }
      });
      setActive(closest);
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      global.requestAnimationFrame(function () { update(); ticking = false; });
    }
    global.addEventListener('scroll', onScroll, { passive: true });
    global.addEventListener('resize', onScroll);
    update();

    /* j/k and the arrows step through, the way the rest of the site's
       keyboard shortcuts behave. Never while typing. */
    document.addEventListener('keydown', function (e) {
      var el = document.activeElement;
      var tag = (el && el.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (el && el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        goTo(current < 0 ? 0 : current + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        goTo(current < 0 ? 0 : current - 1);
      }
    });
  }

  function mount(mountEl, dataEl) {
    if (!mountEl || !dataEl) return;
    var graph;
    try { graph = JSON.parse(dataEl.textContent); } catch (err) { return; }
    if (graph.accent) mountEl.style.setProperty('--rt-accent', graph.accent);
    var view = render(mountEl, graph);
    if (view) wire(view);
  }

  function init() {
    mount(document.getElementById('rgMount'), document.getElementById('rgGraph'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.TFRoadmapTimeline = { render: render, mount: mount };
}(typeof window !== 'undefined' ? window : globalThis));
