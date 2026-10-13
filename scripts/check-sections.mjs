/**
 * Every learning section must be reachable from the front door.
 *
 * Adding a section touches a lot of places — its own sidebar, the topics
 * manifest, the search index, the sitemap, the roadmaps that point at it. Two
 * whole sections (frontend and data, seven lessons) shipped reachable only
 * through a roadmap node or search, because the home page and footer are the
 * two surfaces nothing regenerates.
 *
 * So this checks the ones a human has to remember:
 *   - the section hub exists
 *   - the home page links it (track grid or footer)
 *   - every topic the manifest claims has a real file
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadTopics() {
  const src = fs.readFileSync('assets/js/topics-manifest.js', 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window.TF_TOPICS || {};
}

const topics = loadTopics();
const home = fs.readFileSync('index.html', 'utf8');
const errors = [];

for (const [key, section] of Object.entries(topics)) {
  const hub = section.hub;
  if (!hub) { errors.push(`${key}: no hub declared in the manifest`); continue; }
  if (!fs.existsSync(hub)) { errors.push(`${key}: hub ${hub} does not exist`); continue; }

  /* A nested section counts as reachable through its parent: the Python hub is
     programming/python/index.html, and the home page links programming/. Walk
     up rather than demanding a direct link that would be redundant. */
  const routes = [hub];
  let dirUp = path.dirname(path.dirname(hub));
  while (dirUp && dirUp !== '.' && dirUp !== path.sep) {
    routes.push(`${dirUp.replace(/\\/g, '/')}/index.html`);
    dirUp = path.dirname(dirUp);
  }
  if (!routes.some((r) => home.includes(`href="${r}"`))) {
    errors.push(`${key}: nothing on the home page links ${hub} — add a track card or a footer link`);
  }

  const dir = path.dirname(hub);
  for (const cat of section.categories || []) {
    for (const t of cat.topics || []) {
      const file = path.join(dir, t.file);
      if (!fs.existsSync(file)) errors.push(`${key}: manifest lists ${t.file}, but ${file} is missing`);
    }
  }
}

if (errors.length) {
  console.log('Sections not fully wired up:\n');
  errors.forEach((e) => console.log('  ' + e));
  console.log(`\n${errors.length} problem(s)`);
  process.exit(1);
}
console.log(`  ok  ${Object.keys(topics).length} sections, all linked from the home page`);
