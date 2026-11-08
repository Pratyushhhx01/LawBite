# LawBite AI & Inference System Architecture

This document describes the AI model registry, inference providers, sampling parameters, multi-provider failover mechanics, prompt architecture, and anti-hallucination guardrails implemented in LawBite.

---

## 1. Provider Registry & Strategy

LawBite interfaces with OpenAI-compatible chat completion endpoints using a unified provider registry defined in [`lib/ai-providers.ts`](file:///c:/Users/medev/Desktop/LawBite/lib/ai-providers.ts). 

The platform does not let end users manually select AI models. Instead, the backend routes requests to an optimized default provider, walking a strictly defined catalog for failover if an upstream service degrades.

```
Request Dispatch
   │
   ▼
[1] Inception Labs (Mercury 2.5 dLLM) ──── (Success) ───► SSE Stream to User
   │
   ├─► HTTP 429 / 5xx / Timeout / Network Error
   ▼
[2] NVIDIA NIM (Nemotron-3 Super 120B) ─── (Success) ───► SSE Stream to User
   │
   ├─► Failover
   ▼
[3] NVIDIA NIM (Nemotron-3.5 Lightning 30B)
```

### 1.1 Primary Provider: Inception Labs (Mercury 2.5)
- **Model Architecture:** Diffusion Large Language Model (dLLM).
- **Why Diffusion?** Unlike traditional autoregressive LLMs that predict one token at a time from left to right, Mercury 2.5 generates and refines token sequences in parallel via discrete diffusion denoising. This dramatically slashes Time-to-First-Token (TTFT) and overall inference latency to ~0.8s–1.5s.
- **Reasoning Tiers (`reasoning_effort`):**
  - `instant`: Used for short modes (`chat`, `talk-to-ai`). Delivers sub-second immediate responses.
  - `low`: Used for `analysis` and statutory comparisons, balancing deliberation with low latency.
  - `medium`: Used for detailed document drafting and complex courtroom trial briefs.

### 1.2 Fallback Provider: NVIDIA NIM
- **Primary Fallback:** `nvidia/nemotron-3-super-120b-a12b` (120-billion parameter high-capacity reasoning model).
- **Secondary Fallback:** `nvidia/nemotron-3.5-lightning-30b` (low-latency high-throughput model).
- **Vision Inference:** `nvidia/llama-3.2-90b-vision-instruct` (used for image and scanned legal document OCR analysis).

---

## 2. Sampling Parameter Adaptation

Different AI providers enforce divergent constraints on sampling parameters. Passing unsupported parameters (such as `top_p` to Mercury 2.5) results in immediate HTTP 400 rejection. 

LawBite resolves this via `buildProviderPayload` in [`lib/ai-providers.ts`](file:///c:/Users/medev/Desktop/LawBite/lib/ai-providers.ts):

| Parameter | Inception Mercury 2.5 | NVIDIA NIM | Handled By LawBite |
| :--- | :---: | :---: | :--- |
| `temperature` | Supported (0.0 to 1.0) | Supported | Kept low (0.1–0.3) for legal precision. |
| `top_p` | **Rejected** (causes 400) | Supported | Stripped automatically for Inception requests. |
| `reasoning_effort` | Supported (`instant` / `low` / `medium`) | Stripped | Mapped to nearest valid level per provider. |
| `max_completion_tokens`| Supported | Supported | Enforced globally to prevent truncated JSON/SSE. |
| `stop` | Supported | Supported | Used to terminate generation cleanly. |

---

## 3. Specialized Conversation Modes

LawBite tailors system prompts and reasoning parameters across 6 distinct operational modes:

| Mode | Target Output | Reasoning Effort | Grounding Strategy |
| :--- | :--- | :---: | :--- |
| **Default Chat (`chat`)** | 2-line direct answers | `instant` | Statutory section retrieval + citation badges |
| **Deep Analysis (`analysis`)** | 10–12 line breakdowns + statutory comparison | `low` | Dual-code mapping (IPC vs BNS) + Bare Acts |
| **Talk to AI (`talk-to-ai`)** | Natural conversational advisory | `instant` | Conversational grounding + web search |
| **AI Lawyer (`grill`)** | Probing cross-examination | `low` | Procedural fact interrogation + limitation check |
| **Document Drafter (`draft`)** | Enforceable legal agreements & notices | `medium` | Statutory template injection + mandatory clauses |
| **Document Review (`review`)** | Risk audit on uploaded contracts/PDFs | `medium` | AST clause segmentation + statutory risk rules |

---

## 4. Hallucination Prevention Framework

Generic LLMs suffer from severe failure modes when answering Indian legal inquiries:
1. **The BNS Section Trap:** Citing Section 302 of the Bharatiya Nyaya Sanhita for murder (BNS 302 punishes wounding religious feelings; murder is BNS 103(1)).
2. **Fabricated Sections:** Inventing non-existent procedural sections (e.g. Section 99999 BNSS).
3. **Anachronistic Attribution:** Citing repealed IPC or CrPC provisions for offences committed after 1 July 2024.

LawBite implements a 3-layer anti-hallucination defense:

### Layer 1: Context Grounding (Pre-Generation)
Prior to model dispatch, the user query is classified for statutory keywords. Primary statutory texts are retrieved from the knowledge base and injected into the prompt context:
```markdown
[OFFICIAL PRIMARY STATUTORY CONTEXT]
Act: Bharatiya Nyaya Sanhita, 2023
Section 103(1): Punishment for murder. Whoever commits murder shall be punished with death, or imprisonment for life...
Section 302: Uttering words with intent to wound religious feelings...
```

### Layer 2: Negative Constraint Prompting
System prompts strictly instruct the model:
- *"Never guess a section number. If the exact provision is uncertain, explicitly state that statutory verification is required."*
- *"Distinguish clearly between offences committed prior to 1 July 2024 (IPC) and offences committed on or after 1 July 2024 (BNS)."*

### Layer 3: Deterministic Citation Verification (Post-Generation)
Rather than trusting the model's text, [`lib/citation-verifier.ts`](file:///c:/Users/medev/Desktop/LawBite/lib/citation-verifier.ts) extracts every cited `Section X of Act Y` or `Article Z` and deterministically looks up the section in primary Bare Act files. 
- **Verified:** Provision exists in primary statutory text $\rightarrow$ green verified badge.
- **Section Not Found:** LLM invented a section $\rightarrow$ explicit red warning (`Not found in named act`).
- **Uncheckable:** Source text unavailable in knowledge base $\rightarrow$ gray unverified badge. No provision is falsely marked verified.
