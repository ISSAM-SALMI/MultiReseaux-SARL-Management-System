# MultiReseaux SARL Management System

## Overview
This is a full-stack application for managing MultiReseaux SARL, built with Django (Backend) and React (Frontend).

## Stack
- **Backend:** Django 5.0, DRF, PostgreSQL, Celery, Redis
- **Frontend:** React, TypeScript, Vite, TailwindCSS, Zustand, React Query
- **Infrastructure:** Docker Compose, Nginx

## Prerequisites
- Docker & Docker Compose installed

## Setup & Run

1. **Clone the repository** (if not already done).

2. **Environment Variables**
   - The `docker-compose.yml` contains default environment variables for development.
   - For production, create a `.env` file and reference it.

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost/api/
   - Django Admin: http://localhost/admin/

5. **Initial Data Setup**
   - Create a superuser:
     ```bash
     docker-compose exec backend python manage.py createsuperuser
     ```
   - Run migrations (should run automatically on startup, but if needed):
     ```bash
     docker-compose exec backend python manage.py migrate
     ```

## Project Structure
- `backend/`: Django project source code
- `frontend/`: React application source code
- `nginx/`: Nginx configuration
- `docker-compose.yml`: Service orchestration

## Features
- **Authentication:** JWT based auth with RBAC.
- **Dashboard:** Real-time KPIs.
- **Modules:** Clients, Projects, Quotes, Budget, Invoices, Documents.
- **PDF Export:** Async PDF generation for quotes.
- **Audit Log:** Tracks all changes to business data.

## Development
- **Backend:** Changes in `backend/` will auto-reload (mounted volume).
- **Frontend:** Changes in `frontend/` will auto-reload (Vite HMR).

## Notes
- Ensure ports 80, 8000, 5173, 5432, 6379 are free or adjust `docker-compose.yml`.
