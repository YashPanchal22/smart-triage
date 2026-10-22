"""Seed role-based modules: users, nurses, tasks, lab, pharmacy, consultations. SYNTHETIC."""
import json
import random
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from .models import (
    User, Department, Doctor, Nurse, Patient, Visit, NurseTask, Consultation,
    LabOrder, LabResult, PharmacyItem, PharmacyOrder, Medicine, SystemSetting,
)
from .auth import hash_password
from .eco2 import LAB_CATALOG

FIRST = ["Aarav","Aanya","Aditya","Anaya","Arjun","Asha","Dev","Diya","Farhan","Gauri","Harsh","Isha","Jai","Kavya","Kiran","Lakshmi","Manav","Meera","Nikhil","Pooja","Priya","Rahul","Riya","Rohan","Sana","Shreya","Vikram","Zara","Amit","Neha","Suresh","Komal","Rajesh","Divya","Karan","Pallavi","Nitin","Shalini","Yash","Tanvi"]
LAST = ["Sharma","Patel","Iyer","Khan","Gupta","Mehta","Nair","Singh","Reddy","Joshi","Kulkarni","Das","Bose","Chopra","Verma","Agarwal","Menon","Pillai","Rao","Kapoor","Malhotra","Trivedi","Desai","Pandya","Solanki","Jadeja","Parmar","Chauhan","Rathod","Gohil"]


