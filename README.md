# MachineryPartsHub

MachineryPartsHub is a fullstack automotive spare parts and service website prototype.

## Overview
This project includes:
- public storefront and catalog browsing
- service request form with client-side validation
- manager/admin view for request tracking and status changes
- deployable React + Django setup for local and containerized development

## Docs
- [plan.md](./plan.md)
- [task.md](./task.md)
- [project-structure.md](./project-structure.md)

## Tech stack
- Frontend: React, TypeScript, Vite
- Backend: Django, Django REST Framework
- Data: SQLite for local development, PostgreSQL-ready configuration
- Deployment: Docker Compose for local orchestration; ready for Render/Cloudflare-style hosting

## Local setup

### Backend
```bash
cd backend
copy .env.example .env  # Windows PowerShell
python -m venv .venv
. .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev -- --host 0.0.0.0 --port 5173
```

### Seed demo data and manager login
```bash
cd backend
python manage.py seed_manager
python manage.py seed_catalog
python manage.py seed_requests
```

For local development, set `MANAGER_USERNAME` and `MANAGER_PASSWORD` in `backend/.env` before running `seed_manager`. Choose a non-default password; the seed command does not print it.

### Docker Compose
```bash
copy .env.example .env  # Windows PowerShell
docker compose up --build
```

This starts:
- frontend on http://localhost:5173
- backend on http://localhost:8000
- PostgreSQL on localhost:5432

## Production deployment

### Live demo
- Frontend: https://mph-frontend-qn7j.onrender.com
- Backend API: https://mph-backend-9nud.onrender.com

### Deploying on Render
1. Push the repository to GitHub and create a Render Blueprint from the included [render.yaml](./render.yaml).
2. Set the prompted `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `MANAGER_USERNAME`, and `MANAGER_PASSWORD` values. Use the exact frontend URL for both origin settings, without a trailing slash.
3. The Blueprint deploys the React frontend as a free static site and the Django API as a free web service, backed by free PostgreSQL. The frontend build gets `VITE_API_URL` from the Blueprint.
4. If Render assigns a different hostname to either service, update `ALLOWED_HOSTS`, `VITE_API_URL`, and the origin settings to match the actual URLs, then redeploy.

The demo database on Render's free plan expires after 30 days, and the free backend can spin down while idle. This setup is intended for demonstration, not durable production data.

## Current status
The storefront and manager flow are implemented and validated. The project is now positioned as an MVP-ready prototype with deployment and environment configuration in place.
