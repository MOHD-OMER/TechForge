from pathlib import Path

root = Path(__file__).resolve().parent.parent / "aiml"
replacements = [
    ('style="color:#a78bfa"', 'style="color:var(--purple)"'),
    ('style="color:#fbbf24"', 'style="color:var(--amber)"'),
    ('style="color:#60a5fa"', 'style="color:var(--blue)"'),
    ('style="color:#f87171"', 'style="color:var(--red)"'),
]
for f in root.glob("*.html"):
    if f.name == "aiml-explained.html":
        continue
    text = f.read_text(encoding="utf-8")
    original = text
    for old, new in replacements:
        text = text.replace(old, new)
    if text != original:
        f.write_text(text, encoding="utf-8")
        print(f"tokenized {f.name}")
