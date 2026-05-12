"""Shared config for the pipeline scripts."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from repo root
ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")

DATA_RAW = ROOT / "data" / "raw"
DATA_EXTRACTED = ROOT / "data" / "extracted"
DATA_LANGUAGE_SPLIT = ROOT / "data" / "language_split"
DATA_PARSED = ROOT / "data" / "parsed"
DATA_EMBEDDED = ROOT / "data" / "embedded"

EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"
EMBEDDING_DIM = 384

SUBJECTS_USING_MARKER = {"physics", "chemistry", "mathematics"}
SUBJECTS_USING_PYMUPDF = {"computer-science", "cs", "english"}

SUBJECT_MAP = {
    "physics": "physics",
    "chemistry": "chemistry",
    "mathematics": "mathematics",
    "math": "mathematics",
    "computer-science": "computer-science",
    "computer_science": "computer-science",
    "computer science": "computer-science",
    "cs": "computer-science",
    "english": "english",
    "english-core": "english",
    "english_core": "english",
}

MARKS_BY_SECTION = {"A": 1, "B": 2, "C": 3, "D": 5, "E": 4}
