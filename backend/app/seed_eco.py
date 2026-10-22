"""Ecosystem seed: tops up core data + seeds all 12 modules. ALL SYNTHETIC."""
import json
import random
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from .models import (
    User, Department, Doctor, Patient, Visit, TriageAssessment, Appointment,
    DoctorSchedule, BloodDonor, BloodInventory, BloodRequest, Ambulance,
    EmergencyRequest, HealthArticle, NutritionResource, Medicine, ServiceDir,
    Invoice, Bed, HospitalResource,
)
from .auth import hash_password
from .triage_engine import evaluate_triage
from .kb import ARTICLES, NUTRITION, MEDICINES, SERVICES

FIRST = ["Aarav","Aanya","Aditya","Anaya","Arjun","Asha","Dev","Diya","Farhan","Gauri","Harsh","Isha","Jai","Kavya","Kiran","Lakshmi","Manav","Meera","Nikhil","Pooja","Priya","Rahul","Riya","Rohan","Sana","Shreya","Vikram","Zara","Amit","Neha","Suresh","Komal","Rajesh","Divya","Karan","Pallavi","Nitin","Shalini","Yash","Tanvi"]
LAST = ["Sharma","Patel","Iyer","Khan","Gupta","Mehta","Nair","Singh","Reddy","Joshi","Kulkarni","Das","Bose","Chopra","Verma","Agarwal","Menon","Pillai","Rao","Kapoor","Malhotra","Trivedi","Desai","Pandya","Solanki","Jadeja","Parmar","Chauhan","Rathod","Gohil"]
GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
COMPLAINTS = [
    ("Fever and body ache", "fever, body ache, fatigue"), ("Chest discomfort", "chest pain, sweating"),
    ("Breathing difficulty", "shortness of breath, cough"), ("Leg injury", "leg injury, bleeding, pain"),
    ("Severe headache", "headache, nausea"), ("Vomiting", "vomiting, loose motion"),
    ("Skin rash", "itching, rash"), ("Ear pain", "ear pain, discharge"), ("Joint pain", "knee pain, swelling"),
    ("Follow-up visit", "routine review"), ("Cough and cold", "cough, cold, sore throat"),
    ("Abdominal pain", "stomach pain, nausea"), ("Fainting episode", "fainted, dizziness"),
    ("Child with high fever", "fever, irritability"), ("Back pain", "lower back pain"),
]
RISKS = ["diabetes", "hypertension", "heart disease", "asthma", "kidney disease", "elderly-frail", "pregnancy", "immunocompromised"]
WARNINGS = ["chest_pain", "breathing_difficulty", "unresponsive", "severe_bleeding", "stroke_signs", "severe_trauma", "seizure", "allergic_reaction"]
ER_TYPES = ["medical", "accident", "cardiac", "maternity", "pediatric", "trauma"]
PLACES = ["Ring Road", "Kalawad Road", "Gondal Road", "University Road", "Raiya Circle", "Nana Mava", "Mavdi", "Kotharia", "Paddhari", "Kuvavadva"]
REASONS = ["General consultation", "Follow-up", "Fever", "Skin issue", "Joint pain", "Child checkup", "BP review", "Diabetes review", "ENT checkup", "Eye checkup"]


