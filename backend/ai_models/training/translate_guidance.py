"""
translate_guidance.py
Translates crop_guidance.json content into Sinhala (si) and Tamil (ta)
using the Claude API (claude-haiku-4-5 model for cost efficiency).

Usage:
  1. pip install anthropic
  2. set ANTHROPIC_API_KEY=sk-ant-...
  3. python translate_guidance.py
"""

import json
import os
import sys
import time
import anthropic
from pathlib import Path

GUIDANCE_PATH = Path(__file__).parent / "models/crop_guidance.json"
MODEL = "claude-haiku-4-5-20251001"


# ── Extract all translatable text fields from one crop ─────────────────────

def extract_texts(crop_data: dict) -> dict:
    texts = {}

    if crop_data.get("overview"):
        texts["overview"] = crop_data["overview"]

    texts["stages"] = []
    for stage in crop_data.get("stages", []):
        s = {"description": stage.get("description", ""), "activities": []}
        for act in stage.get("activities", []):
            s["activities"].append({
                "title":       act.get("title", ""),
                "description": act.get("description", ""),
                "why":         act.get("why", ""),
            })
        texts["stages"].append(s)

    texts["fertilization"] = []
    for fert in crop_data.get("fertilization", []):
        f = {"why": fert.get("why", ""), "applications": []}
        for app in fert.get("applications", []):
            f["applications"].append({
                "material": app.get("material", ""),
                "rate":     app.get("rate", ""),
                "method":   app.get("method", ""),
            })
        texts["fertilization"].append(f)

    irr = crop_data.get("irrigation", {})
    texts["irrigation"] = {
        "frequency":           irr.get("frequency", ""),
        "method":              irr.get("method", ""),
        "water_stress_signs":  irr.get("water_stress_signs", []),
        "over_watering_signs": irr.get("over_watering_signs", []),
        "notes":               irr.get("notes", ""),
        "critical_stages_text": " · ".join(irr.get("critical_stages", [])),
    }

    texts["diseases"] = []
    for d in crop_data.get("diseases", []):
        texts["diseases"].append({
            "name":                 d.get("name", ""),
            "cause":                d.get("cause", ""),
            "symptoms":             d.get("symptoms", ""),
            "favorable_conditions": d.get("favorable_conditions", ""),
            "prevention":           d.get("prevention", ""),
            "treatment":            d.get("treatment", ""),
        })

    texts["pests"] = []
    for p in crop_data.get("pests", []):
        texts["pests"].append({
            "name":           p.get("name", ""),
            "damage":         p.get("damage", ""),
            "identification": p.get("identification", ""),
            "prevention":     p.get("prevention", ""),
            "treatment":      p.get("treatment", ""),
        })

    texts["risks"] = []
    for r in crop_data.get("risks", []):
        texts["risks"].append({
            "name":       r.get("name", ""),
            "description":r.get("description", ""),
            "signs":      r.get("signs", ""),
            "mitigation": r.get("mitigation", ""),
        })

    h = crop_data.get("harvest", {})
    texts["harvest"] = {
        "method":       h.get("method", ""),
        "frequency":    h.get("frequency", ""),
        "post_harvest": h.get("post_harvest", ""),
        "indicators":   h.get("indicators", []),
    }

    return texts


# ── Merge translated texts back into crop data ──────────────────────────────

def _set(obj: dict, key: str, val, suffix: str):
    if val:
        obj[f"{key}_{suffix}"] = val

