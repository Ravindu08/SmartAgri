"""
SMARTAGRI Dataset Standardization Script
-----------------------------------------
Run: python3 standardize_dataset.py

Reads:  merged_all_crops_raw.csv   (original merged dataset)
Writes: merged_all_crops_clean.csv (standardized dataset)
        standardization_report.txt  (full change summary)
"""

import csv
import io
import re
from collections import Counter, defaultdict

INPUT  = "merged_all_crops_raw.csv"
OUTPUT = "merged_all_crops_clean.csv"
REPORT = "standardization_report.txt"

# ─────────────────────────────────────────────
# 1. CROP NAME MAPPING
# Strip suffixes like _500_rows_dataset, _500, etc.
# Apply clean display names where needed.
# ─────────────────────────────────────────────
CROP_NAMES = {
    "Beetroot_500_rows_dataset":                    "Beetroot",
    "Big_onion_500":                                "Big Onion",
    "Bitter_gourd_500_rows_dataset":                "Bitter Gourd",
    "Brinjal_eggplant_500_dataset":                 "Brinjal (Eggplant)",
    "Cabbage_500_rows_dataset":                     "Cabbage",
    "Capsicum_500_rows_dataset":                    "Capsicum",
    "Carrot_500_rows_dataset":                      "Carrot",
    "Cassava_500_rows_dataset":                     "Cassava",
    "Chilli_500":                                   "Chilli",
    "Cowpea_500":                                   "Cowpea",
    "Elabatu_thai_eggplant_500_rows_dataset":       "Elabatu (Thai Eggplant)",
    "Gowa_cauliflower_500_rows_dataset":            "Cauliflower (Gowa)",
    "Innala_500_rows_dataset":                      "Innala",
    "Kiri_ala_500_rows_dataset":                    "Kiri Ala",
    "Kurakkan_500":                                 "Kurakkan",
    "Leeks_500_rows_dataset":                       "Leeks",
    "Luffa_500_rows_dataset":                       "Luffa",
    "Maize_500":                                    "Maize",
    "Mungbean_500_rows_dataset":                    "Mung Bean",
    "Nokol_kohlrabi_500_rows_dataset":              "Kohlrabi (Nokol)",
    "Okra_500_dataset":                             "Okra",
    "Pathola_500_rows_dataset":                     "Pathola (Snake Gourd)",
    "Pigeon_pea_500_rows_dataset":                  "Pigeon Pea",
    "Potato_500_rows_dataset":                      "Potato",
    "Pumpkin_500_rows_dataset":                     "Pumpkin",
    "Radish_500_rows_dataset":                      "Radish",
    "Red_onion_500":                                "Red Onion",
    "Sorghum_500_dataset":                          "Sorghum",
    "Soybean_500_rows_sri_lanka":                   "Soybean",
    "Sunflower_500_rows_dataset":                   "Sunflower",
    "Sweet Corn":                                   "Sweet Corn",
    "Tibbatu_solarium_torvum_500_rows_dataset":     "Tibbatu (Turkey Berry)",
    "Tomato_500_rows_dataset":                      "Tomato",
    "Winged_bean_dambala_500_dataset":              "Winged Bean (Dambala)",
    "Beans":                                        "Beans",
    "Beans_500_rows_dataset":                       "Beans",
    "Black_gram_500":                               "Black Gram",
    "Black_gram_500_rows_dataset":                  "Black Gram",
    "Cucumber_500_rows_dataset":                    "Cucumber",
    "Cucumber_500":                                 "Cucumber",
    "Kohila_500_rows_dataset":                      "Kohila",
    "Kohila_500":                                   "Kohila",
    "Menari_proso_millet_500_rows_dataset":         "Menari (Proso Millet)",
    "Menari_500":                                   "Menari (Proso Millet)",
    "Mustard_500_rows_dataset":                     "Mustard",
    "Mustard_500":                                  "Mustard",
    "Sweet_potato_bathala_500_rows_dataset":        "Sweet Potato (Bathala)",
    "Sweet_potato_500":                             "Sweet Potato (Bathala)",
}

# ─────────────────────────────────────────────
# 2. IRRIGATION MAPPING
# Collapse 13 variants → 3 categories
# ─────────────────────────────────────────────
IRRIGATION_MAP = {
    # Rainfed
    "Rainfed":                  "Rainfed",
    # Supplemental (mixed rainfed + irrigation)
    "Supplemental Irrigation":  "Supplemental",
    "Rainfed + Supplemental":   "Supplemental",
    "Residual Moisture":        "Supplemental",
    # Irrigated (fully managed water supply)
    "Irrigated":                "Irrigated",
    "Drip Irrigation":          "Irrigated",
    "Furrow Irrigation":        "Irrigated",
    "Sprinkler Irrigation":     "Irrigated",
    "Surface Irrigation":       "Irrigated",
    "Tank Irrigation":          "Irrigated",
    "Basin Irrigation":         "Irrigated",
    "Micro Jet":                "Irrigated",
    "Manual Irrigation":        "Irrigated",
}

