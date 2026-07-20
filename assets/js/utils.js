// TechForge — shared utilities (DSA / interview / aiml pages)
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Delay (ms) from #sorting-spd range input (bubble sort). */
function getSpd() {
  const el = document.getElementById('sorting-spd');
  if (!el) return 400;
  return Math.max(30, 1050 - parseInt(el.value, 10));
}

function setStatus(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

/* ---- Shared DSA sorting canvas renderer ----------------------------------
 * Draws a bar chart on a <canvas>. Each sorting page keeps its own algorithm
 * and per-bar state logic; it just passes a stateOf(i) callback returning one
 * of the keys below. Crisp on HiDPI; retries via rAF if laid out at 0 width
 * (e.g. drawn before layout / on a just-shown tab).                          */
const TF_BAR_COLORS = {
  def:  '#33415c', // unsorted / default
  cmp:  '#f97316', // comparison (orange)
  swap: '#f87171', // swap (red)
  srt:  '#22c55e', // sorted (green)
  piv:  '#a78bfa', // pivot (purple)
  hl:   '#facc15', // scan / highlight (amber)
  mrg:  '#4d9ef7'  // active sub-range (blue)
};

function tfDrawBars(canvasId, arr, max, stateOf, _retry) {
  const cv = document.getElementById(canvasId);
  if (!cv || !arr || !arr.length) return;
  // Width may be 0 if drawn before layout or on a just-shown tab — retry a few
  // frames, then fall back to the parent's width (and finally a sane default).
  let w = cv.offsetWidth;
  if (!w && (_retry || 0) < 5) {
    requestAnimationFrame(() => tfDrawBars(canvasId, arr, max, stateOf, (_retry || 0) + 1));
    return;
  }
  if (!w) w = (cv.parentElement && cv.parentElement.clientWidth) || 700;

  const dpr = window.devicePixelRatio || 1;
  const H = cv.clientHeight || 200;
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(H * dpr);
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, H);

  const n = arr.length;
  const gap = n > 30 ? 1 : 4;
  const bw = (w - gap * (n + 1)) / n;
  const topPad = 18, botPad = 6;
  const usableH = H - topPad - botPad;
  const mono = (getComputedStyle(document.body).getPropertyValue('--font-mono') || 'monospace').trim();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '10px ' + mono;

  for (let i = 0; i < n; i++) {
    const st = (stateOf ? stateOf(i) : 'def') || 'def';
    const col = TF_BAR_COLORS[st] || TF_BAR_COLORS.def;
    const h = Math.max(6, Math.round((arr[i] / max) * usableH));
    const x = gap + i * (bw + gap);
    const y = H - botPad - h;
    const r = Math.min(3, bw / 2);
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.arcTo(x + bw, y, x + bw, y + r, r);
    ctx.lineTo(x + bw, H - botPad);
    ctx.lineTo(x, H - botPad);
    ctx.closePath();
    ctx.fill();
    if (bw >= 14) {
      ctx.fillStyle = st === 'def' ? '#8aa0c0' : col;
      ctx.fillText(arr[i], x + bw / 2, y - 5);
    }
  }
}

/* ---- Language toggle (Python / JavaScript / Java) -------------------------
 * Pages opt in with a .lang-toggle button bar + .lang-pane[data-lang] blocks.
 * Choice persists in localStorage('tf-lang') across pages.                  */
function tfLangSwitch(lang) {
  if (!document.querySelector('.lang-pane[data-lang="' + lang + '"]')) lang = 'python';
  document.querySelectorAll('.lt-btn').forEach(function (b) {
    b.classList.toggle('active', b.dataset.lang === lang);
    b.setAttribute('aria-selected', b.dataset.lang === lang ? 'true' : 'false');
  });
  document.querySelectorAll('.lang-pane').forEach(function (p) {
    p.style.display = p.dataset.lang === lang ? '' : 'none';
  });
  try { localStorage.setItem('tf-lang', lang); } catch (e) {}
}

