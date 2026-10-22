"""Synthetic demo-data generator. ALL DATA IS FAKE — for education/demo only."""
import json
import random
from datetime import datetime, timedelta, timezone, date
from sqlalchemy.orm import Session
from .models import (
    User, Department, Doctor, Patient, Visit, TriageAssessment,
    TriageRule, HospitalResource, Notification, AuditLog,
)
from .auth import hash_password
from .triage_engine import evaluate_triage

FIRST = ["Aarav","Aanya","Aditya","Anaya","Arjun","Asha","Dev","Diya","Farhan","Gauri","Harsh","Isha","Jai","Kavya","Kiran","Lakshmi","Manav","Meera","Nikhil","Pooja","Priya","Rahul","Riya","Rohan","Sana","Shreya","Vikram","Zara","Amit","Neha","Suresh","Komal","Rajesh","Divya","Karan","Pallavi","Nitin","Shalini","Yash","Tanvi"]
LAST = ["Sharma","Patel","Iyer","Khan","Gupta","Mehta","Nair","Singh","Reddy","Joshi","Kulkarni","Das","Bose","Chopra","Verma","Agarwal","Menon","Pillai","Rao","Kapoor","Malhotra","Trivedi","Desai","Pandya","Solanki","Jadeja","Parmar","Chauhan","Rathod","Gohil"]
DEPTS = [
    ("Emergency", "24x7 emergency & trauma care", 40),
    ("General Medicine", "Adult general medicine / OPD", 60),
    ("Pediatrics", "Child health", 30),
    ("Cardiology", "Heart care", 25),
    ("Orthopedics", "Bones & joints", 30),
    ("Gynecology", "Women's health", 30),
    ("Neurology", "Brain & nerves", 20),
    ("Pulmonology", "Lungs & respiratory", 20),
    ("Dermatology", "Skin care", 15),
    ("ENT", "Ear, nose & throat", 15),
]
COMPLAINTS = [
    ("Fever and body ache", "fever, body ache, fatigue"),
    ("Chest discomfort", "chest pain, sweating"),
    ("Breathing difficulty", "shortness of breath, cough"),
    ("Road traffic accident", "leg injury, bleeding, pain"),
    ("Severe headache", "headache, nausea"),
    ("Vomiting and dehydration", "vomiting, loose motion"),
    ("Skin rash", "itching, rash"),
    ("Ear pain", "ear pain, discharge"),
    ("Joint pain", "knee pain, swelling"),
    ("High blood pressure follow-up", "headache, dizziness"),
    ("Cough and cold", "cough, cold, sore throat"),
    ("Abdominal pain", "stomach pain, nausea"),
    ("Fainting episode", "fainted, dizziness"),
    ("Child with high fever", "fever, irritability"),
    ("Back pain", "lower back pain"),
]
RISKS = ["diabetes", "hypertension", "heart disease", "asthma", "kidney disease", "elderly-frail", "pregnancy", "immunocompromised"]
WARNINGS = ["chest_pain", "breathing_difficulty", "unresponsive", "severe_bleeding", "stroke_signs", "severe_trauma", "seizure", "allergic_reaction"]


def _code(i: int) -> str:
    return f"P-{i:05d}"


