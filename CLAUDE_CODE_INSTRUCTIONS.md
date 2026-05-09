# 🚀 Claude Code Build Instructions
# Aira — Step-by-Step Implementation Guide

This document is meant to be handed to **Claude Code** (terminal agent) to scaffold, build, and ship the Aira app. Claude Code should follow these phases sequentially. Read `PRD.md` first for full context.

---

## ⚡ Pre-Flight Checklist (Human Tasks)

Before invoking Claude Code, the human (@ShivUP32) must complete these manual signups (Claude Code cannot do these in a browser):

- [ ] Create empty repo `ShivUP32/aira` on GitHub (public or private — your choice)
- [ ] **Vercel** account → connect GitHub
- [ ] **Supabase** project (free tier) → save URL + anon key + service role key
- [ ] **OpenRouter** account → generate API key (https://openrouter.ai/keys)
- [ ] **Hugging Face** account → generate token (free) for embeddings inference
- [ ] **Upstash** account → create Redis database → save REST URL + token
- [ ] (Optional) **PostHog** project → save API key
- [ ] (Optional) **Sentry** project → save DSN
- [ ] Place 2025 CBSE PDFs (questions + marking schemes if available) in a folder ready to upload (PCM + CS + English)

Save all keys in a single `.env.local` file (never commit it).

---

## Phase 1 — Foundation (Day 1–3)

### Goal
A working Next.js app deployed to Vercel where logged-in users can chat with an OpenRouter LLM (no RAG yet).

### Tasks

#### 1.1 Project Initialization
```bash
# Initialize Next.js with TypeScript + Tailwind + App Router
npx create-next-app@latest aira \
  --typescript --tailwind --app --src-dir=false --import-alias="@/*"
cd aira

# Install core dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install ai @ai-sdk/openai
npm install zod
npm install lucide-react
npm install katex react-katex
npm install react-markdown remark-gfm rehype-katex remark-math
npm install @upstash/ratelimit @upstash/redis
npm install class-variance-authority clsx tailwind-merge

# shadcn/ui setup
npx shadcn@latest init -d
npx shadcn@latest add button input textarea card dialog dropdown-menu \
  avatar separator scroll-area sheet skeleton sonner tabs select tooltip
```

#### 1.2 Environment Setup

Create `.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
HF_API_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
SENTRY_DSN=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### 1.3 Supabase Client Setup

Create `lib/supabase/client.ts`, `lib/supabase/server.ts`, and `lib/supabase/middleware.ts` following the official `@supabase/ssr` patterns. Add a `middleware.ts` at root that protects routes under `/(app)`.

#### 1.4 Database Schema

Run the SQL from `PRD.md` Section 5.4 in Supabase SQL Editor. Save as `supabase/migrations/001_initial_schema.sql` for version control.

Verify:
- `pgvector` extension enabled
- All tables created with RLS policies
- `match_documents` RPC function exists

#### 1.5 Auth Pages

Build:
- `app/(auth)/login/page.tsx` — email/password + Google OAuth button
- `app/(auth)/signup/page.tsx` — email/password + Google OAuth button
- `app/(auth)/callback/route.ts` — OAuth callback handler
- `app/(auth)/layout.tsx` — minimal centered layout

Configure Google OAuth in Supabase dashboard (Auth → Providers → Google).

#### 1.6 Protected Layout

Build `app/(app)/layout.tsx` with:
- Sidebar (conversations list — empty state for now)
- Top bar with mode switcher tabs + user avatar dropdown
- Children area for the chat

If user is not authenticated, redirect to `/login`.

#### 1.7 Basic Chat (No RAG)

Build `app/(app)/chat/page.tsx`:
- Use `@ai-sdk/react` `useChat` hook
- Posts to `/api/chat`

Build `app/api/chat/route.ts`:
- Validate user session
- Stream from OpenRouter using `meta-llama/llama-3.3-70b-instruct:free` via OpenAI-compatible API
- OpenRouter base URL: `https://openrouter.ai/api/v1`

Use the AI SDK's OpenAI provider with custom `baseURL`:
```typescript
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL!,
    'X-Title': 'Aira'
  }
});

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = await streamText({
    model: openrouter('meta-llama/llama-3.3-70b-instruct:free'),
    messages
  });
  return result.toDataStreamResponse();
}
```

#### 1.8 Deploy to Vercel
```bash
git init && git add -A && git commit -m "phase 1: foundation"
git branch -M main
git remote add origin https://github.com/ShivUP32/aira.git
git push -u origin main

# Connect repo to Vercel via dashboard:
# https://vercel.com/new → import ShivUP32/aira
# Add all env vars from .env.local in Vercel dashboard
# Trigger deploy → verify live URL works (e.g., aira-shivup32.vercel.app)
```

### Phase 1 Acceptance Criteria
- ✅ Public landing page renders
- ✅ User can sign up with email or Google
- ✅ After login, redirected to `/chat`
- ✅ User can send a message, sees streaming response from Llama 3.3
- ✅ Logout works
- ✅ Live URL works on `*.vercel.app`

---

## Phase 2 — RAG Pipeline (Day 4–7)

### Goal
Chat answers cite real CBSE 2025 board paper questions.

### 2.1 Set Up Python Pipeline (Local)

```bash
mkdir pipeline && cd pipeline
python3 -m venv .venv && source .venv/bin/activate

cat > requirements.txt <<EOF
marker-pdf
pymupdf
sentence-transformers
supabase
python-dotenv
tqdm
EOF

pip install -r requirements.txt
```

### 2.2 Extraction Script

`pipeline/01_extract.py`:
- Iterate over `data/raw/*.pdf`
- For each: run Marker → save to `data/extracted/{basename}.md`
- Log any failures
- Handle Marker memory: process one file at a time

### 2.3 Q&A Parsing Script

`pipeline/02_parse_qa.py`:
- Read each markdown file
- Use regex to detect question patterns: `^Q\.?\s*\d+\.?` or `^\d+\.\s`
- Build list of `{q_no, question, solution, marks}` per subject
- Infer marks from text patterns like `(5)`, `[3 marks]`, etc.
- **Manual review pass:** output `data/parsed/{subject}_2025.json` and pause for human to spot-check

Print stats:
- Total questions parsed per subject
- Marks distribution
- Flag any questions with empty solution

### 2.4 Chapter Tagging

`pipeline/02b_tag_chapters.py`:
- For each parsed question, use a small LLM call (or keyword matching) to assign a chapter
- Store reference list of CBSE Class 12 chapters per subject
- Output enriched JSON

### 2.5 Embedding Script

`pipeline/03_embed.py`:
- Load BGE-small: `SentenceTransformer('BAAI/bge-small-en-v1.5')`
- For each Q&A: embed `f"Question: {q}\n\nSolution: {s}"`
- Output `data/embedded/all_chunks.jsonl` with `{id, content, metadata, embedding}`

### 2.6 Upload Script

`pipeline/04_upload.py`:
- Connect to Supabase using service role key
- Batch insert into `documents` table (batches of 50)
- Verify count

### 2.7 Live Embedding (Server-Side)

Two options for embedding the user's live query in Vercel:

**Option A (recommended for free tier):** HuggingFace Inference API
```typescript
// lib/rag/embed.ts
export async function embedQuery(text: string): Promise<number[]> {
  const res = await fetch(
    'https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-small-en-v1.5',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
    }
  );
  if (!res.ok) throw new Error('embedding failed');
  return res.json();
}
```

**Option B (fallback):** Use OpenRouter's embedding endpoint or Jina Embeddings (1M tokens free).

### 2.8 Retrieval Endpoint

`app/api/rag/retrieve/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server';
import { embedQuery } from '@/lib/rag/embed';

export async function POST(req: Request) {
  const { query, filter = {}, limit = 5 } = await req.json();
  const supabase = await createClient();
  const embedding = await embedQuery(query);
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: limit,
    filter
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ results: data });
}
```

### 2.9 Wire RAG into Chat

Update `app/api/chat/route.ts`:
1. Extract last user message
2. Call retrieval (only for `doubt` and `practice` modes)
3. Build context block: format each result with metadata
4. Inject into system prompt
5. Stream response with citation IDs in custom header or as part of streaming data

Update frontend `Message.tsx`:
- Render citation chips below assistant messages
- Click chip → modal with full original Q&A

### Phase 2 Acceptance Criteria
- ✅ All 2025 PDFs parsed into JSON
- ✅ Documents table populated (~150–300 rows expected)
- ✅ Vector search returns relevant matches for sample queries
- ✅ Chat responses include citations to actual paper questions
- ✅ Citation chip click shows the source Q&A in a modal

---

## Phase 3 — Modes & UX Polish (Day 8–14)

### 3.1 Mode Switcher
- Tabs in chat header: Doubt / Learn / Practice / Revise
- URL state: `?mode=practice`
- Switching mode starts new conversation (or stays in current — UX decision)

### 3.2 Mode-Specific System Prompts
Create `lib/llm/prompts.ts` with the 4 system prompts from PRD Section 5.6.

### 3.3 Practice Mode Special UI
- Chapter selector dropdown
- Question card component (see mockup 3)
- Answer textarea
- "Submit" button → API evaluates → shows feedback
- Score tracker

### 3.4 Revision Mode Special UI
- Subject + chapter selectors
- Generate revision pack button
- Render structured output (key concepts, formulas, quiz)
- Quick quiz inline answer submission

### 3.5 Conversation History
- `app/api/conversations/route.ts` — list, create, delete
- Sidebar lists conversations grouped by date (today/yesterday/older)
- Click conversation → load messages

### 3.6 Bookmarks
- Star icon on each assistant message → toggles bookmark
- `app/(app)/bookmarks/page.tsx` — list of saved messages with filters

### 3.7 Math Rendering
- Wrap markdown rendering in `react-markdown` with `remark-math` + `rehype-katex`
- Import `katex/dist/katex.min.css` in root layout

### 3.8 Onboarding Flow
- After signup, route to `/onboarding`
- One screen: confirm subjects (PCM + CS + English pre-checked)
- Save to `profiles.subjects`
- Redirect to `/chat`

### Phase 3 Acceptance Criteria
- ✅ All 4 modes work distinctly
- ✅ Practice mode evaluates answers with feedback
- ✅ Revision pack generates with structure
- ✅ History persists, can reopen old conversations
- ✅ Bookmarks save and list
- ✅ Math equations render correctly

---

## Phase 4 — Launch Polish (Day 15–21)

### 4.1 Rate Limiting
- Use Upstash Ratelimit on `/api/chat`
- Sliding window: 30 requests / hour, 100 / day per user
- Return 429 with friendly message

### 4.2 Error Handling
- Wrap all API routes in try/catch
- Sentry integration for error reporting
- Graceful UI fallbacks (toast on error, retry button)

### 4.3 LLM Fallback Chain
`lib/llm/fallback.ts`:
- Try Llama 3.3 70B first
- On 429 / 5xx: retry with Gemini 2.0 Flash
- On second failure: retry with DeepSeek R1
- On all-fail: return error with retry button

### 4.4 Landing Page
- Hero (see mockup 1)
- Feature grid
- Sample chat preview (animated)
- FAQ section
- Footer with privacy / terms / contact

### 4.5 Analytics
- PostHog: track signup, login, message_sent, mode_switched, citation_clicked, bookmark_added
- Identify users by Supabase user ID

### 4.6 Legal Pages
- `/privacy` — privacy policy
- `/terms` — terms of service
- `/disclaimer` — CBSE attribution + AI disclaimer

### 4.7 PWA Setup
- `public/manifest.json`
- Add icons (192px, 512px)
- Service worker via `next-pwa` (optional for v1)
- Apple touch icon

### 4.8 SEO
- Meta tags, OpenGraph, Twitter cards
- `sitemap.xml` and `robots.txt`
- Structured data for educational app

### 4.9 Final QA
- Test on mobile (iOS + Android)
- Lighthouse score ≥ 90 on performance, accessibility, best practices
- Test all flows logged-in and logged-out
- Test rate limiting behavior

### Phase 4 Acceptance Criteria
- ✅ Rate limiting prevents abuse
- ✅ Errors don't crash the app
- ✅ Landing page conveys value clearly
- ✅ Analytics events fire correctly
- ✅ Mobile experience is smooth
- ✅ Lighthouse score 90+ on all axes

---

## 🛠️ Reference: Useful Commands

```bash
# Dev
npm run dev

# Build
npm run build

# Type check
npx tsc --noEmit

# Format
npx prettier --write .

# Run pipeline (local)
cd pipeline && source .venv/bin/activate
python 01_extract.py
python 02_parse_qa.py
python 02b_tag_chapters.py
python 03_embed.py
python 04_upload.py
```

---

## 📋 Reference: File Manifest

After Phase 4, the repo should contain (at minimum):

```
aira/
├── app/
│   ├── (auth)/{login,signup,callback}/
│   ├── (app)/{chat,practice,revision,bookmarks,onboarding}/
│   ├── api/{chat,conversations,bookmarks,rag/retrieve,practice/attempt}/
│   ├── (legal)/{privacy,terms,disclaimer}/
│   ├── page.tsx (landing)
│   └── layout.tsx
├── components/
│   ├── chat/{ChatInterface,MessageList,Message,CitationChip,ModeSwitcher,InputBox}.tsx
│   ├── practice/{QuestionCard,AnswerForm,FeedbackBox}.tsx
│   ├── revision/{RevisionPack,QuickQuiz}.tsx
│   └── ui/ (shadcn)
├── lib/
│   ├── supabase/{client,server,middleware}.ts
│   ├── llm/{openrouter,prompts,fallback}.ts
│   ├── rag/{embed,retrieve}.ts
│   ├── ratelimit.ts
│   └── utils.ts
├── pipeline/
│   ├── 01_extract.py
│   ├── 02_parse_qa.py
│   ├── 02b_tag_chapters.py
│   ├── 03_embed.py
│   ├── 04_upload.py
│   ├── requirements.txt
│   └── README.md
├── supabase/migrations/001_initial_schema.sql
├── data/{raw,extracted,parsed,embedded}/ (gitignored)
├── public/{icons, manifest.json, og-image.png}
├── .env.example
├── README.md
├── PRD.md (this file's sibling)
└── package.json
```

---

## 🚦 Recommended Order of Implementation

If Claude Code is given this entire doc at once, suggest tackling in this exact order:

1. **Phase 1.1–1.2** — scaffold + env
2. **Phase 1.3–1.4** — DB + Supabase clients
3. **Phase 1.5–1.7** — auth + basic chat
4. **Phase 1.8** — first Vercel deploy (pause here to verify)
5. **Phase 2.1–2.6** — Python pipeline (run locally, verify upload)
6. **Phase 2.7–2.9** — wire RAG to chat (pause to verify citations)
7. **Phase 3** — all modes + UX
8. **Phase 4** — polish + launch

After each phase, commit with message `phase N: <summary>` and push to GitHub. Vercel will auto-deploy.

---

## 🎯 Definition of Done

The project is complete when:
- A new visitor can land on the public URL, sign up, and ask a doubt that returns a cited answer in <5 seconds
- All 4 modes are functional
- Total monthly cost is $0 (within free tiers)
- The repo is on GitHub with a clean README
- The app passes Lighthouse 90+ on mobile

---

**End of Build Instructions**
