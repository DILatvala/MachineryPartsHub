# MachineryPartsHub — Fullstack Plan

## Project goal
Create a fullstack automotive parts and service website with:
- public catalog for spare parts
- lead request form for customers
- admin/manager tools for catalog and request management
- deployable architecture for demo and production use

## Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- React Hook Form + Zod

### Backend
- Django
- Django REST Framework
- PostgreSQL
- Django admin for manager work
- JWT only if admin/authentication is needed beyond Django admin

### Infra and hosting
- Frontend: Cloudflare Pages
- Backend API: Render
- Database: PostgreSQL on Render or external managed PostgreSQL
- Media: Cloudflare R2 or S3-compatible object storage
- Optional: Redis later for caching and rate limiting

## Business scope
MVP should cover:
1. landing page with company overview
2. searchable parts catalog by category and keyword
3. request form for vehicle details and part/service needs
4. manager dashboard/admin area to review incoming requests
5. basic contact information and social links

## User stories
### Customer
- I can browse parts by category.
- I can search parts by keyword.
- I can submit a request with my vehicle details and required part/service.
- I can contact the company by phone or WhatsApp.

### Manager/Admin
- I can view all requests in one place.
- I can manage the product catalog.
- I can edit text/content without needing a developer.
- I can track request status and respond to customers.

## Functional modules
### 1. Public website
- landing page
- categories and filters
- search results
- request form
- contact section

### 2. Catalog API
- list parts
- filter by category
- search by keyword
- retrieve single part details

### 3. Request API
- create request
- validate required fields
- store customer name, phone, vehicle, and request text
- optional status field for admin processing

### 4. Admin management
- Django admin for catalog and requests
- ability to edit items and statuses
- manager login via Django session auth

## Non-functional goals
- responsive UI
- simple and fast public flows
- validation on client and server
- protection against spam using Turnstile or rate limiting
- secure configuration via environment variables
- basic test coverage for critical API and frontend flows

## Phased delivery
### Phase 1: Prototype to MVP
- static landing page migrated to React app
- catalog data from JSON or API
- request form validation
- backend API skeleton
- PostgreSQL model definitions
- Django admin working

### Phase 2: Live data flow
- real catalog database
- manager review of requests
- CRUD endpoints
- authorization for manager-only actions

### Phase 3: Production hardening
- Turnstile, rate limiting, logging
- image uploads to Cloudflare R2
- Telegram notifications or email integration
- performance and cache tuning

## Risks and constraints
- free hosting limits on Render and database retention
- no real stock/price data should be published before validation
- real photos should not be stored locally; use Cloudflare R2 or S3
- privacy policy is required for personal data collection

## Success criteria
The project is considered ready when:
- customer can search catalog and submit request
- manager can view and manage requests in admin
- app is deployable to Cloudflare Pages + Render
- core tests pass and forms validate properly
