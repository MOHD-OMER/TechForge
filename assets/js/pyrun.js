/* TechForge — run Python code blocks in the browser via Pyodide (WASM).
 * Active only on Python-track pages. Pyodide (~10 MB) is lazy-loaded from
 * jsDelivr on the first Run click, then reused for every block. */
(function () {
  'use strict';
  if ((document.body.dataset.section || '') !== 'python') return;

  var PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
  var pyodidePromise = null;

  /* skip blocks that can't run in a browser sandbox */
  function runnable(code) {
    return !/\baiohttp\b|\binput\s*\(|\bopen\s*\(|\bpip\b|\brequests\b/.test(code);
  }

  function loadPyodideOnce() {
    if (pyodidePromise) return pyodidePromise;
    pyodidePromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = PYODIDE_URL;
      s.onload = function () {
        window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/' })
          .then(resolve, reject);
      };
      s.onerror = function () { reject(new Error('Failed to load Pyodide from CDN')); };
      document.head.appendChild(s);
    });
    return pyodidePromise;
  }

  function outPanel(block) {
    var p = block.querySelector('.pyrun-out');
    if (!p) {
      p = document.createElement('div');
      p.className = 'pyrun-out';
      block.appendChild(p);
    }
    return p;
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  async function run(btn, block, pre) {
    var out = outPanel(block);
    btn.disabled = true;
    var firstLoad = !pyodidePromise;
    out.innerHTML = '<span class="pyr-dim">' + (firstLoad ? 'Loading Python runtime (~10 MB, first run only)&hellip;' : 'Running&hellip;') + '</span>';
    try {
      var py = await loadPyodideOnce();
      var lines = [];
      py.setStdout({ batched: function (t) { lines.push(t); } });
      py.setStderr({ batched: function (t) { lines.push(t); } });
      var code = pre.textContent;
      /* Pyodide's event loop is already running — asyncio.run() would throw.
       * runPythonAsync supports top-level await, so rewrite it. */
      code = code.replace(/\basyncio\.run\((.+)\)/g, 'await $1');
      var result;
      try {
        result = await py.runPythonAsync(code);
      } finally {
        py.setStdout({}); py.setStderr({});
      }
      var text = lines.join('\n');
      if ((result !== undefined && result !== null) && String(result) !== 'undefined') {
        text += (text ? '\n' : '') + String(result);
      }
      out.innerHTML = '<span class="pyr-hd">OUTPUT</span>' +
        (text.trim() ? '<pre>' + esc(text) + '</pre>' : '<span class="pyr-dim">(no output — add a print())</span>');
    } catch (err) {
      var msg = String(err && err.message || err);
      /* show only the useful tail of Python tracebacks */
      var tail = msg.split('\n').filter(Boolean).slice(-3).join('\n');
      out.innerHTML = '<span class="pyr-hd pyr-err">ERROR</span><pre class="pyr-err">' + esc(tail) + '</pre>';
    }
    btn.disabled = false;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var st = document.createElement('style');
    st.textContent =
      '.pyrun-btn{position:absolute;top:9px;right:76px;z-index:2;border:1px solid rgba(52,211,153,.35);background:rgba(52,211,153,.1);color:#34d399;font-family:var(--mono,monospace);font-size:10px;font-weight:700;padding:4px 12px;border-radius:6px;cursor:pointer;letter-spacing:.5px}' +
      '.pyrun-btn:hover{background:rgba(52,211,153,.2)}' +
      '.pyrun-btn:disabled{opacity:.5;cursor:wait}' +
      '.pyrun-out{border-top:1px solid var(--border,#1f2d42);padding:12px 18px;font-family:var(--mono,monospace);font-size:12px;line-height:1.7;background:rgba(0,0,0,.25)}' +
      '.pyrun-out pre{margin:6px 0 0;white-space:pre-wrap;word-break:break-word;color:#e2e8f4}' +
      '.pyr-hd{font-size:9px;font-weight:700;letter-spacing:1.5px;color:#34d399}' +
      '.pyr-err{color:#f87171}' +
      '.pyr-dim{color:#7e93b5;font-size:11.5px}';
    document.head.appendChild(st);

    document.querySelectorAll('.code-block').forEach(function (block) {
      var pre = block.querySelector('pre.code-pre');
      if (!pre) return;
      var code = pre.textContent;
      if (!runnable(code)) return;
      if (block.querySelector('.pyrun-btn')) return;
      /* only python blocks — skip JS/Java panes from the language toggle */
      var pane = block.closest('.lang-pane');
      if (pane && pane.dataset.lang && pane.dataset.lang !== 'python') return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pyrun-btn';
      btn.textContent = '▶ RUN';
      btn.addEventListener('click', function () { run(btn, block, pre); });
      block.style.position = 'relative';
      block.appendChild(btn);
    });
  });
})();
