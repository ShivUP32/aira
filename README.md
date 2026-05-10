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
- `/saved` local-first saved list demo

## Design System

The UI follows the attached "Warm Studious" references:

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
5. Replace demo saved data with `/api/saved` delta sync.
6. Add Supabase Google OAuth after UI verification.
