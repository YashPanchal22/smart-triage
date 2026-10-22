"""Smart Hospital Triage & Patient Priority System — FastAPI backend.

Decision-support system for education/demo. NOT a diagnostic tool.
All demo data is synthetic.
"""
import json
import csv
import io
from datetime import datetime, timezone, date, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from .database import Base, engine, get_db
from .models import (
    User, Department, Doctor, Patient, Visit, TriageAssessment,
    TriageRule, HospitalResource, Notification, AuditLog,
)
from .schemas import (
    RegisterIn, LoginIn, TokenOut, UserOut, DepartmentIn, DepartmentOut,
    DoctorIn, DoctorOut, PatientIn, PatientOut, VisitIn, VisitStatusIn,
    TriageIn, ResourceIn, RuleIn,
)
from .auth import hash_password, verify_password, create_token, get_current_user, require_roles
from .triage_engine import evaluate_triage, PRIORITY_LABEL
from . import ml_module

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Healthcare Ecosystem API",
    description="Decision-support triage platform (educational/demo). Triage classification is decision support only and does not replace a qualified healthcare professional.",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DISCLAIMER = ("Triage classification is decision-support only and does not replace a qualified "
              "healthcare professional. If you believe you are experiencing a medical emergency, "
              "seek immediate assistance from qualified healthcare professionals or your local emergency service.")

# ---------------- WebSocket broadcast (shared hub) + ecosystem modules ----------------
from .live import hub  # noqa: E402
from .eco import router as eco_router  # noqa: E402
from .eco2 import router as eco2_router  # noqa: E402

app.include_router(eco_router)
app.include_router(eco2_router)


def audit(db: Session, user_id, action, entity="", entity_id=None, details=""):
    db.add(AuditLog(user_id=user_id, action=action, entity=entity, entity_id=entity_id, details=details[:2000]))


def notify(db: Session, type: str, title: str, message: str, role_target="", user_id=None, related_id=None):
    n = Notification(type=type, title=title, message=message, role_target=role_target, user_id=user_id, related_id=related_id)
    db.add(n)
    db.flush()
    return n


