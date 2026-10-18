#!/usr/bin/env python3
"""
Legal PDF Ingestion Script
Downloads PDFs, parses with PyMuPDF, structures for S3 knowledge base.

Usage:
    python scripts/ingest-legal-pdfs.py                   # Download + parse locally
    python scripts/ingest-legal-pdfs.py --upload           # Also upload to S3
    python scripts/ingest-legal-pdfs.py --act=bns          # Process one act only
    python scripts/ingest-legal-pdfs.py --skip-download    # Re-parse existing PDFs
"""

import os
import sys
import json
import re
import time
import ssl
import urllib.request
import urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

KB_DIR = Path(__file__).resolve().parent.parent / "kb-build"
PDF_DIR = KB_DIR / "pdfs"

# ─── ACT DEFINITIONS ────────────────────────────────────────────────

ACTS = [
    # CRIMINAL LAW (new codes)
    {"id": "bharatiya-nyaya-sanhita", "title": "Bharatiya Nyaya Sanhita, 2023",
     "url": "https://www.mha.gov.in/sites/default/files/250883_english_01042024.pdf",
     "category": "Criminal Law", "aliases": ["bns", "nyaya sanhita", "bharatiya nyaya"]},

    {"id": "bharatiya-nagrik-suraksha-sanhita", "title": "Bharatiya Nagrik Suraksha Sanhita, 2023",
     "url": "https://bprd.nic.in/uploads/pdf/Final_BNSS.pdf",
     "category": "Criminal Law", "aliases": ["bnss", "nagrik suraksha"]},

    {"id": "bharatiya-sakshya-adhiniyam", "title": "Bharatiya Sakshya Adhiniyam, 2023",
     "url": "https://bprd.nic.in/uploads/pdf/Final_BSA%20Book.pdf",
     "category": "Evidence Law", "aliases": ["bsa", "sakshya adhiniyam"]},

    # CIVIL LAW
    {"id": "code-of-civil-procedure", "title": "The Code of Civil Procedure, 1908",
     "url": "https://cdnbbsr.s3waas.gov.in/s3ca0daec69b5adc880fb464895726dbdf/uploads/2022/09/2022092317.pdf",
     "category": "Civil Procedure", "aliases": ["cpc", "civil procedure"]},

    {"id": "transfer-of-property-act", "title": "The Transfer of Property Act, 1882",
     "url": "https://www.indiacode.nic.in/bitstream/123456789/2338/1/A1882-04.pdf",
     "category": "Property Law", "aliases": ["tpa", "transfer of property", "property act"]},

    {"id": "indian-contract-act", "title": "The Indian Contract Act, 1872",
     "url": "https://www.indiacode.nic.in/bitstream/123456789/2187/2/A187209.pdf",
     "category": "Contract Law", "aliases": ["contract act", "indian contract"]},

    {"id": "specific-relief-act", "title": "The Specific Relief Act, 1963",
     "url": "https://www.indiacode.nic.in/bitstream/123456789/1583/7/A1963-47.pdf",
     "category": "Civil Remedies", "aliases": ["specific relief"]},

    # FAMILY LAW
    {"id": "family-law", "title": "Family Law - I",
     "url": "https://lawfaculty.du.ac.in/userfiles/downloads/LLBCM/Ist%20Term_Family%20Law-%20I_LB105_2023.pdf",
     "category": "Family Law", "aliases": ["family law", "family act"]},

    {"id": "indian-succession-act", "title": "The Indian Succession Act, 1925",
     "url": "https://www.indiacode.nic.in/bitstream/123456789/19051/1/indian_succession_act_1925.pdf",
     "category": "Family Law", "aliases": ["succession act", "indian succession"]},

    {"id": "hindu-succession-act", "title": "The Hindu Succession Act, 1956",
     "url": "https://www.indiacode.nic.in/bitstream/123456789/1713/1/AAA1956suc___30.pdf",
     "category": "Family Law", "aliases": ["hindu succession"]},

    {"id": "domestic-violence-act", "title": "Protection of Women from Domestic Violence Act, 2005",
     "url": "https://www.indiacode.nic.in/bitstream/123456789/15436/1/protection_of_women_from_domestic_violence_act%2C_2005.pdf",
     "category": "Family Law", "aliases": ["domestic violence"]},

    # CONSUMER LAW
    {"id": "consumer-protection-act", "title": "The Consumer Protection Act, 2019",
     "url": "https://www.indiacode.nic.in/bitstream/123456789/16939/1/a2019-35.pdf",
     "category": "Consumer Law", "aliases": ["consumer protection", "consumer act"]},

    # CYBER LAW & IT
    {"id": "information-technology-act", "title": "The Information Technology Act, 2000",
     "url": "https://cdnbbsr.s3waas.gov.in/s3ec03333cb763facc6ce398ff83845f22/uploads/2024/11/2024112871.pdf",
     "category": "Cyber Law", "aliases": ["it act", "information technology"]},

    {"id": "cyber-law-forensics", "title": "Cyber Law and Forensics",
     "url": "https://tndalu.ac.in/econtent/15_Cyber_Law_And_Forensics.pdf",
     "category": "Cyber Law", "aliases": ["cyber law", "cyber forensics"]},

    {"id": "data-protection", "title": "Data Protection Laws in India",
     "url": "https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf",
     "category": "Cyber Law", "aliases": ["data protection", "data privacy"]},

    {"id": "hacking-laws", "title": "Hacking - Indian Laws",
     "url": "https://dict.mizoram.gov.in/uploads/attachments/55f6ecd2c457f031104694609e8fd584/hacking-indian-laws.pdf",
     "category": "Cyber Law", "aliases": ["hacking", "hacking laws"]},

    {"id": "identity-theft", "title": "Identity Theft Laws in India",
     "url": "https://indraprasthalawreview.in/wp-content/uploads/2020/10/ggsipu_uslls_ILR_2020_V1-I1-13-aditi_palit-abhishek_kushwaha.pdf",
     "category": "Cyber Law", "aliases": ["identity theft"]},

    {"id": "online-frauds", "title": "Online Frauds and Legal Remedies",
     "url": "https://www.voiceofresearch.org/doc/Jun-2021/Jun-2021_9.pdf",
     "category": "Cyber Law", "aliases": ["online fraud", "cyber fraud"]},

    {"id": "cyber-crime-detection", "title": "Cyber Crime Detection SOP",
     "url": "https://jajharkhand.in/wp/wp-content/uploads/2019/10/02_sop_english.pdf",
     "category": "Cyber Law", "aliases": ["cyber crime detection", "cyber crime"]},

    {"id": "digital-evidence", "title": "Digital Evidence Guidelines",
     "url": "https://cdnbbsr.s3waas.gov.in/s3ec03333cb763facc6ce398ff83845f22/uploads/2024/11/2024112871.pdf",
     "category": "Cyber Law", "aliases": ["digital evidence"]},

    # CONSTITUTIONAL & ADMINISTRATIVE LAW
    {"id": "constitutional-law-jurisprudence", "title": "Constitutional Law, Jurisprudence, Interpretation and General Laws",
     "url": "https://www.icsi.edu/media/webmodules/Jurisprudence%20Interpretation%20and%20General%20Laws.pdf",
     "category": "Constitutional Law", "aliases": ["jurisprudence", "interpretation", "general laws"]},

    {"id": "legal-terminology", "title": "Legal Terminology and Maxims",
     "url": "https://cdnbbsr.s3waas.gov.in/s3ec04322f62469c5e3c7dc3e58f5a4d1e/uploads/2024/02/2024020915.pdf",
     "category": "Legal Reference", "aliases": ["legal terminology", "legal maxims"]},

    {"id": "tort-law", "title": "Law of Torts",
     "url": "https://tndalu.ac.in/econtent/37_Law_of_Torts.pdf",
     "category": "Tort Law", "aliases": ["tort", "tort law", "law of torts"]},

    # COURT PROCEDURES
    {"id": "jurisdiction-structure-of-courts", "title": "Jurisdiction and Structure of Courts",
     "url": "https://nja.gov.in/Concluded_Programmes/2017-18/SE-13_PPTs/6.Judiciary%20organization%20HC%20and%20SC.pdf",
     "category": "Court Procedure", "aliases": ["jurisdiction of courts", "court jurisdiction", "structure of courts", "court structure", "high court jurisdiction", "supreme court jurisdiction"]},

    {"id": "civil-appeals", "title": "Law of Civil Appeals",
     "url": "https://lawhelpline.in/wp-content/uploads/2024/01/APPEALCIVIL.pdf",
     "category": "Court Procedure", "aliases": ["civil appeal", "civil appeals"]},

    {"id": "judicial-review", "title": "Judicial Review",
     "url": "https://nja.gov.in/Concluded_Programmes/2018-19/P-1110_PPTs/8.Judicial%20Review.pdf",
     "category": "Constitutional Law", "aliases": ["judicial review"]},

    {"id": "writ-jurisprudence", "title": "Writ Jurisprudence in India",
     "url": "https://bhattandjoshiassociates.s3.ap-south-1.amazonaws.com/booklets+%26+publications/Writ+Jurisprudence+in+India+-+Types+%26+Landmark+Cases.pdf",
     "category": "Constitutional Law", "aliases": ["writ", "writs", "habeas corpus", "mandamus", "certiorari"]},

    {"id": "public-interest-litigation", "title": "Public Interest Litigation",
     "url": "https://www.manupatra.com/roundup/379/articles/public%20interest%20litigation.pdf",
     "category": "Court Procedure", "aliases": ["pil", "public interest litigation"]},

    {"id": "revision-of-courts", "title": "Revision Jurisdiction of Courts",
     "url": "https://cdnbbsr.s3waas.gov.in/s3ec05abdeb6f575ac5c6676b747bca8d0/uploads/2024/01/2024010568.pdf",
     "category": "Court Procedure", "aliases": ["revision", "revision jurisdiction"]},

    # POLICE & CRIMINAL PROCEDURE
    {"id": "police-act-1861", "title": "The Police Act, 1861",
     "url": "https://www.mha.gov.in/sites/default/files/police_act_1861.pdf",
     "category": "Police Law", "aliases": ["police act", "police powers"]},

    {"id": "fir-procedures", "title": "Handbook on FIR Registration",
     "url": "https://police.py.gov.in/Hand%20Book%20on%20FIR%20by%20PTS%20on%2020.02.10.pdf",
     "category": "Criminal Procedure", "aliases": ["fir", "first information report"]},

    {"id": "arrest-guidelines", "title": "NHRC Guidelines on Arrest",
     "url": "https://police.py.gov.in/NHRC%20Guidelines%20Regarding/NHRC%20Guidelines%20Regarding%20arrest.PDF",
     "category": "Criminal Procedure", "aliases": ["arrest", "arrest guidelines"]},

    {"id": "search-and-seizure", "title": "Search and Seizure Law",
     "url": "https://nirc.icai.org/wp-content/uploads/2025/05/SEARCH-AND-SEIZURE-may-2025.pdf",
     "category": "Criminal Procedure", "aliases": ["search and seizure"]},

    {"id": "nia-act", "title": "National Investigation Agency Act, 2008",
     "url": "https://www.mha.gov.in/sites/default/files/2022-08/The%2520National%2520Investigation%2520Agency%2520Act%2C%25202008_1%5B1%5D.pdf",
     "category": "Investigation", "aliases": ["nia", "investigation agency"]},

    {"id": "charge-sheets", "title": "Charge Sheet Procedures",
     "url": "https://dopt.gov.in/sites/default/files/Simplification%20of%20Rules%2043020%2014%202021%20Estt%20A%20III.pdf",
     "category": "Criminal Procedure", "aliases": ["charge sheet", "chargesheet"]},

    {"id": "preventive-detention", "title": "Preventive Detention Law",
     "url": "https://lawhelpline.in/wp-content/uploads/2024/02/Preventive-Detention.pdf",
     "category": "Criminal Procedure", "aliases": ["preventive detention"]},

    # INDIAN POLITY & GOVERNANCE
    {"id": "indian-polity", "title": "Indian Polity and Governance",
     "url": "https://www.iipa.org.in/upload/IPG_const.pdf",
     "category": "Constitutional Law", "aliases": ["indian polity", "polity", "governance"]},

    {"id": "local-government", "title": "Local Government in India",
     "url": "https://darpg.gov.in/sites/default/files/local_governance6.pdf",
     "category": "Administrative Law", "aliases": ["local government", "panchayat", "municipality"]},

    {"id": "fundamental-rules", "title": "Fundamental Rules and Supplementary Rules",
     "url": "https://dopt.gov.in/sites/default/files/Compilation_FR_SR_English.pdf",
     "category": "Administrative Law", "aliases": ["fundamental rules", "fr rules"]},

    {"id": "general-financial-rules", "title": "General Financial Rules",
     "url": "https://doe.gov.in/files/circulars_document/FInal_GFR_upto_31_07_2024.pdf",
     "category": "Administrative Law", "aliases": ["general financial rules", "gfr"]},

    {"id": "delegated-legislation", "title": "Delegated Legislation",
     "url": "https://gyansanchay.csjmu.ac.in/wp-content/uploads/2023/03/delegated-legislation-1-2.pdf",
     "category": "Administrative Law", "aliases": ["delegated legislation"]},

    {"id": "public-administration", "title": "Public Administration",
     "url": "https://www.yashada.org/cptp/PDF/home_page_links/cptpot_study_material_8.pdf",
     "category": "Administrative Law", "aliases": ["public administration"]},

    # HUMAN RIGHTS
    {"id": "protection-of-human-rights-act", "title": "The Protection of Human Rights Act, 1993",
     "url": "https://www.indiacode.nic.in/bitstream/123456789/13233/1/the_protection_of_human_rights_act_1993.pdf",
     "category": "Human Rights", "aliases": ["human rights"]},

    {"id": "prisoner-rights", "title": "Rights of Prisoners",
     "url": "https://nhrc.nic.in/assets/uploads/publication/11%20Rights%20of%20Prisoners-compressed.pdf",
     "category": "Human Rights", "aliases": ["prisoner rights", "prisoners rights"]},

    {"id": "women-rights", "title": "Women Rights and Laws in India",
     "url": "https://www.schooloflegaleducation.com/wp-content/uploads/2019/08/Women-and-law-in-India-ebook.pdf",
     "category": "Human Rights", "aliases": ["women rights", "women law"]},

    {"id": "child-rights", "title": "Child Rights in India",
     "url": "https://upr-info.org/sites/default/files/documents/2017-04/js17_upr27_ind_e_main.pdf",
     "category": "Human Rights", "aliases": ["child rights"]},

    {"id": "minority-rights", "title": "Minority Rights and Protection",
     "url": "https://www.minorityaffairs.gov.in/WriteReadData/RTF1984/1658314068.pdf",
     "category": "Human Rights", "aliases": ["minority rights"]},

    # CORPORATE & BUSINESS LAW
    {"id": "corporate-business-laws", "title": "Corporate and Business Laws",
     "url": "https://ebooks.lpude.in/management/mba/term_2/DMGT407_CORPORATE_AND_BUSINESS_LAWS.pdf",
     "category": "Corporate Law", "aliases": ["corporate law", "business law"]},

    # LABOUR & EMPLOYMENT LAW
    {"id": "employment-law", "title": "Employment and Labour Laws",
     "url": "https://ncib.in/pdf/ncib_pdf/Labour%20Act.pdf",
     "category": "Labour Law", "aliases": ["employment law", "labour law"]},

    {"id": "minimum-wages-act", "title": "The Minimum Wages Act",
     "url": "https://clc.gov.in/clc/sites/default/files/MinimumWagesact.pdf",
     "category": "Labour Law", "aliases": ["minimum wages"]},

    {"id": "payment-of-wages-act", "title": "The Payment of Wages Act, 1936",
     "url": "https://www.indiacode.nic.in/bitstream/123456789/20359/1/payment_of_wages_act_1936.pdf",
     "category": "Labour Law", "aliases": ["payment of wages"]},

    {"id": "industrial-disputes-act", "title": "The Industrial Disputes Act, 1947",
     "url": "https://www.indiacode.nic.in/bitstream/123456789/20352/1/the_industrial_disputes_act.pdf",
     "category": "Labour Law", "aliases": ["industrial dispute", "industrial disputes"]},

    {"id": "social-security-act", "title": "The Code on Social Security, 2020",
     "url": "https://www.indiacode.nic.in/bitstream/123456789/16823/1/aA2020-36.pdf",
     "category": "Labour Law", "aliases": ["social security"]},

    {"id": "trade-unions-act", "title": "The Trade Unions Act, 1926",
     "url": "https://cdnbbsr.s3waas.gov.in/s36547884cea64550284728eb26b0947ef/uploads/2025/04/20250414904679697.pdf",
     "category": "Labour Law", "aliases": ["trade union", "trade unions"]},

    # TAXATION LAW
    {"id": "income-tax-act", "title": "The Income Tax Act, 1961",
     "url": "https://www.indiacode.nic.in/bitstream/123456789/2435/1/a1961-43.pdf",
     "category": "Taxation", "aliases": ["income tax", "tax act"]},

    {"id": "cgst-act", "title": "The Central Goods and Services Tax Act, 2017",
     "url": "https://cbic-gst.gov.in/pdf/CGST-Act-Updated-30092020.pdf",
     "category": "Taxation", "aliases": ["cgst", "gst"]},

    {"id": "customs-act", "title": "The Customs Act, 1962",
     "url": "https://www.indiacode.nic.in/bitstream/123456789/15359/1/the_customs_act%2C_1962.pdf",
     "category": "Taxation", "aliases": ["customs"]},

    {"id": "central-excise-act", "title": "The Central Excise Act, 1944",
     "url": "https://www.indiacode.nic.in/bitstream/123456789/19238/1/a1944-01.pdf",
     "category": "Taxation", "aliases": ["excise", "central excise"]},

    {"id": "taxation-law", "title": "Taxation Law - Comprehensive Guide",
     "url": "https://www.schooloflegaleducation.com/wp-content/uploads/2019/08/Taxation-Law.pdf",
     "category": "Taxation", "aliases": ["taxation law", "tax law"]},

    # LEGAL DRAFTING
    {"id": "legal-drafting", "title": "Drafting, Pleadings and Conveyancing",
     "url": "https://lawfaculty.du.ac.in/userfiles/downloads/LLBCM/Drafting-Pleadings-and-Conveyancing.pdf",
     "category": "Legal Practice", "aliases": ["legal drafting", "drafting", "pleadings"]},
]


