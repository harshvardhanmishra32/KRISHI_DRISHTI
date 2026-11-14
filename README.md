# 🌾 Krishi Drishti (कृषि दृष्टि) - Backend Architecture & Guide

> **B.Tech Final-Year Project**: An AI-powered advisory system for Indian farmers (leaf-photo disease detection, treatment advice, weather, soil and crop advice, Hindi voice help, expense and profit tracker, outbreak alerts).

---

## 📁 1. Project Directory Structure

```text
Krishi Drishti/
├── Dataset/                                      # Knowledge base & leaf image datasets
│   ├── Crop_recommendation 2.numbers
│   ├── crop_yield.csv
│   ├── disease_knowledge_base_symptoms_controls.csv
│   └── plantvillage dataset/
├── backend/
│   ├── alembic/                                  # Database migrations
│   │   ├── env.py                                # PostGIS filter & GeoAlchemy2 hook
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── 0001_initial_12_tables.py         # 12 Tables with PostGIS geography
│   ├── alembic.ini                               # Migration settings
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                               # FastAPI app, CORS, routes & error handlers
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py                         # Pydantic Settings reading .env (>=32 char secret)
│   │   │   ├── errors.py                         # Unified JSON errors: {"error": {"code": ..., "message": ...}}
│   │   │   ├── logging.py                        # Structured logging
│   │   │   ├── redis.py                          # Redis client & ping checker
│   │   │   └── security.py                       # Passwords with bcrypt directly & 24h JWT
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   └── session.py                        # SQLAlchemy 2.0 sync engine & Base
│   │   ├── models/                               # 12 SQLAlchemy 2.0 Typed Models
│   │   │   ├── __init__.py                       # Re-exports all models for Base.metadata
│   │   │   ├── user.py                           # users (roles: farmer, officer, admin)
│   │   │   ├── farm.py                           # farms (PostGIS Point geography)
│   │   │   ├── crop.py                           # crops, diseases, treatments
│   │   │   ├── report.py                         # disease_reports (SET NULL on farm delete)
│   │   │   ├── soil.py                           # soil_records
│   │   │   ├── finance.py                        # expenses, market_prices
│   │   │   ├── weather.py                        # weather_cache (JSONB + rounded lat/lon index)
│   │   │   ├── outbreak.py                       # outbreak_alerts (centroid Geography)
│   │   │   └── voice.py                          # voice_queries
│   │   ├── schemas/                              # Pydantic Schemas
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                           # Signup (10-digit Indian phone), Login, Token, User
│   │   │   ├── farm.py                           # Farm CRUD & India Bounding Box validation
│   │   │   └── upload.py                         # Image upload response schema
│   │   ├── routers/                              # FastAPI Routers
│   │   │   ├── __init__.py
│   │   │   ├── health.py                         # GET /health (Postgres & Redis)
│   │   │   ├── auth.py                           # POST /auth/signup, /auth/login, GET /auth/me
│   │   │   ├── farms.py                          # CRUD /farms & GET /admin/farms
│   │   │   └── uploads.py                        # POST /api/v1/upload
│   │   ├── services/                             # Business Logic Layer
│   │   │   ├── __init__.py
│   │   │   ├── user_service.py                   # User registration & authentication
│   │   │   ├── farm_service.py                   # Farm operations & PostGIS synchronization
│   │   │   └── upload_service.py                 # Pillow validation, resizing, EXIF stripping
│   │   └── ml/
│   │       └── __init__.py                       # Inference & TFLite serving
│   ├── scripts/
│   │   ├── test_db_models.py                     # Inserts User, Farm, Report & tests relationships
│   │   ├── seed.py                               # Idempotent seed script from JSON files
│   │   └── create_officer.py                     # CLI script to create an officer or admin
│   ├── seed_data/
│   │   ├── crops.json                            # 10 Indian crops with pH, water, soil, NPK
│   │   ├── diseases.json                         # Crop diseases + healthy states + model_class_name
│   │   └── treatments.json                       # Chemical & organic treatments + safety note
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py                           # Pytest fixtures & TestClient
│   │   ├── test_health.py                        # /health test
│   │   ├── test_auth.py                          # Signup, 10-digit phone, login, me tests
│   │   ├── test_farms.py                         # Ownership isolation (404), India Bbox tests
│   │   └── test_upload.py                        # Corrupt 400, oversized 413, wrong format 415
│   ├── uploads/                                  # Local development image storage
│   └── requirements.txt                          # Pinned dependencies
├── docker-compose.yml                            # PostGIS 16 & Redis 7
├── .env.example                                  # Template for configuration
├── .env                                          # Local environment variables
└── README.md
```

