/* TechForge — the Learn by Role hub.
 *
 * Progress comes from the same tf_completed_topics the lesson pages and the
 * roadmap ticks write, via window.TFProgress, so ticking a lesson anywhere
 * moves every role that includes it. The per-role topic lists are baked into
 * #rolesData at build time — a page that must open from file:// cannot go and
 * read twenty roadmap files at runtime.
 *
 * Classic script, not a module: ES modules are blocked over file:// (origin
 * null), which these pages have to support.
 */
(function (global) {
  'use strict';

  var roles = [];
  var labels = [];
  var byId = {};

  function progress() {
    return global.TFProgress || { all: function () { return []; }, is: function () { return false; } };
  }

  function doneCount(role) {
    var done = 0;
    for (var i = 0; i < role.topics.length; i++) {
      if (progress().is(role.topics[i])) done++;
    }
    return done;
  }

  /* ── progress line on each card ─────────────────────────────────── */
  function paint() {
    roles.forEach(function (role) {
      var el = document.querySelector('[data-progress-for="' + role.id + '"]');
      if (!el) return;
      var total = role.topics.length;
      if (!total) { el.textContent = ''; return; }

      var done = doneCount(role);
      var pct = Math.round((done / total) * 100);
      role.pct = pct;

      el.innerHTML =
        '<span class="rl-bar"><span class="rl-bar-fill" style="transform:scaleX(' + (done / total) + ')"></span></span>' +
        '<span class="rl-num"><strong>' + done + '</strong> of ' + total + ' done · ' + pct + '%</span>';
      el.parentNode.classList.toggle('rl-started', done > 0);
    });
  }

  /* ── expand / collapse ──────────────────────────────────────────── */
  function wireToggles() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('.rl-toggle');
      if (!btn) return;
      var body = document.getElementById(btn.getAttribute('aria-controls'));
      var wrap = body && body.parentNode;
      if (!wrap) return;
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      wrap.dataset.open = String(open);
    });
  }

  /* ── filter and sort ────────────────────────────────────────────── */
  function wireControls() {
    var chips = Array.prototype.slice.call(document.querySelectorAll('.rl-chip'));
    var sections = Array.prototype.slice.call(document.querySelectorAll('[data-group-section]'));
    var sortEl = document.getElementById('rlSort');

    function applyFilter(group) {
      chips.forEach(function (c) {
        var on = c.dataset.filter === group;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', String(on));
      });
      sections.forEach(function (s) {
        s.hidden = !(group === 'all' || s.dataset.groupSection === group);
      });
    }

    chips.forEach(function (c) {
      c.addEventListener('click', function () { applyFilter(c.dataset.filter); });
    });

    /* Sorting rearranges cards across groups, so the group headings stop being
       true. Collapse into one list while a sort is active, and restore the
       grouping when the user picks "Grouped" again. */
    var sorted = document.createElement('div');
    sorted.className = 'rl-grid rl-sorted';
    sorted.hidden = true;
    var host = document.createElement('section');
    host.className = 'rd-section';
    host.appendChild(sorted);
    if (sections.length) sections[sections.length - 1].parentNode.insertBefore(host, sections[0]);

    function applySort(mode) {
      if (mode === 'default') {
        // put every card back where it came from
        roles.forEach(function (r) {
          var card = byId[r.id].card;
          byId[r.id].home.appendChild(card);
        });
        sorted.hidden = true;
        sections.forEach(function (s) { s.hidden = false; });
        applyFilter('all');
        return;
      }

      var list = roles.slice();
      if (mode === 'progress') list.sort(function (a, b) { return (b.pct || 0) - (a.pct || 0); });
      else if (mode === 'written') list.sort(function (a, b) { return b.topics.length - a.topics.length; });
      else if (mode === 'az') list.sort(function (a, b) { return a.name.localeCompare(b.name); });

      list.forEach(function (r) { sorted.appendChild(byId[r.id].card); });
      sections.forEach(function (s) { s.hidden = true; });
      sorted.hidden = false;
    }

    if (sortEl) sortEl.addEventListener('change', function () { applySort(sortEl.value); });
  }

  /* ── comparison ─────────────────────────────────────────────────── */
  function wireCompare() {
    var a = document.getElementById('rlA');
    var b = document.getElementById('rlB');
    var out = document.getElementById('rlCompareOut');
    if (!a || !b || !out) return;

    var options = roles.map(function (r) {
      return '<option value="' + r.id + '">' + r.name + '</option>';
    }).join('');
    a.innerHTML = options;
    b.innerHTML = options;
    if (roles.length > 1) b.selectedIndex = 1;

    function label(list) {
      if (!list.length) return '';
      var shown = list.slice(0, 12).map(function (i) {
        return '<li>' + (labels[i] || '') + '</li>';
      }).join('');
      var more = list.length > 12 ? '<li class="rl-more">+' + (list.length - 12) + ' more</li>' : '';
      return '<ul class="rl-cmp-list">' + shown + more + '</ul>';
    }

    function render() {
      var ra = byId[a.value] && byId[a.value].role;
      var rb = byId[b.value] && byId[b.value].role;
      if (!ra || !rb) { out.innerHTML = ''; return; }
      if (ra === rb) {
        out.innerHTML = '<p class="rl-cmp-note">Pick two different roles.</p>';
        return;
      }

      /* covers, not topics: topics only holds lessons that exist, and comparing
         on those reported Data Engineer as having one topic Backend lacks —
         because Spark, Airflow and warehouses are all still unwritten. A
         comparison has to weigh the whole field or it misleads. */
      var setB = {};
      rb.covers.forEach(function (t) { setB[t] = true; });
      var setA = {};
      ra.covers.forEach(function (t) { setA[t] = true; });
      var shared = ra.covers.filter(function (t) { return setB[t]; });
      var onlyA = ra.covers.filter(function (t) { return !setB[t]; });
      var onlyB = rb.covers.filter(function (t) { return !setA[t]; });

      var union = shared.length + onlyA.length + onlyB.length;
      var pct = union ? Math.round((shared.length / union) * 100) : 0;

      out.innerHTML =
        '<p class="rl-cmp-head"><strong>' + pct + '%</strong> of the two roads are the same road — ' +
        shared.length + ' shared topics.</p>' +
        '<div class="rl-cmp-cols">' +
          '<div><span class="rl-label">Shared (' + shared.length + ')</span>' + label(shared) + '</div>' +
          '<div><span class="rl-label">Only ' + ra.name + ' (' + onlyA.length + ')</span>' + label(onlyA) + '</div>' +
          '<div><span class="rl-label">Only ' + rb.name + ' (' + onlyB.length + ')</span>' + label(onlyB) + '</div>' +
        '</div>';
    }

    a.addEventListener('change', render);
    b.addEventListener('change', render);
    render();
  }

  function init() {
    var dataEl = document.getElementById('rolesData');
    if (!dataEl) return;
    var parsed;
    try { parsed = JSON.parse(dataEl.textContent); } catch (err) { return; }
    labels = parsed.labels || [];
    roles = parsed.roles || [];

    roles.forEach(function (r) {
      var card = document.querySelector('.rl-card[data-role="' + r.id + '"]');
      if (card) byId[r.id] = { role: r, card: card, home: card.parentNode };
    });

    paint();
    wireToggles();
    wireControls();
    wireCompare();

    /* another tab finishing a lesson should not leave these numbers stale */
    global.addEventListener('storage', function (e) {
      if (!e.key || e.key === 'tf_completed_topics') paint();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}(typeof window !== 'undefined' ? window : globalThis));
