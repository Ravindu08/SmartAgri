"""Evaluation for the crop recommendation model (report Section 4.3.2).

Rebuilds the exact 70/15/15 stratified split used by train_full_model.py, then:
  1. trains Random Forest, XGBoost and the RF + XGBoost soft-voting ensemble separately
     and reports held-out test metrics (Top-1, Top-3, macro precision / recall / F1),
  2. runs 5-fold stratified cross-validation on the combined train + calibration data,
  3. saves the normalised confusion matrix, one-vs-rest ROC curve and feature
     importance figures, plus the full per-class classification report.

It only reads the dataset and never overwrites the production model files.

Run from backend/ai_models/training:   python evaluate_model.py
Outputs are written to:                evaluation/
"""

import json
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import (accuracy_score, auc, classification_report, confusion_matrix,
                             precision_recall_fscore_support, roc_curve, top_k_accuracy_score)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.preprocessing import LabelEncoder, label_binarize

from train_full_model import (CATEGORICAL_FEATURES, DATASET_PATH, build_ensemble,
                              engineer_features)

OUT_DIR = Path(__file__).parent / "evaluation"
SEED = 42


def load_data():
    df = pd.read_csv(DATASET_PATH)
    X_num = engineer_features(df)
    X_cat = pd.get_dummies(df[CATEGORICAL_FEATURES], columns=CATEGORICAL_FEATURES)
    X = pd.concat([X_num, X_cat], axis=1)
    le = LabelEncoder()
    y = le.fit_transform(df["Crop"])
    return X, y, le


def split(X, y):
    # Identical to train_full_model.py so the test set is the same 3,075 records.
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=0.15, random_state=SEED, stratify=y)
    X_train, X_cal, y_train, y_cal = train_test_split(
        X_temp, y_temp, test_size=0.15 / 0.85, random_state=SEED, stratify=y_temp)
    return X_train, X_cal, X_test, y_train, y_cal, y_test


def models():
    ens = build_ensemble()
    rf = ens.named_estimators["rf"]
    xgb = ens.named_estimators["xgb"]
    from sklearn.base import clone
    return {
        "Random Forest": clone(rf),
        "XGBoost": clone(xgb),
        "RF + XGBoost (ensemble)": ens,
    }


def test_metrics(model, X_test, y_test):
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)
    p, r, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="macro", zero_division=0)
    return {
        "top1_accuracy": accuracy_score(y_test, y_pred),
        "top3_accuracy": top_k_accuracy_score(y_test, y_proba, k=3),
        "precision_macro": p,
        "recall_macro": r,
        "f1_macro": f1,
    }, y_pred, y_proba


def plot_confusion(y_test, y_pred, labels, path):
    cm = confusion_matrix(y_test, y_pred, normalize="true")
    fig, ax = plt.subplots(figsize=(14, 12))
    im = ax.imshow(cm, cmap="Greens", vmin=0, vmax=1)
    ax.set_xticks(range(len(labels)), labels, rotation=90, fontsize=7)
    ax.set_yticks(range(len(labels)), labels, fontsize=7)
    ax.set_xlabel("Predicted crop")
    ax.set_ylabel("Actual crop")
    ax.set_title("Confusion Matrix (normalised) — RF + XGBoost ensemble — held-out test set (n=3,075)")
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04, label="Proportion of actual class")
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)
    # biggest off-diagonal confusions, for the written analysis
    off = cm.copy()
    np.fill_diagonal(off, 0)
    idx = np.dstack(np.unravel_index(np.argsort(off.ravel())[::-1], off.shape))[0][:8]
    return [{"actual": labels[i], "predicted": labels[j], "share": float(off[i, j])} for i, j in idx]


def plot_roc(y_test, y_proba, n_classes, path):
    y_bin = label_binarize(y_test, classes=range(n_classes))
    grid = np.linspace(0, 1, 1000)
    tprs, aucs = [], []
    fig, ax = plt.subplots(figsize=(7, 7))
    for c in range(n_classes):
        fpr, tpr, _ = roc_curve(y_bin[:, c], y_proba[:, c])
        aucs.append(auc(fpr, tpr))
        ax.plot(fpr, tpr, color="#8BC34A", alpha=0.15, linewidth=0.8)
        tprs.append(np.interp(grid, fpr, tpr))
    mean_tpr = np.mean(tprs, axis=0)
    macro_auc = float(np.mean(aucs))
    ax.plot(grid, mean_tpr, color="#1B5E20", linewidth=2.2, label=f"Macro-average ROC (AUC = {macro_auc:.3f})")
    ax.plot([0, 1], [0, 1], "k--", linewidth=1, label="Random guess")
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title(f"ROC Curve — RF + XGBoost (ensemble) (one-vs-rest, all {n_classes} crop classes)")
    ax.legend(loc="lower right")
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)
    return macro_auc