---

## 🗄️ 2. The 12 Database Tables (SQLAlchemy 2.0 + PostGIS)

1. **`users`**: UUID primary key, 10-digit Indian phone (`UNIQUE`), email, `password_hash` (bcrypt), `preferred_language` (default `'hi'`), `role` (`farmer`, `officer`, `admin`).
2. **`farms`**: UUID primary key, `user_id` FK (CASCADE), `farm_name`, `latitude`, `longitude`, `location` (`Geography(Point, 4326)` with GiST index), `area_acres`, `state`, `district`.
3. **`crops`**: UUID primary key, `name` (`UNIQUE`), `scientific_name`, `category`, `season`, `ideal_soil_type`, `water_requirement_mm`, `ideal_ph_min`, `ideal_ph_max`, `typical_npk`.
4. **`diseases`**: UUID primary key, `crop_id` FK (CASCADE), `name`, `causal_organism`, `symptoms`, `severity_level`, `model_class_name` (`UNIQUE`).
5. **`treatments`**: UUID primary key, `disease_id` FK (CASCADE), `fertilizer_recommendation`, `pesticide_recommendation`, `organic_option`, `dosage`, `application_method`, `safety_note`.
6. **`disease_reports`**: UUID primary key, `user_id` FK, `farm_id` FK (`ondelete="SET NULL"` nullable), `crop_id` FK, `disease_id` FK nullable, `image_path`, `confidence`, `detection_mode` (`online`/`offline`), `is_simulated` (bool), `latitude`, `longitude`, `location` (`Geography(Point, 4326)`), `created_at` (indexed).
7. **`soil_records`**: UUID primary key, `farm_id` FK, `soil_type`, `ph`, `nitrogen`, `phosphorus`, `potassium`, `organic_carbon`, `test_date`, `source` (`ai_estimate`/`lab_test`).
8. **`expenses`**: UUID primary key, `user_id` FK, `farm_id` FK, `crop_id` FK, `expense_type` (`seed`, `fertilizer`, `pesticide`, `labour`, `irrigation`, `other`), `amount`, `expense_date`, `note`.
9. **`market_prices`**: UUID primary key, `crop_id` FK, `mandi_name`, `state`, `district`, `price_per_quintal`, `price_date`, `fetched_at`; unique on `(crop_id, mandi_name, price_date)`.
10. **`weather_cache`**: UUID primary key, `lat_rounded`, `lon_rounded`, `temperature`, `humidity`, `rainfall_mm`, `forecast_json` (JSONB), `fetched_at`; composite index on `(lat_rounded, lon_rounded)`.
11. **`outbreak_alerts`**: UUID primary key, `disease_id` FK, `state`, `district`, `centroid` (`Geography(Point, 4326)`), `report_count`, `alert_level` (`low`/`medium`/`high`), `status` (`active`/`resolved`), `window_start`, `window_end`, `is_simulated`, `created_at`.
12. **`voice_queries`**: UUID primary key, `user_id` FK nullable, `query_text`, `language`, `response_text`, `created_at`.

### 🛡️ Design Choice: Deleting a Farm & Disease Reports
In `disease_reports`, `farm_id` is defined with `ondelete="SET NULL"` and `nullable=True`. 
**Why?** When a farmer deletes or sells their farm, we must never lose historical epidemiology data, outbreak metrics, or the farmer's diagnosis log. Setting `farm_id` to `NULL` preserves the report, image, and its GPS coordinates (`latitude`, `longitude`, `location`) intact, keeping district-level outbreak detection models accurate.

