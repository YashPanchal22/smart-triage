"""Role-based care modules: overviews, nursing tasks, consultations, referrals,
laboratory, pharmacy, and super-admin system management. One shared backend/DB."""
import json
import os
from datetime import date, datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from .database import get_db, Base
from .auth import get_current_user, require_roles
from .live import hub
from .models import (
    User, Patient, Doctor, Nurse, Department, Visit, Appointment, TriageAssessment,
    NurseTask, Consultation, LabOrder, LabResult, PharmacyItem, PharmacyOrder,
    SystemSetting, Notification, AuditLog, BloodInventory, BloodRequest,
    EmergencyRequest, Ambulance, Bed, HospitalResource,
)

router = APIRouter()
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads", "lab")
os.makedirs(UPLOAD_DIR, exist_ok=True)

LAB_CATALOG = ["CBC (Complete Blood Count)", "Blood Sugar (Fasting)", "HbA1c", "Lipid Profile", "Liver Function (LFT)",
               "Kidney Function (KFT)", "Urine Routine", "Thyroid (TSH)", "ECG", "X-Ray Chest", "Ultrasound Abdomen",
               "Dengue NS1", "Malaria Antigen", "COVID RT-PCR", "CRP", "ESR"]


def _audit(db, user_id, action, entity="", entity_id=None, details=""):
    db.add(AuditLog(user_id=user_id, action=action, entity=entity, entity_id=entity_id, details=str(details)[:2000]))


def _notify(db, type, title, message, role_target="", user_id=None, related_id=None):
    n = Notification(type=type, title=title, message=message, role_target=role_target, user_id=user_id, related_id=related_id)
    db.add(n); db.flush()
    return n


def _my_patient_ids(db, user) -> list:
    return [p.id for p in db.query(Patient).filter_by(user_id=user.id).all()]


# ================= PATIENT OVERVIEW =================
@router.get("/api/patient/overview")
def patient_overview(db: Session = Depends(get_db), user: User = Depends(require_roles("patient", "admin", "superadmin"))):
    myp = _my_patient_ids(db, user)
    if user.role == "patient" and not myp:
        return {"linked": False, "hint": "No patient profile linked yet — register one in Patients."}
    pid = myp[0] if myp else None
    upcoming = db.query(Appointment).options(joinedload(Appointment.doctor), joinedload(Appointment.department)).filter(
        Appointment.patient_id.in_(myp or [-1]), Appointment.date >= date.today(),
        Appointment.status.in_(["requested", "confirmed", "rescheduled"])).order_by(Appointment.date).first()
    active_visits = db.query(Visit).options(joinedload(Visit.department)).filter(
        Visit.patient_id.in_(myp or [-1]), Visit.status.in_(["registered", "waiting", "called", "under_assessment"])).order_by(Visit.arrival_time.desc()).all()
    # queue position among active queue (priority order)
    order = {"emergency": 0, "urgent": 1, "semi_urgent": 2, "routine": 3}
    qall = db.query(Visit).filter(Visit.status.in_(["registered", "waiting", "called", "under_assessment"])).all()
    qall.sort(key=lambda v: (order.get(v.priority, 9), v.arrival_time or datetime.min))
    pos = next((i + 1 for i, v in enumerate(qall) if v.patient_id in (myp or [])), None)
    last = db.query(Visit).options(joinedload(Visit.department)).filter(Visit.patient_id.in_(myp or [-1])).order_by(Visit.id.desc()).first()
    unread = db.query(Notification).filter((Notification.user_id == user.id) | (Notification.role_target == "patient") | (Notification.role_target == ""), Notification.is_read == False).count()  # noqa: E712
    return {
        "linked": True,
        "upcoming": {"doctor": upcoming.doctor.full_name if upcoming and upcoming.doctor else "", "dept": upcoming.department.name if upcoming and upcoming.department else "",
                     "date": upcoming.date.isoformat() if upcoming else "", "slot": upcoming.time_slot if upcoming else "", "status": upcoming.status if upcoming else ""} if upcoming else None,
        "queue_position": pos, "queue_total": len(qall),
        "active_visits": [{"id": v.id, "status": v.status, "priority": v.priority, "dept": v.department.name if v.department else "", "complaint": v.chief_complaint} for v in active_visits],
        "last_visit": {"date": last.arrival_time.isoformat()[:10] if last and last.arrival_time else "", "dept": last.department.name if last and last.department else "", "status": last.status if last else ""} if last else None,
        "unread": unread,
    }


