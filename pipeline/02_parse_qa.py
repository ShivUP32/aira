#!/usr/bin/env python3
"""
Stage 2: Parse Q&A from extracted markdown.
Detects questions, sub-parts, OR variants, and section marks.
Outputs JSON per subject.

Usage:
    python 02_parse_qa.py
    python 02_parse_qa.py --subject physics
"""

import json
import re
import argparse
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from tqdm import tqdm

sys.path.insert(0, str(Path(__file__).parent))
from config import DATA_EXTRACTED, DATA_LANGUAGE_SPLIT, DATA_PARSED, MARKS_BY_SECTION, SUBJECT_MAP

DATA_PARSED.mkdir(parents=True, exist_ok=True)

# Regex patterns
SECTION_RE = re.compile(r'^SECTION\s+([A-E])', re.IGNORECASE | re.MULTILINE)
QUESTION_RE = re.compile(r'^\s*(\d{1,2})\.\s+(.+?)(?=\n\s*\d{1,2}\.\s|\nSECTION\s|$)', re.DOTALL | re.MULTILINE)
OR_RE = re.compile(r'^\s*OR\s*$', re.MULTILINE)
MARKS_RE = re.compile(r'\((\d)\s*(?:marks?)?\)|\[(\d)\s*(?:marks?)?\]', re.IGNORECASE)
DEVANAGARI_RE = re.compile(r'[ऀ-ॿ]')


def detect_language(text: str) -> str:
    deva = len(DEVANAGARI_RE.findall(text))
    latin = len(re.findall(r'[a-zA-Z]', text))
    if deva + latin == 0:
        return 'en'
    return 'hi' if deva / (deva + latin) > 0.5 else 'en'


def extract_marks(text: str, section: str) -> int:
    m = MARKS_RE.search(text)
    if m:
        return int(m.group(1) or m.group(2))
    return MARKS_BY_SECTION.get(section.upper(), 1)


def canonical_subject(name: str) -> str:
    key = name.strip().lower().replace("_", "-")
    return SUBJECT_MAP.get(key, key)


def is_marking_scheme_file(filename: str) -> bool:
    normalized = filename.lower().replace("_", "-").replace(" ", "-")
    return any(token in normalized for token in ("marking-scheme", "-ms-", "_ms_", " ms ", "-ms.", "scheme"))


def language_from_filename(filename: str) -> Optional[str]:
    stem = Path(filename).stem.lower()
    if stem.endswith("_hi") or stem.endswith("-hi") or stem.endswith("_h"):
        return "hi"
    if stem.endswith("_en") or stem.endswith("-en"):
        return "en"
    return None


def source_pdf_from_md(filename: str) -> str:
    stem = Path(filename).stem
    stem = re.sub(r"_(?:en|hi)$", "", stem, flags=re.IGNORECASE)
    return f"{stem}.pdf"


def parse_md_file(md_path: Path, subject: str, year: int, set_label: str) -> List[dict]:
    text = md_path.read_text(encoding="utf-8", errors="replace")
    language = language_from_filename(md_path.name) or detect_language(text)
    source_pdf = source_pdf_from_md(md_path.name)
    questions = []
    current_section = "A"

    # Split by sections
    section_chunks = SECTION_RE.split(text)
    # section_chunks: [preamble, 'A', content_A, 'B', content_B, ...]
    chunks_paired: List[Tuple[str, str]] = []
    if len(section_chunks) > 1:
        for i in range(1, len(section_chunks), 2):
            if i + 1 < len(section_chunks):
                chunks_paired.append((section_chunks[i], section_chunks[i + 1]))

    if not chunks_paired:
        # No section markers found — treat entire text as one section
        chunks_paired = [("A", text)]

    for section_letter, section_text in chunks_paired:
        current_section = section_letter

        # Split by OR variants
        or_parts = OR_RE.split(section_text)

        # Find all questions in this section
        for q_match in QUESTION_RE.finditer(section_text):
            q_no = int(q_match.group(1))
            q_body = q_match.group(2).strip()

            marks = extract_marks(q_body, current_section)

            # Check for OR variant in the question body
            or_split = OR_RE.split(q_body)
            if len(or_split) > 1:
                for or_idx, variant in enumerate(or_split):
                    v = variant.strip()
                    if not v:
                        continue
                    questions.append({
                        "subject": subject,
                        "year": year,
                        "set": set_label,
                        "section": current_section,
                        "q_no": q_no,
                        "marks": marks,
                        "type": classify_type(marks),
                        "language": language,
                        "or_group": f"Q{q_no}" if len(or_split) > 1 else None,
                        "or_variant": or_idx,
                        "question": v,
                        "solution": "",
                        "solution_source": "pending",
                        "topic": "",
                        "source_pdf": source_pdf,
                        "has_diagram": "[diagram]" in v.lower() or "figure" in v.lower(),
                        "chapter": "",
                    })
            else:
                questions.append({
                    "subject": subject,
                    "year": year,
                    "set": set_label,
                    "section": current_section,
                    "q_no": q_no,
                    "marks": marks,
                    "type": classify_type(marks),
                    "language": language,
                    "or_group": None,
                    "or_variant": 0,
                    "question": q_body,
                    "solution": "",
                    "solution_source": "pending",
                    "topic": "",
                    "source_pdf": source_pdf,
                    "has_diagram": "[diagram]" in q_body.lower() or "figure" in q_body.lower(),
                    "chapter": "",
                })

    return questions


