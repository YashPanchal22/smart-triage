"""SQLAlchemy models — relational schema for the triage platform."""
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, Date, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(String(20), nullable=False, default="patient", index=True)  # patient|doctor|triage|admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    patient_profiles = relationship("Patient", back_populates="user", foreign_keys="Patient.user_id")


class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(80), unique=True, nullable=False)
    description = Column(Text, default="")
    capacity = Column(Integer, default=20)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    doctors = relationship("Doctor", back_populates="department")
    visits = relationship("Visit", back_populates="department")


class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    full_name = Column(String(120), nullable=False)
    specialization = Column(String(120), default="")
    license_no = Column(String(40), unique=True, nullable=False)
    phone = Column(String(20), default="")
    available = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="doctor_profile")
    department = relationship("Department", back_populates="doctors")


class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    patient_code = Column(String(20), unique=True, nullable=False, index=True)  # P-0001
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    full_name = Column(String(120), nullable=False, index=True)
    dob = Column(Date, nullable=True)
    age = Column(Integer, nullable=False, default=0)
    gender = Column(String(20), default="")
    phone = Column(String(20), default="", index=True)
    email = Column(String(120), default="")
    address = Column(Text, default="")
    emergency_contact_name = Column(String(120), default="")
    emergency_contact_phone = Column(String(20), default="")
    existing_conditions = Column(Text, default="")
    allergies = Column(Text, default="")
    medications = Column(Text, default="")
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="patient_profiles", foreign_keys=[user_id])
    visits = relationship("Visit", back_populates="patient", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_patients_name_phone", "full_name", "phone"),)


class Visit(Base):
    __tablename__ = "visits"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    chief_complaint = Column(Text, default="")
    symptoms = Column(Text, default="")  # comma separated
    status = Column(String(30), default="registered", index=True)  # registered|waiting|called|under_assessment|completed|cancelled
    assigned_doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True)
    priority = Column(String(20), default="routine", index=True)  # emergency|urgent|semi_urgent|routine
    priority_score = Column(Integer, default=0)
    priority_reasons = Column(Text, default="[]")  # JSON list
    arrival_time = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    called_time = Column(DateTime(timezone=True), nullable=True)
    started_time = Column(DateTime(timezone=True), nullable=True)
    completed_time = Column(DateTime(timezone=True), nullable=True)
    waiting_minutes = Column(Integer, nullable=True)
    notes = Column(Text, default="")

    patient = relationship("Patient", back_populates="visits")
    department = relationship("Department", back_populates="visits")
    triage = relationship("TriageAssessment", back_populates="visit", uselist=False, cascade="all, delete-orphan")


class TriageAssessment(Base):
    __tablename__ = "triage_assessments"
    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False, unique=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    assessed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    chief_complaint = Column(Text, default="")
    symptoms = Column(Text, default="")
    temperature = Column(Float, nullable=True)
    heart_rate = Column(Float, nullable=True)
    sbp = Column(Float, nullable=True)
    dbp = Column(Float, nullable=True)
    respiratory_rate = Column(Float, nullable=True)
    spo2 = Column(Float, nullable=True)
    consciousness = Column(String(20), default="alert")  # alert|voice|pain|unresponsive
    pain_score = Column(Integer, default=0)
    risk_factors = Column(Text, default="[]")  # JSON
    warning_indicators = Column(Text, default="[]")  # JSON
    notes = Column(Text, default="")
    suggested_priority = Column(String(20), default="routine")
    suggested_score = Column(Integer, default=0)
    suggested_reasons = Column(Text, default="[]")
    final_priority = Column(String(20), default="routine", index=True)
    override_reason = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    visit = relationship("Visit", back_populates="triage")


class TriageRule(Base):
    __tablename__ = "triage_rules"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    category = Column(String(40), default="vitals")  # vitals|symptom|consciousness|age|risk|warning
    config = Column(Text, default="{}")  # JSON thresholds
    points = Column(Integer, default=0)
    priority = Column(String(20), default="")  # force priority or ""
    description = Column(Text, default="")
    active = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class HospitalResource(Base):
    __tablename__ = "hospital_resources"
    id = Column(Integer, primary_key=True, index=True)
    ward_name = Column(String(120), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    resource_type = Column(String(40), default="bed_general")
    total = Column(Integer, default=0)
    occupied = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    role_target = Column(String(20), default="", index=True)  # broadcast to role or ""
    type = Column(String(40), default="info")  # emergency|info|assignment|priority|resource|appointment
    title = Column(String(200), default="")
    message = Column(Text, default="")
    related_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(80), nullable=False, index=True)
    entity = Column(String(40), default="")
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