document.addEventListener('DOMContentLoaded', function () {
  if (!document.querySelector('.lang-toggle')) return;
  var st = document.createElement('style');
  st.textContent =
    '.lang-toggle{display:inline-flex;gap:2px;background:var(--surface,rgba(0,0,0,.25));border:1px solid var(--border);border-radius:10px;padding:3px;margin-bottom:12px}' +
    '.lt-btn{border:none;background:transparent;color:var(--text2);font-family:var(--mono,monospace);font-size:11px;font-weight:600;padding:6px 14px;border-radius:7px;cursor:pointer;transition:all .15s}' +
    '.lt-btn:hover{color:var(--text)}' +
    '.lt-btn.active{background:var(--accent-dim,rgba(77,158,247,.15));color:var(--accent,var(--blue))}' +
    '@media (max-width:640px){.lt-btn{min-height:38px;padding:9px 14px}}';
  document.head.appendChild(st);
  /* Wire up proper ARIA tabs relationships: .lang-toggle already has
   * role="tablist" in markup, but the buttons/panes never got role="tab" /
   * role="tabpanel", which makes the aria-selected set below invalid ARIA.
   * Only one .lang-toggle group exists per page, so data-lang is a safe
   * unique id suffix here. */
  document.querySelectorAll('.lt-btn').forEach(function (b) {
    var tabId = 'lt-tab-' + b.dataset.lang;
    var panelId = 'lt-panel-' + b.dataset.lang;
    b.id = tabId;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', panelId);
    var pane = document.querySelector('.lang-pane[data-lang="' + b.dataset.lang + '"]');
    if (pane) {
      pane.id = panelId;
      pane.setAttribute('role', 'tabpanel');
      pane.setAttribute('aria-labelledby', tabId);
      pane.setAttribute('tabindex', '0');
    }
    b.addEventListener('click', function () { tfLangSwitch(b.dataset.lang); });
  });
  var lang = 'python';
  try { lang = localStorage.getItem('tf-lang') || 'python'; } catch (e) {}
  tfLangSwitch(lang);
});

function switchTab(el, paneId) {
  const sec = el.closest('.info-section');
  sec.querySelectorAll('.info-tab').forEach(t => t.classList.remove('active'));
  sec.querySelectorAll('.info-pane').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  const pane = document.getElementById(paneId);
  if (pane) pane.classList.add('active');
}

function quizAnswer(el, correct) {
  el.closest('.quiz-opts').querySelectorAll('.quiz-opt').forEach(o => o.style.pointerEvents = 'none');
  el.classList.add(correct ? 'correct' : 'wrong');
  const fb = el.closest('.quiz-wrap').querySelector('.quiz-feedback');
  if (fb) {
    fb.style.display = 'block';
    fb.innerHTML = correct
      ? '<span style="color:var(--green)">&#10003; Correct!</span>'
      : '<span style="color:var(--red)">&#10007; Not quite. Review the explanation above.</span>';
    fb.style.background = correct ? 'rgba(0,229,160,.08)' : 'rgba(255,77,106,.06)';
    fb.style.border = correct ? '1px solid rgba(0,229,160,.2)' : '1px solid rgba(255,77,106,.2)';
  }
}

function filterQ(btn, type, pid) {
  btn.closest('.practice-filters').querySelectorAll('.pf-btn')
    .forEach(b => b.classList.remove('active', 'pbc-active', 'startup-active'));
  btn.classList.add(type === 'all' ? 'active' : type + '-active');
  let vis = 0;
  document.querySelectorAll('#pql-' + pid + ' .pq-item').forEach(it => {
    const show = type === 'all' || it.dataset.type === type;
    it.style.display = show ? '' : 'none';
    if (show) vis++;
  });
  const emp = document.getElementById('pqe-' + pid);
  if (emp) emp.style.display = vis === 0 ? 'block' : 'none';
}

function toggleDone(e, id, pid) {
  e.stopPropagation();
  const key = 'dsa_done_' + pid;
  const done = JSON.parse(localStorage.getItem(key) || '[]');
  const i = done.indexOf(id);
  if (i >= 0) done.splice(i, 1); else done.push(id);
  localStorage.setItem(key, JSON.stringify(done));
  refreshProg(pid);
}

function openQ(e, url) {
  if (e.target.classList.contains('pq-done-toggle')) return;
  window.open(url, '_blank');
}

function refreshProg(pid) {
  const done = JSON.parse(localStorage.getItem('dsa_done_' + pid) || '[]');
  const items = document.querySelectorAll('#pql-' + pid + ' .pq-item');
  let count = 0;
  const total = items.length;
  items.forEach(it => {
    const id = parseInt(it.dataset.id);
    const isDone = done.includes(id);
    it.classList.toggle('completed', isDone);
    const btn = it.querySelector('.pq-done-toggle');
    if (btn) {
      btn.classList.toggle('done', isDone);
      btn.textContent = isDone ? '\u2713' : '';
    }
    if (isDone) count++;
  });
  const prog = document.getElementById('prog-' + pid);
  const bar = document.getElementById('bar-' + pid);
  if (prog) prog.textContent = count + ' / ' + total + ' solved';
  if (bar) bar.style.width = (total > 0 ? Math.round(count / total * 100) : 0) + '%';
}

function tfMobileLayout() {
  return window.matchMedia('(max-width: 900px)').matches;
}

function tfCloseNavMenu() {
  const nav = document.getElementById('topNav');
  const btn = document.getElementById('navToggle');
  if (nav) nav.classList.remove('mobile-visible');
  if (btn) {
    btn.setAttribute('aria-expanded', 'false');
    btn.classList.remove('is-open');
  }
  document.body.classList.remove('tf-nav-open');
}

function tfCloseSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggle = document.getElementById('sidebarToggle');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('visible');
  document.body.style.overflow = '';
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
}

