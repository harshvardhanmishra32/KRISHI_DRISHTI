# 🌾 Krishi Drishti (कृषि दृष्टि) - Project Progress Tracker

## Milestone Overview: P01 to P32 Complete Status

| Task | Title | Scope & Implementations | Status | Key Artifacts |
| :--- | :--- | :--- | :---: | :--- |
| **P01** | Project skeleton, Docker, Git | Docker PostGIS 16 & Redis 7, FastAPI `/health`, `.env` | ✅ Completed | [docker-compose.yml](file:///Users/harshvardhanmishra/Desktop/Krishi%20Drishti/docker-compose.yml), `.env`, `backend/app/main.py` |
| **P02** | Backend core architecture | Pydantic Settings, JWT 24h, bcrypt, unified JSON errors | ✅ Completed | `backend/app/core/` (`config.py`, `security.py`, `errors.py`, `redis.py`) |
| **P03** | Core Database Tables (Part A) | SQLAlchemy 2.0: `users`, `farms` (PostGIS), `crops`, `diseases`, `treatments` | ✅ Completed | `backend/app/models/` (`user.py`, `farm.py`, `crop.py`) |
| **P04** | Remaining Tables & Alembic Migration | `disease_reports`, `soil_records`, `expenses`, `market_prices`, `weather_cache`, `outbreak_alerts`, `voice_queries` | ✅ Completed | `backend/alembic/versions/0001_initial_12_tables.py` |
| **P05** | Seed Data Loader | Idempotent upsert of 10 crops, 25 diseases, 15 treatments from JSON | ✅ Completed | `backend/scripts/seed.py`, `backend/seed_data/` |
| **P06** | Auth, Farm CRUD & Image Upload | JWT auth, India bounding box validation, Pillow 1280px resize & EXIF strip | ✅ Completed | `backend/app/routers/` (`auth.py`, `farms.py`, `uploads.py`) |
| **P07** | Dataset Audit & Clean Splits | Audited 20,298 Tomato & Potato images, 13 classes, dHash deduplication, 70/15/15 stratified split | ✅ Completed | `ml-training/data/split.csv`, `class_names.json`, `audit_and_split.py` |
| **P08** | Disease Classifier Transfer Learning | MobileNetV2 with ImageNet weights, embedded preprocessing, frozen base + fine-tuning top 30 | ✅ Completed | `ml-training/models/best.keras`, `ml-training/train_disease.py` |
| **P09** | Honest Evaluation & Calibration | 3,045 held-out test images: **93.27% accuracy**, 0.9160 Macro F1, calibration buckets, threshold `0.70` | ✅ Completed | `ml-training/models/metrics.json`, `backend/app/ml/metrics.json` |
| **P10** | TFLite Edge Export & Model Card | INT8 dynamic range (2.4MB) & Float16 (4.4MB), 100% top-1 agreement, 5.8ms CPU latency | ✅ Completed | `backend/app/ml/model.tflite`, `ml-training/models/MODEL_CARD.md` |
| **P11** | Crop Recommendation Model | 5-fold CV Random Forest / XGBoost: **99.55% CV accuracy**, top-3 probability recommendations | ✅ Completed | `backend/app/ml/crop_recommender.joblib`, `crop_label_encoder.joblib` |
| **P12** | Yield Prediction Model | 19,537 historical records, XGBoost regressor (**R² = 0.9704**), disease severity loss multipliers | ✅ Completed | `backend/app/ml/yield_predictor.joblib`, `yield_metadata.json` |
| **P13** | TFLite Leaf Disease Detection | `POST /detect-disease` (TFLite inference, top 3, low confidence `<0.70`, crop mismatch, DB report) & `GET /ml/model-info` | ✅ Completed | `backend/app/services/detection_service.py`, `backend/app/routers/detection.py` |
| **P14** | Disease History & Reference Endpoints | `GET /disease-history` (paginated), `GET /disease-reports/{id}`, `GET /crops`, `GET /diseases`, `GET /admin/disease-stats` | ✅ Completed | `backend/app/routers/history.py`, `backend/app/schemas/history.py` |
| **P15** | Weather & Spray Windows | Live OpenWeather Current & 5-Day Forecast, Redis 30m cache, disease risk alert, spray windows, Next.js UI | ✅ Completed | `backend/app/services/weather_service.py`, `frontend/src/app/weather/page.jsx` |
| **P16** | Mandi Market Prices | `GET /get-market-price` with Redis 6h caching, 7-day trend, DB upsert, and `mandi_sample.csv` fallback | ✅ Completed | `backend/data/crop_commodity_map.json`, `backend/app/services/price_service.py`, `backend/app/routers/prices.py` |
| **P17** | Soil Records & Crop Recommendation | `POST /soil-records` (pH 3.5-9.5 validation), `GET /soil-records`, `GET /recommend-crops` (Rule + ML hybrid advisor) | ✅ Completed | `backend/app/services/crop_advisor.py`, `backend/app/routers/soil.py`, `backend/app/schemas/soil.py` |
| **P18** | Farm Expenses & Profit Analysis | CRUD `/expenses`, `GET /expenses/summary` (type & month), `GET /profit-summary` (low/modal/high scenarios, break-even price) | ✅ Completed | `backend/app/services/expense_service.py`, `backend/app/routers/expenses.py`, `backend/app/schemas/expense.py` |
| **P19** | Guardrail Plain Explainer | Zero-hallucination explainer layer (`TemplateExplainer`, `OllamaExplainer`, `ApiExplainer`), Hindi & English advisories | ✅ Completed | `backend/prompts/explain_v1.txt`, `backend/app/services/explainer.py` |
| **P20** | Multilingual Voice Assistant | `POST /voice-query` (STT, NLU intent dispatch for weather, price, disease, soil, expenses, TTS generation) | ✅ Completed | `backend/app/services/nlu.py`, `backend/app/ml/stt.py`, `backend/app/services/voice_orchestrator.py`, `backend/app/routers/voice.py` |
| **P21** | DBSCAN Outbreak Detection | Spatial & temporal clustering with Haversine DBSCAN (min 3 distinct farmers), `GET /outbreaks` (50km farmer filter), simulation script | ✅ Completed | `backend/app/services/outbreak.py`, `backend/app/routers/outbreaks.py`, `backend/scripts/simulate_reports.py` |
| **P22** | Test Suite & Security Hardening | Rate limiting (slowapi/sliding window), security headers, request size limits, comprehensive pytest suite, security guide | ✅ Completed | `backend/app/core/rate_limit.py`, [SECURITY.md](file:///Users/harshvardhanmishra/Desktop/Krishi%20Drishti/SECURITY.md), `backend/tests/` |
| **P23** | Frontend Foundation & Design Tokens | Next.js 14 App Router, Tailwind tokens (#2E7D32, 52px buttons, 16px cards), Hindi/English i18n, API client with retry & JWT | ✅ Completed | `frontend/src/` (`layout.jsx`, `api.js`, `context/`, `locales/`, `components/`) |
| **P24** | Auth, Dashboard & Add Farm Modal | `/login`, `/signup` with phone & password, protected `/dashboard`, mini weather widget, 6 quick action tiles, `AddFarmModal` | ✅ Completed | `frontend/src/app/` (`login/`, `signup/`, `dashboard/`), `AddFarmModal.jsx` |
| **P25** | Leaf Disease Detection UI | `/scan` page: camera/gallery, canvas 1024px compression, top-3 predictions, confidence bar, warnings, treatments, TTS | ✅ Completed | `frontend/src/app/scan/page.jsx` |
| **P26** | Weather & Spray Windows UI | `/weather` page: 48px temp hero, fungal risk alert, spray windows, 5-day forecast horizontal scroll, stale data fallback | ✅ Completed | `frontend/src/app/weather/page.jsx` |
| **P27** | Soil Health & Recommendation UI | `/soil` page: NPK parameters, pH slider (3.5-9.5), crop recommendations, Soil Health Card note, lab locator link | ✅ Completed | `frontend/src/app/soil/page.jsx` |
| **P28** | Expense Tracker & Profit Calculator UI | `/tracker` page: Spent, Revenue, Profit (low/modal/high scenarios), monthly bar chart, CRUD expenses modal, break-even price | ✅ Completed | `frontend/src/app/tracker/page.jsx` |
| **P29** | Multilingual Voice Assistant UI | `/voice` page: pulsing mic button, WebM recording (max 30s), pipeline stages, text query fallback, audio player | ✅ Completed | `frontend/src/app/voice/page.jsx` |
| **P30** | Outbreak Alerts Radar & Map UI | `/outbreaks` page: dynamic Leaflet map (`react-leaflet`, ssr:false), clusters by severity, officer DBSCAN trigger | ✅ Completed | `frontend/src/app/outbreaks/page.jsx`, `frontend/src/components/OutbreakMap.jsx` |
| **P31** | PWA & Low-Bandwidth 2G/3G Optimization | `manifest.json`, `sw.js` (Cache-First static, Stale-While-Revalidate weather/price, Network-First fallback), icons | ✅ Completed | `frontend/public/` (`manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`), `PwaManager.jsx` |
| **P32** | Offline Leaf Classifier & Sync Queue | IndexedDB local queue for field scans during blackouts, automatic background sync on `window.online` | ✅ Completed | `frontend/src/lib/offlineClassifier.js`, `frontend/src/components/PwaManager.jsx` |

---

## Verification Summary
- **Backend Pytest Suite**: **51 passed, 0 failed** across all test suites in 3.12s (`backend/tests/`).
- **Frontend Build**: Next.js 14 production build compiled cleanly (`npm run build`) with **13 static/server routes** and 0 errors.
- **Database & Cache**: PostgreSQL 16 + PostGIS on port 5433, Redis on port 6380 healthy and active.
