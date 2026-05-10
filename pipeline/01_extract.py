#!/usr/bin/env python3
"""
Stage 1: PDF extraction.
- Physics / Chemistry / Math  → Marker (preserves LaTeX)
- CS / English               → PyMuPDF (fast plain text)

Usage:
    python 01_extract.py
    python 01_extract.py --subject physics  # single subject
"""

import argparse
import sys
from pathlib import Path
from tqdm import tqdm

sys.path.insert(0, str(Path(__file__).parent))
from config import DATA_RAW, DATA_EXTRACTED, SUBJECTS_USING_MARKER, SUBJECTS_USING_PYMUPDF

DATA_EXTRACTED.mkdir(parents=True, exist_ok=True)


def extract_with_marker(pdf_path: Path, output_dir: Path) -> str:
    """Extract using Marker — handles LaTeX math well."""
    from marker.convert import convert_single_pdf
    from marker.models import load_all_models

    models = load_all_models()
    full_text, images, metadata = convert_single_pdf(str(pdf_path), models)
    output_dir.mkdir(parents=True, exist_ok=True)
    return full_text


def extract_with_pymupdf(pdf_path: Path) -> str:
    """Extract using PyMuPDF — fast, good for text-heavy docs."""
    import fitz
    doc = fitz.open(str(pdf_path))
    pages = []
    for page in doc:
        text = page.get_text("text")
        pages.append(text)
    doc.close()
    return "\n\n--- PAGE BREAK ---\n\n".join(pages)


def process_pdf(pdf_path: Path, subject: str, output_base: Path) -> None:
    basename = pdf_path.stem
    output_file = output_base / f"{basename}.md"

    if output_file.exists():
        print(f"  ↳ Skipping (already extracted): {output_file.name}")
        return

    print(f"  Extracting: {pdf_path.name}")
    try:
        if subject in SUBJECTS_USING_MARKER:
            text = extract_with_marker(pdf_path, output_base / "images")
        else:
            text = extract_with_pymupdf(pdf_path)

        output_file.write_text(text, encoding="utf-8")
        print(f"  ✓ Saved → {output_file.name} ({len(text):,} chars)")
    except Exception as e:
        print(f"  ✗ FAILED: {e}")
        # Write error file so we can see what happened
        output_file.with_suffix(".error.txt").write_text(str(e))


def main(subject_filter: str | None = None) -> None:
    if not DATA_RAW.exists():
        print(f"ERROR: {DATA_RAW} does not exist. Place PDFs there first.")
        sys.exit(1)

    subject_dirs = sorted(DATA_RAW.iterdir())
    if subject_filter:
        subject_dirs = [d for d in subject_dirs if d.name == subject_filter]
        if not subject_dirs:
            print(f"ERROR: No directory found for subject '{subject_filter}'")
            sys.exit(1)

    total = 0
    for subject_dir in subject_dirs:
        if not subject_dir.is_dir():
            continue
        subject = subject_dir.name
        pdfs = list(subject_dir.glob("*.pdf"))
        if not pdfs:
            continue

        output_dir = DATA_EXTRACTED / subject
        output_dir.mkdir(parents=True, exist_ok=True)
        print(f"\n📁 {subject.upper()} — {len(pdfs)} PDF(s)")

        for pdf in tqdm(pdfs, desc=f"  {subject}"):
            process_pdf(pdf, subject, output_dir)
            total += 1

    print(f"\n✅ Done. {total} PDFs processed.")
    print(f"   Output in: {DATA_EXTRACTED}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--subject", help="Process only this subject directory")
    args = parser.parse_args()
    main(args.subject)