/* ─────────────────────────────────────────────────────────────
   Inject "Home & Sections" nav at the TOP of the sidebar
   Only visible on mobile (≤900px) via CSS class
───────────────────────────────────────────────────────────── */
function tfInjectSidebarHomeNav() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  if (sidebar.querySelector('.tf-mobile-home-nav')) return; // already injected

  // Detect root path by directory depth (languages sit two levels deep:
  // /programming/python/*.html → ../../).
  const path = window.location.pathname;
  const segs = path.split('/').filter(Boolean);
  const last = segs[segs.length - 1] || '';
  const depth = last.includes('.') ? segs.length - 1 : segs.length;
  const root = '../'.repeat(depth);

  const sections = [
    { href: root + 'index.html',               icon: '<i class="ti ti-home"></i>', label: 'Home' },
    { href: root + 'programming/index.html',    icon: '<i class="ti ti-code"></i>', label: 'Programming' },
    { href: root + 'aiml/index.html',           icon: '<i class="ti ti-robot"></i>', label: 'AI/ML' },
    { href: root + 'dsa/index.html',            icon: '<i class="ti ti-chart-bar"></i>', label: 'DSA' },
    { href: root + 'system-design/index.html',  icon: '<i class="ti ti-building"></i>', label: 'Sys Design' },
    { href: root + 'data-cloud/index.html',     icon: '<i class="ti ti-cloud-data-connection"></i>', label: 'Data & Cloud' },
    { href: root + 'systems/index.html',        icon: '<i class="ti ti-cpu"></i>', label: 'OS & Networks' },
    { href: root + 'interview/index.html',      icon: '<i class="ti ti-target"></i>', label: 'Interview' },
    { href: root + 'about.html',                icon: '<i class="ti ti-info-circle"></i>', label: 'About' },
  ];

  const nav = document.createElement('div');
  nav.className = 'tf-mobile-home-nav';
  nav.innerHTML = `
    <div class="tf-mhn-label">Navigate</div>
    <div class="tf-mhn-grid">
      ${sections.map(s => `
        <a class="tf-mhn-item" href="${s.href}">
          <span class="tf-mhn-icon">${s.icon}</span>
          <span class="tf-mhn-text">${s.label}</span>
        </a>
      `).join('')}
    </div>
    <div class="tf-mhn-divider"></div>
  `;

  // Insert before the first child of sidebar
  sidebar.insertBefore(nav, sidebar.firstChild);
}

/* ─────────────────────────────────────────────────────────────
   Inject styles for the mobile home nav block
───────────────────────────────────────────────────────────── */
// tfInjectMobileNavStyles: styles now live in forge_base.css — no JS injection needed.
function tfInjectMobileNavStyles() {}

function tfInitTopbarChrome() {
  const navToggle = document.getElementById('navToggle');
  const topNav = document.getElementById('topNav');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  // Inject mobile home nav into sidebar
  tfInjectMobileNavStyles();
  tfInjectSidebarHomeNav();

  // Hide sidebar toggle immediately on pages without sidebar (prevents flash)
  if (sidebarToggle) {
    if (!sidebar) {
      sidebarToggle.style.display = 'none';
      sidebarToggle.setAttribute('aria-hidden', 'true');
    } else {
      sidebarToggle.style.display = '';
      sidebarToggle.setAttribute('aria-hidden', 'false');
      sidebarToggle.setAttribute('aria-expanded', 'false');
      sidebarToggle.setAttribute('aria-label', 'Open section menu');
    }
  }

  if (sidebar && navToggle) {
    navToggle.setAttribute('hidden', 'hidden');
    navToggle.setAttribute('aria-hidden', 'true');
    navToggle.style.display = 'none';
  } else if (navToggle && topNav) {
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      const open = topNav.classList.toggle('mobile-visible');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.classList.toggle('is-open', open);
      if (tfMobileLayout()) {
        document.body.classList.toggle('tf-nav-open', open);
      } else {
        document.body.classList.remove('tf-nav-open');
      }
      if (open) tfCloseSidebar();
    });
    topNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (tfMobileLayout()) tfCloseNavMenu();
      });
    });
  }

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      const open = !sidebar.classList.contains('open');
      if (open) {
        sidebar.classList.add('open');
        sidebarToggle.setAttribute('aria-expanded', 'true');
        if (overlay) overlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
        tfCloseNavMenu();
      } else {
        tfCloseSidebar();
      }
    });
    sidebar.addEventListener('click', function (e) {
      if (tfMobileLayout() && e.target.closest && e.target.closest('.sb-link')) {
        tfCloseSidebar();
      }
    });
    let sx = 0;
    sidebar.addEventListener('touchstart', function (e) {
      sx = e.touches[0].clientX;
    }, { passive: true });
    sidebar.addEventListener('touchend', function (e) {
      if (sx - e.changedTouches[0].clientX > 55) tfCloseSidebar();
    }, { passive: true });
  }

  if (overlay) {
    overlay.addEventListener('click', tfCloseSidebar);
  }

  document.addEventListener('click', function (e) {
    if (!tfMobileLayout()) return;
    if (topNav && topNav.classList.contains('mobile-visible')) {
      if (!topNav.contains(e.target) && e.target !== navToggle) tfCloseNavMenu();
    }
    if (sidebar && sidebar.classList.contains('open')) {
      if (!sidebar.contains(e.target) && e.target !== sidebarToggle && e.target !== overlay) {
        tfCloseSidebar();
      }
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      tfCloseNavMenu();
      tfCloseSidebar();
    }
  });

  window.addEventListener('resize', function () {
    if (!tfMobileLayout()) {
      tfCloseNavMenu();
      tfCloseSidebar();
      document.body.classList.remove('tf-nav-open');
    }
  });
}

