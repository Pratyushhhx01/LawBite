"""
Ingest Tier 1 + Tier 2 legal acts into S3 KB.
Downloads PDFs from official government sources, parses with PyMuPDF, structures into S3 KB format.
"""
import fitz
import json
import re
import os
import sys
import urllib.request
import ssl
import time

sys.stdout.reconfigure(encoding='utf-8')

# Disable SSL verification for government PDFs that may have cert issues
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

PDF_DIR = "kb-build/pdfs"
KB_DIR = "kb-build/bare-acts"

# Official government PDF sources
ACTS = {
    # Tier 1 - Critical
    "posh-act": {
        "name": "Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2104/1/A2013-14.pdf",
        "filename": "posh-act-2013.pdf",
    },
    "maternity-benefit-act": {
        "name": "Maternity Benefit Act, 1961",
        "url": "https://clc.gov.in/clc/sites/default/files/MATERNITY%20BENEFIT%20ACT.pdf",
        "filename": "maternity-benefit-act-1961.pdf",
    },
    "rera": {
        "name": "Real Estate (Regulation and Development) Act, 2016",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2158/3/A2016-16.pdf",
        "filename": "rera-2016.pdf",
    },
    "mental-healthcare-act": {
        "name": "Mental Healthcare Act, 2017",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2249/1/A2017-10.pdf",
        "filename": "mental-healthcare-act-2017.pdf",
    },
    "national-food-security-act": {
        "name": "National Food Security Act, 2013",
        "url": "https://dfpd.gov.in/WriteReadData/Other/nfsa_1.pdf",
        "filename": "national-food-security-act-2013.pdf",
    },
    "child-labour-act": {
        "name": "Child Labour (Prohibition and Regulation) Act, 1986",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/11220/1/child_labour_(regulation_and_abolition)_act,_1986.pdf",
        "filename": "child-labour-act-1986.pdf",
    },
    "larr-act": {
        "name": "Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/2121/1/A2013-30.pdf",
        "filename": "larr-act-2013.pdf",
    },
    "lokpal-act": {
        "name": "Lokpal and Lokayuktas Act, 2013",
        "url": "https://dopt.gov.in/sites/default/files/407_06_2013-AVD-IV-09012014_0.pdf",
        "filename": "lokpal-act-2013.pdf",
    },
    "rpwd-act": {
        "name": "Rights of Persons with Disabilities Act, 2016",
        "url": "https://prsindia.org/files/bills_acts/acts_parliament/2016/Rights_of_Persons_with_Disabilities_Act_2016.pdf",
        "filename": "rpwd-act-2016.pdf",
    },
    # Tier 2 - Personal Laws
    "hindu-marriage-act": {
        "name": "Hindu Marriage Act, 1955",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/13814/1/the_hindu_marriage_act,_1955.pdf",
        "filename": "hindu-marriage-act-1955.pdf",
    },
    "special-marriage-act": {
        "name": "Special Marriage Act, 1954",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/15480/1/special_marriage_act.pdf",
        "filename": "special-marriage-act-1954.pdf",
    },
    "hindu-adoption-maintenance-act": {
        "name": "Hindu Adoptions and Maintenance Act, 1956",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/12909/1/A1956-78.pdf",
        "filename": "hindu-adoption-maintenance-act-1956.pdf",
    },
    "hindu-minority-guardianship-act": {
        "name": "Hindu Minority and Guardianship Act, 1956",
        "url": "https://www.indiacode.nic.in/bitstream/123456789/12910/1/A1956-79.pdf",
        "filename": "hindu-minority-guardianship-act-1956.pdf",
    },
}


def download_pdf(url, filepath):
    """Download a PDF from URL."""
    if os.path.exists(filepath):
        print(f"  Already exists: {filepath}")
        return True
    try:
        print(f"  Downloading from {url[:80]}...")
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
            data = resp.read()
            with open(filepath, 'wb') as f:
                f.write(data)
        print(f"  Downloaded: {len(data)//1024}KB")
        return True
    except Exception as e:
        print(f"  Download failed: {e}")
        return False


