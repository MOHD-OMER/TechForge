/**
 * The one place a roadmap's headline counts are computed.
 *
 * The directory page advertises each roadmap ("16 steps · 69 topics"), and
 * those numbers were hand-written. They drifted: every card still read
 * "flow chart · N milestones" months after the flow chart was deleted, and the
 * counts were stale on all 21. Deriving them here means the directory cannot
 * disagree with the roadmap it links to, and validate-graphs fails the build
 * if someone edits one by hand.
 */
import fs from 'node:fs';

export function metaFor(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/<script type="application\/json" id="rgGraph">([\s\S]*?)<\/script>/);
  if (!m) return null;

  const nodes = JSON.parse(m[1]).nodes || [];
  const steps = nodes.filter((n) => n.tier === 'spine').length;
  const topics = nodes.length - steps;
  const soon = nodes.filter((n) => n.status === 'soon').length;

  return `${steps} steps · ${topics} topics` + (soon ? ` · ${soon} coming soon` : '');
}