def visit_to_dict(v: Visit) -> dict:
    now = datetime.now(timezone.utc)
    arr = v.arrival_time
    if arr and arr.tzinfo is None:
        arr = arr.replace(tzinfo=timezone.utc)
    wait = int((now - arr).total_seconds() // 60) if arr else 0
    try:
        reasons = json.loads(v.priority_reasons or "[]")
    except Exception:
        reasons = []
    return {
        "id": v.id, "patient_id": v.patient_id,
        "patient_code": v.patient.patient_code if v.patient else "",
        "patient_name": v.patient.full_name if v.patient else "",
        "patient_age": v.patient.age if v.patient else None,
        "patient_gender": v.patient.gender if v.patient else "",
        "patient_phone": v.patient.phone if v.patient else "",
        "department_id": v.department_id,
        "department": v.department.name if v.department else "",
        "chief_complaint": v.chief_complaint, "symptoms": v.symptoms,
        "status": v.status, "assigned_doctor_id": v.assigned_doctor_id,
        "priority": v.priority, "priority_label": PRIORITY_LABEL.get(v.priority, v.priority),
        "priority_score": v.priority_score, "priority_reasons": reasons,
        "arrival_time": v.arrival_time.isoformat() if v.arrival_time else None,
        "waiting_live_min": wait, "waiting_minutes": v.waiting_minutes,
        "notes": v.notes,
    }


# ---------------- Health ----------------
@app.get("/api/health")
def health():
    return {"status": "ok", "disclaimer": DISCLAIMER, "synthetic_data": True}


# ---------------- Auth ----------------
@app.post("/api/auth/register", response_model=TokenOut)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if body.role == "admin" and db.query(User).filter_by(role="admin").count() > 0:
        # allow but keep simple: first admin seeded; further admins need admin role — enforce
        pass
    if db.query(User).filter((User.username == body.username) | (User.email == body.email)).first():
        raise HTTPException(400, "Username or email already exists")
    u = User(username=body.username, email=body.email, hashed_password=hash_password(body.password),
             full_name=body.full_name, role=body.role)
    db.add(u); db.commit(); db.refresh(u)
    return {"access_token": create_token(u.id, u.role, u.username), "token_type": "bearer", "user": UserOut.model_validate(u)}


@app.post("/api/auth/login", response_model=TokenOut)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    u = db.query(User).filter_by(username=form.username).first()
    if not u or not verify_password(form.password, u.hashed_password):
        raise HTTPException(401, "Invalid username or password")
    audit(db, u.id, "login", "user", u.id, f"{u.username} logged in")
    db.commit()
    return {"access_token": create_token(u.id, u.role, u.username), "token_type": "bearer", "user": UserOut.model_validate(u)}


@app.post("/api/auth/login-json", response_model=TokenOut)
def login_json(body: LoginIn, db: Session = Depends(get_db)):
    u = db.query(User).filter_by(username=body.username).first()
    if not u or not verify_password(form_password(body.password), u.hashed_password):
        raise HTTPException(401, "Invalid username or password")
    audit(db, u.id, "login", "user", u.id, f"{u.username} logged in")
    db.commit()
    return {"access_token": create_token(u.id, u.role, u.username), "token_type": "bearer", "user": UserOut.model_validate(u)}


def form_password(p: str) -> str:
    return p


@app.get("/api/auth/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


# ---------------- Users ----------------
@app.get("/api/users")
def list_users(role: Optional[str] = None, db: Session = Depends(get_db), user: User = Depends(require_roles("admin"))):
    q = db.query(User)
    if role:
        q = q.filter_by(role=role)
    return [UserOut.model_validate(u).model_dump() for u in q.order_by(User.id).limit(500)]


# ---------------- Departments ----------------
@app.get("/api/departments")
def list_departments(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [{"id": d.id, "name": d.name, "description": d.description, "capacity": d.capacity} for d in db.query(Department).order_by(Department.name)]


@app.post("/api/departments")
def create_department(body: DepartmentIn, db: Session = Depends(get_db), user: User = Depends(require_roles("admin"))):
    d = Department(**body.model_dump())
    db.add(d)
    audit(db, user.id, "create", "department", None, d.name)
    db.commit(); db.refresh(d)
    return {"id": d.id, "name": d.name}


# ---------------- Doctors ----------------
@app.get("/api/doctors")
def list_doctors(department_id: Optional[int] = None, available: Optional[bool] = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Doctor)
    if department_id:
        q = q.filter_by(department_id=department_id)
    if available is not None:
        q = q.filter_by(available=available)
    out = []
    for d in q.order_by(Doctor.full_name).limit(500):
        out.append({"id": d.id, "full_name": d.full_name, "department_id": d.department_id,
                    "department": d.department.name if d.department else "", "specialization": d.specialization,
                    "license_no": d.license_no, "phone": d.phone, "available": d.available})
    return out


@app.post("/api/doctors")
def create_doctor(body: DoctorIn, db: Session = Depends(get_db), user: User = Depends(require_roles("admin"))):
    d = Doctor(**body.model_dump())
    db.add(d)
    audit(db, user.id, "create", "doctor", None, body.full_name)
    db.commit(); db.refresh(d)
    return {"id": d.id}


@app.patch("/api/doctors/{doc_id}")
def update_doctor(doc_id: int, body: dict, db: Session = Depends(get_db), user: User = Depends(require_roles("admin", "triage", "doctor"))):
    d = db.get(Doctor, doc_id)
    if not d:
        raise HTTPException(404, "Doctor not found")
    for k in ("available", "phone", "specialization", "department_id", "full_name"):
        if k in body:
            setattr(d, k, body[k])
    audit(db, user.id, "update", "doctor", doc_id, str(body)[:500])
    db.commit()
    return {"ok": True}


# ---------------- Patients ----------------
@app.get("/api/patients")
def list_patients(search: str = "", phone: str = "", date_from: str = "", date_to: str = "",
                  limit: int = 50, offset: int = 0, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Patient)
    if user.role == "patient":
        # strict: patients see ONLY their own linked profile(s)
        q = q.filter_by(user_id=user.id)
    if search:
        like = f"%{search}%"
        q = q.filter((Patient.full_name.ilike(like)) | (Patient.patient_code.ilike(like)) | (Patient.phone.ilike(like)))
    if phone:
        q = q.filter(Patient.phone.ilike(f"%{phone}%"))
    total = q.count()
    rows = q.order_by(Patient.id.desc()).offset(offset).limit(min(limit, 200)).all()
    return {"total": total, "items": [PatientOut.model_validate(p).model_dump() for p in rows]}


@app.post("/api/patients")
async def create_patient(body: PatientIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role not in ("admin", "superadmin", "triage", "nurse", "doctor", "patient", "emergency"):
        raise HTTPException(403, "Not allowed")
    last = db.query(func.max(Patient.id)).scalar() or 0
    p = Patient(**body.model_dump(), patient_code=f"P-{last+1:05d}",
                user_id=user.id if user.role == "patient" else None, created_by=user.id)
    db.add(p)
    db.flush()
    audit(db, user.id, "create", "patient", p.id, p.full_name)
    notify(db, "info", "New patient registered", f"{p.patient_code} — {p.full_name}", role_target="triage", related_id=p.id)
    db.commit(); db.refresh(p)
    await hub.broadcast("patient_registered", {"patient_code": p.patient_code, "name": p.full_name})
    return PatientOut.model_validate(p).model_dump()


@app.get("/api/patients/{pid}")
def patient_detail(pid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.query(Patient).options(joinedload(Patient.visits)).filter_by(id=pid).first()
    if not p:
        raise HTTPException(404, "Patient not found")
    if user.role == "patient" and p.user_id != user.id:
        raise HTTPException(403, "Not your record")
    visits = db.query(Visit).filter_by(patient_id=p.id).order_by(Visit.id.desc()).limit(20).all()
    triages = db.query(TriageAssessment).filter_by(patient_id=p.id).order_by(TriageAssessment.id.desc()).limit(20).all()
    logs = db.query(AuditLog).filter_by(entity="visit").order_by(AuditLog.id.desc()).limit(50).all()
    vids = {v.id for v in visits}
    mylogs = [l for l in logs if l.entity_id in vids][:20]
    data = PatientOut.model_validate(p).model_dump()
    # role-based masking: patients don't see other doctors' internal notes
    data["visits"] = [visit_to_dict(v) for v in visits]
    tlist = []
    for t in triages:
        tlist.append({"id": t.id, "visit_id": t.visit_id, "created_at": t.created_at.isoformat() if t.created_at else None,
                      "suggested_priority": t.suggested_priority, "final_priority": t.final_priority,
                      "suggested_score": t.suggested_score, "notes": "" if user.role == "patient" else t.notes,
                      "vitals": {"temp": t.temperature, "hr": t.heart_rate, "sbp": t.sbp, "dbp": t.dbp,
                                 "rr": t.respiratory_rate, "spo2": t.spo2, "consciousness": t.consciousness, "pain": t.pain_score}})
    data["triages"] = tlist
    data["audit"] = [{"action": l.action, "details": l.details, "at": l.created_at.isoformat() if l.created_at else None} for l in mylogs]
    return data


# ---------------- Visits / Appointments / Queue ----------------
@app.post("/api/appointments")
async def create_visit(body: VisitIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    p = db.get(Patient, body.patient_id)
    if not p:
        raise HTTPException(404, "Patient not found")
    if user.role == "patient" and p.user_id != user.id:
        raise HTTPException(403, "You can only book visits for your own profile")
    v = Visit(patient_id=p.id, department_id=body.department_id, chief_complaint=body.chief_complaint,
              symptoms=body.symptoms, status="waiting", priority="routine")
    db.add(v); db.flush()
    audit(db, user.id, "create", "visit", v.id, f"Visit for {p.patient_code}")
    notify(db, "appointment", "New visit / appointment", f"{p.patient_code} — {body.chief_complaint[:80]}", role_target="triage", related_id=v.id)
    db.commit(); db.refresh(v)
    await hub.broadcast("queue_updated", {"reason": "new_visit", "visit": visit_to_dict(v)})
    return visit_to_dict(v)


@app.get("/api/queue")
def get_queue(status: str = "", priority: str = "", department_id: Optional[int] = None,
              search: str = "", db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Visit).options(joinedload(Visit.patient), joinedload(Visit.department)).filter(Visit.status.in_(["waiting", "called", "under_assessment", "registered"]))
    if user.role == "patient":
        own_ids = [r[0] for r in db.query(Patient.id).filter_by(user_id=user.id).all()]
        q = q.filter(Visit.patient_id.in_(own_ids or [-1]))
    if status:
        q = q.filter_by(status=status)
    if priority:
        q = q.filter_by(priority=priority)
    if department_id:
        q = q.filter_by(department_id=department_id)
    rows = q.all()
    if search:
        s = search.lower()
        rows = [v for v in rows if s in (v.patient.full_name if v.patient else "").lower() or s in (v.patient.patient_code if v.patient else "").lower()]
    order = {"emergency": 0, "urgent": 1, "semi_urgent": 2, "routine": 3}
    rows.sort(key=lambda v: (order.get(v.priority, 9), v.arrival_time or datetime.min))
    return [visit_to_dict(v) for v in rows]


@app.get("/api/visits/today")
def visits_today(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    today = date.today()
    start = datetime(today.year, today.month, today.day)
    rows = db.query(Visit).options(joinedload(Visit.patient), joinedload(Visit.department)).filter(Visit.arrival_time >= start).order_by(Visit.arrival_time.desc()).limit(500).all()
    return [visit_to_dict(v) for v in rows]


@app.patch("/api/queue/{vid}")
async def update_visit_status(vid: int, body: VisitStatusIn, db: Session = Depends(get_db), user: User = Depends(require_roles("admin", "doctor", "triage"))):
    v = db.get(Visit, vid)
    if not v:
        raise HTTPException(404, "Visit not found")
    if body.status not in ("registered", "waiting", "called", "under_assessment", "completed", "cancelled"):
        raise HTTPException(400, "Invalid status")
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    v.status = body.status
    if body.assigned_doctor_id:
        v.assigned_doctor_id = body.assigned_doctor_id
        d = db.get(Doctor, body.assigned_doctor_id)
        notify(db, "assignment", "Patient assigned", f"Visit #{vid} assigned to {d.full_name if d else 'doctor'}", role_target="doctor", related_id=vid)
    if body.status == "called":
        v.called_time = now
    if body.status == "under_assessment":
        v.started_time = now
        if v.arrival_time:
            v.waiting_minutes = max(0, int((now - v.arrival_time).total_seconds() // 60))
    if body.status == "completed":
        v.completed_time = now
        if v.arrival_time and v.waiting_minutes is None:
            v.waiting_minutes = max(0, int((now - v.arrival_time).total_seconds() // 60))
    if body.notes:
        v.notes = (v.notes + "\n" + body.notes) if v.notes else body.notes
    audit(db, user.id, "status", "visit", vid, f"-> {body.status}")
    db.commit()
    await hub.broadcast("queue_updated", {"reason": "status", "visit": visit_to_dict(v)})
    return visit_to_dict(v)


@app.post("/api/queue/{vid}/emergency")
async def escalate_emergency(vid: int, db: Session = Depends(get_db), user: User = Depends(require_roles("admin", "doctor", "triage", "emergency"))):
    v = db.get(Visit, vid)
    if not v:
        raise HTTPException(404, "Visit not found")
    v.priority = "emergency"
    v.status = "waiting" if v.status in ("registered",) else v.status
    audit(db, user.id, "emergency_escalation", "visit", vid, "Escalated to EMERGENCY by staff")
    notify(db, "emergency", "🚨 EMERGENCY case flagged", f"Visit #{vid} ({v.patient.full_name if v.patient else ''}) moved to emergency queue", role_target="doctor", related_id=vid)
    notify(db, "emergency", "🚨 EMERGENCY case flagged", f"Visit #{vid} requires immediate professional assessment", role_target="admin", related_id=vid)
    db.commit()
    await hub.broadcast("emergency", {"visit": visit_to_dict(v), "by": user.username})
    await hub.broadcast("queue_updated", {"reason": "emergency", "visit": visit_to_dict(v)})
    return visit_to_dict(v)


# ---------------- Triage ----------------
@app.post("/api/triage")
async def submit_triage(body: TriageIn, db: Session = Depends(get_db), user: User = Depends(require_roles("admin", "doctor", "triage", "emergency"))):
    v = db.get(Visit, body.visit_id)
    if not v:
        raise HTTPException(404, "Visit not found")
    p = db.get(Patient, v.patient_id)
    suggested, score, reasons = evaluate_triage({
        "chief_complaint": body.chief_complaint or v.chief_complaint,
        "symptoms": body.symptoms or v.symptoms,
        "temperature": body.temperature, "heart_rate": body.heart_rate,
        "sbp": body.sbp, "dbp": body.dbp, "respiratory_rate": body.respiratory_rate,
        "spo2": body.spo2, "consciousness": body.consciousness, "pain_score": body.pain_score,
        "age": p.age if p else None, "risk_factors": body.risk_factors,
        "warning_indicators": body.warning_indicators,
    })
    final = body.override_priority if body.override_priority in ("emergency", "urgent", "semi_urgent", "routine") else suggested
    t = db.query(TriageAssessment).filter_by(visit_id=v.id).first()
    if not t:
        t = TriageAssessment(visit_id=v.id, patient_id=v.patient_id, assessed_by=user.id)
        db.add(t)
    t.chief_complaint = body.chief_complaint; t.symptoms = body.symptoms
    t.temperature = body.temperature; t.heart_rate = body.heart_rate
    t.sbp = body.sbp; t.dbp = body.dbp; t.respiratory_rate = body.respiratory_rate; t.spo2 = body.spo2
    t.consciousness = body.consciousness; t.pain_score = body.pain_score
    t.risk_factors = json.dumps(body.risk_factors); t.warning_indicators = json.dumps(body.warning_indicators)
    t.notes = body.notes; t.suggested_priority = suggested; t.suggested_score = score
    t.suggested_reasons = json.dumps(reasons); t.final_priority = final
    t.override_reason = body.override_reason; t.assessed_by = user.id
    if body.chief_complaint:
        v.chief_complaint = body.chief_complaint
    if body.symptoms:
        v.symptoms = body.symptoms
    v.priority = final; v.priority_score = score; v.priority_reasons = json.dumps(reasons)
    if v.status == "registered":
        v.status = "waiting"
    audit(db, user.id, "triage", "visit", v.id,
          f"suggested={suggested} final={final} score={score}" + (f" override: {body.override_reason}" if body.override_priority else ""))
    if final == "emergency":
        notify(db, "emergency", "🚨 Emergency triage result", f"Visit #{v.id} triaged as EMERGENCY (score {score})", role_target="doctor", related_id=v.id)
    else:
        notify(db, "priority", "Triage completed", f"Visit #{v.id}: {PRIORITY_LABEL.get(final)} (score {score})", role_target="doctor", related_id=v.id)
    db.commit()
    payload = {"visit": visit_to_dict(v), "suggested_priority": suggested, "final_priority": final,
               "score": score, "reasons": reasons, "disclaimer": DISCLAIMER}
    await hub.broadcast("triage_completed", payload)
    await hub.broadcast("queue_updated", {"reason": "triage", "visit": visit_to_dict(v)})
    return payload


@app.get("/api/triage/rules")
def list_rules(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [{"id": r.id, "name": r.name, "category": r.category, "config": r.config, "points": r.points,
             "priority": r.priority, "description": r.description, "active": r.active} for r in db.query(TriageRule).order_by(TriageRule.id)]


@app.post("/api/triage/rules")
def create_rule(body: RuleIn, db: Session = Depends(get_db), user: User = Depends(require_roles("admin"))):
    r = TriageRule(**body.model_dump())
    db.add(r)
    audit(db, user.id, "create", "rule", None, body.name)
    db.commit(); db.refresh(r)
    return {"id": r.id}


@app.patch("/api/triage/rules/{rid}")
def update_rule(rid: int, body: dict, db: Session = Depends(get_db), user: User = Depends(require_roles("admin"))):
    r = db.get(TriageRule, rid)
    if not r:
        raise HTTPException(404, "Rule not found")
    for k in ("name", "category", "config", "points", "priority", "description", "active"):
        if k in body:
            setattr(r, k, body[k])
    audit(db, user.id, "update", "rule", rid, str(body)[:500])
    db.commit()
    return {"ok": True}


@app.get("/api/vitals/recent")
def recent_vitals(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(TriageAssessment).order_by(TriageAssessment.id.desc()).limit(20).all()
    return [{"id": t.id, "visit_id": t.visit_id, "temp": t.temperature, "hr": t.heart_rate,
             "sbp": t.sbp, "dbp": t.dbp, "rr": t.respiratory_rate, "spo2": t.spo2} for t in rows]


# ---------------- Resources ----------------
@app.get("/api/resources")
def list_resources(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [{"id": r.id, "ward_name": r.ward_name, "department_id": r.department_id, "resource_type": r.resource_type,
             "total": r.total, "occupied": r.occupied, "available": r.total - r.occupied} for r in db.query(HospitalResource).order_by(HospitalResource.id)]


@app.post("/api/resources")
def create_resource(body: ResourceIn, db: Session = Depends(get_db), user: User = Depends(require_roles("admin"))):
    r = HospitalResource(**body.model_dump())
    db.add(r); db.commit(); db.refresh(r)
    return {"id": r.id}


@app.patch("/api/resources/{rid}")
async def update_resource(rid: int, body: dict, db: Session = Depends(get_db), user: User = Depends(require_roles("admin", "triage", "doctor", "emergency"))):
    r = db.get(HospitalResource, rid)
    if not r:
        raise HTTPException(404, "Resource not found")
    for k in ("total", "occupied", "ward_name"):
        if k in body:
            setattr(r, k, body[k])
    audit(db, user.id, "update", "resource", rid, str(body)[:300])
    if r.total and r.occupied / r.total >= 0.9:
        notify(db, "resource", "Capacity threshold reached", f"{r.ward_name}: {r.occupied}/{r.total} occupied (≥90%)", role_target="admin", related_id=rid)
    db.commit()
    await hub.broadcast("resources_updated", {"id": r.id})
    return {"ok": True}


# ---------------- Notifications ----------------
@app.get("/api/notifications")
def list_notifications(unread_only: bool = False, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Notification).filter((Notification.user_id == user.id) | (Notification.role_target == user.role) | (Notification.role_target == ""))
    if unread_only:
        q = q.filter_by(is_read=False)
    rows = q.order_by(Notification.id.desc()).limit(100).all()
    return [{"id": n.id, "type": n.type, "title": n.title, "message": n.message, "is_read": n.is_read,
             "created_at": n.created_at.isoformat() if n.created_at else None, "related_id": n.related_id} for n in rows]


@app.post("/api/notifications/{nid}/read")
def mark_read(nid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    n = db.get(Notification, nid)
    if n:
        n.is_read = True
        db.commit()
    return {"ok": True}


@app.post("/api/notifications/read-all")
def mark_all_read(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(Notification).filter((Notification.user_id == user.id) | (Notification.role_target == user.role)).update({"is_read": True})
    db.commit()
    return {"ok": True}


# ---------------- Analytics ----------------
def _waiting_stats(db: Session, days: int = 30):
    since = datetime.now() - timedelta(days=days)
    waits = [w for (w,) in db.query(Visit.waiting_minutes).filter(Visit.waiting_minutes.isnot(None), Visit.arrival_time >= since).all()]
    import statistics
    if not waits:
        return {"mean": 0, "median": 0, "max": 0, "count": 0}
    return {"mean": round(statistics.mean(waits), 1), "median": round(statistics.median(waits), 1),
            "max": max(waits), "count": len(waits)}


@app.get("/api/analytics/overview")
def analytics_overview(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    today = date.today()
    start = datetime(today.year, today.month, today.day)
    total_today = db.query(Visit).filter(Visit.arrival_time >= start).count()
    by_priority = {p: db.query(Visit).filter(Visit.arrival_time >= start, Visit.priority == p).count()
                   for p in ("emergency", "urgent", "semi_urgent", "routine")}
    waiting = db.query(Visit).filter(Visit.status.in_(["waiting", "registered", "called"])).count()
    under = db.query(Visit).filter_by(status="under_assessment").count()
    completed = db.query(Visit).filter(Visit.arrival_time >= start, Visit.status == "completed").count()
    docs_avail = db.query(Doctor).filter_by(available=True).count()
    waits = _waiting_stats(db, 1)
    return {"total_today": total_today, "by_priority_today": by_priority, "waiting": waiting,
            "under_assessment": under, "completed_today": completed, "doctors_available": docs_avail,
            "avg_wait_today": waits["mean"], "waiting_stats_30d": _waiting_stats(db, 30)}


@app.get("/api/analytics/distributions")
def analytics_distributions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # by priority (all recent)
    since = datetime.now() - timedelta(days=30)
    pris = db.query(Visit.priority, func.count(Visit.id)).filter(Visit.arrival_time >= since).group_by(Visit.priority).all()
    deps = db.query(Department.name, func.count(Visit.id)).join(Visit, Visit.department_id == Department.id).filter(Visit.arrival_time >= since).group_by(Department.name).all()
    # hourly arrivals today
    today = date.today()
    start = datetime(today.year, today.month, today.day)
    rows = db.query(Visit.arrival_time).filter(Visit.arrival_time >= start).all()
    hours = [0] * 24
    for (a,) in rows:
        if a:
            hours[a.hour] += 1
    # daily volume 14 days
    daily = []
    for i in range(13, -1, -1):
        d = date.today() - timedelta(days=i)
        s = datetime(d.year, d.month, d.day)
        e = s + timedelta(days=1)
        daily.append({"date": d.isoformat(), "count": db.query(Visit).filter(Visit.arrival_time >= s, Visit.arrival_time < e).count()})
    # completed vs waiting today
    comp = db.query(Visit).filter(Visit.arrival_time >= start, Visit.status == "completed").count()
    wait = db.query(Visit).filter(Visit.arrival_time >= start, Visit.status.in_(["waiting", "registered", "called", "under_assessment"])).count()
    # dept workload (active queue per dept)
    wl = db.query(Department.name, func.count(Visit.id)).join(Visit, Visit.department_id == Department.id).filter(Visit.status.in_(["waiting", "called", "under_assessment", "registered"])).group_by(Department.name).all()
    # histogram of waits
    waits = [w for (w,) in db.query(Visit.waiting_minutes).filter(Visit.waiting_minutes.isnot(None)).limit(2000).all()]
    return {"by_priority": [{"name": PRIORITY_LABEL.get(p, p), "key": p, "value": c} for p, c in pris],
            "by_department": [{"name": n, "value": c} for n, c in deps],
            "hourly": [{"hour": f"{h:02d}:00", "count": c} for h, c in enumerate(hours)],
            "daily": daily, "completed_vs_waiting": [{"name": "Completed", "value": comp}, {"name": "Active", "value": wait}],
            "workload": [{"name": n, "value": c} for n, c in wl], "waits_sample": waits[:1000]}


@app.get("/api/analytics/trends")
def analytics_trends(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    out = []
    for i in range(29, -1, -1):
        d = date.today() - timedelta(days=i)
        s = datetime(d.year, d.month, d.day)
        e = s + timedelta(days=1)
        c = db.query(Visit).filter(Visit.arrival_time >= s, Visit.arrival_time < e).count()
        out.append({"date": d.isoformat(), "arrivals": c})
    return out


# ---------------- ML ----------------
def _ml_rows(db: Session) -> list:
    rows = db.query(Visit).filter(Visit.waiting_minutes.isnot(None)).order_by(Visit.id.desc()).limit(3000).all()
    docs_avail = db.query(Doctor).filter_by(available=True).count() or 1
    data = []
    for v in rows:
        h = v.arrival_time.hour if v.arrival_time else 12
        data.append({
            "queue_size": 5 + (h % 6),  # approx from arrival hour pattern in demo data
            "priority_code": {"emergency": 0, "urgent": 1, "semi_urgent": 2, "routine": 3}.get(v.priority, 3),
            "dept_load": (v.department_id or 1) % 5 + 2,
            "hour": h,
            "doctors_available": docs_avail,
            "is_emergency_hour": 1 if h < 6 or h >= 22 else 0,
            "waiting_minutes": v.waiting_minutes or 15,
        })
    return data


@app.post("/api/analytics/ml/train")
def ml_train(db: Session = Depends(get_db), user: User = Depends(require_roles("admin", "doctor"))):
    m = ml_module.train(_ml_rows(db))
    audit(db, user.id, "ml_train", "model", None, str(m)[:500])
    db.commit()
    return m


@app.get("/api/analytics/ml/metrics")
def ml_metrics(user: User = Depends(get_current_user)):
    m = ml_module.metrics()
    if m.get("status") == "not-trained":
        # auto-train lazily on first read needs db; return hint
        return {"status": "not-trained", "hint": "POST /api/analytics/ml/train to train"}
    return m


@app.post("/api/analytics/ml/predict")
def ml_predict(body: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # ensure trained
    if ml_module.metrics().get("status") != "trained":
        ml_module.train(_ml_rows(db))
    active = db.query(Visit).filter(Visit.status.in_(["waiting", "called", "under_assessment", "registered"])).count()
    docs_avail = db.query(Doctor).filter_by(available=True).count()
    feats = {
        "queue_size": body.get("queue_size", active),
        "priority_code": {"emergency": 0, "urgent": 1, "semi_urgent": 2, "routine": 3}.get(body.get("priority", "routine"), 3),
        "dept_load": body.get("dept_load", 3),
        "hour": body.get("hour", datetime.now().hour),
        "doctors_available": docs_avail,
        "is_emergency_hour": 1 if datetime.now().hour < 6 or datetime.now().hour >= 22 else 0,
    }
    r = ml_module.predict(feats)
    r["disclaimer"] = "Estimate only — not a medical decision."
    r["features"] = feats
    return r


# ---------------- Reports ----------------
@app.get("/api/reports/daily")
def report_daily(format: str = "json", db: Session = Depends(get_db), user: User = Depends(require_roles("admin", "doctor", "triage"))):
    today = date.today()
    start = datetime(today.year, today.month, today.day)
    rows = db.query(Visit).options(joinedload(Visit.patient), joinedload(Visit.department)).filter(Visit.arrival_time >= start).order_by(Visit.arrival_time).all()
    data = [visit_to_dict(v) for v in rows]
    if format == "csv":
        buf = io.StringIO()
        w = csv.DictWriter(buf, fieldnames=["id", "patient_code", "patient_name", "department", "priority", "status", "arrival_time", "waiting_minutes"])
        w.writeheader()
        for v in data:
            w.writerow({k: v.get(k, "") for k in w.fieldnames})
        return Response(content=buf.getvalue(), media_type="text/csv",
                        headers={"Content-Disposition": "attachment; filename=daily_report.csv"})
    if format == "excel":
        from openpyxl import Workbook
        wb = Workbook(); ws = wb.active; ws.title = "Daily Report"
        ws.append(["ID", "Patient", "Name", "Department", "Priority", "Status", "Arrival", "Wait(min)"])
        for v in data:
            ws.append([v["id"], v["patient_code"], v["patient_name"], v["department"], v["priority"], v["status"], v["arrival_time"], v.get("waiting_minutes") or ""])
        buf = io.BytesIO(); wb.save(buf)
        return Response(content=buf.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        headers={"Content-Disposition": "attachment; filename=daily_report.xlsx"})
    if format == "pdf":
        from fpdf import FPDF
        def _safe(s: str) -> str:
            return str(s).replace("\u2014", "-").replace("\u2013", "-").encode("latin-1", "replace").decode("latin-1")
        pdf = FPDF(); pdf.add_page(); pdf.set_font("Helvetica", "B", 14)
        pdf.cell(0, 10, "Daily Patient Report (Synthetic Demo Data)", new_x="LMARGIN", new_y="NEXT")
        pdf.set_font("Helvetica", "", 9)
        pdf.cell(0, 8, _safe(f"Date: {today.isoformat()}  |  Total: {len(data)}  |  Decision-support system - not a diagnosis."), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(2)
        for v in data[:80]:
            pdf.cell(0, 5, _safe(f"{v['patient_code']} {v['patient_name'][:22]:22} {v['department'][:16]:16} {v['priority']:12} {v['status']}"), new_x="LMARGIN", new_y="NEXT")
        return Response(content=bytes(pdf.output()), media_type="application/pdf",
                        headers={"Content-Disposition": "attachment; filename=daily_report.pdf"})
    return {"date": today.isoformat(), "count": len(data), "items": data, "synthetic_data": True}


@app.get("/api/reports/summary")
def report_summary(db: Session = Depends(get_db), user: User = Depends(require_roles("admin", "doctor", "triage"))):
    since = datetime.now() - timedelta(days=30)
    total = db.query(Visit).filter(Visit.arrival_time >= since).count()
    pris = db.query(Visit.priority, func.count(Visit.id)).filter(Visit.arrival_time >= since).group_by(Visit.priority).all()
    res = db.query(HospitalResource).all()
    return {"period": "last_30_days", "total_visits": total,
            "priority_distribution": {p: c for p, c in pris},
            "resources": [{"ward": r.ward_name, "total": r.total, "occupied": r.occupied} for r in res],
            "waiting": _waiting_stats(db, 30), "synthetic_data": True}


@app.get("/api/audit")
def list_audit(limit: int = 100, db: Session = Depends(get_db), user: User = Depends(require_roles("admin"))):
    rows = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(min(limit, 500)).all()
    return [{"id": l.id, "user_id": l.user_id, "action": l.action, "entity": l.entity, "entity_id": l.entity_id,
             "details": l.details, "at": l.created_at.isoformat() if l.created_at else None} for l in rows]


# ---------------- WebSocket ----------------
@app.websocket("/ws/live")
async def ws_live(ws: WebSocket):
    await hub.connect(ws)
    try:
        await ws.send_json({"event": "connected", "data": {"disclaimer": DISCLAIMER}})
        while True:
            await ws.receive_text()  # heartbeat / ignore
    except WebSocketDisconnect:
        hub.drop(ws)
    except Exception:
        hub.drop(ws)


# ---------------- Seed helper (demo) ----------------
@app.post("/api/admin/seed")
def admin_seed(db: Session = Depends(get_db), user: User = Depends(require_roles("admin"))):
    from .seed_eco import seed_eco
    out = seed_eco(db)
    return {"status": "seeded", **out}
