#!/usr/bin/env python3
"""
Stage 2c: Match official marking-scheme solutions to parsed questions.

Reads marking-scheme markdown from data/language_split when available, otherwise
data/extracted. Updates data/parsed/*.json in place and only fills questions
whose solution is still empty.

Usage:
    python 02c_match_solutions.py
    python 02c_match_solutions.py --subject physics
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from tqdm import tqdm

sys.path.insert(0, str(Path(__file__).parent))
from config import DATA_EXTRACTED, DATA_LANGUAGE_SPLIT, DATA_PARSED, SUBJECT_MAP

DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")
QUESTION_START_RE = re.compile(
    r"(?im)^\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,2})(?:\s*[.)])?(?:\s*[:\-]\s+|\s+)"
)


def canonical_subject(name: str) -> str:
    key = name.strip().lower().replace("_", "-")
    return SUBJECT_MAP.get(key, key)


def is_marking_scheme_file(filename: str) -> bool:
    normalized = filename.lower().replace("_", "-").replace(" ", "-")
    return any(token in normalized for token in ("marking-scheme", "-ms-", "-ms.", "scheme"))


def detect_language(text: str) -> str:
    deva = len(DEVANAGARI_RE.findall(text))
    latin = len(re.findall(r"[a-zA-Z]", text))
    if deva + latin == 0:
        return "en"
    return "hi" if deva / (deva + latin) > 0.5 else "en"


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


def infer_metadata_from_filename(filename: str) -> Tuple[int, str]:
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

    year_match = re.search(r"(202\d)", filename)
    if year_match:
        year = int(year_match.group(1))
    return year, set_label


def infer_set_codes_from_filename(filename: str) -> List[str]:
    stem = Path(filename).stem
    stem = re.sub(r"_(?:en|hi)$", "", stem, flags=re.IGNORECASE)
    grouped = re.search(r"(?<!\d)(\d{1,3})[\s_-]+(\d)[\s_-]+(\d(?:\s*,\s*\d)*)(?!\d)", stem)
    if grouped:
        code, series, variants = grouped.groups()
        return [f"{code}/{series}/{variant.strip()}" for variant in variants.split(",")]
    return [infer_metadata_from_filename(filename)[1]]


def extract_solution_chunks(text: str) -> Dict[int, str]:
    matches = list(QUESTION_START_RE.finditer(text))
    chunks: Dict[int, str] = {}

    for index, match in enumerate(matches):
        q_no = int(match.group(1))
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        chunk = text[start:end].strip()
        if len(chunk) < 12:
            continue
        existing = chunks.get(q_no, "")
        chunks[q_no] = f"{existing}\n\n{chunk}".strip() if existing else chunk

    return chunks


def set_matches(question_set: str, scheme_sets: List[str]) -> bool:
    if not scheme_sets or "unknown" in scheme_sets:
        return True
    question_parts = question_set.split("/")
    for scheme_set in scheme_sets:
        if question_set == scheme_set:
            return True
        if scheme_set.endswith("/B") and question_set.startswith(scheme_set.split("/", 1)[0]):
            return True
        scheme_parts = scheme_set.split("/")
        if len(scheme_parts) == 2 and len(question_parts) >= 3 and question_parts[1:] == scheme_parts:
            return True
    return False


def load_solution_sources(input_root: Path, subject_filter: Optional[str]) -> List[dict]:
    sources = []
    subject_dirs = sorted(path for path in input_root.iterdir() if path.is_dir())
    if subject_filter:
        subject_dirs = [d for d in subject_dirs if canonical_subject(d.name) == canonical_subject(subject_filter)]

    for subject_dir in subject_dirs:
        subject = canonical_subject(subject_dir.name)
        for md_path in subject_dir.glob("*.md"):
            if not is_marking_scheme_file(md_path.name):
                continue
            text = md_path.read_text(encoding="utf-8", errors="replace")
            year, set_label = infer_metadata_from_filename(md_path.name)
            sources.append({
                "subject": subject,
                "year": year,
                "set": set_label,
                "set_codes": infer_set_codes_from_filename(md_path.name),
                "language": language_from_filename(md_path.name) or detect_language(text),
                "source_pdf": source_pdf_from_md(md_path.name),
                "chunks": extract_solution_chunks(text),
            })
    return sources


def main(subject_filter: Optional[str] = None) -> None:
    input_root = DATA_LANGUAGE_SPLIT if DATA_LANGUAGE_SPLIT.exists() else DATA_EXTRACTED
    if not input_root.exists():
        print(f"ERROR: {input_root} does not exist. Run 01_extract.py first.")
        sys.exit(1)

    solution_sources = load_solution_sources(input_root, subject_filter)
    if not solution_sources:
        print(f"⚠ No marking-scheme markdown found in {input_root}")
        return

    json_files = sorted(DATA_PARSED.glob("*.json"))
    if subject_filter:
        wanted = canonical_subject(subject_filter)
        json_files = [path for path in json_files if path.stem.replace("_2025", "") == wanted]

    total_matched = 0
    for json_path in json_files:
        with open(json_path, encoding="utf-8") as f:
            questions = json.load(f)

        matched = 0
        print(f"\n🧩 {json_path.name}: matching official solutions")
        for q in tqdm(questions, desc="  Matching"):
            if q.get("solution"):
                continue
            for source in solution_sources:
                if source["subject"] != q.get("subject"):
                    continue
                if source["year"] != q.get("year"):
                    continue
                if source["language"] != q.get("language", "en"):
                    continue
                if not set_matches(str(q.get("set", "")), source["set_codes"]):
                    continue
                solution = source["chunks"].get(int(q.get("q_no", 0)))
                if not solution:
                    continue
                q["solution"] = solution
                q["solution_source"] = "marking-scheme"
                q["solution_pdf"] = source["source_pdf"]
                matched += 1
                break

        if matched:
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(questions, f, ensure_ascii=False, indent=2)

        total_matched += matched
        print(f"  ✓ matched {matched} solution(s)")

    print(f"\n✅ Matched {total_matched} official solution(s)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--subject", help="Process only this subject")
    args = parser.parse_args()
    main(args.subject)
