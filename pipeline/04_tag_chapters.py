#!/usr/bin/env python3
"""
Stage 4: Auto-tag chapter for each question using keyword matching.
Falls back to LLM for ambiguous questions.

Usage:
    python 04_tag_chapters.py
"""

import json
import re
import sys
from pathlib import Path
from typing import Dict, List
from tqdm import tqdm

sys.path.insert(0, str(Path(__file__).parent))
from config import DATA_PARSED

CHAPTER_KEYWORDS: Dict[str, List[str]] = {
    # Physics
    "Electric Charges and Fields": ["coulomb", "electric field", "gauss", "flux", "charge distribution", "dipole"],
    "Electrostatic Potential": ["potential", "capacitor", "capacitance", "equipotential", "dielectric"],
    "Current Electricity": ["resistance", "ohm", "kirchhoff", "drift velocity", "resistivity", "cell", "emf", "wheatstone"],
    "Moving Charges and Magnetism": ["magnetic force", "biot-savart", "ampere", "solenoid", "cyclotron", "lorentz"],
    "Electromagnetic Induction": ["faraday", "lenz", "induced emf", "flux", "eddy current", "mutual inductance"],
    "Alternating Current": ["rms", "ac circuit", "impedance", "resonance", "transformer", "reactance"],
    "Ray Optics": ["mirror", "lens", "refraction", "total internal reflection", "prism", "snell"],
    "Wave Optics": ["interference", "diffraction", "polarisation", "young", "fringe width"],
    "Dual Nature": ["photoelectric", "work function", "de broglie", "wavelength of electron"],
    "Atoms": ["bohr", "hydrogen spectrum", "energy level", "balmer", "lyman"],
    "Nuclei": ["nuclear", "radioactive", "half life", "binding energy", "fission", "fusion"],
    # Chemistry
    "Solutions": ["molality", "molarity", "vapour pressure", "osmosis", "raoult"],
    "Electrochemistry": ["electrode", "galvanic", "electrolysis", "nernst", "conductance", "kohlrausch"],
    "Chemical Kinetics": ["rate of reaction", "order", "activation energy", "arrhenius", "half life"],
    "Coordination Compounds": ["ligand", "complex", "cfse", "isomerism", "coordination number"],
    "Haloalkanes and Haloarenes": ["sn1", "sn2", "nucleophilic", "halide", "grignard"],
    "Alcohols, Phenols and Ethers": ["alcohol", "phenol", "ether", "oxidation", "dehydration"],
    # Mathematics
    "Continuity and Differentiability": ["continuous", "differentiable", "rolle", "mean value", "logarithmic differentiation"],
    "Application of Derivatives": ["maxima", "minima", "tangent", "normal", "rate of change", "increasing"],
    "Integrals": ["integral", "integration", "definite", "indefinite", "by parts", "substitution"],
    "Differential Equations": ["differential equation", "homogeneous", "linear de", "variable separable"],
    "Vector Algebra": ["vector", "dot product", "cross product", "unit vector", "coplanar"],
    "Three Dimensional Geometry": ["direction cosines", "plane", "line in 3d", "skew lines"],
    "Probability": ["bayes", "conditional probability", "random variable", "binomial distribution"],
}


def tag_chapter(question_text: str, subject: str) -> str:
    text_lower = question_text.lower()
    best_match = ""
    best_score = 0

    for chapter, keywords in CHAPTER_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > best_score:
            best_score = score
            best_match = chapter

    return best_match if best_score > 0 else "General"


def main() -> None:
    json_files = list(DATA_PARSED.glob("*.json"))
    total_tagged = 0

    for json_path in json_files:
        subject = json_path.stem.replace("_2025", "")
        with open(json_path, encoding="utf-8") as f:
            questions = json.load(f)

        untagged = [q for q in questions if not q.get("chapter")]
        if not untagged:
            print(f"✓ {subject}: all questions already tagged")
            continue

        print(f"\n🏷  {subject.upper()}: tagging {len(untagged)} questions")

        for q in tqdm(untagged, desc=f"  {subject}"):
            q["chapter"] = tag_chapter(q["question"], subject)
            total_tagged += 1

        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)

        from collections import Counter
        dist = Counter(q["chapter"] for q in questions)
        print(f"  Chapter distribution:")
        for ch, cnt in sorted(dist.items(), key=lambda x: -x[1])[:10]:
            print(f"    {ch}: {cnt}")

    print(f"\n✅ Tagged {total_tagged} questions")


if __name__ == "__main__":
    main()
