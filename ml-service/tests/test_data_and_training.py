import hashlib
import pandas as pd
from data.download_data import DEST, SHA256, UCI_CLASS_COUNTS, verify
from training.train_and_compare import run


def test_raw_dataset_is_the_verified_real_file():
    verify(DEST)                                         # raises if sha256 / UCI statistics differ
    assert hashlib.sha256(DEST.read_bytes()).hexdigest() == SHA256
    df = pd.read_csv(DEST, na_values=["?"])
    assert df.shape == (366, 35) and df["class"].value_counts().sort_index().to_dict() == UCI_CLASS_COUNTS


def test_training_is_reproducible(tmp_path):
    m1, r1 = run(tmp_path / "a", seed=7)
    m2, r2 = run(tmp_path / "b", seed=7)
    assert m1["chosen_model"] == m2["chosen_model"]
    for n in r1["candidates"]:
        assert r1["candidates"][n]["test_holdout"]["accuracy"] == r2["candidates"][n]["test_holdout"]["accuracy"]
    t = r1["candidates"][m1["chosen_model"]]["test_holdout"]
    assert {"accuracy", "balanced_accuracy", "macro_f1", "roc_auc_ovr_macro", "log_loss", "brier_multiclass",
            "confusion_matrix", "confidence_ece", "per_class"} <= set(t)


def test_no_test_leakage_in_split():
    import json
    from pathlib import Path
    md = json.loads((Path(__file__).resolve().parents[1] / "models" / "metadata.json").read_text())
    assert md["split"]["train_rows"] + md["split"]["test_rows"] == 366 and md["split"]["stratified"] is True