# ================= ECOSYSTEM MODULES =================

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    date = Column(Date, nullable=False, index=True)
    time_slot = Column(String(20), default="")
    reason = Column(Text, default="")
    status = Column(String(20), default="requested", index=True)  # requested|confirmed|rejected|completed|cancelled|rescheduled
    notes = Column(Text, default="")
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient")
    doctor = relationship("Doctor")
    department = relationship("Department")


class DoctorSchedule(Base):
    __tablename__ = "doctor_schedules"
    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False, index=True)
    weekday = Column(Integer, nullable=False, default=0)  # 0=Mon
    start_time = Column(String(5), default="09:00")
    end_time = Column(String(5), default="13:00")
    slot_minutes = Column(Integer, default=20)
    active = Column(Boolean, default=True)


class BloodDonor(Base):
    __tablename__ = "blood_donors"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False, index=True)
    blood_group = Column(String(5), nullable=False, index=True)
    phone = Column(String(20), default="", index=True)
    gender = Column(String(20), default="")
    age = Column(Integer, default=0)
    last_donation = Column(Date, nullable=True)
    donations_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BloodInventory(Base):
    __tablename__ = "blood_inventory"
    id = Column(Integer, primary_key=True, index=True)
    blood_group = Column(String(5), unique=True, nullable=False, index=True)
    units_available = Column(Integer, default=0)
    units_reserved = Column(Integer, default=0)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class BloodRequest(Base):
    __tablename__ = "blood_requests"
    id = Column(Integer, primary_key=True, index=True)
    hospital_unit = Column(String(120), default="")
    blood_group = Column(String(5), nullable=False, index=True)
    units = Column(Integer, default=1)
    priority = Column(String(20), default="routine", index=True)
    status = Column(String(20), default="requested", index=True)  # requested|approved|issued|rejected|fulfilled|cancelled
    requested_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class Ambulance(Base):
    __tablename__ = "ambulances"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_no = Column(String(20), unique=True, nullable=False)
    status = Column(String(20), default="available", index=True)  # available|on_trip|maintenance
    location = Column(String(120), default="")
    crew = Column(String(120), default="")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"
    id = Column(Integer, primary_key=True, index=True)
    patient_name = Column(String(120), default="")
    phone = Column(String(20), default="")
    emergency_type = Column(String(60), default="medical")
    location = Column(String(200), default="")
    priority = Column(String(20), default="urgent", index=True)
    status = Column(String(30), default="requested", index=True)  # requested|assigned|en_route|arrived|transferred|completed|cancelled
    ambulance_id = Column(Integer, ForeignKey("ambulances.id"), nullable=True)
    assigned_staff = Column(String(120), default="")
    notes = Column(Text, default="")
    timeline = Column(Text, default="[]")  # JSON events
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    ambulance = relationship("Ambulance")


class HealthArticle(Base):
    __tablename__ = "health_articles"
    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(80), nullable=False, index=True)
    category = Column(String(40), default="general", index=True)
    lang = Column(String(5), default="en", index=True)
    title = Column(String(200), nullable=False)
    body = Column(Text, default="")
    source = Column(String(200), default="")


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    lang = Column(String(5), default="en")
    started_at = Column(DateTime(timezone=True), server_default=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=False, index=True)
    role = Column(String(10), default="user")  # user|assistant
    text = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class NutritionResource(Base):
    __tablename__ = "nutrition_resources"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    lang = Column(String(5), default="en", index=True)
    group = Column(String(20), default="general", index=True)  # maternal|child|general
    body = Column(Text, default="")
    source = Column(String(200), default="")


class WellnessLog(Base):
    __tablename__ = "wellness_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    mood = Column(Integer, default=3)  # 1-5
    note = Column(Text, default="")
    sleep_hours = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class Medicine(Base):
    __tablename__ = "medicine_information"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, index=True)
    generic = Column(String(120), default="")
    brands = Column(String(200), default="")
    category = Column(String(80), default="", index=True)
    uses = Column(Text, default="")
    safety = Column(Text, default="")
    warnings = Column(Text, default="")
    manufacturer = Column(String(120), default="")
    source = Column(String(200), default="")


