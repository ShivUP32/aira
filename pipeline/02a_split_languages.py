#!/usr/bin/env python3
"""
Stage 2a: Split bilingual extracted text into one file per language.

Reads data/extracted/{subject}/*.md and writes data/language_split/{subject}/*.md.
Single-language papers are copied as-is. Bilingual papers are split into *_en.md
and *_hi.md so downstream parsing can keep language in the dedupe key.

Usage:
    python 02a_split_languages.py
    python 02a_split_languages.py --subject physics
"""

import argparse
import re
import shutil
import sys
from pathlib import Path
from typing import Dict, List, Optional

from tqdm import tqdm

sys.path.insert(0, str(Path(__file__).parent))
from config import DATA_EXTRACTED, DATA_LANGUAGE_SPLIT, SUBJECT_MAP

DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")
LATIN_RE = re.compile(r"[A-Za-z]")


def canonical_subject(name: str) -> str:
    key = name.strip().lower().replace("_", "-")
    return SUBJECT_MAP.get(key, key)


def line_language(line: str) -> str:
    deva = len(DEVANAGARI_RE.findall(line))
    latin = len(LATIN_RE.findall(line))
    if deva == 0 and latin == 0:
        return "neutral"
    return "hi" if deva > latin else "en"


def split_text_by_language(text: str) -> Dict[str, str]:
    buckets: Dict[str, List[str]] = {"en": [], "hi": []}

    for line in text.splitlines():
        lang = line_language(line)
        if lang == "neutral":
            for bucket in buckets.values():
                bucket.append(line)
            continue

        buckets[lang].append(line)

    return {lang: "\n".join(lines).strip() for lang, lines in buckets.items() if "\n".join(lines).strip()}


def is_effectively_bilingual(text: str) -> bool:
    deva = len(DEVANAGARI_RE.findall(text))
    latin = len(LATIN_RE.findall(text))
    total = deva + latin
    if total == 0:
        return False
    return deva / total > 0.12 and latin / total > 0.12


def detect_language(text: str) -> str:
    deva = len(DEVANAGARI_RE.findall(text))
    latin = len(LATIN_RE.findall(text))
    return "hi" if deva > latin else "en"


def process_file(md_path: Path, output_dir: Path) -> int:
    text = md_path.read_text(encoding="utf-8", errors="replace")
    output_dir.mkdir(parents=True, exist_ok=True)

    if is_effectively_bilingual(text):
        written = 0
        for lang, lang_text in split_text_by_language(text).items():
            if not lang_text:
                continue
            out_path = output_dir / f"{md_path.stem}_{lang}.md"
            out_path.write_text(lang_text + "\n", encoding="utf-8")
            written += 1
        return written

    lang = detect_language(text)
    out_path = output_dir / f"{md_path.stem}_{lang}.md"
    shutil.copyfile(md_path, out_path)
    return 1


def main(subject_filter: Optional[str] = None) -> None:
    if not DATA_EXTRACTED.exists():
        print(f"ERROR: {DATA_EXTRACTED} does not exist. Run 01_extract.py first.")
        sys.exit(1)

    DATA_LANGUAGE_SPLIT.mkdir(parents=True, exist_ok=True)
    subject_dirs = sorted(path for path in DATA_EXTRACTED.iterdir() if path.is_dir())
    if subject_filter:
        subject_dirs = [d for d in subject_dirs if canonical_subject(d.name) == canonical_subject(subject_filter)]

    total_in = 0
    total_out = 0
    for subject_dir in subject_dirs:
        subject = canonical_subject(subject_dir.name)
        md_files = sorted(subject_dir.glob("*.md"))
        if not md_files:
            continue

        output_dir = DATA_LANGUAGE_SPLIT / subject
        print(f"\n📁 {subject.upper()} — {len(md_files)} extracted file(s)")
        for md_path in tqdm(md_files, desc=f"  Splitting {subject}"):
            total_in += 1
            total_out += process_file(md_path, output_dir)

    print(f"\n✅ Split/copied {total_in} file(s) into {total_out} language-specific file(s)")
    print(f"   Output in: {DATA_LANGUAGE_SPLIT}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--subject", help="Process only this subject")
    args = parser.parse_args()
    main(args.subject)
