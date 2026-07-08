/**
 * TechForge global search — Cmd+K / Ctrl+K modal.
 * Uses window.TF_SITE_INDEX (assets/js/site-index.js). Self-contained:
 * injects its own styles, topbar trigger and modal DOM. No dependencies.
 */
(function () {
  'use strict';

  var RECENT_KEY = 'tf-search-recent';
  var MAX_RESULTS = 12;
  var open = false;
  var results = [];
  var active = 0;
  var els = {};

  /* ── styles ── */
  var css = [
    '.tfs-trigger{display:flex;align-items:center;gap:8px;margin-left:auto;margin-right:6px;padding:6px 10px;background:var(--card,#0d1420);border:1px solid var(--border,#1f2d42);border-radius:9px;color:var(--dim,#8b98ab);font:inherit;font-size:13px;cursor:pointer;transition:border-color .15s ease,color .15s ease;}',
    '.tfs-trigger:hover{border-color:var(--blue,#4d9ef7);color:var(--text,#e6edf3);}',
    '.tfs-trigger .ti{font-size:15px;}',
    '.tfs-trigger kbd{font-family:var(--font-mono,monospace);font-size:10.5px;padding:2px 5px;border:1px solid var(--border,#1f2d42);border-radius:5px;background:var(--bg2,#0d1117);color:var(--dim,#8b98ab);}',
    '@media(max-width:760px){.tfs-trigger span,.tfs-trigger kbd{display:none;}.tfs-trigger{padding:6px 8px;}}',
    '.tfs-backdrop{position:fixed;inset:0;z-index:400;background:rgba(2,4,10,.62);backdrop-filter:blur(3px);opacity:0;pointer-events:none;transition:opacity .14s ease;}',
    '.tfs-backdrop.on{opacity:1;pointer-events:auto;}',
    '.tfs-panel{position:fixed;z-index:401;top:11vh;left:50%;transform:translateX(-50%) scale(.98);width:min(620px,calc(100vw - 32px));max-height:70vh;display:none;flex-direction:column;background:var(--bg2,#0d1117);border:1px solid var(--border2,var(--border,#1f2d42));border-radius:14px;box-shadow:0 24px 80px rgba(0,0,0,.55),0 0 0 1px rgba(77,158,247,.06);overflow:hidden;opacity:0;transition:opacity .14s ease,transform .14s ease;}',
    '.tfs-panel.on{display:flex;opacity:1;transform:translateX(-50%) scale(1);}',
    '.tfs-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--border,#1f2d42);}',
    '.tfs-head .ti{font-size:17px;color:var(--blue,#4d9ef7);}',
    '.tfs-input{flex:1;background:none;border:none;outline:none;color:var(--text,#e6edf3);font:inherit;font-size:15px;}',
    '.tfs-input::placeholder{color:var(--dim,#8b98ab);}',
    '.tfs-esc{font-family:var(--font-mono,monospace);font-size:10.5px;padding:3px 6px;border:1px solid var(--border,#1f2d42);border-radius:5px;color:var(--dim,#8b98ab);background:var(--bg,#05070a);}',
    '.tfs-list{overflow-y:auto;padding:6px;flex:1;}',
    '.tfs-group{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--dim,#8b98ab);padding:10px 12px 4px;}',
    '.tfs-item{display:flex;align-items:center;gap:11px;padding:9px 12px;border-radius:9px;cursor:pointer;text-decoration:none;}',
    '.tfs-item .ti{font-size:16px;color:var(--dim,#8b98ab);flex-shrink:0;width:20px;text-align:center;}',
    '.tfs-item-body{min-width:0;flex:1;}',
    '.tfs-item-title{font-size:13.5px;font-weight:600;color:var(--text,#e6edf3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.tfs-item-title mark{background:none;color:var(--blue,#4d9ef7);}',
    '.tfs-item-desc{font-size:11.5px;color:var(--dim,#8b98ab);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;}',
    '.tfs-item-sec{font-size:10px;font-weight:700;letter-spacing:.05em;color:var(--dim,#8b98ab);border:1px solid var(--border,#1f2d42);border-radius:5px;padding:2px 6px;flex-shrink:0;}',
    '.tfs-item.sel{background:var(--card,#0d1420);box-shadow:inset 2px 0 0 var(--blue,#4d9ef7);}',
    '.tfs-item.sel .ti,.tfs-item.sel .tfs-item-sec{color:var(--blue,#4d9ef7);}',
    '.tfs-empty{padding:34px 16px;text-align:center;color:var(--dim,#8b98ab);font-size:13.5px;}',
    '.tfs-foot{display:flex;gap:14px;padding:9px 16px;border-top:1px solid var(--border,#1f2d42);font-size:11px;color:var(--dim,#8b98ab);}',
    '.tfs-foot kbd{font-family:var(--font-mono,monospace);font-size:10px;padding:1.5px 4.5px;border:1px solid var(--border,#1f2d42);border-radius:4px;background:var(--bg,#05070a);margin-right:4px;}'
  ].join('\n');

  /* ── helpers ── */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function recent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch (e) { return []; }
  }

  function pushRecent(id) {
    try {
      var r = recent().filter(function (x) { return x !== id; });
      r.unshift(id);
      localStorage.setItem(RECENT_KEY, JSON.stringify(r.slice(0, 8)));
    } catch (e) { /* private mode */ }
  }

  /* score: 0 = no match. Higher = better. */
  function score(entry, q) {
    var t = entry.title.toLowerCase();
    var d = (entry.desc || '').toLowerCase();
    var s = (entry.section || '').toLowerCase();
    if (t === q) return 100;
    if (t.indexOf(q) === 0) return 80;
    var wb = t.search(new RegExp('(^|[\\s/—-])' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    if (wb >= 0) return 60;
    if (t.indexOf(q) >= 0) return 45;
    if (s.indexOf(q) === 0) return 30;
    if (d.indexOf(q) >= 0) return 20;
    /* subsequence fuzzy on title */
    var i = 0;
    for (var j = 0; j < t.length && i < q.length; j++) if (t[j] === q[i]) i++;
    if (i === q.length) return 8;
    return 0;
  }

  function highlight(title, q) {
    var i = title.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0 || !q) return esc(title);
    return esc(title.slice(0, i)) + '<mark>' + esc(title.slice(i, i + q.length)) + '</mark>' + esc(title.slice(i + q.length));
  }

  function iconHtml(entry) {
    /* index icons are pre-built "<i class='ti ti-x'></i>" strings; extract class safely */
    var m = /class=['"]([a-z0-9 -]+)['"]/i.exec(entry.icon || '');
    return '<i class="' + (m ? esc(m[1]) : 'ti ti-file-text') + '"></i>';
  }

  /* ── search ── */
  function query(q) {
    var idx = window.TF_SITE_INDEX || [];
    q = q.trim().toLowerCase();
    if (!q) {
      var ids = recent();
      var byId = {};
      idx.forEach(function (e) { byId[e.id] = e; });
      var r = ids.map(function (id) { return byId[id]; }).filter(Boolean);
      return { list: r.slice(0, 8), label: r.length ? 'Recent' : null };
    }
    var scored = [];
    idx.forEach(function (e) {
      var sc = score(e, q);
      if (sc > 0) scored.push([sc, e]);
    });
    scored.sort(function (a, b) { return b[0] - a[0] || a[1].title.localeCompare(b[1].title); });
    return { list: scored.slice(0, MAX_RESULTS).map(function (x) { return x[1]; }), label: null };
  }

  /* ── render ── */
  function render(q) {
    var out = query(q);
    results = out.list;
    active = 0;
    if (!results.length) {
      els.list.innerHTML = q.trim()
        ? '<div class="tfs-empty">No results for &ldquo;' + esc(q.trim()) + '&rdquo;</div>'
        : '<div class="tfs-empty">Type to search ' + (window.TF_SITE_INDEX || []).length + ' pages&hellip;</div>';
      return;
    }
    var html = '';
    var lastSec = null;
    results.forEach(function (e, i) {
      var sec = out.label || e.section || '';
      if (sec !== lastSec) { html += '<div class="tfs-group">' + esc(sec) + '</div>'; lastSec = sec; }
      html += '<a class="tfs-item' + (i === active ? ' sel' : '') + '" data-i="' + i + '" href="/' + esc(e.href) + '">' +
        iconHtml(e) +
        '<div class="tfs-item-body"><div class="tfs-item-title">' + highlight(e.title, q.trim()) + '</div>' +
        '<div class="tfs-item-desc">' + esc(e.desc || '') + '</div></div>' +
        '<span class="tfs-item-sec">' + esc(e.section || '') + '</span></a>';
    });
    els.list.innerHTML = html;
  }

  function setActive(i) {
    if (!results.length) return;
    active = (i + results.length) % results.length;
    var nodes = els.list.querySelectorAll('.tfs-item');
    nodes.forEach(function (n, j) { n.classList.toggle('sel', j === active); });
    var sel = nodes[active];
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  function go(i) {
    var e = results[i];
    if (!e) return;
    pushRecent(e.id);
    window.location.href = '/' + e.href;
  }

  /* ── open/close ── */
  function show() {
    if (open) return;
    open = true;
    els.backdrop.classList.add('on');
    els.panel.classList.add('on');
    els.input.value = '';
    render('');
    setTimeout(function () { els.input.focus(); }, 30);
  }

  function hide() {
    if (!open) return;
    open = false;
    els.backdrop.classList.remove('on');
    els.panel.classList.remove('on');
    els.input.blur();
  }

  /* ── build DOM ── */
  function build() {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    els.backdrop = document.createElement('div');
    els.backdrop.className = 'tfs-backdrop';
    els.backdrop.addEventListener('click', hide);

    els.panel = document.createElement('div');
    els.panel.className = 'tfs-panel';
    els.panel.setAttribute('role', 'dialog');
    els.panel.setAttribute('aria-label', 'Site search');
    els.panel.innerHTML =
      '<div class="tfs-head"><i class="ti ti-search"></i>' +
      '<input class="tfs-input" type="text" placeholder="Search topics, guides, interview prep&hellip;" aria-label="Search site" autocomplete="off" spellcheck="false"/>' +
      '<span class="tfs-esc">esc</span></div>' +
      '<div class="tfs-list" role="listbox"></div>' +
      '<div class="tfs-foot"><span><kbd>&uarr;</kbd><kbd>&darr;</kbd> navigate</span><span><kbd>&crarr;</kbd> open</span><span><kbd>esc</kbd> close</span></div>';

    document.body.appendChild(els.backdrop);
    document.body.appendChild(els.panel);
    els.input = els.panel.querySelector('.tfs-input');
    els.list = els.panel.querySelector('.tfs-list');

    els.input.addEventListener('input', function () { render(els.input.value); });
    els.list.addEventListener('click', function (ev) {
      var a = ev.target.closest('.tfs-item');
      if (!a) return;
      ev.preventDefault();
      go(parseInt(a.dataset.i, 10));
    });
    els.list.addEventListener('mousemove', function (ev) {
      var a = ev.target.closest('.tfs-item');
      if (a) setActive(parseInt(a.dataset.i, 10));
    });

    /* topbar trigger */
    var topbar = document.querySelector('header.topbar');
    if (topbar) {
      var btn = document.createElement('button');
      btn.className = 'tfs-trigger';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Search (Ctrl+K)');
      var mac = /Mac|iPhone|iPad/.test(navigator.platform || '');
      btn.innerHTML = '<i class="ti ti-search"></i><span>Search</span><kbd>' + (mac ? '⌘' : 'Ctrl') + ' K</kbd>';
      btn.addEventListener('click', show);
      var nav = topbar.querySelector('.tb-nav');
      if (nav) topbar.insertBefore(btn, nav); else topbar.appendChild(btn);
    }
  }

  /* ── keys ── */
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      open ? hide() : show();
      return;
    }
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); hide(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); go(active); }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
