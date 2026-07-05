<div align="center">

<img src="assets/favicon.svg" width="52" height="52" alt="TechForge Logo" />

# TechForge

**Free, interactive computer science learning — built for developers who want to understand, not just memorize.**

[![Live Site](https://img.shields.io/badge/Live%20Site-tech--forge--dev.vercel.app-00d4ff?style=flat-square&logo=vercel)](https://tech-forge-dev.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-7c3aed?style=flat-square)](LICENSE)
[![HTML5](https://img.shields.io/badge/Built%20with-HTML5%20%2F%20Vanilla%20JS-e34f26?style=flat-square&logo=html5)](https://tech-forge-dev.vercel.app)
[![No Dependencies](https://img.shields.io/badge/Dependencies-Zero-22c55e?style=flat-square)](#tech-stack)
[![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-5a67d8?style=flat-square&logo=pwa)](https://tech-forge-dev.vercel.app)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/MOHD-OMER/TechForge)

DSA visualizations · Python reference · System design guides · SQL & MongoDB · AI/ML hub · Interview prep · DevOps

</div>

---

## Overview

TechForge is a fully static, zero-dependency CS learning platform with interactive Canvas visualizers for data structures and algorithms, 200+ curated interview problems, and seven complete learning tracks — all free, forever, with no account required.

It runs entirely in the browser. No build step, no npm, no backend. Includes a Service Worker for offline support — pages you've visited remain accessible without a network connection.

<div align="center">
<img src="assets/og-image.png" alt="TechForge — Free Interactive CS Learning" width="100%" />
</div>

---

## Live Demo

**[tech-forge-dev.vercel.app](https://tech-forge-dev.vercel.app)**

| Track | Topics | URL |
|---|---|---|
| Data Structures & Algorithms | 29 topics · 28 Canvas visualizers | [/dsa](https://tech-forge-dev.vercel.app/dsa/index.html) |
| Python | 8 modules · basics through async/await | [/python](https://tech-forge-dev.vercel.app/python/index.html) |
| System Design | 26 deep-dive guides · Flask · FastAPI · Django | [/system-design](https://tech-forge-dev.vercel.app/system-design/index.html) |
| Databases | 14 topics · SQL, NoSQL, and specialized stores | [/databases](https://tech-forge-dev.vercel.app/databases/index.html) |
| AI / ML | 8 modules · ML to GenAI | [/aiml](https://tech-forge-dev.vercel.app/aiml/index.html) |
| Interview Prep | 200+ problems · 7 question banks | [/interview](https://tech-forge-dev.vercel.app/interview/index.html) |
| DevOps | 23 guides · Docker · K8s · CI/CD · Cloud | [/devops](https://tech-forge-dev.vercel.app/devops/index.html) |

---

## Features

**Data Structures & Algorithms** — 29 topics across 6 categories, 28 with interactive Canvas 2D visualizers (every topic except Dynamic Programming, which uses a dedicated grid table for its LCS matrix). Covers arrays, linked lists (singly, doubly, circular), stacks, queues, trees, graphs, hashing, sorting, searching, sliding window, two pointer, bit manipulation, and more. Big-O analysis for every topic and a recommended learning path from beginner to interview-ready.

**Python Track** — Complete language reference covering basics, control flow, functions, OOP, collections, libraries, and async/await concurrency. Includes magic methods, decorators, comprehensions, asyncio patterns, and 50+ annotated practice programs.

**System Design** — 26 production-grade guides covering distributed systems, caching, Kafka, load balancing, microservices, rate limiting, and more. Includes deep-dive guides for Flask, FastAPI, and Django with routing, ORM, auth, middleware, and deployment.

**Databases** — Full SQL reference with queries, joins, subqueries, window functions, and normalization. Plus 13 database deep-dives covering PostgreSQL, MySQL, Redis, MongoDB, Cassandra, DynamoDB, CouchDB, Neo4j, InfluxDB, Elasticsearch, MariaDB, SQLite, and graph databases.

**AI / ML Hub** — Eight modules spanning ML, Deep Learning, NLP, Computer Vision, RL, GenAI, and a Data Science cheat sheet. Clear analogies, real math, live demos, and visual intuition — no hand-waving. Dedicated hub page at `/aiml/index.html`.

**Interview Prep** — 200+ curated problems across 7 question banks: DSA, Python, OOP, SQL, AI/ML, DevOps, and System Design. FAANG and startup tagged, difficulty rated, progress tracked in the browser. No account, no server, no data leaves your device.

**DevOps** — 23 guides covering Git, GitHub, Docker, Docker Compose, Kubernetes, Helm, CI/CD, Jenkins, GitHub Actions, Nginx, reverse proxy, Prometheus, Grafana, Terraform, Ansible, Linux, Bash, Infrastructure as Code, and the major cloud platforms (AWS, GCP, Azure).

**Progressive Web App** — Service Worker (`sw.js`) enables offline access with a network-first strategy for HTML and cache-first for static assets. Custom offline fallback page (`offline.html`) displayed when navigation fails without a cache hit.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Markup | HTML5 | Semantic, accessible, universally supported |
| Styles | CSS custom properties | Single design system via `forge_base.css`, zero runtime |
| Scripts | Vanilla JavaScript | Canvas 2D API for all data structure and algorithm animations; no framework overhead |
| PWA | Service Worker + offline.html | Network-first HTML, cache-first assets, graceful offline fallback |
| Fonts | Google Fonts — IBM Plex Sans, JetBrains Mono | Clean reading experience across all devices |
| Icons | Tabler Icons webfont | Consistent line-icon system site-wide, no emoji rendering differences across platforms |
| Deploy | Vercel (static) | Zero-config, global CDN, instant redeploys on push |

> Zero npm packages. Zero build toolchain. Zero runtime dependencies.

---

## Project Structure

```
TechForge/
├── index.html                  # Home page
├── about.html                  # About & open-source info
├── offline.html                # PWA offline fallback page
├── sw.js                       # Service Worker — offline support
├── robots.txt                  # Crawler directives
├── sitemap.xml                 # Generated sitemap
├── vercel.json                 # Deploy config — redirects & cache headers
│
├── assets/
│   ├── css/
│   │   ├── forge_base.css      # Global design system & CSS variables
│   │   ├── lesson.css          # Unified lesson page styles
│   │   ├── platform.css        # Progress bar, bookmarks, scroll-spy
│   │   ├── hub.css             # Section hub page styles
│   │   ├── dsa.css             # DSA visualizer styles
│   │   ├── aiml-lesson.css     # AI/ML lesson page styles
│   │   └── aiml-overview.css   # AI/ML overview styles
│   ├── js/
│   │   ├── platform.js         # Progress tracking, bookmarks, read time
│   │   ├── utils.js            # Shared utilities (search, clipboard, ARIA, canvas bar helper)
│   │   ├── topics-manifest.js  # Canonical topic registry (single source of truth)
│   │   ├── site-index.js       # Site-wide search index
│   │   └── aiml-viz.js         # AI/ML interactive visualizations
│   ├── favicon.svg
│   └── og-image.png            # Open Graph social preview (1200×630)
│
├── dsa/                        # 29 DSA topics · 28 with Canvas 2D visualizers
├── python/                     # 8 Python modules (basics → async/await)
├── system-design/              # 26 system design + backend framework guides
├── databases/                  # 14 database deep-dives (SQL, NoSQL, specialized)
├── aiml/                       # 8 AI/ML modules + hub index
├── interview/                  # 7 interview question banks
├── devops/                     # 23 DevOps guides
└── tools/                      # Build scripts (sitemap, site-index, content sync)
    ├── build-site-index.mjs
    ├── generate-sitemap.mjs
    ├── sync-all-pages.mjs
    └── topic-content.json
```

---

## Run Locally

No install required. Any static file server works.

**Python (recommended)**
```bash
git clone https://github.com/MOHD-OMER/TechForge.git
cd TechForge
python -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080).

**Node**
```bash
npx serve .
```

**VS Code / Cursor** — Install the Live Server extension and open `index.html`.

> The Service Worker only activates over `http://` or `https://` — opening `index.html` directly as a `file://` URL will not register it.

---

## Deploy Your Own

### One-click Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MOHD-OMER/TechForge)

### Manual

1. Fork this repository
2. Import the fork at [vercel.com/new](https://vercel.com/new)
3. Set Framework Preset to **Other**
4. Leave Build Command and Output Directory empty
5. Deploy

`vercel.json` handles all redirects and asset caching automatically.

### Netlify / GitHub Pages

Plain static HTML — drop it into any static host. No build step, no configuration beyond pointing to the root directory.

---

## Contributing

Contributions are welcome. Whether you fix a typo, improve an animation, add an interview question, or document a new algorithm — thank you. You do not need permission to open an issue or start a pull request.

### Steps

**1. Fork and clone**
```bash
git clone https://github.com/YOUR_USERNAME/TechForge.git
cd TechForge
git remote add upstream https://github.com/MOHD-OMER/TechForge.git
```

**2. Create a branch**
```bash
git checkout -b fix/heap-sort-typo
# naming: fix/ · feat/ · docs/ · a11y/
```

**3. Make changes and test**
```bash
python -m http.server 8080
# open http://localhost:8080 and verify affected pages
```

**4. Commit and push**
```bash
git add .
git commit -m "fix(dsa): correct heapify loop bound in heap sort explanation"
git push origin fix/heap-sort-typo
```

**5. Open a pull request** to `MOHD-OMER/TechForge → main` with a description of what changed and why.

### Guidelines

- Use CSS variables from `forge_base.css` — never inline colors
- Match sidebar and search markup patterns from sibling pages
- Test in Chrome and one mobile viewport before submitting
- One topic or fix per pull request
- Do not commit API keys, secrets, or personal data

### Ways to help

- Fix bugs or broken links
- Improve explanations, code examples, or quiz questions
- Expand interview question banks (with difficulty tags)
- Improve accessibility — contrast, keyboard navigation, ARIA
- Add new topics, visualizers, or deep-dive guides

---

## Reporting Issues

Open a [GitHub Issue](https://github.com/MOHD-OMER/TechForge/issues) with the page URL or file path, what you expected vs. what happened, your browser and device, and a screenshot or steps to reproduce.

---

## Roadmap

- [ ] Additional language implementations (JavaScript, Java, C++) per DSA topic
- [ ] Full-site search powered by `site-index.js`
- [ ] Progress dashboard across all tracks

---

## Recent Updates

- **Dark / light mode toggle** — now live on every page. Theme persists via `localStorage`, applied pre-paint to avoid flash, synced across the whole site
- **Typography refresh** — site-wide switch to IBM Plex Sans (from Syne / DM Sans), font weights and letter-spacing recalibrated for the new letterforms
- **Icon system** — 3,400+ emojis replaced with the Tabler Icons webfont for consistent rendering across platforms; navigation, sidebars, section headers, and quiz feedback all use line icons now
- **Brand refresh** — new SVG logo mark rolled out to all pages
- **Cache correctness** — every CSS/JS asset reference is now explicitly versioned (`?v=`), fixing stale-cache bugs for returning visitors
- **DSA Canvas coverage complete** — 28 of 29 topics now have Canvas 2D visualizers (up from 17), including all linear data structures (queue, stack, singly/doubly/circular linked lists), arrays, bitwise operations, linear search, binary search, sliding window, and two pointer. Dynamic Programming intentionally kept as a grid table (better fit for its LCS matrix than canvas)
- **Bug fixes across DSA visualizers** — binary search loop failing to run due to a state race condition; linear search, two pointer, and dynamic programming "Run" buttons permanently locking after a successful first run
- **PWA / Offline support** — Service Worker (`sw.js`) + `offline.html` added; network-first HTML caching with graceful offline fallback
- **Python Async/Await** — New deep-dive module covering asyncio, coroutines, tasks, and concurrency patterns
- **AI/ML hub page** — `aiml/index.html` added as a proper section landing page
- **System Design expanded** — 26 guides (added RabbitMQ, service discovery, consistency models, partitioning, replication, monolith, event-driven, fault tolerance, high availability, scalability)
- **Databases expanded** — 14 topics (added CouchDB, Neo4j, InfluxDB, MariaDB, SQLite, graph databases)
- **Interview Prep** — System Design interview bank added (7 total question banks)
- **Topics manifest** — `topics-manifest.js` now the single source of truth for all topic metadata site-wide
- **Build tooling** — `tools/` directory with ESM scripts for sitemap generation, site-index building, and cross-page content sync

---

## License

MIT — see [LICENSE](LICENSE) for details. Free to use, modify, and distribute. Attribution appreciated but not required.

---

## Author

**Mohd Abdul Omer** — CS (AI/ML) Engineer

- GitHub: [@MOHD-OMER](https://github.com/MOHD-OMER)
- Live site: [tech-forge-dev.vercel.app](https://tech-forge-dev.vercel.app)

---

<div align="center">

Built for developers, by developers.<br/>
No ads. No paywalls. No tracking. Ever.

**[⭐ Star this repo if TechForge helped you learn](https://github.com/MOHD-OMER/TechForge)**

</div>