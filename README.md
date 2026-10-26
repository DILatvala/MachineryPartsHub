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

### Backend on Render
1. Push the repository to GitHub.
2. Create a new Render web service pointing to this repository.
3. Use the included [render.yaml](./render.yaml) blueprint or set the service root to `backend`.
4. Set the prompted `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `MANAGER_USERNAME`, and `MANAGER_PASSWORD` values. Set `ALLOWED_HOSTS` to the exact Render service hostname if its name differs from `mph-backend.onrender.com`.
5. Deploy the service. Its pre-deploy command applies migrations, and startup creates/updates the staff manager from configured credentials before starting Gunicorn.

### Frontend on Cloudflare Pages
1. Import the `frontend/` folder into Cloudflare Pages.
2. Set the build command to `npm install && npm run build`.
3. Set the build output directory to `dist`.
4. Add `VITE_API_URL` pointing to the deployed Render backend URL, using the example in [frontend/.env.production.example](./frontend/.env.production.example).

## Current status
The storefront and manager flow are implemented and validated. The project is now positioned as an MVP-ready prototype with deployment and environment configuration in place.
