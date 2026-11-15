# Krishi Drishti (कृषि दृष्टि)
### *AI-Powered Precision Agritech Platform for Smallholder Indian Agriculture*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.6-black.svg?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TensorFlow Lite](https://img.shields.io/badge/TFLite-Edge_AI-FF6F00.svg?style=flat&logo=tensorflow&logoColor=white)](https://www.tensorflow.org/lite)
[![PostGIS](https://img.shields.io/badge/PostGIS-Spatial_GIS-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://postgis.net/)
[![Redis](https://img.shields.io/badge/Redis-Cache_%26_RateLimit-DC382D.svg?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini-3.1_Flash_Lite-4285F4.svg?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.14-blue.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Academic Capstone](https://img.shields.io/badge/Academic-Final_Year_B.Tech_Project-8A2BE2.svg)](#academic-citation--attribution)

---

## 🌾 Abstract & Problem Statement

Agriculture sustains over **58% of India's rural livelihoods**, yet Indian smallholder farmers face severe crop yield depreciation (estimated at 15–30% annually) attributable to three systemic impediments:
1. **Delayed Crop Pathology Identification**: Remote farm holdings lack immediate access to certified agronomists or Krishi Vigyan Kendra (KVK) officers, leading to late-stage fungal and viral infestations.
2. **Linguistic & Technological Exclusions**: Commercial advisory applications predominantly deploy English or complex text interfaces, alienating rural farmers who require natural dialect voice interactions.
3. **Indiscriminate Chemical Application**: Farmers frequently apply generic chemical cocktails under adverse weather conditions (high winds or impending rain), generating massive chemical runoff, soil toxicity, and financial debt.

**Krishi Drishti (कृषि दृष्टि)** resolves these challenges through an end-to-end, edge-optimized, multimodal agricultural operating system. It fuses **lightweight Computer Vision (MobileNetV2 quantized to 2.45 MB)**, **conversational speech-to-speech voice advisory in authentic Hindi and English (Faster-Whisper + Google Gemini 3.1 Flash-Lite + bilingual TTS)**, **micrometeorological fungal risk forecasting**, **PostGIS spatial disease cluster monitoring**, and **precision soil-to-crop machine learning models**.

---

## 🌟 Key Technical Innovations

```
                       KRISHI DRISHTI ARCHITECTURE
                                    
   [ Farmer / Field ]            [ Browser / Mobile PWA ]          [ Backend & AI Services ]
  ====================          ==========================        ===========================
  📷 Leaf Photo       ------>   Canvas Preprocessing (1024px) -->  TFLite MobileNetV2 (5.8ms)
  🎙️ Voice Query      ------>   Web Speech / Faster-Whisper  -->  NLU Router + Gemini 3.1 AI
  📍 Farm Coordinates ------>   Geographic Point (SRID 4326)  -->  PostGIS Outbreak DBSCAN
  ⛅ Micro-Weather    ------>   IMD / OpenWeather Sync        -->  48h Safe Spray Window Engine
  🧪 Soil NPK Data    ------>   Farmer Input Form             -->  Random Forest Classifier (99.5%)
  💰 Expense & Yield  ------>   Offline-Ready LocalStorage    -->  PostgreSQL Accounting Ledger
```

- **⚡ Sub-10ms Edge Pathology Detection**: MobileNetV2 transfer-learned on 20,298 images, dynamic-range INT8 quantized to **2.45 MB**, delivering **93.27% accuracy** and **5.8 ms inference latency** on standard CPUs without GPU dependency.
- **🗣️ Natural Conversational Voice Assistant**: Real-time bilingual speech intelligence. Native Chrome Speech Recognition and server-side Faster-Whisper transcribe spoken Hindi without syllable looping; an NLU intent router answers weather, mandi prices, and soil queries instantly, delegating complex agronomic advice to **Google Gemini 3.1 Flash-Lite**.
- **📍 PostGIS Spatial Epidemiological Tracking**: Stores farm geometry in PostGIS (`GEOGRAPHY(Point, 4326)`). Clusters confirmed disease outbreaks using spatial radius queries to give regional KVK officers and neighboring farmers early warning alerts.
- **🌧️ Micrometeorological Fungal Risk & Spray Window Engine**: Evaluates hourly temperature, relative humidity, wind velocity (<15 km/h), and precipitation probabilities over 48 hours to identify optimal pesticide application slots and avert toxic chemical wash-off.
- **🌱 Precision Soil & Yield Intelligence**: Dual predictive models:
  - *Crop Recommendation*: 5-fold Stratified Random Forest achieving **99.55% CV accuracy** across 22 crops based on N, P, K, pH, rainfall, temperature, and humidity.
  - *Yield Prediction*: Historical Indian agriculture dataset (1997–2020) trained with XGBoost (**R² = 0.9704**) factoring in disease severity penalties.
- **🛡️ Built-in Resilience & 1-Click Demo**: Zero friction evaluation via `POST /auth/demo-login` with pre-seeded farms in Uttar Pradesh, strict WCAG AA light-mode enforcement (`color-scheme: light only`), and full offline PWA caching.

---

## 🏗️ End-to-End System Architecture

```mermaid
graph TD
    subgraph ClientTier["Client Tier (Next.js 16.4.6 Progressive Web App)"]
        UI["Mobile-First UI (Tailwind CSS, 52px Touch Targets)"]
        Canvas["HTML5 Canvas Image Compressor (1024px Max)"]
        STT_Client["Web Speech API (hi-IN / en-IN)"]
        TTS_Client["SpeechSynthesis Engine (Lekha / Google हिन्दी)"]
        Cache["PWA Service Worker & Offline Storage"]
    end

    subgraph ApiGateway["Application & Routing Tier (FastAPI Async ASGI)"]
        Auth["JWT Security & Auth Bearer (PBKDF2-SHA256)"]
        RateLimit["Redis Sliding-Window Rate Limiter (60 req/min)"]
        Router["Modular REST & Voice Router"]
        VoiceOrch["Voice Orchestrator & Dual-Fallback Audio Pipeline"]
    end

    subgraph IntelligenceTier["Artificial Intelligence & Analytics Tier"]
        TFLite["TFLite MobileNetV2 (2.45 MB, 13 Disease Classes)"]
        Whisper["Faster-Whisper Tiny ASR (Hindi Prompt Biased)"]
        Gemini["Google Gemini 3.1 Flash-Lite Interactions API"]
        ML_Soil["Soil Crop Recommender (Random Forest - 99.55%)"]
        ML_Yield["Indian Crop Yield Regressor (XGBoost - R² 0.97)"]
        GTTS["gTTS & macOS Native Speech Synthesizer"]
    end

    subgraph DataTier["Data & Spatial Persistence Tier"]
        Postgres[("PostgreSQL 16 Enterprise Database")]
        PostGIS["PostGIS Spatial Extension (SRID 4326)"]
        RedisStore[("Redis 7 In-Memory Cache & Session Store")]
    end

    UI --> Canvas --> Router
    UI --> STT_Client --> Router
    Router --> Auth --> RateLimit
    RateLimit --> VoiceOrch
    VoiceOrch --> Whisper
    VoiceOrch --> Gemini
    VoiceOrch --> GTTS --> TTS_Client
    Router --> TFLite
    Router --> ML_Soil
    Router --> ML_Yield
    Router --> Postgres
    Postgres --> PostGIS
    Router --> RedisStore
```

---

## 🔬 Machine Learning Specifications & Benchmarks

### 1. Crop Pathology Classifier (`model.tflite`)

| Specification | Keras Baseline (Float32) | Edge Export (Quantized TFLite) |
| :--- | :--- | :--- |
| **Base Architecture** | MobileNetV2 (ImageNet Pretrained) | MobileNetV2 INT8 Dynamic Range |
| **Input Resolution** | 224 × 224 × 3 (RGB, `[-1.0, 1.0]` embedded) | 224 × 224 × 3 (`float32`) |
| **Model Footprint** | **20.90 MB** | **2.45 MB (88.3% size reduction)** |
| **Test Accuracy (3,045 images)** | **93.27%** | **93.27%** |
| **Macro F1 Score** | **0.9160** | **0.9160** |
| **Top-1 Decision Agreement** | Baseline | **100.0% Consistency** |
| **CPU Latency (Apple Silicon)** | 22.4 ms | **5.8 ms per leaf** |

#### Target Pathologies (13 Classes)
```
Tomato (10 Classes)                       Potato (3 Classes)
├── Bacterial Spot (Xanthomonas)           ├── Early Blight (Alternaria solani)
├── Early Blight (Alternaria solani)       ├── Late Blight (Phytophthora infestans)
├── Late Blight (Phytophthora infestans)   └── Healthy Foliage
├── Leaf Mold (Passalora fulva)
├── Septoria Leaf Spot
├── Spider Mites (Tetranychus urticae)
├── Target Spot (Corynespora cassiicola)
├── Yellow Leaf Curl Virus (TYLCV)
├── Mosaic Virus (ToMV)
└── Healthy Foliage
```

#### Dataset Partitioning & Leakage Elimination
All training data derived from the PlantVillage dataset was audited:
- **Total Audited Images**: 20,298 leaf images.
- **Deduplication**: 14 exact byte duplicates purged via MD5 hashing; perceptual dHash clustering applied to remove identical shoots.
- **Stratified Partition**: 70% Train (14,208) / 15% Validation (3,045) / 15% Test (3,045). Partition intersection verified: $\text{Train} \cap \text{Test} = \emptyset$.
- **Operational Safety Gate**: Top prediction confidence threshold set to $\tau = 0.70$. Queries with confidence $< 70\%$ trigger `is_low_confidence = true` with a mandatory advisory to consult the nearest KVK officer.

### 2. Soil NPK Crop Recommendation Model
- **Dataset**: 2,200 Indian soil-climate records across 22 crops.
- **Features**: Nitrogen (N), Phosphorus (P), Potassium (K), Temperature (°C), Humidity (%), Soil pH, Rainfall (mm).
- **Cross-Validation**: 5-Fold Stratified Cross-Validation.
- **Benchmark**:
  - **Random Forest**: **99.55% CV Accuracy** ($\pm 0.32\%$), **0.9954 Macro F1**.
  - **XGBoost**: **99.27% CV Accuracy** ($\pm 0.33\%$), **0.9927 Macro F1**.

### 3. Historical Crop Yield Prediction Model
- **Dataset**: 19,537 historical records across 30 Indian states and 55 crops (1997–2020).
- **Features**: State, Season, Crop, Area (ha), Annual Rainfall (mm), Fertilizer (kg/ha), Pesticide (kg/ha).
- **Performance**: XGBoost Regressor achieves **$R^2 = 0.9704$** with **RMSE = 148.2 kg/ha**, coupled with an agronomic disease loss penalty matrix.

---

## 🗄️ Database Architecture & Spatial Schema

The persistence layer is managed by **PostgreSQL 16** with **PostGIS 3.4** and **SQLAlchemy 2.0 ORM** across 12 relational and spatial tables:

```
+-----------------------------------------------------------------------------------+
|                                 DATABASE ENTITIES                                 |
+-----------------------------------------------------------------------------------+
|  1. users            : Farmer & Officer accounts, hashed credentials, language    |
|  2. farms            : Farm holding records with PostGIS GEOGRAPHY(Point, 4326)   |
|  3. crops            : Agronomic profiles, season, water and NPK requirements     |
|  4. diseases         : Pathogens, severity rating, and ML class mapping           |
|  5. treatments       : Curative/preventative chemical & organic spray dosages     |
|  6. disease_reports  : Timestamped diagnosis history, GPS geotags, confidence    |
|  7. spray_schedules  : Fungal risk index and recommended 48-hour spraying windows |
|  8. soil_records     : Soil laboratory test results (N, P, K, pH, organic carbon) |
|  9. expenses         : Input cost accounting (seeds, diesel, labor, fertilizers)  |
| 10. mandi_prices     : APMC market prices, arrival dates, and commodity modal rate|
| 11. outbreak_alerts  : Spatial radius disease clusters (PostGIS ST_DWithin queries)|
| 12. audit_logs       : Security and administrative role activity trail            |
+-----------------------------------------------------------------------------------+
```

---

## 📡 Comprehensive API Reference

All endpoints conform to standardized JSON envelopes with automatic error transformation:

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/auth/signup` | Public | Register new farmer account with Indian phone validation |
| `POST` | `/auth/login` | Public | Authenticate phone/password; returns 24h JWT token |
| `POST` | `/auth/demo-login` | Public | **1-Click Instant Demo Login** (Farmer Ram, Lucknow, UP) |
| `GET` | `/auth/me` | Farmer, Officer | Fetch authenticated profile and assigned holdings |
| `POST` | `/detect-disease` | Farmer, Officer | Ingests leaf photo (`multipart/form-data`), runs TFLite inference |
| `GET` | `/disease-history` | Farmer | Paginated diagnostic history with crop filters and images |
| `GET` | `/get-weather` | Public / Farmer | Micro-climate weather, fungal disease risk, safe spray window |
| `POST` | `/voice-query` | Public / Farmer | Accepts spoken audio (`.webm`/`.wav`) or text, returns Hindi audio |
| `GET` | `/market-prices` | Public / Farmer | APMC mandi modal commodity prices with Redis 2h caching |
| `POST` | `/soil/recommend` | Farmer | Recommends top-3 optimal crops based on N-P-K-pH-rain features |
| `GET` | `/farms` | Farmer | Lists user's geocoded farms with PostGIS coordinates |
| `POST` | `/farms` | Farmer | Registers farm holding (validates coordinates inside India) |
| `GET` | `/expenses` | Farmer | Farm P&L ledger tracking input costs and harvest revenues |
| `GET` | `/outbreaks` | Farmer, Officer | Spatial disease clusters detected within user radius |
| `POST` | `/admin/run-outbreaks` | Officer | Triggers spatial DBSCAN clustering over confirmed cases |
| `GET` | `/health` | Public | Liveness & readiness probes for PostgreSQL, PostGIS, and Redis |

Interactive OpenAPI documentation is generated at:
- **Swagger UI**: `http://localhost:8001/docs`
- **ReDoc**: `http://localhost:8001/redoc`

---

## 🛠️ Step-by-Step Installation & Local Setup

### System Prerequisites
- **Python**: Version 3.11 or newer (Python 3.14 compatible)
- **Node.js**: Version 18.x or newer & `npm`
- **Docker**: Docker Desktop with Docker Compose
- **Git LFS**: Required only if working with the raw PlantVillage training image set

```bash
# 1. Clone the repository
git clone https://github.com/harshvardhanmishra32/Krishi-Drishti.git
cd Krishi-Drishti
```

### 1. Infrastructure Services (PostgreSQL + PostGIS + Redis)
Spin up the local containerized spatial database and Redis cache:

```bash
docker compose up -d
```
*Verifies PostgreSQL listening on `localhost:5433` and Redis on `localhost:6380`.*

### 2. Backend Setup (FastAPI & Machine Learning)

```bash
cd backend

# Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install production dependencies
pip install -r requirements.txt

# Run database migrations to provision the 12 tables
alembic upgrade head

# Seed initial crops, diseases, and treatment guidelines
python scripts/seed.py
```

Create `.env` inside the `backend/` directory:
```ini
ENVIRONMENT=development
PORT=8001
SECRET_KEY=krishi_drishti_super_secret_jwt_key_at_least_32_chars_long
DATABASE_URL=postgresql://krishi_user:krishi_secure_password_123@localhost:5433/krishi_db
REDIS_URL=redis://localhost:6380/0
OPENWEATHER_API_KEY=your_openweather_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Start the FastAPI application:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
*Backend API is live at `http://localhost:8001`.*

### 3. Frontend Setup (Next.js Progressive Web App)

Open a new terminal window:
```bash
cd frontend

# Install frontend packages
npm install

# Build optimized production bundle
npm run build

# Start production server
npm run start -p 3001
```
*Frontend application is live at `http://localhost:3001`.*

---

## 🧪 Testing & Verification Suite

Krishi Drishti incorporates rigorous test automation covering unit logic, spatial integrity, ML inference, and authentication security:

```bash
# Execute backend test suite (55 automated tests)
cd backend
source .venv/bin/activate
pytest -v
```

### Test Coverage Highlights
- `test_detection.py`: Validates TFLite inference accuracy, low-confidence warning flags (<0.70), and crop mismatch detection.
- `test_voice.py`: Validates Faster-Whisper ASR, Hindi NLU intent classification, Google Gemini fallback, and TTS audio generation.
- `test_farms.py`: Asserts spatial rejection of Null Island (`(0, 0)`) and non-Indian coordinates.
- `test_security.py`: Asserts JWT expiration, tampering prevention, and Redis login rate-limiting.
- `test_weather.py`: Asserts 48h hourly safe spray window calculations.

---

## 📂 Repository Directory Layout

```
Krishi-Drishti/
├── backend/                        # FastAPI Enterprise API
│   ├── alembic/                    # Database migration versions
│   ├── app/
│   │   ├── core/                   # Security, Redis, JWT, rate-limiters, config
│   │   ├── db/                     # SQLAlchemy session & Base model definitions
│   │   ├── ml/                     # ML inference, Faster-Whisper STT, TFLite
│   │   │   ├── artifacts/          # model.tflite, class_names.json, MODEL_CARD.md
│   │   │   └── stt.py              # Faster-Whisper with conversational Hindi prompt
│   │   ├── models/                 # 12 SQLAlchemy ORM entities (Farm, User, etc.)
│   │   ├── routers/                # API route controllers (detection, voice, weather)
│   │   ├── schemas/                # Pydantic v2 validation contracts
│   │   └── services/               # Voice orchestrator, Gemini, farm, and pricing logic
│   ├── scripts/                    # Database seeding and admin provisioning scripts
│   └── tests/                      # Pytest test suite (55 unit & integration tests)
├── frontend/                       # Next.js 16.4.6 Progressive Web App
│   ├── src/
│   │   ├── app/                    # Next.js App Router (dashboard, scan, voice, weather)
│   │   ├── components/             # Reusable UI widgets (Header, BottomNav, Card, Button)
│   │   ├── context/                # AuthContext (JWT, demo-login) & LanguageContext
│   │   ├── lib/                    # Axios/fetch API client and unified browser/server TTS
│   │   └── locales/                # Bilingual translation catalogs (hi.json, en.json)
│   └── public/                     # PWA manifest, service worker, and application icons
├── ml-training/                    # Model training, data preparation & evaluation
│   ├── data_prep.py                # Auditing, deduplication, and stratified 70/15/15 splits
│   ├── train_classifier.py         # MobileNetV2 two-stage transfer learning
│   ├── export_tflite.py            # INT8 dynamic range and Float16 quantization
│   ├── train_soil_model.py         # Random Forest & XGBoost NPK crop recommendation
│   └── train_yield_model.py        # XGBoost crop yield regressor (1997–2020 Indian data)
├── Dataset/                        # CSV reference data (crop yield, soil recommendation)
├── docker-compose.yml              # Local PostGIS & Redis container orchestrations
└── README.md                       # Comprehensive platform documentation
```

---

## 🎓 Academic Citation & Attribution

If you utilize Krishi Drishti in your research, university coursework, or capstone evaluation, please cite this project:

```bibtex
@misc{mishra2026krishidrishti,
  author       = {Harshvardhan Mishra},
  title        = {Krishi Drishti: An Edge-AI Multimodal Precision Agriculture Platform for Indian Smallholder Farmers},
  year         = {2026},
  publisher    = {GitHub},
  howpublished = {\url{https://github.com/harshvardhanmishra32/Krishi-Drishti}},
  note         = {Final Year B.Tech Capstone Project in Computer Science and Engineering}
}
```

### Acknowledgments & References
- **PlantVillage Dataset**: Hughes, D., & Salathé, M. (2015). *An open access repository of images on plant health to enable the development of mobile disease diagnostics.* arXiv:1511.08060.
- **Indian Council of Agricultural Research (ICAR)** & **Krishi Vigyan Kendra (KVK)** for agronomic pest thresholds and chemical safety advisories.
- **India Meteorological Department (IMD)** & **OpenWeather API** for meteorological forecasting standards.
- **Google DeepMind** for the **Gemini 3.1 Flash-Lite** foundation model powering open-ended Hindi agricultural reasoning.

---

<div align="center">
  <sub>Built with ❤️ for Indian Farmers • Krishi Drishti Capstone Engineering Project</sub>
</div>
