"""Parse the 3 remaining acts that failed earlier."""
import fitz
import json
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

KB_DIR = 'kb-build/bare-acts'

def parse_sections_from_text(text):
    sections = []
    lines = text.split('\n')
    current = None
    for line in lines:
        stripped = line.strip()
        m = re.match(r'^(?:Section\s+)?(\d+[A-Za-z]?)\.\s+(.*)', stripped, re.IGNORECASE)
        if m:
            if current and current['text'].strip():
                sections.append({
                    'section': current['section'],
                    'title': current['title'].rstrip(': -').strip(),
                    'text': current['text'].strip()
                })
            current = {'section': m.group(1), 'title': m.group(2), 'text': ''}
        elif current is not None:
            current['text'] += line + '\n'
    if current and current['text'].strip():
        sections.append({
            'section': current['section'],
            'title': current['title'].rstrip(': -').strip(),
            'text': current['text'].strip()
        })
    return sections

acts = {
    'rera': ('Real Estate (Regulation and Development) Act, 2016', 'rera-2016.pdf'),
    'hindu-adoption-maintenance-act': ('Hindu Adoptions and Maintenance Act, 1956', 'hindu-adoption-maintenance-act-1956.pdf'),
    'hindu-minority-guardianship-act': ('Hindu Minority and Guardianship Act, 1956', 'hindu-minority-guardianship-act-1956.pdf'),
}

for act_id, (name, filename) in acts.items():
    filepath = os.path.join('kb-build/pdfs', filename)
    print(f'Processing {act_id}...')
    doc = fitz.open(filepath)
    full_text = ''
    for page in doc:
        full_text += page.get_text() + '\n'
    doc.close()

    sections = parse_sections_from_text(full_text)
    filtered = [s for s in sections if len(s['text']) >= 20 and (not s['section'].isdigit() or int(s['section']) <= 200)]

    act_dir = os.path.join(KB_DIR, act_id)
    sec_dir = os.path.join(act_dir, 'sections')
    os.makedirs(sec_dir, exist_ok=True)

    with open(os.path.join(act_dir, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump({'id': act_id, 'title': name, 'totalSections': len(filtered), 'source': 'pdf-ingestion'}, f, indent=2)

    with open(os.path.join(act_dir, '_sections.json'), 'w', encoding='utf-8') as f:
        json.dump([{'section': s['section'], 'title': s['title']} for s in filtered], f, indent=2)

    with open(os.path.join(act_dir, 'full.txt'), 'w', encoding='utf-8') as f:
        f.write(full_text)

    for s in filtered:
        sec_path = os.path.join(sec_dir, str(s['section']) + '.json')
        with open(sec_path, 'w', encoding='utf-8') as f:
            json.dump({'section': s['section'], 'title': s['title'], 'text': s['text']}, f, indent=2)

    print(f'  Sections: {len(filtered)}')
    print(f'  Written to {act_dir}')
