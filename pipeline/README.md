# Aira — PDF Ingestion Pipeline

Run these scripts locally (not on Vercel) to ingest CBSE board papers into the knowledge base.

## Setup

```bash
cd pipeline
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Required folder structure

Place PDFs in `~/aira/data/raw/` like this:
```
data/raw/
  physics/
    55-1-1_questions.pdf
    55-1-1_marking-scheme.pdf   # optional
  chemistry/
    56-1-1_questions.pdf
  mathematics/
    65-1-1_questions.pdf
    65-1-1_marking-scheme.pdf
  cs/
    83-1-1_questions.pdf
  english/
    1-1-1_questions.pdf
```

## Run order

```bash
# 1. Extract text from PDFs
python 01_extract.py

# 2. Parse questions + solutions
python 02_parse_qa.py

# 3. Generate AI solutions for questions without marking schemes
python 03_generate_solutions.py

# 4. Auto-tag chapters
python 04_tag_chapters.py

# 5. Generate vector embeddings
python 05_embed.py

# 6. Upload to Supabase
python 06_upload.py --dry-run   # preview first
python 06_upload.py             # actual upload
```

## Expected output

| Step | Output | Expected size |
|------|--------|---------------|
| 01_extract | `data/extracted/{subject}/*.md` | ~500KB/subject |
| 02_parse_qa | `data/parsed/{subject}_2025.json` | ~150–300 questions |
| 03_generate | Updated JSON with solutions | same files |
| 04_tag_chapters | Updated JSON with chapters | same files |
| 05_embed | `data/embedded/all_chunks.jsonl` | ~2MB for Wave 1 |
| 06_upload | Supabase `documents` table | ~250 rows (Wave 1) |

## Verify upload

After upload, run in Supabase SQL Editor:
```sql
SELECT metadata->>'subject' AS subject, count(*) 
FROM documents 
GROUP BY 1 
ORDER BY 1;
```

Or hit the health endpoint:
```
GET /api/rag/health
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Marker fails on Physics/Chemistry | Use `--subject` to re-run just that subject. If a specific Q fails, run vision fallback (see `01_extract.py`) |
| `429 Too Many Requests` in step 3 | Script sleeps 60s automatically. Or wait and re-run — it skips already-solved questions |
| Hindi text mangled | Make sure the PDF has embedded fonts. Check with `pdfinfo` |
| Questions parsed incorrectly | Manually edit the JSON in `data/parsed/` before running embed |
| Duplicate uploads | The upload script is idempotent — safe to re-run |

## Wave 2 & 3

After Wave 1 (Set-1 English) is live, run again with:
- **Wave 2**: Set-2 + Set-3 English PDFs (drop in `data/raw/`, re-run steps 1–6)
- **Wave 3**: All Hindi PDFs (same process, language auto-detected as 'hi')

The pipeline is fully idempotent — running with new PDFs won't create duplicates.
