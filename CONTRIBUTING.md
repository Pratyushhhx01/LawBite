# Contributing to LawBite

Thank you for your interest in contributing to **LawBite**! We are building an open, reliable, and production-grade Indian Legal AI platform. Whether you are fixing a bug, adding an Indian Bare Act, refining the citation verification engine, improving documentation, or adding test cases, your help is appreciated.

---

## 📜 Code of Conduct

All contributors and maintainers are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Please be respectful and professional in all communications.

---

## 🛠️ Development Setup

1. **Prerequisites:**
   - Node.js `>= 20.9.0` (see `.nvmrc`)
   - npm `>= 10.0.0`
   - Git

2. **Fork and Clone:**
   ```bash
   git clone https://github.com/<your-username>/LawBite.git
   cd LawBite
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Environment Setup:**
   ```bash
   cp .env.example .env.local
   ```
   Configure your test database and sandbox API keys. Never commit `.env.local` or any secrets.

5. **Start Dev Server:**
   ```bash
   npm run dev
   ```

---

## 🌿 Branching & Git Workflow

- Always branch off the latest `main` branch.
- Use descriptive branch naming conventions:
  - `feat/add-arbitration-amendments`
  - `fix/citation-regex-bnss`
  - `docs/update-ai-system-guide`
  - `test/add-case-law-mocks`
- Keep commits focused and atomic. Follow conventional commit messages:
  - `feat: add statutory transition mapping for BNSS §479`
  - `fix: resolve boundary edge case in section citation regex`
  - `docs: update competitive analysis comparison table`
  - `test: add unit tests for matter stage transition validation`

---

## 🧪 Testing & Quality Standards

Before submitting a Pull Request, you MUST ensure that all local quality checks pass:

```bash
# 1. Typecheck
npm run typecheck

# 2. Linter
npm run lint

# 3. Automated Test Suite (All 712+ tests must pass)
npm test

# 4. Security Audit
npm run audit
```

If you introduce a new feature or fix a bug:
- Add corresponding unit or integration tests under `tests/`.
- Ensure tests run cleanly with and without database connectivity (`CI_SKIP_DB_TESTS=1`).
- Never introduce mock data into production paths or hardcode fake legal statistics.

---

## ⚖️ Legal Accuracy Guidelines

LawBite operates in the legal domain where accuracy is critical:
- **Statutory Source Veracity:** Bare act texts and amendments must be sourced from official government gazettes or authoritative portals (e.g., `indiacode.nic.in`, `egazette.gov.in`).
- **Zero Hallucination Tolerance:** Never write code that fabricates or guesses statutory section numbers or precedent status. If an answer cannot be grounded in authoritative sources, return `Uncheckable` or `Unknown`.
- **Transitional Scope:** Pay careful attention to the date of offence/cause of action when dealing with criminal law provisions (IPC vs. BNS, CrPC vs. BNSS).

---

## 📬 Submitting a Pull Request

1. Push your branch to your fork.
2. Open a Pull Request targeting `main` on `Pratyushhhx01/LawBite`.
3. Fill out the [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md) completely, including:
   - Summary of changes
   - Motivation and context
   - Verification steps and test output
4. Ensure all GitHub Actions CI checks pass.
5. Address reviewer feedback promptly.
