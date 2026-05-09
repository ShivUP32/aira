# 📘 Product Requirements Document (PRD)
# Aira — Your Board Exam Buddy

**Version:** 1.1
**Date:** May 2026
**Status:** Locked for v1 (MVP)
**Owner:** [@ShivUP32](https://github.com/ShivUP32)
**Repo:** `github.com/ShivUP32/aira`

---

## 1. Executive Summary

**Aira** is a free, web-based AI chat application that helps Class 12 CBSE students clear academic doubts using a conversational interface grounded in the actual 2025 CBSE Board Exam papers for Physics, Chemistry, Mathematics, Computer Science, and English.

The app combines a Retrieval-Augmented Generation (RAG) system trained on past board papers with an open-source LLM, offering four learning modes: **Doubt Solver, Learning Mode, Practice Mode, and Revision Mode**.

### Vision
To make high-quality, exam-aligned academic help freely accessible to every Indian student preparing for Class 12 board exams.

### Goals (v1 / MVP)
1. Answer student doubts grounded in 2025 CBSE board paper content
2. Cite the exact source question/year for every answer
3. Offer 4 distinct interaction modes for different learning needs
4. Operate entirely on free-tier infrastructure
5. Launch publicly within 4 weeks

### Non-Goals (v1)
- Class 11 or lower content
- Other boards (ICSE, State boards) — future expansion
- Live tutoring / human teachers
- Mobile native apps (PWA only)
- Paid subscriptions / monetization

---

## 2. Target Audience

### Primary Persona: "Aarav, Class 12 PCM Student"
- 17 years old, preparing for CBSE Boards + JEE/NEET
- Access to smartphone or laptop, intermittent internet
- Studies 6–8 hours/day, often gets stuck on specific questions
- Currently uses YouTube, Doubtnut, Vedantu — but wants targeted help on board pattern
- Pain point: solutions online are generic; doesn't always match CBSE marking scheme

### Secondary Persona: "Riya, Self-Study Student"
- 17 years old, opted for self-study (no coaching)
- Wants to revise efficiently and identify weak chapters
- Needs structured practice from authentic past papers

---

## 3. Core User Flows

### 3.1 First-Time User
```
Land on homepage
  → Read value prop + screenshots
  → Click "Get Started Free"
  → Sign up (email or Google OAuth)
  → Onboarding (1 screen): pick subjects of interest
  → Land in chat interface with welcome message
  → See suggested prompts
```

### 3.2 Returning User Asking a Doubt
```
Login (email/Google)
  → Default: Doubt Solver mode
  → Type or paste question
  → Receive AI answer with citations to 2025 paper
  → Click citation → see original question/solution
  → Optional: bookmark, share, ask follow-up
```

### 3.3 Practice Mode Flow
```
Switch mode → Practice
  → Pick subject + chapter
  → Bot poses a question from past paper
  → Student types answer
  → Bot evaluates, gives feedback with marking scheme
  → Stats updated (correct/incorrect count)
```

### 3.4 Revision Mode Flow
```
Switch mode → Revision
  → Pick subject + chapter
  → Bot generates: key concepts summary + formulas + 5 quick questions
  → Student rapid-fires answers
  → Get a "revision score" at end
```

### 3.5 Learning Mode Flow
```
Switch mode → Learning
  → Type a topic ("Explain Bohr's atomic model")
  → Bot teaches step-by-step with examples
  → After explanation, asks 2-3 comprehension questions
  → Confirms understanding before moving on
```

---

## 4. Feature Specifications

### 4.1 Core Modes (v1)

| Mode | System Prompt Strategy | UI Affordances |
|------|----------------------|----------------|
| **💬 Doubt Solver** | "Answer student's question. Use retrieved context. Cite source if used." | Free-form chat input. Citation chips below response. |
| **📚 Learning Mode** | "Teach the topic step-by-step. Use examples. Quiz comprehension after." | Topic input → structured response with sections. |
| **✏️ Practice Mode** | "Pose a question from retrieved context. Wait for answer. Evaluate against marking scheme." | Question card UI. Answer textbox. Reveal solution button. |
| **🔄 Revision Mode** | "Generate concise revision pack: 3-5 key concepts, formulas, 5 rapid Qs." | Chapter selector. Cards with concepts. Quick-answer flow. |

### 4.2 Cross-Cutting Features

#### Authentication
- **Email + password** (Supabase Auth)
- **Google OAuth** (one-click)
- **Required login** to access chat
- Public landing page only for non-authed users

#### Conversation History
- Sidebar with past conversations grouped by date
- Each conversation stores: title (auto-generated), mode, messages, citations
- Search within history (v1.1)

#### Citations
- Every RAG-grounded answer shows source chips: "📄 CBSE 2025 Physics Set-1, Q12 (5 marks)"
- Click chip → modal showing original question + official solution
- Helps build trust + provides authentic reference

#### Math Rendering
- KaTeX on frontend for LaTeX equations
- System prompt instructs LLM to wrap math in `$...$` (inline) or `$$...$$` (block)

#### Rate Limiting
- Per-user: 30 messages / hour, 100 / day
- Per-IP fallback: 50 messages / hour
- Soft limit warning at 80%, hard block with upgrade message at 100%
- Implementation: Upstash Redis (free tier) or Vercel KV

#### Bookmarks
- Star icon on any answer → saves to user's bookmarks
- Bookmarks page: filter by subject/mode

### 4.3 Suggested v1.1+ Features (Out of Scope for MVP)
- 📷 Image upload (snap textbook question)
- 🎤 Voice input
- 🌐 Hindi/English bilingual mode
- 📊 Weak Areas analyzer
- 🏆 Streaks & gamification
- 📑 Mock Test mode (timed)
- 👥 Share answer (public link)

---

## 5. Technical Architecture

### 5.1 High-Level Diagram
```
┌─────────────────┐
│  Browser (PWA)  │
│  Next.js SPA    │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────┐
│  Vercel (Edge + Functions)      │
│  ┌───────────────────────────┐  │
│  │ Next.js App Router        │  │
│  │ - /api/chat (streaming)   │  │
│  │ - /api/rag/retrieve       │  │
│  │ - /api/auth/*             │  │
│  └───────────┬───────────────┘  │
└──────────────┼──────────────────┘
               │
       ┌───────┼───────┬─────────────┐
       ▼       ▼       ▼             ▼
  ┌────────┐ ┌──────┐ ┌──────────┐ ┌─────────┐
  │Supabase│ │Open- │ │ Upstash  │ │ PostHog │
  │Postgres│ │Router│ │ (Redis)  │ │Analytics│
  │+pgvec  │ │ LLMs │ │RateLimit │ │         │
  │+ Auth  │ │      │ │          │ │         │
  └────────┘ └──────┘ └──────────┘ └─────────┘
```

### 5.2 Tech Stack (Final, Locked)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Framework** | Next.js 14 (App Router) | SSR, API routes, streaming, Vercel-native |
| **Language** | TypeScript | Type safety across stack |
| **Styling** | Tailwind CSS + shadcn/ui | Fast UI dev, accessible components |
| **Chat UI** | Vercel AI SDK (`ai` package) | Built-in streaming, message state |
| **State** | React Context + URL state | No Redux needed for v1 |
| **Database** | Supabase Postgres | Free tier 500MB, reliable |
| **Vector Store** | Supabase pgvector extension | Same DB, no extra service |
| **Auth** | Supabase Auth | Email + Google OAuth, free 50k MAU |
| **LLM Provider** | OpenRouter (free models) | Llama 3.3 70B / Gemini 2.0 Flash / DeepSeek R1 |
| **Embeddings** | `paraphrase-multilingual-MiniLM-L12-v2` (local) | Free, 384-dim, supports 50+ langs incl. Hindi+English |
| **PDF Extraction** | Marker + PyMuPDF | Free, handles math + diagrams |
| **Rate Limiting** | Upstash Redis | Free 10k commands/day |
| **Hosting** | Vercel | Free tier, auto-deploy from GitHub |
| **Repo** | GitHub | Free public/private repos |
| **Analytics** | PostHog | Free 1M events/month |
| **Errors** | Sentry | Free 5k errors/month |
| **Math Render** | KaTeX | Fast, lightweight |
| **Markdown** | react-markdown + remark-gfm | Render LLM output |

### 5.3 OpenRouter Model Strategy

Free models available (verify current list on OpenRouter at build time):
- `meta-llama/llama-3.3-70b-instruct:free` — Primary, best for academic Q&A
- `google/gemini-2.0-flash-exp:free` — Fallback, fast, good with math
- `deepseek/deepseek-r1:free` — Fallback for reasoning-heavy questions
- `qwen/qwen-2.5-72b-instruct:free` — Backup

**Routing logic:**
- Default: Llama 3.3 70B
- On rate limit (429): retry with Gemini 2.0 Flash
- On rate limit again: queue user request, show "high traffic, retrying..."
- On all-fail: show graceful error with retry button

**Free tier rate limits (as of build time):**
- ~20 requests/minute per API key on free models
- ~200 requests/day per key (verify; this changes)
- Solution: rotate between 2-3 free models, request multiple keys if needed

### 5.4 Database Schema (Postgres / Supabase)

```sql
-- Enable pgvector extension
create extension if not exists vector;

-- ─── User Profiles (extends Supabase auth.users) ───
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  stream text default 'PCM',
  subjects text[] default array['physics','chemistry','math','cs','english'],
  preferred_language text default 'en' check (preferred_language in ('en','hi','both')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Knowledge Base (RAG vectors) ───
create table documents (
  id bigserial primary key,
  content text not null,           -- question + solution markdown
  metadata jsonb not null,          -- {subject, chapter, year, set, q_no, marks, type, language, solution_source, or_group}
  embedding vector(384),            -- BGE-small dimension (multilingual model handles both langs)
  created_at timestamptz default now()
);

-- HNSW index for fast similarity search
create index on documents using hnsw (embedding vector_cosine_ops);
create index on documents using gin (metadata);

-- Indexes specifically for bilingual + multi-set filtering
create index on documents ((metadata->>'subject'));
create index on documents ((metadata->>'language'));
create index on documents ((metadata->>'set'));
create index on documents ((metadata->>'chapter'));

-- ─── Conversations ───
create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  mode text not null check (mode in ('doubt','learning','practice','revision')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on conversations (user_id, updated_at desc);

-- ─── Messages ───
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  citations jsonb default '[]',     -- [{document_id, snippet, score}]
  model_used text,
  tokens_used int,
  created_at timestamptz default now()
);

create index on messages (conversation_id, created_at);

-- ─── Practice Tracking ───
create table practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id bigint not null references documents(id),
  user_answer text,
  is_correct boolean,
  feedback text,
  attempted_at timestamptz default now()
);

-- ─── Bookmarks ───
create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id bigint references documents(id),
  message_id uuid references messages(id),
  created_at timestamptz default now()
);

-- ─── Row Level Security (RLS) Policies ───
alter table profiles enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table practice_attempts enable row level security;
alter table bookmarks enable row level security;

-- Users see only their own data
create policy "users own profile" on profiles
  for all using (auth.uid() = id);

create policy "users own conversations" on conversations
  for all using (auth.uid() = user_id);

create policy "users own messages" on messages
  for all using (
    auth.uid() = (select user_id from conversations where id = conversation_id)
  );

create policy "users own practice" on practice_attempts
  for all using (auth.uid() = user_id);

create policy "users own bookmarks" on bookmarks
  for all using (auth.uid() = user_id);

-- documents table is read-only public (knowledge base)
alter table documents enable row level security;
create policy "documents readable by all" on documents for select using (true);

-- ─── Vector search RPC ───
create or replace function match_documents(
  query_embedding vector(384),
  match_count int default 5,
  filter jsonb default '{}'
) returns table (
  id bigint, content text, metadata jsonb, similarity float
)
language plpgsql as $$
begin
  return query
  select d.id, d.content, d.metadata,
         1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where d.metadata @> filter
  order by d.embedding <=> query_embedding
  limit match_count;
end; $$;
```

### 5.5 RAG Pipeline (Detailed)

#### Stage 1: PDF Extraction (run locally, one-time)

```
input/
  ├── physics_2025.pdf
  ├── chemistry_2025.pdf
  ├── math_2025.pdf
  ├── cs_2025.pdf
  └── english_2025.pdf

Run: python pipeline/01_extract.py
  - For each PDF:
    - Use Marker → outputs Markdown with LaTeX math preserved
    - Fallback: PyMuPDF for pure text where Marker struggles
    - Save → output/extracted/{subject}_2025.md

Run: python pipeline/02_parse_qa.py
  - Parse markdown into {question_number, question_text, solution_text}
  - Use regex + heuristics (e.g., "Q.1", "Question 1")
  - Manual review pass — fix mis-parses in JSON
  - Output: output/parsed/{subject}_2025.json

Schema per question:
{
  "subject": "physics",
  "year": 2025,
  "set": "Set-1",
  "q_no": 12,
  "marks": 5,
  "type": "long-answer",
  "chapter": "Electromagnetic Induction",
  "question": "...",
  "solution": "...",
  "diagrams": ["url1.png"]  // optional
}
```

#### Stage 2: Chunking & Embedding

```
Run: python pipeline/03_embed.py
  - Load all parsed JSONs
  - For each Q&A pair:
    - chunk_content = "Question: {q}\n\nSolution: {s}"
    - Generate embedding via sentence-transformers (BGE-small)
  - Output: output/embedded/all_chunks.jsonl
```

#### Stage 3: Upload to Supabase

```
Run: python pipeline/04_upload.py
  - Read embedded JSONL
  - Insert into documents table via Supabase Python client
  - Verify count matches
```

#### Stage 4: Live Retrieval (Vercel API)

```typescript
// /api/rag/retrieve
async function retrieve(query: string, filter: object = {}) {
  // 1. Embed user query — use Hugging Face Inference API (free) for live embedding
  const queryEmbedding = await embedQueryHF(query);

  // 2. Call Supabase RPC `match_documents`
  const { data } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: 5,
    filter
  });

  // 3. Return top 5 with similarity scores
  return data;
}
```

**Note on embedding the live query:** Since BGE-small is a Python lib, options are:
- **(a) HuggingFace Inference API** — free, slight latency (~500ms cold)
- **(b) Run a small Python serverless function** on Vercel with `@vercel/python` runtime
- **(c) Use Supabase Edge Functions** with a pre-loaded model
- **Recommendation:** Start with (a) HuggingFace; switch to (b) if latency hurts UX.

#### Stage 5: Generation (Vercel API)

```typescript
// /api/chat
async function POST(req) {
  const { messages, mode, filters } = await req.json();
  const userQuery = messages[messages.length - 1].content;

  // 1. Retrieve context (only for doubt + practice modes)
  const contexts = ['doubt','practice'].includes(mode)
    ? await retrieve(userQuery, filters)
    : [];

  // 2. Build prompt
  const systemPrompt = MODE_PROMPTS[mode] + buildContextBlock(contexts);

  // 3. Stream from OpenRouter with fallback chain
  const stream = await openRouterChat({
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    fallbacks: ['google/gemini-2.0-flash-exp:free']
  });

  // 4. Return streaming response with citations metadata
  return new Response(stream, {
    headers: { 'X-Citations': JSON.stringify(contexts.map(c => c.id)) }
  });
}
```

### 5.6 System Prompts (Per Mode)

#### Doubt Solver
```
You are a Class 12 CBSE doubt solver assistant. Answer the student's question
clearly and accurately.

If retrieved context from past CBSE 2025 board papers is provided below, use
it to ground your answer and cite the specific question. Format citations as:
"[CBSE 2025 {Subject} Set-{X}, Q{N}, {marks}m]"

If no relevant context is found, answer from general knowledge but say so clearly.

Rules:
- Use Markdown formatting
- Wrap math in $...$ (inline) or $$...$$ (block) using LaTeX
- Be concise but complete
- For numerical problems, show all steps
- Match CBSE marking scheme structure where applicable

Retrieved context:
{context_block}
```

#### Learning Mode
```
You are a Class 12 CBSE teacher. Teach the requested topic step-by-step.

Structure:
1. Brief intro (1-2 sentences)
2. Core concepts (with examples)
3. Key formulas (if applicable)
4. Common pitfalls
5. After explanation, ask 2-3 comprehension questions

Tone: encouraging, clear, like a patient teacher.
Format: Markdown with sections, math in LaTeX.
```

#### Practice Mode
```
You are a Class 12 CBSE practice tutor. The student wants to practice questions.

Workflow:
- If they say "give me a question": pose ONE question from retrieved context.
  Format: "**Question** (X marks):\n{question}\n\nType your answer when ready."
- If they answer: evaluate against the official solution. Give:
  - ✅ What's correct
  - ❌ What's missing/wrong
  - 📊 Estimated marks (e.g., "3/5")
  - 💡 Tip for next time
- Then offer: "Want another question or move on?"

Retrieved context:
{context_block}
```

#### Revision Mode
```
You are a Class 12 CBSE revision assistant. Generate a concise revision pack
for the requested chapter.

Structure:
## 🎯 Key Concepts (3-5 bullets, 1 line each)
## 📐 Formulas / Equations (if applicable)
## ⚡ Quick Quiz (5 short questions)

Then: "Reply with answers to questions 1–5 and I'll score you."

Use retrieved past-paper context if available to ensure exam-relevance.

Retrieved context:
{context_block}
```

### 5.7 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/signup` | POST | No | Email signup (handled by Supabase) |
| `/api/auth/login` | POST | No | Email/Google login |
| `/api/auth/logout` | POST | Yes | Logout |
| `/api/chat` | POST | Yes | Send message, stream response |
| `/api/conversations` | GET | Yes | List user's conversations |
| `/api/conversations` | POST | Yes | Create new conversation |
| `/api/conversations/[id]` | GET | Yes | Get messages |
| `/api/conversations/[id]` | DELETE | Yes | Delete conversation |
| `/api/rag/retrieve` | POST | Yes | (Internal) similarity search |
| `/api/bookmarks` | GET/POST/DELETE | Yes | Manage bookmarks |
| `/api/practice/attempt` | POST | Yes | Log practice attempt |
| `/api/usage` | GET | Yes | Get user's rate-limit status |

### 5.8 Folder Structure

```
aira/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/                    # Protected routes
│   │   ├── chat/
│   │   │   ├── page.tsx          # Main chat
│   │   │   └── [id]/page.tsx     # Specific conversation
│   │   ├── practice/page.tsx
│   │   ├── revision/page.tsx
│   │   ├── bookmarks/page.tsx
│   │   └── layout.tsx            # Sidebar layout
│   ├── api/
│   │   ├── chat/route.ts
│   │   ├── rag/retrieve/route.ts
│   │   ├── conversations/...
│   │   └── bookmarks/...
│   ├── page.tsx                  # Public landing
│   └── layout.tsx                # Root layout
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageList.tsx
│   │   ├── Message.tsx
│   │   ├── CitationChip.tsx
│   │   ├── ModeSwitcher.tsx
│   │   └── InputBox.tsx
│   ├── ui/                       # shadcn components
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── llm/
│   │   ├── openrouter.ts
│   │   ├── prompts.ts
│   │   └── fallback.ts
│   ├── rag/
│   │   ├── embed.ts
│   │   └── retrieve.ts
│   ├── ratelimit.ts
│   └── utils.ts
├── pipeline/                     # Python ingestion (run locally)
│   ├── 01_extract.py
│   ├── 02_parse_qa.py
│   ├── 03_embed.py
│   ├── 04_upload.py
│   ├── requirements.txt
│   └── README.md
├── data/
│   ├── raw/                      # PDF inputs (gitignored)
│   ├── extracted/                # Marker outputs
│   ├── parsed/                   # Cleaned JSONs
│   └── embedded/                 # Final JSONL with vectors
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
├── public/
├── .env.example
├── .env.local                    # gitignored
├── .gitignore
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 6. Non-Functional Requirements

### 6.1 Performance
- **Time to first byte (chat):** < 1.5s
- **Time to first token streaming:** < 3s
- **Page load (LCP):** < 2.5s
- **Vector search latency:** < 200ms

### 6.2 Reliability
- **Uptime target:** 99% (limited by free-tier providers)
- Graceful degradation: if RAG fails → answer without context with disclaimer
- LLM fallback chain across 2-3 free models

### 6.3 Security
- Row-Level Security on all user tables
- API keys stored in Vercel env vars (never client-side)
- CORS locked to app domain
- Rate limiting per user + per IP
- Input sanitization on user messages
- No PII in logs

### 6.4 Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigable
- Screen-reader friendly (semantic HTML, ARIA labels)
- Color contrast 4.5:1 minimum
- Focus indicators on all interactive elements

### 6.5 Browser Support
- Chrome, Firefox, Safari, Edge (last 2 versions)
- Mobile: iOS Safari, Chrome Android
- PWA installable on mobile

### 6.6 Privacy & Compliance
- Privacy policy + ToS pages
- Email-only PII collection
- No third-party tracking beyond PostHog (anonymized)
- Data export endpoint (user can download their data)
- Account deletion endpoint (cascades all user data)
- Disclaimer: "AI may make mistakes. Verify with teachers."

---

## 7. Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| OpenRouter free tier hits rate limits during launch | High | 3-model fallback chain, request queueing, multiple API keys |
| Math extraction from PDFs is poor | High | Marker handles LaTeX. Manual cleanup pass. Spot-check 20 questions per subject. |
| LLM hallucinations on academic content | High | RAG grounding. Show citations. Display "answer not from past papers" warning when context score is low. |
| Free tier limits exceeded at scale | Medium | Monitor with PostHog. Upgrade path planned for >1000 DAU. |
| CBSE copyright on board papers | Medium | Educational fair-use applies. Add disclaimer crediting CBSE. Can pull content if requested. |
| Slow embedding API for live queries | Medium | Cache common queries. Pre-compute embeddings for popular doubts. |
| Cold starts on Vercel functions | Low | Keep functions lean. Use edge runtime where possible. |

---

## 8. Success Metrics (KPIs)

### Adoption
- **Signups:** 100 in week 1, 500 in month 1
- **Activation:** % of signups who send ≥3 messages = 60%
- **D7 Retention:** 30%

### Engagement
- **Avg messages/user/day:** 8
- **Avg session length:** 12 min
- **% using ≥2 modes:** 40%

### Quality
- **Thumbs-up rate on answers:** 70%+
- **Citation click-through rate:** 25%+
- **Reported "wrong answer" rate:** < 5%

### Cost
- **Monthly infra cost:** $0 for first 6 months
- **LLM cost per active user:** $0 (free tier)

---

## 9. Phased Roadmap

### Phase 1 — Foundation (Week 1)
- [ ] GitHub repo + Vercel project + Supabase project initialized
- [ ] Next.js app scaffolded with Tailwind + shadcn
- [ ] Auth flow (signup/login/logout) working
- [ ] Protected `/chat` route
- [ ] Basic chat UI streaming from OpenRouter (no RAG yet)
- [ ] Deployed to `*.vercel.app` URL
- **Demo:** Logged-in user chats with raw Llama 3.3

### Phase 2 — RAG Pipeline (Week 2)
- [ ] PDF extraction script (Marker + PyMuPDF)
- [ ] Q&A parsing + manual cleanup
- [ ] BGE-small embedding script
- [ ] Supabase pgvector setup + upload script
- [ ] `/api/rag/retrieve` endpoint
- [ ] Chat wired to RAG with citations
- **Demo:** Chat answers cite real 2025 board paper questions

### Phase 3 — Modes & UX (Week 3)
- [ ] Mode switcher UI in chat header
- [ ] Distinct system prompts per mode
- [ ] Practice mode question card UI
- [ ] Revision mode chapter selector
- [ ] Conversation history sidebar
- [ ] Bookmarks page
- [ ] Math rendering with KaTeX
- **Demo:** All 4 modes functional, history persists

### Phase 4 — Polish & Launch (Week 4)
- [ ] Onboarding flow
- [ ] Rate limiting (Upstash)
- [ ] Error handling + Sentry
- [ ] Landing page with value prop
- [ ] PostHog analytics
- [ ] Privacy policy, Terms of Service
- [ ] PWA manifest + service worker
- [ ] Soft launch to friends → iterate
- **Demo:** Public live URL, ready to share

### Phase 5 — Post-Launch (Ongoing)
- [ ] Monitor PostHog dashboards weekly
- [ ] Iterate on prompts based on thumbs-down feedback
- [ ] Prioritize v1.1 features based on user requests

---

## 10. Open Questions / Decisions Pending

1. **App brand name** — ✅ **Locked: "Aira — Your Board Exam Buddy"**
2. **Domain name** — `aira-shivup32.vercel.app` for v1; custom domain (`aira.app`, `aira.education`, etc.) post-launch
3. **Logo/icon** — to be designed (suggested: simple lightbulb or "A" monogram in indigo `#534AB7`)
4. **Support email** — needed for ToS/privacy page (e.g., `support@aira.app` or personal email)
5. **CBSE attribution disclaimer** — exact wording for footer (suggested in PRD section 6.6)
6. **Diagram extraction strategy** — handled in EXTRACTION_FINDINGS.md (vision-LLM fallback)
7. **Multi-set ingestion scope** — Set-1 only for v1 launch, expand to Set-2/3 post-launch
8. **Solution source** — Hybrid (official marking schemes where available + LLM-generated fallback)
9. **Bilingual scope** — English only for v1, Hindi support deferred to v1.1+

---

## 11. Appendix

### A. Glossary
- **RAG** — Retrieval-Augmented Generation; grounding LLM responses in retrieved documents
- **Embedding** — Numerical vector representation of text for similarity search
- **pgvector** — Postgres extension for storing and querying vectors
- **HNSW** — Hierarchical Navigable Small World, fast approximate nearest neighbor index
- **PCM** — Physics, Chemistry, Mathematics (CBSE Class 12 stream)
- **PYQ** — Previous Year Question

### B. References
- Next.js 14 App Router docs: https://nextjs.org/docs
- Supabase pgvector: https://supabase.com/docs/guides/ai
- OpenRouter docs: https://openrouter.ai/docs
- Marker (PDF extraction): https://github.com/VikParuchuri/marker
- BGE embeddings: https://huggingface.co/BAAI/bge-small-en-v1.5
- Vercel AI SDK: https://sdk.vercel.ai/docs

---

**End of PRD v1.0**
