# Release Notes

All notable changes to TechForge. Full tagged releases live on
[GitHub Releases](https://github.com/MOHD-OMER/TechForge/releases).

---

## v3.0.0 — Roadmaps, four new language tracks, and the Systems pillar

**2026-07-28** · 102 commits since v2.0.0 · 272 files changed · 109 new pages

The release that made TechForge navigable. Every subject now has a roadmap you can
follow, four more languages joined Python, and the OS & Networks section went from
an idea to 32 finished guides.

### Roadmaps

- **21 roadmaps on one renderer** — 14 topic roadmaps (DSA, Python, JavaScript,
  TypeScript, Java, C++, OS, Networking, Security, Theory, System Design,
  Databases, DevOps, AI/ML) and 7 career paths (Frontend, Backend, Full Stack,
  DSA & Interview Prep, CS Fundamentals, DevOps & Cloud, AI/ML Engineer).
- **A spine-and-branches flow chart** — the trunk is the order to learn in,
  branches are the optional detours, and every node opens a real lesson. Sub-items
  share one bus trunk instead of a diagonal per child, so a 50-node roadmap still
  reads at a glance.
- **Prerequisites are real edges** — hovering a node lights the whole chain of
  steps that come before it.
- **Generated, not hand-written** — `tools/build-roadmaps.mjs` builds every
  roadmap from the site's own pages and section headings, so a roadmap cannot
  drift from the lessons it points at.
- **Statically validated** — `npm run validate:graphs` checks every graph for
  cycles, dangling prerequisites, duplicate ids, illegal rank overrides and dead
  links before it can ship.
- **A roadmap directory** at `/roadmaps/`, split into role-based and skill-based
  paths.
- **Every section hub links to its roadmap** — the hand-written "Recommended
  Learning Path" strips that duplicated it are gone.

### New content

- **Four language tracks** — JavaScript, TypeScript, Java and C++, each 8 modules
  plus a practice-programs page, matching the existing Python track.
- **The Systems pillar completed** — Operating Systems, Networking, Security and
  Theory of Computation, 8 guides each, with SVG diagrams, interview Q&A and
  quizzes on every page.
- **Six new interview banks** — JavaScript, Java, C++, OS, Networking and
  Security. The library is now **13 banks and 334 questions**, up from 7 banks.
- **C++ implementations across DSA** — a fourth language tab on all 28 topic
  pages, with your choice remembered.

### Study tools

- **Cross-track progress dashboard** (`/dashboard.html`) — one view of every
  track, bank and quiz.
- **Spaced repetition** — Leitner-box flashcards on all interview banks, with
  due-card resurfacing.
- **Timed MCQ quiz mode** — four options with distractors generated from the
  bank itself, 30s timer, streaks, and a stats summary with missed-answer review.
- **"Focus next"** — the dashboard ranks weak areas from flashcard boxes, quiz
  scores and track progress, and says why in plain language.

### Platform

- **Data & Cloud umbrella** — databases and DevOps under one section, with a
  restructured top nav across every page.
- **Motion pass** — press feedback on buttons, card lift on hover, and a nav
  underline wipe, all behind the reduced-motion guard.
- **CS universe map and count-up stats** on the homepage.
- **Search across the whole site** — `Ctrl K` / `⌘K` now indexes every page, not
  just topics.

### Accessibility

- **axe-core in CI** — every page audited in both themes on every push. The suite
  currently runs 234 pages × 2 themes = **468 audits, all clean**.
- Contrast state is expressed through surface colour, never by dimming text with
  `opacity` — a rule that came out of three real regressions this cycle.
- Reduced-motion guards on every animation added this release.

### Tooling

- `npm run validate:graphs` · `npm run a11y` · `npm run a11y:states` ·
  `npm run check:graph` · `npm run test:layout` · `npm run test:validator`
- **Fixed: the sitemap pointed at the wrong host.** `generate-sitemap.mjs` and
  `sync-all-pages.mjs` both used `tech-forge-dev.vercel.app` while every page
  canonical and `robots.txt` say `techforge-dev.vercel.app`.
- **Fixed: agent worktrees were being indexed.** The sitemap and site-index
  walkers descended into `.claude/`, adding 169 duplicate URLs and 169 phantom
  search results.

### Product

- **Design principle 4 changed.** "Zero dependencies" became *dependencies earn
  their place* — a library or build step is allowed where it materially improves
  learning. What does not bend: pages stay fast on mid-range hardware, work
  offline, and open straight from disk. The site is still static HTML, CSS and
  vanilla JS, because nothing has needed more yet.

---

## v2.0.0 — Production-grade platform

**2026-07-07** · [Full notes](https://github.com/MOHD-OMER/TechForge/releases/tag/v2.0.0)

Security headers and a strict CSP, PWA install and offline support, 100% HTML
validation across all 126 pages, a GitHub Actions pipeline running HTML
validation and a 5,300-link check, IBM Plex typography, and 3,400+ emoji replaced
with Tabler Icons.

---

## v1.2.0

**2026-07-02** · [Full notes](https://github.com/MOHD-OMER/TechForge/releases/tag/v1.2.0)

---

## v1.1.0

**2026-07-01** · [Full notes](https://github.com/MOHD-OMER/TechForge/releases/tag/v1.1.0)

---

## v1.0.0 — First public release

**2026-06-17** · [Full notes](https://github.com/MOHD-OMER/TechForge/releases/tag/v1.0.0)
