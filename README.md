# Aira

Aira is a Class 12 CBSE study companion built around four modes:

- Doubt Solver
- Learning
- Practice
- Revision
- Saved answers with local-first sync semantics

This fresh-start build is intentionally UI-first and static-safe. It keeps the
production shell renderable without Supabase, OpenRouter, Upstash, or middleware
while the product contract and visual system are rebuilt from the markdown specs.

## Current Routes

- `/` public landing page
- `/login` Google one-tap style auth screen
- `/onboarding` subject + language setup
- `/chat` interactive study shell
- `/practice` practice mode
- `/revision` revision mode
- `/learning` learning mode
- `/saved` local-first saved list

## PWA

The app includes a manifest, SVG app icons, install shortcuts, and a small
service worker for shell caching. The install button appears on the website and
inside the app shell when the browser exposes the install prompt.

## Design System

The UI follows the attached reference screens:

- Cream canvas `#FAF6EE`
- Paper panels `#FFFEFB`
- Ink `#1A1827`
- Indigo primary action `#4C44B8`
- Saffron citation/sync accents `#DC8B3F`
- Newsreader for academic/editorial text
- Geist for UI
- JetBrains Mono for metadata and source chips

## Next Integration Steps

1. Reconnect GitHub and Vercel to the new clean repository.
2. Add environment variables from `.env.example`.
3. Wire `/api/chat` to OpenRouter streaming.
4. Wire `/api/rag/retrieve` to Supabase pgvector.
5. Replace seed saved data with `/api/saved` delta sync.
6. Add Supabase Google OAuth after UI verification.

## Release Smoke Checklist

- `/api/rag/health` reports real Supabase document count; if count is `0` or env is missing, `retrievalSource` is `seed`.
- Real RAG answers show distinct citation question, answer, source label, and marking-scheme metadata when document metadata provides them.
- Saving an answer calls `/api/saved` once, stores `serverId` when Supabase returns one, and delete uses that saved server id.
- Practice submit, Revision quick quiz, and Learning quick check all return visible feedback; authenticated Supabase sessions persist attempts through `/api/practice`.
- Run `npm run lint` and `npm run build` before release, then smoke `/chat`, `/practice`, `/revision`, `/learning`, and `/saved`.