document.addEventListener('DOMContentLoaded', tfInitTopbarChrome);

// Theme toggle (light/dark) — class set on <html> via inline head script to avoid flash;
// this IIFE is a fallback in case the inline script was skipped.
(function () {
  try {
    var saved = localStorage.getItem('tf-theme');
    if (saved === 'light') document.documentElement.classList.add('light');
  } catch (_) {}
})();

function tfToggleTheme() {
  var isLight = document.documentElement.classList.toggle('light');
  try { localStorage.setItem('tf-theme', isLight ? 'light' : 'dark'); } catch (_) {}
  var btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = isLight ? '\u2600' : '\u263D';
}

document.addEventListener('DOMContentLoaded', function () {
  var btn = document.getElementById('themeToggle');
  if (btn) {
    btn.textContent = document.documentElement.classList.contains('light') ? '\u2600' : '\u263D';
    btn.addEventListener('click', tfToggleTheme);
  }
});

// a11y: .info-tabs, code blocks, and some canvas/viz wrappers scroll
// horizontally when their content is wider than the container (narrow
// viewports, long code lines, fixed-width canvases). WCAG 2.1 AA
// (scrollable-region-focusable) requires any scrollable region to be
// reachable by keyboard. Only made focusable when it actually overflows, so
// pages where content already fits get no extra tab stop.
function tfMakeScrollRegionsFocusable() {
  var selectors = '.info-tabs, .code-pre, .code-block pre, .viz-body, [style*="overflow-x"]';
  document.querySelectorAll(selectors).forEach(function (el) {
    // Elements explicitly marked up as a scrollable region (role="region",
    // added by hand around canvas visualizations) keep their tabindex
    // unconditionally. Their content is a canvas whose drawing width is set
    // by a later script, so on first load — before that resize logic runs —
    // scrollWidth can still equal clientWidth even though the region is
    // meant to be scrollable at other sizes/DPIs. Stripping tabindex here
    // based on a premature measurement re-introduces the very
    // scrollable-region-focusable violation this function exists to fix.
    if (el.getAttribute('role') === 'region') {
      el.setAttribute('tabindex', '0');
      return;
    }
    if (el.scrollWidth > el.clientWidth) {
      el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('aria-label')) {
        el.setAttribute('aria-label', el.classList.contains('info-tabs') ? 'Scrollable tab list' : 'Scrollable content');
      }
    } else {
      el.removeAttribute('tabindex');
    }
  });
}
document.addEventListener('DOMContentLoaded', tfMakeScrollRegionsFocusable);
window.addEventListener('resize', tfMakeScrollRegionsFocusable);
/* ─────────────────────────────────────────────────────────────
   Keyboard access for legacy clickable divs/spans.
   Many pages attach onclick to non-interactive elements
   (.info-tab, .pq-item, .qna-q, .ftab, div.quiz-opt …), which are
   unreachable by keyboard. Give every such element a tab stop,
   a button role, and Enter/Space activation.
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  var NATIVE = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY'];
  document.querySelectorAll('[onclick]').forEach(function (el) {
    if (NATIVE.indexOf(el.tagName) !== -1) return;
    if (el.hasAttribute('tabindex')) return;
    /* Never make a container interactive when it already holds an
       interactive child (button/link inside a clickable card) — axe
       "nested-interactive". Such cards need their own inner keyboard
       path instead (e.g. a real <a> on the title). */
    if (el.querySelector('button, a[href], input, select, textarea, [tabindex]')) return;
    el.setAttribute('tabindex', '0');
    if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
  });
});

/* ── Animated page-nav buttons (uiverse-adapted, see forge_base .pn-anim) ──
   Progressive enhancement: rebuild .page-nav links ending in "→" (next) or
   starting with "←" (prev, mirrored) into the arrow-swap / circle-fill
   structure. No-op if markup is absent. */
