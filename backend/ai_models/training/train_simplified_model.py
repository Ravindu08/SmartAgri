"""Training script for Simplified Mode (v2) — Weather-Enhanced

Adds 3 weather-sourced numeric features to the original categorical-only model.
These values are auto-filled from the live weather API when the user selects a
district, so the farmer does not need to enter them manually.

Feature set
-----------
  Categorical (OHE): Soil_Type, Agro_Zone, Irrigation, Season [, District]
  Weather numeric  : Temperature, Rainfall, Humidity
  Engineered       : Rainfall_Temp_Ratio  (same as full model)

Dataset: merged_all_crops_clean.csv  (standardised — run standardize_dataset.py first)
"""
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import LabelEncoder
from pathlib import Path

DATASET_PATH = Path(__file__).parent.parent.parent / "datasets" / "merged_all_crops_clean.csv"
MODELS_DIR   = Path(__file__).parent / "models"

WEATHER_NUMERIC = ["Temperature", "Rainfall", "Humidity"]


def train_simplified_model():
    print("=" * 60)
    print("TRAINING SIMPLIFIED MODE MODEL v2 (Weather-Enhanced)")
    print("=" * 60)
    print(f"Loading: {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)
    print(f"Dataset: {df.shape[0]} rows  |  {df['Crop'].nunique()} crops")

    # ── Categorical features (OHE) ────────────────────────────────────────────
    base_cat = ["Soil_Type", "Agro_Zone", "Irrigation", "Season"]
    cat_features = base_cat + ["District"] if "District" in df.columns else base_cat
    print(f"Categorical features : {cat_features}")
    print(f"Weather numeric      : {WEATHER_NUMERIC}")

    # ── Build feature matrix ─────────────────────────────────────────────────
    X_cat = pd.get_dummies(df[cat_features], columns=cat_features)

    # Add weather numeric features directly
    X_weather = df[WEATHER_NUMERIC].copy().astype(np.float64)

    # Engineered: Rainfall / (Temperature + 1) — same ratio used in full model
    X_weather["Rainfall_Temp_Ratio"] = X_weather["Rainfall"] / (X_weather["Temperature"] + 1)

    X = pd.concat([X_cat, X_weather], axis=1)
    feature_columns = X.columns.tolist()
    print(f"Total features       : {len(feature_columns)}  "
          f"(OHE={len(X_cat.columns)}  numeric={len(X_weather.columns)})")

    # ── Target ────────────────────────────────────────────────────────────────
    le = LabelEncoder()
    y  = le.fit_transform(df["Crop"])

    X_train, X_test, y_train, y_test = train_test_split(
        X.to_numpy(dtype=np.float64), y,
        test_size=0.2, random_state=42, stratify=y,
    )

    # ── Train ─────────────────────────────────────────────────────────────────
    print("\nTraining Random Forest with GridSearchCV...")
    param_grid = {
        "n_estimators":      [150, 200, 250],
        "max_depth":         [15, 20, None],
        "min_samples_split": [2, 5],
        "min_samples_leaf":  [1, 2],
        "max_features":      ["sqrt", "log2"],
    }
    rf          = RandomForestClassifier(random_state=42, n_jobs=-1)
    grid_search = GridSearchCV(rf, param_grid, cv=5, n_jobs=-1,
                               scoring="accuracy", verbose=1)
    grid_search.fit(X_train, y_train)

    best_model = grid_search.best_estimator_
    print(f"\nBest parameters: {grid_search.best_params_}")

    y_pred   = best_model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nTest Accuracy: {accuracy:.4f}  ({accuracy*100:.1f}%)")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))

    # ── Training stats for runtime ±3σ outlier warnings ───────────────────────
    train_stats = {}
    for col in WEATHER_NUMERIC:
        vals = df[col].values
        train_stats[col] = (float(vals.mean()), float(vals.std()))

    # ── Save ─────────────────────────────────────────────────────────────────
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_model, MODELS_DIR / "crop_model_simple.pkl")
    joblib.dump(le,         MODELS_DIR / "label_encoder_simple.pkl")

    model_info = {
        "mode":                "simple_v2",
        "feature_columns":     feature_columns,
        "categorical_features":cat_features,
        "numeric_features":    WEATHER_NUMERIC + ["Rainfall_Temp_Ratio"],
        "target_column":       "Crop",
        "class_labels":        le.classes_.tolist(),
        "accuracy":            float(accuracy),
        "best_params":         grid_search.best_params_,
        "dataset_rows":        len(df),
        "uses_district":       "District" in cat_features,
        "train_stats":         train_stats,
        "weather_auto_fill":   WEATHER_NUMERIC,
    }
    joblib.dump(model_info, MODELS_DIR / "model_info_simple.pkl")

    print(f"\n{'='*60}")
    print(f"Saved: crop_model_simple.pkl | label_encoder_simple.pkl | model_info_simple.pkl")
    print(f"Weather-enhanced simple model v2 — accuracy {accuracy*100:.1f}%")
    print(f"{'='*60}\n")
    return model_info


if __name__ == "__main__":
    train_simplified_model()