# ─── PDF DOWNLOAD ───────────────────────────────────────────────────

def download_pdf(url: str, dest: Path, retries: int = 3) -> bool:
    """Download a PDF with retry and redirect handling."""
    if dest.exists() and dest.stat().st_size > 1000:
        return True

    # Create SSL context that doesn't verify (some govt sites have cert issues)
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


# ─── SECTION DETECTION ──────────────────────────────────────────────

def detect_sections(text: str, act_id: str) -> list:
    """Parse full text into numbered sections."""
    lines = text.split("\n")
    sections = []
    current = None

    for line in lines:
        stripped = line.strip()

        # Match "Section 1." or "SECTION 1" or "Sec. 1"
        m = re.match(
            r"^(?:Section|SECTION|Sec\.?)\s*(\d+[A-Za-z]?)[\s.:,\-–—]*(.*)",
            stripped, re.IGNORECASE
        )
        if not m:
            # Match "1. Title" (standalone numbered headings)
            m = re.match(r"^(\d+)\.\s+([A-Z].*)", stripped)

        if m:
            if current and current["text"].strip():
                sections.append({
                    "section": current["section"],
                    "title": current["title"].rstrip(": -–—").strip(),
                    "text": current["text"].strip(),
                })
            current = {
                "section": m.group(1),
                "title": m.group(2) if m.group(2) else "",
                "text": "",
            }
        elif current is not None:
            current["text"] += line + "\n"
        else:
            # Preamble content before first section
            if not current:
                current = {"section": "0", "title": "Preamble", "text": line + "\n"}
            else:
                current["text"] += line + "\n"

    if current and current["text"].strip():
        sections.append({
            "section": current["section"],
            "title": current["title"].rstrip(": -–—").strip(),
            "text": current["text"].strip(),
        })

    return sections