document.addEventListener('DOMContentLoaded', function () {
  var ARROW_R = 'M16.17 11 10.8 5.64l1.42-1.42L20 12l-7.78 7.78-1.41-1.42L16.17 13H4v-2z';
  var ARROW_L = 'M7.83 11 13.2 5.64l-1.42-1.42L4 12l7.78 7.78 1.41-1.42L7.83 13H20v-2z';
  document.querySelectorAll('.page-nav .nav-link').forEach(function (a) {
    var t = (a.textContent || '').trim();
    var isNext = /→$/.test(t);
    var isPrev = /^←/.test(t);
    if (!isNext && !isPrev) return;
    var ARROW = isNext ? ARROW_R : ARROW_L;
    var label = t.replace(/→$/, '').replace(/^←/, '').trim();
    a.classList.add('pn-anim');
    if (isPrev) a.classList.add('pn-prev');
    a.textContent = '';
    function svg(cls) {
      var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('viewBox', '0 0 24 24');
      s.setAttribute('aria-hidden', 'true');
      s.setAttribute('class', 'pn-arr ' + cls);
      var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', ARROW);
      s.appendChild(p);
      return s;
    }
    var text = document.createElement('span');
    text.className = 'pn-text';
    text.textContent = label;
    var circle = document.createElement('span');
    circle.className = 'pn-circle';
    circle.setAttribute('aria-hidden', 'true');
    a.appendChild(svg('pn-arr2'));
    a.appendChild(text);
    a.appendChild(circle);
    a.appendChild(svg('pn-arr1'));
  });
});

/* ── Timed MCQ quiz (interview question banks) ────────────────────────────
   Injected on pages with .qna-item + .filter-row: 10 random questions, each
   rendered as a 4-option MCQ. The correct option is the question's own
   answer; distractors are answers to other questions in the same bank.
   30s per question, streak tracking, segmented progress, keyboard 1-4.
   Progressive enhancement — no markup changes on the bank pages. */