def seed_all(db: Session, patients_n=500, doctors_n=50, visits_n=2000):
    random.seed(42)
    # --- users ---
    def mkuser(u, e, p, n, r):
        if db.query(User).filter_by(username=u).first():
            return db.query(User).filter_by(username=u).first()
        user = User(username=u, email=e, hashed_password=hash_password(p), full_name=n, role=r)
        db.add(user); db.flush()
        return user

    admin = mkuser("admin", "admin@hospital.demo", "admin123", "Hospital Administrator", "admin")
    doc_u = mkuser("doctor", "doctor@hospital.demo", "doctor123", "Dr. Demo Physician", "doctor")
    tri_u = mkuser("triage", "triage@hospital.demo", "triage123", "Triage Nurse", "triage")
    pat_u = mkuser("patient", "patient@hospital.demo", "patient123", "Demo Patient", "patient")

    # --- departments ---
    depts = []
    for name, desc, cap in DEPTS:
        d = db.query(Department).filter_by(name=name).first()
        if not d:
            d = Department(name=name, description=desc, capacity=cap)
            db.add(d); db.flush()
        depts.append(d)

    # --- doctors ---
    specs = ["General Physician", "Cardiologist", "Pediatrician", "Orthopedic Surgeon", "Neurologist", "Pulmonologist", "Dermatologist", "ENT Specialist", "Gynecologist", "Emergency Physician"]
    existing_docs = db.query(Doctor).count()
    for i in range(existing_docs, doctors_n):
        fn = f"Dr. {random.choice(FIRST)} {random.choice(LAST)}"
        db.add(Doctor(
            full_name=fn, department_id=random.choice(depts).id,
            specialization=random.choice(specs), license_no=f"MCI-{10000+i}",
            phone=f"98{random.randint(10000000,99999999)}",
            available=random.random() > 0.25,
        ))
    db.flush()

    # --- triage rules (config reference) ---
    if db.query(TriageRule).count() == 0:
        rules = [
            ("Emergency warning indicator", "warning", '{"any": true}', 30, "emergency", "Any checked emergency warning indicator strongly raises priority."),
            ("Multiple emergency indicators", "warning", '{"count_gte": 2}', 35, "emergency", "Two or more emergency indicators force Emergency review."),
            ("SpO2 critical", "vitals", '{"spo2_lt": 90}', 30, "emergency", "SpO2 below 90 is critical."),
            ("SpO2 low", "vitals", '{"spo2_lt": 94}', 20, "urgent", "SpO2 90–93 needs prompt review."),
            ("Heart rate critical", "vitals", '{"hr_lt": 40, "hr_gt": 140}', 30, "emergency", "Extreme bradycardia/tachycardia."),
            ("Unresponsive", "consciousness", '{"equals": "unresponsive"}', 30, "emergency", "Unresponsive patient."),
            ("Responds to pain only", "consciousness", '{"equals": "pain"}', 20, "urgent", ""),
            ("Severe pain", "symptom", '{"pain_gte": 9}', 15, "", "Pain 9–10 adds 15 points."),
            ("High-risk age", "age", '{"lte": 2, "gte": 75}', 10, "", "Infants and elderly get extra points."),
            ("Known risk factors", "risk", '{"per_factor": 3, "max": 10}', 10, "", "Comorbidities add up to 10 points."),
        ]
        for name, cat, cfg, pts, pri, desc in rules:
            db.add(TriageRule(name=name, category=cat, config=cfg, points=pts, priority=pri, description=desc, active=True))
        db.flush()

    # --- hospital resources ---
    if db.query(HospitalResource).count() == 0:
        wards = [("General Ward", "bed_general", 100, 72), ("Emergency Beds", "bed_emergency", 30, 21),
                 ("ICU", "icu", 20, 17), ("Pediatric Ward", "bed_general", 40, 22),
                 ("Cardiology Ward", "bed_general", 30, 19), ("Ventilators", "ventilator", 15, 9)]
        for w, t, tot, occ in wards:
            db.add(HospitalResource(ward_name=w, resource_type=t, total=tot, occupied=occ))
        db.flush()

    # --- patients ---
    have_patients = db.query(Patient).count()
    for i in range(have_patients, patients_n):
        age = int(random.triangular(1, 90, 35))
        dob = date.today() - timedelta(days=age * 365 + random.randint(0, 364))
        db.add(Patient(
            patient_code=_code(i + 1),
            full_name=f"{random.choice(FIRST)} {random.choice(LAST)}",
            dob=dob, age=age, gender=random.choice(["Male", "Female", "Other"]),
            phone=f"98{random.randint(10000000,99999999)}",
            address=f"{random.randint(1,999)}, Demo Street, Rajkot, Gujarat",
            emergency_contact_name=f"{random.choice(FIRST)} {random.choice(LAST)}",
            emergency_contact_phone=f"97{random.randint(10000000,99999999)}",
            existing_conditions=", ".join(random.sample(RISKS, k=random.randint(0, 2))),
            allergies=random.choice(["", "", "Penicillin", "Peanuts", "Dust"]),
            medications=random.choice(["", "Paracetamol", "Metformin", "Amlodipine"]),
            created_by=admin.id,
        ))
        if (i + 1) % 200 == 0:
            db.flush()
    db.flush()
    patients = db.query(Patient).all()
    doctors = db.query(Doctor).all()

    # --- visits + triage (historical, spread over past 30 days, some today) ---
    have_visits = db.query(Visit).count()
    now = datetime.now(timezone.utc)
    for i in range(have_visits, visits_n):
        p = random.choice(patients)
        d = random.choice(depts)
        cc, sym = random.choice(COMPLAINTS)
        # arrival: 25% today, rest past 30 days
        if random.random() < 0.25:
            arrival = now - timedelta(minutes=random.randint(2, 600))
        else:
            arrival = now - timedelta(days=random.randint(1, 30), minutes=random.randint(0, 1400))
        arrival = arrival.replace(tzinfo=None)
        # vitals
        spo2 = round(random.gauss(97, 2.2), 1)
        hr = round(random.gauss(82, 16))
        rr = round(random.gauss(18, 5))
        sbp = round(random.gauss(124, 20))
        dbp = round(sbp * random.uniform(0.55, 0.68))
        temp = round(random.gauss(37.4, 1.0), 1)
        cons = random.choices(["alert", "alert", "alert", "alert", "voice", "pain", "unresponsive"], weights=[90, 0, 0, 0, 5, 3, 2])[0]
        pain = random.choices([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], weights=[20, 10, 10, 10, 10, 10, 8, 6, 3, 2, 1])[0]
        risks = random.sample(RISKS, k=random.randint(0, 2)) if random.random() < 0.4 else []
        warns = []
        if random.random() < 0.06:
            warns = random.sample(WARNINGS, k=random.randint(1, 2))
        pri, score, reasons = evaluate_triage({
            "chief_complaint": cc, "symptoms": sym, "spo2": spo2, "heart_rate": hr,
            "respiratory_rate": rr, "sbp": sbp, "temperature": temp, "consciousness": cons,
            "pain_score": pain, "age": p.age, "risk_factors": risks, "warning_indicators": warns,
        })
        # status
        is_today = arrival.date() == datetime.now().date()
        if is_today and random.random() < 0.35:
            status = random.choice(["waiting", "waiting", "called", "under_assessment"])
            wait = None
            called = started = completed = None
        else:
            status = "completed"
            wait = max(2, int(random.gauss(28 if pri == "routine" else 12, 10)))
            called = arrival + timedelta(minutes=max(1, wait - 5))
            started = arrival + timedelta(minutes=wait)
            completed = started + timedelta(minutes=random.randint(10, 60))
        v = Visit(
            patient_id=p.id, department_id=d.id, chief_complaint=cc, symptoms=sym,
            status=status, assigned_doctor_id=random.choice(doctors).id if status != "waiting" and random.random() < 0.8 else None,
            priority=pri, priority_score=score, priority_reasons=json.dumps(reasons),
            arrival_time=arrival, called_time=called, started_time=started,
            completed_time=completed, waiting_minutes=wait,
        )
        db.add(v); db.flush()
        db.add(TriageAssessment(
            visit_id=v.id, patient_id=p.id, assessed_by=tri_u.id, chief_complaint=cc, symptoms=sym,
            temperature=temp, heart_rate=hr, sbp=sbp, dbp=dbp, respiratory_rate=rr, spo2=spo2,
            consciousness=cons, pain_score=pain, risk_factors=json.dumps(risks),
            warning_indicators=json.dumps(warns), suggested_priority=pri, suggested_score=score,
            suggested_reasons=json.dumps(reasons), final_priority=pri,
        ))
        if (i + 1) % 500 == 0:
            db.flush()
    db.commit()

    # --- starter notifications + audit ---
    db.add(Notification(role_target="admin", type="info", title="Demo data loaded",
                        message=f"Synthetic demo dataset ready: {patients_n} patients, {visits_n} visits. All data is fictional."))
    db.add(AuditLog(user_id=admin.id, action="seed", entity="database", details="Synthetic demo data generated"))
    db.commit()
    return {"patients": patients_n, "doctors": doctors_n, "visits": visits_n}