# ─── BUILD S3 DIRECTORY STRUCTURE ───────────────────────────────────

def build_act_directory(act_id: str, title: str, full_text: str, sections: list) -> Path:
    """Write act data in the same format as existing S3 KB."""
    act_dir = KB_DIR / "bare-acts" / act_id
    sec_dir = act_dir / "sections"
    sec_dir.mkdir(parents=True, exist_ok=True)

    # index.json
    index = {"id": act_id, "title": title, "totalSections": len(sections), "source": "pdf-ingestion"}
    (act_dir / "index.json").write_text(json.dumps(index, indent=2), encoding="utf-8")

    # _sections.json
    sec_list = [{"section": s["section"], "title": s["title"]} for s in sections]
    (act_dir / "_sections.json").write_text(json.dumps(sec_list, indent=2), encoding="utf-8")

    # full.txt
    (act_dir / "full.txt").write_text(full_text, encoding="utf-8")

    # Individual section JSONs
    for sec in sections:
        sec_file = sec_dir / f"{sec['section']}.json"
        sec_file.write_text(
            json.dumps({"section": sec["section"], "title": sec["title"], "text": sec["text"]}, indent=2),
            encoding="utf-8",
        )

    return act_dir


# ─── S3 UPLOAD ──────────────────────────────────────────────────────

