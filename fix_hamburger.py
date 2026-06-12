import glob

files = glob.glob('**/*.html', recursive=True)
count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()
    if '\u22ee</button>' in content:
        new = content.replace('\u22ee</button>', '\u2630</button>')
        with open(f, 'w', encoding='utf-8') as fh:
            fh.write(new)
        count += 1
        print(f'Fixed: {f}')
print(f'\nDone — {count} files fixed.')