def plot_importance(ensemble, feature_names, path, top_n=10):
    rf = ensemble.named_estimators_["rf"]
    xgb = ensemble.named_estimators_["xgb"]
    rf_imp = pd.Series(rf.feature_importances_, index=feature_names)
    xgb_imp = pd.Series(xgb.feature_importances_, index=feature_names)
    union = list(dict.fromkeys(list(rf_imp.nlargest(top_n).index) + list(xgb_imp.nlargest(top_n).index)))
    union.sort(key=lambda f: max(rf_imp[f], xgb_imp[f]))
    y = np.arange(len(union))
    fig, ax = plt.subplots(figsize=(9, 0.42 * len(union) + 1.5))
    ax.barh(y + 0.2, [rf_imp[f] for f in union], height=0.4, color="#2E7D32", label="Random Forest")
    ax.barh(y - 0.2, [xgb_imp[f] for f in union], height=0.4, color="#8D6E63", label="XGBoost")
    ax.set_yticks(y, union, fontsize=8)
    ax.set_xlabel("Feature importance (Gini / gain-based)")
    ax.set_title(f"Top Feature Importances — Random Forest vs XGBoost\n(union of each model's own top-{top_n} features)")
    ax.legend(loc="lower right")
    fig.tight_layout()
    fig.savefig(path, dpi=150)
    plt.close(fig)
    return {"random_forest_top": rf_imp.nlargest(top_n).round(4).to_dict(),
            "xgboost_top": xgb_imp.nlargest(top_n).round(4).to_dict()}


def main():
    OUT_DIR.mkdir(exist_ok=True)
    X, y, le = load_data()
    labels = le.classes_.tolist()
    feature_names = X.columns.tolist()
    X_train, X_cal, X_test, y_train, y_cal, y_test = split(X, y)
    to_np = lambda d: d.to_numpy(dtype=np.float64)
    print(f"Train {len(X_train)} | Calibration {len(X_cal)} | Test {len(X_test)}")

    results = {"split": {"train": len(X_train), "calibration": len(X_cal), "test": len(X_test)}}

    # 1. held-out test set comparison
    test_rows, ensemble_pred, ensemble_proba, ensemble = {}, None, None, None
    for name, model in models().items():
        print(f"Training {name} ...")
        model.fit(to_np(X_train), y_train)
        m, y_pred, y_proba = test_metrics(model, to_np(X_test), y_test)
        test_rows[name] = m
        print("  " + "  ".join(f"{k}={v * 100:.2f}%" for k, v in m.items()))
        if isinstance(model, VotingClassifier):
            ensemble, ensemble_pred, ensemble_proba = model, y_pred, y_proba
    results["held_out_test"] = test_rows

    # 2. 5-fold stratified cross-validation on train + calibration data
    X_cv = to_np(pd.concat([X_train, X_cal]))
    y_cv = np.concatenate([y_train, y_cal])
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    cv_rows = {}
    for name, model in models().items():
        print(f"5-fold CV: {name} ...")
        scores = cross_val_score(model, X_cv, y_cv, cv=skf, scoring="accuracy")
        cv_rows[name] = {"mean": float(scores.mean()), "std": float(scores.std()), "folds": scores.tolist()}
        print(f"  {scores.mean() * 100:.2f}% ± {scores.std() * 100:.2f}%")
    results["cross_validation_5fold"] = {"records": len(y_cv), **cv_rows}

    # 3. figures and per-class report for the ensemble
    results["top_confusions"] = plot_confusion(y_test, ensemble_pred, labels, OUT_DIR / "confusion_matrix.png")
    results["roc_macro_auc"] = plot_roc(y_test, ensemble_proba, len(labels), OUT_DIR / "roc_curve.png")
    results["feature_importance"] = plot_importance(ensemble, feature_names, OUT_DIR / "feature_importance.png")
    report = classification_report(y_test, ensemble_pred, target_names=labels, digits=4)
    (OUT_DIR / "classification_report.txt").write_text(report, encoding="utf-8")

    (OUT_DIR / "evaluation_results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    print(f"\nROC macro AUC: {results['roc_macro_auc']:.4f}")
    print(f"Saved results and figures to {OUT_DIR}")


if __name__ == "__main__":
    main()
