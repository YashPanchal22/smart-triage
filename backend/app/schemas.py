"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime, date


class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    full_name: str = Field(min_length=2, max_length=120)
    role: str = "patient"

    @field_validator("role")
    @classmethod
    def valid_role(cls, v):
        if v not in ("patient", "doctor", "nurse", "triage", "admin", "superadmin", "blood", "emergency", "pharmacy", "lab"):
            raise ValueError("Invalid role")
        return v


class LoginIn(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class DepartmentIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    description: str = ""
    capacity: int = 20


class DepartmentOut(DepartmentIn):
    id: int
    class Config:
        from_attributes = True


class DoctorIn(BaseModel):
    full_name: str
    department_id: Optional[int] = None
    specialization: str = ""
    license_no: str
    phone: str = ""
    available: bool = True


class DoctorOut(DoctorIn):
    id: int
    class Config:
        from_attributes = True


class PatientIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    dob: Optional[date] = None
    age: int = Field(ge=0, le=130)
    gender: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    emergency_contact_name: str = ""
    emergency_contact_phone: str = ""
    existing_conditions: str = ""
    allergies: str = ""
    medications: str = ""


class PatientOut(PatientIn):
    id: int
    patient_code: str
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


class VisitIn(BaseModel):
    patient_id: int
    department_id: Optional[int] = None
    chief_complaint: str = ""
    symptoms: str = ""


class VisitStatusIn(BaseModel):
    status: str
    assigned_doctor_id: Optional[int] = None
    notes: str = ""


class TriageIn(BaseModel):
    visit_id: int
    chief_complaint: str = ""
    symptoms: str = ""
    temperature: Optional[float] = None
    heart_rate: Optional[float] = None
    sbp: Optional[float] = None
    dbp: Optional[float] = None
    respiratory_rate: Optional[float] = None
    spo2: Optional[float] = None
    consciousness: str = "alert"
    pain_score: int = Field(default=0, ge=0, le=10)
    risk_factors: List[str] = []
    warning_indicators: List[str] = []
    notes: str = ""
    override_priority: Optional[str] = None
    override_reason: str = ""


class ResourceIn(BaseModel):
    ward_name: str
    department_id: Optional[int] = None
    resource_type: str = "bed_general"
    total: int = 0
    occupied: int = 0


class RuleIn(BaseModel):
    name: str
    category: str = "vitals"
    config: str = "{}"
    points: int = 0
    priority: str = ""
    description: str = ""
    active: bool = True