def seed_eco(db: Session):
    random.seed(7)
    out = {}

    def mkuser(u, e, p, n, r):
        ex = db.query(User).filter_by(username=u).first()
        if ex:
            return ex
        user = User(username=u, email=e, hashed_password=hash_password(p), full_name=n, role=r)
        db.add(user); db.flush()
        return user

    admin = mkuser("admin", "admin@hospital.demo", "admin123", "Hospital Administrator", "admin")
    mkuser("doctor", "doctor@hospital.demo", "doctor123", "Dr. Demo Physician", "doctor")
    tri_u = mkuser("triage", "triage@hospital.demo", "triage123", "Triage Nurse", "triage")
    mkuser("patient", "patient@hospital.demo", "patient123", "Demo Patient", "patient")
    mkuser("blood", "blood@hospital.demo", "blood123", "Blood Bank Staff", "blood")
    mkuser("emergency", "emergency@hospital.demo", "emergency123", "Emergency Coordinator", "emergency")

    # ---- departments -> 15 ----
    extra = [("Oncology", "Cancer care", 20), ("Urology", "Urinary care", 15), ("Ophthalmology", "Eye care", 15),
             ("Psychiatry", "Mental health OPD", 12), ("Physiotherapy", "Rehab & physio", 12)]
    for name, desc, cap in extra:
        if not db.query(Department).filter_by(name=name).first():
            db.add(Department(name=name, description=desc, capacity=cap))
    db.flush()
    depts = db.query(Department).all()

    # ---- doctors -> 100 ----
    specs = ["General Physician", "Cardiologist", "Pediatrician", "Orthopedic Surgeon", "Neurologist", "Pulmonologist", "Dermatologist", "ENT Specialist", "Gynecologist", "Emergency Physician", "Oncologist", "Ophthalmologist", "Psychiatrist", "Urologist", "Physiotherapist"]
    have_docs = db.query(Doctor).count()
    for i in range(have_docs, 100):
        db.add(Doctor(full_name=f"Dr. {random.choice(FIRST)} {random.choice(LAST)}", department_id=random.choice(depts).id,
                      specialization=random.choice(specs), license_no=f"MCI-{10000+i}", phone=f"98{random.randint(10000000,99999999)}",
                      available=random.random() > 0.25))
    db.flush()
    doctors = db.query(Doctor).all()
    out["doctors"] = len(doctors)

    # ---- schedules ----
    if db.query(DoctorSchedule).count() == 0:
        for d in doctors:
            for wd in random.sample(range(6), k=random.randint(3, 5)):
                db.add(DoctorSchedule(doctor_id=d.id, weekday=wd, start_time=random.choice(["09:00", "10:00", "16:00"]),
                                      end_time=random.choice(["13:00", "14:00", "20:00"]), slot_minutes=20, active=True))
        db.flush()
    out["schedules"] = db.query(DoctorSchedule).count()

    # ---- patients -> 1000 ----
    have_p = db.query(Patient).count()
    max_id = db.query(Patient.id).order_by(Patient.id.desc()).first()
    nxt = (max_id[0] if max_id else 0) + 1
    for i in range(have_p, 1000):
        age = int(random.triangular(1, 90, 35))
        db.add(Patient(patient_code=f"P-{nxt:05d}", full_name=f"{random.choice(FIRST)} {random.choice(LAST)}",
                       dob=date.today() - timedelta(days=age * 365 + random.randint(0, 364)), age=age,
                       gender=random.choice(["Male", "Female", "Other"]), phone=f"98{random.randint(10000000,99999999)}",
                       address=f"{random.randint(1,999)}, Demo Street, Rajkot, Gujarat",
                       emergency_contact_name=f"{random.choice(FIRST)} {random.choice(LAST)}",
                       emergency_contact_phone=f"97{random.randint(10000000,99999999)}",
                       existing_conditions=", ".join(random.sample(RISKS, k=random.randint(0, 2))),
                       allergies=random.choice(["", "", "Penicillin", "Peanuts", "Dust"]),
                       medications=random.choice(["", "Paracetamol", "Metformin", "Amlodipine"]), created_by=admin.id))
        nxt += 1
        if (i + 1) % 300 == 0:
            db.flush()
    db.flush()
    patients = db.query(Patient).all()
    out["patients"] = len(patients)

    # ---- visits+triage -> 5000 ----
    have_v = db.query(Visit).count()
    now = datetime.now()
    for i in range(have_v, 5000):
        p = random.choice(patients)
        d = random.choice(depts)
        cc, sym = random.choice(COMPLAINTS)
        arrival = now - timedelta(days=random.randint(0, 45), minutes=random.randint(0, 1400)) if random.random() > 0.2 else now - timedelta(minutes=random.randint(2, 700))
        spo2 = round(random.gauss(97, 2.2), 1); hr = round(random.gauss(82, 16)); rr = round(random.gauss(18, 5))
        sbp = round(random.gauss(124, 20)); dbp = round(sbp * random.uniform(0.55, 0.68)); temp = round(random.gauss(37.4, 1.0), 1)
        cons = random.choices(["alert", "voice", "pain", "unresponsive"], weights=[93, 4, 2, 1])[0]
        pain = random.choices(range(11), weights=[20, 10, 10, 10, 10, 10, 8, 6, 3, 2, 1])[0]
        risks = random.sample(RISKS, k=random.randint(0, 2)) if random.random() < 0.4 else []
        warns = random.sample(WARNINGS, k=random.randint(1, 2)) if random.random() < 0.06 else []
        pri, score, reasons = evaluate_triage({"chief_complaint": cc, "symptoms": sym, "spo2": spo2, "heart_rate": hr,
            "respiratory_rate": rr, "sbp": sbp, "temperature": temp, "consciousness": cons, "pain_score": pain,
            "age": p.age, "risk_factors": risks, "warning_indicators": warns})
        fresh = (now - arrival).total_seconds() < 7200
        if fresh and random.random() < 0.4:
            status, wait, called, started, completed = random.choice(["waiting", "waiting", "called", "under_assessment"]), None, None, None, None
        else:
            status = "completed"
            wait = max(2, int(random.gauss(28 if pri == "routine" else 12, 10)))
            called = arrival + timedelta(minutes=max(1, wait - 5)); started = arrival + timedelta(minutes=wait); completed = started + timedelta(minutes=random.randint(10, 60))
        v = Visit(patient_id=p.id, department_id=d.id, chief_complaint=cc, symptoms=sym, status=status,
                  assigned_doctor_id=random.choice(doctors).id if status != "waiting" and random.random() < 0.8 else None,
                  priority=pri, priority_score=score, priority_reasons=json.dumps(reasons),
                  arrival_time=arrival, called_time=called, started_time=started, completed_time=completed, waiting_minutes=wait)
        db.add(v); db.flush()
        db.add(TriageAssessment(visit_id=v.id, patient_id=p.id, assessed_by=tri_u.id, chief_complaint=cc, symptoms=sym,
            temperature=temp, heart_rate=hr, sbp=sbp, dbp=dbp, respiratory_rate=rr, spo2=spo2, consciousness=cons,
            pain_score=pain, risk_factors=json.dumps(risks), warning_indicators=json.dumps(warns),
            suggested_priority=pri, suggested_score=score, suggested_reasons=json.dumps(reasons), final_priority=pri))
        if (i + 1) % 800 == 0:
            db.flush()
    db.commit()
    out["visits"] = db.query(Visit).count()

    # ---- appointments -> 5000 ----
    have_a = db.query(Appointment).count()
    slots = [f"{h:02d}:{m:02d}" for h in (9, 10, 11, 12, 16, 17, 18) for m in (0, 20, 40)]
    for i in range(have_a, 5000):
        p = random.choice(patients)
        doc = random.choice(doctors)
        delta = random.randint(-30, 14)
        ad = date.today() + timedelta(days=delta)
        if delta < 0:
            st = random.choices(["completed", "completed", "cancelled", "completed"], weights=[70, 0, 0, 0])[0] if False else random.choice(["completed", "completed", "completed", "cancelled"])
        elif delta == 0:
            st = random.choice(["confirmed", "confirmed", "requested", "completed"])
        else:
            st = random.choice(["requested", "confirmed", "confirmed", "rescheduled"])
        db.add(Appointment(patient_id=p.id, doctor_id=doc.id, department_id=doc.department_id, date=ad,
                           time_slot=random.choice(slots), reason=random.choice(REASONS), status=st, created_by=admin.id))
        if (i + 1) % 1000 == 0:
            db.flush()
    db.commit()
    out["appointments"] = db.query(Appointment).count()

    # ---- blood ----
    have_d = db.query(BloodDonor).count()
    for i in range(have_d, 500):
        db.add(BloodDonor(full_name=f"{random.choice(FIRST)} {random.choice(LAST)}", blood_group=random.choices(GROUPS, weights=[25, 5, 28, 4, 8, 2, 30, 4])[0],
                          phone=f"98{random.randint(10000000,99999999)}", gender=random.choice(["Male", "Female"]),
                          age=random.randint(18, 55), last_donation=date.today() - timedelta(days=random.randint(40, 400)) if random.random() < 0.7 else None,
                          donations_count=random.randint(0, 12)))
    db.flush()
    inv_seed = {"A+": 24, "A-": 8, "B+": 31, "B-": 6, "AB+": 12, "AB-": 3, "O+": 42, "O-": 7}
    for g in GROUPS:
        if not db.query(BloodInventory).filter_by(blood_group=g).first():
            db.add(BloodInventory(blood_group=g, units_available=inv_seed[g], units_reserved=random.randint(0, 3)))
    db.flush()
    if db.query(BloodRequest).count() == 0:
        for _ in range(80):
            db.add(BloodRequest(hospital_unit=random.choice(["Emergency", "ICU", "Surgery", "Maternity", "Oncology"]),
                                blood_group=random.choices(GROUPS, weights=[25, 5, 28, 4, 8, 2, 30, 4])[0],
                                units=random.randint(1, 4), priority=random.choice(["emergency", "urgent", "routine", "routine"]),
                                status=random.choice(["requested", "approved", "issued", "fulfilled", "requested"]), requested_by=admin.id))
    db.flush()
    out["donors"] = db.query(BloodDonor).count()

    # ---- emergency ----
    if db.query(Ambulance).count() == 0:
        for i in range(8):
            db.add(Ambulance(vehicle_no=f"GJ-03-EM-{100+i}", status=random.choice(["available", "available", "available", "on_trip", "maintenance"]),
                             location=random.choice(PLACES), crew=f"Driver + EMT-{i+1}"))
        db.flush()
    ambs = db.query(Ambulance).all()
    if db.query(EmergencyRequest).count() == 0:
        for _ in range(60):
            st = random.choice(["requested", "assigned", "en_route", "arrived", "transferred", "completed", "completed"])
            tl = [{"at": (datetime.now() - timedelta(hours=random.randint(1, 72))).isoformat(), "event": "Request created", "by": "emergency"}]
            if st != "requested":
                tl.append({"at": datetime.now().isoformat(), "event": f"Status → {st}", "by": "emergency"})
            db.add(EmergencyRequest(patient_name=f"{random.choice(FIRST)} {random.choice(LAST)}", phone=f"98{random.randint(10000000,99999999)}",
                                    emergency_type=random.choice(ER_TYPES), location=f"{random.randint(1,200)}, {random.choice(PLACES)}",
                                    priority=random.choice(["emergency", "emergency", "urgent"]), status=st,
                                    ambulance_id=random.choice(ambs).id if st not in ("requested",) else None,
                                    assigned_staff=f"EMT-{random.randint(1,8)}", timeline=json.dumps(tl), created_by=admin.id))
    db.flush()

    # ---- knowledge: articles / nutrition / medicines / services ----
    if db.query(HealthArticle).count() == 0:
        for art in ARTICLES:
            slug, cat = art[0], art[1]
            for lang, ti, bi in (("en", 3, 4), ("hi", 5, 6), ("gu", 7, 8)):
                db.add(HealthArticle(slug=slug, category=cat, lang=lang, title=art[ti], body=art[bi], source=art[9]))
        db.flush()
    out["articles"] = db.query(HealthArticle).count()
    if db.query(NutritionResource).count() == 0:
        for title, lang, grp, body, src in NUTRITION:
            db.add(NutritionResource(title=title, lang=lang, group=grp, body=body, source=src))
        db.flush()
    if db.query(Medicine).count() == 0:
        for m in MEDICINES:
            db.add(Medicine(name=m[0], generic=m[1], brands=m[2], category=m[3], uses=m[4], safety=m[5], warnings=m[6], manufacturer=m[7], source=m[8]))
        db.flush()
    out["medicines"] = db.query(Medicine).count()
    if db.query(ServiceDir).count() == 0:
        for s in SERVICES:
            db.add(ServiceDir(name=s[0], type=s[1], place=s[2], phone=s[3], hours=s[4], services=s[5]))
        # extra pharmacies/clinics
        for i in range(14):
            db.add(ServiceDir(name=f"Care Point {['Clinic','Pharmacy','Diagnostics'][i%3]} {i+1} (Demo)", type=["clinic", "pharmacy", "diagnostic"][i % 3],
                              place=random.choice(PLACES), phone=f"0281-0000{20+i}", hours="9am–9pm", services="General services"))
        db.flush()
    out["services"] = db.query(ServiceDir).count()

    # ---- invoices ----
    if db.query(Invoice).count() == 0:
        items_pool = [("Consultation", 300), ("OPD Registration", 100), ("Blood Test (CBC)", 250), ("X-Ray", 400), ("ECG", 300), ("Dressing", 150), ("Nebulization", 200), ("USG", 800)]
        for _ in range(300):
            p = random.choice(patients)
            items = [{"label": l, "amount": a} for l, a in random.sample(items_pool, k=random.randint(1, 3))]
            db.add(Invoice(patient_id=p.id, items=json.dumps(items), total=sum(i["amount"] for i in items),
                           status=random.choice(["paid", "paid", "unpaid", "paid", "waived"])))
        db.flush()

    # ---- beds ----
    if db.query(Bed).count() == 0:
        for ward, n, occ in [("General Ward", 100, 72), ("Emergency", 30, 21), ("ICU", 20, 17), ("Pediatric Ward", 40, 22), ("Cardiology Ward", 30, 19)]:
            for i in range(n):
                db.add(Bed(ward=ward, bed_no=f"{ward[:3].upper()}-{i+1:03d}", status="occupied" if i < occ else "available"))
        db.flush()
    out["beds"] = db.query(Bed).count()

    db.commit()
    return out
