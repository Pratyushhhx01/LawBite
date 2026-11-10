# ADR-001: Non-Autoregressive Diffusion LLM as Primary Inference Engine

## Status
Accepted

## Context
Traditional Large Language Models (LLMs) rely on autoregressive token generation ($O(N)$ sequential steps where token $t_{n}$ depends on $t_{n-1}$). In legal inquiry workflows, this produces high time-to-first-token (TTFT) and high total response latency (often 8–15 seconds for structured 500-token legal analyses), which degrades user experience and increases costs during streaming.

Furthermore, legal technology platforms require low-latency generation of structured statutory tables, procedural step lists, and cross-examination outlines.

## Decision
We select **Inception Labs Mercury 2.5 (Diffusion Language Model / dLLM)** as LawBite's default primary inference engine, with automatic zero-downtime fallback to **NVIDIA NIM (Meta Llama 3.3 70B Instruct / Nemotron)**.

We configure three explicit reasoning tiers based on conversation mode:
1. `instant` for concise 2-line direct answers (`default`, `talk-to-ai`).
2. `low` for detailed structured queries (`analysis`).
3. `medium` for deep interrogative discovery and drafting (`grill`, `draft`, `courtroom`).

## Options Considered
1. **Autoregressive Commercial APIs (OpenAI GPT-4o / Anthropic Claude 3.5 Sonnet):**
   - *Pros:* High general knowledge base.
   - *Cons:* Autoregressive sequential generation latency; vendor lock-in; higher cost per token; inability to control sampling parameters at the diffusion step level.
2. **Local Self-Hosted LLMs (vLLM / Ollama):**
   - *Pros:* Complete infrastructure control.
   - *Cons:* High GPU maintenance overhead; not viable on standard serverless tiers without dedicated GPU cluster provisioning.
3. **Inception Mercury 2.5 (dLLM) + NVIDIA NIM Fallback (Selected):**
   - *Pros:* Parallel token generation; markedly lower TTFT (1.2s vs 3.5s+); explicit `reasoning_effort` knobs; automatic failover protects against provider outages.
   - *Cons:* Diffusion models do not support `top_p` sampling; requires custom provider parameter sanitization in `lib/ai-providers.ts`.

## Consequences
- Single provider registry in `lib/ai-providers.ts` strips unsupported parameters (`top_p`, `temperature` outside accepted ranges) before dispatch.
- When Inception experiences rate limits (429) or timeouts, the request seamlessly fails over to NVIDIA NIM without dropping the client stream.
- The user cannot manually select the model; the backend manages provider health and failover automatically.
