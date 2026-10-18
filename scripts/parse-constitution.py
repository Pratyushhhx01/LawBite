import fitz, json, re, os, sys
sys.stdout.reconfigure(encoding='utf-8')

doc = fitz.open('kb-build/pdfs/constitution.pdf')
page_count = doc.page_count
full_text = ''
for page in doc:
    full_text += page.get_text() + '\n'
doc.close()

print(f'Pages: {page_count}, Chars: {len(full_text)}')

articles = []
lines = full_text.split('\n')
current = None

for line in lines:
    stripped = line.strip()
    m = re.match(r'^[\d\s*\[]*(\d+[A-Za-z]?)\.\s+(.*)', stripped, re.IGNORECASE)
    if m:
        if current and current['text'].strip():
            articles.append({
                'section': current['section'],
                'title': current['title'].rstrip(': -').strip(),
                'text': current['text'].strip()
            })
        current = {'section': m.group(1), 'title': m.group(2), 'text': ''}
    elif current is not None:
        current['text'] += line + '\n'

if current and current['text'].strip():
    articles.append({
        'section': current['section'],
        'title': current['title'].rstrip(': -').strip(),
        'text': current['text'].strip()
    })

# Filter real articles
filtered = [a for a in articles if a['section'].isdigit() and int(a['section']) <= 400]
print(f'Articles found: {len(articles)}, Filtered: {len(filtered)}')

# Check for 370
a370 = [a for a in filtered if a['section'] == '370']
if a370:
    print(f'Article 370: {a370[0]["title"][:80]}')

# Write structure
act_dir = 'kb-build/bare-acts/constitution'
sec_dir = os.path.join(act_dir, 'sections')
os.makedirs(sec_dir, exist_ok=True)

with open(os.path.join(act_dir, 'index.json'), 'w', encoding='utf-8') as f:
    json.dump({'id': 'constitution', 'title': 'The Constitution of India', 'totalSections': len(filtered), 'source': 'pdf-ingestion'}, f, indent=2)

with open(os.path.join(act_dir, '_sections.json'), 'w', encoding='utf-8') as f:
    json.dump([{'section': a['section'], 'title': a['title']} for a in filtered], f, indent=2)

with open(os.path.join(act_dir, 'full.txt'), 'w', encoding='utf-8') as f:
    f.write(full_text)

for a in filtered:
    with open(os.path.join(sec_dir, a['section'] + '.json'), 'w', encoding='utf-8') as f:
        json.dump({'section': a['section'], 'title': a['title'], 'text': a['text']}, f, indent=2)

print(f'Written to {act_dir}')
