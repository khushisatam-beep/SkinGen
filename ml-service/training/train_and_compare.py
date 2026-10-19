"""
Reproducible model comparison on the REAL UCI Dermatology data (clinical, biopsy-free features only).

Run from ml-service/:   python data/download_data.py && python -m training.train_and_compare

Protocol
  1. 80/20 stratified split (seed 42). The 20% test set is NOT used for choosing a model.
  2. On the 80% training part: repeated stratified 5-fold CV (3 repeats) for every candidate.
  3. The candidate with the lowest mean CV log loss is selected (explicit rule, fixed before looking at test).
  4. All candidates are also scored once on the untouched test set (reported, not used for selection).
  5. The selected model is evaluated for robustness when answers are hidden ("not sure").
  6. The selected model is finally re-fitted on ALL 366 patients and saved (more data matters at n=366).
Preprocessing is inside each sklearn Pipeline (median imputer fitted per training fold => no leakage).
"""
import argparse, hashlib, json, platform
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn, xgboost
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import RepeatedStratifiedKFold, StratifiedKFold, cross_validate, cross_val_predict, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from app.conditions import CLASS_MAP, CLASS_ORDER, DATASET_LABEL
from app.questionnaire import FEATURE_COLUMNS
from data.download_data import DEST, SHA256, URL, verify
from training.metrics import evaluate

VERSION = "3.0.0"
ROOT = Path(__file__).resolve().parents[1]


def load():
    verify(DEST)
    raw = pd.read_csv(DEST, na_values=["?"])
    y = raw["class"].map(CLASS_MAP).map({c: i for i, c in enumerate(CLASS_ORDER)}).to_numpy()
    return raw, raw[FEATURE_COLUMNS].astype(float), y


def candidates(seed):
    imp = lambda: SimpleImputer(strategy="median")
    return {
        "MajorityBaseline": Pipeline([("imp", imp()), ("clf", DummyClassifier(strategy="prior"))]),
        "LogisticRegression": Pipeline([("imp", imp()), ("scale", StandardScaler()),
                                        ("clf", LogisticRegression(C=1.0, max_iter=5000))]),
        "RandomForest": Pipeline([("imp", imp()), ("clf", RandomForestClassifier(
            n_estimators=300, min_samples_leaf=2, random_state=seed, n_jobs=1))]),
        "XGBoost": Pipeline([("imp", imp()), ("clf", XGBClassifier(
            objective="multi:softprob", max_depth=3, n_estimators=200, learning_rate=0.05, subsample=0.9,
            colsample_bytree=0.9, min_child_weight=2, tree_method="hist", n_jobs=1, random_state=seed,
            eval_metric="mlogloss"))]),
    }


def params_of(pipe):
    out = {}
    for k, v in pipe.steps[-1][1].get_params().items():
        out[k] = v if isinstance(v, (int, float, str, bool, type(None))) and v == v else str(v)
    return out


def robustness(model, X_te, y_te, seed, fractions=(0.0, 0.25, 0.5, 0.75), repeats=30):
    """Hide a random fraction of answers (-> NaN, like 'not sure') and re-score the test set."""
    rng, rows = np.random.default_rng(seed), []
    for frac in fractions:
        accs, lls = [], []
        for _ in range(repeats if frac > 0 else 1):
            Xm = X_te.copy()
            mask = rng.random(Xm.shape) < frac
            Xm = Xm.mask(mask)
            m = evaluate(y_te, model.predict_proba(Xm), CLASS_ORDER)
            accs.append(m["accuracy"]); lls.append(m["log_loss"])
        rows.append({"fraction_of_answers_hidden": frac, "mean_accuracy": float(np.mean(accs)),
                     "mean_log_loss": float(np.mean(lls))})
    return rows