document.addEventListener('DOMContentLoaded', function () {
  var filterRow = document.querySelector('.filter-row');
  var items = [].slice.call(document.querySelectorAll('.qna-item'));
  if (!filterRow || items.length < 6) return;

  var QUIZ_N = Math.min(10, items.length);
  var PER_Q_SECS = 30;
  var bestKey = 'tf_timedquiz_' + (document.body.dataset.topicId || location.pathname);

  function snippet(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    var t = (d.textContent || '').replace(/\s+/g, ' ').trim();
    /* first sentence, capped: options must be scannable */
    var m = t.match(/^.{40,}?[.!?](?=\s|$)/);
    var s = m ? m[0] : t;
    return s.length > 150 ? s.slice(0, 147).replace(/\s+\S*$/, '') + '…' : s;
  }

  var pool = items.map(function (it) {
    return {
      q: ((it.querySelector('.qna-text') || {}).textContent || '').trim(),
      full: (it.querySelector('.qna-a') || {}).innerHTML || '',
      opt: snippet((it.querySelector('.qna-a') || {}).innerHTML || ''),
      diff: it.dataset.diff || ''
    };
  }).filter(function (x) { return x.q && x.opt; });
  if (pool.length < 6) return;

  var launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'tq-launch';
  launch.innerHTML = '&#9201; Timed Quiz';
  filterRow.appendChild(launch);

  var state = null, timerId = null, lastFocus = null, qStart = 0;

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function close() {
    clearInterval(timerId);
    var o = document.querySelector('.tq-overlay');
    if (o) o.remove();
    document.removeEventListener('keydown', keys);
    state = null;
    if (lastFocus) lastFocus.focus();
  }

  function newState() {
    var qs = shuffle(pool).slice(0, QUIZ_N).map(function (cur) {
      var others = shuffle(pool.filter(function (p) { return p !== cur; })).slice(0, 3);
      var options = shuffle([cur].concat(others));
      return { q: cur.q, full: cur.full, diff: cur.diff, options: options, correct: options.indexOf(cur) };
    });
    return { qs: qs, i: 0, right: 0, streak: 0, bestStreak: 0, times: [], missed: [], answered: [], started: Date.now(), locked: false };
  }

  function open() {
    lastFocus = document.activeElement;
    state = newState();
    var o = document.createElement('div');
    o.className = 'tq-overlay';
    o.innerHTML = '<div class="tq-modal" role="dialog" aria-modal="true" aria-label="Timed quiz"></div>';
    o.addEventListener('click', function (e) { if (e.target === o) close(); });
    document.body.appendChild(o);
    document.addEventListener('keydown', keys);
    renderQ();
  }

  function keys(e) {
    if (e.key === 'Escape') { close(); return; }
    if (!state || state.locked) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4) {
      var btn = document.querySelectorAll('.tq-opt')[n - 1];
      if (btn) btn.click();
    }
  }

  function modal() { return document.querySelector('.tq-modal'); }

  function progressHtml() {
    var segs = '';
    for (var k = 0; k < state.qs.length; k++) {
      var cls = 'tq-seg';
      if (k < state.answered.length) cls += state.answered[k] ? ' tq-seg-ok' : ' tq-seg-no';
      else if (k === state.i) cls += ' tq-seg-cur';
      segs += '<span class="' + cls + '"></span>';
    }
    return '<div class="tq-progress" aria-hidden="true">' + segs + '</div>';
  }

  function startTimer(onExpire) {
    clearInterval(timerId);
    qStart = Date.now();
    var fill = modal().querySelector('.tq-timer-fill');
    var left = PER_Q_SECS;
    requestAnimationFrame(function () {
      fill.classList.add('tq-running');
      fill.style.transitionDuration = PER_Q_SECS + 's';
      fill.style.transform = 'scaleX(0)';
    });
    timerId = setInterval(function () {
      left--;
      if (left === 10) fill.classList.add('tq-low');
      if (left <= 0) { clearInterval(timerId); onExpire(); }
    }, 1000);
  }

  function renderQ() {
    state.locked = false;
    var cur = state.qs[state.i];
    var optsHtml = cur.options.map(function (o, idx) {
      return '<button type="button" class="tq-opt" data-i="' + idx + '">' +
        '<span class="tq-key">' + (idx + 1) + '</span><span class="tq-opt-text"></span></button>';
    }).join('');
    modal().innerHTML =
      '<div class="tq-head"><span class="tq-count">' + (state.i + 1) + ' / ' + state.qs.length + '</span>' +
      (state.streak >= 2 ? '<span class="tq-streak">streak ' + state.streak + '</span>' : '') +
      '<button type="button" class="tq-close" aria-label="Close quiz">✕</button></div>' +
      progressHtml() +
      '<div class="tq-timer"><div class="tq-timer-fill"></div></div>' +
      '<div class="tq-q"></div>' +
      '<div class="tq-diff"></div>' +
      '<div class="tq-opts">' + optsHtml + '</div>';
    modal().querySelector('.tq-q').textContent = cur.q;
    modal().querySelector('.tq-diff').textContent = 'pick the answer · keys 1-4';
    var optEls = modal().querySelectorAll('.tq-opt');
    optEls.forEach(function (b, idx) {
      b.querySelector('.tq-opt-text').textContent = cur.options[idx].opt;
      b.addEventListener('click', function () { if (!state.locked) resolve(idx); });
    });
    modal().querySelector('.tq-close').addEventListener('click', close);
    optEls[0].focus();
    startTimer(function () { resolve(-1); });
  }

  function resolve(idx) {
    state.locked = true;
    clearInterval(timerId);
    var cur = state.qs[state.i];
    var ok = idx === cur.correct;
    state.times.push((Date.now() - qStart) / 1000);
    state.answered.push(ok);
    if (ok) { state.right++; state.streak++; if (state.streak > state.bestStreak) state.bestStreak = state.streak; }
    else { state.streak = 0; state.missed.push(cur); }
    var opts = modal().querySelectorAll('.tq-opt');
    opts.forEach(function (b, k) {
      b.disabled = true;
      if (k === cur.correct) b.classList.add('tq-ok');
      else if (k === idx) b.classList.add('tq-no');
      else b.classList.add('tq-dim');
    });
    var fill = modal().querySelector('.tq-timer-fill');
    fill.style.transitionDuration = '0s';
    setTimeout(function () {
      state.i++;
      if (state.i < state.qs.length) renderQ();
      else summary();
    }, ok ? 700 : 1400);
  }

  function summary() {
    clearInterval(timerId);
    var n = state.qs.length;
    var pct = Math.round((state.right / n) * 100);
    var avg = state.times.length ? Math.round(state.times.reduce(function (a, b) { return a + b; }, 0) / state.times.length * 10) / 10 : 0;
    var best = 0;
    try { best = parseInt(localStorage.getItem(bestKey) || '0', 10); } catch (e) {}
    var isBest = state.right > best;
    if (isBest) { try { localStorage.setItem(bestKey, String(state.right)); } catch (e) {} }
    var verdict = pct === 100 ? 'Flawless.' : pct >= 80 ? 'Interview-ready.' : pct >= 60 ? 'Solid — review the misses.' : 'Keep drilling — the full bank is right behind this dialog.';
    var html =
      '<div class="tq-head"><span class="tq-count">QUIZ COMPLETE</span>' +
      '<button type="button" class="tq-close" aria-label="Close quiz">✕</button></div>' +
      progressHtml() +
      '<div class="tq-score">' + state.right + '<span class="tq-score-of">/ ' + n + '</span></div>' +
      '<div class="tq-sub">' + verdict + '</div>' +
      '<div class="tq-stats">' +
      '<div class="tq-stat"><span class="tq-stat-val">' + pct + '%</span><span class="tq-stat-label">accuracy</span></div>' +
      '<div class="tq-stat"><span class="tq-stat-val">' + avg + 's</span><span class="tq-stat-label">avg / question</span></div>' +
      '<div class="tq-stat"><span class="tq-stat-val">' + state.bestStreak + '</span><span class="tq-stat-label">best streak</span></div>' +
      '<div class="tq-stat"><span class="tq-stat-val">' + (isBest ? state.right : best) + '</span><span class="tq-stat-label">' + (isBest ? 'new best' : 'personal best') + '</span></div>' +
      '</div>';
    if (state.missed.length) {
      html += '<div class="tq-sub" style="margin-top:14px"><strong>Review these:</strong></div><ul class="tq-missed"></ul>';
    }
    html += '<div class="tq-actions"><button type="button" class="tq-btn tq-primary tq-again">Run it again</button>' +
      '<button type="button" class="tq-btn tq-done">Done</button></div>';
    modal().innerHTML = html;
    var ul = modal().querySelector('.tq-missed');
    if (ul) state.missed.forEach(function (q) {
      var li = document.createElement('li');
      var qEl = document.createElement('div');
      qEl.className = 'tq-missed-q';
      qEl.textContent = q.q;
      var aEl = document.createElement('div');
      aEl.className = 'tq-missed-a';
      aEl.innerHTML = q.full; /* answer markup comes from this same page */
      li.appendChild(qEl);
      li.appendChild(aEl);
      ul.appendChild(li);
    });
    modal().querySelector('.tq-close').addEventListener('click', close);
    modal().querySelector('.tq-done').addEventListener('click', close);
    modal().querySelector('.tq-again').addEventListener('click', function () { state = newState(); renderQ(); });
    modal().querySelector('.tq-again').focus();
  }

  launch.addEventListener('click', open);
});

