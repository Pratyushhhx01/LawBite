# API Reference

All LawBite API routes are implemented as Next.js Route Handlers located under `app/api/`. This document outlines the endpoints, HTTP methods, request parameters, authentication requirements, response formats, and error handling.

---

## Authentication & Headers

Protected routes authenticate incoming requests using **Better Auth** session cookies (`better-auth.session_token`). When calling protected endpoints from non-browser clients, include the valid session cookie in the `Cookie` header.

### Common Response Status Codes
- `200 OK`: Request succeeded.
- `400 Bad Request`: Missing or invalid input payload.
- `401 Unauthorized`: Authentication required or session expired.
- `403 Forbidden`: Insufficient permissions (e.g., admin role required).
- `404 Not Found`: Target entity does not exist.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Server failure (with sanitized error details).

---

## Core AI & Chat Endpoints

### 1. AI Chat & Legal Advisory (`POST /api/chat`)
The primary streaming interface for interacting with the AI legal assistant.

- **Authentication:** Required (User session)
- **Rate Limit:** 30 requests / minute
- **Request Headers:**
  - `Content-Type: application/json`
- **Request Body:**
  ```json
  {
    "messages": [
      {
        "role": "user",
        "content": "What is the punishment for murder under Bharatiya Nyaya Sanhita?"
      }
    ],
    "conversationType": "default"
  }
  ```
  - `messages` (Array): Chronological list of user and assistant messages (max 100 messages, max 10,000 characters per message).
  - `conversationType` (String, optional): Interaction mode:
    - `"default"`: Concise, 2-line direct statutory advice (`reasoning_effort: instant`).
    - `"deep-analysis"`: In-depth 10–12 line breakdown with statutory matrix (`reasoning_effort: low`).
    - `"talk-to-ai"`: Conversational legal advice with real-time streaming tables (`reasoning_effort: instant`).
    - `"grill"`: AI Lawyer cross-examination mode with structured interrogation questions (`reasoning_effort: instant`).
    - `"draft"`: Legal drafting mode (`reasoning_effort: medium`).
    - `"review"`: Legal document review (routes automatically to vision/multimodal models).

- **Response:**
  - `Content-Type: text/event-stream` (Server-Sent Events)
  - Emits incremental streaming tokens and lifecycle events:
    ```text
    data: {"token": "Under"}
    data: {"token": " Section"}
    data: {"token": " 103"}
    data: {"citations": [{"kind": "section", "label": "Section 103 BNS", "verified": true, "reason": "verified"}]}
    data: [DONE]
    ```

---

### 2. Standalone Citation Verification (`POST /api/citations/verify`)
Verifies statutory provisions extracted from legal text against the official bare-act repository.

- **Authentication:** Required (User session)
- **Rate Limit:** 60 requests / minute
- **Request Body:**
  ```json
  {
    "text": "The accused was charged under Section 103 of Bharatiya Nyaya Sanhita and Section 302 of Indian Penal Code.",
    "citations": [
      { "label": "Section 103 BNS", "type": "act" }
    ]
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "results": [
      {
        "kind": "section",
        "type": "act",
        "raw": "Section 103",
        "label": "Section 103 BNS",
        "actKey": "bharatiya-nyaya-sanhita",
        "actName": "BNS",
        "section": "103",
        "source": "text",
        "verified": true,
        "reason": "verified",
        "matchedSection": "103",
        "sectionTitle": "Punishment for murder",
        "sectionText": "(1) Whoever commits murder shall be punished with death or imprisonment for life..."
      }
    ],
    "summary": {
      "total": 1,
      "sectionTotal": 1,
      "sectionVerified": 1,
      "sectionUnverified": 0,
      "sectionLookupErrors": 0,
      "verifiableSectionTotal": 1,
      "precision": 1.0,
      "hallucinationRate": 0.0,
      "referenceTotal": 0,
      "webTotal": 0,
      "webTrusted": 0
    }
  }
  ```

---

### 3. Legal Document Review (`POST /api/review`)
Parses and performs legal risk analysis, compliance checking, and clause review on uploaded agreements and court documents.

- **Authentication:** Required (User session)
- **Payload:** `multipart/form-data`
  - `file`: Document file (`.pdf`, `.docx`, `.txt`, `.png`, `.jpg`). Max file size 10MB.
  - `mode`: `"full"` | `"clauses"` | `"risk"` | `"summary"`
