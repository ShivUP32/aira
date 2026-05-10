#!/usr/bin/env python3
"""
Stage 6: Upload embedded chunks to Supabase.
Idempotent — deduplicates on (subject, year, set, q_no, language, or_variant).

Usage:
    python 06_upload.py
    python 06_upload.py --dry-run  # counts without uploading
"""

import json
import sys
import argparse
from pathlib import Path
from tqdm import tqdm
from supabase import create_client

sys.path.insert(0, str(Path(__file__).parent))
from config import DATA_EMBEDDED, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

BATCH_SIZE = 50


def make_dedup_key(meta: dict) -> str:
    return f"{meta.get('subject')}|{meta.get('year')}|{meta.get('set')}|{meta.get('q_no')}|{meta.get('language', 'en')}"


def main(dry_run: bool = False) -> None:
    chunks_file = DATA_EMBEDDED / "all_chunks.jsonl"
    if not chunks_file.exists():
        print(f"ERROR: {chunks_file} not found. Run 05_embed.py first.")
        sys.exit(1)

    with open(chunks_file, encoding="utf-8") as f:
        chunks = [json.loads(line) for line in f if line.strip()]

    print(f"Loaded {len(chunks)} chunks from {chunks_file.name}")

    if dry_run:
        from collections import Counter
        subj_counts = Counter(c["metadata"].get("subject") for c in chunks)
        print("\n[DRY RUN] Would upload:")
        for subj, cnt in sorted(subj_counts.items()):
            print(f"  {subj}: {cnt} chunks")
        print(f"\nTotal: {len(chunks)} chunks")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # Fetch existing dedup keys
    print("Fetching existing documents for deduplication…")
    existing = set()
    page = 0
    while True:
        result = supabase.table("documents").select("metadata").range(page * 1000, (page + 1) * 1000 - 1).execute()
        if not result.data:
            break
        for row in result.data:
            existing.add(make_dedup_key(row["metadata"]))
        if len(result.data) < 1000:
            break
        page += 1

    print(f"  {len(existing)} existing documents")

    new_chunks = [c for c in chunks if make_dedup_key(c["metadata"]) not in existing]
    print(f"  {len(new_chunks)} new chunks to upload (skipping {len(chunks) - len(new_chunks)} duplicates)")

    if not new_chunks:
        print("✅ Nothing new to upload!")
        return

    # Batch insert
    uploaded = 0
    failed = 0
    batches = [new_chunks[i:i + BATCH_SIZE] for i in range(0, len(new_chunks), BATCH_SIZE)]

    for batch in tqdm(batches, desc="Uploading"):
        rows = [
            {
                "content": c["content"],
                "metadata": c["metadata"],
                "embedding": c["embedding"],
            }
            for c in batch
        ]
        try:
            supabase.table("documents").insert(rows).execute()
            uploaded += len(rows)
        except Exception as e:
            print(f"\n  ✗ Batch failed: {e}")
            failed += len(rows)

    print(f"\n✅ Upload complete: {uploaded} inserted, {failed} failed")

    # Verify count
    result = supabase.table("documents").select("*", count="exact", head=True).execute()
    print(f"   Total documents in DB: {result.count}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    main(args.dry_run)
