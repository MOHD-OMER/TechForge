# -*- coding: utf-8 -*-
"""Standardize TechForge HTML head (fonts, viewport, theme-color) and topbar Git nav."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent

CANONICAL_FONT = (
    '<link href="https://fonts.googleapis.com/css2?family='
    'JetBrains+Mono:wght@400;500;600;700&family='
    'Syne:wght@400;500;600;700;800&family='
    'DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400'
    '&display=swap" rel="stylesheet"/>'
)

PRECONNECT = """  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>"""

FONT_RE = re.compile(
    r'<link[^>]+href="https://fonts\.googleapis\.com/css2\?family=[^"]+"[^>]*>',
    re.I,
)

VIEWPORT_RE = re.compile(
    r'<meta\s+name="viewport"\s+content="[^"]*"\s*/?>',
    re.I,
)
CANONICAL_VIEWPORT = '<meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>'

THEME_COLOR = '<meta name="theme-color" content="#030508"/>'

# Interview → About without Git in between (../ prefix paths)
GIT_BEFORE_ABOUT = re.compile(
    r'(<a class="tb-link" href="\.\./interview/index\.html">Interview Q&amp;A</a>\s*\n)'
    r'(\s*<a class="tb-link" href="\.\./about\.html">About</a>)',
    re.I,
)
GIT_REPLACEMENT = r'\1    <a class="tb-link" href="../git/index.html">Git</a>\n\2'


def depth_from_root(path: Path) -> int:
    return len(path.relative_to(ROOT).parts) - 1


def standardize_file(path: Path) -> list[str]:
    changes = []
    text = path.read_text(encoding="utf-8")
    original = text

    # Viewport
    if VIEWPORT_RE.search(text):
        new_viewport = VIEWPORT_RE.sub(CANONICAL_VIEWPORT, text, count=1)
        if new_viewport != text:
            text = new_viewport
            changes.append("viewport")
    else:
        text = text.replace("<head>", "<head>\n" + CANONICAL_VIEWPORT, 1)
        changes.append("viewport-added")

    # Theme color
    if "theme-color" not in text:
        text = text.replace(CANONICAL_VIEWPORT, CANONICAL_VIEWPORT + "\n" + THEME_COLOR, 1)
        changes.append("theme-color")

    # Fonts
    if FONT_RE.search(text):
        text = FONT_RE.sub(CANONICAL_FONT, text, count=1)
        changes.append("fonts")
    elif "forge_base.css" in text and "fonts.googleapis.com/css2" not in text:
        # e.g. interview/interview.html — insert after preconnect or before forge_base
        if "fonts.gstatic.com" in text:
            text = text.replace(
                '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>',
                '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>\n  ' + CANONICAL_FONT,
                1,
            )
        else:
            text = text.replace(
                '<link rel="stylesheet" href="../assets/css/forge_base.css?v=3">',
                PRECONNECT + "\n  " + CANONICAL_FONT + '\n  <link rel="stylesheet" href="../assets/css/forge_base.css?v=3">',
                1,
            )
        changes.append("fonts-added")

    # Ensure preconnect when fonts present
    if "fonts.googleapis.com/css2" in text and "fonts.gstatic.com" not in text:
        text = text.replace(
            CANONICAL_FONT,
            PRECONNECT + "\n  " + CANONICAL_FONT,
            1,
        )
        changes.append("preconnect")

    # Git nav link when Interview → About skips Git (skip git/index.html itself)
    is_git_index = path.parent.name == "git" and path.name == "index.html"
    if not is_git_index and GIT_BEFORE_ABOUT.search(text):
        text = GIT_BEFORE_ABOUT.sub(GIT_REPLACEMENT, text, count=1)
        changes.append("git-nav")

    if text != original:
        path.write_text(text, encoding="utf-8")

    return changes


def main():
    html_files = sorted(ROOT.rglob("*.html"))
    summary = {}
    for f in html_files:
        if "node_modules" in f.parts:
            continue
        ch = standardize_file(f)
        if ch:
            summary[str(f.relative_to(ROOT))] = ch

    print(f"Updated {len(summary)} files:")
    for rel, ch in summary.items():
        print(f"  {rel}: {', '.join(ch)}")


if __name__ == "__main__":
    main()
