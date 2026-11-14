# Krishi Drishti

Krishi Drishti is a web app for Indian farmers, with crop disease scanning and guidance, farm and soil records, weather, mandi prices, expense tracking, voice queries, and outbreak alerts.

## Project structure

- `frontend/` — Next.js app (port `3001`)
- `backend/` — FastAPI API (port `8001`), database models, migrations, and tests
- `backend/app/ml/artifacts/` — disease classifier and class metadata used by the API
- `ml-training/` — model training and evaluation scripts, notebooks, and artifacts
- `Dataset/` — crop and disease reference data, including the PlantVillage image dataset
- `docker-compose.yml` — local PostGIS and Redis services

## Requirements

- Python 3.11 recommended
- Node.js 18 or newer and npm
- Docker Desktop with Docker Compose
- Git LFS to download the PlantVillage image files

The PlantVillage folder is stored with Git LFS and is about 2.3 GB. Install Git LFS before cloning if you need the images:

```bash
git lfs install
git clone https://github.com/harshvardhanmishra32/Krishi-Drishti.git
```

The app can be set up without the image dataset if you already have a checkout and do not need those files; disease model artifacts are stored separately under `backend/app/ml/artifacts/`.

## Local setup

Run these commands from the repository root. Copy the environment template and set a private `SECRET_KEY` (at least 32 characters) before starting the backend:

```bash
cp .env.example .env
python3 -c 'import secrets; print(secrets.token_urlsafe(48))'
```

Paste the generated value into `SECRET_KEY` in `.env`. Keep `.env` private; it is ignored by Git. Add an OpenWeather API key to `.env` if you want live weather data.

Start the database and Redis:

```bash
docker compose up -d
```

Install backend dependencies and apply the database migration:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
```

Start the API from the `backend/` directory:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

The interactive API docs are at [http://localhost:8001/docs](http://localhost:8001/docs); the health endpoint is [http://localhost:8001/health](http://localhost:8001/health).

In a second terminal, install and run the frontend:

```bash
cd frontend
npm ci
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). The frontend uses `http://localhost:8001` for the API by default. Set `NEXT_PUBLIC_API_URL` before building or running the frontend to use a different API URL.

## Useful backend commands

Run these from `backend/` with its virtual environment active:

```bash
pytest -v                 # Run the backend test suite
python scripts/seed.py    # Seed crop, disease, and treatment reference data
```

Create an officer account for development:

```bash
python scripts/create_officer.py --name "Dr. Sharma" --phone 9876543210 --password 'replace-this-password' --role officer
```

## Main API areas

The API provides health checks, authentication, farms, image uploads and disease detection, diagnosis history, weather, market prices, soil records, expenses, voice queries, and outbreak alerts. See `/docs` on a running backend for the current routes and request schemas.

## Dataset and model notes

- PlantVillage images are tracked with Git LFS; a GitHub web upload or regular Git push cannot upload this folder as ordinary files.
- Crop and disease CSVs are in `Dataset/`.
- The training scripts and notebooks are in `ml-training/`; the API's disease model artifacts are in `backend/app/ml/artifacts/`.
- The PlantVillage image dataset is for training and evaluation; it is not required to start the frontend or API.
