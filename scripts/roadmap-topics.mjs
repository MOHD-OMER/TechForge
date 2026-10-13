/**
 * The progress keys a roadmap covers.
 *
 * A page's progress key is its data-topic-id, which does not follow from its
 * path — system-design/cdn.html is sd/cdn, programming/javascript/dom.html is
 * js/dom. The generated site index carries the real one, so this maps a
 * roadmap's node hrefs through it.
 *
 * Used by the roles hub to show progress per career, and by validate-graphs to
 * fail the build if the hub's baked lists fall out of step with the graphs.
 */
import fs from 'node:fs';
import path from 'node:path';

let byPath = null;

function topicIndex() {
  if (byPath) return byPath;
  const src = fs.readFileSync('assets/js/site-index.js', 'utf8');
  const m = src.match(/window\.TF_SITE_INDEX = (\[[\s\S]*?\]);/);
  if (!m) throw new Error('cannot read TF_SITE_INDEX from assets/js/site-index.js');
  byPath = new Map();
  for (const e of JSON.parse(m[1])) {
    if (e.path && e.topic) byPath.set(e.path.replace(/\\/g, '/'), e.topic);
  }
  return byPath;
}

/**
 * Everything a roadmap covers, written or not, keyed by the page it points at.
 *
 * Separate from topicsForRoadmap because the two answer different questions.
 * Progress can only count lessons that exist. A comparison must count the whole
 * field: Spark, Airflow and warehouses are all still unwritten, so comparing on
 * written topics alone reported Data Engineer as having one topic Backend does
 * not — which is the opposite of true.
 */
export function coversForRoadmap(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/<script type="application\/json" id="rgGraph">([\s\S]*?)<\/script>/);
  if (!m) return [];

  const dir = path.dirname(htmlPath);
  const out = new Map();

  for (const n of JSON.parse(m[1]).nodes || []) {
    if (!n.href) continue;
    const [file, frag] = n.href.split('#');
    // the fragment matters: eight sections of sql.html are eight distinct topics
    const key = path.normalize(path.join(dir, file)).replace(/\\/g, '/') + (frag ? '#' + frag : '');
    if (!out.has(key)) out.set(key, n.t);
  }
  return [...out.entries()].map(([key, label]) => ({ key, label }));
}

export function topicsForRoadmap(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/<script type="application\/json" id="rgGraph">([\s\S]*?)<\/script>/);
  if (!m) return [];

  const index = topicIndex();
  const dir = path.dirname(htmlPath);
  const found = new Set();

  for (const n of JSON.parse(m[1]).nodes || []) {
    // a soon node has no page yet, so nothing to complete
    if (!n.href || n.status === 'soon') continue;
    const rel = path.join(dir, n.href.split('#')[0]).replace(/\\/g, '/');
    const topic = index.get(path.normalize(rel).replace(/\\/g, '/'));
    if (topic) found.add(topic);
  }
  return [...found].sort();
}
