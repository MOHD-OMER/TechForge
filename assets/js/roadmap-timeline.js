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

  /* ── completion ───────────────────────────────────────────────────────
     A roadmap you cannot tick off is a table of contents. Ticks read and write
     the same tf_completed_topics the lesson pages and the dashboard already
     use, so marking a step here moves the dashboard's numbers too.

     A page's progress key is not derivable from its path — system-design/cdn
     .html is sd/cdn, programming/javascript/dom.html is js/dom — so the
     generated site index carries the real one, and this maps href to it. */
  var topicByPath = null;

  function siteRoot() {
    /* the logo always points at the site root, at whatever depth this page is,
       which beats counting ../ segments ourselves and works over file:// */
    var logo = document.querySelector('.tb-logo');
    var href = logo ? logo.getAttribute('href') : 'index.html';
    return new URL(href.replace(/index\.html$/, ''), global.location.href).href;
  }

  function topicOf(href) {
    if (!href) return null;
    if (topicByPath === null) {
      topicByPath = {};
      (global.TF_SITE_INDEX || []).forEach(function (e) {
        if (e.path && e.topic) topicByPath[e.path] = e.topic;
      });
    }
    var abs, root = siteRoot();
    try { abs = new URL(href.split('#')[0], global.location.href).href; } catch (e) { return null; }
    if (abs.indexOf(root) !== 0) return null;
    return topicByPath[decodeURIComponent(abs.slice(root.length))] || null;
  }

  function progress() {
    return global.TFProgress || { all: function () { return []; },
      is: function () { return false; }, toggle: function () { return false; } };
  }

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

  /* One subnode. `status: "soon"` means the topic belongs on the roadmap but
     TechForge has not written it yet: it renders as a non-link so nobody is
     sent to a 404, tagged in text rather than dimmed — conveying state by
     lowering opacity has broken contrast here before. */
  /* Completion is stored per page, but a roadmap node is often a section of a
     page — the Databases roadmap points at twenty-nine parts of one sql.html.
     Ticking any of them ticked all of them, which looked like a bug and was
     really the data model showing through.

     So a checkbox appears once per page, on the node that owns it. Every other
     node linking into that page is a place to jump to, not a task to finish,
     and gets a marker saying so. The two share a column, so rows still line up
     and you can tell which is which without hovering. */
  function marker(node, label, owned) {
    if (node.status === 'soon' || !node.href) return '';

    var page = node.href.split('#')[0];
    var topic = topicOf(node.href);

    // a section of a page already accounted for, or a page we cannot track
    if (!topic || owned[page]) {
      return '<span class="rt-jump" aria-hidden="true"><i class="ti ti-chevron-right"></i></span>';
    }

    owned[page] = true;
    var done = progress().is(topic);
    return '<button type="button" class="rt-tick" data-topic="' + esc(topic) + '"' +
      ' aria-pressed="' + done + '"' +
      ' aria-label="Mark ' + esc(label) + ' as done">' +
      '<i class="ti ti-check" aria-hidden="true"></i></button>';
  }

  function ownsTick(node, owned) {
    return node.status !== 'soon' && node.href && topicOf(node.href) && !owned[node.href.split('#')[0]];
  }

  /* `order` is the position in the required sequence, or 0 for an optional
     branch. Once subnodes sit two-up the layout stops answering "which of
     these four do I do first" — reading down and reading across are equally
     plausible — so the sequence is stated rather than implied. Optional nodes
     are deliberately unnumbered: that is what makes them visibly not part of
     the run. */
  function subItem(k, order, owned) {
    var soon = k.status === 'soon';
    var label =
      (order ? '<span class="rt-ord" aria-hidden="true">' + order + '</span>' : '') +
      esc(k.t) +
      (soon ? '<span class="rt-tag">soon</span>' : '') +
      (k.tier === 'branch' ? '<span class="rt-tag">optional</span>' : '');

    /* A soon node may carry the href its page will eventually live at — the
       validator uses it to catch the reverse drift, once that page exists —
       so ignore href here and go by status alone. Some nodes are pure grouping
       labels ("Searching", "Sorting") with no page of their own and never
       will have: those render as a plain pill, not as coming-soon. */
    var pill;
    // only the node that owns the page carries the topic, so progress counts
    // each lesson once however many sections of it the roadmap lists
    var topic = ownsTick(k, owned) ? topicOf(k.href) : null;
    var mark = marker(k, k.t, owned);

    if (soon) {
      pill = '<span class="rt-pill-node rt-soon" aria-disabled="true">' + label + '</span>';
    } else if (!k.href) {
      pill = '<span class="rt-pill-node">' + label + '</span>';
    } else {
      pill = '<a class="rt-pill-node" href="' + esc(k.href) + '">' + label + '</a>';
    }
    return '<li' + (topic ? ' data-topic="' + esc(topic) + '"' : '') +
      (topic && progress().is(topic) ? ' class="rt-done"' : '') + '>' +
      mark + pill + '</li>';
  }

  /* Same rule for a step's own heading. A step can be coming-soon too — the
     whole of HTML and CSS is, today — and its href is then the path the page
     will live at, which would 404 if rendered as a link. */
  function title(step) {
    if (step.status === 'soon') {
      return '<span class="rt-title rt-soon-title" aria-disabled="true">' +
        esc(step.t) + '<span class="rt-tag">soon</span></span>';
    }
    return '<a class="rt-title" href="' + esc(step.href || '#') + '">' + esc(step.t) + '</a>';
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

    /* Which pages have already been given a checkbox in this roadmap. Steps are
       walked before their subnodes, so a step owns its page and the sections
       hanging off it become jump markers. */
    var owned = {};

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

      var stepTopic = ownsTick(step, owned) ? topicOf(step.href) : null;
      var stepMark = marker(step, step.t, owned);

      var li = document.createElement('li');
      li.className = 'rt-step' + (stepTopic && progress().is(stepTopic) ? ' rt-done' : '');
      if (stepTopic) li.dataset.topic = stepTopic;
      li.dataset.colour = colour;
      /* Kept on the element rather than read back out of .rt-title, whose text
         also carries the "soon" tag — an aria-label of "Step 1: HTMLsoon" is
         worse than no label. */
      li.dataset.title = step.t;

      var showBand = step.g && step.g !== lastBand;
      lastBand = step.g || lastBand;

      var seq = 0;
      var bullets = kids.map(function (k) {
        return subItem(k, k.tier === 'branch' ? 0 : ++seq, owned);
      }).join('');

      /* No fallback to the step number: the node on the spine already carries
         it, and a floating chip repeating it was the one element on the card
         that belonged to nothing. */
      var icon = step.i
        ? '<span class="rt-ico"><i class="ti ' + esc(step.i) + '" aria-hidden="true"></i></span>'
        : '';

      /* The toggle labels itself from the step title, so a screen reader hears
         "Collapse React" rather than twenty identical "Collapse" buttons. */
      var listId = 'rt-sub-' + i;
      var toggle = bullets
        ? '<button type="button" class="rt-toggle" aria-expanded="true"' +
            ' aria-controls="' + listId + '"' +
            ' aria-label="Collapse ' + esc(step.t) + '">' +
            '<i class="ti ti-chevron-down" aria-hidden="true"></i>' +
          '</button>'
        : '';

      li.innerHTML =
        '<div class="rt-card" style="--c:' + colour + '">' +
          '<div class="rt-body">' +
            (showBand ? '<div class="rt-band">' + esc(step.g) + '</div>' : '') +
            '<div class="rt-head-row">' + icon + stepMark + title(step) + toggle + '</div>' +
            (step.s ? '<p class="rt-desc">' + esc(step.s) + '</p>' : '') +
            (bullets
              ? '<div class="rt-wrap" data-open="true">' +
                  '<ul class="rt-list" id="' + listId + '">' + bullets + '</ul>' +
                '</div>'
              : '') +
          '</div>' +
        '</div>' +
        '<div class="rt-node" style="--c:' + colour + '">' +
          (i + 1 < 10 ? '0' : '') + (i + 1) +
        '</div>';

      list.appendChild(li);
    });

    road.appendChild(list);

    var summary = document.createElement('div');
    summary.className = 'rt-progress';
    /* polite, not assertive: the count updating is worth hearing after the
       button's own state change, not on top of it */
    summary.setAttribute('aria-live', 'polite');
    mount.appendChild(summary);
    mount.appendChild(road);

    return {
      road: road, fill: fill, summary: summary,
      steps: Array.prototype.slice.call(list.children),
    };
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

    /* ── progress ──────────────────────────────────────────────────────
       The spine fill is how far along the path you are, not how far you have
       scrolled. Scroll position is already shown by the active node and the
       step pill; spending the most prominent element in the layout on it too
       was what made this read as a document rather than a route. */
    /* the rows, not the tick buttons — those carry data-topic too, and matching
       both counted every topic twice */
    var trackable = view.road.querySelectorAll('li.rt-step[data-topic], .rt-list li[data-topic]');

    function paintProgress() {
      var done = 0;
      Array.prototype.forEach.call(trackable, function (el) {
        var is = progress().is(el.dataset.topic);
        el.classList.toggle('rt-done', is);
        var btn = el.querySelector(':scope > .rt-tick, :scope .rt-head-row > .rt-tick');
        if (btn) btn.setAttribute('aria-pressed', String(is));
        if (is) done++;
      });
      var total = trackable.length;
      var pct = total ? Math.round((done / total) * 100) : 0;
      view.summary.innerHTML = total
        ? '<div class="rt-pbar"><div class="rt-pbar-fill" style="transform:scaleX(' + (done / total) + ')"></div></div>' +
          '<span class="rt-pnum"><strong>' + done + '</strong> of ' + total + ' done · ' + pct + '%</span>'
        : '';
      view.fill.style.transform = 'translateX(-50%) scaleY(' + (total ? done / total : 0) + ')';
    }

    view.road.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.rt-tick');
      if (!btn) return;
      progress().toggle(btn.dataset.topic);
      paintProgress();
    });

    /* another tab ticking something off, or a lesson page being finished in
       one, should not leave this roadmap showing stale numbers */
    global.addEventListener('storage', function (e) {
      if (!e.key || e.key === 'tf_completed_topics') paintProgress();
    });

    paintProgress();

    /* Disclosure toggles, delegated — one listener beats fifty. Everything
       starts expanded: a roadmap that opens collapsed reads as a file tree,
       which is what was rejected the first time round. */
    view.road.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.rt-toggle');
      if (!btn) return;
      var wrap = document.getElementById(btn.getAttribute('aria-controls'));
      wrap = wrap && wrap.parentNode;
      if (!wrap) return;
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      wrap.dataset.open = String(open);
      var step = btn.closest('.rt-step');
      btn.setAttribute('aria-label', (open ? 'Collapse ' : 'Expand ') + (step ? step.dataset.title : ''));
      onScroll();   // the spine fill is a function of height, which just changed
    });

    /* mini-map: real buttons in a nav, so it is reachable by keyboard and
       announced as navigation rather than as decoration */
    var map = document.createElement('nav');
    map.className = 'rt-map';
    map.setAttribute('aria-label', 'Roadmap steps');
    var dots = steps.map(function (step, i) {
      var title = step.dataset.title || ('Step ' + (i + 1));
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
