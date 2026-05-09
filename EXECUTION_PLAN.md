# 🎯 Aira — Final Execution Plan

> All decisions locked. This is the doc you use to actually start building.

**Version:** 1.0 Final
**Owner:** [@ShivUP32](https://github.com/ShivUP32)
**Repo:** `github.com/ShivUP32/aira`
**Stack:** Next.js + Supabase + OpenRouter (free tier, $0/month)

---

## ✅ Locked Decisions Summary

| Question | Decision |
|----------|----------|
| Brand name | **Aira — Your Board Exam Buddy** |
| Hosting | Vercel + GitHub (free) |
| LLM | OpenRouter free models (Llama 3.3 / Gemini 2.0 / DeepSeek R1) |
| Auth | Required (Supabase Auth: email + Google) |
| PDF tools | Marker (math) + PyMuPDF (text-only) — both free |
| Vector DB | Supabase pgvector |
| Embeddings | `paraphrase-multilingual-MiniLM-L12-v2` (multilingual, 384-dim, free) |
| Subjects | Physics, Chemistry, Math, Computer Science, English |
| Sets per subject | All 3 sets (Set-1, 2, 3) — **ingested in waves** |
| Languages | Hindi + English |
| Solutions | Hybrid: official marking schemes where available, LLM-generated for gaps |
| Modes | Doubt Solver, Learning, Practice, Revision |

---

## 🌊 Phased Ingestion Strategy — LOCKED

**Architecture is bilingual + multi-set ready from day 1. Content rolls out in waves.**

| Wave | Content | When | Effort |
|------|---------|------|--------|
| **Wave 1 (Launch)** | **Set-1, English only, 5 subjects** | Before Phase 4 launch | ~4 hrs |
| **Wave 2** | Set-2 + Set-3, English | Week +1 after launch | ~6 hrs |
| **Wave 3** | All 3 sets, Hindi | Week +2 after launch | ~8 hrs |
| **Wave 4 (ongoing)** | 2024 + 2023 papers | Month +1 onward | as needed |

The pipeline is **idempotent** — running it again with new PDFs adds to the existing knowledge base without duplicates (deduped by `subject + year + set + q_no + language`).

**What this means for the build:**
- Code architecture supports bilingual + multi-set on day 1 (don't have to refactor later)
- Database schema, retrieval logic, UI all ready for Hindi + multiple sets
- But ingestion happens incrementally so you can launch in 3 weeks instead of 6
- Hindi UI strings can be stubbed at launch; properly translated when Wave 3 lands

---

## 📐 Architecture Adjustments for Bilingual + Multi-Set

### 1. Embedding Model (CHANGED)
- ~~BGE-small-en-v1.5~~ (English only)
- **Now: `paraphrase-multilingual-MiniLM-L12-v2`** — supports Hindi natively, same 384 dimensions, same speed
- Same `documents` table schema; just different model loaded in Python

### 2. Document metadata (EXPANDED)
```json
{
  "subject": "mathematics",
  "year": 2025,
  "set": "65/S/1",                    // unique paper identifier
  "set_label": "Set-1",
  "section": "A",
  "q_no": 7,
  "marks": 1,
  "type": "mcq",
  "chapter": "Continuity and Differentiability",
  "topic": "Parametric Differentiation",
  "or_group": null,                   // for OR variants
  "has_diagram": false,
  "language": "en",                   // 'en' | 'hi'
  "solution_source": "marking-scheme" // 'marking-scheme' | 'llm-generated'
}
```

### 3. Retrieval logic (UPDATED)
- User's `preferred_language` from profile filters retrieval by default
- "both" option: retrieve in both languages, prefer same-language match in ranking
- UI shows both versions if available (small toggle on each citation)

### 4. UI strings (NEW concern)
- All UI copy needs `en` + `hi` translations
- Use `next-intl` (free, Next.js standard) for i18n
- Path-based routing: `/en/chat` and `/hi/chat`
- LLM system prompts have Hindi versions for Hindi queries

### 5. Language detection on input (NEW)
```typescript
// Simple: check Devanagari ratio
function detectLang(text: string): 'en' | 'hi' {
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length;
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  return devanagari > latin ? 'hi' : 'en';
}
```

If user types in Hindi, respond in Hindi (regardless of profile setting).

---

## 📋 Updated Pre-Flight Checklist

Before invoking Claude Code, complete these (Claude Code can't do them via browser):

### Accounts (15 min)
- [ ] Create empty repo `ShivUP32/aira` on GitHub
- [ ] Connect [Vercel](https://vercel.com) to GitHub
- [ ] Create [Supabase](https://supabase.com) project → save URL, anon key, service role key
- [ ] Generate [OpenRouter](https://openrouter.ai/keys) API key
- [ ] Generate [Hugging Face](https://huggingface.co/settings/tokens) read token
- [ ] Create [Upstash](https://upstash.com) Redis → save REST URL + token
- [ ] (Optional) [PostHog](https://posthog.com) project key
- [ ] (Optional) [Sentry](https://sentry.io) DSN

### Source Material — Wave 1 (Launch) Only
You only need these 10 PDFs to launch. Sets 2/3 and Hindi versions come later.

- [ ] Download Set-1 (English) question papers for:
  - Physics: `55/1/1`
  - Chemistry: `56/1/1`
  - Mathematics: `65/1/1` (you have `65/S/1` — same series, fine to use)
  - Computer Science: `83/1/1`
  - English Core: `1/1/1`
- [ ] Download corresponding marking schemes (where available)
  - Source: [cbseacademic.nic.in](https://cbseacademic.nic.in) → "Marking Scheme" section
  - **Note:** if a marking scheme isn't published for a particular set, that's fine — the pipeline auto-fills with LLM-generated solutions
- [ ] Place files in `~/aira-data/raw/` like this:
  ```
  ~/aira-data/raw/
    ├── physics/
    │   ├── 55-1-1_questions.pdf
    │   └── 55-1-1_marking-scheme.pdf  (optional)
    ├── chemistry/
    │   ├── 56-1-1_questions.pdf
    │   └── 56-1-1_marking-scheme.pdf  (optional)
    ├── mathematics/
    │   ├── 65-1-1_questions.pdf
    │   └── 65-1-1_marking-scheme.pdf  (optional)
    ├── computer-science/
    │   └── 83-1-1_questions.pdf
    └── english/
        └── 1-1-1_questions.pdf
  ```

**For Wave 2 & 3 (post-launch):** download Set-2, Set-3, and Hindi versions as you need them. The pipeline handles them the same way — just drop the new PDFs in the folder and re-run.

---

## 🚀 The Build — 4 Phases

### Phase 1 — Foundation (Days 1–3)
**Goal:** Auth + chat works, deployed to Vercel.

Hand to Claude Code:
> *"Read PRD.md, EXTRACTION_FINDINGS.md, and CLAUDE_CODE_INSTRUCTIONS.md in this folder. Execute Phase 1 (1.1 through 1.8) of CLAUDE_CODE_INSTRUCTIONS.md. Stop after Vercel deploy succeeds. The repo is github.com/ShivUP32/aira. The brand name is Aira. Pause for verification before continuing."*

**Acceptance:** You can sign up, log in, chat with raw Llama 3.3 on a live URL.

### Phase 2 — RAG Pipeline + Wave 1 Ingestion (Days 4–8)
**Goal:** Set-1 English papers searchable; chat cites real questions.

This is the heaviest phase. Three parallel tracks:

**Track A — Pipeline code (Claude Code does this):**
> *"Continue with Phase 2 of CLAUDE_CODE_INSTRUCTIONS.md, but use the multilingual embedding model `paraphrase-multilingual-MiniLM-L12-v2` instead of BGE-small. Build all 4 Python pipeline scripts but do NOT run them yet — I'll run them locally with my PDFs. Also add a 5th script `02c_generate_solutions.py` that uses OpenRouter (DeepSeek R1 free) to generate solutions for questions that don't have official marking scheme matches."*

**Track B — Source PDFs (you do this):**
- Download English Set-1 papers + marking schemes
- Place in `~/aira-data/raw/{subject}/`

**Track C — Run pipeline locally (you do this, with Claude Code's help):**
- Install Python deps: `pip install marker-pdf pymupdf sentence-transformers supabase`
- Run scripts 01 through 05 sequentially
- Manual review of parsed JSON before upload (catch parser errors)
- Upload to Supabase

**Acceptance:** Asking "Lenz's law" returns an answer citing the actual 2025 Physics paper.

### Phase 3 — Modes + Bilingual UI (Days 9–17)
**Goal:** All 4 modes work in Hindi and English.

> *"Continue with Phase 3 of CLAUDE_CODE_INSTRUCTIONS.md. Add bilingual support: use next-intl for i18n, create both English and Hindi system prompts in lib/llm/prompts.ts, and add a language toggle in the user menu. The 'preferred_language' profile field controls the default."*

**Acceptance:** All 4 modes functional. UI switches between Hindi/English. Bot responds in user's input language automatically.

### Phase 4 — Launch Polish (Days 18–24)
**Goal:** Public URL, ready to share.

> *"Execute Phase 4 of CLAUDE_CODE_INSTRUCTIONS.md. Soft-launch ready."*

**Acceptance:** Lighthouse 90+, rate limits work, landing page converts.

### Wave 2 & 3 (Post-Launch)
After launch:
- Run pipeline again with Set-2 + Set-3 English PDFs (no code changes needed — pipeline is idempotent)
- Then again with Hindi PDFs
- Each wave: ~1 evening of work

---

## 🗂️ Updated Pipeline Structure

```
pipeline/
├── 01_extract.py          # Marker for math subjects, PyMuPDF for CS/English
├── 02a_split_languages.py # Split bilingual extractions into separate _en and _hi files  
├── 02b_parse_qa.py        # Parse questions + sub-parts + OR variants
├── 02c_match_solutions.py # Match marking scheme solutions to questions
├── 02d_generate_solutions.py # Fill gaps with OpenRouter (DeepSeek R1 free)
├── 02e_tag_chapters.py    # Auto-tag chapter using rule-based + LLM fallback
├── 03_embed.py            # Multilingual MiniLM embeddings
├── 04_upload.py           # Idempotent upsert to Supabase
├── requirements.txt
└── README.md              # How to run
```

**Idempotency key:** `(subject, year, set, q_no, language, or_variant)` — running pipeline twice with same input doesn't duplicate.

---

## 🎓 Solution Generation Strategy (Detail)

For each parsed question:

```
1. Check if marking scheme PDF exists for this set
   ├── YES: extract step-wise solution from marking scheme
   │        → store with metadata.solution_source = "marking-scheme"
   │        → high authority, official wording
   └── NO:  generate via OpenRouter (DeepSeek R1 free)
            → prompt: "Solve this CBSE Class 12 question with step-by-step working
                       matching CBSE marking scheme conventions. Show all steps."
            → store with metadata.solution_source = "llm-generated"
            → UI displays small "AI-generated solution" tag
```

**Cost on free tier:** ~750 questions worst case × ~2K tokens/solution = 1.5M tokens. OpenRouter free models give ~200 req/day, so this takes 4 days running in background. OR use multiple keys (~30 sec/req with one key, parallel with two keys = ~2 days).

**Quality fallback:** If LLM solution is rated thumbs-down by 3+ users, flag in DB for human review.

---

## 📊 Updated Volume & Cost Projection

| Resource | Wave 1 (launch) | Full scope (Wave 3 done) | Free tier limit |
|----------|----------------|-------------------------|-----------------|
| Documents (chunks) | ~250 | ~1500 | unlimited |
| Storage | ~2 MB | ~10 MB | 500 MB ✅ |
| Embedding (one-time) | 5 min local | 30 min local | free ✅ |
| Solution-gen (one-time) | ~50 LLM calls | ~400 LLM calls | OK if spread over days ✅ |
| Live LLM calls / mo | depends on traffic | ~30K calls @ 1K users | likely $0 if Llama 3.3 free survives ⚠️ |
| Vercel bandwidth | <5 GB | <30 GB | 100 GB ✅ |

**The one risk:** OpenRouter occasionally pulls models from free tier. Architecture has fallback chain (Llama → Gemini → DeepSeek), but if all free models disappear, we'd need to switch to Groq free tier or pay $5–20/month. Plan for that contingency in Month 3+.

---

## 🚦 What to Do Right Now (This Week)

### Day 0 — Today
1. **Create accounts** (pre-flight checklist above) — 15 min
2. **Create empty GitHub repo** `ShivUP32/aira`
3. **Start downloading PDFs** — at minimum get Set-1 of all 5 subjects + marking schemes

### Day 1 — Tomorrow
1. **Open Claude Code** in your terminal
2. **Place these 4 docs** in a folder: PRD.md, EXTRACTION_FINDINGS.md, CLAUDE_CODE_INSTRUCTIONS.md, this file
3. **First prompt to Claude Code:**

```
I want to build "Aira — Your Board Exam Buddy", an AI doubt solver web app for 
Class 12 CBSE students. 

Read these docs in this folder:
- PRD.md (full product spec)
- EXTRACTION_FINDINGS.md (PDF extraction strategy)
- CLAUDE_CODE_INSTRUCTIONS.md (build steps)
- EXECUTION_PLAN.md (this document — phased ingestion plan)

Then execute Phase 1 (foundation). My GitHub username is ShivUP32 and the repo 
should be at github.com/ShivUP32/aira. Use the multilingual embedding model 
paraphrase-multilingual-MiniLM-L12-v2 instead of BGE-small mentioned in earlier 
docs (this is for Hindi support).

Stop after Phase 1.8 (Vercel deploy) succeeds, so I can verify before continuing.
```

4. **Verify Phase 1 works** before saying "continue with Phase 2"

---

## 📞 When to Come Back to This Chat

You don't need me for the actual coding — Claude Code handles that. Come back here when:
- A phase completes and you want UX feedback or design decisions
- An extraction is failing on a specific PDF and you need help debugging
- You want to plan a new feature beyond v1
- You hit unexpected free-tier limits and need a workaround
- You want to design v1.1 features (mock tests, weak areas, voice, image upload)

---

**End of Execution Plan. You're cleared for takeoff.** 🚀