# ================= DOCTOR OVERVIEW =================
@router.get("/api/doctor/overview")
def doctor_overview(db: Session = Depends(get_db), user: User = Depends(require_roles("doctor", "admin", "superadmin"))):
    today = date.today()
    start = datetime(today.year, today.month, today.day)
    mine = db.query(Visit).filter(Visit.arrival_time >= start)
    myq = db.query(Visit).options(joinedload(Visit.patient), joinedload(Visit.department)).filter(Visit.status.in_(["waiting", "called", "under_assessment", "registered"])).all()
    order = {"emergency": 0, "urgent": 1, "semi_urgent": 2, "routine": 3}
    myq.sort(key=lambda v: (order.get(v.priority, 9), v.arrival_time or datetime.min))
    lab_pending = db.query(LabOrder).filter(LabOrder.status.in_(["requested", "sample_collected", "processing"])).count()
    lab_ready = db.query(LabOrder).filter_by(status="completed").count()
    appts = db.query(Appointment).filter_by(date=today).count()
    return {
        "today_total": mine.count(),
        "waiting": sum(1 for v in myq if v.status in ("waiting", "registered", "called")),
        "emergency": sum(1 for v in myq if v.priority == "emergency"),
        "completed_today": db.query(Visit).filter(Visit.arrival_time >= start, Visit.status == "completed").count(),
        "appointments_today": appts, "lab_pending": lab_pending, "lab_ready": lab_ready,
        "queue": [{"id": v.id, "patient": v.patient.full_name if v.patient else "", "code": v.patient.patient_code if v.patient else "",
                   "priority": v.priority, "dept": v.department.name if v.department else "", "status": v.status,
                   "wait": int(((datetime.now() - (v.arrival_time or datetime.now())).total_seconds() // 60))} for v in myq[:12]],
    }


# ================= NURSE OVERVIEW =================
@router.get("/api/nurse/overview")
def nurse_overview(db: Session = Depends(get_db), user: User = Depends(require_roles("nurse", "triage", "admin", "superadmin"))):
    active = db.query(Visit).filter(Visit.status.in_(["registered", "waiting", "called", "under_assessment"])).all()
    no_triage = [v for v in active if not db.query(TriageAssessment).filter_by(visit_id=v.id).first()]
    triaged_no_vitals = db.query(TriageAssessment).filter(TriageAssessment.heart_rate.is_(None), TriageAssessment.spo2.is_(None)).count()
    tasks_open = db.query(NurseTask).filter_by(status="pending").count()
    high = sum(1 for v in active if v.priority in ("emergency", "urgent"))
    beds_av = db.query(Bed).filter_by(status="available").count()
    return {"assigned": len(active), "waiting_triage": len(no_triage), "vitals_pending": triaged_no_vitals,
            "tasks_open": tasks_open, "high_priority": high, "beds_available": beds_av,
            "triage_waitlist": [{"id": v.id, "patient_id": v.patient_id, "complaint": v.chief_complaint} for v in no_triage[:10]]}


# ================= PHARMACY / LAB / SUPERADMIN OVERVIEWS =================
@router.get("/api/pharmacy/overview")
def pharm_overview(db: Session = Depends(get_db), user: User = Depends(require_roles("pharmacy", "admin", "superadmin", "doctor"))):
    items = db.query(PharmacyItem).all()
    low = [i for i in items if i.quantity <= i.reorder_level]
    soon = date.today() + timedelta(days=90)
    exp = [i for i in items if i.expiry and i.expiry <= soon]
    pend = db.query(PharmacyOrder).filter_by(status="pending").count()
    return {"total_items": len(items), "total_units": sum(i.quantity for i in items), "low_stock": len(low),
            "expiring_soon": len(exp), "pending_orders": pend,
            "low_list": [{"id": i.id, "name": i.name, "qty": i.quantity} for i in low[:8]],
            "expiring_list": [{"id": i.id, "name": i.name, "batch": i.batch_no, "expiry": i.expiry.isoformat() if i.expiry else ""} for i in sorted(exp, key=lambda x: x.expiry or date.max)[:8]]}


@router.get("/api/lab/overview")
def lab_overview(db: Session = Depends(get_db), user: User = Depends(require_roles("lab", "admin", "superadmin", "doctor"))):
    by = {s: db.query(LabOrder).filter_by(status=s).count() for s in ("requested", "sample_collected", "processing", "completed", "reviewed")}
    today = date.today()
    start = datetime(today.year, today.month, today.day)
    done_today = db.query(LabOrder).filter(LabOrder.created_at >= start, LabOrder.status.in_(["completed", "reviewed"])).count()
    by_test = db.query(LabOrder.test_name, func.count(LabOrder.id)).group_by(LabOrder.test_name).order_by(func.count(LabOrder.id).desc()).limit(8).all()
    return {"by_status": by, "pending_total": by["requested"] + by["sample_collected"] + by["processing"],
            "done_today": done_today, "by_test": [{"name": n, "value": c} for n, c in by_test]}


@router.get("/api/superadmin/overview")
def super_overview(db: Session = Depends(get_db), user: User = Depends(require_roles("superadmin"))):
    roles = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    total = db.query(User).count()
    active = db.query(User).filter_by(is_active=True).count()
    tables = {t.name: db.query(t).count() for t in Base.metadata.sorted_tables if t.name not in ("alembic_version",)}
    recent_audit = db.query(AuditLog).order_by(AuditLog.id.desc()).limit(8).all()
    return {"users_total": total, "users_active": active, "by_role": [{"role": r, "count": c} for r, c in roles],
            "tables": tables,
            "recent_audit": [{"action": a.action, "entity": a.entity, "at": a.created_at.isoformat() if a.created_at else None} for a in recent_audit]}


# ================= NURSING TASKS =================
class TaskIn(BaseModel):
    visit_id: Optional[int] = None
    patient_id: Optional[int] = None
    title: str
    category: str = "general"
    assigned_to: str = ""
    notes: str = ""


@router.get("/api/tasks")
def list_tasks(status: str = "", db: Session = Depends(get_db), user: User = Depends(require_roles("nurse", "triage", "admin", "superadmin", "doctor"))):
    q = db.query(NurseTask).options(joinedload(NurseTask.patient))
    if status:
        q = q.filter_by(status=status)
    rows = q.order_by(NurseTask.id.desc()).limit(300).all()
    return [{"id": t.id, "visit_id": t.visit_id, "patient_id": t.patient_id, "patient": t.patient.full_name if t.patient else "",
             "code": t.patient.patient_code if t.patient else "", "title": t.title, "category": t.category, "status": t.status,
             "assigned_to": t.assigned_to, "notes": t.notes} for t in rows]


@router.post("/api/tasks")
async def create_task(body: TaskIn, db: Session = Depends(get_db), user: User = Depends(require_roles("nurse", "triage", "admin", "superadmin", "doctor"))):
    t = NurseTask(**body.model_dump(), status="pending", created_by=user.id)
    db.add(t); db.flush()
    _notify(db, "info", "New nursing task", body.title[:100], role_target="nurse", related_id=t.id)
    db.commit(); db.refresh(t)
    await hub.broadcast("tasks_updated", {"id": t.id})
    return {"id": t.id}


@router.patch("/api/tasks/{tid}")
async def patch_task(tid: int, body: dict, db: Session = Depends(get_db), user: User = Depends(require_roles("nurse", "triage", "admin", "superadmin"))):
    t = db.get(NurseTask, tid)
    if not t:
        raise HTTPException(404, "Task not found")
    if body.get("status") in ("pending", "done", "cancelled"):
        t.status = body["status"]
    for k in ("title", "notes", "assigned_to"):
        if k in body:
            setattr(t, k, body[k])
    _audit(db, user.id, "update", "nurse_task", tid, t.status)
    db.commit()
    await hub.broadcast("tasks_updated", {"id": tid})
    return {"ok": True}


# ================= CONSULTATIONS + REFERRAL =================
class ConsIn(BaseModel):
    visit_id: int
    notes: str
    status: str = "open"


@router.get("/api/consultations")
def list_cons(visit_id: Optional[int] = None, db: Session = Depends(get_db), user: User = Depends(require_roles("doctor", "admin", "superadmin", "nurse", "triage"))):
    q = db.query(Consultation).options(joinedload(Consultation.patient))
    if visit_id:
        q = q.filter_by(visit_id=visit_id)
    if user.role in ("nurse", "triage"):
        pass  # nurses see notes for care continuity (assigned-ward model in full deployment)
    rows = q.order_by(Consultation.id.desc()).limit(300).all()
    return [{"id": c.id, "visit_id": c.visit_id, "patient": c.patient.full_name if c.patient else "", "code": c.patient.patient_code if c.patient else "",
             "doctor": c.doctor_name, "notes": c.notes, "status": c.status, "at": c.created_at.isoformat() if c.created_at else None} for c in rows]


@router.post("/api/consultations")
async def create_cons(body: ConsIn, db: Session = Depends(get_db), user: User = Depends(require_roles("doctor", "admin", "superadmin"))):
    v = db.get(Visit, body.visit_id)
    if not v:
        raise HTTPException(404, "Visit not found")
    c = Consultation(visit_id=v.id, patient_id=v.patient_id, doctor_name=user.full_name, notes=body.notes[:2000], status=body.status, created_by=user.id)
    db.add(c)
    v.notes = ((v.notes + "\n" if v.notes else "") + f"[{user.full_name}] {body.notes[:500]}")[:4000]
    db.flush()
    _audit(db, user.id, "create", "consultation", c.id, f"visit {v.id}")
    _notify(db, "info", "Consultation note added", f"Visit #{v.id} — {body.notes[:80]}", role_target="nurse", related_id=v.id)
    db.commit(); db.refresh(c)
    await hub.broadcast("consultation_added", {"visit_id": v.id})
    return {"id": c.id}


@router.patch("/api/consultations/{cid}")
def patch_cons(cid: int, body: dict, db: Session = Depends(get_db), user: User = Depends(require_roles("doctor", "admin", "superadmin"))):
    c = db.get(Consultation, cid)
    if not c:
        raise HTTPException(404, "Not found")
    if body.get("status") in ("open", "closed"):
        c.status = body["status"]
    if body.get("notes"):
        c.notes = body["notes"][:2000]
    db.commit()
    return {"ok": True}


class ReferIn(BaseModel):
    department_id: int
    note: str = ""


@router.post("/api/visits/{vid}/refer")
async def refer_visit(vid: int, body: ReferIn, db: Session = Depends(get_db), user: User = Depends(require_roles("doctor", "admin", "superadmin"))):
    v = db.get(Visit, vid)
    d = db.get(Department, body.department_id)
    if not v or not d:
        raise HTTPException(404, "Visit or department not found")
    v.department_id = d.id
    v.notes = ((v.notes + "\n" if v.notes else "") + f"Referred to {d.name} by {user.full_name}: {body.note}")[:4000]
    _audit(db, user.id, "refer", "visit", vid, d.name)
    _notify(db, "info", f"Patient referred to {d.name}", f"Visit #{vid}", role_target="doctor", related_id=vid)
    db.commit()
    await hub.broadcast("queue_updated", {"reason": "referral", "visit_id": vid})
    return {"ok": True, "department": d.name}


# ================= LABORATORY =================
@router.get("/api/lab/catalog")
def lab_catalog(user: User = Depends(get_current_user)):
    return LAB_CATALOG


class LabOrderIn(BaseModel):
    visit_id: Optional[int] = None
    patient_id: int
    test_name: str
    priority: str = "routine"
    notes: str = ""


@router.get("/api/lab/orders")
def list_lab_orders(status: str = "", db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(LabOrder).options(joinedload(LabOrder.patient))
    if user.role == "patient":
        q = q.filter(LabOrder.patient_id.in_(_my_patient_ids(db, user) or [-1]))
    if status:
        q = q.filter_by(status=status)
    rows = q.order_by(LabOrder.id.desc()).limit(400).all()
    out = []
    for o in rows:
        r = db.query(LabResult).filter_by(order_id=o.id).first()
        show_result = user.role in ("lab", "admin", "superadmin", "doctor") or (user.role == "patient" and r and r.reviewed) or (user.role in ("nurse", "triage") and r and r.reviewed)
        out.append({"id": o.id, "visit_id": o.visit_id, "patient": o.patient.full_name if o.patient else "", "code": o.patient.patient_code if o.patient else "",
                    "test": o.test_name, "priority": o.priority, "status": o.status, "notes": o.notes,
                    "at": o.created_at.isoformat() if o.created_at else None,
                    "result": {"text": r.result_text, "reviewed": r.reviewed, "attachment": r.attachment} if (r and show_result) else None})
    return out


@router.post("/api/lab/orders")
async def create_lab_order(body: LabOrderIn, db: Session = Depends(get_db), user: User = Depends(require_roles("doctor", "admin", "superadmin", "nurse", "triage"))):
    if body.test_name not in LAB_CATALOG:
        raise HTTPException(400, "Unknown test — use catalog")
    o = LabOrder(**body.model_dump(), status="requested", ordered_by=user.id)
    db.add(o); db.flush()
    _notify(db, "info", "🧪 New test request", f"{body.test_name} for patient #{body.patient_id}", role_target="lab", related_id=o.id)
    _audit(db, user.id, "create", "lab_order", o.id, body.test_name)
    db.commit(); db.refresh(o)
    await hub.broadcast("lab_updated", {"reason": "created", "id": o.id})
    return {"id": o.id}


@router.patch("/api/lab/orders/{oid}")
async def patch_lab_order(oid: int, body: dict, db: Session = Depends(get_db), user: User = Depends(require_roles("lab", "admin", "superadmin"))):
    o = db.get(LabOrder, oid)
    if not o:
        raise HTTPException(404, "Order not found")
    if body.get("status") in ("requested", "sample_collected", "processing", "completed", "reviewed", "cancelled"):
        o.status = body["status"]
        if body["status"] in ("sample_collected", "processing"):
            _notify(db, "info", "📋 Sample update", f"Order #{oid} → {body['status']}", role_target="doctor", related_id=oid)
    db.commit()
    await hub.broadcast("lab_updated", {"reason": "status", "id": oid})
    return {"ok": True}


class LabResultIn(BaseModel):
    result_text: str
    values_json: str = "{}"


@router.post("/api/lab/orders/{oid}/result")
async def save_lab_result(oid: int, body: LabResultIn, db: Session = Depends(get_db), user: User = Depends(require_roles("lab", "admin", "superadmin"))):
    o = db.get(LabOrder, oid)
    if not o:
        raise HTTPException(404, "Order not found")
    r = db.query(LabResult).filter_by(order_id=oid).first()
    if not r:
        r = LabResult(order_id=oid, recorded_by=user.id)
        db.add(r)
    r.result_text = body.result_text[:4000]
    r.values_json = body.values_json[:2000]
    r.recorded_by = user.id
    o.status = "completed"
    _notify(db, "info", "🔔 Lab report available", f"Order #{oid} {o.test_name} completed", role_target="doctor", related_id=oid)
    _audit(db, user.id, "create", "lab_result", oid, o.test_name)
    db.commit()
    await hub.broadcast("lab_updated", {"reason": "result", "id": oid})
    return {"ok": True}


@router.post("/api/lab/orders/{oid}/review")
async def review_lab_result(oid: int, db: Session = Depends(get_db), user: User = Depends(require_roles("lab", "admin", "superadmin", "doctor"))):
    o = db.get(LabOrder, oid)
    r = db.query(LabResult).filter_by(order_id=oid).first()
    if not o or not r:
        raise HTTPException(404, "Result not found")
    r.reviewed = True
    o.status = "reviewed"
    db.commit()
    await hub.broadcast("lab_updated", {"reason": "reviewed", "id": oid})
    return {"ok": True}


@router.post("/api/lab/results/{oid}/upload")
async def upload_lab_file(oid: int, file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(require_roles("lab", "admin", "superadmin"))):
    r = db.query(LabResult).filter_by(order_id=oid).first()
    if not r:
        raise HTTPException(404, "Save a result first")
    safe = f"lab_{oid}_" + "".join(c for c in (file.filename or "report") if c.isalnum() or c in "._-")[:60]
    path = os.path.join(UPLOAD_DIR, safe)
    with open(path, "wb") as f:
        f.write(await file.read())
    r.attachment = safe
    db.commit()
    return {"ok": True, "file": safe}


@router.get("/api/lab/files/{name}")
def get_lab_file(name: str, user: User = Depends(require_roles("lab", "admin", "superadmin", "doctor"))):
    path = os.path.join(UPLOAD_DIR, name)
    if not os.path.isfile(path):
        raise HTTPException(404, "File not found")
    return FileResponse(path)


# ================= PHARMACY =================
class ItemIn(BaseModel):
    name: str
    batch_no: str = ""
    quantity: int = 0
    unit: str = "strips"
    expiry: Optional[date] = None
    reorder_level: int = 20
    medicine_id: Optional[int] = None


@router.get("/api/pharmacy/items")
def list_items(search: str = "", low_only: bool = False, expiring_days: int = 0, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role not in ("pharmacy", "admin", "superadmin", "doctor", "nurse", "triage"):
        raise HTTPException(403, "Requires pharmacy access")
    q = db.query(PharmacyItem)
    if search:
        q = q.filter(PharmacyItem.name.ilike(f"%{search}%"))
    rows = q.order_by(PharmacyItem.name).limit(500).all()
    if low_only:
        rows = [r for r in rows if r.quantity <= r.reorder_level]
    if expiring_days:
        cutoff = date.today() + timedelta(days=expiring_days)
        rows = [r for r in rows if r.expiry and r.expiry <= cutoff]
    return [{"id": r.id, "name": r.name, "batch": r.batch_no, "qty": r.quantity, "unit": r.unit,
             "expiry": r.expiry.isoformat() if r.expiry else "", "reorder": r.reorder_level,
             "low": r.quantity <= r.reorder_level} for r in rows]


@router.post("/api/pharmacy/items")
def create_item(body: ItemIn, db: Session = Depends(get_db), user: User = Depends(require_roles("pharmacy", "admin", "superadmin"))):
    it = PharmacyItem(**body.model_dump())
    db.add(it)
    _audit(db, user.id, "create", "pharmacy_item", None, body.name)
    db.commit(); db.refresh(it)
    return {"id": it.id}


@router.patch("/api/pharmacy/items/{iid}")
async def patch_item(iid: int, body: dict, db: Session = Depends(get_db), user: User = Depends(require_roles("pharmacy", "admin", "superadmin"))):
    it = db.get(PharmacyItem, iid)
    if not it:
        raise HTTPException(404, "Item not found")
    for k in ("quantity", "batch_no", "reorder_level", "unit"):
        if k in body:
            setattr(it, k, body[k])
    if body.get("expiry"):
        it.expiry = date.fromisoformat(body["expiry"])
    if it.quantity <= it.reorder_level:
        _notify(db, "resource", "⚠️ Medicine stock low", f"{it.name} ({it.batch_no}): {it.quantity} left", role_target="pharmacy", related_id=iid)
    _audit(db, user.id, "update", "pharmacy_item", iid, f"qty={it.quantity}")
    db.commit()
    await hub.broadcast("pharmacy_updated", {"id": iid})
    return {"ok": True}


class POrderIn(BaseModel):
    visit_id: Optional[int] = None
    patient_id: int
    items: List[dict] = []  # [{name, qty}] — entered by authorized staff from a human prescription


@router.get("/api/pharmacy/orders")
def list_porders(status: str = "", db: Session = Depends(get_db), user: User = Depends(require_roles("pharmacy", "admin", "superadmin", "doctor", "nurse", "triage"))):
    q = db.query(PharmacyOrder).options(joinedload(PharmacyOrder.patient))
    if status:
        q = q.filter_by(status=status)
    rows = q.order_by(PharmacyOrder.id.desc()).limit(400).all()
    out = []
    for o in rows:
        try:
            items = json.loads(o.items_json or "[]")
        except Exception:
            items = []
        out.append({"id": o.id, "visit_id": o.visit_id, "patient": o.patient.full_name if o.patient else "", "code": o.patient.patient_code if o.patient else "",
                    "items": items, "status": o.status, "at": o.created_at.isoformat() if o.created_at else None})
    return out


@router.post("/api/pharmacy/orders")
async def create_porder(body: POrderIn, db: Session = Depends(get_db), user: User = Depends(require_roles("doctor", "admin", "superadmin", "pharmacy"))):
    o = PharmacyOrder(visit_id=body.visit_id, patient_id=body.patient_id, items_json=json.dumps(body.items), status="pending", ordered_by=user.id)
    db.add(o); db.flush()
    _notify(db, "info", "New pharmacy order", f"Order #{o.id} for patient #{body.patient_id}", role_target="pharmacy", related_id=o.id)
    db.commit(); db.refresh(o)
    await hub.broadcast("pharmacy_updated", {"reason": "order"})
    return {"id": o.id}


@router.patch("/api/pharmacy/orders/{oid}")
async def patch_porder(oid: int, body: dict, db: Session = Depends(get_db), user: User = Depends(require_roles("pharmacy", "admin", "superadmin"))):
    o = db.get(PharmacyOrder, oid)
    if not o:
        raise HTTPException(404, "Order not found")
    st = body.get("status")
    if st not in ("pending", "dispensing", "dispensed", "cancelled"):
        raise HTTPException(400, "Invalid status")
    if st == "dispensed":
        try:
            items = json.loads(o.items_json or "[]")
        except Exception:
            items = []
        for it in items:
            row = db.query(PharmacyItem).filter(PharmacyItem.name.ilike(it.get("name", ""))).order_by(PharmacyItem.expiry).first()
            if row and row.quantity >= int(it.get("qty", 0)):
                row.quantity -= int(it.get("qty", 0))
    o.status = st
    _audit(db, user.id, "update", "pharmacy_order", oid, st)
    db.commit()
    await hub.broadcast("pharmacy_updated", {"reason": "status"})
    return {"ok": True}


# ================= NURSES (admin) =================
@router.get("/api/nurses")
def list_nurses(db: Session = Depends(get_db), user: User = Depends(require_roles("admin", "superadmin"))):
    rows = db.query(Nurse).order_by(Nurse.full_name).limit(300).all()
    return [{"id": n.id, "full_name": n.full_name, "department": n.department.name if n.department else "", "license_no": n.license_no, "phone": n.phone, "on_duty": n.on_duty} for n in rows]


# ================= SUPERADMIN: USERS / PERMISSIONS / SYSTEM =================
PERMISSIONS_MATRIX = [
    ["Own Profile", 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ["Patient Registration", 0, "Limited", 1, "Limited", 0, 0, 0, 1, 1],
    ["Triage", 0, "Review", 1, "Emergency", 0, 0, 0, "Manage", "Manage"],
    ["Doctor Queue", "Own status", 1, 1, "Emergency", 0, 0, 0, 1, 1],
    ["Patient Records", "Own", "Assigned", "Assigned", "Emergency", "Relevant", "Relevant", "Relevant", 1, 1],
    ["Appointments", "Own", "Assigned", "View", "Emergency", 0, 0, 0, 1, 1],
    ["Blood Inventory", 0, "View relevant", 0, "View relevant", 1, 0, 0, 1, 1],
    ["Pharmacy", 0, "Relevant", "Relevant", 0, 0, 1, 0, 1, 1],
    ["Lab", "Own results", "Request/View", "View as permitted", "Emergency", 0, 0, 1, 1, 1],
    ["Hospital Analytics", 0, "Own", "Nursing", "Emergency", "Blood", "Pharmacy", "Lab", 1, 1],
    ["User Management", 0, 0, 0, 0, 0, 0, 0, "Limited", 1],
    ["System Settings", 0, 0, 0, 0, 0, 0, 0, "Limited", 1],
]
MATRIX_ROLES = ["patient", "doctor", "nurse", "emergency", "blood", "pharmacy", "lab", "admin", "superadmin"]


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str


@router.get("/api/admin/users")
def admin_list_users(role: str = "", db: Session = Depends(get_db), user: User = Depends(require_roles("admin", "superadmin"))):
    from .auth import hash_password as _h  # noqa
    q = db.query(User)
    if role:
        q = q.filter_by(role=role)
    rows = q.order_by(User.id.desc()).limit(500).all()
    return [{"id": u.id, "username": u.username, "email": u.email, "full_name": u.full_name, "role": u.role,
             "is_active": u.is_active, "created_at": u.created_at.isoformat() if u.created_at else None} for u in rows]


@router.post("/api/admin/users")
def admin_create_user(body: UserCreate, db: Session = Depends(get_db), user: User = Depends(require_roles("superadmin"))):
    from .auth import hash_password
    if body.role not in ("patient", "doctor", "nurse", "triage", "blood", "emergency", "pharmacy", "lab", "admin", "superadmin"):
        raise HTTPException(400, "Invalid role")
    if db.query(User).filter((User.username == body.username) | (User.email == body.email)).first():
        raise HTTPException(400, "Username or email exists")
    u = User(username=body.username, email=body.email, hashed_password=hash_password(body.password), full_name=body.full_name, role=body.role)
    db.add(u)
    _audit(db, user.id, "create", "user", None, f"{body.username} [{body.role}]")
    db.commit(); db.refresh(u)
    return {"id": u.id}


@router.patch("/api/admin/users/{uid}")
def admin_patch_user(uid: int, body: dict, db: Session = Depends(get_db), user: User = Depends(require_roles("superadmin"))):
    u = db.get(User, uid)
    if not u:
        raise HTTPException(404, "User not found")
    if uid == user.id and body.get("is_active") is False:
        raise HTTPException(400, "Cannot disable yourself")
    if "is_active" in body:
        u.is_active = bool(body["is_active"])
    if body.get("role") in ("patient", "doctor", "nurse", "triage", "blood", "emergency", "pharmacy", "lab", "admin", "superadmin"):
        u.role = body["role"]
    if body.get("full_name"):
        u.full_name = body["full_name"]
    _audit(db, user.id, "update", "user", uid, str(body)[:300])
    db.commit()
    return {"ok": True}


@router.get("/api/admin/permissions")
def get_matrix(user: User = Depends(require_roles("admin", "superadmin"))):
    return {"roles": MATRIX_ROLES, "matrix": PERMISSIONS_MATRIX}


@router.get("/api/admin/db-stats")
def db_stats(db: Session = Depends(get_db), user: User = Depends(require_roles("superadmin", "admin"))):
    return {t.name: db.query(t).count() for t in Base.metadata.sorted_tables}


@router.get("/api/admin/settings")
def get_sys_settings(db: Session = Depends(get_db), user: User = Depends(require_roles("admin", "superadmin"))):
    return {s.key: s.value for s in db.query(SystemSetting).all()}


@router.patch("/api/admin/settings")
def patch_sys_settings(body: dict, db: Session = Depends(get_db), user: User = Depends(require_roles("superadmin"))):
    for k, v in body.items():
        s = db.get(SystemSetting, k)
        if not s:
            s = SystemSetting(key=k)
            db.add(s)
        s.value = str(v)[:2000]
    _audit(db, user.id, "update", "system_settings", None, ",".join(body.keys()))
    db.commit()
    return {"ok": True}


@router.get("/api/admin/security")
def security_events(limit: int = 100, db: Session = Depends(get_db), user: User = Depends(require_roles("superadmin", "admin"))):
    rows = db.query(AuditLog).filter(AuditLog.action.in_(["login", "create", "update", "emergency_escalation", "refer", "cancel"])).order_by(AuditLog.id.desc()).limit(min(limit, 300)).all()
    return [{"id": l.id, "user_id": l.user_id, "action": l.action, "entity": f"{l.entity}#{l.entity_id}", "at": l.created_at.isoformat() if l.created_at else None} for l in rows]
