# LawBite Legal Research Engine

This document details the Indian Bare Acts corpus, case-law research engine, judicial paragraph citation methodology, precedent Good-Law checker, and statutory transition mapping.

---

## 1. Indian Bare Acts Knowledge Base (157+ Statutes)

LawBite maintains a structured corpus of over 157 central and commercial Indian enactments. 

### 1.1 Structural Organization
Statutes are indexed hierarchically to support $O(1)$ section lookups and avoid dumping massive multi-hundred-section texts into context:
```
bare-acts/
  ├── bharatiya-nyaya-sanhita/
  │   ├── index.json          # Metadata, preamble, enactment dates
  │   ├── _sections.json      # List of all sections and chapter headings
  │   └── sections/
  │       ├── 1.json          # Title, extent, commencement
  │       ├── 103.json        # Punishment for murder
  │       └── 302.json        # Uttering words to wound religious feelings
  ├── bharatiya-nagrik-suraksha-sanhita/
  ├── bharatiya-sakshya-adhiniyam/
  ├── indian-penal-code/
  ├── code-of-criminal-procedure/
  ├── constitution/
  └── indian-contract-act/
```

### 1.2 Dual Storage Strategy: PostgreSQL + AWS S3
- **Primary High-Speed Lookups:** PostgreSQL table `legal_chunks` stores 1,069 indexed chunks with full-text search vectors (`tsvector`) and section lookup indexes.
- **Cold Storage & Full Acts:** AWS S3 (`s3kb`) holds full JSON statutory trees. If S3 credentials are unavailable, the platform automatically resolves sections through the PostgreSQL chunk cache and local filesystem fallbacks.

---

## 2. Case-Law & Judgment Research Engine

The Case-Law Engine ([`lib/case-law-service.ts`](file:///c:/Users/medev/Desktop/LawBite/lib/case-law-service.ts)) allows advocates and researchers to query, inspect, and analyze authoritative Indian court judgments.

### 2.1 Database & Source Attribution
- Covers landmark Supreme Court of India and High Court decisions (*Kesavananda Bharati*, *Maneka Gandhi*, *Puttaswamy*, *Navtej Singh Johar*, *Kailash Nath Associates*, *Percept D'Mark*, *Arnesh Kumar*, *Shreya Singhal*, etc.).
- Every judgment record contains:
  - Full case title and official neutral/law report citations (e.g. `(1973) 4 SCC 225`).
  - Bench members and bench composition size.
  - Authentic judgment date and court forum.
  - Source URL to official court archives (`sci.gov.in`, `judgments.ecourts.gov.in`, or `indiankanoon.org`).
  - **Preserved Numbered Paragraphs:** Retains authentic judicial paragraph numbering (e.g. *Kesavananda Bharati* Para 316, *Puttaswamy* Para 119) for direct courtroom citation.

### 2.2 Multi-Parameter Search Filtering
Search queries can be filtered by:
- **Court:** Supreme Court, Delhi High Court, Bombay High Court, etc.
- **Judge / Bench Member:** e.g. "Khanna", "Chandrachud", "Nariman".
- **Year Range:** e.g. `2017` to `2024`.
- **Case Type:** Criminal Appeal, Writ Petition (Civil), Special Leave Petition.
- **Act & Section:** e.g. "Specific Relief Act", "Section 10".

---

## 3. Good-Law Precedent Status Checker

Generic LLMs frequently cite overruled or superseded decisions as active law. LawBite enforces strict legal-tech guardrails defined in [`lib/good-law.ts`](file:///c:/Users/medev/Desktop/LawBite/lib/good-law.ts):

### Strict Guardrail Rules:
1. **No LLM Guesses:** Precedent status is **NEVER** determined by a probabilistic LLM guess.
2. **Subsequent Judicial Treatment Evidence:** Requires explicit subsequent judgment citations (Court, Year, Citation, Paragraph, and Overruling Ground).
3. **Unverified Fallback:** If authoritative subsequent judicial treatment is absent from the ledger, the system explicitly returns `"Unverified"` rather than inventing certainty.

### Precedent Status Taxonomy:
- **Good Law:** Case remains binding law and has been followed or affirmed by subsequent benches (e.g. *Kesavananda Bharati v. State of Kerala*).
- **Overruled:** Expressly overruled by a larger bench (e.g. *ADM Jabalpur v. Shivkant Shukla* overruled by *Puttaswamy* in Para 119; *Golak Nath* overruled by *Kesavananda Bharati* in Para 1461; *Suresh Kumar Koushal* overruled by *Navtej Singh Johar* in Para 168).
- **Partially Overruled:** Specific propositions or paragraphs superseded while remainder stands.
- **Distinguished:** Narrowed to specific factual matrix and held inapplicable to general principle.
- **Clarified:** Subsequent bench explained scope or answered reference without overturning.

---

## 4. IPC to BNS Statutory Transition Engine

On 1 July 2024, the Indian Penal Code (1860) was repealed and replaced by the Bharatiya Nyaya Sanhita (2023). LawBite's transition engine ([`lib/ipc-bns-compare.ts`](file:///c:/Users/medev/Desktop/LawBite/lib/ipc-bns-compare.ts)) provides verified provision-by-provision mapping:

| IPC Section | Old Subject | BNS Equivalent | Key Wording & Penal Differences |
| :--- | :--- | :--- | :--- |
| **Section 302** | Murder | **Section 103(1)** | Maintained capital punishment; mob lynching given dedicated sub-section (103(2)). |
| **Section 420** | Cheating & dishonestly inducing property | **Section 318** | Reorganized cheating chapter; streamlined definitions. |
| **Section 379** | Theft | **Section 303** | Basic theft retained; snatched property split into dedicated Section 304. |
| **None (State)** | Snatching | **Section 304 (NEW)** | BNS introduces a dedicated 3-year penal offense for snatching. |
| **None** | Mob Lynching | **Section 103(2) (NEW)**| Explicit offense for group killings based on race, caste, sex, or language. |
| **None** | Organised Crime | **Section 111 (NEW)**| Comprehensive statutory definition of continuing unlawful activity. |

### Constitutional Temporal Applicability Rule:
Under Article 20(1) of the Constitution of India, criminal statutes cannot operate ex post facto:
- Offences committed **prior to 1 July 2024** are charged and prosecuted under the Indian Penal Code, 1860.
- Offences committed **on or after 1 July 2024** are charged under the Bharatiya Nyaya Sanhita, 2023.
- LawBite explicitly prompts users on date of offence before recommending penal sections.
