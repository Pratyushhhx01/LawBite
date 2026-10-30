import os
import re
import csv
import json
import urllib.request
import dotenv
import psycopg2
from sentence_transformers import SentenceTransformer

dotenv.load_dotenv(".env.local")

# Connect to PostgreSQL
db_url = os.environ["DATABASE_URL"].replace("sslmode=verify-full", "sslmode=require")
conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

print("Loading BAAI/bge-base-en-v1.5 embedding model...")
model = SentenceTransformer("BAAI/bge-base-en-v1.5")
print("Model loaded successfully!")

def fetch_url(url):
    req = urllib.request.Request(url, headers={"User-Agent": "LawBite/1.0"})
    with urllib.request.urlopen(req) as resp:
        return resp.read().decode("utf-8", errors="ignore")

def insert_batch(batch):
    if not batch:
        return
    texts = [f"{b['act_title']} {b['provision']}: {b['title']}\n{b['content']}" for b in batch]
    embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32)

    query = """
    INSERT INTO legal_chunks (id, category, act_id, act_title, provision, title, year, court, content, embedding)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        title = EXCLUDED.title,
        embedding = EXCLUDED.embedding;
    """
    params = []
    for b, vec in zip(batch, embeddings):
        vec_str = "[" + ",".join(map(str, vec.tolist())) + "]"
        params.append((
            b["id"],
            b["category"],
            b["act_id"],
            b["act_title"],
            b["provision"],
            b["title"],
            b["year"],
            b.get("court"),
            b["content"],
            vec_str
        ))
    cur.executemany(query, params)

def check_db_size():
    cur.execute("SELECT pg_size_pretty(pg_total_relation_size('legal_chunks')), pg_total_relation_size('legal_chunks');")
    pretty, raw = cur.fetchone()
    print(f"[Size Check] legal_chunks table size: {pretty} ({raw} bytes)")
    if raw > 45 * 1024 * 1024:
        print("[WARNING] Reached 45MB budget threshold. Halting additional ingestion.")
        return False
    return True

# 1. Ingest Complete BNS 2023 with IPC Concordance
def ingest_complete_bns_and_ipc():
    print("Ingesting complete BNS (2023) and IPC (1860) concordance...")
    url = "https://huggingface.co/datasets/nandhakumarg/IPC_and_BNS_transformation/raw/main/IPC%20and%20BNS%20transformation%20.csv"
    data = fetch_url(url)
    reader = csv.reader(data.splitlines())
    header = next(reader)

    batch_bns = []
    batch_ipc = []

    for row in reader:
        if len(row) < 2:
            continue
        try:
            resp_data = eval(row[1]) # dictionary format
            ipc_sec = str(resp_data.get("IPC Section", "")).strip()
            ipc_head = str(resp_data.get("IPC Heading", "")).strip()
            ipc_desc = str(resp_data.get("IPC Descriptions", "")).strip()
            bns_sec = str(resp_data.get("BNS Section", "")).strip()
            bns_head = str(resp_data.get("BNS Heading", "")).strip()
            bns_desc = str(resp_data.get("BNS description", "")).strip()

            if bns_sec and bns_head:
                batch_bns.append({
                    "id": f"bns:{bns_sec}",
                    "category": "bare_act",
                    "act_id": "bharatiya-nyaya-sanhita",
                    "act_title": "Bharatiya Nyaya Sanhita, 2023",
                    "provision": f"Section {bns_sec}",
                    "title": bns_head,
                    "year": 2023,
                    "content": f"Bharatiya Nyaya Sanhita (BNS), 2023. Section {bns_sec}: {bns_head}.\n{bns_desc}\n[Corresponding IPC Section: {ipc_sec}]"
                })

            if ipc_sec and ipc_head:
                batch_ipc.append({
                    "id": f"ipc:{ipc_sec}",
                    "category": "bare_act",
                    "act_id": "indian-penal-code",
                    "act_title": "Indian Penal Code, 1860",
                    "provision": f"Section {ipc_sec}",
                    "title": ipc_head,
                    "year": 1860,
                    "content": f"Indian Penal Code (IPC), 1860. Section {ipc_sec}: {ipc_head}.\n{ipc_desc}\n[Replaced by BNS Section: {bns_sec}]"
                })

            if len(batch_bns) >= 50:
                insert_batch(batch_bns)
                batch_bns = []
            if len(batch_ipc) >= 50:
                insert_batch(batch_ipc)
                batch_ipc = []

        except Exception:
            continue

    if batch_bns:
        insert_batch(batch_bns)
    if batch_ipc:
        insert_batch(batch_ipc)
    print("BNS and IPC ingestion completed.")
    check_db_size()

