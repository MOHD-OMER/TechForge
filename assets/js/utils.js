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
    '.lt-btn.active{background:var(--accent-dim,rgba(77,158,247,.15));color:var(--accent,var(--blue))}';
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

  // Detect root path — check if we're in a subfolder
  const path = window.location.pathname;
  const inSubfolder = path.split('/').filter(p => p && p.includes('.')).length > 0 
    && path.split('/').filter(Boolean).length > 1;
  const root = inSubfolder ? '../' : '';

  const sections = [
    { href: root + 'index.html',               icon: '<i class="ti ti-home"></i>', label: 'Home' },
    { href: root + 'dsa/index.html',            icon: '<i class="ti ti-chart-bar"></i>', label: 'DSA' },
    { href: root + 'python/index.html',         icon: '<i class="ti ti-brand-python"></i>', label: 'Python' },
    { href: root + 'system-design/index.html',  icon: '<i class="ti ti-building"></i>', label: 'Sys Design' },
    { href: root + 'databases/index.html',      icon: '<i class="ti ti-database"></i>', label: 'Databases' },
    { href: root + 'aiml/aiml-explained.html',  icon: '<i class="ti ti-robot"></i>', label: 'AI/ML' },
    { href: root + 'interview/index.html',      icon: '<i class="ti ti-target"></i>', label: 'Interview' },
    { href: root + 'devops/index.html',         icon: '<i class="ti ti-server-2"></i>',  label: 'DevOps' },
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