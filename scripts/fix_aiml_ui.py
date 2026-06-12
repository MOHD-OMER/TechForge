#!/usr/bin/env python3
"""Strip duplicate inline CSS from AIML lesson pages; use shared stylesheets."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AIML = ROOT / "aiml"

LESSON_FILES = [
    "ml.html",
    "dl.html",
    "nlp.html",
    "cv.html",
    "rl.html",
    "genai.html",
    "ds-cheatsheet.html",
]


def extract_root_rule(style: str) -> str:
    m = re.search(r":root\s*\{[^}]+\}", style, re.DOTALL)
    if m:
        return re.sub(r"\s+", " ", m.group(0).strip())
    return ":root { --accent: var(--purple); --accent-dim: var(--purple-dim); }"


def strip_lesson_styles(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    m = re.search(r"<style>(.*?)</style>", text, re.DOTALL)
    if not m:
        print(f"  skip (no style): {path.name}")
        return
    root = extract_root_rule(m.group(1))
    replacement = (
        '  <link rel="stylesheet" href="../assets/css/aiml-lesson.css?v=3">\n'
        "  <style>\n"
        f"    {root}\n"
        "  </style>"
    )
    text = text[: m.start()] + replacement + text[m.end() :]
    text = text.replace('  <link rel="stylesheet" href="../assets/css/dsa.css?v=3">\n', "")
    path.write_text(text, encoding="utf-8")
    print(f"  updated: {path.name}")


def fix_ai_html() -> None:
    path = AIML / "ai.html"
    text = path.read_text(encoding="utf-8")
    m = re.search(r"<style>(.*?)</style>", text, re.DOTALL)
    if not m:
        return
    replacement = (
        '  <link rel="stylesheet" href="../assets/css/aiml-lesson.css?v=3">\n'
        '  <link rel="stylesheet" href="../assets/css/aiml-overview.css?v=3">\n'
        "  <style>\n"
        "    :root { --accent: var(--purple); --accent-dim: var(--purple-dim); }\n"
        "  </style>"
    )
    text = text[: m.start()] + replacement + text[m.end() :]
    # Token fixes in markup
    text = text.replace('style="--bks-c:#ec4899"', 'style="--bks-c:var(--pink)"')
    text = text.replace('style="color:#ec4899"', 'style="color:var(--pink)"')
    text = text.replace("<div class=\"tb-logo-icon\">⬡</div>", '<div class="tb-logo-icon">&#x2b21;</div>')
    text = text.replace("<span>TECH</span>·FORGE", "<span>TECH</span>&#xb7;FORGE")
    path.write_text(text, encoding="utf-8")
    print("  updated: ai.html")


def fix_interview_redirect() -> None:
    path = ROOT / "interview" / "interview.html"
    path.write_text(
        """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="refresh" content="0; url=index.html">
  <link rel="canonical" href="index.html">
  <title>Interview Q&amp;A — TechForge</title>
  <script>location.replace("index.html");</script>
</head>
<body>
  <p><a href="index.html">Continue to Interview Q&amp;A Hub</a></p>
</body>
</html>
""",
        encoding="utf-8",
    )
    print("  updated: interview/interview.html (redirect)")


def main() -> None:
    print("AIML lesson pages:")
    for name in LESSON_FILES:
        strip_lesson_styles(AIML / name)
    print("AI overview:")
    fix_ai_html()
    print("Interview legacy:")
    fix_interview_redirect()
    print("Done.")


if __name__ == "__main__":
    main()
