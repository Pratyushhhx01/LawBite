# LawBite Data Handling & Privacy Policy

This document describes how user inquiries, legal documents, matter records, and account credentials are treated, stored, and protected in LawBite.

---

## 1. Core Principles

LawBite handles legal inquiries and client documentation with the following guarantees:
1. **Multi-Tenant Separation:** A user cannot view, query, edit, or delete another user's matters, uploaded contracts, draft pleadings, or consultation transcripts.
2. **Zero Third-Party Training:** User-uploaded legal contracts, pleadings, and confidential prompt inquiries are **never** utilized to train foundation models or fine-tune public models.
3. **No Credential Exposure:** Secrets, API keys, and session tokens are strictly kept server-side and never logged or exposed in client payloads.

---

## 2. Document Processing & In-Memory Sandboxing

When a user uploads a legal agreement, contract, or court pleading (`.pdf`, `.docx`):
- **Processing Scope:** Documents are parsed in-memory using Node.js buffers (`pdf-parse`, `mammoth`).
- **Storage Mode:** Documents attached to legal matters are stored either in private, authenticated S3 prefixes (`cases/${userId}/${caseId}/`) or stored as private base64 data URIs directly within the user's isolated database record.
- **Access Control:** The document serving route (`/api/cases/documents/[docId]`) verifies that `userId == session.user.id` before streaming document bytes. Documents are served with `Cache-Control: private, max-age=3600`.

---

## 3. Data Retention & Deletion

Users retain sovereign control over their legal workspace:
- **Matter Deletion:** When a user deletes a legal matter in the workspace, the database initiates an atomic cascading transaction (`ON DELETE CASCADE`) that completely deletes all linked document records, matter activity logs, and AI analysis reports.
- **Conversation Deletion:** Users can delete individual consultation sessions or clear their chat history at any time. Deleted conversations are pruned immediately from the database.
- **Account Deletion:** Pruning an account completely removes all linked sessions, accounts, conversations, and matters.

---

## 4. Third-Party Provider Boundaries

| Provider | Data Transmitted | Privacy Safeguards |
| :--- | :--- | :--- |
| **Inception Labs** | Prompt text and relevant statutory chunks | Commercial inference API; prompts are ephemeral and not retained for public training. |
| **NVIDIA NIM** | Prompt text on fallback failover | Enterprise NIM endpoint governed by standard non-retention policies for API requests. |
| **Tavily Search** | Sanitized legal query keywords | Transmits search terms to query official public legal portals (`sci.gov.in`, `indiankanoon.org`). |
| **Neon PostgreSQL**| User metadata, matters, and consultation history | Enterprise cloud database running in private VPC with SSL transmission encryption. |

---

## 5. Important Legal Notice

LawBite is an AI-powered legal assistance, research, and matter organization platform. It provides information and drafting assistance based on primary statutory texts and judicial records. **It does not constitute formal legal advice and does not establish an advocate-client privilege relationship.** Users should always consult a licensed Indian advocate before executing contracts, filing pleadings, or taking binding legal action.
