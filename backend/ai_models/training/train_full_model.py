"""Training script for Full Mode — Ensemble Model (v3)

Ensemble: RandomForest + XGBoost (equal soft voting)
  - RF  : low variance bagging, good at diverse feature types
  - XGB : sequential boosting, captures complex patterns RF misses

Dataset: merged_all_crops_clean.csv  (standardised — run standardize_dataset.py first)
"""

import joblib
import numpy as np
import pandas as pd
from xgboost import XGBClassifier
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import accuracy_score, classification_report, top_k_accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from pathlib import Path

DATASET_PATH = Path(__file__).parent.parent.parent / "datasets" / "merged_all_crops_clean.csv"
MODELS_DIR   = Path(__file__).parent / "models"

NUMERIC_FEATURES     = ["N", "P", "K", "Temperature", "Rainfall", "pH", "Humidity"]
CATEGORICAL_FEATURES = ["Soil_Type", "Agro_Zone", "Irrigation", "Season"]
ENGINEERED_FEATURES  = [
    "N_P_Ratio", "N_K_Ratio", "P_K_Ratio",
    "NPK_Sum", "Rainfall_Temp_Ratio", "pH_Squared",
]


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add engineered numeric features. Must match inference-time logic in app.py."""
    X = df[NUMERIC_FEATURES].copy()
    X["N_P_Ratio"]           = X["N"]        / (X["P"]           + 1)
    X["N_K_Ratio"]           = X["N"]        / (X["K"]           + 1)
    X["P_K_Ratio"]           = X["P"]        / (X["K"]           + 1)
    X["NPK_Sum"]             = X["N"]         + X["P"]           + X["K"]
    X["Rainfall_Temp_Ratio"] = X["Rainfall"] / (X["Temperature"] + 1)
    X["pH_Squared"]          = X["pH"]       ** 2
    return X


def _golden_section_search(f, a=0.1, b=5.0, tol=1e-6):
    """Minimize a unimodal scalar function on [a, b]. Pure-Python replacement for scipy.optimize.minimize_scalar."""
    phi = (1 + 5 ** 0.5) / 2
    resphi = 2 - phi
    x1 = a + resphi * (b - a)
    x2 = b - resphi * (b - a)
    f1, f2 = f(x1), f(x2)
    for _ in range(200):
        if abs(b - a) < tol:
            break
        if f1 < f2:
            b, x2, f2 = x2, x1, f1
            x1 = a + resphi * (b - a)
            f1 = f(x1)
        else:
            a, x1, f1 = x1, x2, f2
            x2 = b - resphi * (b - a)
            f2 = f(x2)
    return (a + b) / 2


def build_ensemble() -> VotingClassifier:
    """RF + XGBoost soft-voting ensemble."""
    rf = RandomForestClassifier(
        n_estimators=300, max_features="sqrt",
        min_samples_split=2, min_samples_leaf=1,
        random_state=42, n_jobs=-1,
    )
    xgb = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="mlogloss",
        tree_method="hist",
        random_state=42,
        n_jobs=-1,
        verbosity=0,
    )
    return VotingClassifier(
        estimators=[("rf", rf), ("xgb", xgb)],
        voting="soft", n_jobs=-1,
    )


def train_full_model():
    print("=" * 65)
    print("TRAINING FULL MODE ENSEMBLE MODEL")
    print("  Components: RandomForest + XGBoost")
    print("  Voting:     Soft (equal weights 1:1)")
    print("=" * 65)
    print(f"Loading: {DATASET_PATH}\n")

    df = pd.read_csv(DATASET_PATH)
    print(f"Dataset: {df.shape[0]} rows  |  {df['Crop'].nunique()} crops")

    # Build feature matrix
    X_num = engineer_features(df)
    X_cat = pd.get_dummies(df[CATEGORICAL_FEATURES], columns=CATEGORICAL_FEATURES)
    X     = pd.concat([X_num, X_cat], axis=1)
    feature_columns = X.columns.tolist()

    le = LabelEncoder()
    y  = le.fit_transform(df["Crop"])

    # Three-way split: train (70%) / calibration (15%) / test (15%)
    # Calibration must be separate from training to prevent temperature overfitting.
    X_temp, X_test, y_temp, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )
    X_train, X_cal, y_train, y_cal = train_test_split(
        X_temp, y_temp, test_size=0.15 / 0.85, random_state=42, stratify=y_temp
    )
    print(f"Train: {len(X_train)} rows  |  Cal: {len(X_cal)} rows  |  Test: {len(X_test)} rows\n")

    # Compute train stats before converting to numpy (pandas makes this easy)
    train_stats = {
        col: (float(X_train[col].mean()), float(X_train[col].std()))
        for col in NUMERIC_FEATURES
    }

    # Convert to numpy so models store no feature_names_in_
    # — allows pandas-free inference in the API
    X_train_arr = X_train.to_numpy(dtype=np.float64)
    X_cal_arr   = X_cal.to_numpy(dtype=np.float64)
    X_test_arr  = X_test.to_numpy(dtype=np.float64)

    ensemble = build_ensemble()
    print("Training ensemble (RF + XGBoost) — this takes 2-4 minutes...")
    ensemble.fit(X_train_arr, y_train)

    # Evaluate on held-out test set
    y_pred  = ensemble.predict(X_test_arr)
    y_proba = ensemble.predict_proba(X_test_arr)

    top1 = accuracy_score(y_test, y_pred)
    top3 = top_k_accuracy_score(y_test, y_proba, k=3)
    top5 = top_k_accuracy_score(y_test, y_proba, k=5)

    print(f"\nResults (held-out test set):")
    print(f"  Top-1 accuracy: {top1*100:.2f}%")
    print(f"  Top-3 accuracy: {top3*100:.2f}%")
    print(f"  Top-5 accuracy: {top5*100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    # Temperature scaling — calibrated on the held-out calibration set
    p_cal = ensemble.predict_proba(X_cal_arr)

    def nll(T):
        log_p = np.log(p_cal + 1e-12) / T
        log_p -= log_p.max(axis=1, keepdims=True)
        p_t = np.exp(log_p)
        p_t /= p_t.sum(axis=1, keepdims=True)
        return -np.mean(np.log(p_t[np.arange(len(y_cal)), y_cal] + 1e-12))

    calibration_temperature = _golden_section_search(nll)
    print(f"\nCalibration temperature: T={calibration_temperature:.4f}")
    print("  T<1: ensemble was underconfident -> sharpens predictions")
    print("  T>1: ensemble was overconfident  -> softens predictions")

    # Save artefacts
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(ensemble, MODELS_DIR / "crop_model_full.pkl")
    joblib.dump(le,       MODELS_DIR / "label_encoder_full.pkl")

    model_info = {
        "mode":                "full",
        "model_type":          "VotingClassifier(RF+XGBoost)",
        "feature_columns":     feature_columns,
        "numeric_features":    NUMERIC_FEATURES,
        "categorical_features":CATEGORICAL_FEATURES,
        "engineered_features": ENGINEERED_FEATURES,
        "categorical_values":  {
            col: df[col].unique().tolist()
            for col in CATEGORICAL_FEATURES if col in df.columns
        },
        "target_column":       "Crop",
        "class_labels":        le.classes_.tolist(),
        "accuracy":            float(top1),
        "top3_accuracy":       float(top3),
        "top5_accuracy":       float(top5),
        "dataset_rows":        len(df),
        "train_stats":         train_stats,
        "calibration_temperature": calibration_temperature,
        "ensemble_components": {
            "rf":  {"n_estimators": 300, "max_features": "sqrt"},
            "xgb": {"n_estimators": 300, "max_depth": 6, "learning_rate": 0.1},
        },
    }
    joblib.dump(model_info, MODELS_DIR / "model_info_full.pkl")

    print(f"\n{'='*65}")
    print(f"Saved: crop_model_full.pkl  |  label_encoder_full.pkl  |  model_info_full.pkl")
    print(f"{'='*65}\n")
    return model_info


if __name__ == "__main__":
    train_full_model()
