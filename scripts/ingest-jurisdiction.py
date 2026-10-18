#!/usr/bin/env python3
import os, sys, json, re, time, ssl, urllib.request, urllib.error
from pathlib import Path

KB_DIR = Path(__file__).resolve().parent.parent / "kb-build"
PDF_DIR = KB_DIR / "pdfs"
PDF_DIR.mkdir(parents=True, exist_ok=True)

def download_pdf(url, dest, retries=3):
    if dest.exists() and dest.stat().st_size > 1000:
        return True
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
                data = resp.read()
                if len(data) > 1000:
                    dest.write_bytes(data)
                    return True
                print(f"    WARN: Got only {len(data)} bytes, retrying...")
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, OSError) as e:
            print(f"    Attempt {attempt+1} failed: {e}")
            time.sleep(2 * (attempt + 1))
    return False

def detect_sections(text, act_id):
    lines = text.split("\n")
    sections = []
    current = None
    for line in lines:
        stripped = line.strip()
        m = re.match(r"^(?:Section|SECTION|Sec\.?)\s*(\d+[A-Za-z]?)[\s.:,\-]*(.*)", stripped, re.IGNORECASE)
        if not m:
            m = re.match(r"^(\d+)\.\s+([A-Z].*)", stripped)
        if m:
            if current and current["text"].strip():
                sections.append({"section": current["section"], "title": current["title"].rstrip(": -").strip(), "text": current["text"].strip()})
            current = {"section": m.group(1), "title": m.group(2) if m.group(2) else "", "text": ""}
        elif current is not None:
            current["text"] += line + "\n"
        else:
            if not current:
                current = {"section": "0", "title": "Preamble", "text": line + "\n"}
            else:
                current["text"] += line + "\n"
    if current and current["text"].strip():
        sections.append({"section": current["section"], "title": current["title"].rstrip(": -").strip(), "text": current["text"].strip()})
    return sections

def build_act_directory(act_id, title, full_text, sections):
    act_dir = KB_DIR / "bare-acts" / act_id
    sec_dir = act_dir / "sections"
    sec_dir.mkdir(parents=True, exist_ok=True)
    index = {"id": act_id, "title": title, "totalSections": len(sections), "source": "pdf-ingestion"}
    (act_dir / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")
    sec_list = [{"section": s["section"], "title": s["title"]} for s in sections]
    (act_dir / "_sections.json").write_text(json.dumps(sec_list, indent=2), encoding="utf-8")
    (act_dir / "full.txt").write_text(full_text, encoding="utf-8")
    for sec in sections:
        sec_file = sec_dir / f"{sec['section']}.json"
        sec_file.write_text(json.dumps({"section": sec["section"], "title": sec["title"], "text": sec["text"]}, indent=2), encoding="utf-8")
    return act_dir

def upload_act_to_s3(act_id):
    import boto3
    s3 = boto3.client("s3", region_name=os.environ.get("AWS_REGION", "ap-south-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"))
    bucket = os.environ.get("S3_BUCKET_NAME", "lawbite-app-storage")
    act_dir = KB_DIR / "bare-acts" / act_id
    count = 0
    for fpath in act_dir.rglob("*"):
        if fpath.is_file():
            s3_key = f"bare-acts/{act_id}/{fpath.relative_to(act_dir)}"
            content_type = "application/json" if fpath.suffix == ".json" else "text/plain"
            s3.upload_file(str(fpath), bucket, s3_key, ExtraArgs={"ContentType": content_type})
            count += 1
            print(".", end="", flush=True)
    return count

act_id = "jurisdiction-structure-of-courts"
act_title = "Jurisdiction and Structure of Courts"
url = "https://nja.gov.in/Concluded_Programmes/2017-18/SE-13_PPTs/6.Judiciary%20organization%20HC%20and%20SC.pdf"

pdf_path = PDF_DIR / f"{act_id}.pdf"
print(f"Downloading {act_id}...")
ok = download_pdf(url, pdf_path)
print(f"Download: {ok}")

if ok:
    import fitz
    doc = fitz.open(str(pdf_path))
    pages = doc.page_count
    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n"
    doc.close()
    print(f"Pages: {pages}, Chars: {len(full_text)}")

    if len(full_text) < 100:
        print("WARNING: Very little text - may be scanned PDF")

    sections = detect_sections(full_text, act_id)
    print(f"Sections found: {len(sections)}")

    act_dir = build_act_directory(act_id, act_title, full_text, sections)
    print(f"Built: {act_dir}")

    print("Uploading to S3...")
    n = upload_act_to_s3(act_id)
    print(f"\nUploaded {n} files")
else:
    print("Download failed")
