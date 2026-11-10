# Known Engineering & Legal Limitations

## Philosophy of Open Disclosure
In contrast to proprietary AI platforms that make unsubstantiated claims of "100% legal accuracy" or "elimination of hallucinations," LawBite operates with engineering transparency. 

Every legal technology system built on large language models and retrieval-augmented generation (RAG) has boundaries governed by statutory currency, retrieval heuristics, jurisdictional variance, and model architecture.

This document catalogues the verified technical and legal limitations of the current LawBite platform, explains their root causes, and outlines corresponding mitigations or future architectural roadmaps.

---

## 1. Statutory & Jurisdictional Boundaries

### 1.1 State Amendments to Central Acts
- **Limitation:** While LawBite indexes 157+ Indian Central Bare Acts (as enacted by Parliament), specific state amendments enacted by state legislative assemblies (e.g., Maharashtra or Tamil Nadu amendments to the Code of Civil Procedure 1908 or Code of Criminal Procedure 1973) are not currently indexed in separate state-specific bare acts tables.
- **Impact:** For matters heavily governed by state-level modifications (e.g., local rent control acts, state land revenue codes, state court fees rules), the platform's bare acts retrieval reflects Central statutory provisions.
- **Mitigation:** The system prompt explicitly instructs the AI engine to advise users when state-level amendments frequently apply to a procedural question and suggests consulting local High Court rules or state gazettes.

### 1.2 Subordinate Legislation & Administrative Notifications
- **Limitation:** Notifications issued by statutory bodies (e.g., RBI circulars, SEBI master directions, DGFT notifications, local municipal bylaws) are retrieved primarily via Tier 4 (Tavily real-time legal search) rather than Tier 3 structured S3 bare acts tables.
- **Impact:** Subordinate regulations updated within the last 24–48 hours may occasionally experience retrieval latency if not yet indexed in high-ranking legal search engines.
- **Mitigation:** Tavily searches are executed with specific Indian legal domain whitelists (`prsindia.org`, `livelaw.in`, `barandbench.com`, `egazette.gov.in`).

---

## 2. Temporal Transition & Non-Retroactivity Edge Cases

### 2.1 The July 1, 2024 Criminal Law Overhaul
- **Background:** On July 1, 2024, the Bharatiya Nyaya Sanhita (BNS) 2023, Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, and Bharatiya Sakshya Adhiniyam (BSA) 2023 superseded the Indian Penal Code (IPC) 1860, Code of Criminal Procedure (CrPC) 1973, and Indian Evidence Act (IEA) 1872.
- **Limitation:** In complex, multi-year conspiracy or ongoing continuing offence matters that straddle both before and after July 1, 2024, determining whether IPC or BNS applies requires judicial interpretation of Section 358 BNS (repeal and savings clause) and Article 20(1) of the Indian Constitution.
- **Mitigation:** LawBite provides a deterministic cross-walk (`tests/bns-ipc-mapping.test.ts`), highlights statutory differences side-by-side, and explicitly flags temporal ambiguities for legal counsel review.

---

## 3. Retrieval & AI Architecture Trade-Offs

### 3.1 Non-Autoregressive Parallel Diffusion Trade-Offs
- **Advantage:** Inception Mercury 2.5 dLLM provides ultra-fast generation (~1.2s TTFT) by refining entire token sequences in parallel rather than token-by-token sequentially.
- **Limitation:** In rare instances where an exceptionally long legal brief (>3000 tokens) contains heavily nested lists of arbitrary formatting, diffusion token refinement can exhibit slight structural variance if reasoning parameters are set too low.
- **Mitigation:** LawBite routes complex legal drafting through explicit `reasoning_effort: "medium"`, providing the model with sufficient reasoning steps to ensure strict legal syntax.

### 3.2 Complex Scanned Document OCR
- **Limitation:** While `/api/cases/documents/upload` supports `.pdf`, `.docx`, `.doc`, and `.txt` files up to 10MB, poorly scanned photocopies of aged handwritten court order sheets (common in lower district courts) without embedded text streams require optical character recognition (OCR) that may produce partial character degradation.
- **Mitigation:** Text extraction validates character stream density; if a PDF contains only scanned bitmap images without an embedded text layer, the system advises the user to upload a searchable digital PDF or OCR-processed document.

---

## 4. Legal Status & Professional Practice Disclaimer

### 4.1 Not Legal Representation
- LawBite is an AI-powered legal information and workflow automation tool. It is **not** a law firm, advocate, or legal practitioner as defined under the Advocates Act, 1961.
- No attorney-client relationship is created through the use of LawBite.
- LawBite outputs do not constitute formal legal advice or substitute for the professional judgment of an advocate admitted to a State Bar Council.

### 4.2 Bar Council of India (BCI) Compliance
- In accordance with Rule 36, Section IV, Chapter II, Part VI of the Bar Council of India Rules (restricting commercial advertising and solicitation by advocates), LawBite operates strictly as an objective software platform and technology tool. It does not solicit clients, recommend individual advocates, or share fees with legal professionals.
