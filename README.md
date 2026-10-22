# 🏥 Smart Healthcare Ecosystem

**AI · Data Science · Hospital Operations & Emergency Response Platform** — one unified,
fully functional full-stack application combining **12 integrated modules** on a single
backend, database, auth system, and real-time layer.

> ⚠️ **Safety notice:** This is a healthcare operations, education, and **decision-support**
> system. It does not diagnose diseases, prescribe treatment, or replace qualified healthcare
> professionals. All bundled data is **synthetic/demo data** (`DEMONSTRATION SYSTEM — SYNTHETIC DATA`
> is shown in the UI). In a real emergency call **108 / 112** (India).

---

## 🧩 The 12 modules (one platform, shared everything)

| # | Module | Highlights |
|---|---|---|
| 1 | **Smart Hospital Triage** | Registration, vitals, transparent priority engine (🔴🟠🟡🟢) with reasons, override + audit, live doctor queue |
| 2 | **AI Health Assistant** | Curated EN/HI/GU knowledge base, chatbot with intent detection, emergency/crisis redirection, cited sources |
| 3 | **Rural Healthcare** | Multilingual health education, service directory (hospital/clinic/pharmacy/blood bank/diagnostic/emergency), emergency guidance |
| 4 | **Appointments** | Doctor search, department filter, weekday schedules, live slot availability, double-booking protection, accept/reject/complete/cancel/reschedule, notifications |
| 5 | **Hospital Management** | Patients, doctors, departments, visits, resources/beds, **billing invoices** |
| 6 | **Risk Analytics Lab** | Logistic Regression / Random Forest / Decision Tree on synthetic data → accuracy, precision, recall, F1, confusion matrix, ROC-AUC. *Educational estimates only* |
| 7 | **Nutrition Assistant** | Maternal/child/general education (EN/HI/GU), affordable meals, balanced-plate & growth charts, BMI education |
| 8 | **Mental Wellness** | Mood journal + trend chart, guided breathing exercise, sleep/self-care education, crisis helpline info (no assessment/diagnosis) |
| 9 | **Medicine Info** | 30-medicine searchable reference (uses, safety, warnings, brands, sources). Never prescribes |
| 10 | **Healthcare Analytics** | 14+ KPIs, trends, distributions, histograms, scatter, heatmaps-style workload, demand forecast, data-quality (pandas) |
| 11 | **Blood Bank** | 500 donors, 8-group live inventory, request workflow (requested→approved→issued→fulfilled) with stock checks, low-stock alerts |
| 12 | **Emergency Response** | Request board with pipeline (requested→assigned→en route→arrived→transferred→completed), ambulance fleet, incident timelines, real-time alerts |

Shared across all modules: **JWT auth + 6 roles · 28-table SQL database · REST + WebSocket APIs ·
notifications · audit logs · admin command center · CSV/Excel/PDF reports · light/dark mode
(persisted per-user in the database)**.

## 🧱 Architecture

```
React 18 + TypeScript + Vite + Tailwind + Recharts
        │  REST (axios) + WebSocket (/ws/live)
        ▼
FastAPI ── Auth · Triage Engine · Queue · Appointments · Blood · Emergency ·
        │   Assistant/KB · Analytics · ML (wait-time + risk + demand) · Reports
        ▼
SQLite (demo) or PostgreSQL (docker-compose / DATABASE_URL) — 28 tables
```

## 🚀 Quick start

### Backend (Python 3.10+)