def parse_sections_from_text(text):
    """Extract sections from legal text using common patterns."""
    sections = []
    # Pattern: "Section N." or "Section NTitle" at start of line
    pattern = re.compile(r'^(?:Section\s+)?(\d+[A-Za-z]?)\.\s+(.+)', re.MULTILINE)
    
    lines = text.split('\n')
    current = None
    
    for line in lines:
        stripped = line.strip()
        # Match section numbers
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


def process_act(act_id, act_info):
    """Download, parse, and structure an act into S3 KB format."""
    print(f"\n{'='*60}")
    print(f"Processing: {act_info['name']}")
    print(f"{'='*60}")
    
    # Download
    pdf_path = os.path.join(PDF_DIR, act_info['filename'])
    if not download_pdf(act_info['url'], pdf_path):
        return False
    
    # Parse PDF
    print("  Parsing PDF...")
    try:
        doc = fitz.open(pdf_path)
        page_count = doc.page_count
        full_text = ''
        for page in doc:
            full_text += page.get_text() + '\n'
        doc.close()
        print(f"  Pages: {page_count}, Characters: {len(full_text)}")
    except Exception as e:
        print(f"  PDF parse error: {e}")
        return False
    
    # Extract sections
    print("  Extracting sections...")
    sections = parse_sections_from_text(full_text)
    
    # Filter out obviously non-section entries (schedule items, etc.)
    filtered = []
    for s in sections:
        # Skip very short sections (likely parsing errors)
        if len(s['text']) < 20:
            continue
        # Skip if section number is too high (likely schedule items)
        if s['section'].isdigit() and int(s['section']) > 200:
            continue
        filtered.append(s)
    
    print(f"  Sections found: {len(sections)}, Filtered: {len(filtered)}")
    
    if len(filtered) == 0:
        print("  WARNING: No sections found, using full text only")
    
    # Create directory structure
    act_dir = os.path.join(KB_DIR, act_id)
    sec_dir = os.path.join(act_dir, 'sections')
    os.makedirs(sec_dir, exist_ok=True)
    
    # Write index.json
    with open(os.path.join(act_dir, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump({
            'id': act_id,
            'title': act_info['name'],
            'totalSections': len(filtered),
            'source': 'pdf-ingestion',
            'pdf': act_info['filename']
        }, f, indent=2)
    
    # Write _sections.json
    with open(os.path.join(act_dir, '_sections.json'), 'w', encoding='utf-8') as f:
        json.dump([{'section': s['section'], 'title': s['title']} for s in filtered], f, indent=2)
    
    # Write full.txt
    with open(os.path.join(act_dir, 'full.txt'), 'w', encoding='utf-8') as f:
        f.write(full_text)
    
    # Write individual section files
    for s in filtered:
        with open(os.path.join(sec_dir, f"{s['section']}.json"), 'w', encoding='utf-8') as f:
            json.dump({'section': s['section'], 'title': s['title'], 'text': s['text']}, f, indent=2)
    
    print(f"  Written to {act_dir}")
    print(f"  Section files: {len(filtered)}")
    return True


def main():
    os.makedirs(PDF_DIR, exist_ok=True)
    os.makedirs(KB_DIR, exist_ok=True)
    
    success = 0
    failed = 0
    
    for act_id, act_info in ACTS.items():
        if process_act(act_id, act_info):
            success += 1
        else:
            failed += 1
        time.sleep(1)  # Be polite to government servers
    
    print(f"\n{'='*60}")
    print(f"SUMMARY: {success} succeeded, {failed} failed")
    print(f"{'='*60}")
    
    # Print all act IDs for actMap update
    print("\nAct IDs for actMap:")
    for act_id in ACTS:
        print(f"  {act_id}")


if __name__ == '__main__':
    main()
