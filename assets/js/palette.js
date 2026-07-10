/* TechForge — command palette (Ctrl/Cmd+K).
 * Self-contained: injects its own DOM + styles, lazy-loads the topic
 * manifest if the page didn't include it. Fuzzy search over all topics. */
(function () {
  'use strict';

  var open = false, sel = 0, results = [], root, input, list;

  function ensureIndex(cb) {
    if (window.TF_TOPIC_INDEX) return cb();
    var s = document.createElement('script');
    s.src = '/assets/js/topics-manifest.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  /* subsequence fuzzy score — higher is better, -1 = no match */
  function score(q, str) {
    str = str.toLowerCase();
    var idx = str.indexOf(q);
    if (idx === 0) return 100 - str.length * 0.1;   // prefix match
    if (idx > 0) return 60 - idx * 0.5;             // substring match
    var qi = 0, pts = 0, last = -2;
    for (var i = 0; i < str.length && qi < q.length; i++) {
      if (str[i] === q[qi]) { pts += (i === last + 1) ? 3 : 1; last = i; qi++; }
    }
    return qi === q.length ? pts : -1;              // subsequence match
  }

  function search(q) {
    q = q.trim().toLowerCase();
    var items = (window.TF_TOPIC_INDEX || []).concat([{
      title: 'My Progress', section: 'Dashboard', href: 'dashboard.html',
      icon: '<i class="ti ti-chart-donut"></i>',
      desc: 'Completion, bookmarks, and solved problems across all tracks'
    }]);
    if (!q) return items.slice(0, 9);
    return items
      .map(function (t) {
        var s = Math.max(
          score(q, t.title) * 2,
          score(q, t.section),
          score(q, t.desc || '') * 0.5
        );
        return { t: t, s: s };
      })
      .filter(function (x) { return x.s > 0; })
      .sort(function (a, b) { return b.s - a.s; })
      .slice(0, 9)
      .map(function (x) { return x.t; });
  }

  function iconOf(t) {
    // manifest icons may be emoji or tabler <i> markup — both render fine
    return t.icon || '&#9673;';
  }

  function render() {
    var q = input.value;
    results = search(q);
    sel = Math.min(sel, Math.max(0, results.length - 1));
    list.innerHTML = results.length
      ? results.map(function (t, i) {
          return '<div class="tfp-item' + (i === sel ? ' sel' : '') + '" data-i="' + i + '">' +
            '<span class="tfp-ico">' + iconOf(t) + '</span>' +
            '<span class="tfp-body"><span class="tfp-title">' + t.title + '</span>' +
            '<span class="tfp-desc">' + (t.desc || '') + '</span></span>' +
            '<span class="tfp-sec">' + t.section + '</span></div>';
        }).join('')
      : '<div class="tfp-empty">No topics match &ldquo;' + q.replace(/</g, '&lt;') + '&rdquo;</div>';
  }

  function go(i) {
    var t = results[i];
    if (t) window.location.href = '/' + t.href;
  }

  function show() {
    ensureIndex(function () {
      if (!root) build();
      open = true;
      root.style.display = 'flex';
      input.value = ''; sel = 0;
      render();
      requestAnimationFrame(function () { input.focus(); });
    });
  }

  function hide() {
    open = false;
    if (root) root.style.display = 'none';
  }

  function build() {
    var st = document.createElement('style');
    st.textContent =
      '.tfp-overlay{position:fixed;inset:0;z-index:9999;display:none;align-items:flex-start;justify-content:center;padding:12vh 16px 0;background:rgba(0,0,0,.55);backdrop-filter:blur(3px)}' +
      '.tfp-box{width:100%;max-width:560px;background:var(--bg2,#0d1117);border:1px solid var(--border,#1f2d42);border-radius:14px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,.5)}' +
      '.tfp-input{width:100%;border:none;outline:none;background:transparent;color:var(--text,#e2e8f4);font-size:15px;padding:16px 18px;border-bottom:1px solid var(--border,#1f2d42);font-family:inherit}' +
      '.tfp-list{max-height:52vh;overflow-y:auto;padding:6px}' +
      '.tfp-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:9px;cursor:pointer}' +
      '.tfp-item.sel{background:var(--surface,#141b26)}' +
      '.tfp-ico{width:22px;text-align:center;flex-shrink:0;color:var(--accent,#4d9ef7)}' +
      '.tfp-body{display:flex;flex-direction:column;min-width:0;flex:1}' +
      '.tfp-title{color:var(--text,#e2e8f4);font-size:13.5px;font-weight:600}' +
      '.tfp-desc{color:var(--text3,#5a7094);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.tfp-sec{font-family:var(--mono,monospace);font-size:9.5px;text-transform:uppercase;letter-spacing:1px;color:var(--text3,#5a7094);background:var(--surface,#141b26);border:1px solid var(--border,#1f2d42);padding:3px 8px;border-radius:99px;flex-shrink:0}' +
      '.tfp-empty{padding:22px;text-align:center;color:var(--text3,#5a7094);font-size:13px}' +
      '.tfp-hint{display:flex;gap:14px;padding:9px 16px;border-top:1px solid var(--border,#1f2d42);color:var(--text3,#5a7094);font-size:10.5px;font-family:var(--mono,monospace)}';
    document.head.appendChild(st);

    root = document.createElement('div');
    root.className = 'tfp-overlay';
    root.innerHTML =
      '<div class="tfp-box" role="dialog" aria-label="Search topics">' +
      '<input class="tfp-input" placeholder="Search 120+ topics&hellip;" aria-label="Search"/>' +
      '<div class="tfp-list"></div>' +
      '<div class="tfp-hint"><span>&#8593;&#8595; navigate</span><span>&#8629; open</span><span>esc close</span></div>' +
      '</div>';
    document.body.appendChild(root);
    input = root.querySelector('.tfp-input');
    list = root.querySelector('.tfp-list');

    input.addEventListener('input', function () { sel = 0; render(); });
    root.addEventListener('mousedown', function (e) { if (e.target === root) hide(); });
    list.addEventListener('click', function (e) {
      var it = e.target.closest('.tfp-item');
      if (it) go(parseInt(it.dataset.i, 10));
    });
    list.addEventListener('mousemove', function (e) {
      var it = e.target.closest('.tfp-item');
      if (it && parseInt(it.dataset.i, 10) !== sel) { sel = parseInt(it.dataset.i, 10); render(); }
    });
  }

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      open ? hide() : show();
      return;
    }
    if (!open) return;
    if (e.key === 'Escape') { hide(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, results.length - 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); render(); }
    else if (e.key === 'Enter') { e.preventDefault(); go(sel); }
  });
})();