### 🌐 Alembic + GeoAlchemy2 Handling
- **Ignoring System Tables**: In `alembic/env.py`, the `include_object` hook filters out `spatial_ref_sys`, `geometry_columns`, and `geography_columns` so Alembic's autogenerate never tries to drop PostGIS internal tables.
- **Extension Creation**: Migration `0001_initial_12_tables.py` executes `CREATE EXTENSION IF NOT EXISTS postgis;` before any tables are created.
- **Geography Types & GiST Indexes**: We use `geoalchemy2.types.Geography(geometry_type='POINT', srid=4326)` and explicit GiST indexes on spatial columns.

---

## 📡 3. API Endpoints Reference Table

| Method | Endpoint | Access | Description | Success | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | Checks PostgreSQL & Redis separately | `200 OK` | `503` |
| `POST` | `/auth/signup` | Public | Register farmer (10-digit Indian mobile) | `201 Created` | `409` (duplicate phone), `422` (invalid phone/password) |
| `POST` | `/auth/login` | Public | Authenticate phone & password (returns 24h JWT) | `200 OK` | `401` (same message for wrong phone/password) |
| `GET` | `/auth/me` | Authenticated | View authenticated profile (no `password_hash`) | `200 OK` | `401` (expired/missing token) |
| `POST` | `/farms` | Farmer | Register new farm (India Bounding Box checked) | `201 Created` | `422` (lat 0, lon 0 or outside India) |
| `GET` | `/farms` | Farmer | List all farms owned by current farmer | `200 OK` | `401` |
| `GET` | `/farms/{id}` | Farmer | Get farm details (other farmer's farm gives 404) | `200 OK` | `404` (not 403, prevents info leakage) |
| `PUT` | `/farms/{id}` | Farmer | Update farm (syncs lat/lon & PostGIS point) | `200 OK` | `404` |
| `DELETE` | `/farms/{id}` | Farmer | Delete farm (sets NULL on disease reports) | `204 No Content` | `404` |
| `GET` | `/admin/farms` | Officer/Admin | Filter farms by state & district (NO phone numbers!) | `200 OK` | `403` (forbidden for normal farmers) |
| `POST` | `/api/v1/upload` | Authenticated | Upload leaf image (Pillow check, 5MB limit, 1280px, EXIF strip) | `201 Created` | `400` (corrupt), `413` (>5MB), `415` (unsupported) |

---

## ⚡ 4. Exact macOS Terminal Commands

### Step 1: Start Docker Containers (PostGIS + Redis)
Make sure Docker Desktop is running, then in your terminal:
```bash
cd "/Users/harshvardhanmishra/Desktop/Krishi Drishti"
docker compose up -d
docker compose ps
```

### Step 2: Activate Virtual Environment & Install Dependencies
```bash
cd backend
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Run Database Migrations
Apply the initial migration creating all 12 tables and the PostGIS extension:
```bash
alembic upgrade head
```
*(To test rollback and re-apply: `alembic downgrade base` followed by `alembic upgrade head`)*

### Step 4: Verify Models & Relationships
Run the verification script to insert a user, farm, crop, disease, and report, and read them back:
```bash
python scripts/test_db_models.py
```

### Step 5: Seed Crops, Diseases & Treatments
Run the idempotent seed script:
```bash
python scripts/seed.py
```
*(Running it a second time will update instead of creating duplicates!)*

### Step 6: Create an Agriculture Officer (Optional / for testing)
```bash
python scripts/create_officer.py --name "Dr. Sharma" --phone 9876543210 --password OfficerPass123 --role officer
```

### Step 7: Run the FastAPI Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Open your browser at:
- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

### Step 8: Run Automated Pytest Suite
```bash
pytest -v
```

---

## 📝 5. How to Add More Crop & Disease Data

To add more crops or diseases from your Crop Reference Guide:
1. Open `backend/seed_data/crops.json`: add new crop objects (with `name`, `scientific_name`, `category`, `season`, `ideal_soil_type`, `water_requirement_mm`, `ideal_ph_min`, `ideal_ph_max`, `typical_npk`).
2. Open `backend/seed_data/diseases.json`: add disease objects linked by `crop_name`.
3. Open `backend/seed_data/treatments.json`: add corresponding treatments linked by `disease_name`.
4. Re-run `python scripts/seed.py`.
