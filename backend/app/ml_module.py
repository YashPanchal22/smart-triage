"""Waiting-time prediction ML module (estimates only, not medical decisions).

Trains a small RandomForestRegressor on historical/demo visit data with features:
queue size at arrival, priority, department load, arrival hour, doctor availability.
Exposes training metrics (MAE / RMSE / R²) and a predict() helper.
"""
from typing import Dict, List
import math
import numpy as np

_model = None
_metrics: Dict = {}
_feature_cols: List[str] = ["queue_size", "priority_code", "dept_load", "hour", "doctors_available", "is_emergency_hour"]

PRIORITY_CODE = {"emergency": 0, "urgent": 1, "semi_urgent": 2, "routine": 3}


def _rows_to_xy(rows: List[Dict]):
    X, y = [], []
    for r in rows:
        X.append([r.get(c, 0) for c in _feature_cols])
        y.append(r.get("waiting_minutes", 15))
    return np.array(X, dtype=float), np.array(y, dtype=float)


def train(rows: List[Dict]) -> Dict:
    """Train on historical rows; returns metrics dict."""
    global _model, _metrics
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

    if len(rows) < 30:
        _metrics = {"status": "insufficient-data", "n": len(rows)}
        _model = None
        return _metrics
    X, y = _rows_to_xy(rows)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)
    m = RandomForestRegressor(n_estimators=120, max_depth=10, random_state=42, n_jobs=-1)
    m.fit(Xtr, ytr)
    pred = m.predict(Xte)
    mae = float(mean_absolute_error(yte, pred))
    rmse = float(math.sqrt(mean_squared_error(yte, pred)))
    try:
        r2 = float(r2_score(yte, pred))
    except Exception:
        r2 = 0.0
    _model = m
    _metrics = {
        "status": "trained", "n": len(rows),
        "mae": round(mae, 2), "rmse": round(rmse, 2), "r2": round(r2, 3),
        "model": "RandomForestRegressor(n=120, depth=10)",
        "features": _feature_cols,
        "note": "Estimates only — not a medical decision.",
    }
    return _metrics


def predict(features: Dict) -> Dict:
    """Predict waiting minutes. Falls back to heuristic if model untrained."""
    x = [features.get(c, 0) for c in _feature_cols]
    if _model is None:
        # Transparent heuristic fallback
        base = 8 + x[0] * 2.5 + x[1] * 4 + x[2] * 1.5 - x[4] * 1.2
        est = max(2, round(float(base)))
        return {"estimated_minutes": est, "method": "heuristic-fallback", "label": "estimate"}
    est = max(1, int(round(float(_model.predict([x])[0]))))
    return {"estimated_minutes": est, "method": "random-forest", "label": "estimate"}


def metrics() -> Dict:
    return _metrics or {"status": "not-trained"}
