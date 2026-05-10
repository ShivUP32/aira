"""Shared config for the pipeline scripts."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from repo root
ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env.local")

SUPABASE_URL = os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
OPENROUTER_API_KEY = os.environ["OPENROUTER_API_KEY"]
HF_API_TOKEN = os.getenv("HF_API_TOKEN", "")

DATA_RAW = ROOT / "data" / "raw"
DATA_EXTRACTED = ROOT / "data" / "extracted"
DATA_PARSED = ROOT / "data" / "parsed"
DATA_EMBEDDED = ROOT / "data" / "embedded"

EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"
EMBEDDING_DIM = 384

SUBJECTS_USING_MARKER = {"physics", "chemistry", "mathematics"}
SUBJECTS_USING_PYMUPDF = {"cs", "english"}

SUBJECT_MAP = {
    "physics": "physics",
    "chemistry": "chemistry",
    "mathematics": "mathematics",
    "math": "mathematics",
    "computer-science": "cs",
    "cs": "cs",
    "english": "english",
}

MARKS_BY_SECTION = {"A": 1, "B": 2, "C": 3, "D": 5, "E": 4}