# ─────────────────────────────────────────────
# 3. SEASON MAPPING
# Collapse minor seasons → 3 main ones
# Minor seasons are Sri Lanka sub-seasons that
# align to the main Maha/Yala calendar.
# ─────────────────────────────────────────────
SEASON_MAP = {
    "Maha":         "Maha",
    "Yala":         "Yala",
    "Year-round":   "Year-round",
    # Minor seasons mapped to nearest main season
    "Off-season":   "Yala",          # off-season follows Yala harvest
    "Mid Season":   "Maha",          # mid-season crops within Maha window
    "Third Season": "Year-round",    # Innala grown year-round in up-country
    "Inter-season": "Year-round",    # short cycle between Maha and Yala
}

# ─────────────────────────────────────────────
# 4. SOIL TYPE NORMALIZATION
# No semantic merging — only casing/spelling fixes
# These are scientifically distinct soil types
# ─────────────────────────────────────────────
SOIL_NORMALIZE = {
    # Fix inconsistent casing/spacing only
    "Red Brown Earth":          "Red-Brown Earth",
    "Reddish Brown Earth":      "Reddish-Brown Earth",
    "Reddish Brown Latosol":    "Reddish-Brown Latosol",
    "Red Yellow Latosol":       "Red-Yellow Latosol",
    "Red Yellow Podzolic":      "Red-Yellow Podzolic",
    "Low Humic Gley":           "Low-Humic Gley",
    "Bog and Half-bog Soil":    "Bog and Half-Bog Soil",
    "Non-Calcic Brown":         "Non-Calcic Brown Earth",
    # Everything else passes through unchanged
}

# ─────────────────────────────────────────────
# MAIN PROCESSING
# ─────────────────────────────────────────────
def standardize():
    changes = defaultdict(Counter)
    unknown = defaultdict(set)

    with open(INPUT, "r", newline="", encoding="utf-8-sig") as f_in, \
         open(OUTPUT, "w", newline="", encoding="utf-8") as f_out:

        reader = csv.DictReader(f_in)
        fieldnames = reader.fieldnames
        writer = csv.DictWriter(f_out, fieldnames=fieldnames)
        writer.writeheader()

        for row in reader:
            original = dict(row)

            # Crop
            crop = row["Crop"]
            if crop in CROP_NAMES:
                row["Crop"] = CROP_NAMES[crop]
                if original["Crop"] != row["Crop"]:
                    changes["Crop"][f"{original['Crop']} → {row['Crop']}"] += 1
            else:
                unknown["Crop"].add(crop)

            # Irrigation
            irr = row["Irrigation"]
            if irr in IRRIGATION_MAP:
                row["Irrigation"] = IRRIGATION_MAP[irr]
                if original["Irrigation"] != row["Irrigation"]:
                    changes["Irrigation"][f"{original['Irrigation']} → {row['Irrigation']}"] += 1
            else:
                unknown["Irrigation"].add(irr)

            # Season
            season = row["Season"]
            if season in SEASON_MAP:
                row["Season"] = SEASON_MAP[season]
                if original["Season"] != row["Season"]:
                    changes["Season"][f"{original['Season']} → {row['Season']}"] += 1
            else:
                unknown["Season"].add(season)

            # Soil type
            soil = row["Soil_Type"]
            if soil in SOIL_NORMALIZE:
                row["Soil_Type"] = SOIL_NORMALIZE[soil]
                if original["Soil_Type"] != row["Soil_Type"]:
                    changes["Soil_Type"][f"{original['Soil_Type']} → {row['Soil_Type']}"] += 1

            writer.writerow(row)

    # Write report
    with open(REPORT, "w") as r:
        r.write("SMARTAGRI STANDARDIZATION REPORT\n")
        r.write("=" * 60 + "\n\n")

        for field, field_changes in changes.items():
            r.write(f"[{field}]\n")
            total = sum(field_changes.values())
            r.write(f"  {total} rows changed\n")
            for change, count in sorted(field_changes.items(), key=lambda x: -x[1]):
                r.write(f"  {count:>6}  {change}\n")
            r.write("\n")

        if unknown:
            r.write("[UNMAPPED VALUES — review manually]\n")
            for field, vals in unknown.items():
                r.write(f"  {field}: {sorted(vals)}\n")

        r.write("\nDone.\n")

    # Print summary
    print(f"✓ Written: {OUTPUT}")
    print(f"✓ Report:  {REPORT}\n")
    for field, field_changes in changes.items():
        total = sum(field_changes.values())
        print(f"  {field}: {total} rows updated ({len(field_changes)} unique mappings)")
    if unknown:
        print("\n⚠ Unmapped values:")
        for field, vals in unknown.items():
            print(f"  {field}: {sorted(vals)}")

if __name__ == "__main__":
    standardize()
