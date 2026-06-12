"""
Converts pickled CalibratedClassifierCV(LGBMClassifier) bundles to portable JSON.
Exports: LightGBM tree structure (dump_model) + isotonic calibration params.
Output files are loaded by api/predictor_core.py without needing lightgbm or libgomp.
"""
import pickle, json, numpy as np
from pathlib import Path

MODELS_DIR = Path(__file__).parent.parent / "api" / "models"
BINS = ["0-9", "10-14", "15-19", "20-24", "25+"]


def export_bundle(b: str):
    safe = b.replace("+", "plus").replace("-", "_")
    with open(MODELS_DIR / f"binary_model_{safe}.pkl", "rb") as f:
        bundle = pickle.load(f)

    model = bundle["model"]  # CalibratedClassifierCV
    clf   = model.calibrated_classifiers_[0]
    base  = clf.estimator          # LGBMClassifier
    cal   = clf.calibrators[0]     # IsotonicRegression

    booster_json = base.booster_.dump_model()

    out = {
        "features": bundle["features"],
        "medians":  {k: (None if (v != v) else float(v))
                     for k, v in bundle["medians"].items()},
        "booster":  booster_json,
        "calibration": {
            "X_thresholds": cal.X_thresholds_.tolist(),
            "y_thresholds": cal.y_thresholds_.tolist(),
        },
        "num_class": booster_json.get("num_class", 1),
        "average_output": booster_json.get("average_output", False),
    }

    out_path = MODELS_DIR / f"binary_model_{safe}.json"
    with open(out_path, "w") as f:
        json.dump(out, f, separators=(",", ":"))

    kb = out_path.stat().st_size // 1024
    print(f"  {b} → {out_path.name} ({kb}KB)")


if __name__ == "__main__":
    for b in BINS:
        export_bundle(b)
    print("Done — commit the .json files to api/models/")
