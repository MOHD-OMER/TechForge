<div align="center">

<img src="https://techforge-dev.vercel.app/assets/icon-512.png?v=3" width="96" height="96" alt="TechForge Logo" />

# TechForge

**Free, Interactive Computer Science Learning for Developers**

[![Live Site](https://img.shields.io/badge/Live%20Site-techforge--dev.vercel.app-00d4ff?style=flat-square&logo=vercel)](https://techforge-dev.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-7c3aed?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.0.0-green?style=flat-square)](RELEASES.md)
[![HTML5](https://img.shields.io/badge/Built%20with-HTML5%20%2F%20Vanilla%20JS-e34f26?style=flat-square&logo=html5)](https://techforge-dev.vercel.app)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-22c55e?style=flat-square)](#tech-stack)
[![PWA](https://img.shields.io/badge/PWA-Offline%20Ready-5a67d8?style=flat-square&logo=pwa)](https://techforge-dev.vercel.app)

**100% Static · Zero Build Step · Zero Backend · Security Hardened · Production Ready**

Programming Languages · DSA · System Design · Data & Cloud · OS & Networks · AI/ML · Interview Prep

</div>

---

## Overview

TechForge is a **fully static, zero-dependency computer science learning platform** with interactive Canvas visualizers, 200+ curated interview problems, and eight complete learning tracks — complete computer science from fundamentals to interview-ready.

Built entirely in **HTML5, CSS, and Vanilla JavaScript**, the platform runs completely in the browser with zero build toolchain, zero npm dependencies, and zero backend infrastructure. A Service Worker enables offline support: pages you've visited remain accessible without a network connection.

**Perfect for developers preparing for technical interviews, learning new topics, or reviewing fundamentals.**

<div align="center">
<img src="assets/og-image.png" alt="TechForge — Free Interactive CS Learning" width="100%" />
</div>

---

## Live Demo

**[techforge-dev.vercel.app](https://techforge-dev.vercel.app)**

| Track | Topics | URL |
|---|---|---|
| Data Structures & Algorithms | 29 topics · 28 Canvas visualizers | [/dsa](https://techforge-dev.vercel.app/dsa/index.html) |
| Programming | Python live (8 modules · 137 programs) · JS/Java/C++/HTML coming | [/programming](https://techforge-dev.vercel.app/programming/index.html) |
| System Design | 26 deep-dive guides · Flask · FastAPI · Django | [/system-design](https://techforge-dev.vercel.app/system-design/index.html) |
| Data & Cloud | 14 DB engines + 23 DevOps guides (databases + DevOps combined) | [/data-cloud](https://techforge-dev.vercel.app/data-cloud/index.html) |
| AI / ML | 8 modules · ML to GenAI | [/aiml](https://techforge-dev.vercel.app/aiml/index.html) |
| Interview Prep | 200+ problems · 7 question banks | [/interview](https://techforge-dev.vercel.app/interview/index.html) |
| OS & Networks | Operating systems + networking roadmaps · Security & Theory soon | [/systems](https://techforge-dev.vercel.app/systems/index.html) |

---

## ✨ Key Features

### Data Structures & Algorithms
- **29 in-depth topics** across 6 categories
- **28 interactive Canvas 2D visualizers** (every topic except Dynamic Programming)
- Comprehensive coverage: arrays, linked lists, stacks, queues, trees, graphs, hashing, sorting, searching, bit manipulation, sliding window, two pointer
- Big-O analysis and recommended learning paths
- Step-by-step algorithm execution with visual state

### Python Track
- **8 complete modules** from basics through async/await
- Covers: control flow, functions, OOP, collections, libraries, and concurrency patterns
- 50+ annotated practice programs
- Magic methods, decorators, comprehensions, asyncio patterns

### System Design
- **26 production-grade deep-dive guides**
- Topics: distributed systems, caching, Kafka, load balancing, microservices, rate limiting, consistency models, partitioning, replication
- Framework guides: Flask, FastAPI, Django (routing, ORM, auth, middleware, deployment)
- Real-world scenarios and trade-offs

### Databases
- **Full SQL reference** with queries, joins, subqueries, window functions, normalization
- **13 database deep-dives**: PostgreSQL, MySQL, Redis, MongoDB, Cassandra, DynamoDB, CouchDB, Neo4j, InfluxDB, Elasticsearch, MariaDB, SQLite, graph databases

### AI/ML Hub
- **8 comprehensive modules** spanning ML, Deep Learning, NLP, Computer Vision, RL, GenAI
- Clear analogies, real mathematics, visual intuition
- Data Science cheat sheet
- Interactive visualizations

### Interview Preparation
- **200+ curated problems** across 7 question banks
- Banks: DSA, Python, OOP, SQL, AI/ML, DevOps, System Design (OS & Networks banks coming)
- FAANG and startup tagged · Difficulty rated · Progress tracked in browser

### DevOps
- **23 comprehensive guides** covering the entire DevOps landscape
- Topics: Git, GitHub, Docker, Docker Compose, Kubernetes, Helm, CI/CD, Jenkins, GitHub Actions, Nginx, reverse proxy, Prometheus, Grafana, Terraform, Ansible, Linux, Bash, Infrastructure as Code
- Major cloud platforms: AWS, GCP, Azure

### Platform & UX
- **Instant search** (`Ctrl K` / `⌘K`) — jump to any topic across all eight tracks from a keyboard-driven command palette, no page reload
- **Light / dark theme toggle** — every page, preference persists via `localStorage`, applied before first paint to avoid flash
- **Branded loading screen** — animated splash on load, so opening the app never shows a blank flash
- **Progress tracking** — mark topics and interview questions complete, saved in the browser

### Progressive Web App
- **Service Worker** (`sw.js`) with network-first HTML caching and cache-first asset strategy
- **Offline fallback** with custom `offline.html` error page
- **Installable** on mobile and desktop via `manifest.json`
- **192×512 + maskable icons** for home screen and splash screens across Android/iOS

---

## 🛠 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Markup** | HTML5 | Semantic, accessible, universally supported |
| **Styles** | CSS custom properties | Single design system via `forge_base.css`, zero runtime overhead |
| **Interactivity** | Vanilla JavaScript | Canvas 2D for all visualizations; no framework overhead |
| **PWA** | Service Worker + `offline.html` | Network-first HTML, cache-first assets, graceful offline fallback |
| **Typography** | IBM Plex Sans · JetBrains Mono | Professional reading experience, technical code clarity |
| **Icons** | Tabler Icons webfont | Consistent line-icon system, no emoji rendering differences |
| **Deployment** | Vercel (static) | Zero-config, global CDN, instant deploys, auto HTTPS, security headers |

**Zero npm packages · Zero build toolchain · Zero runtime dependencies · 100% vanilla**

---

## 📦 Project Structure

```
TechForge/
├── index.html                    # Home page with hero visualizer
├── about.html                    # About & open-source info
├── offline.html                  # PWA offline fallback (Vercel)
├── 404.html                      # Branded 404 error page (Vercel)
├── sw.js                         # Service Worker — offline support
├── manifest.json                 # PWA metadata & icons
├── robots.txt                    # SEO crawler directives
├── sitemap.xml                   # Generated sitemap
├── vercel.json                   # Deployment config — headers, CSP, redirects, caching
│
├── assets/
│   ├── css/
│   │   ├── forge_base.css        # Global design system, CSS variables, typography
│   │   ├── lesson.css            # Unified lesson page styles
│   │   ├── platform.css          # Progress tracking, bookmarks, scroll-spy
│   │   ├── hub.css               # Section hub page styles
│   │   ├── dsa.css               # DSA-specific visualizer styles
│   │   ├── aiml-lesson.css       # AI/ML lesson styles
│   │   └── aiml-overview.css     # AI/ML section overview
│   ├── js/
│   │   ├── platform.js           # Progress tracking, bookmarks, reading time
│   │   ├── utils.js              # Shared utilities, theme toggle, canvas helpers
│   │   ├── search-modal.js       # Ctrl K / ⌘K instant search command palette
│   │   ├── topics-manifest.js    # Canonical topic registry (single source of truth)
│   │   ├── site-index.js         # Client-side full-site search index
│   │   └── aiml-viz.js           # AI/ML interactive visualizations
│   ├── favicon.svg               # SVG favicon (all formats)
│   ├── icon-192.png / icon-512.png         # PWA home screen / splash icons
│   ├── icon-192-maskable.png / icon-512-maskable.png  # Android adaptive icons
│   └── og-image.png              # Open Graph social preview (1200×630)
│
├── dsa/                          # Data Structures & Algorithms (29 topics)
├── programming/                  # Programming Languages hub
│   └── python/                   # Python (8 modules · 137 programs)
├── system-design/                # System Design (26 guides)
├── databases/                    # Databases (14 deep-dives)  ┐ Data & Cloud
├── aiml/                         # AI/ML Hub (8 modules)
├── interview/                    # Interview Prep (7 banks, 200+ problems)
├── devops/                       # DevOps (23 guides)         ┘ (data-cloud/ hub)
├── systems/                      # OS & Networks (os/ + networking/ roadmaps)
│
├── tools/                        # Build & utility scripts
│   ├── build-site-index.mjs      # Generate site-index.js
│   ├── generate-sitemap.mjs      # Generate sitemap.xml
│   ├── sync-all-pages.mjs        # Cross-page metadata sync
│   └── topic-content.json        # Content registry
│
├── .github/
│   └── workflows/
│       └── ci.yml                # GitHub Actions CI — HTML validation + link checking
│
├── LICENSE                       # MIT License
└── README.md                     # This file
```

---

## 🚀 Getting Started

### Run Locally

No installation required. Any static file server works.

**Python (Recommended)**
```bash
git clone https://github.com/MOHD-OMER/TechForge.git
cd TechForge
python -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080).

**Node.js**
```bash
npx serve .
```

**VS Code / Cursor**
Install the **Live Server** extension and open `index.html`.

> **Note**: The Service Worker only activates over `http://` or `https://`. Opening `index.html` as a `file://` URL will not register the Service Worker.

---

## 🔒 Security & Performance

### Security Headers (vercel.json)
- **X-Content-Type-Options**: nosniff (MIME type sniffing protection)
- **X-Frame-Options**: DENY (clickjacking prevention)
- **Referrer-Policy**: strict-origin-when-cross-origin (referrer leakage protection)
- **Permissions-Policy**: camera=(), microphone=(), geolocation=() (disable invasive APIs)
- **Content-Security-Policy**: Strict whitelist for scripts, styles, fonts, manifests

### Performance Optimizations
- **Immutable asset caching**: `/assets/*` cached for 1 year with explicit `?v=N` versioning
- **Network-first HTML**: Always fetch fresh pages, fall back to cache
- **Cache-first assets**: Use cached assets, fall back to network
- **Zero external JavaScript**: No third-party scripts or bundles
- **Minified CSS/JS**: Optimized for fast loading
- **Vercel global CDN**: Geographic distribution, instant cache invalidation

### Validation
- **100% HTML validation** (all 126 files pass Nu validator)
- **5,300+ links verified** (Lychee link checker in GitHub Actions)
- **WCAG 2.1 AA accessibility** target (semantic HTML, ARIA labels, keyboard navigation)

---

## 🚀 Deployment

### One-Click Vercel Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MOHD-OMER/TechForge)

### Manual Deployment

1. **Fork** this repository
2. Import the fork at [vercel.com/new](https://vercel.com/new)
3. Set **Framework Preset** to **Other**
4. Leave **Build Command** and **Output Directory** empty
5. Click **Deploy**

`vercel.json` automatically handles redirects, CSP headers, and asset caching.

### Deploy to Other Platforms

TechForge is pure static HTML—drop it anywhere:
- **Netlify**: Drag & drop the folder or connect Git
- **GitHub Pages**: Enable in repository settings
- **AWS S3 + CloudFront**: Static hosting + CDN
- **Any web host**: Just copy the files

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

## 🐛 Reporting Issues

Open a [GitHub Issue](https://github.com/MOHD-OMER/TechForge/issues) with:

- **Page URL** or file path
- **Expected vs. actual behavior**
- **Browser and device** (Chrome 120 on macOS, Safari on iPhone 14, etc.)
- **Steps to reproduce**
- **Screenshot or screen recording** (if relevant)

Example:
> **Title**: Canvas visualizer crashes when switching modes  
> **URL**: /dsa/binarysearch.html  
> **Browser**: Chrome 120 on Windows 11  
> **Steps**:  
> 1. Open page  
> 2. Click "Run" button  
> 3. While animation is running, click mode dropdown  
> 4. Select "BFS"  
> **Expected**: Mode switches smoothly  
> **Actual**: Console error, visualizer freezes

---

## 📈 Roadmap

### v2.1.0 (Q3 2026)
- [ ] Cross-track progress dashboard
- [ ] Interview timed quiz mode
- [ ] Accessibility audit & WCAG 2.1 AA compliance
- [ ] Unit & E2E test suite (Jest + Playwright)

### v2.2.0 (Q4 2026)
- [ ] Code implementations (JavaScript, Java, C++ per DSA topic)
- [ ] Interview company tagging & company-specific guides
- [ ] Difficulty-based problem filtering
- [ ] Performance monitoring & analytics

### v2.3.0 (Q1 2027)
- [ ] Spaced repetition / flashcard system
- [ ] Interactive coding challenges with code editor
- [ ] Customizable learning paths
- [ ] "Review weak areas" recommendations

### v3.0.0 (Q2 2027)
- [ ] Community discussions (GitHub-backed comments)
- [ ] User contributions system (alternative explanations, examples)
- [ ] Mobile app wrapper (React Native / Flutter)
- [ ] Social sharing & referral system


---

## 📄 License

**MIT License** — See [LICENSE](LICENSE) for full text.

You are free to use, modify, and distribute TechForge. Attribution is appreciated but not required.

---

## 👤 Author

**Mohd Abdul Omer**  
CS (AI/ML) Engineer  

- **GitHub**: [@MOHD-OMER](https://github.com/MOHD-OMER)
- **Live Site**: [techforge-dev.vercel.app](https://techforge-dev.vercel.app)
- **Email**: Contact via GitHub

---

## ❤️ Acknowledgments

- **Tabler Icons**: Free, open-source icon library
- **IBM Plex**: Beautiful, accessible typefaces
- **Vercel**: Zero-cost, zero-config static hosting
- **The open-source community**: For inspiration and support

---

<div align="center">

**Built for developers, by developers.**

Complete computer science, one platform.

[⭐ Star this repo if TechForge helped you learn](https://github.com/MOHD-OMER/TechForge)

[🚀 Start Learning](https://techforge-dev.vercel.app)

</div>