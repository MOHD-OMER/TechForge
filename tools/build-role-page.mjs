/**
 * Generate a role-based roadmap page from an existing one.
 *
 * Every roadmap page is the same shell — topbar, breadcrumb, header, an empty
 * #rgMount and the graph JSON. Rather than keep 18 near-identical files in
 * sync by hand, this clones roadmaps/paths/frontend.html and swaps the parts
 * that differ. The renderer and every gate already treat them identically.
 *
 *   node tools/build-role-page.mjs <spec.json>
 *
 * spec: { file, title, accent, subtitle, graph }  (graph = path to graph JSON)
 */
import fs from 'node:fs';
import path from 'node:path';

const TEMPLATE = 'roadmaps/paths/frontend.html';

function build(spec) {
  const graph = spec.graph ? JSON.parse(fs.readFileSync(spec.graph, 'utf8')) : spec.graphData;
  let html = fs.readFileSync(TEMPLATE, 'utf8');

  const n = graph.nodes;
  const steps = n.filter((x) => x.tier === 'spine').length;
  const soon = n.filter((x) => x.status === 'soon').length;
  const count = `${steps} steps · ${n.length - steps} topics` + (soon ? ` · ${soon} coming soon` : '');
  const plain = spec.subtitle.replace(/<[^>]+>/g, '').replace(/"/g, '&quot;');
  const slug = path.basename(spec.file, '.html');

  html = html
    .replace(/<title>[^<]*<\/title>/, `<title>${spec.title} Roadmap — TechForge</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${plain}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${plain}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${spec.title} Roadmap — TechForge$2`)
    .replace(/(<link rel="canonical" href="https:\/\/techforge-dev\.vercel\.app\/roadmaps\/paths\/)[^"]*(")/,
      `$1${slug}.html$2`)
    .replace(/<h1 class="rt-h1">[^<]*<\/h1>/, `<h1 class="rt-h1">${spec.title}</h1>`)
    .replace(/<p class="rt-sub">[\s\S]*?<\/p>/, `<p class="rt-sub">${spec.subtitle}</p>`)
    .replace(/<div class="rt-count">[^<]*<\/div>/, `<div class="rt-count">${count}</div>`)
    .replace(/(<script type="application\/json" id="rgGraph">)[\s\S]*?(<\/script>)/,
      (_, a, b) => a + '\n' + JSON.stringify(graph, null, 2) + '\n' + b);

  fs.writeFileSync(spec.file, html);
  console.log(`  ${spec.file}: ${n.length} nodes — ${count}`);
}

const specs = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
(Array.isArray(specs) ? specs : [specs]).forEach(build);
