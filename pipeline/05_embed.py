#!/usr/bin/env python3
"""
Stage 5: Generate embeddings for all Q&A pairs.
Uses paraphrase-multilingual-MiniLM-L12-v2 (384-dim, supports Hindi+English).

Usage:
    python 05_embed.py
"""

import json
import sys
from pathlib import Path
from tqdm import tqdm
from sentence_transformers import SentenceTransformer

sys.path.insert(0, str(Path(__file__).parent))
from config import DATA_PARSED, DATA_EMBEDDED, EMBEDDING_MODEL

DATA_EMBEDDED.mkdir(parents=True, exist_ok=True)


def make_chunk_content(q: dict) -> str:
    """Format Q&A pair for embedding."""
    parts = [f"Question: {q['question']}"]
    if q.get("solution"):
        parts.append(f"\nSolution: {q['solution']}")
    if q.get("chapter"):
        parts.append(f"\n[Chapter: {q['chapter']}]")
    return "\n".join(parts)


def main() -> None:
    print(f"Loading embedding model: {EMBEDDING_MODEL}")
    model = SentenceTransformer(EMBEDDING_MODEL)
    print(f"  ✓ Model loaded (dim={model.get_sentence_embedding_dimension()})")

    json_files = list(DATA_PARSED.glob("*.json"))
    if not json_files:
        print(f"ERROR: No JSON files in {DATA_PARSED}. Run 02_parse_qa.py first.")
        sys.exit(1)

    all_chunks = []
    for json_path in json_files:
        subject = json_path.stem.replace("_2025", "")
        with open(json_path, encoding="utf-8") as f:
            questions = json.load(f)

        no_solution = sum(1 for q in questions if not q.get("solution"))
        if no_solution:
            print(f"⚠ {subject}: {no_solution} questions without solutions — run 03_generate_solutions.py first")

        print(f"\n📐 {subject.upper()}: {len(questions)} chunks")
        texts = [make_chunk_content(q) for q in questions]
        embeddings = model.encode(texts, batch_size=32, show_progress_bar=True)

        for i, (q, emb) in enumerate(zip(questions, embeddings)):
            chunk = {
                "content": make_chunk_content(q),
                "metadata": {
                    "subject": q["subject"],
                    "year": q["year"],
                    "set": q["set"],
                    "set_label": q.get("set", "Set-1"),
                    "section": q.get("section", ""),
                    "q_no": q["q_no"],
                    "marks": q["marks"],
                    "type": q["type"],
                    "chapter": q.get("chapter", ""),
                    "language": q.get("language", "en"),
                    "or_group": q.get("or_group"),
                    "has_diagram": q.get("has_diagram", False),
                    "solution_source": q.get("solution_source", "unknown"),
                },
                "embedding": emb.tolist(),
            }
            all_chunks.append(chunk)

    output_path = DATA_EMBEDDED / "all_chunks.jsonl"
    with open(output_path, "w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    print(f"\n✅ {len(all_chunks)} chunks embedded → {output_path}")
    print(f"   File size: {output_path.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
