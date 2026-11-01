# Deployment Guide

This guide covers deployment instructions, environment configuration, database provisioning, external service integrations, and post-deployment verification for LawBite.

---

## Deployment Architecture

LawBite is designed for production deployment on platforms such as **Vercel**, **AWS**, or self-hosted container environments running Node.js 20.9+.

```mermaid
flowchart LR
    subgraph Hosting["Hosting Layer (Vercel / Node Server)"]
        NextServer["Next.js 16 Runtime (Node.js >= 20.9)"]
    end

    subgraph Database["Database (Neon)"]
        Postgres[("Neon Serverless PostgreSQL")]
    end

    subgraph Storage["Storage Layer"]
        S3Bucket[("AWS S3 (lawbite-app-storage)")]
    end

    subgraph ExternalAPIs["External AI & Search APIs"]
        Inception["Inception Labs API (Mercury 2.5)"]
        Nvidia["NVIDIA NIM API (Nemotron 120B / Vision)"]
        Tavily["Tavily Search API"]
    end

    NextServer <-->|"Better Auth & Kysely (pg Pool)"| Postgres
    NextServer <-->|"AWS SDK v3 (GetObject bare-acts/*)"| S3Bucket
    NextServer -->|"HTTPS REST / Streaming SSE"| Inception
    NextServer -->|"HTTPS REST / Failover"| Nvidia
    NextServer -->|"HTTPS REST"| Tavily
```

---

## Environment Variables Specification

Configure the following environment variables in your deployment environment (e.g., Vercel Project Settings or container environment variables):

### 1. Database Configuration (Required)
| Variable | Description | Example / Format |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL pooled connection string. Requires SSL mode. | `postgresql://user:pass@ep-xyz.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |

### 2. Authentication Configuration (Required)
| Variable | Description | Example / Format |
| :--- | :--- | :--- |
| `BETTER_AUTH_SECRET` | 32-byte cryptographically secure random string. Generate with `openssl rand -base64 32`. | `dGhpc2lzYXNlY3JldGtleXRvYmUyNTZieXRlcw==` |
| `BETTER_AUTH_URL` | Canonical server URL for Better Auth callbacks. | `https://law-bite.vercel.app` (or `http://localhost:3000` locally) |
| `NEXT_PUBLIC_APP_URL` | Canonical public origin for client links and shared consultations. | `https://law-bite.vercel.app` |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console. | `xxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret from Google Cloud Console. | `GOCSPX-xxxx` |
| `GITHUB_CLIENT_ID` | OAuth Client ID from GitHub Developer Settings. | `Ov23li...` |
| `GITHUB_CLIENT_SECRET` | OAuth Client Secret from GitHub Developer Settings. | `e4c8...` |

### 3. AI Providers (At least one required; both recommended for failover)
| Variable | Description | Default / Role |
| :--- | :--- | :--- |
| `INCEPTION_API_KEY` | Inception Labs API key (`sk_...`). | Default primary provider (Mercury 2.5 dLLM). |
| `NVIDIA_API_KEY` | NVIDIA NIM API key (`nvapi-...`). | Automatic fallback provider and document review vision model. |

### 4. Legal Knowledge Base & AWS S3 (Recommended)
| Variable | Description | Example / Notes |
| :--- | :--- | :--- |
| `AWS_REGION` | AWS region hosting the S3 bucket. | `ap-south-1` |
| `AWS_ACCESS_KEY_ID` | IAM access key with read-only permissions to bare acts. | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | IAM secret access key. | Sensitive secret. Never commit. |
| `S3_BUCKET_NAME` | S3 bucket containing the structured bare acts corpus. | `lawbite-app-storage` |

### 5. Real-Time Search & Additional Services (Optional)
| Variable | Description | Notes |
| :--- | :--- | :--- |
| `TAVILY_API_KEY` | Tavily Search API key. | Augments chat with real-time Indian legal web search. |
| `SMTP_HOST` | Transactional email SMTP host. | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port (e.g. 587 for STARTTLS). | `587` |
| `SMTP_USER` | SMTP username / address. | `notifications@lawbite.in` |
| `SMTP_PASS` | SMTP app password. | Application-specific password. |
| `SMTP_FROM` | Outgoing email sender header. | `"LawBite" <no-reply@lawbite.in>` |
| `ADMIN_EMAILS` | Comma-separated admin emails for administrative routes. | `advocate@example.com,admin@lawbite.in` |
| `TRUSTED_ORIGINS` | Comma-separated allowed origins for Better Auth CORS. | `https://law-bite.vercel.app` |

### 6. Performance & Latency Overrides (Optional Tuning)
| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `CHAT_REASONING_EFFORT` | Per-mode | Override reasoning budget (`instant`, `low`, `medium`, `high`). |
| `CHAT_REALTIME` | `1` | Enable Inception low-latency realtime mode (`1` = enabled, `0` = disabled). |
| `CHAT_RATE_LIMIT_RETRIES` | `3` | Number of retries on HTTP 429 rate limits before falling back. |
| `CHAT_RATE_LIMIT_BACKOFF_MS`| `300,800,1600` | Backoff delay series in milliseconds. |

---

## Deployment Steps (Vercel)

### 1. Database Setup (Neon PostgreSQL)
1. Create a serverless PostgreSQL instance on [Neon](https://neon.tech).
2. Run database migrations to initialize Better Auth tables and the legal chunks table:
   ```bash
   node scripts/migrate-legal-kb.mjs
   ```

### 2. IAM & S3 Configuration (AWS)
1. Ensure the S3 bucket `lawbite-app-storage` is populated with `bare-acts/` and `reference/`.
2. Attach a minimal read-only IAM policy to the deployment credentials:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:GetObject"],
         "Resource": ["arn:aws:s3:::lawbite-app-storage/bare-acts/*", "arn:aws:s3:::lawbite-app-storage/reference/*"]
       }
     ]
   }
   ```

### 3. Build & Deploy
1. Link your repository in Vercel:
   - Framework preset: **Next.js**
   - Node.js Version: **20.x** or higher
2. Add all environment variables listed above under **Project Settings $\rightarrow$ Environment Variables**.
3. Deploy the project. The build command executed is:
   ```bash
   npm run build
   ```

---

## Post-Deployment Verification & Smoke Testing

Once deployment is live, execute the following verification steps:

1. **Verify Health Endpoint:**
   ```bash
   curl -i https://your-deployment-url.vercel.app/api/health
   ```
   Confirm that HTTP status is `200 OK` and all critical subsystem booleans report `true`.

2. **Verify S3 Knowledge Base Connectivity:**
   Run the diagnostic script locally against production credentials:
   ```bash
   npm run check:s3
   ```

3. **Execute Deployed Smoke Test:**
   Run the deployed smoke suite against your live URL:
   ```bash
   $env:DEPLOYED_BASE_URL = "https://your-deployment-url.vercel.app"
   npx vitest run tests/deployed/api-smoke.test.ts
   ```
   This automatically validates session creation, authenticated chat dispatch, and token streaming across the production deployment.
