import os
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = Path(os.getenv("SKINGEN_MODEL_DIR", BASE_DIR / "models"))
MIN_ANSWERS = 4   # design choice (not derived from data): refuse to score when almost nothing was answered