class ServiceDir(Base):
    __tablename__ = "service_directory"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    type = Column(String(40), default="hospital", index=True)  # hospital|clinic|pharmacy|blood_bank|diagnostic|emergency
    place = Column(String(120), default="")
    phone = Column(String(20), default="")
    hours = Column(String(80), default="")
    services = Column(Text, default="")


class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True)
    items = Column(Text, default="[]")  # JSON [{label, amount}]
    total = Column(Float, default=0)
    status = Column(String(20), default="unpaid", index=True)  # unpaid|paid|waived
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    patient = relationship("Patient")


class Bed(Base):
    __tablename__ = "beds"
    id = Column(Integer, primary_key=True, index=True)
    ward = Column(String(80), nullable=False, index=True)
    bed_no = Column(String(20), nullable=False)
    status = Column(String(20), default="available", index=True)  # available|occupied|reserved|maintenance


class MlPrediction(Base):
    __tablename__ = "ml_predictions"
    id = Column(Integer, primary_key=True, index=True)
    model = Column(String(60), default="", index=True)
    input_json = Column(Text, default="{}")
    output = Column(String(200), default="")
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class UserSetting(Base):
    __tablename__ = "user_settings"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    theme = Column(String(10), default="light")
    language = Column(String(5), default="en")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# ================= ROLE-BASED CARE MODULES =================

class Nurse(Base):
    __tablename__ = "nurses"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    full_name = Column(String(120), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    license_no = Column(String(40), unique=True, nullable=False)
    phone = Column(String(20), default="")
    on_duty = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    department = relationship("Department")


class NurseTask(Base):
    __tablename__ = "nurse_tasks"
    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(40), default="general", index=True)  # vitals|prep|triage|bed|observation|medication
    status = Column(String(20), default="pending", index=True)  # pending|done|cancelled
    assigned_to = Column(String(120), default="")
    notes = Column(Text, default="")
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    patient = relationship("Patient")


class Consultation(Base):
    __tablename__ = "consultations"
    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=False, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=True, index=True)
    doctor_name = Column(String(120), default="")
    notes = Column(Text, default="")  # clinical notes written by the doctor (human-authored)
    status = Column(String(20), default="open", index=True)  # open|closed
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    patient = relationship("Patient")


class LabOrder(Base):
    __tablename__ = "lab_orders"
    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    test_name = Column(String(120), nullable=False, index=True)
    priority = Column(String(20), default="routine", index=True)
    status = Column(String(30), default="requested", index=True)  # requested|sample_collected|processing|completed|reviewed|cancelled
    notes = Column(Text, default="")
    ordered_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    patient = relationship("Patient")


class LabResult(Base):
    __tablename__ = "lab_results"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("lab_orders.id"), nullable=False, unique=True, index=True)
    result_text = Column(Text, default="")
    values_json = Column(Text, default="{}")
    attachment = Column(String(200), default="")
    reviewed = Column(Boolean, default=False, index=True)
    recorded_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class PharmacyItem(Base):
    __tablename__ = "pharmacy_inventory"
    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicine_information.id"), nullable=True)
    name = Column(String(120), nullable=False, index=True)
    batch_no = Column(String(40), default="")
    quantity = Column(Integer, default=0)
    unit = Column(String(20), default="strips")
    expiry = Column(Date, nullable=True, index=True)
    reorder_level = Column(Integer, default=20)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    medicine = relationship("Medicine")


class PharmacyOrder(Base):
    __tablename__ = "pharmacy_orders"
    id = Column(Integer, primary_key=True, index=True)
    visit_id = Column(Integer, ForeignKey("visits.id"), nullable=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    items_json = Column(Text, default="[]")  # [{name, qty}]
    status = Column(String(20), default="pending", index=True)  # pending|dispensing|dispensed|cancelled
    ordered_by = Column(Integer, nullable=True)  # authorized staff only; system never prescribes
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    patient = relationship("Patient")


class SystemSetting(Base):
    __tablename__ = "system_settings"
    key = Column(String(80), primary_key=True)
    value = Column(Text, default="")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
