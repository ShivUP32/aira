# 🔍 PDF Extraction Findings — 2025 CBSE Mathematics Paper

**Tested:** `65/S/1 Mathematics 2025 Set-1` (23 pages, ~50 questions)
**Date:** May 2026

This document captures the reality of extracting CBSE board papers and sets concrete pipeline rules.

---

## 1. PDF Structure (CBSE 2025)

| Property | Value |
|----------|-------|
| Format | A4, PDF 1.7 |
| Producer | Foxit PhantomPDF Printer 9.7 |
| Pages | 23 |
| Type | Text-based (NOT scanned) ✅ |
| Languages | Hindi (left-side pages) + English (right-side pages), interleaved |
| Fonts | Embedded ✅ |
| Math | Rendered as text + Unicode + glyphs (not images) |
| Diagrams | Vector-drawn (not raster) — pdfimages won't extract them |
| Form fields | None |

---

## 2. What Plain Text Extraction Gives You (Bad for Math)

`pdftotext -layout` on a math question:

```
        3 cos x
10.             dx is equal to :
            x
```

**Should have been:** $\int \frac{3 \cos\sqrt{x}}{\sqrt{x}} \, dx$

**What's lost:**
- Integral signs (∫)
- Square roots (√)
- Fractions (rendered as 2D layout, flattened to 1D garbage)
- Superscripts/subscripts (lost or merged into adjacent text)
- Special operators (∇, ⋅, ×, etc.)

**Verdict:** Plain text extraction is **unusable for Math, Physics, Chemistry**.

---

## 3. Extraction Strategy (Final)

### Subject-by-Subject Approach

| Subject | Primary Tool | Why |
|---------|--------------|-----|
| **Mathematics** | Marker | Heavy LaTeX needs |
| **Physics** | Marker | Equations + diagrams |
| **Chemistry** | Marker | Reactions + structures |
| **Computer Science** | PyMuPDF | Mostly text + code blocks |
| **English** | PyMuPDF | Pure text |

### Marker (For Math/Physics/Chemistry)

- Open-source: https://github.com/VikParuchuri/marker
- Outputs Markdown with `$...$` for inline math, `$$...$$` for blocks
- Extracts diagrams as PNG images alongside text references
- Runs locally on CPU; ~6GB RAM peak; ~5–10 min per 25-page paper
- License: GPL-3.0 (fine for our use; we run it locally, not redistribute)

```bash
pip install marker-pdf
marker_single input.pdf output_dir --max_pages 25
```

### PyMuPDF (For CS/English)

- Pip name: `pymupdf`, import: `fitz`
- Faster than Marker, no model loading
- Preserves layout via `page.get_text("dict")` for fine control
- Use `pdftotext -layout` as a fallback CLI tool

### Vision-LLM Fallback (For Marker Misses)

When Marker mangles a specific question, use OpenRouter's free vision models on JUST that page:

```python
# Pseudo-code
import openrouter
img = rasterize_page(pdf, page_num)  # via pdftoppm
prompt = "Extract this CBSE question and its sub-parts. Use LaTeX for all math. Return JSON: {q_no, marks, question, options}"
result = openrouter.chat(
    model="google/gemini-2.0-flash-exp:free",  # accepts images
    messages=[{"role": "user", "content": [
        {"type": "image_url", "image_url": img},
        {"type": "text", "text": prompt}
    ]}]
)
```

Rate-limited but free — only invoke for problem questions.

---

## 4. Bilingual Filtering — REVISED for Hindi+English Support

CBSE PDFs alternate Hindi (देवनागरी) and English. Pages 1, 2, 4, 6, 8… are Hindi; pages 3, 5, 7, 9… are English (varies per paper).

**Strategy: Split into TWO documents per question, one per language.**

```python
import re

def detect_language(text: str) -> str:
    """Returns 'hi', 'en', or 'mixed'."""
    devanagari_chars = len(re.findall(r'[\u0900-\u097F]', text))
    latin_chars = len(re.findall(r'[a-zA-Z]', text))
    total = devanagari_chars + latin_chars
    if total == 0:
        return 'mixed'
    hi_ratio = devanagari_chars / total
    if hi_ratio > 0.7:
        return 'hi'
    if hi_ratio < 0.1:
        return 'en'
    return 'mixed'

def split_bilingual_page(page_text: str) -> dict:
    """Some pages have left-Hindi, right-English columns. Split by indentation/columns."""
    # Implementation depends on PDF layout — use pdfplumber's word coordinates
    # to identify columns.
    ...
```

**Each question becomes 2 chunks** with shared `or_group` metadata:
- `{q_no: 7, language: 'en', ...}`
- `{q_no: 7, language: 'hi', ...}`

User's profile or input language drives which language gets retrieved.

**Embedding model change:** Use `paraphrase-multilingual-MiniLM-L12-v2` (384-dim, multilingual, free) instead of BGE-small-en-v1.5. Same dimensions, multilingual semantic space.

---

## 5. Question Parsing Strategy

CBSE board papers follow a strict structure that makes parsing reliable:

### Section markers
```
SECTION A  →  MCQs (1 mark each)
SECTION B  →  VSA (2 marks each)
SECTION C  →  SA (3 marks each)
SECTION D  →  LA (5 marks each)
SECTION E  →  Case Study (4 marks each)
```

