# LawBite Production Deployment Guide

This document covers production build configuration, environment variable specifications, Neon PostgreSQL deployment, Vercel infrastructure, and troubleshooting runbooks.

---

## 1. Hosting & Infrastructure Architecture

LawBite is designed for deployment on modern serverless edge infrastructure:
- **Web & API Host:** [Vercel](https://vercel.com/) (Next.js 16 App Router)
- **Database:** [Neon Serverless PostgreSQL](https://neon.tech/) with connection pooling
- **Document & Knowledge Storage:** AWS S3 (`ap-south-1` Mumbai)
- **Primary Inference:** Inception Labs API (Diffusion LLM)
- **Fallback Inference:** NVIDIA NIM API Gateway
- **Live Search:** Tavily Search API

---

## 2. Production Environment Variables

Ensure the following variables are configured in the Vercel Project Settings:

```env
# Database (Neon Serverless PostgreSQL)
DATABASE_URL=postgresql://user:password@ep-xyz.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Authentication (Better Auth)
BETTER_AUTH_SECRET=your-random-32-character-secret-key-here
BETTER_AUTH_URL=https://law-bite.vercel.app
NEXT_PUBLIC_APP_URL=https://law-bite.vercel.app

# OAuth 2.0 Identity Providers
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret

# AI Inference Providers
INCEPTION_API_KEY=il_live_your_inception_labs_api_key
NVIDIA_API_KEY=nvapi-your-nvidia-nim-api-key

# Live Legal Web Augmentation
TAVILY_API_KEY=tvly-your-tavily-search-api-key

# AWS S3 Storage & Bare Acts
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA_YOUR_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
S3_BUCKET_NAME=lawbite-app-storage

# Admin Authorization (Comma-separated admin emails)
ADMIN_EMAILS=advocate@lawbite.ai,admin@lawbite.ai
```

---

## 3. Database Migration & Initialization

LawBite uses Neon tools for schema changes. When creating tables on a fresh Neon instance:

```sql
-- 1. Create Legal Chunks table for Bare Acts RAG
CREATE TABLE IF NOT EXISTS legal_chunks (
    id TEXT PRIMARY KEY,
    act_id VARCHAR(120) NOT NULL,
    provision VARCHAR(64) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', title || ' ' || content)
    ) STORED
);
CREATE INDEX IF NOT EXISTS idx_legal_chunks_act ON legal_chunks(act_id);
CREATE INDEX IF NOT EXISTS idx_legal_chunks_provision ON legal_chunks(provision);
CREATE INDEX IF NOT EXISTS idx_legal_chunks_search ON legal_chunks USING GIN(search_vector);

-- 2. Create Legal Matter Management tables
CREATE TABLE IF NOT EXISTS case_folder (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    name VARCHAR(120) NOT NULL,
    description VARCHAR(2000) DEFAULT '',
    status VARCHAR(32) DEFAULT 'active',
    stage VARCHAR(64) DEFAULT 'Pre-litigation',
    "matterType" VARCHAR(120) DEFAULT 'General',
    priority VARCHAR(32) DEFAULT 'Medium',
    parties VARCHAR(1000) DEFAULT '',
    court VARCHAR(500) DEFAULT '',
    "nextHearing" TIMESTAMPTZ,
    notes VARCHAR(5000) DEFAULT '',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_case_folder_user ON case_folder("userId");

CREATE TABLE IF NOT EXISTS case_document (
    id TEXT PRIMARY KEY,
    "caseId" TEXT NOT NULL REFERENCES case_folder(id) ON DELETE CASCADE,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    version INT DEFAULT 1,
    "docType" TEXT DEFAULT 'general',
    "fileSize" INT DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matter_activity (
    id TEXT PRIMARY KEY,
    "matterId" TEXT NOT NULL REFERENCES case_folder(id) ON DELETE CASCADE,
    "userId" TEXT NOT NULL,
    "activityType" VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matter_report (
    id TEXT PRIMARY KEY,
    "matterId" TEXT NOT NULL REFERENCES case_folder(id) ON DELETE CASCADE,
    "userId" TEXT NOT NULL,
    "reportType" VARCHAR(64) NOT NULL,
    title TEXT NOT NULL,
    summary TEXT DEFAULT '',
    "reportData" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Production Build & Verification

To verify the production build locally before triggering a deployment:
```bash
# 1. Verify strict TypeScript compliance
npx tsc --noEmit

# 2. Verify ESLint rules
npm run lint

# 3. Test Next.js production build (Turbopack)
npm run build
```
Once pushed to the `main` branch on GitHub (`Pratyushhhx01/LawBite`), Vercel automatically deploys the updated commit.