def seed_eco2(db: Session):
    random.seed(11)
    out = {}

    def mkuser(u, e, p, n, r):
        ex = db.query(User).filter_by(username=u).first()
        if ex:
            return ex
        user = User(username=u, email=e, hashed_password=hash_password(p), full_name=n, role=r)
        db.add(user); db.flush()
        return user

    admin = mkuser("admin", "admin@hospital.demo", "admin123", "Hospital Administrator", "admin")
    mkuser("superadmin", "super@hospital.demo", "super123", "Super Administrator", "superadmin")
    doc_u = mkuser("doctor", "doctor@hospital.demo", "doctor123", "Dr. Demo Physician", "doctor")
    mkuser("triage", "triage@hospital.demo", "triage123", "Triage Nurse", "triage")
    mkuser("nurse", "nurse@hospital.demo", "nurse123", "Staff Nurse", "nurse")
    pat_u = mkuser("patient", "patient@hospital.demo", "patient123", "Demo Patient", "patient")
    mkuser("blood", "blood@hospital.demo", "blood123", "Blood Bank Staff", "blood")
    mkuser("emergency", "emergency@hospital.demo", "emergency123", "Emergency Coordinator", "emergency")
    mkuser("pharmacy", "pharmacy@hospital.demo", "pharmacy123", "Pharmacy Staff", "pharmacy")
    mkuser("lab", "lab@hospital.demo", "lab123", "Laboratory Staff", "lab")

    depts = db.query(Department).all()
    doctors = db.query(Doctor).all()
    patients = db.query(Patient).all()
    visits = db.query(Visit).order_by(Visit.id.desc()).limit(1500).all()

    # link demo patient user to first patient + ensure demo patient has an upcoming appointment
    if patients and not db.query(Patient).filter_by(user_id=pat_u.id).first():
        p0 = patients[0]
        p0.user_id = pat_u.id
        p0.full_name = "Demo Patient"
        db.flush()
    from .models import Appointment
    if not db.query(Appointment).filter(Appointment.patient_id.in_([p.id for p in db.query(Patient).filter_by(user_id=pat_u.id).all()])).first():
        mp = db.query(Patient).filter_by(user_id=pat_u.id).first()
        if mp and doctors:
            db.add(Appointment(patient_id=mp.id, doctor_id=doctors[0].id, department_id=doctors[0].department_id,
                               date=date.today() + timedelta(days=1), time_slot="10:30", reason="General consultation",
                               status="confirmed", created_by=admin.id))
            db.flush()

    # ---- nurses ----
    if db.query(Nurse).count() == 0:
        for i in range(42):
            db.add(Nurse(full_name=f"{random.choice(FIRST)} {random.choice(LAST)}", department_id=random.choice(depts).id if depts else None,
                         license_no=f"NUR-{20000+i}", phone=f"98{random.randint(10000000,99999999)}", on_duty=random.random() > 0.2))
        db.flush()
    out["nurses"] = db.query(Nurse).count()

    # ---- nursing tasks ----
    if db.query(NurseTask).count() == 0:
        templates = [("Check vital signs", "vitals"), ("Prepare patient for doctor", "prep"), ("Update triage information", "triage"),
                     ("Bed assignment", "bed"), ("Record nursing observation", "observation"), ("Administer prescribed medication", "medication")]
        for v in random.sample(visits, k=min(120, len(visits))):
            t, c = random.choice(templates)
            db.add(NurseTask(visit_id=v.id, patient_id=v.patient_id, title=f"{t} — {v.patient_code if hasattr(v, 'patient_code') else ''}".strip(),
                             category=c, status=random.choices(["pending", "done"], weights=[60, 40])[0],
                             assigned_to=f"Nurse-{random.randint(1,8)}", created_by=admin.id))
        # fix titles with patient codes
        for t in db.query(NurseTask).all():
            p = db.get(Patient, t.patient_id) if t.patient_id else None
            if p and p.patient_code not in (t.title or ""):
                t.title = f"{t.title} — {p.patient_code}".replace(" —  —", " —").strip()
        db.flush()
    out["tasks"] = db.query(NurseTask).count()

    # ---- consultations ----
    if db.query(Consultation).count() == 0:
        notes = ["Patient examined. Vitals reviewed with triage notes. Advised rest and follow-up in OPD.",
                 "Reviewed history and current complaint. Lab tests requested. Patient counselled on warning signs.",
                 "Assessment done. Responding to ongoing care. Continue observation and review tomorrow.",
                 "Examined. Referred for further evaluation. Family updated on care plan."]
        for v in random.sample(visits, k=min(150, len(visits))):
            db.add(Consultation(visit_id=v.id, patient_id=v.patient_id, doctor_name=f"Dr. {random.choice(FIRST)} {random.choice(LAST)}",
                                notes=random.choice(notes), status=random.choice(["open", "closed", "closed"]), created_by=doc_u.id))
        db.flush()

    # ---- lab orders + results ----
    if db.query(LabOrder).count() == 0:
        for v in random.sample(visits, k=min(250, len(visits))):
            st = random.choice(["requested", "sample_collected", "processing", "completed", "reviewed", "completed"])
            o = LabOrder(visit_id=v.id, patient_id=v.patient_id, test_name=random.choice(LAB_CATALOG),
                         priority=random.choice(["routine", "urgent", "routine"]), status=st, ordered_by=doc_u.id,
                         created_at=datetime.now() - timedelta(days=random.randint(0, 14)))
            db.add(o); db.flush()
            if st in ("completed", "reviewed"):
                db.add(LabResult(order_id=o.id, result_text=f"{o.test_name}: values within expected reference range (synthetic demo).",
                                 values_json=json.dumps({"demo": True}), reviewed=(st == "reviewed"), recorded_by=admin.id))
        db.flush()
    out["lab_orders"] = db.query(LabOrder).count()

    # ---- pharmacy items ----
    if db.query(PharmacyItem).count() == 0:
        meds = db.query(Medicine).all()
        names = [(m.name, m.id) for m in meds] or [("Paracetamol", None)]
        while len(names) < 45:
            names.append((f"{random.choice(names)[0]} {random.choice(['500mg','250mg','Syrup','Drops'])}", None))
        for i, (nm, mid) in enumerate(names[:45]):
            exp = date.today() + timedelta(days=random.choice([20, 45, 80, 150, 300, 500, 700]))
            db.add(PharmacyItem(medicine_id=mid, name=nm, batch_no=f"B{random.randint(1000,9999)}",
                                quantity=random.choice([4, 8, 12, 25, 40, 60, 100, 150]),
                                unit=random.choice(["strips", "bottles", "vials", "boxes"]),
                                expiry=exp, reorder_level=20))
        db.flush()
    out["pharmacy_items"] = db.query(PharmacyItem).count()

    # ---- pharmacy orders ----
    if db.query(PharmacyOrder).count() == 0:
        items = db.query(PharmacyItem).all()
        for v in random.sample(visits, k=min(70, len(visits))):
            picks = random.sample(items, k=min(random.randint(1, 3), len(items)))
            db.add(PharmacyOrder(visit_id=v.id, patient_id=v.patient_id,
                                 items_json=json.dumps([{"name": p.name, "qty": random.randint(1, 4)} for p in picks]),
                                 status=random.choice(["pending", "dispensing", "dispensed", "dispensed"]), ordered_by=doc_u.id))
        db.flush()

    # ---- system settings ----
    defaults = {"hospital_name": "City General Hospital (Demo)", "emergency_phone": "108 / 112",
                "low_stock_threshold": "5", "blood_low_units": "5", "queue_refresh_sec": "30",
                "demo_mode": "true", "data_notice": "DEMONSTRATION SYSTEM — SYNTHETIC DATA"}
    for k, v in defaults.items():
        if not db.get(SystemSetting, k):
            db.add(SystemSetting(key=k, value=v))
    db.commit()
    return out