### Question patterns
Match on regex:
```python
QUESTION_RE = re.compile(r'^(\d{1,2})\.\s+', re.MULTILINE)
SUBPART_RE = re.compile(r'^\((a|b|i|ii|iii)\)\s+', re.MULTILINE)
OR_MARKER_RE = re.compile(r'^\s*OR\s*$', re.MULTILINE)
```

### Internal "OR" choices
~10–15% of questions have OR alternatives. Strategy: **ingest both as separate documents** with shared metadata `{or_group: "Q21"}`. This way, students searching for either variant get hits.

### Marks detection
Look for italicized `1`, `2`, `3`, `5` at end of sub-parts in case studies, OR section header tells us defaults (Section A = 1 mark, etc.).

---

## 6. Chunk Structure (Final)

Each row in the `documents` table = one Q-A pair:

```json
{
  "id": 142,
  "content": "Question: If x = t³ and y = t², then d²y/dx² at t = 1 is:\n(A) 3/2  (B) -2/9  (C) -3/2  (D) -2/3\n\nSolution: dy/dx = (dy/dt) / (dx/dt) = 2t / 3t² = 2/(3t). Differentiating again wrt x using chain rule: d²y/dx² = -2/(9t³). At t=1, value is -2/9. Answer: (B).",
  "embedding": [0.234, -0.118, ...],   // 384-dim BGE
  "metadata": {
    "subject": "mathematics",
    "year": 2025,
    "set": "65/S/1",
    "section": "A",
    "q_no": 7,
    "marks": 1,
    "type": "mcq",
    "chapter": "Continuity and Differentiability",
    "topic": "Parametric Differentiation",
    "or_group": null,
    "has_diagram": false,
    "language": "en"
  }
}
```

---

## 7. Solutions Source Strategy

**Important: the question paper PDFs do NOT contain solutions.** CBSE publishes marking schemes separately.

### Three options, ranked:

#### Option A — Official CBSE Marking Schemes (best quality)
- Available at: `cbseacademic.nic.in` and `cbse.nic.in/newsite/marking-scheme.html`
- Format: PDF with detailed step-wise solutions and marking allocation
- Download separately for each subject + set
- **Recommended if you can find them**

#### Option B — LLM-Generated Solutions (pragmatic)
- One-time generation during ingestion
- Use a strong free model (e.g., DeepSeek R1 free or Gemini 2.0 Flash)
- Cost: ~5000 tokens per question × 250 questions = 1.25M tokens (well within free limits)
- Quality: Good for Math/CS, decent for Physics/Chemistry, OK for English
- Add metadata: `{"solution_source": "llm-generated"}` for transparency

#### Option C — Hybrid (RECOMMENDED)
- Use marking schemes where you have them (best authority)
- Fall back to LLM generation for missing ones
- Always show a small label in UI: "Official solution" vs "AI-generated solution"

---

## 8. Volume Estimate

| Source | Questions | Chunks |
|--------|-----------|--------|
| Mathematics (Set 1) | ~50 (incl. OR variants) | ~50 |
| Physics (Set 1) | ~40 | ~40 |
| Chemistry (Set 1) | ~40 | ~40 |
| Computer Science (Set 1) | ~30 | ~30 |
| English (Set 1) | ~25 | ~25 |
| **Total (Set 1 only)** | ~185 | ~185 |
| **All 3 sets per subject** | ~555 | ~555 |

At BGE-small (384 dim, 4 bytes per float) + content + metadata:
- 1 chunk ≈ 3 KB
- 555 chunks ≈ 1.7 MB
- **Easily fits in Supabase free tier (500 MB).**

---

## 9. Pipeline Time Estimate

For the human running ingestion locally (one-time):

| Step | Per Subject | All 5 Subjects (Set 1) |
|------|-------------|------------------------|
| Marker extraction | 5–10 min | 30–50 min |
| Q&A parsing + manual fix | 15–20 min | 1.5–2 hrs |
| Chapter tagging | 5 min | 25 min |
| Solution generation/import | 15 min | 1.5 hrs |
| Embedding (BGE-small) | 1–2 min | 10 min |
| Upload to Supabase | <1 min | 5 min |
| **Total (Set 1 only)** | ~45 min | **~4 hrs** |

If ingesting all 3 sets per subject: roughly **12 hours of human-attended work**, mostly during the manual review pass.

---

## 10. Quality Assurance Checklist

Before marking RAG ingestion as "done", verify:

- [ ] Sample 10 questions per subject — visually compare extracted text vs original PDF
- [ ] Test 5 sample queries per subject — confirm vector search returns correct chunks
- [ ] Run `select metadata->>'subject', count(*) from documents group by 1` — confirm counts match expectation
- [ ] Open each document via citation in UI — confirm question + solution display correctly
- [ ] Try a known wrong query (e.g., "biology Krebs cycle") — confirm low similarity scores trigger "no answer found" path

---

## 11. Open Risks

| Risk | Mitigation |
|------|------------|
| Marker fails on diagram-heavy Physics questions | Vision-LLM fallback per problem question |
| Hindi script bleeds into English chunks | Strict language filter on each chunk |
| OR variants confuse the model | Tag with `or_group` so retrieval can dedupe in UI |
| LLM-generated solutions have errors | Always show source; add user feedback button |
| Marking scheme PDFs aren't available for all sets | Hybrid approach — generate where missing |

---

**End of Extraction Findings**
