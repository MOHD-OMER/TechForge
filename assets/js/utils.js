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

function tfInitTopbarChrome() {
  const navToggle = document.getElementById('navToggle');
  const topNav = document.getElementById('topNav');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  // Hide sidebar toggle immediately on pages without sidebar (prevents flash)
  if (sidebarToggle) {
    if (!sidebar) {
      sidebarToggle.style.display = 'none';
      sidebarToggle.setAttribute('aria-hidden', 'true');
    } else {
      sidebarToggle.style.display = '';
      sidebarToggle.setAttribute('aria-hidden', 'false');
      sidebarToggle.setAttribute('aria-expanded', 'false');
    }
  }

  if (navToggle && topNav) {
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
