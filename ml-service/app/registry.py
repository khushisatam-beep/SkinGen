"""Loads the trained model + metadata; verifies hash and feature order. Failures are recorded, not fatal."""
import hashlib, json
from pathlib import Path

import joblib

from app.questionnaire import FEATURE_COLUMNS


class ModelRegistry:
    def __init__(self, model_dir: Path):
        self.dir = Path(model_dir)
        self.metadata = self.comparison = self.model = None
        self.error = None
        self._load()

    def _load(self):
        try:
            self.metadata = json.loads((self.dir / "metadata.json").read_text())
            try:
                self.comparison = json.loads((self.dir / "comparison_report.json").read_text())
            except Exception:
                self.comparison = None
            path = self.dir / self.metadata["artifact"]
            if hashlib.sha256(path.read_bytes()).hexdigest() != self.metadata["artifact_sha256"]:
                raise ValueError("model file does not match the SHA-256 in metadata.json")
            if self.metadata["features"] != FEATURE_COLUMNS:
                raise ValueError("metadata features differ from the questionnaire")
            model = joblib.load(path)
            if list(model.feature_names_in_) != FEATURE_COLUMNS:
                raise ValueError("model feature order differs from the questionnaire")
            self.model = model
        except Exception as e:
            self.error = f"{type(e).__name__}: {e}"

    @property
    def healthy(self):
        return self.model is not None
