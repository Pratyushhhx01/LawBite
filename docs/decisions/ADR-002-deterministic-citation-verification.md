# ADR-002: Deterministic Statutory Citation Verification Decoupled from LLM Generation

## Status
Accepted

## Context
Generative language models, regardless of size or architecture, generate tokens probabilistically. In legal inquiries, models frequently suffer from "fluent hallucinations": inventing statutory section numbers that do not exist in the cited Act (e.g., citing Section 500 of the Indian Contract Act when the Act contains only 266 sections), attributing sections to the wrong statute, or citing dead colonial legislation without noting repeal.

In Indian legal practice under the Advocates Act, 1961, relying on a hallucinated statutory citation or overruled precedent before a court constitutes professional misconduct. Prompt-only safeguards ("do not hallucinate") reduce hallucination frequency but provide zero guarantees.

## Decision
We decouple statutory verification from generative inference by implementing an independent, deterministic post-generation and in-flight citation verification engine ([`lib/citation-verifier.ts`](file:///c:/Users/medev/Desktop/LawBite/lib/citation-verifier.ts)):

1. The chat route streams the generative LLM response via Server-Sent Events (SSE).
2. Concurrently, inline statutory references are extracted using regex patterns targeting Indian enactments (`§`, `Section`, `Article`, Act aliases).
3. The extracted Act and Section are verified against the authoritative Bare Acts knowledge base (PostgreSQL `legal_chunks` and S3 primary texts).
4. Each citation is classified into deterministic verification statuses:
   - `verified`: Confirmed to exist in the official gazetted bare act text with matched title and provision text.
   - `section_not_found`: The act exists, but the referenced section does not exist in the statutory enactment.
   - `act_not_resolved`: The statute name could not be mapped to any recognized central or state Indian enactment.
   - `untrusted_web_source`: Cited web link does not originate from verified Indian legal registries (e.g., e-Courts, Supreme Court portal, Indian Kanoon).
5. Verification results are emitted as an SSE event (`data: {"verification": ...}`) and displayed in the UI as verified source badges or ungrounded warning notices.

## Options Considered
1. **Prompt-Only Anti-Hallucination Guardrails:**
   - *Cons:* Probabilistic; cannot guarantee accuracy; fails on subtle section misattributions.
2. **Pre-Generation Constraint / Grammar-Based Sampling:**
   - *Cons:* Extremely high compute latency; inflexible when responding in conversational natural language.
3. **Decoupled Deterministic Verification Pipeline (Selected):**
   - *Pros:* Fully testable and hermetic without hitting LLM APIs; provides verifiable proof to users; transparently flags errors when the model makes a mistake.
   - *Cons:* Adds lightweight background lookup latency (mitigated by parallelizing verification with stream token generation).

## Consequences
- Every citation rendered in LawBite displays its authentic verification status.
- We never claim "hallucinations are eliminated"; rather, ungrounded citations are identified, flagged, and disclosed to the user with transparent uncertainty markers.
