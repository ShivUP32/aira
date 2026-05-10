#!/usr/bin/env python3
"""
Stage 3: Generate solutions for questions that have no official marking scheme.
Uses OpenRouter (DeepSeek R1 free) — rate limited to ~3 req/min.

Usage:
    python 03_generate_solutions.py
    python 03_generate_solutions.py --subject mathematics --dry-run
"""

import json
import time
import argparse
import sys
from pathlib import Path
from tqdm import tqdm
from openai import OpenAI

sys.path.insert(0, str(Path(__file__).parent))
from config import DATA_PARSED, OPENROUTER_API_KEY

client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
    default_headers={
        "HTTP-Referer": "https://aira.app",
        "X-Title": "Aira Pipeline",
    },
)

SOLUTION_MODEL = "deepseek/deepseek-r1:free"
SOLUTION_PROMPT = """You are an expert CBSE Class 12 teacher. Provide a complete, step-by-step solution for the following exam question.

Your solution must:
1. Follow CBSE marking scheme conventions (show each step worth marks)
2. Include all necessary working
3. State the final answer clearly
4. For math: use LaTeX notation ($...$ for inline, $$...$$ for display)
5. Be concise but complete

Question ({marks} marks, {subject}, {section}, {type}):
{question}

Write the solution now:"""


def generate_solution(q: dict, dry_run: bool = False) -> str:
    if dry_run:
        return f"[DRY RUN SOLUTION for Q{q['q_no']}]"

    prompt = SOLUTION_PROMPT.format(
        marks=q["marks"],
        subject=q["subject"].title(),
        section=f"Section {q['section']}",
        type=q["type"].upper(),
        question=q["question"],
    )

    response = client.chat.completions.create(
        model=SOLUTION_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1500,
        temperature=0.3,
    )
    return response.choices[0].message.content or ""


def main(subject_filter: str | None = None, dry_run: bool = False) -> None:
    json_files = list(DATA_PARSED.glob("*.json"))
    if subject_filter:
        json_files = [f for f in json_files if f.stem.startswith(subject_filter)]

    total_generated = 0
    for json_path in json_files:
        subject = json_path.stem.replace("_2025", "")
        with open(json_path, encoding="utf-8") as f:
            questions = json.load(f)

        needs_solution = [q for q in questions if not q.get("solution")]
        if not needs_solution:
            print(f"✓ {subject}: all solutions present, skipping")
            continue

        print(f"\n📝 {subject.upper()}: {len(needs_solution)} solutions to generate")
        if dry_run:
            print("  [DRY RUN — not calling API]")

        for i, q in enumerate(tqdm(needs_solution, desc=f"  {subject}")):
            try:
                solution = generate_solution(q, dry_run)
                q["solution"] = solution
                q["solution_source"] = "llm-generated" if not dry_run else "dry-run"
                total_generated += 1
                # Rate limit: ~3 req/min
                if not dry_run and i < len(needs_solution) - 1:
                    time.sleep(20)
            except Exception as e:
                print(f"\n  ✗ Failed Q{q['q_no']}: {e}")
                if "429" in str(e):
                    print("  Rate limited — waiting 60s")
                    time.sleep(60)

        # Save back
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        print(f"  ✓ Saved {json_path.name}")

    print(f"\n✅ Generated {total_generated} solutions")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--subject")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    main(args.subject, args.dry_run)