def run(out: Path, seed=42):
    out.mkdir(parents=True, exist_ok=True)
    raw, X, y = load()
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, stratify=y, random_state=seed)
    cv = RepeatedStratifiedKFold(n_splits=5, n_repeats=3, random_state=seed)
    scoring = {"accuracy": "accuracy", "balanced_accuracy": "balanced_accuracy", "macro_f1": "f1_macro",
               "roc_auc_ovr_macro": "roc_auc_ovr", "neg_log_loss": "neg_log_loss"}
    results = {}
    for name, pipe in candidates(seed).items():
        cvr = cross_validate(pipe, X_tr, y_tr, cv=cv, scoring=scoring, n_jobs=1)
        cv_summary = {k.replace("test_", ""): {"mean": float(np.mean(v)), "sd": float(np.std(v))}
                      for k, v in cvr.items() if k.startswith("test_")}
        cv_summary["log_loss"] = {"mean": -cv_summary["neg_log_loss"]["mean"], "sd": cv_summary["neg_log_loss"]["sd"]}
        del cv_summary["neg_log_loss"]
        oof = cross_val_predict(pipe, X_tr, y_tr, cv=StratifiedKFold(5, shuffle=True, random_state=seed), method="predict_proba")
        fitted = pipe.fit(X_tr, y_tr)
        results[name] = {"params": params_of(pipe), "cv_on_training_split": cv_summary,
                         "cv_out_of_fold_calibration": evaluate(y_tr, oof, CLASS_ORDER)["confidence_calibration_table"],
                         "cv_out_of_fold_ece": evaluate(y_tr, oof, CLASS_ORDER)["confidence_ece"],
                         "test_holdout": evaluate(y_te, fitted.predict_proba(X_te), CLASS_ORDER)}
    eligible = [n for n in results if n != "MajorityBaseline"]
    chosen = min(eligible, key=lambda n: results[n]["cv_on_training_split"]["log_loss"]["mean"])
    robust = robustness(candidates(seed)[chosen].fit(X_tr, y_tr), X_te, y_te, seed)

    final = candidates(seed)[chosen].fit(X, y)             # refit on all 366 real patients
    artifact = out / "model.joblib"
    joblib.dump(final, artifact)

    fh = raw.assign(group=raw["class"].map(CLASS_MAP)).groupby("group")["family_history"].agg(["sum", "count"])
    fam = {g: {"with_family_history": int(r["sum"]), "patients": int(r["count"]),
               "percent": round(100 * r["sum"] / r["count"], 1)} for g, r in fh.iterrows()}

    medians = X.median().to_dict()
    metadata = {
        "schema_version": 1, "model_version": VERSION, "created_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "chosen_model": chosen, "selection_rule": "lowest mean repeated-CV log loss on the 80% training split (MajorityBaseline excluded)",
        "artifact": artifact.name, "artifact_sha256": hashlib.sha256(artifact.read_bytes()).hexdigest(),
        "classes": CLASS_ORDER, "class_definitions": {g: DATASET_LABEL[g] for g in CLASS_ORDER},
        "features": FEATURE_COLUMNS, "training_medians_used_for_missing_answers": medians,
        "dataset": {"name": "UCI Dermatology (erythemato-squamous diseases)", "doi": "10.24432/C5FK5P",
                    "authors": "Nilsel Ilter, H. Altay Guvenir (1998)", "download_url": URL, "sha256": SHA256,
                    "real_data": True, "rows": int(len(raw)), "dataset_classes": raw["class"].value_counts().sort_index().to_dict(),
                    "grouped_class_counts": {CLASS_ORDER[i]: int((y == i).sum()) for i in range(len(CLASS_ORDER))},
                    "missing_values": {"Age": int(raw["Age"].isna().sum())},
                    "features_not_used": "the 22 histopathology (biopsy) columns - a person cannot supply them"},
        "split": {"test_fraction": 0.2, "stratified": True, "seed": seed, "train_rows": int(len(X_tr)), "test_rows": int(len(X_te))},
        "final_model_fitted_on": "all 366 patients (metrics below come from the models before this final refit)",
        "selected_model_params": results[chosen]["params"],
        "selected_model_test_holdout": results[chosen]["test_holdout"],
        "selected_model_cv": results[chosen]["cv_on_training_split"],
        "robustness_to_not_sure_answers": robust,
        "family_history_in_dataset": fam,
        "library_versions": {"python": platform.python_version(), "scikit-learn": sklearn.__version__,
                             "xgboost": xgboost.__version__, "numpy": np.__version__, "pandas": pd.__version__},
    }
    report = {"model_version": VERSION, "seed": seed, "data": metadata["dataset"], "split": metadata["split"],
              "selection_rule": metadata["selection_rule"], "chosen_model": chosen, "candidates": results,
              "robustness_of_chosen_model": robust,
              "caveats": ["n=366 patients from a single source (UCI donation, 1998); the test set has only 74 patients, so metrics are noisy.",
                          "Labels are clinic diagnoses with biopsy support; the app only uses biopsy-free answers.",
                          "Questionnaire answers by laypeople are NOT the same as clinician-scored features: no validation exists."]}
    (out / "metadata.json").write_text(json.dumps(metadata, indent=2))
    (out / "comparison_report.json").write_text(json.dumps(report, indent=2))
    return metadata, report


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, default=ROOT / "models")
    ap.add_argument("--seed", type=int, default=42)
    a = ap.parse_args()
    md, rp = run(a.out, a.seed)
    for n, r in rp["candidates"].items():
        cv, t = r["cv_on_training_split"], r["test_holdout"]
        print(f"{n:20s} CV logloss={cv['log_loss']['mean']:.3f} acc={cv['accuracy']['mean']:.3f} | test acc={t['accuracy']:.3f} "
              f"macroF1={t['macro_f1']:.3f} AUC={t['roc_auc_ovr_macro']:.3f} logloss={t['log_loss']:.3f} ECE={t['confidence_ece']:.3f}")
    print("chosen:", md["chosen_model"]); print("robustness:", rp["robustness_of_chosen_model"])
