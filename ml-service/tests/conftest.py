import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.main import create_app  # noqa: E402

PSORIASIS_LIKE = {"age": 34, "redness": "moderate", "scaling": "severe", "clear_edges": "severe", "itching": "mild",
                  "knees_elbows": "severe", "scalp": "moderate", "family_history": "yes", "new_patches_after_injury": "mild"}


@pytest.fixture(scope="session")
def client():
    return TestClient(create_app())