/* ── Copy button on every code block ─────────────────────────────────────
   Some older pages only gave certain panes a copy button. Inject one into
   any .code-block missing it, self-contained (no global copyCode needed). */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.code-block').forEach(function (blk) {
    if (blk.querySelector('.copy-btn')) return;
    var pre = blk.querySelector('pre');
    if (!pre) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.textContent = 'COPY';
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(pre.textContent).then(function () {
        btn.textContent = 'COPIED!';
        btn.classList.add('copied');
        setTimeout(function () { btn.textContent = 'COPY'; btn.classList.remove('copied'); }, 1800);
      });
    });
    blk.insertBefore(btn, pre);
  });
});

/* ── Flashcards: spaced repetition (Leitner boxes) ────────────────────────
   Injected on interview bank pages (.qna-item + .filter-row). Each Q&A is a
   card. Boxes 0-5 with intervals [0,1,2,4,7,15] days; "Good" moves a card up
   a box, "Again" resets it to box 1. Due cards resurface first; new cards
   fill the rest, capped per session. State in localStorage only. */
document.addEventListener('DOMContentLoaded', function () {
  var filterRow = document.querySelector('.filter-row');
  var items = [].slice.call(document.querySelectorAll('.qna-item'));
  if (!filterRow || items.length < 6) return;

  var SESSION_CAP = 20;
  var INTERVALS = [0, 1, 2, 4, 7, 15]; /* days per box */
  var storeKey = 'tf_flash_' + (document.body.dataset.topicId || location.pathname);

  function hash(s) {
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }
  function today() { return Math.floor(Date.now() / 86400000); }
  function load() { try { return JSON.parse(localStorage.getItem(storeKey) || '{}'); } catch (e) { return {}; } }
  function save(st) { try { localStorage.setItem(storeKey, JSON.stringify(st)); } catch (e) {} }

  var pool = items.map(function (it) {
    var q = ((it.querySelector('.qna-text') || {}).textContent || '').trim();
    return { id: hash(q), q: q, a: (it.querySelector('.qna-a') || {}).innerHTML || '' };
  }).filter(function (x) { return x.q && x.a; });
  if (pool.length < 6) return;

  function buildQueue() {
    var st = load(), t = today();
    var due = [], fresh = [];
    pool.forEach(function (c) {
      var rec = st[c.id];
      if (!rec) fresh.push(c);
      else if (rec.d <= t) due.push(c);
    });
    return due.concat(fresh).slice(0, SESSION_CAP);
  }

  var launch = document.createElement('button');
  launch.type = 'button';
  launch.className = 'fc-launch';
  function refreshLaunch() {
    var n = buildQueue().length;
    launch.innerHTML = '&#9634; Flashcards' + (n ? ' <span class="fc-due">' + n + ' due</span>' : '');
  }
  refreshLaunch();
  filterRow.appendChild(launch);

  var state = null, lastFocus = null;

  function close() {
    var o = document.querySelector('.fc-overlay');
    if (o) o.remove();
    document.removeEventListener('keydown', keys);
    state = null;
    refreshLaunch();
    if (lastFocus) lastFocus.focus();
  }

  function keys(e) {
    if (e.key === 'Escape') { close(); return; }
    if (!state) return;
    if (e.key === ' ' || e.key === 'Enter') {
      var card = document.querySelector('.fc-card');
      if (card && !card.classList.contains('fc-flipped')) { e.preventDefault(); card.click(); }
    }
    if (e.key === '1') { var b = document.querySelector('.fc-again'); if (b) b.click(); }
    if (e.key === '2') { var g = document.querySelector('.fc-good'); if (g) g.click(); }
  }

  function open() {
    lastFocus = document.activeElement;
    state = { queue: buildQueue(), i: 0, reviewed: 0, again: 0 };
    if (!state.queue.length) { state = null; return; }
    var o = document.createElement('div');
    o.className = 'tq-overlay fc-overlay';
    o.innerHTML = '<div class="tq-modal" role="dialog" aria-modal="true" aria-label="Flashcards"></div>';
    o.addEventListener('click', function (e) { if (e.target === o) close(); });
    document.body.appendChild(o);
    document.addEventListener('keydown', keys);
    render();
  }

  function modal() { return document.querySelector('.fc-overlay .tq-modal'); }

  function render() {
    var cur = state.queue[state.i];
    var st = load();
    var box = (st[cur.id] || { b: 0 }).b;
    modal().innerHTML =
      '<div class="tq-head"><span class="tq-count">CARD ' + (state.i + 1) + ' / ' + state.queue.length + '</span>' +
      '<button type="button" class="tq-close" aria-label="Close flashcards">✕</button></div>' +
      '<div class="fc-card" tabindex="0" role="button" aria-label="Reveal answer">' +
      '<div class="fc-inner">' +
      '<div class="fc-face fc-front"><div class="fc-face-label">Question</div><div class="fc-q"></div><div class="fc-hint">click / space to reveal</div></div>' +
      '<div class="fc-face fc-back"><div class="fc-face-label">Answer</div><div class="fc-a"></div></div>' +
      '</div></div>' +
      '<div class="fc-grade" hidden>' +
      '<button type="button" class="tq-btn tq-wrong fc-again">1 · Again <span style="opacity:.6;font-weight:500">(tomorrow)</span></button>' +
      '<button type="button" class="tq-btn tq-right fc-good">2 · Good <span style="opacity:.6;font-weight:500">(+' + INTERVALS[Math.min(box + 1, 5)] + 'd)</span></button>' +
      '</div>' +
      '<div class="fc-box-info">box ' + box + ' of 5</div>';
    modal().querySelector('.fc-q').textContent = cur.q;
    modal().querySelector('.fc-a').innerHTML = cur.a; /* markup from this same page */
    modal().querySelector('.tq-close').addEventListener('click', close);
    var card = modal().querySelector('.fc-card');
    card.addEventListener('click', function () {
      if (card.classList.contains('fc-flipped')) return;
      card.classList.add('fc-flipped');
      var g = modal().querySelector('.fc-grade');
      g.hidden = false;
      modal().querySelector('.fc-good').focus();
    });
    modal().querySelector('.fc-again').addEventListener('click', function () { grade(cur, false); });
    modal().querySelector('.fc-good').addEventListener('click', function () { grade(cur, true); });
    card.focus();
  }

  function grade(cur, good) {
    var st = load(), t = today();
    var box = (st[cur.id] || { b: 0 }).b;
    var nb = good ? Math.min(box + 1, 5) : 1;
    st[cur.id] = { b: nb, d: t + INTERVALS[nb] };
    save(st);
    state.reviewed++;
    if (!good) state.again++;
    state.i++;
    if (state.i < state.queue.length) render();
    else summary();
  }

  function summary() {
    var nextDue = buildQueue().length;
    modal().innerHTML =
      '<div class="tq-head"><span class="tq-count">SESSION DONE</span>' +
      '<button type="button" class="tq-close" aria-label="Close flashcards">✕</button></div>' +
      '<div class="tq-score">' + state.reviewed + '<span class="tq-score-of">cards</span></div>' +
      '<div class="tq-sub">' + (state.again === 0 ? 'Every card graded Good — the intervals stretch out from here.'
        : state.again + ' back to box 1; they return tomorrow.') + '</div>' +
      '<div class="tq-sub">' + (nextDue ? nextDue + ' more available now.' : 'Nothing else due — come back tomorrow.') + '</div>' +
      '<div class="tq-actions">' +
      (nextDue ? '<button type="button" class="tq-btn tq-primary fc-more">Keep going</button>' : '') +
      '<button type="button" class="tq-btn fc-close2">Done</button></div>';
    modal().querySelector('.tq-close').addEventListener('click', close);
    modal().querySelector('.fc-close2').addEventListener('click', close);
    var more = modal().querySelector('.fc-more');
    if (more) more.addEventListener('click', function () {
      state = { queue: buildQueue(), i: 0, reviewed: 0, again: 0 };
      render();
    });
    (more || modal().querySelector('.fc-close2')).focus();
  }

  launch.addEventListener('click', open);
});
