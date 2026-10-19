"""Multi-class evaluation helpers."""
import numpy as np
from sklearn.metrics import (accuracy_score, balanced_accuracy_score, confusion_matrix, f1_score, log_loss,
                             precision_recall_fscore_support, roc_auc_score)


def _renorm(p):
    p = np.clip(p, 1e-6, 1.0)
    return p / p.sum(axis=1, keepdims=True)


def multiclass_brier(y, proba, n_classes):
    onehot = np.eye(n_classes)[y]
    return float(np.mean(np.sum((proba - onehot) ** 2, axis=1)))


def confidence_ece(y, proba, bins=5):
    """Expected calibration error of the top-class confidence (equal-count bins)."""
    conf, pred = proba.max(axis=1), proba.argmax(axis=1)
    hit = (pred == y).astype(float)
    order = np.argsort(conf)
    ece, rows = 0.0, []
    for idx in np.array_split(order, bins):
        if len(idx) == 0: continue
        rows.append({"n": int(len(idx)), "mean_confidence": float(conf[idx].mean()), "accuracy": float(hit[idx].mean())})
        ece += len(idx) / len(y) * abs(conf[idx].mean() - hit[idx].mean())
    return float(ece), rows


def evaluate(y, proba, class_names):
    k = len(class_names)
    pred = proba.argmax(axis=1)
    p, r, f, s = precision_recall_fscore_support(y, pred, labels=range(k), zero_division=0)
    ece, table = confidence_ece(y, proba)
    return {
        "n": int(len(y)),
        "accuracy": float(accuracy_score(y, pred)),
        "balanced_accuracy": float(balanced_accuracy_score(y, pred)),
        "macro_f1": float(f1_score(y, pred, average="macro", zero_division=0)),
        "roc_auc_ovr_macro": float(roc_auc_score(y, proba, multi_class="ovr", average="macro", labels=list(range(k)))),
        "log_loss": float(log_loss(y, _renorm(proba), labels=list(range(k)))),
        "brier_multiclass": multiclass_brier(y, proba, k),
        "per_class": {c: {"precision": float(p[i]), "recall": float(r[i]), "f1": float(f[i]), "support": int(s[i])}
                      for i, c in enumerate(class_names)},
        "confusion_matrix": {"labels": class_names, "rows_true_cols_pred": confusion_matrix(y, pred, labels=range(k)).tolist()},
        "confidence_ece": ece, "confidence_calibration_table": table,
    }
