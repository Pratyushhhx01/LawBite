# Legal Knowledge Base & Source Hierarchy Policy

## 1. Statutory Grounding Principle
LawBite adheres to a strict statutory hierarchy for all Indian legal intelligence. The platform prioritizes authoritative primary sources published by the Government of India, the Parliament of India, the Supreme Court of India, and State High Courts over secondary commentaries or unverified internet summaries.

---

## 2. Source Hierarchy (Order of Precedence)

```
Level 1: Official Gazette of India (The Gazette of India / e-Gazette)
   └── Definitive notification of Parliamentary Acts, Presidential Assent, and Commencement Dates.

Level 2: India Code (Digital Repository of All Central Acts)
   └── Canonical text of enacted Central Acts maintained by Ministry of Law and Justice.

Level 3: Judicial Decisions of the Supreme Court of India & High Courts
   └── Official law reports (SCR, SCC, AIR) and digital repositories (e-SCR, High Court portals).

Level 4: Subordinate Legislation & Regulatory Notifications
   └── RBI Master Directions, SEBI Circulars, CBDT Notifications, MCA Rules.

Level 5: Secondary Commentary & Academic Law Reviews (Filtered / Reference Only)
   └── Standard treatises (Mulla, Ratanlal & Dhirajlal, Sarkar) used solely for interpretive context.
```

---

## 3. The 157+ Indian Bare Acts Knowledge Base

The core statutory grounding of LawBite is driven by structured Bare Acts stored in AWS S3 and Neon PostgreSQL (`legal-kb-db`).

### Key Statutory Categories Indexed:
1. **Constitutional & Administrative:**
   - Constitution of India (1950)
   - Right to Information Act (2005)
   - Commissions of Inquiry Act (1952)
2. **Criminal & Penal Law:**
   - Bharatiya Nyaya Sanhita (2023)
   - Indian Penal Code (1860)
   - Bharatiya Nagarik Suraksha Sanhita (2023)
   - Code of Criminal Procedure (1973)
   - Bharatiya Sakshya Adhiniyam (2023)
   - Indian Evidence Act (1872)
   - Protection of Children from Sexual Offences (POCSO) Act (2012)
   - Prevention of Corruption Act (1988)
   - Unlawful Activities (Prevention) Act (1967)
   - Narcotic Drugs and Psychotropic Substances (NDPS) Act (1985)
3. **Commercial & Corporate Law:**
   - Indian Contract Act (1872)
   - Specific Relief Act (1963)
   - Companies Act (2013)
   - Insolvency and Bankruptcy Code (2016)
   - Arbitration and Conciliation Act (1996)
   - Sale of Goods Act (1930)
   - Indian Partnership Act (1932)
   - Limited Liability Partnership Act (2008)
   - Negotiable Instruments Act (1881)
4. **Technology, Privacy & Intellectual Property:**
   - Digital Personal Data Protection Act (2023)
   - Information Technology Act (2000)
   - Patents Act (1970)
   - Copyright Act (1957)
   - Trade Marks Act (1999)
5. **Civil, Family & Consumer Law:**
   - Code of Civil Procedure (1908)
   - Consumer Protection Act (2019)
   - Hindu Marriage Act (1955)
   - Special Marriage Act (1954)
   - Protection of Women from Domestic Violence Act (2005)
   - Motor Vehicles Act (1988)
   - Real Estate (Regulation and Development) Act (RERA) (2016)

---

## 4. Currency & Gazette Tracking Protocol

To ensure legal accuracy over time:
1. **Enactment Tracking:** When Parliament passes an amendment, the Gazette of India notification number, date of notification, and date of enforcement are logged in `app/cases/amendments-data.ts`.
2. **Side-by-Side Textual Differencing:** Pre-amendment text is preserved alongside the post-amendment enactment so advocates can analyze both historical and current applications.
3. **Repeal & Savings Preservation:** Whenever a statute is repealed (such as IPC 1860 or CrPC 1973), the statute is **not** deleted from the knowledge base. It remains accessible with historical tags to support pending trials and appeals governing pre-commencement offenses under Article 20(1) of the Constitution.