- **Success Response (`200 OK`):**
  ```json
  {
    "analysis": "Executive summary and clause analysis...",
    "clauses": [
      {
        "title": "Indemnity Clause",
        "riskLevel": "high",
        "explanation": "Uncapped liability without mutual limitation.",
        "suggestion": "Introduce an aggregate liability cap equal to 12 months of fees."
      }
    ],
    "citations": []
  }
  ```

---

## Conversation Management Endpoints

### 4. Conversations List & Create (`GET`, `POST`, `DELETE /api/conversations`)
- **`GET /api/conversations`**:
  - Fetches the current user's conversation history.
  - Response: `Array<{ id: string, title: string, created_at: string, updated_at: string }>`
- **`POST /api/conversations`**:
  - Creates or saves messages in an active conversation.
  - Body: `{ id?: string, title?: string, messages: Message[] }`
- **`DELETE /api/conversations`**:
  - Deletes a conversation by query param `?id=<conversation_id>`.

### 5. Generate Conversation Title (`POST /api/conversations/title`)
- **Authentication:** Required
- **Request Body:** `{ "userMessage": "How do I draft an eviction notice for non-payment?" }`
- **Success Response (`200 OK`):** `{ "title": "Eviction Notice Draft" }`

---

### 6. Conversation Sharing (`GET`, `POST /api/share`)
Enables generating public read-only links for specific legal consultations.

- **`POST /api/share`**:
  - Creates a public snapshot of a conversation.
  - Request Body: `{ "conversationId": "uuid" }` or `{ "message": Message }`
  - Response (`200 OK`): `{ "shareId": "c4b8e...", "shareUrl": "https://law-bite.vercel.app/shared/c4b8e..." }`
- **`GET /api/share?id=<shareId>`**:
  - Retrieves the public snapshot data. Authentication is not required to view shared conversations.

---

## Case Management & Document Uploads

### 7. Legal Cases (`GET`, `POST`, `PATCH`, `DELETE /api/cases`)
Manages litigation cases, client matters, and court dates.
- **`GET /api/cases`**: List all matters for the authenticated advocate/user.
- **`POST /api/cases`**: Create a new matter (fields: `title`, `caseNumber`, `court`, `clientName`, `status`, `notes`).
- **`PATCH /api/cases`**: Update an existing matter.
- **`DELETE /api/cases?id=<caseId>`**: Archive or delete a matter.

### 8. Case Documents (`GET`, `POST`, `DELETE /api/cases/documents`)
- Lists, associates, and removes case filings, petitions, orders, and annexures linked to specific matters.

### 9. Case Document Upload (`POST /api/cases/documents/upload`)
- Handles binary document uploads (`multipart/form-data`) securely uploaded to S3 storage.

---

## Administrative & Utility Endpoints

### 10. System Health Probe (`GET /api/health`)
Used by uptime monitoring, load balancers, and CI smoke workflows.

- **Authentication:** Public
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-11-01T23:13:00.000Z",
    "services": {
      "database": true,
      "auth": true,
      "s3_knowledge_base": true,
      "ai_provider_primary": true,
      "search_api": true
    }
  }
  ```

### 11. Legal News Feed (`GET /api/news`)
- Fetches recent updates, High Court/Supreme Court digests, and legislative notifications.
- Query Parameters: `?category=corporate|criminal|constitutional` (optional)

### 12. Legal Reminders & Hearing Dates (`GET`, `POST`, `PATCH`, `DELETE /api/reminders`)
- Manages limitation deadlines, appearance dates, and court filing reminders.
- Supports exporting iCalendar (`.ics`) formats.

### 13. Legal Notices (`GET`, `POST`, `PATCH`, `DELETE /api/notices`)
- Drafts, stores, and manages standard statutory legal notices (e.g., Section 138 NI Act cheque bounce notices, Section 106 Transfer of Property Act lease termination notices).

### 14. Document Export (`POST /api/export`)
- Generates downloadable formatted exports in PDF (`.pdf`) or Word (`.docx`) from chat advisory messages or drafted legal notices.
- Request Body: `{ "content": "markdown content", "format": "pdf" | "docx", "title": "Legal Notice" }`

### 15. User Profile (`PUT /api/user/profile`)
- Updates user preferences, default jurisdiction, and advocate credentials.
