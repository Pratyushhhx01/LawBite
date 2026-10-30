import os
import re
import json
import csv
import urllib.request
import dotenv
import psycopg2
from sentence_transformers import SentenceTransformer

dotenv.load_dotenv(".env.local")

# Connect to Neon Postgres
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
        return resp.read().decode("utf-8")

def insert_chunk(chunk_id, category, act_id, act_title, provision, title, year, content, court=None):
    embedding_text = f"{act_title} {provision}: {title}\n{content}"
    vec = model.encode(embedding_text, normalize_embeddings=True)
    vec_str = "[" + ",".join(map(str, vec.tolist())) + "]"

    query = """
    INSERT INTO legal_chunks (id, category, act_id, act_title, provision, title, year, court, content, embedding)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (id) DO UPDATE SET
        content = EXCLUDED.content,
        title = EXCLUDED.title,
        embedding = EXCLUDED.embedding;
    """
    cur.execute(query, (chunk_id, category, act_id, act_title, provision, title, year, court, content, vec_str))

# Ingest BNS (Bharatiya Nyaya Sanhita, 2023)
def ingest_bns():
    print("Fetching BNS & IPC comparative data from Hugging Face...")
    csv_url = "https://huggingface.co/datasets/jbp123/bns/raw/main/Comparative%20Table%20of%20IPC%20and%20Bharatiya%20Nyaya%20Sanhita.csv"
    data = fetch_url(csv_url)
    reader = csv.reader(data.splitlines())
    
    count = 0
    for row in reader:
        if len(row) >= 8:
            sec_raw = row[2].strip()
            title = row[5].strip()
            ipc_equiv = row[7].strip()
            
            if sec_raw.lower().startswith("section "):
                sec_num = sec_raw.replace("Section ", "").strip()
                content = f"Bharatiya Nyaya Sanhita (BNS), 2023. Section {sec_num}: {title}. Corresponding IPC reference: {ipc_equiv}."
                chunk_id = f"bns:{sec_num}"
                insert_chunk(
                    chunk_id=chunk_id,
                    category="bare_act",
                    act_id="bharatiya-nyaya-sanhita",
                    act_title="Bharatiya Nyaya Sanhita, 2023",
                    provision=f"Section {sec_num}",
                    title=title,
                    year=2023,
                    content=content
                )
                count += 1
    print(f"Ingested {count} provisions into BNS.")

# Ingest Key Landmark Cases
def ingest_landmark_cases():
    print("Ingesting foundational Indian Supreme Court landmark cases...")
    landmark_cases = [
        {
            "id": "case:kesavananda-bharati",
            "title": "Kesavananda Bharati v. State of Kerala (1973)",
            "provision": "Basic Structure Doctrine",
            "year": 1973,
            "court": "Supreme Court of India",
            "content": "Held: Parliament's constituent power under Article 368 does not enable it to alter the basic structure or framework of the Constitution. Fundamental rights and judicial review form the bedrock of the Constitution."
        },
        {
            "id": "case:maneka-gandhi",
            "title": "Maneka Gandhi v. Union of India (1978)",
            "provision": "Article 21 - Right to Personal Liberty",
            "year": 1978,
            "court": "Supreme Court of India",
            "content": "Held: Procedure depriving a person of life or personal liberty must be just, fair, and reasonable, not arbitrary, fanciful, or oppressive. Article 21 is dynamic and encompasses human dignity."
        },
        {
            "id": "case:puttaswamy-privacy",
            "title": "K.S. Puttaswamy v. Union of India (2017)",
            "provision": "Article 21 - Right to Privacy",
            "year": 2017,
            "court": "Supreme Court of India",
            "content": "Held: The Right to Privacy is a fundamental right protected under Article 21 and Part III of the Constitution. Unanimous 9-judge bench decision upholding informational privacy and bodily autonomy."
        },
        {
            "id": "case:vishaka",
            "title": "Vishaka v. State of Rajasthan (1997)",
            "provision": "Sexual Harassment Guidelines",
            "year": 1997,
            "court": "Supreme Court of India",
            "content": "Held: Formulated mandatory guidelines (Vishaka Guidelines) to prevent sexual harassment of women at the workplace under Articles 14, 19, and 21, later codified in the POSH Act 2013."
        },
        {
            "id": "case:navtej-johar",
            "title": "Navtej Singh Johar v. Union of India (2018)",
            "provision": "Section 377 IPC Decriminalization",
            "year": 2018,
            "court": "Supreme Court of India",
            "content": "Held: Consensual sexual conduct between adults of the same sex is decriminalized. Section 377 IPC to the extent it criminalized consensual gay sex violates Articles 14, 15, 19, and 21."
        },
        {
            "id": "case:shayara-bano",
            "title": "Shayara Bano v. Union of India (2017)",
            "provision": "Triple Talaq (Talaq-e-Biddat)",
            "year": 2017,
            "court": "Supreme Court of India",
            "content": "Held: Practice of instantaneous Triple Talaq (Talaq-e-Biddat) declared unconstitutional and void as it is manifestly arbitrary and violates Article 14 of the Constitution."
        }
    ]

    for c in landmark_cases:
        insert_chunk(
            chunk_id=c["id"],
            category="case_law",
            act_id="supreme-court",
            act_title=c["title"],
            provision=c["provision"],
            title=c["title"],
            year=c["year"],
            court=c["court"],
            content=c["content"]
        )
    print(f"Ingested {len(landmark_cases)} Supreme Court landmark precedents.")

def main():
    ingest_bns()
    ingest_landmark_cases()
    cur.execute("SELECT COUNT(*) FROM legal_chunks;")
    print("Total rows in legal_chunks:", cur.fetchone()[0])
    conn.close()

if __name__ == "__main__":
    main()
