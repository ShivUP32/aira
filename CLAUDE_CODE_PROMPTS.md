# 🚀 Claude Code Kickoff Prompts

> Copy-paste these prompts into Claude Code in order. Wait for each phase to complete and verify before pasting the next.

---

## 📦 Pre-Step: Set Up Working Folder

Before opening Claude Code, do this manually:

1. Create a folder on your machine: `~/aira-project/`
2. Save these 5 docs into that folder:
   - `EXECUTION_PLAN.md`
   - `PRD.md`
   - `CLAUDE_CODE_INSTRUCTIONS.md`
   - `EXTRACTION_FINDINGS.md`
   - `README.md`
3. Make sure your `.env` keys are saved somewhere accessible (you'll need them after Phase 1.2)
4. Open terminal: `cd ~/aira-project`
5. Run: `claude` (starts Claude Code)

---

## 🎬 Prompt 1 — Phase 1: Foundation (Days 1–3)

Paste this into Claude Code first:

```
I want to build "Aira — Your Board Exam Buddy", an AI doubt solver web app for 
Class 12 CBSE students. All decisions are locked.

Please read these 5 docs in this folder before doing anything:
1. EXECUTION_PLAN.md (start here — phased build plan, all decisions)
2. PRD.md (full product spec)
3. CLAUDE_CODE_INSTRUCTIONS.md (build steps)
4. EXTRACTION_FINDINGS.md (PDF extraction strategy)
5. README.md (project overview)

Important context:
- GitHub username: ShivUP32
- Repo: github.com/ShivUP32/aira (I have created the empty repo already)
- Brand: Aira
- Stack is locked: Next.js 14 + Supabase + OpenRouter + multilingual MiniLM embeddings
- Architecture must support bilingual (Hindi + English) and multi-set from day 1, 
  even though Wave 1 ingestion is English Set-1 only

Now execute Phase 1 (sections 1.1 through 1.8) of CLAUDE_CODE_INSTRUCTIONS.md.

Key rules:
- Do NOT use BGE-small-en-v1.5. Use paraphrase-multilingual-MiniLM-L12-v2 
  (still 384-dim, multilingual)
- Set up i18n scaffolding with next-intl now (English locale only for Wave 1, 
  but folder structure ready for Hindi)
- Database schema must include the language and solution_source fields per 
  the updated PRD section 5.4
- Create the repo structure exactly as in CLAUDE_CODE_INSTRUCTIONS.md section 
  "File Manifest"

STOP after Phase 1.8 (first Vercel deploy succeeds). Do NOT proceed to Phase 2 
without my confirmation. Show me the live URL and I'll verify auth + basic chat 
work before we move on.

Before you start: tell me what env variables you need from me, and I'll provide 
them.
```

**Expected Phase 1 outcome:**
- Repo populated with Next.js scaffold
- Supabase tables created (you'll run the SQL Claude Code provides)
- Auth works: signup → login → redirect to /chat
- Chat UI streams responses from Llama 3.3 (no RAG yet)
- Live URL on Vercel

**Verify before moving on:**
- [ ] You can sign up with email
- [ ] You can sign up with Google OAuth
- [ ] You can log out and back in
- [ ] You can send a message and see streaming response
- [ ] The live URL works on mobile too

---

## 🎬 Prompt 2 — Phase 2: RAG Pipeline (Days 4–8)

Paste this **only after Phase 1 is verified working**:

```
Phase 1 is verified working. Live URL is [paste your Vercel URL here].

Now execute Phase 2 of CLAUDE_CODE_INSTRUCTIONS.md, but with these adjustments 
from EXTRACTION_FINDINGS.md and EXECUTION_PLAN.md:

1. Build all 5 Python pipeline scripts (pipeline/ folder):
   - 01_extract.py — Marker for Math/Physics/Chemistry, PyMuPDF for CS/English
   - 02a_split_languages.py — split bilingual extraction into _en.json and _hi.json
   - 02b_parse_qa.py — parse questions, sub-parts, OR variants, marks
   - 02c_match_solutions.py — match marking scheme PDFs to questions
   - 02d_generate_solutions.py — fill solution gaps via OpenRouter (DeepSeek R1 free)
   - 02e_tag_chapters.py — tag chapters
   - 03_embed.py — paraphrase-multilingual-MiniLM-L12-v2 embeddings
   - 04_upload.py — idempotent upsert (dedup on subject+year+set+q_no+language)

2. DO NOT run the pipeline yet. I'll run it locally with my actual PDFs in 
   ~/aira-data/raw/.

3. Build the live retrieval endpoint /api/rag/retrieve using Hugging Face 
   Inference API for live query embedding (free tier).

4. Wire RAG into the existing chat: filter by user's preferred_language, 
   include top 5 retrievals in the system prompt, return citation IDs.

5. Build the citation chip UI per the mockup — clicking a chip opens a modal 
   showing the original Q-A.

6. Add a small test endpoint /api/rag/health that returns vector store stats 
   (total docs, breakdown by subject + language) so I can verify uploads.

STOP after the pipeline scripts are committed and the retrieval endpoint is 
deployed. I'll then run the pipeline locally with my Set-1 English PDFs and 
report back when documents are uploaded. Don't proceed to Phase 3 until I 
confirm the citations work end-to-end.

Provide me a clear README in the pipeline/ folder with:
- pip install commands
- exact run order for the scripts
- expected output at each step
- troubleshooting for common Marker errors
```

**Then do this manually (between Prompt 2 and Prompt 3):**
1. Place your Set-1 English PDFs in `~/aira-data/raw/{subject}/`
2. Run pipeline scripts in order (Claude Code's pipeline README will guide you)
3. Verify in Supabase: `SELECT count(*), metadata->>'subject' FROM documents GROUP BY 2;`
4. Test in the live app: ask a question you know is in the papers, see if it cites correctly

---

## 🎬 Prompt 3 — Phase 3: Modes + Bilingual UI (Days 9–17)

Paste this **only after Wave 1 ingestion is verified**:

```
Wave 1 ingestion is complete. Verified [N] documents in Supabase across all 
5 subjects. Citations are working in the chat.

Now execute Phase 3 of CLAUDE_CODE_INSTRUCTIONS.md with these specifics:

1. Build all 4 modes (Doubt Solver, Learning, Practice, Revision) per the 
   prompts in PRD.md section 5.6.

2. Mode switcher UI: tabs at the top of /chat page, matching the mockup. 
   URL state via ?mode=practice. Each mode has a distinct system prompt.

3. Practice mode: question card UI per mockup. Pull a random question from 
   selected subject+chapter via the RAG endpoint, evaluate user's answer 
   against the stored solution, return marks estimate.

4. Revision mode: chapter selector + auto-generated revision pack 
   (concepts, formulas, 5 quick quiz questions) per the mockup.

5. Conversation history sidebar — per the chat mockup. Group by date.

6. Bookmarks page.

7. Math rendering: KaTeX everywhere via react-markdown + remark-math.

8. Bilingual auto-detection on user input:
   - Detect Hindi via Devanagari Unicode block
   - If Hindi input detected, respond in Hindi (use Hindi system prompts)
   - But for Wave 1, retrieval will only return English docs — so for Hindi 
     queries, translate retrieved English context inline before generating 
     the Hindi response (one extra LLM step). This way Hindi works on day 1 
     even though Hindi RAG content lands in Wave 3.

9. Onboarding flow: after signup, ask user to set preferred_language (en/hi) 
   and confirm subjects.

STOP after all 4 modes are functional and history persists across sessions. 
Don't move to Phase 4 until I've tested all modes manually.
```

---

## 🎬 Prompt 4 — Phase 4: Launch Polish (Days 18–24)

Paste this **only after Phase 3 is verified**:

```
Phase 3 is verified. All 4 modes work. History persists. Bilingual 
detection works.

Execute Phase 4 of CLAUDE_CODE_INSTRUCTIONS.md:
- Rate limiting via Upstash (30/hr, 100/day per user)
- LLM fallback chain (Llama → Gemini → DeepSeek)
- Sentry error reporting
- PostHog analytics events (signup, message_sent, mode_switched, citation_clicked)
- Landing page per the mockup
- Privacy policy + Terms of Service pages
- PWA manifest + icons
- SEO meta tags + sitemap
- Lighthouse 90+ on mobile

After this phase, we soft-launch to friends, then go public.
```

---

## 🎬 Prompt 5 — Wave 2 Ingestion (Week +1 post-launch)

Run this when you're ready to add Set-2 + Set-3 English content:

```
Aira is live and we have early users. Time for Wave 2 ingestion.

I've placed Set-2 and Set-3 English PDFs in ~/aira-data/raw/{subject}/ 
following the same naming convention. Marking schemes included where 
available.

The pipeline is idempotent. Help me:
1. Run the pipeline scripts in the correct order
2. Verify counts before/after upload
3. Check that retrieval still works correctly with the larger corpus
4. Spot-check 3 questions per subject to confirm parsing quality

No code changes should be needed.
```

---

## 🎬 Prompt 6 — Wave 3 Ingestion (Week +2 post-launch)

Run this when you're ready to add Hindi content:

```
Time for Wave 3 — Hindi ingestion.

I've placed Hindi versions of all 2025 papers in ~/aira-data/raw/. The 
extraction pipeline already supports the bilingual split. Help me:

1. Run extraction on Hindi PDFs — these will produce _hi.json files
2. Run embed.py on the Hindi chunks (multilingual model handles this natively)
3. Upload to Supabase
4. Verify Hindi retrieval works — set my profile to preferred_language='hi' 
   and ask a Hindi physics question
5. Update the UI translation strings to actual Hindi (was stubs before)
6. Hide the "translation step" we added in Phase 3 for Hindi queries — now 
   that real Hindi content exists, RAG should retrieve directly in Hindi.
```

---

## 🆘 If Something Goes Wrong

Common issues and what to tell Claude Code:

| Problem | What to say |
|---------|-------------|
| Marker fails on a Physics PDF | "Use the vision-LLM fallback per EXTRACTION_FINDINGS.md section 3 for this specific question." |
| OpenRouter 429 errors during solution-gen | "Slow down to 3 req/min and rotate API keys. Resume after 10 min cooldown." |
| Vercel build fails | "Show me the build log. Likely an env var or dependency issue." |
| Hindi text rendering as boxes | "Add Noto Sans Devanagari font in next.config.js and global CSS." |
| Vector search returns irrelevant results | "Show me the top 5 retrievals for query X. Maybe metadata filter is wrong." |
| Auth callback redirects to wrong URL | "Check NEXT_PUBLIC_SITE_URL env var matches the Vercel deployment URL." |

---

## 📞 When to Come Back to This Conversation

Return to me (the planning chat) for:
- Design decisions on a new mode or feature
- Strategy on monetization or scaling beyond free tier
- v1.1+ feature planning (mock tests, weak areas, voice, image upload)
- A persistent issue Claude Code can't resolve

Claude Code handles all the implementation. I handle product strategy and design.

---

**You're ready. Tomorrow: create accounts, download Wave 1 PDFs, paste Prompt 1.** 🚀
