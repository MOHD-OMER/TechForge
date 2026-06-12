"""Unify AIML sidebars, merge ai.html into aiml-explained, fix genai/dl layout."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AIML = ROOT / "aiml"

ai = (AIML / "ai.html").read_text(encoding="utf-8")

# Extract viz JS
full_viz = ai[ai.find("/* ── helpers ── */") : ai.find("/* Scroll animations */")].strip()
init_start = ai.find("/* ── INIT ── */")
init_end = ai.find("/* Scroll animations */", init_start)
init_block = ai[init_start:init_end].strip()
(ROOT / "assets/js/aiml-viz.js").write_text(full_viz + "\n\n" + init_block + "\n", encoding="utf-8")
print("Wrote aiml-viz.js")

LINKS = [
    ("aiml-explained.html", "Overview", "overview"),
    ("ml.html", "Machine Learning", "ml"),
    ("dl.html", "Deep Learning", "dl"),
    ("nlp.html", "Natural Language Processing", "nlp"),
    ("cv.html", "Computer Vision", "cv"),
    ("rl.html", "Reinforcement Learning", "rl"),
    ("genai.html", "Generative AI", "genai"),
    ("ds-cheatsheet.html", "DS &amp; AI Cheat Sheet", "ds"),
]


def sidebar(active: str) -> str:
    lines = [
        '    <div class="search-wrap">',
        '      <input class="search-input" id="searchInput" placeholder="Search sections&#x2026;" type="text" autocomplete="off"/>',
        "    </div>",
        '    <nav id="sidebarNav">',
        '      <div class="sidebar-label">AI / ML Modules</div>',
    ]
    for href, label, key in LINKS:
        cls = "sb-link active" if key == active else "sb-link"
        lines.append(f'      <a class="{cls}" href="{href}">{label}</a>')
    lines.append("    </nav>")
    return "\n".join(lines)


def sidebar_overview() -> str:
    extra = """      <div class="sidebar-label" style="margin-top:20px;">On This Page</div>
      <a class="sb-link" href="#stats">At a Glance</a>
      <a class="sb-link" href="#path">Learning Path</a>
      <a class="sb-link" href="#modules">All Modules</a>
      <a class="sb-link" href="#visualizations">Live Visualizations</a>"""
    return sidebar("overview").replace("    </nav>", extra + "\n    </nav>")


for page, active in [
    ("ml.html", "ml"),
    ("dl.html", "dl"),
    ("nlp.html", "nlp"),
    ("cv.html", "cv"),
    ("rl.html", "rl"),
    ("genai.html", "genai"),
    ("ds-cheatsheet.html", "ds"),
]:
    p = AIML / page
    text = p.read_text(encoding="utf-8")
    text = re.sub(
        r'    <div class="search-wrap">.*?    </nav>\s*',
        sidebar(active) + "\n",
        text,
        count=1,
        flags=re.DOTALL,
    )
    text = text.replace('href="ai.html"', 'href="aiml-explained.html"')
    if '<main class="main" id="mainContent">' not in text:
        text = re.sub(
            r"(  </aside>\s*\n\s*\n)(    <div class=\"aim-hero\")",
            r'  </aside>\n\n  <main class="main" id="mainContent">\n\n\1\2',
            text,
            count=1,
        )
    if '<div class="page">' not in text:
        text = text.replace("\n  </div><!-- /page -->\n", "\n")
    p.write_text(text, encoding="utf-8")
    print("Updated", page)

# aiml-explained
p = AIML / "aiml-explained.html"
text = p.read_text(encoding="utf-8")
text = re.sub(
    r'    <div class="search-wrap">.*?    </nav>\s*',
    sidebar_overview() + "\n",
    text,
    count=1,
    flags=re.DOTALL,
)
text = text.replace('href="ai.html"', 'href="ml.html"')
text = text.replace("Start with AI Overview", "Start with Machine Learning")
text = text.replace(
    '<span class="aim-step-num">00</span>\n          <span class="aim-step-name">Machine Learning</span>',
    '<span class="aim-step-num">01</span>\n          <span class="aim-step-name">Machine Learning</span>',
)
# Remove duplicate first module card (AI foundations) if still pointing to ml after replace
text = re.sub(
    r'\n        <a class="aim-card" href="ml\.html" style="--card-c:var\(--purple\)">.*?</a>\n\n        <a class="aim-card" href="ml\.html"',
    '\n        <a class="aim-card" href="ml.html"',
    text,
    count=1,
    flags=re.DOTALL,
)
if "aiml-overview.css" not in text:
    text = text.replace(
        '  <link rel="stylesheet" href="../assets/css/forge_base.css?v=3">',
        '  <link rel="stylesheet" href="../assets/css/forge_base.css?v=3">\n'
        '  <link rel="stylesheet" href="../assets/css/aiml-lesson.css?v=3">\n'
        '  <link rel="stylesheet" href="../assets/css/aiml-overview.css?v=3">',
    )
text = text.replace('  <link rel="stylesheet" href="../assets/css/dsa.css?v=3">\n', "")
if 'id="visualizations"' not in text:
    viz_html = ai[
        ai.find("<!-- LIVE VISUALIZATIONS -->") : ai.find("</main>", ai.find("<!-- LIVE VISUALIZATIONS -->"))
    ].strip()
    text = text.replace("  </main>", viz_html + "\n\n  </main>", 1)
if "aiml-viz.js" not in text:
    text = text.replace(
        '<script src="../assets/js/utils.js?v=3"></script>',
        '<script src="../assets/js/utils.js?v=3"></script>\n<script src="../assets/js/aiml-viz.js?v=3"></script>',
    )
text = re.sub(r"\nconst ML_QUIZ = \[.*?(?=</script>\n</body>)", "\n", text, flags=re.DOTALL)
p.write_text(text, encoding="utf-8")
print("Updated aiml-explained.html")

(AIML / "ai.html").write_text(
    """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=aiml-explained.html#visualizations">
  <link rel="canonical" href="aiml-explained.html">
  <title>AI / ML Overview — TechForge</title>
</head>
<body>
  <p>Redirecting to <a href="aiml-explained.html#visualizations">AI/ML Overview</a>.</p>
</body>
</html>
""",
    encoding="utf-8",
)
print("Replaced ai.html with redirect")