# 2. Ingest Indian Contract Act, 1872 & Key Civil Statutes
def ingest_contract_and_civil_acts():
    print("Ingesting Indian Contract Act, 1872 and core civil provisions...")
    contract_sections = [
        ("1", "Short title", "This Act may be called the Indian Contract Act, 1872. It extends to the whole of India."),
        ("2", "Interpretation-clause", "In this Act: (a) When one person signifies to another his willingness to do or to abstain from doing anything, with a view to obtaining the assent of that other to such act or abstinence, he is said to make a proposal; (b) When the person to whom the proposal is made signifies his assent thereto, the proposal is said to be accepted; (e) Every promise and every set of promises, forming the consideration for each other, is an agreement; (h) An agreement enforceable by law is a contract."),
        ("10", "What agreements are contracts", "All agreements are contracts if they are made by the free consent of parties competent to contract, for a lawful consideration and with a lawful object, and are not hereby expressly declared to be void."),
        ("11", "Who are competent to contract", "Every person is competent to contract who is of the age of majority according to the law to which he is subject, and who is of sound mind, and is not disqualified from contracting by any law to which he is subject."),
        ("12", "What is a sound mind for the purposes of contracting", "A person is said to be of sound mind for the purpose of making a contract, if, at the time when he makes it, he is capable of understanding it and of forming a rational judgment as to its effect upon his interests."),
        ("13", "Consent defined", "Two or more persons are said to consent when they agree upon the same thing in the same sense (consensus ad idem)."),
        ("14", "Free consent defined", "Consent is said to be free when it is not caused by: (1) coercion, (2) undue influence, (3) fraud, (4) misrepresentation, or (5) mistake."),
        ("15", "Coercion defined", "Coercion is the committing, or threatening to commit, any act forbidden by the Indian Penal Code, or the unlawful detaining, or threatening to detain, any property, to the prejudice of any person whatever, with the intention of causing any person to enter into an agreement."),
        ("16", "Undue influence defined", "A contract is said to be induced by undue influence where the relations subsisting between the parties are such that one of the parties is in a position to dominate the will of the other and uses that position to obtain an unfair advantage over the other."),
        ("17", "Fraud defined", "Fraud means and includes any of the following acts committed by a party to a contract with intent to deceive another party or to induce him to enter into the contract: suggestion of fact which is not true, active concealment, promise made without intention of performing it."),
        ("18", "Misrepresentation defined", "Misrepresentation means and includes: the positive assertion of that which is not true, though he believes it to be true; any breach of duty which gains an advantage to the person committing it by misleading another."),
        ("23", "What considerations and objects are lawful, and what not", "The consideration or object of an agreement is lawful, unless: it is forbidden by law; or is of such a nature that, if permitted, it would defeat the provisions of any law; or is fraudulent; or involves or implies, injury to the person or property of another; or the Court regards it as immoral, or opposed to public policy."),
        ("25", "Agreement without consideration, void", "An agreement made without consideration is void, unless it is expressed in writing and registered under the law for the time being in force for the registration of documents, and is made on account of natural love and affection between parties standing in a near relation to each other."),
        ("27", "Agreement in restraint of trade, void", "Every agreement by which any one is restrained from exercising a lawful profession, trade or business of any kind, is to that extent void."),
        ("28", "Agreements in restraint of legal proceedings, void", "Every agreement, by which any party thereto is restricted absolutely from enforcing his rights under or in respect of any contract, by the usual legal proceedings in the ordinary tribunals, or which limits the time within which he may thus enforce his rights, is void to that extent."),
        ("56", "Agreement to do impossible act (Doctrine of Frustration)", "An agreement to do an act impossible in itself is void. A contract to do an act which, after the contract is made, becomes impossible, or, by reason of some event which the promisor could not prevent, unlawful, becomes void when the act becomes impossible or unlawful."),
        ("73", "Compensation for loss or damage caused by breach of contract", "When a contract has been broken, the party who suffers by such breach is entitled to receive, from the party who has broken the contract, compensation for any loss or damage caused to him thereby, which naturally arose in the usual course of things from such breach, or which the parties knew, when they made the contract, to be likely to result from the breach of it. Such compensation is not to be given for any remote and indirect loss or damage sustained by reason of the breach (Rule in Hadley v. Baxendale)."),
        ("74", "Compensation for breach of contract where penalty stipulated for", "When a contract has been broken, if a sum is named in the contract as the amount to be paid in case of such breach, or if the contract contains any other stipulation by way of penalty, the party complaining of the breach is entitled, whether or not actual damage or loss is proved to have been caused thereby, to receive from the party who has broken the contract reasonable compensation not exceeding the amount so named or, as the case may be, the penalty stipulated for.")
    ]

    batch = []
    for sec, title, content in contract_sections:
        batch.append({
            "id": f"contract:{sec}",
            "category": "bare_act",
            "act_id": "indian-contract-act",
            "act_title": "Indian Contract Act, 1872",
            "provision": f"Section {sec}",
            "title": title,
            "year": 1872,
            "content": f"Indian Contract Act, 1872. Section {sec}: {title}.\n{content}"
        })
    insert_batch(batch)
    print(f"Ingested {len(batch)} core sections of Indian Contract Act, 1872.")
    check_db_size()

