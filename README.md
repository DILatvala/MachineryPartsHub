# Machinery Parts Hub

Machinery Parts Hub (MPH Group) supplies original and alternative spare parts for excavators, bulldozers, loaders, cranes, and other construction and road machinery.

## Overview
This project includes:
- public storefront and heavy-equipment parts catalog
- validated spare-parts request form
- a separate manager site for request tracking and status changes
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
- Manager panel: configured as a separate Render static site in the Blueprint
- Backend API: https://mph-backend-9nud.onrender.com

### Deploying on Render
1. Push the repository to GitHub and sync the Render Blueprint in [render.yaml](./render.yaml).
2. Set `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` to both the storefront and manager-site origins, separated by commas and without trailing slashes. Set `MANAGER_USERNAME` and `MANAGER_PASSWORD` as private environment values.
3. The Blueprint deploys the storefront and a separate manager-panel static site, plus the Django API and free PostgreSQL database. Both frontend builds get their API URL from the Blueprint.
4. Render assigns a URL to the manager site when it is created. Put that exact URL in the storefront's `VITE_ADMIN_URL`, and add both site URLs to the backend's CORS and CSRF trusted-origin settings, then redeploy.

The demo database on Render's free plan expires after 30 days, and the free backend can spin down while idle. This setup is intended for demonstration, not durable production data.

The published company phone, email, and social links are listed in the storefront. The catalog starts with sample heavy-equipment categories and can be maintained in Django admin.

## Current status
The storefront and manager flow are implemented and validated. The project is now positioned as an MVP-ready prototype with deployment and environment configuration in place.
