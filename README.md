# 🎓 Aira — Your Board Exam Buddy

> AI-powered doubt-solving chat bot for Class 12 CBSE students, grounded in real 2025 board paper questions.

[![Status](https://img.shields.io/badge/status-planning-yellow)]() [![Stack](https://img.shields.io/badge/stack-Next.js%20%2B%20Supabase%20%2B%20OpenRouter-blue)]() [![Cost](https://img.shields.io/badge/cost-%240%2Fmo-green)]()

**Repo:** `github.com/ShivUP32/aira`
**Live URL (planned):** `aira-shivup32.vercel.app`

---

## What is Aira?

A free web app where Class 12 students can:
- 💬 Ask any doubt and get an AI answer cited to real 2025 CBSE papers
- 📚 Learn concepts step-by-step with comprehension checks
- ✏️ Practice with actual board questions and get marking-scheme feedback
- 🔄 Revise chapters with concise packs and quick quizzes

**Subjects (v1):** Physics · Chemistry · Mathematics · Computer Science · English

---

## Architecture at a Glance

```
Browser (Next.js PWA)  →  Vercel (Edge + API)  →  OpenRouter (free LLMs)
                              │
                              ├──→  Supabase (Auth + Postgres + pgvector)
                              ├──→  Hugging Face (live query embeddings)
                              └──→  Upstash Redis (rate limits)

Python pipeline (local) — Marker + PyMuPDF — runs once to ingest the PDFs
```

## Tech Stack — All Free Tier

| Layer | Choice | Why |
|------|--------|-----|
| Frontend | Next.js 14 + Tailwind + shadcn/ui | Modern, Vercel-native |
| LLM | OpenRouter free models (Llama 3.3 / Gemini 2.0 / DeepSeek R1) | $0 cost, multi-model fallback |
| DB + Vectors | Supabase Postgres + pgvector | One platform |
| Auth | Supabase Auth (email + Google) | Free 50k MAU |
| Embeddings | `paraphrase-multilingual-MiniLM-L12-v2` (local) | Free, 384-dim, supports Hindi+English |
| PDF parse | Marker (math) + PyMuPDF (text) | Free, LaTeX-aware |
| Hosting | Vercel | Free tier |
| Rate limits | Upstash Redis | Free 10k/day |

## Cost: $0/month (within free tiers)

---

## Documentation

- 🎯 **[EXECUTION_PLAN.md](./EXECUTION_PLAN.md)** — Start here. Phased build plan with all decisions locked.
- 📄 **[PRD.md](./PRD.md)** — Full Product Requirements.
- 🛠️ **[CLAUDE_CODE_INSTRUCTIONS.md](./CLAUDE_CODE_INSTRUCTIONS.md)** — Step-by-step build guide for Claude Code.
- 🔍 **[EXTRACTION_FINDINGS.md](./EXTRACTION_FINDINGS.md)** — Real test results on a sample 2025 paper.

---

## Build Roadmap

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1 — Foundation | Days 1–3 | Auth + basic chat live on Vercel |
| 2 — RAG Pipeline | Days 4–7 | Chat cites real 2025 papers |
| 3 — Modes & UX | Days 8–14 | All 4 modes + history + bookmarks |
| 4 — Launch Polish | Days 15–21 | Rate limits, analytics, landing page, public launch |

**Total: ~3 weeks of focused work.**

---

## Modes

| Mode | What it does |
|------|--------------|
| 💬 Doubt Solver | Free-form Q&A with citations |
| 📚 Learning | Concept teaching with comprehension checks |
| ✏️ Practice | Solve board Qs with marking-scheme evaluation |
| 🔄 Revision | Chapter-wise concept + formula + quick quiz pack |

## Scope

- **Languages:** English + Hindi (with auto-detection)
- **Sets:** All 3 sets per subject (ingested in waves: Set-1 at launch, Set-2/3 within 2 weeks)
- **Solutions:** Hybrid (official CBSE marking schemes + LLM-generated for gaps)
- **Subjects:** Physics · Chemistry · Mathematics · Computer Science · English Core

---

## Pre-Build Checklist

- [ ] GitHub repo `ShivUP32/aira` created
- [ ] Vercel account connected to GitHub
- [ ] Supabase project created (URL + anon key + service role key saved)
- [ ] OpenRouter API key generated
- [ ] Hugging Face token generated
- [ ] Upstash Redis instance created
- [ ] CBSE 2025 PDFs gathered (questions + marking schemes for each subject)

---

## Success Targets — Month 1 Post-Launch

- 500 signups
- 60% activation (≥3 messages sent)
- 30% D7 retention
- 70% thumbs-up on answers
- $0 infra cost

---

## License & Attribution

Source code: MIT (suggested).
CBSE 2025 board paper content is property of CBSE; used here under educational fair use. AI responses may contain errors — always verify with your teacher for exam-critical answers.

---

**Maintainer:** [@ShivUP32](https://github.com/ShivUP32)
**Status:** Planning complete, build pending
