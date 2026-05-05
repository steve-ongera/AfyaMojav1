# 🏥 AfyaMojav1 — Hospital Management Information System

> **AfyaMoja** *(Swahili: "Good Health")* — A unified, role-based HMIS built for Kenyan healthcare facilities.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [User Roles & Portals](#user-roles--portals)
5. [Core Models](#core-models)
6. [Project Structure](#project-structure)
7. [Backend Setup](#backend-setup)
8. [Frontend Setup](#frontend-setup)
9. [Environment Variables](#environment-variables)
10. [API Endpoints](#api-endpoints)
11. [Insurance & SHA Integration](#insurance--sha-integration)
12. [Running the Project](#running-the-project)
13. [Default Credentials](#default-credentials)
14. [Roadmap (v2)](#roadmap-v2)

---

## Project Overview

**AfyaMojav1** is a Version 1 Hospital Management Information System (HMIS) designed for small-to-medium Kenyan healthcare facilities. It provides a **single unified login portal** where all staff — doctors, nurses, receptionists, radiologists, pharmacists, and cashiers — authenticate and are redirected to their role-specific dashboard.

The system supports:
- **Patient registration and management**
- **Clinical visits and triage**
- **Medical records (EMR)**
- **Radiology requests and results**
- **Pharmacy and medicine dispensing**
- **Billing and cashiering**
- **SHA (Social Health Authority) and insurance claim tracking** (AIR, BRITAM, etc.)

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Django 5.x + Django REST Framework  |
| Database   | PostgreSQL 15+                      |
| Auth       | JWT (SimpleJWT)                     |
| Frontend   | React 18 + Vite                     |
| UI         | Bootstrap 5.3 + Bootstrap Icons     |
| Charts     | Chart.js via react-chartjs-2        |
| HTTP Client| Axios                               |
| Routing    | React Router DOM v6                 |

---

## System Architecture

```
AfyaMojav1/
├── backend/                  ← Django (One Core App)
│   ├── core/                 ← Single Django app (all models, views, serializers)
│   ├── afyamoja/             ← Django project (settings, urls)
│   └── manage.py
│
└── frontend/                 ← React + Vite SPA
    ├── index.html
    ├── src/
    │   ├── main.jsx
    │   ├── styles/
    │   │   └── main.css
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── Sidebar.jsx
    │   └── pages/
    │       ├── Login.jsx
    │       └── Dashboard.jsx
    |       |__ other pages one by one       
    └── vite.config.js
```

---

## User Roles & Portals

All users log in through a **single portal** at `/login`. After authentication, the system routes each user to their role-specific dashboard automatically via JWT role claims.

| Role          | Access Level                                                              |
|---------------|---------------------------------------------------------------------------|
| **Doctor**       | Patient records, visit notes, prescriptions, lab/radiology requests    |
| **Nurse**        | Triage, vitals entry, nursing notes, medication administration          |
| **Receptionist** | Patient registration, appointment scheduling, visit creation           |
| **Radiologist**  | Radiology request queue, uploading reports and images                  |
| **Pharmacist**   | Prescription queue, medicine dispensing, stock alerts                  |
| **Cashier**      | Billing, invoice generation, payment processing, SHA/insurance claims  |

---

## Core Models

> Minimal, purposeful models for v1. No bloat.

### 1. `Patient`
Stores demographic and identification info. Includes national ID and NHIF/SHA membership number.

### 2. `Medicine`
Formulary of drugs available in the facility. Includes dosage forms, strength, and current stock level.

### 3. `Visit`
Represents a single patient encounter. Tracks the date, attending doctor, visit type (OPD/IPD/Emergency), and current status.

### 4. `Triage`
Linked to a Visit. Captures vitals: BP, temperature, SpO2, pulse, weight, height, and chief complaint. Assigns urgency level (green/yellow/red).

### 5. `PatientMedicalRecord`
The clinical note for a visit. Contains history of presenting illness (HPI), examination findings, diagnosis (ICD-10), treatment plan, and prescriptions.

### 6. `SHARecord`
Tracks insurance/SHA billing for a visit. Records the insurance provider (SHA, AIR, BRITAM, etc.), pre-authorization number, claimed amount, approved amount, and claim status.

---

## Project Structure

```
AfyaMojav1/
│
├── README.md                         ← You are here
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── afyamoja/                     ← Django project config
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   │
│   └── core/                         ← Single application
│       ├── __init__.py
│       ├── admin.py
│       ├── models.py                 ← All 6 models
│       ├── serializers.py            ← DRF serializers
│       ├── views.py                  ← API views
│       ├── urls.py                   ← App-level URLs
│       └── migrations/
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── styles/
        │   └── main.css
        ├── components/
        │   ├── Navbar.jsx
        │   └── Sidebar.jsx
        └── pages/
            ├── Login.jsx
            └── Dashboard.jsx
```

---

## Backend Setup

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- pip / virtualenv

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-org/AfyaMojav1.git
cd AfyaMojav1/backend

# 2. Create and activate virtual environment
python -m venv venv
source venv/bin/activate          # Linux/Mac
venv\Scripts\activate             # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Copy and configure environment variables
cp .env.example .env
# Edit .env with your DB credentials and secret key

# 5. Run database migrations
python manage.py makemigrations
python manage.py migrate

# 6. Create a superuser (admin)
python manage.py createsuperuser

# 7. Start the development server
python manage.py runserver
```

### requirements.txt

```
Django==5.0.4
djangorestframework==3.15.1
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.3.1
psycopg2-binary==2.9.9
python-decouple==3.8
Pillow==10.3.0
```

---

## Frontend Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Steps

```bash
cd AfyaMojav1/frontend

# Install dependencies
npm install

# Start development server (proxies API to Django)
npm run dev
```

### package.json key dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.0",
    "axios": "^1.7.2",
    "chart.js": "^4.4.3",
    "react-chartjs-2": "^5.2.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.3.0"
  }
}
```

---

## Environment Variables

Create `backend/.env`:

```env
# Django
SECRET_KEY=your-very-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=afyamoja_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint                          | Role Access              | Description                        |
|--------|-----------------------------------|--------------------------|------------------------------------|
| POST   | `/api/auth/login/`                | All                      | Login — returns JWT tokens         |
| POST   | `/api/auth/refresh/`              | All                      | Refresh access token               |
| GET    | `/api/patients/`                  | All clinical roles       | List all patients                  |
| POST   | `/api/patients/`                  | Receptionist             | Register new patient               |
| GET    | `/api/patients/{id}/`             | All clinical roles       | Patient detail                     |
| GET    | `/api/visits/`                    | All                      | List visits                        |
| POST   | `/api/visits/`                    | Receptionist             | Create new visit                   |
| GET    | `/api/visits/{id}/`               | All                      | Visit detail                       |
| POST   | `/api/triage/`                    | Nurse                    | Submit triage for a visit          |
| GET    | `/api/triage/{visit_id}/`         | Nurse, Doctor            | Get triage for a visit             |
| GET    | `/api/records/`                   | Doctor                   | List medical records               |
| POST   | `/api/records/`                   | Doctor                   | Create medical record              |
| GET    | `/api/records/{id}/`              | Doctor, Nurse            | View a medical record              |
| GET    | `/api/medicines/`                 | Pharmacist, Doctor       | List medicines (formulary)         |
| POST   | `/api/medicines/`                 | Pharmacist               | Add medicine to formulary          |
| GET    | `/api/sha-records/`               | Cashier                  | List SHA/insurance records         |
| POST   | `/api/sha-records/`               | Cashier, Receptionist    | Create SHA/insurance claim record  |
| PATCH  | `/api/sha-records/{id}/`          | Cashier                  | Update claim status                |

---

## Insurance & SHA Integration

AfyaMojav1 v1 supports **manual** SHA and insurance claim tracking. Supported providers:

| Code    | Provider                          |
|---------|-----------------------------------|
| `SHA`   | Social Health Authority (Kenya)   |
| `AIR`   | AAR Insurance Kenya               |
| `BRITAM`| Britam Insurance                  |
| `JUBILEE`| Jubilee Health Insurance         |
| `NHIF`  | NHIF (legacy / transition)        |
| `CASH`  | Self-pay (no insurance)           |

Each visit can be linked to a `SHARecord` that tracks:
- Insurance provider
- Member/policy number
- Pre-authorization code
- Claimed amount vs approved amount
- Claim status: `PENDING → SUBMITTED → APPROVED / REJECTED`

> **v2 Roadmap:** Direct API integration with SHA portal and EDI claim submission.

---

## Running the Project

### Development (run both simultaneously)

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
python manage.py runserver
# Runs at http://localhost:8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Runs at http://localhost:5173
```

### Access Points

| Service          | URL                              |
|------------------|----------------------------------|
| Frontend App     | http://localhost:5173            |
| Django API       | http://localhost:8000/api/       |
| Django Admin     | http://localhost:8000/admin/     |

---

## Default Credentials

After running `createsuperuser` and seeding roles, use these for testing:

| Role          | Username         | Password       |
|---------------|------------------|----------------|
| Admin         | `admin`          | (set during setup) |
| Doctor        | `dr.wanjiku`     | `AfyaMoja@123` |
| Nurse         | `nurse.otieno`   | `AfyaMoja@123` |
| Receptionist  | `recep.mwangi`   | `AfyaMoja@123` |
| Radiologist   | `radio.kamau`    | `AfyaMoja@123` |
| Pharmacist    | `pharm.akinyi`   | `AfyaMoja@123` |
| Cashier       | `cashier.njeri`  | `AfyaMoja@123` |

> ⚠️ **Change all passwords immediately in any non-development environment.**

---

## Roadmap (v2)

- [ ] Radiology image viewer (DICOM support)
- [ ] Direct SHA API integration for claim submission
- [ ] Automated prescription-to-pharmacy workflow
- [ ] Bed management (IPD)
- [ ] Lab module (LIS integration)
- [ ] SMS notifications (Africa's Talking)
- [ ] Audit logs for all clinical actions
- [ ] Multi-facility / branch support
- [ ] Mobile-responsive PWA

---

## License

AfyaMojav1 is proprietary software developed for internal facility use.  
© 2025 AfyaMoja Health Technologies. All rights reserved.

---

> *"Afya ni Utajiri"* — Health is Wealth 🇰🇪