```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
python -c "from app.database import Base, engine, SessionLocal; from app.seed_eco import seed_eco;
Base.metadata.create_all(bind=engine); db=SessionLocal(); print(seed_eco(db))"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

→ **http://localhost:8000** · Swagger: **/api/docs**

### Frontend (Node 18+)

```bash
cd frontend && npm install && npm run dev
```

→ **http://localhost:5173** (proxies `/api` + `/ws` to backend)

### 🐳 Docker (PostgreSQL + backend + frontend)

```bash
docker compose up --build
```

### 🔑 Demo accounts (synthetic)

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Doctor | `doctor` | `doctor123` |
| Triage | `triage` | `triage123` |
| Patient | `patient` | `patient123` |
| Blood staff | `blood` | `blood123` |
| Emergency | `emergency` | `emergency123` |

## 🗄️ Database

* Default **SQLite** (`backend/smart_triage.db`, zero setup); **PostgreSQL** via `DATABASE_URL` or docker-compose.
* 28 normalized tables: users, patients, doctors, departments, appointments, doctor_schedules, visits, triage_assessments, triage_rules, hospital_resources, beds, invoices, blood_donors, blood_inventory, blood_requests, ambulances, emergency_requests, health_articles, chat_sessions, chat_messages, nutrition_resources, wellness_logs, medicine_information, service_directory, ml_predictions, user_settings, notifications, audit_logs.
* Full DDL: **`database/schema.sql`** (PostgreSQL, generated from models).
* Seed: **1,000 patients · 100 doctors · 15 departments · 5,000 visits + triage · 5,000 appointments · 500 donors · 220 beds · 60 emergency requests · 36 articles · 30 medicines** (+ `POST /api/admin/seed` to top up).

## 🧠 Transparent triage scoring

Warning indicator +30 (multiple +35) · critical vitals +30 · abnormal +20 · unresponsive +30 ·
pain 9–10 +15 · high-risk age +10 · risk factors up to +10 →
**≥30 Emergency · ≥20 Urgent · ≥10 Semi-Urgent · else Routine**, every reason shown.

## 🤖 ML / Data Science (B.Sc. showcase)

* **Waiting-time prediction** (RandomForest): MAE / RMSE / R².
* **Risk Analytics Lab** (Logistic/RF/Tree): accuracy, precision, recall, F1, confusion matrix, ROC-AUC — synthetic data, educational only.
* **Demand forecast**: 7-day moving-average arrival estimates (pandas).
* **Data-quality panel**: missing-value %, describes, duplicates (pandas/NumPy).
* Stack demonstrated: Python · Pandas · NumPy · Scikit-learn · SQL · FastAPI · React/TS · REST · WebSockets · Recharts.

## 🔌 API map (see `/api/docs` for all ~90 endpoints)

```
/auth /users /patients /doctors /departments /schedules
/appointments /triage /queue /vitals /resources /beds /billing
/blood/* /emergency/* /assistant/chat /articles /nutrition /wellness/logs
/medicines /services /search /settings /notifications
/analytics/* /ml/* /reports/* /audit
WS /ws/live → queue_updated, triage_completed, emergency(_request),
               appointment_updated, blood_updated, resources_updated, patient_registered
```

## 🔒 Security & privacy

PBKDF2 hashing · JWT · RBAC on every route · Pydantic validation · parameterized ORM queries ·
CORS · secrets in `.env` · full audit trail · synthetic data only.

## 🧪 Suggested demo flow

1. **Patient**: book an appointment (live slots) → chat with AI assistant (try Hindi) → log mood.
2. **Triage**: register patient → triage with vitals → show priority + reasons.
3. **Doctor** (second tab): watch queue update live → confirm appointment → complete case.
4. **Blood**: raise request → approve → issue (watch stock drop).
5. **Emergency**: raise request → assign ambulance → advance pipeline → timeline.
6. **Admin**: command center KPIs → analytics + Risk Lab → demand forecast → download CSV/Excel/PDF reports.

## 📁 Layout

```
smart-triage/
├── frontend/src/pages/   # 19 pages: Dashboard, Queue, Patients, Triage, Appointments,
│                         # Assistant, Rural, Nutrition, Wellness, Medicines, BloodBank,
│                         # Emergency, Doctors, Analytics, RiskLab, Resources, Billing, Reports…
├── backend/app/          # main.py (core) · eco.py (ecosystem modules) · models.py (28 tables)
│                         # triage_engine.py · ml_module.py · kb.py (EN/HI/GU knowledge) · seed_eco.py
├── database/schema.sql   # PostgreSQL DDL
├── docker-compose.yml + Dockerfiles
└── README.md
```