def upload_act_to_s3(act_id: str):
    """Upload a single act directory to S3."""
    import boto3

    s3 = boto3.client(
        "s3",
        region_name=os.environ.get("AWS_REGION", "ap-south-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )
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


# ─── MAIN ───────────────────────────────────────────────────────────

def main():
    args = sys.argv[1:]
    do_upload = "--upload" in args
    skip_download = "--skip-download" in args
    filter_act = None
    for a in args:
        if a.startswith("--act="):
            filter_act = a.split("=", 1)[1]

    PDF_DIR.mkdir(parents=True, exist_ok=True)

    acts_to_process = [a for a in ACTS if not filter_act or a["id"] == filter_act]
    print(f"\n=== Processing {len(acts_to_process)} acts ===\n")

    processed = []
    errors = []

    for act in acts_to_process:
        pdf_path = PDF_DIR / f"{act['id']}.pdf"
        try:
            # Download
            if not skip_download:
                print(f"[{act['id']}] Downloading...", end=" ", flush=True)
                ok = download_pdf(act["url"], pdf_path)
                if not ok:
                    print("FAILED")
                    errors.append({"id": act["id"], "error": "Download failed"})
                    continue
                print("done")
            else:
                if not pdf_path.exists():
                    print(f"[{act['id']}] No PDF found, skipping")
                    continue

            # Parse PDF
            import fitz  # PyMuPDF
            print(f"[{act['id']}] Parsing PDF...", end=" ", flush=True)
            doc = fitz.open(str(pdf_path))
            pages = doc.page_count
            full_text = ""
            for page in doc:
                full_text += page.get_text() + "\n"
            doc.close()
            print(f"{pages} pages, {len(full_text)} chars")

            if len(full_text) < 100:
                print(f"[{act['id']}] WARN: Very little text extracted ({len(full_text)} chars), may be scanned PDF")

            # Detect sections
            print(f"[{act['id']}] Detecting sections...", end=" ", flush=True)
            sections = detect_sections(full_text, act["id"])
            print(f"{len(sections)} sections found")

            # Build directory
            act_dir = build_act_directory(act["id"], act["title"], full_text, sections)
            print(f"[{act['id']}] Written to {act_dir}")

            processed.append(act["id"])

        except Exception as e:
            print(f"\n[{act['id']}] ERROR: {e}")
            errors.append({"id": act["id"], "error": str(e)})

    # Update _index.json
    index_path = KB_DIR / "bare-acts" / "_index.json"
    existing = []
    if index_path.exists():
        existing = json.loads(index_path.read_text(encoding="utf-8"))
    existing_ids = set(e if isinstance(e, str) else e["id"] for e in existing)
    for pid in processed:
        if pid not in existing_ids:
            existing.append(pid)
    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(json.dumps(existing, indent=2), encoding="utf-8")

    # Upload
    if do_upload and processed:
        print(f"\n=== Uploading {len(processed)} acts to S3 ===")
        try:
            import boto3  # noqa
            for pid in processed:
                print(f"[{pid}] Uploading...", end=" ", flush=True)
                n = upload_act_to_s3(pid)
                print(f" {n} files")
            print("Upload complete!")
        except Exception as e:
            print(f"\nS3 Upload error: {e}")
            print("Make sure AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION are set in .env.local")

    # Summary
    print(f"\n{'='*50}")
    print(f"Processed: {len(processed)}")
    print(f"Errors: {len(errors)}")
    if errors:
        print("\nFailed:")
        for e in errors:
            print(f"  - {e['id']}: {e['error']}")
    print(f"\nKB output: {KB_DIR / 'bare-acts'}")
    if do_upload:
        print("Uploaded to S3.")
    else:
        print('Run with --upload to push to S3 (requires AWS credentials).')


if __name__ == "__main__":
    main()
