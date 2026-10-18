# LawBite

An AI legal assistant for Indian law. Ask questions in plain language and get
answers grounded in 157+ Indian bare acts (BNS/IPC, BNSS/CrPC, the Constitution
and more), with optional real-time web search and document drafting/review.

## Requirements

- Node.js 20 or newer
- A PostgreSQL database (Neon) plus the environment variables listed in `AGENTS.md`

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Scripts

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (flat config, eslint-config-next)
npm run test         # Vitest single run
npm run test:watch   # Vitest in watch mode
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

See `AGENTS.md` for project structure, stack, and conventions.