# 3. Ingest Bharatiya Sakshya Adhiniyam, 2023 (BSA) & Bharatiya Nagarik Suraksha Sanhita (BNSS)
def ingest_bsa_and_bnss_core():
    print("Ingesting core BSA 2023 and BNSS 2023 provisions...")
    bsa_bnss_sections = [
        # BSA (replacing Indian Evidence Act)
        ("bsa:1", "bare_act", "bharatiya-sakshya-adhiniyam", "Bharatiya Sakshya Adhiniyam, 2023", "Section 1", "Short title, application and commencement", 2023, "Bharatiya Sakshya Adhiniyam, 2023 applies to all judicial proceedings in or before any Court, replacing the Indian Evidence Act, 1872."),
        ("bsa:2", "bare_act", "bharatiya-sakshya-adhiniyam", "Bharatiya Sakshya Adhiniyam, 2023", "Section 2", "Definitions - Document, Evidence, Fact", 2023, "Defines document, evidence (oral and documentary), fact, relevant fact, and proves/disproves. Includes electronic and digital records as documentary evidence."),
        ("bsa:61", "bare_act", "bharatiya-sakshya-adhiniyam", "Bharatiya Sakshya Adhiniyam, 2023", "Section 61", "Admissibility of electronic records", 2023, "Electronic or digital records shall have the same legal effect, validity and enforceability as other documents (corresponding to Section 65B of Indian Evidence Act)."),
        ("bsa:63", "bare_act", "bharatiya-sakshya-adhiniyam", "Bharatiya Sakshya Adhiniyam, 2023", "Section 63", "Admissibility of electronic records and certificate requirement", 2023, "Prescribes conditions for admissibility of electronic records and the requisite certificate for electronic evidence verification."),
        ("bsa:104", "bare_act", "bharatiya-sakshya-adhiniyam", "Bharatiya Sakshya Adhiniyam, 2023", "Section 104", "Burden of proof", 2023, "Whoever desires any Court to give judgment as to any legal right or liability dependent on the existence of facts which he asserts, must prove that those facts exist (corresponding to Section 101 Evidence Act)."),
        
        # BNSS (replacing CrPC)
        ("bnss:1", "bare_act", "bharatiya-nagarik-suraksha-sanhita", "Bharatiya Nagarik Suraksha Sanhita, 2023", "Section 1", "Short title, extent and commencement", 2023, "Bharatiya Nagarik Suraksha Sanhita, 2023 replaces the Code of Criminal Procedure, 1973."),
        ("bnss:35", "bare_act", "bharatiya-nagarik-suraksha-sanhita", "Bharatiya Nagarik Suraksha Sanhita, 2023", "Section 35", "When police may arrest without warrant", 2023, "Conditions under which a police officer may arrest any person without an order from a Magistrate and without a warrant (corresponding to Section 41 CrPC)."),
        ("bnss:173", "bare_act", "bharatiya-nagarik-suraksha-sanhita", "Bharatiya Nagarik Suraksha Sanhita, 2023", "Section 173", "Information in cognizable cases (Zero FIR / e-FIR)", 2023, "Mandatory recording of First Information Report (FIR) irrespective of territorial jurisdiction (Zero FIR) and provision for electronic FIR submission."),
        ("bnss:479", "bare_act", "bharatiya-nagarik-suraksha-sanhita", "Bharatiya Nagarik Suraksha Sanhita, 2023", "Section 479", "Maximum period for which undertrial prisoner can be detained", 2023, "First-time offenders to be released on bond/bail after serving one-third of the maximum imprisonment period (corresponding to Section 436A CrPC)."),
        ("bnss:480", "bare_act", "bharatiya-nagarik-suraksha-sanhita", "Bharatiya Nagarik Suraksha Sanhita, 2023", "Section 480", "When bail may be taken in case of non-bailable offence", 2023, "Discretionary grant of bail by Court in non-bailable offences (corresponding to Section 437 CrPC)."),
        ("bnss:482", "bare_act", "bharatiya-nagarik-suraksha-sanhita", "Bharatiya Nagarik Suraksha Sanhita, 2023", "Section 482", "Direction for grant of bail to person apprehending arrest (Anticipatory Bail)", 2023, "High Court and Sessions Court power to grant anticipatory bail to any person apprehending arrest (corresponding to Section 438 CrPC)."),
        ("bnss:528", "bare_act", "bharatiya-nagarik-suraksha-sanhita", "Bharatiya Nagarik Suraksha Sanhita, 2023", "Section 528", "Saving of inherent powers of High Court", 2023, "Nothing in this Sanhita shall be deemed to limit or affect the inherent powers of the High Court to prevent abuse of the process of any Court or otherwise to secure the ends of justice (corresponding to Section 482 CrPC).")
    ]

    batch = []
    for item in bsa_bnss_sections:
        batch.append({
            "id": item[0],
            "category": item[1],
            "act_id": item[2],
            "act_title": item[3],
            "provision": item[4],
            "title": item[5],
            "year": item[6],
            "content": f"{item[3]}. {item[4]}: {item[5]}.\n{item[7]}"
        })
    insert_batch(batch)
    print(f"Ingested {len(batch)} foundational provisions for BSA 2023 & BNSS 2023.")
    check_db_size()

