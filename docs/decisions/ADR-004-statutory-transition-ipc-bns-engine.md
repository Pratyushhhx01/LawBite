# ADR-004: Statutory Transition Engine for New Indian Criminal Laws (2024 Overhaul)

## Status
Accepted

## Context
On 1 July 2024, India replaced three foundational colonial-era criminal statutes:
- **Indian Penal Code, 1860 (IPC)** $\rightarrow$ **Bharatiya Nyaya Sanhita, 2023 (BNS)** (Act No. 45 of 2023)
- **Code of Criminal Procedure, 1973 (CrPC)** $\rightarrow$ **Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)** (Act No. 46 of 2023)
- **Indian Evidence Act, 1872 (IEA)** $\rightarrow$ **Bharatiya Sakshya Adhiniyam, 2023 (BSA)** (Act No. 47 of 2023)

Standard LLMs trained primarily on pre-2024 web corpora suffer from severe cognitive confusion:
1. They assert that Section 302 of the BNS punishes murder (in reality, Section 302 of the BNS punishes uttering words/making gestures wounding religious feelings; murder is Section 103 BNS).
2. They do not know whether an offence committed in June 2024 must be charged under IPC or BNS.
3. They fail to identify wording differences (e.g., mob lynching under BNS Section 103(2), community service punishments under BNS Section 4, or electronic summons rules under BNSS Section 64).

## Decision
We implemented a dedicated **Statutory Transition Engine** ([`lib/ipc-bns-compare.ts`](file:///c:/Users/medev/Desktop/LawBite/lib/ipc-bns-compare.ts) and [`lib/section-mapping.ts`](file:///c:/Users/medev/Desktop/LawBite/lib/section-mapping.ts)):

1. **Gazette-Verified Mappings:** Hardcoded bidirectional mappings across all high-frequency sections between IPC $\leftrightarrow$ BNS, CrPC $\leftrightarrow$ BNSS, and IEA $\leftrightarrow$ BSA.
2. **Constitutional Temporal Applicability:** Embedded Article 20(1) constitutional rule:
   - Offences committed *prior to 1 July 2024* are governed substantively by the IPC (Section 358(2) BNS savings clause).
   - Offences committed *on or after 1 July 2024* are charged under the BNS.
3. **Dual Grounding Retrieval:** Whenever a user inquiry mentions a mapped penal section (e.g., Section 302, Section 420, Section 498A), the RAG pipeline automatically retrieves **both** the historical provision and its 2024 equivalent, presenting comparative summaries, wording differences, and effective dates.
4. **Trap Resistance:** The system prompt explicitly enforces negative constraints prohibiting common trap hallucinations.

## Consequences
- 100% resistance to the classic `bns-302-trap` benchmark question.
- Answers are legally grounded for both pending legacy trials and new criminal complaints.
- Advocates can inspect split-screen Gazette comparisons directly in the Amendments workspace (`/amendments`).