def merge_translations(crop_data: dict, si: dict, ta: dict) -> dict:
    for lang, t in (("si", si), ("ta", ta)):
        _set(crop_data, "overview", t.get("overview"), lang)

        for i, stage in enumerate(crop_data.get("stages", [])):
            ts = t.get("stages", [])[i] if i < len(t.get("stages", [])) else {}
            _set(stage, "description", ts.get("description"), lang)
            for j, act in enumerate(stage.get("activities", [])):
                ta_ = ts.get("activities", [])[j] if j < len(ts.get("activities", [])) else {}
                for f in ("title", "description", "why"):
                    _set(act, f, ta_.get(f), lang)

        for i, fert in enumerate(crop_data.get("fertilization", [])):
            tf = t.get("fertilization", [])[i] if i < len(t.get("fertilization", [])) else {}
            _set(fert, "why", tf.get("why"), lang)
            for j, app in enumerate(fert.get("applications", [])):
                ta2 = tf.get("applications", [])[j] if j < len(tf.get("applications", [])) else {}
                for f in ("material", "rate", "method"):
                    _set(app, f, ta2.get(f), lang)

        irr = crop_data.get("irrigation", {})
        ti = t.get("irrigation", {})
        for f in ("frequency", "method", "notes", "critical_stages_text"):
            _set(irr, f, ti.get(f), lang)
        for f in ("water_stress_signs", "over_watering_signs"):
            _set(irr, f, ti.get(f) or None, lang)

        for i, d in enumerate(crop_data.get("diseases", [])):
            td = t.get("diseases", [])[i] if i < len(t.get("diseases", [])) else {}
            for f in ("name", "cause", "symptoms", "favorable_conditions", "prevention", "treatment"):
                _set(d, f, td.get(f), lang)

        for i, p in enumerate(crop_data.get("pests", [])):
            tp = t.get("pests", [])[i] if i < len(t.get("pests", [])) else {}
            for f in ("name", "damage", "identification", "prevention", "treatment"):
                _set(p, f, tp.get(f), lang)

        for i, r in enumerate(crop_data.get("risks", [])):
            tr = t.get("risks", [])[i] if i < len(t.get("risks", [])) else {}
            for f in ("name", "description", "signs", "mitigation"):
                _set(r, f, tr.get(f), lang)

        h = crop_data.get("harvest", {})
        th = t.get("harvest", {})
        for f in ("method", "frequency", "post_harvest"):
            _set(h, f, th.get(f), lang)
        _set(h, "indicators", th.get("indicators") or None, lang)

    return crop_data


# ── Call Claude API to translate one crop ───────────────────────────────────

def translate_crop(client: anthropic.Anthropic, crop_name: str, crop_data: dict):
    texts = extract_texts(crop_data)

    prompt = f"""You are translating Sri Lankan agricultural guidance content for farmers from English to Sinhala and Tamil.

Crop: {crop_name}

Translate ALL string values in the JSON below into both Sinhala and Tamil.
Return a single JSON object with keys "si" (Sinhala) and "ta" (Tamil), each mirroring the input structure.

Translation rules:
- Keep scientific names and chemical fertilizer names (Urea, TSP, MOP, DAP, KCl, etc.) in English
- Translate agricultural terms naturally for Sri Lankan farmers
- For arrays of strings, translate each string and return an array
- Keep numerical values as-is
- Do NOT add any explanation — return ONLY the JSON

Input:
{json.dumps(texts, ensure_ascii=False)}"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=8192,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    # Strip markdown code fences if present
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.split("```")[0].strip()

    result = json.loads(raw)
    return result.get("si", {}), result.get("ta", {})


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY environment variable is not set.")
        print("  Windows: set ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)

    if not GUIDANCE_PATH.exists():
        print(f"ERROR: File not found: {GUIDANCE_PATH}")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    with open(GUIDANCE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    crops = list(data.keys())
    print(f"Translating {len(crops)} crops using {MODEL}...\n")

    failed = []
    for i, crop_name in enumerate(crops):
        # Skip crops already translated
        if data[crop_name].get("overview_si"):
            print(f"[{i+1}/{len(crops)}] {crop_name} — already translated, skipping.")
            continue

        print(f"[{i+1}/{len(crops)}] {crop_name}...", end=" ", flush=True)
        try:
            si_texts, ta_texts = translate_crop(client, crop_name, data[crop_name])
            data[crop_name] = merge_translations(data[crop_name], si_texts, ta_texts)
            print("✓")
        except Exception as e:
            print(f"FAILED — {e}")
            failed.append(crop_name)
            time.sleep(2)
            continue

        # Save after every crop so progress isn't lost on failure
        with open(GUIDANCE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        time.sleep(0.5)   # small delay to stay within rate limits

    print("\n--- Done ---")
    if failed:
        print(f"Failed crops (re-run to retry): {failed}")
    else:
        print("All crops translated successfully.")


if __name__ == "__main__":
    main()