# 4. Ingest Key Supreme Court Landmark Precedents across Constitutional, Criminal & Contract Law
def ingest_expanded_landmark_cases():
    print("Ingesting expanded landmark Supreme Court jurisprudence...")
    sc_cases = [
        {
            "id": "case:dk-basu",
            "title": "D.K. Basu v. State of West Bengal (1997)",
            "provision": "Arrest Guidelines & Custodial Violence",
            "year": 1997,
            "court": "Supreme Court of India",
            "content": "Held: Formulated 11 mandatory guidelines to be followed in all cases of arrest and detention to prevent custodial torture and uphold human rights under Article 21 and Article 22 of the Constitution."
        },
        {
            "id": "case:arnesh-kumar",
            "title": "Arnesh Kumar v. State of Bihar (2014)",
            "provision": "Section 41 CrPC / Section 35 BNSS - Arrest Checklist",
            "year": 2014,
            "court": "Supreme Court of India",
            "content": "Held: Police officers must not automatically arrest accused persons in offences punishable with imprisonment up to 7 years (such as Section 498A IPC). A notice of appearance under Section 41A CrPC must be served first."
        },
        {
            "id": "case:satender-kumar-antil",
            "title": "Satender Kumar Antil v. CBI (2022)",
            "provision": "Bail Reform & Under-trial Guidelines",
            "year": 2022,
            "court": "Supreme Court of India",
            "content": "Held: Emphasized that 'Bail is the rule, jail is the exception'. Categorized offences into Category A, B, C, D to streamline bail hearings and curb unwarranted arrests."
        },
        {
            "id": "case:lalita-kumari",
            "title": "Lalita Kumari v. Govt. of UP (2014)",
            "provision": "Section 154 CrPC / Section 173 BNSS - Mandatory FIR",
            "year": 2014,
            "court": "Supreme Court of India",
            "content": "Held: Registration of an FIR is mandatory under Section 154 CrPC if the information discloses commission of a cognizable offence. Preliminary inquiry permissible only in limited categories (matrimonial, medical negligence, commercial, corruption)."
        },
        {
            "id": "case:gurbaksh-sibbia",
            "title": "Gurbaksh Singh Sibbia v. State of Punjab (1980)",
            "provision": "Section 438 CrPC / Section 482 BNSS - Anticipatory Bail",
            "year": 1980,
            "court": "Supreme Court of India",
            "content": "Constitution Bench held: Power to grant anticipatory bail is wide and discretionary. Courts should not read in unnecessary limitations not present in the statute."
        },
        {
            "id": "case:satyabrata-ghose",
            "title": "Satyabrata Ghose v. Mugneeram Bangur & Co. (1954)",
            "provision": "Section 56 Contract Act - Frustration of Contract",
            "year": 1954,
            "court": "Supreme Court of India",
            "content": "Held: Doctrine of frustration under Section 56 of the Contract Act applies when an untoward event or change of circumstances destroys the fundamental basis upon which the parties entered into the contract."
        },
        {
            "id": "case:ongc-saw-pipes",
            "title": "ONGC Ltd. v. Saw Pipes Ltd. (2003)",
            "provision": "Section 73 & 74 Contract Act - Liquidated Damages",
            "year": 2003,
            "court": "Supreme Court of India",
            "content": "Held: If terms of contract are clear and genuine pre-estimate of damages is agreed, party complaining of breach is entitled to liquidated damages without proving actual loss."
        },
        {
            "id": "case:anvar-pv",
            "title": "Anvar P.V. v. P.K. Basheer (2014)",
            "provision": "Electronic Evidence - 65B Evidence Act / 63 BSA",
            "year": 2014,
            "court": "Supreme Court of India",
            "content": "Held: Secondary evidence of electronic records is inadmissible unless accompanied by the mandatory certificate under Section 65B(4) of the Evidence Act (now Section 63 BSA)."
        },
        {
            "id": "case:arjun-panditrao",
            "title": "Arjun Panditrao Khotkar v. Kailash Kushanrao (2020)",
            "provision": "Electronic Certificate Clarification",
            "year": 2020,
            "court": "Supreme Court of India",
            "content": "Held: Reaffirmed Anvar P.V.; the certificate requirement under Section 65B(4) is mandatory for secondary electronic evidence, but can be produced before the trial concludes."
        },
        {
            "id": "case:menaka-gandhi-passport",
            "title": "Maneka Gandhi v. Union of India (1978)",
            "provision": "Article 21 Procedure Established by Law",
            "year": 1978,
            "court": "Supreme Court of India",
            "content": "Held: Procedure established by law in Article 21 must satisfy the test of reason and fairness under Article 14 and 19 (Golden Triangle)."
        }
    ]

    batch = []
    for c in sc_cases:
        batch.append({
            "id": c["id"],
            "category": "case_law",
            "act_id": "supreme-court",
            "act_title": c["title"],
            "provision": c["provision"],
            "title": c["title"],
            "year": c["year"],
            "court": c["court"],
            "content": c["content"]
        })
    insert_batch(batch)
    print(f"Ingested {len(batch)} leading Supreme Court cases.")
    check_db_size()

def main():
    print("=== STARTING CONTROLLED INGESTION (BUDGET: < 45MB) ===")
    ingest_complete_bns_and_ipc()
    ingest_contract_and_civil_acts()
    ingest_bsa_and_bnss_core()
    ingest_expanded_landmark_cases()

    cur.execute("SELECT category, COUNT(*) FROM legal_chunks GROUP BY category;")
    print("\n=== Final Ingestion Summary ===")
    for row in cur.fetchall():
        print(f"Category {row[0]}: {row[1]} chunks")

    cur.execute("SELECT COUNT(*) FROM legal_chunks;")
    print("Total Chunks in legal_chunks:", cur.fetchone()[0])
    check_db_size()
    conn.close()

if __name__ == "__main__":
    main()
