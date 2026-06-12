import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
broken = []
checked = 0

for hf in root.rglob("*.html"):
    text = hf.read_text(encoding="utf-8", errors="ignore")
    for m in re.finditer(r'href=["\']([^"#?][^"\']*)["\']', text):
        href = m.group(1)
        if href.startswith(("http://", "https://", "mailto:", "tel:", "javascript:")):
            continue
        checked += 1
        target = (hf.parent / href.split("?")[0]).resolve()
        if not target.exists():
            broken.append((str(hf.relative_to(root)), href))

print(f"checked {checked} internal links")
print(f"broken {len(broken)}")
for f, h in broken:
    print(f"  {f} -> {h}")
