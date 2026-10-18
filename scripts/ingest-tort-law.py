"""Ingest MCRHRDI tort law PDF to S3 bare-acts/tort-law/"""
import fitz
import json
import re
import hashlib
import boto3
from pathlib import Path

PDF_PATH = Path("kb-build/pdfs/mcrhrdi-torts-2024.pdf")
S3_BUCKET = "lawbite-app-storage"
S3_PREFIX = "bare-acts/tort-law/"
SOURCE_URL = "https://www.mcrhrdi.gov.in/6thmesfc2023/week8/2024%20S%20FC%20111%20&222Law%20of%20Torts.pdf"

# Parse PDF
doc = fitz.open(str(PDF_PATH))
full_text = ""
for page in doc:
    full_text += page.get_text()
doc.close()
print(f"PDF parsed: {len(full_text)} chars")

# Clean text
full_text = re.sub(r"Law of Torts\d+/ASR\n?", "", full_text)
full_text = full_text.strip()

# Split into sections by recognized headings
KNOWN_HEADINGS = [
    "THE NATURE OF A TORT",
    "TORT & CRIME",
    "TORT AND BREACH OF CONTRACT",
    "DEFAMATION",
    "NEGLIGENCE",
    "STRICT LIABILITY",
    "NUISANCE",
    "TRESPASS",
    "DAMAGES",
    "GENERAL DEFENCES",
    "CAPACITY",
    "LIABILITY",
    "REMEDIES",
]

sections = []
current_title = "introduction"
current_content = ""
lines = full_text.split("\n")

heading_re = re.compile(
    r"^((?:THE NATURE OF A TORT|TORT\s*&\s*CRIME|TORT AND BREACH OF CONTRACT|"
    r"DEFAMATION|NEGLIGENCE|STRICT LIABILITY|NUISANCE|TRESPASS|DAMAGES|"
    r"GENERAL DEFENCES|CAPACITY|LIABILITY|REMEDIES).*)",
    re.IGNORECASE,
)

for line in lines:
    stripped = line.strip()
    if not stripped:
        current_content += "\n"
        continue

    m = heading_re.match(stripped)
    if m:
        if current_content.strip():
            sections.append((current_title, current_content.strip()))
        current_title = re.sub(r"[^a-z0-9]+", "-", m.group(1).lower()).strip("-")
        current_content = ""
    else:
        current_content += line + "\n"

if current_content.strip():
    sections.append((current_title, current_content.strip()))

print(f"Sections found: {len(sections)}")
for title, content in sections:
    print(f"  - {title}: {len(content)} chars")

# Upload to S3
s3 = boto3.client("s3")

# Upload full text
s3.put_object(
    Bucket=S3_BUCKET,
    Key=S3_PREFIX + "full.txt",
    Body=full_text.encode("utf-8"),
    ContentType="text/plain; charset=utf-8",
)

# Upload sections
for title, content in sections:
    s3.put_object(
        Bucket=S3_BUCKET,
        Key=S3_PREFIX + f"sections/{title}.json",
        Body=json.dumps({"id": title, "content": content}, ensure_ascii=False).encode("utf-8"),
        ContentType="application/json",
    )

# Create index
sha256 = hashlib.sha256(full_text.encode("utf-8")).hexdigest()
index = {
    "id": "tort-law",
    "title": "Law of Torts",
    "shortTitle": "Law of Torts",
    "source": SOURCE_URL,
    "sourceAuthority": "Dr. MCR HRD Institute, Government of Telangana",
    "sha256": sha256,
    "charCount": len(full_text),
    "sectionCount": len(sections),
    "sections": [{"id": t, "title": t.replace("-", " ").title(), "charCount": len(c)} for t, c in sections],
    "aliases": [
        "tort law", "law of torts", "tort liability", "civil wrong",
        "negligence", "defamation", "nuisance", "trespass", "strict liability",
        "vicarious liability", "damages", "malicious prosecution",
        "false imprisonment", "assault and battery",
    ],
    "tags": ["tort law", "civil wrongs", "negligence", "defamation", "nuisance", "damages", "indian law"],
    "jurisdiction": "india",
    "enactedDate": None,
    "lastAmended": None,
}

s3.put_object(
    Bucket=S3_BUCKET,
    Key=S3_PREFIX + "index.json",
    Body=json.dumps(index, indent=2, ensure_ascii=False).encode("utf-8"),
    ContentType="application/json",
)

# Upload _sections.json
sections_list = []
for title, content in sections:
    sha = hashlib.sha256(content.encode("utf-8")).hexdigest()
    sections_list.append({"id": title, "sha256": sha, "charCount": len(content)})

s3.put_object(
    Bucket=S3_BUCKET,
    Key=S3_PREFIX + "_sections.json",
    Body=json.dumps(sections_list, indent=2, ensure_ascii=False).encode("utf-8"),
    ContentType="application/json",
)

print(f"\nUploaded to S3:")
print(f"  {S3_PREFIX}full.txt ({len(full_text)} chars)")
print(f"  {S3_PREFIX}index.json")
print(f"  {S3_PREFIX}_sections.json ({len(sections_list)} sections)")
for s in sections_list:
    print(f"    - {s['id']}: {s['charCount']} chars")