def classify_type(marks: int) -> str:
    if marks == 1: return "mcq"
    if marks == 2: return "vsa"
    if marks == 3: return "sa"
    if marks == 4: return "case-study"
    return "la"


def infer_metadata_from_filename(filename: str) -> Tuple[int, str]:
    """Infer year and real CBSE set code from filename like '55-1-1_questions.md'."""
    stem = Path(filename).stem
    stem = re.sub(r"_(?:en|hi)$", "", stem, flags=re.IGNORECASE)
    year, set_label = 2025, "unknown"

    code_match = re.search(r"(?<!\d)(\d{1,3})[\s_-]+(\d)[\s_-]+(\d)(?!\d)", stem)
    if code_match:
        set_label = "/".join(code_match.groups())
    else:
        s_match = re.search(r"(?<!\d)(\d{1,3})\s*(?:\([Bb]\))?[\s_-]*S[\s_-]*(\d)(?!\d)", stem, re.IGNORECASE)
        if s_match:
            set_label = f"{s_match.group(1)}/1/{s_match.group(2)}"
        else:
            blind_match = re.search(r"(?<!\d)(\d{1,3})\s*\([Bb]\)", stem)
            if blind_match:
                set_label = f"{blind_match.group(1)}/B"
            else:
                set_match = re.search(r"set[\s_-]*(\d)(?:[\s_-]*(\d))?", stem, re.IGNORECASE)
                if set_match:
                    set_label = "/".join(part for part in set_match.groups() if part)

    year_match = re.search(r'(202\d)', filename)
    if year_match:
        year = int(year_match.group(1))
    return year, set_label


def main(subject_filter: Optional[str] = None) -> None:
    input_root = DATA_LANGUAGE_SPLIT if DATA_LANGUAGE_SPLIT.exists() else DATA_EXTRACTED
    subject_dirs = sorted(input_root.iterdir())
    if subject_filter:
        subject_dirs = [d for d in subject_dirs if canonical_subject(d.name) == canonical_subject(subject_filter)]

    grand_total = 0
    for subject_dir in subject_dirs:
        if not subject_dir.is_dir():
            continue
        subject = canonical_subject(subject_dir.name)
        md_files = [path for path in subject_dir.glob("*.md") if not is_marking_scheme_file(path.name)]
        if not md_files:
            continue

        print(f"\n📁 {subject.upper()}")
        all_questions = []

        for md_path in tqdm(md_files, desc=f"  Parsing {subject}"):
            year, set_label = infer_metadata_from_filename(md_path.name)
            qs = parse_md_file(md_path, subject, year, set_label)
            all_questions.extend(qs)
            print(f"    {md_path.name}: {len(qs)} questions")

        output_path = DATA_PARSED / f"{subject}_2025.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(all_questions, f, ensure_ascii=False, indent=2)

        print(f"  ✓ {len(all_questions)} total → {output_path.name}")
        print(f"  Marks distribution: {{}}")
        from collections import Counter
        dist = Counter(q["marks"] for q in all_questions)
        for marks, count in sorted(dist.items()):
            print(f"    {marks}m: {count} questions")

        missing_solution = sum(1 for q in all_questions if not q["solution"])
        if missing_solution:
            print(f"  ⚠ {missing_solution} questions need solutions (run 02c_match_solutions.py, then 03_generate_solutions.py)")

        grand_total += len(all_questions)

    print(f"\n✅ Total: {grand_total} questions across all subjects")
    print(f"   Review JSON files in {DATA_PARSED} before running embed script")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--subject", help="Process only this subject")
    args = parser.parse_args()
    main(args.subject)
