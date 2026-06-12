import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
css = (root / "assets/css/forge_base.css").read_text(encoding="utf-8")
css += (root / "assets/css/aiml-lesson.css").read_text(encoding="utf-8")
defined = set(re.findall(r"\.([a-zA-Z][\w-]*)", css))
classes = set()
for f in (root / "aiml").glob("*.html"):
    for m in re.finditer(r'class="([^"]+)"', f.read_text(encoding="utf-8")):
        for part in m.group(1).split():
            classes.add(part)
skip_prefix = ("sb-", "tb-", "mc-", "pn-", "si-", "diff-", "tag-", "ac-", "pb-", "b-", "cc-", "df-", "mp-", "hstat-", "cta-", "viz-", "card-", "hero-", "aim-", "bks-", "cheat-row-")
missing = sorted(
    x
    for x in classes
    if x not in defined
    and "-" in x
    and not x.startswith(skip_prefix)
    and x not in {"anim-in", "visible", "active", "correct", "wrong", "wide-card", "current"}
)
for m in missing:
    print(m)
