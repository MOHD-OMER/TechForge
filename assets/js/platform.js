/**
 * TechForge Platform — search, progress, bookmarks, hub rendering, lesson chrome.
 */
(function () {
  'use strict';

  var STORAGE = {
    recent: 'tf_recent_pages',
    bookmarks: 'tf_bookmarks',
    completed: 'tf_completed_topics',
    continueDismiss: 'tf_continue_dismissed'
  };

  function rootPath() {
    var p = window.location.pathname.replace(/\\/g, '/');
    // Wings live one level deeper (/programming/python/, /systems/os/ …) → ../../
    if (/\/(programming|systems)\/[a-z0-9-]+\//.test(p)) {
      return '../../';
    }
    if (p.includes('/programming/') || p.includes('/dsa/') || p.includes('/devops/') ||
        p.includes('/system-design/') || p.includes('/databases/') ||
        p.includes('/aiml/') || p.includes('/interview/') ||
        p.includes('/systems/') || p.includes('/data-cloud/')) {
      return '../';
    }
    return '';
  }

  function getRecent() {
    try { return JSON.parse(localStorage.getItem(STORAGE.recent) || '[]'); } catch (e) { return []; }
  }

  function pushRecent(entry) {
    var list = getRecent().filter(function (r) { return r.href !== entry.href; });
    list.unshift(entry);
    localStorage.setItem(STORAGE.recent, JSON.stringify(list.slice(0, 12)));
  }

  function getBookmarks() {
    try { return JSON.parse(localStorage.getItem(STORAGE.bookmarks) || '[]'); } catch (e) { return []; }
  }

  function toggleBookmark(id, title, href) {
    var list = getBookmarks();
    var i = list.findIndex(function (b) { return b.id === id; });
    if (i >= 0) list.splice(i, 1);
    else list.push({ id: id, title: title, href: href, at: Date.now() });
    localStorage.setItem(STORAGE.bookmarks, JSON.stringify(list));
    return i < 0;
  }

  function isBookmarked(id) {
    return getBookmarks().some(function (b) { return b.id === id; });
  }

  function getCompleted() {
    try { return JSON.parse(localStorage.getItem(STORAGE.completed) || '[]'); } catch (e) { return []; }
  }

  function toggleCompleted(id) {
    var list = getCompleted();
    var i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1);
    else list.push(id);
    localStorage.setItem(STORAGE.completed, JSON.stringify(list));
    return i < 0;
  }

  function isCompleted(id) {
    return getCompleted().indexOf(id) >= 0;
  }

  function estimateReadingTime(el) {
    if (!el) return 5;
    var text = el.innerText || '';
    var words = text.trim().split(/\s+/).length;
    return Math.max(3, Math.ceil(words / 200));
  }

  /* ── Global search (sidebar only — matches deployed pages) ── */
  function initSidebarSearch() {
    var input = document.getElementById('searchInput');
    if (!input || input.dataset.tfBound) return;
    input.dataset.tfBound = '1';
    var navLinks = document.querySelectorAll('#sidebar .sb-link, .sidebar .sb-link');
    if (!navLinks.length) return;

    input.addEventListener('input', function (e) {
      var term = e.target.value.toLowerCase().trim();
      navLinks.forEach(function (link) {
        link.classList.toggle('no-match', term !== '' && !link.textContent.toLowerCase().includes(term));
      });
      document.querySelectorAll('.t-card, .hub-topic-card, .htc-title').forEach(function (card) {
        var el = card.closest('.t-card, .hub-topic-card') || card;
        var text = el.textContent.toLowerCase();
        el.style.display = (term === '' || text.includes(term)) ? '' : 'none';
      });
      document.querySelectorAll('.cat-section, .hub-category').forEach(function (section) {
        var cards = section.querySelectorAll('.t-card, .hub-topic-card');
        if (!cards.length) return;
        var visible = Array.from(cards).some(function (c) { return c.style.display !== 'none'; });
        section.style.display = visible ? '' : 'none';
      });
    });

    input.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      input.value = '';
      navLinks.forEach(function (l) { l.classList.remove('no-match'); });
      document.querySelectorAll('.t-card, .hub-topic-card').forEach(function (c) { c.style.display = ''; });
      document.querySelectorAll('.cat-section, .hub-category').forEach(function (s) { s.style.display = ''; });
    });
  }

  function initSearch() {
    initSidebarSearch();
  }

  /* ── Hub topic grid renderer ── */
  window.tfRenderHub = function (sectionKey, containerId) {
    var section = window.TF_TOPICS && window.TF_TOPICS[sectionKey];
    var el = document.getElementById(containerId);
    if (!section || !el) return;

    var html = '';
    section.categories.forEach(function (cat) {
      html += '<div class="hub-category"><div class="hub-category-head">' + cat.label + '</div><div class="hub-topic-grid">';
      cat.topics.forEach(function (t) {
        html += '<a class="hub-topic-card' + (t.depth === 'full' ? ' full' : '') + '" href="' + t.file + '">' +
          '<span class="htc-icon">' + t.icon + '</span>' +
          '<span class="htc-title">' + t.title + '</span>' +
          '<span class="htc-desc">' + t.desc + '</span>' +
          '<span class="htc-meta"><span>' + (t.depth === 'full' ? 'Full guide' : 'Guide') + '</span>' +
          (t.depth === 'full' ? '<span class="htc-badge">Deep dive</span>' : '<span>→</span>') + '</span></a>';
      });
      html += '</div></div>';
    });
    el.innerHTML = html;

    var total = section.categories.reduce(function (n, c) { return n + c.topics.length; }, 0);
    document.querySelectorAll('[data-hub-count="' + sectionKey + '"]').forEach(function (node) {
      node.textContent = total;
    });
  };

  /* ── Lesson & legacy layout learning features ── */
  function initLessonPage() {
    var body = document.body;
    var topicId = body.getAttribute('data-topic-id');
    if (!topicId) return;

    var title = pageTitleFromDom();
    var href = pageHrefFromLocation();
    pushRecent({ id: topicId, title: title, href: href, section: body.getAttribute('data-section') || topicId.split('/')[0], at: Date.now() });

    var main = document.querySelector('.lesson-main, .main');
    var mins = estimateReadingTime(main);
    var timeEl = document.getElementById('lessonReadTime');
    if (timeEl) timeEl.textContent = mins + ' min read';

    bindLearningActions(topicId, title, href);
    injectLegacyLearningBar(topicId, title, href);

    /* TOC scroll spy — sidebar on-page links (same as legacy lesson-toc) */
    var tocLinks = document.querySelectorAll('.lesson-toc a[href^="#"], #sidebar a.sb-link[href^="#"]');
    if (tocLinks.length && 'IntersectionObserver' in window) {
      var sections = [];
      tocLinks.forEach(function (a) {
        var id = a.getAttribute('href').slice(1);
        var sec = document.getElementById(id);
        if (sec) sections.push({ link: a, el: sec });
      });
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            tocLinks.forEach(function (l) { l.classList.remove('active'); });
            var match = sections.find(function (s) { return s.el === entry.target; });
            if (match) match.link.classList.add('active');
          }
        });
      }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
      sections.forEach(function (s) { obs.observe(s.el); });
    }

    /* Related topics from manifest */
    var relatedEl = document.getElementById('lessonRelated');
    if (relatedEl && window.TF_TOPICS) {
      var sectionKey = body.getAttribute('data-section');
      var section = window.TF_TOPICS[sectionKey];
      if (section) {
        var all = [];
        section.categories.forEach(function (c) { all = all.concat(c.topics); });
        var current = all.find(function (t) { return t.id === topicId; });
        var others = all.filter(function (t) { return t.id !== topicId; }).slice(0, 4);
        relatedEl.innerHTML = others.map(function (t) {
          return '<a href="' + t.file + '">' + t.icon + ' ' + t.title + '</a>';
        }).join('');
      }
    }
  }

  function pageHrefFromLocation() {
    var parts = window.location.pathname.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.length >= 2) return parts.slice(-2).join('/');
    return parts[parts.length - 1] || 'index.html';
  }

  function pageTitleFromDom() {
    var el = document.querySelector('.lesson-title, .pg-title, .dh2-title, .tf-hub-title, .ph-title, .hero-title, .db-title, h1');
    if (!el) return document.title.replace(/\s*—\s*TechForge.*$/i, '').trim();
    return el.textContent.replace(/\s+/g, ' ').trim();
  }

  function ensurePageChrome() {
    var topbar = document.querySelector('header.topbar');
    if (!topbar) return;

    if (!document.querySelector('.progress-bar')) {
      var bar = document.createElement('div');
      bar.className = 'progress-bar';
      bar.innerHTML = '<div class="progress-fill" id="progressFill"></div>';
      topbar.insertAdjacentElement('afterend', bar);
    }

    if (!document.getElementById('backTop')) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'back-top';
      btn.id = 'backTop';
      btn.setAttribute('aria-label', 'Back to top');
      btn.textContent = '⬡';
      document.body.appendChild(btn);
    }
  }

  function initPageChrome() {
    ensurePageChrome();

    var progressFill = document.getElementById('progressFill') || document.getElementById('pbar');
    if (progressFill && !progressFill.id) progressFill.id = 'progressFill';

    if (progressFill && !progressFill.dataset.tfBound) {
      progressFill.dataset.tfBound = '1';
      window.addEventListener('scroll', function () {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        progressFill.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
      }, { passive: true });
    }

    var backTop = document.getElementById('backTop');
    if (backTop) {
      if (backTop.tagName === 'A') {
        backTop.setAttribute('href', '#');
        backTop.setAttribute('role', 'button');
      }
      if (!backTop.dataset.tfBound) {
        backTop.dataset.tfBound = '1';
        window.addEventListener('scroll', function () {
          backTop.classList.toggle('visible', window.scrollY > 400);
        }, { passive: true });
        backTop.addEventListener('click', function (e) {
          if (e) e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }
    }

    document.querySelectorAll('.anim-in:not(.visible)').forEach(function (el, i) {
      if (!el.dataset.animScheduled) {
        el.dataset.animScheduled = '1';
        setTimeout(function () { el.classList.add('visible'); }, i * 80);
      }
    });
  }

  function bindLearningActions(topicId, title, href) {
    var bookmarkBtn = document.getElementById('lessonBookmark');
    var completeBtn = document.getElementById('lessonComplete');

    if (bookmarkBtn && !bookmarkBtn.dataset.tfBound) {
      bookmarkBtn.dataset.tfBound = '1';
      function syncBookmark() {
        bookmarkBtn.classList.toggle('active', isBookmarked(topicId));
        bookmarkBtn.textContent = isBookmarked(topicId) ? '★ Saved' : '☆ Save';
      }
      syncBookmark();
      bookmarkBtn.addEventListener('click', function () {
        toggleBookmark(topicId, title, href);
        syncBookmark();
      });
    }

    if (completeBtn && !completeBtn.dataset.tfBound) {
      completeBtn.dataset.tfBound = '1';
      function syncComplete() {
        completeBtn.classList.toggle('active', isCompleted(topicId));
        completeBtn.textContent = isCompleted(topicId) ? '✓ Completed' : 'Mark complete';
      }
      syncComplete();
      completeBtn.addEventListener('click', function () {
        toggleCompleted(topicId);
        syncComplete();
      });
    }
  }

  function injectLegacyLearningBar(topicId, title, href) {
    if (document.getElementById('lessonBookmark')) return;

    var anchor = document.querySelector('.pg-head, .dsa-hero, .py-hero, .page-hero');
    if (!anchor) {
      var main = document.querySelector('.main, .layout .main, main');
      if (main) {
        var h1 = main.querySelector('h1');
        if (h1) anchor = h1.parentElement;
      }
    }
    if (!anchor) return;

    var wrap = document.createElement('div');
    wrap.className = 'pg-badges tf-learning-actions';
    wrap.innerHTML =
      '<span class="lesson-meta-tag" id="lessonReadTime">— min read</span>' +
      '<button type="button" class="lesson-btn" id="lessonBookmark">☆ Save</button>' +
      '<button type="button" class="lesson-btn" id="lessonComplete">Mark complete</button>';

    if (anchor.classList && anchor.classList.contains('dsa-hero')) {
      anchor.insertAdjacentElement('afterend', wrap);
    } else {
      anchor.appendChild(wrap);
    }

    var content = document.querySelector('.lesson-main, .main, .layout .main, main');
    var mins = estimateReadingTime(content || document.body);
    var timeEl = document.getElementById('lessonReadTime');
    if (timeEl) timeEl.textContent = mins + ' min read';

    bindLearningActions(topicId, title, href);
  }

  function trackUniversalVisit() {
    var body = document.body;
    var topicId = body.getAttribute('data-topic-id');
    if (topicId) return;

    var href = pageHrefFromLocation();
    var path = window.location.pathname.replace(/\\/g, '/');

    if (path.endsWith('/index.html') && !topicId) {
      return;
    }
    if (path.endsWith('index.html') && path.split('/').filter(Boolean).length <= 1) {
      return;
    }

    var title = pageTitleFromDom();
    var section = body.getAttribute('data-section') || (href.split('/')[0] || 'site');
    var id = section + '/' + href.split('/').pop().replace('.html', '');

    pushRecent({ id: id, title: title, href: href, section: section, at: Date.now() });
  }

  function trackHubVisit() {
    var path = window.location.pathname.replace(/\\/g, '/');
    var m = path.match(/\/(devops|system-design|databases|dsa|python|aiml|interview)\/index\.html$/);
    if (!m) return;
    var labels = {
      devops: 'DevOps Hub',
      'system-design': 'System Design Hub',
      databases: 'Database Systems Hub',
      dsa: 'DSA Hub',
      python: 'Python Hub',
      aiml: 'AI/ML Hub',
      interview: 'Interview Hub'
    };
    pushRecent({ id: m[1] + '/hub', title: labels[m[1]], href: m[1] + '/index.html', section: m[1], at: Date.now() });
  }

  document.addEventListener('DOMContentLoaded', function () {
    ensurePageChrome();
    initSearch();
    initLessonPage();
    trackUniversalVisit();
    initPageChrome();
    trackHubVisit();
  });
})();
