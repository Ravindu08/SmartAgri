"""Derive the accepted input range of every numeric feature from the training data.

The API used to accept whatever was physically possible (pH 3-10, rainfall
0-5000mm). The model was only ever trained on a narrower slice (pH 4.9-8.2,
rainfall 25-3663mm), and a tree ensemble cannot extrapolate: values past the
edge of the training data land in the same leaves as the nearest real data, so
every tree agrees and the prediction comes back with a high confidence it has
not earned.

So the bounds are taken from the data itself, in two tiers:

  accept  — the observed min/max. Outside this the model has no evidence at all
            and the request is rejected rather than guessed at.
  warn    — the 1st-99th percentile. Inside the data but thinly represented, so
            the prediction is flagged as less reliable.

The warn tier replaces a +/-3 sigma band, which was unusable on these features:
N, P, K and Rainfall are right-skewed, so mean - 3*sigma fell below zero and a
reading of 0 was never flagged.

Run after retraining:  python ai_models/training/generate_feature_bounds.py
"""

import csv
import json
from pathlib import Path

DATASET_PATH = Path(__file__).parent.parent.parent / "datasets" / "merged_all_crops_clean.csv"
OUTPUT_PATH = Path(__file__).parent / "models" / "feature_bounds.json"

FEATURES = ["N", "P", "K", "Temperature", "Rainfall", "pH", "Humidity"]

# Presentation only — how each feature is shown and typed in the UI.
DISPLAY = {
    "N":           {"unit": "kg/ha", "suffix": " kg/ha", "step": 1},
    "P":           {"unit": "kg/ha", "suffix": " kg/ha", "step": 1},
    "K":           {"unit": "kg/ha", "suffix": " kg/ha", "step": 1},
    "Temperature": {"unit": "C",     "suffix": " C",     "step": 0.1},
    "Rainfall":    {"unit": "mm",    "suffix": " mm",    "step": 1},
    "pH":          {"unit": "pH",    "suffix": "",       "step": 0.1},
    "Humidity":    {"unit": "%",     "suffix": "%",      "step": 1},
}

WARN_LOWER_PCT = 0.01
WARN_UPPER_PCT = 0.99


def percentile(sorted_values, q):
    """Nearest-rank percentile. Avoids a numpy/pandas dependency for 7 lookups."""
    if not sorted_values:
        raise ValueError("no values")
    idx = min(int(q * len(sorted_values)), len(sorted_values) - 1)
    return sorted_values[idx]


def round_out(v, step):
    """Round a bound outward to the input's step, so a value the form lets you
    type is never one the server then rejects."""
    import math
    if step >= 1:
        return float(math.floor(v)) if v >= 0 else float(math.ceil(v))
    return round(v, 1)


def build_bounds(rows):
    bounds = {}
    for feature in FEATURES:
        values = sorted(
            float(r[feature]) for r in rows
            if r.get(feature) not in (None, "")
        )
        if not values:
            raise ValueError(f"no values for {feature} in {DATASET_PATH}")

        lo, hi = values[0], values[-1]
        warn_lo = percentile(values, WARN_LOWER_PCT)
        warn_hi = percentile(values, WARN_UPPER_PCT)
        step = DISPLAY[feature]["step"]

        bounds[feature] = {
            "min": round_out(lo, step),
            "max": round_out(hi, step) if step < 1 else float(int(hi) + 1),
            "warn_min": round(warn_lo, 1),
            "warn_max": round(warn_hi, 1),
            **DISPLAY[feature],
        }
    return bounds


def main():
    with open(DATASET_PATH, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    bounds = build_bounds(rows)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(
            {"_source": DATASET_PATH.name, "_rows": len(rows), "features": bounds},
            f, indent=2,
        )

    print(f"Derived from {len(rows)} rows of {DATASET_PATH.name}\n")
    print(f"{'feature':<13}{'accept':>18}{'warn':>20}")
    print("-" * 51)
    for feature, b in bounds.items():
        print(f"{feature:<13}{f'{b['min']:g} - {b['max']:g}':>18}"
              f"{f'{b['warn_min']:g} - {b['warn_max']:g}':>20}")
    print(f"\nWritten to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
