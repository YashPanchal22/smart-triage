"""Transparent, configurable triage priority engine (decision support only).

Scoring is intentionally simple and explainable. Every point addition appends a
human-readable reason so staff can see exactly why a category was suggested.
This is NOT a diagnosis — it is an operational prioritisation aid.
"""
from typing import Dict, List, Tuple

PRIORITY_ORDER = {"emergency": 0, "urgent": 1, "semi_urgent": 2, "routine": 3}
PRIORITY_LABEL = {"emergency": "Emergency", "urgent": "Urgent", "semi_urgent": "Semi-Urgent", "routine": "Routine"}

WARNING_LABELS = {
    "chest_pain": "Chest pain / pressure",
    "breathing_difficulty": "Severe breathing difficulty",
    "unresponsive": "Unresponsive / fainted",
    "severe_bleeding": "Severe / uncontrolled bleeding",
    "stroke_signs": "Stroke signs (face droop, slurred speech, weakness)",
    "severe_trauma": "Severe trauma / accident",
    "seizure": "Ongoing seizure",
    "allergic_reaction": "Severe allergic reaction",
    "suicidal_ideation": "Self-harm / suicidal thoughts",
    "high_fever_rash": "High fever with rash / stiff neck",
}


def evaluate_triage(data: Dict) -> Tuple[str, int, List[str]]:
    """Return (priority, score, reasons)."""
    score = 0
    reasons: List[str] = []

    def add(points: int, reason: str):
        nonlocal score
        score += points
        reasons.append(f"+{points}: {reason}")

    # 1. Emergency warning indicators — strongest signal
    warnings = data.get("warning_indicators") or []
    if warnings:
        labels = [WARNING_LABELS.get(w, w) for w in warnings]
        if len(warnings) >= 2:
            add(35, f"Multiple configured emergency indicators reported: {', '.join(labels)}. Priority increased because multiple configured emergency indicators were reported.")
        else:
            add(30, f"Emergency warning indicator reported: {', '.join(labels)}.")

    # 2. Consciousness
    cons = (data.get("consciousness") or "alert").lower()
    if cons == "unresponsive":
        add(30, "Patient is unresponsive.")
    elif cons == "pain":
        add(20, "Patient responds only to pain.")
    elif cons == "voice":
        add(10, "Patient responds only to voice (drowsy).")

    # 3. Vitals
    spo2 = _num(data.get("spo2"))
    if spo2 is not None:
        if spo2 < 90:
            add(30, f"Critically low oxygen saturation (SpO2 {spo2}%).")
        elif spo2 < 94:
            add(20, f"Low oxygen saturation (SpO2 {spo2}%).")
        elif spo2 < 95:
            add(10, f"Borderline oxygen saturation (SpO2 {spo2}%).")

    hr = _num(data.get("heart_rate"))
    if hr is not None:
        if hr < 40 or hr > 140:
            add(30, f"Critical heart rate ({hr} bpm).")
        elif hr < 50 or hr > 120:
            add(20, f"Abnormal heart rate ({hr} bpm).")
        elif hr < 60 or hr > 100:
            add(10, f"Heart rate outside normal range ({hr} bpm).")

    rr = _num(data.get("respiratory_rate"))
    if rr is not None:
        if rr < 8 or rr > 30:
            add(30, f"Critical respiratory rate ({rr}/min).")
        elif rr < 10 or rr > 24:
            add(20, f"Abnormal respiratory rate ({rr}/min).")

    sbp = _num(data.get("sbp"))
    if sbp is not None:
        if sbp < 70 or sbp > 200:
            add(30, f"Critical systolic blood pressure ({sbp} mmHg).")
        elif sbp < 90 or sbp > 180:
            add(20, f"Abnormal systolic blood pressure ({sbp} mmHg).")
        elif sbp > 140:
            add(10, f"Elevated systolic blood pressure ({sbp} mmHg).")

    temp = _num(data.get("temperature"))
    if temp is not None:
        if temp >= 40 or temp < 35:
            add(20, f"Critical body temperature ({temp} °C).")
        elif temp >= 39:
            add(10, f"High fever ({temp} °C).")

    # 4. Pain
    pain = data.get("pain_score") or 0
    try:
        pain = int(pain)
    except (TypeError, ValueError):
        pain = 0
    if pain >= 9:
        add(15, f"Severe pain reported ({pain}/10).")
    elif pain >= 7:
        add(10, f"Moderate-severe pain reported ({pain}/10).")
    elif pain >= 4:
        add(5, f"Moderate pain reported ({pain}/10).")

    # 5. Age group
    age = data.get("age")
    try:
        age = int(age) if age is not None else None
    except (TypeError, ValueError):
        age = None
    if age is not None:
        if age <= 2 or age >= 75:
            add(10, f"High-risk age group ({age} years).")
        elif age >= 65:
            add(5, f"Elevated-risk age group ({age} years).")

    # 6. Risk factors (entered by authorised staff)
    risks = data.get("risk_factors") or []
    if risks:
        pts = min(10, 3 * len(risks))
        add(pts, f"Known risk factors on record: {', '.join(risks[:5])}.")

    # 7. Symptom keywords (transparent list)
    text = f"{data.get('chief_complaint','')} {data.get('symptoms','')}".lower()
    urgent_kw = ["chest pain", "breathless", "shortness of breath", "bleeding heavily", "unconscious", "stroke", "seizure"]
    if any(k in text for k in urgent_kw):
        add(10, "Reported symptoms include urgent keywords; clinical review advised promptly.")

    if score >= 30:
        priority = "emergency"
    elif score >= 20:
        priority = "urgent"
    elif score >= 10:
        priority = "semi_urgent"
    else:
        priority = "routine"

    if not reasons:
        reasons.append("No concerning indicators found; routine queue placement suggested.")

    return priority, score, reasons


def _num(v):
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None
