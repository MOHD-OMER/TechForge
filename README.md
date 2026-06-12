<div align="center">

<img src="assets/favicon.svg" width="64" height="64" alt="TechForge Logo" />

# TechForge

**Free, interactive computer science learning — built for developers who want to understand, not just memorize.**

[![Live Site](https://img.shields.io/badge/Live%20Site-tech--forge--dev.vercel.app-00d4ff?style=flat-square&logo=vercel)](https://tech-forge-dev.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-7c3aed?style=flat-square)](LICENSE)
[![HTML5](https://img.shields.io/badge/Built%20with-HTML5%20%2F%20Vanilla%20JS-e34f26?style=flat-square&logo=html5)](https://tech-forge-dev.vercel.app)
[![No Dependencies](https://img.shields.io/badge/Dependencies-Zero-22c55e?style=flat-square)](#tech-stack)

DSA visualizations · Python reference · Backend guides · SQL & MongoDB · AI/ML hub · Interview prep · Git workflows

</div>

---

## Overview

TechForge is a fully static, zero-dependency CS learning platform with live Canvas 2D animations for every data structure and algorithm, 200+ curated interview problems, and six complete learning tracks — all free, forever, with no account required.

It runs entirely in the browser. No build step, no npm, no backend.

---

## Live Demo

**[tech-forge-dev.vercel.app](https://tech-forge-dev.vercel.app)**

| Track | URL |
|---|---|
| Data Structures & Algorithms | [/dsa](https://tech-forge-dev.vercel.app/dsa/index.html) |
| Python | [/python](https://tech-forge-dev.vercel.app/python/index.html) |
| Backend (Flask · FastAPI · Django) | [/backend](https://tech-forge-dev.vercel.app/backend/index.html) |
| SQL & MongoDB | [/sql](https://tech-forge-dev.vercel.app/sql/index.html) |
| AI / ML | [/aiml](https://tech-forge-dev.vercel.app/aiml/aiml-explained.html) |
| Interview Prep | [/interview](https://tech-forge-dev.vercel.app/interview/index.html) |
| Git & GitHub | [/git](https://tech-forge-dev.vercel.app/git/index.html) |

---

## Features

### Data Structures & Algorithms
- 29 topics across 6 categories — foundations through advanced
- Live Canvas 2D animations at 60fps for every data structure and algorithm
- Big-O time and space complexity breakdown per topic
- Sorting and data structure complexity reference tables
- Recommended learning path from beginner to interview-ready

### Python Track
- Complete language reference: basics, control flow, functions, OOP, collections, libraries
- Magic methods, decorators, comprehensions, async, and DSA patterns in Python
- 50+ practice programs with annotated solutions

### Backend Track
- Production-ready guides for Flask, FastAPI, and Django
- Routing, ORM, auth, middleware, and deployment patterns
- Side-by-side framework comparisons

### SQL & NoSQL
- Full SQL reference: queries, joins, subqueries, window functions, normalization
- MongoDB fundamentals alongside relational concepts
- 12 topic sections with real query examples

### AI / ML Hub
- Eight modules: ML, Deep Learning, NLP, Computer Vision, RL, GenAI, Data Science cheat sheet
- Clear analogies and real math — no hand-waving
- Live demos and visual intuition for core concepts

### Interview Prep
- 200+ curated problems across DSA, Python, OOP, SQL, and AI/ML
- FAANG and startup tags on every problem
- Progress tracked in localStorage — no account, no server, no data leaves your device
- Live search and difficulty filters

### Git & GitHub Guide
- Practical workflows, branching strategies, and team patterns
- Common command reference with real-world context

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Markup | HTML5 | Semantic, accessible, universally supported |
| Styles | CSS custom properties | Single design system via `forge_base.css`, zero runtime |
| Scripts | Vanilla JavaScript | Canvas 2D API for animations; no framework overhead |
| Fonts | Google Fonts (Syne, DM Sans, JetBrains Mono) | Clean reading experience across all devices |
| Deploy | Vercel (static) | Zero-config, global CDN, instant redeploys on push |

**Zero npm packages. Zero build toolchain. Zero runtime dependencies.**

---

## Project Structure

```
TechForge/
├── index.html                  # Home page
├── about.html                  # About & open-source info
├── vercel.json                 # Deploy config (redirects, cache headers)
│
├── assets/
│   ├── css/
│   │   ├── forge_base.css      # Global design system & CSS variables
│   │   ├── aiml-lesson.css     # AI/ML lesson page styles
│   │   └── aiml-overview.css   # AI/ML overview page styles
│   ├── js/
│   │   ├── utils.js            # Shared utilities (search, progress, clipboard)
│   │   └── aiml-viz.js         # AI/ML interactive visualizations
│   └── favicon.svg
│
├── dsa/                        # 29 DSA topics with canvas animations
├── python/                     # 8 Python learning modules
├── backend/                    # Flask, FastAPI, Django guides
├── sql/                        # SQL reference + MongoDB
├── aiml/                       # 8 AI/ML modules
├── interview/                  # 6 interview question banks
├── git/                        # Git & GitHub guide
│
└── scripts/                    # Maintenance helpers (not part of the site)
    ├── check_links.py
    ├── standardize_ui.py
    └── ...
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

**VS Code / Cursor** — Install the "Live Server" extension and open `index.html`.

---

## Deploy Your Own

### Vercel (one click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/MOHD-OMER/TechForge)

Or manually:

1. Fork this repository
2. Import the fork at [vercel.com/new](https://vercel.com/new)
3. Set Framework Preset to **Other**
4. Leave Build Command and Output Directory empty
5. Deploy

`vercel.json` handles all redirects and asset caching automatically.

### Netlify / GitHub Pages

The site is plain static HTML — drop it into any static host. No build step, no configuration beyond pointing to the root.

---

## Contributing

Contributions are welcome. Whether you fix a typo, improve an animation, add an interview question, or document a new algorithm — thank you.

You do not need permission to open an issue or start a pull request.

### Quick Contribution Guide

**1. Fork and clone**
```bash
git clone https://github.com/YOUR_USERNAME/TechForge.git
cd TechForge
git remote add upstream https://github.com/MOHD-OMER/TechForge.git
```

**2. Create a branch**
```bash
git checkout -b fix/heap-sort-typo
# or: feat/add-merge-sort-quiz  |  docs/update-readme  |  a11y/improve-contrast
```

**3. Make your changes**
- Edit HTML, CSS, or JS directly
- Test locally: `python -m http.server 8080`
- Run the link checker: `python scripts/check_links.py`

**4. Commit and push**
```bash
git add .
git commit -m "fix(dsa): correct heapify loop bound in heap sort explanation"
git push origin fix/heap-sort-typo
```

**5. Open a pull request**
- Base: `MOHD-OMER/TechForge` → `main`
- Describe what changed and why
- Include screenshots for UI changes

### Development Guidelines

- Use CSS variables from `forge_base.css` — avoid inline colors (`var(--cyan)`, `var(--border)`, etc.)
- Match the sidebar and search markup patterns from sibling pages in the same section
- Test in Chrome and one mobile viewport before submitting
- One topic or fix per pull request when possible
- Do not commit API keys, secrets, or personal data
- No new build toolchain unless discussed in an issue first

### Ways to Contribute

- Fix bugs or broken links
- Improve explanations, code examples, or quiz questions
- Add Canvas animations to DSA topics that don't have them
- Expand interview question banks (with difficulty tags)
- Improve accessibility (contrast, keyboard navigation, ARIA)
- Translate content
- Update `scripts/` maintenance helpers

---

## Reporting Issues

Open a [GitHub Issue](https://github.com/MOHD-OMER/TechForge/issues) with:

- Page URL or file path
- What you expected vs. what happened
- Browser and device (for UI bugs)
- Screenshot or steps to reproduce

---

## Roadmap

- [ ] Add remaining DSA canvas animations (currently ~60% coverage)
- [ ] Expand Python track with async/await deep dive
- [ ] Add system design section
- [ ] Dark/light mode toggle
- [ ] Offline support via Service Worker
- [ ] More language options beyond Python (JavaScript, Java, C++)

---

## License

MIT — see [LICENSE](LICENSE) for details.

Free to use, modify, and distribute. Attribution appreciated but not required.

---

## Author

**Mohd Omer**
B.E. Computer Science & Engineering (AI/ML), Lords Institute of Engineering and Technology, Hyderabad

- GitHub: [@MOHD-OMER](https://github.com/MOHD-OMER)
- Live site: [tech-forge-dev.vercel.app](https://tech-forge-dev.vercel.app)

---

<div align="center">

Built for developers, by developers.
No ads. No paywalls. No tracking. Ever.

**[⭐ Star this repo if TechForge helped you learn](https://github.com/MOHD-OMER/TechForge)**

</div>