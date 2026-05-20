# Zależności Technologiczne, Procedury Uruchomienia i Odtwarzania - Ledwo Zrekrutowani

## Spis Treści

1. [Zależności Technologiczne Backend'u](#zależności-technologiczne-backend)
2. [Zależności Technologiczne Frontend'u](#zależności-technologiczne-frontend)
3. [Wymagania Systemowe](#wymagania-systemowe)
4. [Wymagane Wersje Narzędzi](#wymagane-wersje-narzędzi)
5. [Procedury Uruchomienia](#procedury-uruchomienia)
6. [Procedury Aktualizacji](#procedury-aktualizacji)
7. [Procedury Kopii Bezpieczeństwa](#procedury-kopii-bezpieczeństwa)
8. [Procedury Odtwarzania Środowiska](#procedury-odtwarzania-środowiska)
9. [Disaster Recovery](#disaster-recovery)
10. [CI/CD Pipelines](#cicd-pipelines)

---

## Zależności Technologiczne Backend

### Backend Requirements (Python)

**Plik:** `backend/requirements.txt`

```
Django~=6.0.3
djangorestframework~=3.17.1
psycopg2-binary
python-dotenv~=1.2.2
djangorestframework-simplejwt
django-cors-headers
docxtpl~=0.20.2
```

### Szczegółowy Opis Zależności

| Pakiet | Wersja | Cel | Licencja |
|--------|--------|-----|---------|
| **Django** | ~6.0.3 | Web framework, ORM, Admin panel | BSD |
| **Django REST Framework** | ~3.17.1 | REST API framework | BSD |
| **psycopg2-binary** | Latest | PostgreSQL adapter dla Python | LGPL |
| **python-dotenv** | ~1.2.2 | Environment variables loading | BSD |
| **djangorestframework-simplejwt** | Latest | JWT token authentication | MIT |
| **django-cors-headers** | Latest | CORS support | MIT |
| **docxtpl** | ~0.20.2 | Word document template generation | MIT |

### Opcjonalne Pakiety (Production)

Rekomendujemy dodać do requirements.txt dla produkcji:

```bash
# Production Server
gunicorn~=21.2.0           # WSGI HTTP Server

# Async Tasks
celery~=5.3.0              # Async task queue
redis~=5.0.0               # Cache & Message Broker

# Monitoring
sentry-sdk~=1.30.0         # Error tracking
django-prometheus~=2.3.0   # Prometheus metrics

# Performance
django-cachalot~=2.6.0     # ORM query caching
django-db-geventpool~=4.0  # Connection pooling

# Security
django-ratelimit~=4.0.0    # Rate limiting
django-cors-headers        # Already included

# Testing
pytest~=7.4.0              # Testing framework
pytest-django~=4.5.0       # Django testing
factory-boy~=3.3.0         # Test fixtures
```

**Instalacja:**
```bash
pip install -r requirements.txt
pip install -r requirements-production.txt  # Dla produkcji
```

---

## Zależności Technologiczne Frontend

### Frontend Dependencies (npm)

**Plik:** `frontend/package.json`

```json
{
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router-dom": "^7.13.1",
    "@tailwindcss/postcss": "^4.2.2",
    "@tailwindcss/vite": "^4.2.2"
  },
  "devDependencies": {
    "vite": "^8.0.2",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^9.39.4",
    "@eslint/js": "^9.39.4",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "tailwindcss": "^4.2.2",
    "autoprefixer": "^10.4.27",
    "postcss": "^8.5.8"
  }
}
```

### Szczegółowy Opis Zależności

| Pakiet | Wersja | Typ | Cel | Licencja |
|--------|--------|-----|-----|---------|
| **react** | ^19.2.4 | Prod | UI Library | MIT |
| **react-dom** | ^19.2.4 | Prod | DOM Rendering | MIT |
| **react-router-dom** | ^7.13.1 | Prod | Client-side routing | MIT |
| **@tailwindcss/postcss** | ^4.2.2 | Prod | Tailwind CSS | MIT |
| **@tailwindcss/vite** | ^4.2.2 | Prod | Vite plugin for Tailwind | MIT |
| **vite** | ^8.0.2 | Dev | Build tool | MIT |
| **@vitejs/plugin-react** | ^6.0.1 | Dev | Vite React plugin | MIT |
| **eslint** | ^9.39.4 | Dev | Code linter | MIT |
| **@eslint/js** | ^9.39.4 | Dev | ESLint JS rules | MIT |
| **eslint-plugin-react-hooks** | ^7.0.1 | Dev | React Hooks rules | MIT |
| **eslint-plugin-react-refresh** | ^0.5.2 | Dev | Fast Refresh rules | MIT |
| **tailwindcss** | ^4.2.2 | Dev | CSS Framework | MIT |
| **autoprefixer** | ^10.4.27 | Dev | Vendor prefixes | MIT |
| **postcss** | ^8.5.8 | Dev | CSS transformer | MIT |

### Opcjonalne Pakiety

Rekomendujemy dla produkcji/development:

```json
{
  "dependencies": {
    "axios": "^1.6.0",                    // HTTP Client
    "zustand": "^4.4.0",                  // State Management
    "react-query": "^3.39.0",             // Data fetching
    "react-helmet": "^6.1.0",             // Meta tags
    "clsx": "^2.0.0"                      // ClassName utils
  },
  "devDependencies": {
    "prettier": "^3.1.0",                 // Code formatter
    "husky": "^8.0.0",                    // Git hooks
    "lint-staged": "^15.0.0",             // Staged linting
    "@testing-library/react": "^14.0.0",  // Testing
    "vitest": "^1.0.0"                    // Test runner
  }
}
```

**Instalacja:**
```bash
npm install
npm install --save-dev <package>  # Dodaj dev dependency
npm install --save <package>      # Dodaj prod dependency
```

---

## Wymagania Systemowe

### Minimum Requirements (Development)

| Komponent | Minimum | Rekomendowane | Producja |
|-----------|---------|---------------|----------|
| **CPU** | 2 cores | 4 cores | 8 cores |
| **RAM** | 4 GB | 8 GB | 16 GB |
| **Disk Space** | 20 GB | 50 GB | 100 GB+ |
| **Network** | 1 Mbps | 10 Mbps | 100 Mbps |
| **OS** | Windows 10, macOS 10.14, Ubuntu 18.04 | Windows 11, macOS 12+, Ubuntu 20.04+ | Ubuntu 20.04 LTS |

### Wymagane Oprogramowanie

#### **Windows**
- Python 3.10+ ([python.org](https://www.python.org/))
- Node.js 18+ LTS ([nodejs.org](https://nodejs.org/))
- PostgreSQL 12+ ([postgresql.org](https://www.postgresql.org/))
- Git 2.30+ ([git-scm.com](https://git-scm.com/))
- Docker Desktop (opcjonalne, ale rekomendowane)
- Visual C++ Build Tools (dla psycopg2)

#### **macOS**
- Python 3.10+ (via Homebrew: `brew install python@3.11`)
- Node.js 18+ (via Homebrew: `brew install node`)
- PostgreSQL 12+ (via Homebrew: `brew install postgresql`)
- Git (via Xcode Command Line Tools)
- Xcode Command Line Tools: `xcode-select --install`
- Docker Desktop (opcjonalne)

#### **Linux (Ubuntu 20.04+)**
```bash
sudo apt-get update
sudo apt-get install -y python3.11 python3.11-venv python3-pip
sudo apt-get install -y nodejs npm
sudo apt-get install -y postgresql postgresql-contrib
sudo apt-get install -y git
sudo apt-get install -y build-essential libpq-dev
```

---

## Wymagane Wersje Narzędzi

### Python Stack

```
Python:         3.10, 3.11, 3.12 (rekomendowane 3.11)
pip:            ≥20.0
virtualenv:     ≥20.0
setuptools:     ≥45.0
wheel:          ≥0.36.0
```

**Sprawdzenie wersji:**
```bash
python --version
pip --version
```

### Node.js Stack

```
Node.js:        18.0.0+, 20.0.0+ (rekomendowane 20 LTS)
npm:            8.0.0+, 9.0.0+ (rekomendowane 10.x)
```

**Sprawdzenie wersji:**
```bash
node --version
npm --version
```

**Aktualizacja npm:**
```bash
npm install -g npm@latest
```

### Database Stack

```
PostgreSQL:     12.0+, 15.0+ (rekomendowane 16+)
pgAdmin:        (opcjonalnie) 7.0+
```

**Sprawdzenie wersji:**
```bash
psql --version
```

### Docker Stack (Opcjonalnie)

```
Docker:         20.10+, 24.0+
Docker Compose: 2.0+
```

**Sprawdzenie wersji:**
```bash
docker --version
docker-compose --version
```

### Git

```
Git:            2.30.0+
```

**Sprawdzenie wersji:**
```bash
git --version
```

---

## Procedury Uruchomienia

### 1. Development Setup (Local)

#### **Backend - First Time Setup**

```bash
cd backend

# Stwórz virtual environment
python -m venv .venv

# Aktywuj venv
# Windows:
.venv\Scripts\Activate.ps1

# macOS/Linux:
source .venv/bin/activate

# Zainstaluj zależności
pip install -r requirements.txt

# Stwórz .env plik
cp .env.example .env  # Lub ręcznie: patrz INSTALACJA_KONFIGURACJA_WDROZENIE.md

# Uruchom migracje
python manage.py migrate

# Stwórz super user'a
python manage.py createsuperuser

# Załaduj example data (opcjonalnie)
python manage.py loaddata fixtures/initial_data.json

# Uruchom dev server
python manage.py runserver
```

**Server dostępny:** `http://localhost:8000`

#### **Frontend - First Time Setup**

```bash
cd frontend

# Zainstaluj zależności
npm install

# Stwórz .env.local (opcjonalnie)
cp .env.example .env.local

# Uruchom dev server
npm run dev
```

**Server dostępny:** `http://localhost:5173`

---

### 2. Development - Daily Start

#### **Backend**

```bash
cd backend

# Aktywuj venv
.venv\Scripts\Activate.ps1  # Windows
# lub
source .venv/bin/activate   # macOS/Linux

# Uruchom server
python manage.py runserver
```

#### **Frontend**

```bash
cd frontend
npm run dev
```

---

### 3. Docker Setup

#### **Start z Docker Compose**

```bash
cd backend

# Build image'u
docker-compose build

# Uruchom kontenery
docker-compose up -d

# Uruchom migracje
docker-compose exec django python manage.py migrate

# Stwórz super user'a
docker-compose exec django python manage.py createsuperuser

# Sprawdź logs
docker-compose logs -f django
docker-compose logs -f postgres
```

**Django dostępne:** `http://localhost:8000`
**PostgreSQL dostępna:** `localhost:5432`

#### **Stop Docker**

```bash
docker-compose down
```

---

### 4. Production Setup

#### **Build Frontend**

```bash
cd frontend
npm run build
```

Output: `frontend/dist/` - gotowe pliki statyczne

#### **Collect Static Files (Backend)**

```bash
cd backend
python manage.py collectstatic --noinput
```

#### **Start Production Server (Gunicorn)**

```bash
cd backend

# Zainstaluj Gunicorn
pip install gunicorn

# Uruchom
gunicorn --workers=4 --bind=0.0.0.0:8000 core.wsgi:application
```

#### **Nginx Configuration**

Patrz: [INSTALACJA_KONFIGURACJA_WDROZENIE.md](INSTALACJA_KONFIGURACJA_WDROZENIE.md) - sekcja Nginx Reverse Proxy

---

## Procedury Aktualizacji

### 1. Aktualizacja Python Pakietów

#### **Check dla dostępnych aktualizacji**

```bash
cd backend
source .venv/bin/activate

# List outdated packages
pip list --outdated
```

#### **Aktualizacja pojedynczego pakietu**

```bash
pip install --upgrade Django
pip install Django==6.1.0  # Konkretna wersja
```

#### **Aktualizacja wszystkich pakietów**

```bash
pip install --upgrade pip setuptools wheel

# Bezpieczna aktualizacja (bez breaking changes)
pip list --outdated --format=json | jq -r '.[] | "\(.name)==\(.latest_version)"' | xargs -n1 pip install -U
```

#### **Backup i Restore requirements**

```bash
# Wygeneruj backup
pip freeze > requirements_backup_$(date +%Y%m%d).txt

# Restore z backup'u
pip install -r requirements_backup_20260520.txt
```

### 2. Aktualizacja npm Pakietów

#### **Check dla dostępnych aktualizacji**

```bash
cd frontend
npm outdated
```

#### **Aktualizacja pojedynczego pakietu**

```bash
npm install react@latest
npm install react@19.2.5
```

#### **Aktualizacja wszystkich pakietów**

```bash
npm update
npm audit fix  # Automatycznie napraw bezpieczeństwo
```

#### **Major Version Update**

```bash
# Check co się zmieni
npm outdated

# Backup package-lock.json
cp package-lock.json package-lock.json.backup

# Aktualizuj major version
npm install react@19  # Zmieni na najnowszą v19
```

### 3. Django Migrations

#### **Po zmianach modeli**

```bash
cd backend
source .venv/bin/activate

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Check status
python manage.py showmigrations
```

#### **Dry-run - zobacz co się zmieni**

```bash
python manage.py migrate --plan
```

### 4. Database Schema Update

#### **Backup przed zmianami**

```bash
PGPASSWORD=$DB_PASSWORD pg_dump -U $DB_USER -h localhost $DB_NAME > backup_before_update.sql
```

#### **Apply changes**

```bash
python manage.py migrate
```

#### **Verify**

```bash
python manage.py check
```

---

## Procedury Kopii Bezpieczeństwa

### 1. Backup Bazy Danych (PostgreSQL)

#### **Manual Backup**

```bash
# Windows
$env:PGPASSWORD='your_password'
pg_dump -U postgres -h localhost ledwo_db > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql

# macOS/Linux
PGPASSWORD='your_password' pg_dump -U postgres -h localhost ledwo_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### **Docker Backup**

```bash
docker-compose exec postgres pg_dump -U postgres ledwo_db > backup.sql
gzip backup.sql
```

#### **Compressed Backup**

```bash
PGPASSWORD='password' pg_dump -U postgres ledwo_db | gzip > backup_$(date +%Y%m%d).sql.gz
```

#### **Scheduled Backup (Cron)**

**Linux:**
```bash
# Dodaj do crontab
0 2 * * * PGPASSWORD='password' pg_dump -U postgres ledwo_db | gzip > /backups/ledwo_$(date +\%Y\%m\%d).sql.gz

# Edit crontab
crontab -e
```

### 2. Backup Media Files

```bash
# Tar archive
tar -czf media_backup_$(date +%Y%m%d).tar.gz backend/media/

# Rsync (dla ciągłych backupów)
rsync -av backend/media/ /backups/media_current/

# Cloud backup (AWS S3)
aws s3 sync backend/media/ s3://my-bucket/backups/media/
```

### 3. Backup Całego Projektu

```bash
# Full project backup (exclude large folders)
tar --exclude='.git' \
    --exclude='backend/.venv' \
    --exclude='frontend/node_modules' \
    --exclude='backend/media/large_files' \
    -czf project_backup_$(date +%Y%m%d).tar.gz .
```

### 4. Backup Configuration

**Script:** `backup.sh`
```bash
#!/bin/bash

BACKUP_DIR="/backups/ledwo"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump -U postgres ledwo_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Media backup
tar -czf $BACKUP_DIR/media_$DATE.tar.gz backend/media/

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete
find $BACKUP_DIR -name "media_*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

**Uruchomienie automatyczne:**
```bash
# Crontab entry - daily at 2 AM
0 2 * * * /home/user/backup.sh >> /var/log/backup.log 2>&1
```

---

## Procedury Odtwarzania Środowiska

### 1. Restore Bazy Danych

#### **From SQL Backup**

```bash
# Prostsze
PGPASSWORD='password' psql -U postgres -h localhost ledwo_db < backup_20260520.sql

# Z gzipped backup'u
gunzip -c backup_20260520.sql.gz | PGPASSWORD='password' psql -U postgres -h localhost ledwo_db
```

#### **Docker Restore**

```bash
docker-compose exec postgres psql -U postgres ledwo_db < backup.sql
```

#### **Partial Restore (konkretne tabele)**

```bash
# Lista tabel w backup'ie
pg_restore -l backup_20260520.sql | grep TABLE

# Restore konkretnej tabeli
pg_restore -t users_user backup_20260520.sql | psql -U postgres ledwo_db
```

### 2. Restore Media Files

```bash
# From tar archive
tar -xzf media_backup_20260520.tar.gz -C backend/

# Restore specific folder
tar -xzf media_backup_20260520.tar.gz media/submitted/ -C backend/
```

### 3. From-Scratch Rebuild (Development)

#### **Backend**

```bash
cd backend

# Remove old venv
rm -rf .venv

# Create new venv
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (patrz template)
nano .env

# Run migrations on fresh DB
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load fixture data (opcjonalnie)
python manage.py loaddata fixtures/initial_data.json

# Run dev server
python manage.py runserver
```

#### **Frontend**

```bash
cd frontend

# Remove node_modules
rm -rf node_modules package-lock.json

# Install dependencies
npm install

# Run dev server
npm run dev
```

### 4. From-Scratch with Docker

```bash
cd backend

# Remove old containers and volumes (⚠️ CAUTION - Deletes data!)
docker-compose down -v

# Rebuild containers
docker-compose build --no-cache

# Start containers
docker-compose up -d

# Run migrations
docker-compose exec django python manage.py migrate

# Create superuser
docker-compose exec django python manage.py createsuperuser

# Load fixtures
docker-compose exec django python manage.py loaddata fixtures/initial_data.json

# Check status
docker-compose ps
```

### 5. Database Reset (Development Only)

```bash
cd backend
source .venv/bin/activate

# ⚠️ WARNING: Deletes all data!
python manage.py flush

# Then run migrations
python manage.py migrate

# Create fresh superuser
python manage.py createsuperuser
```

---

## Disaster Recovery

### 1. Complete System Failure

#### **Scenario: Server Lost All Data**

**Recovery Steps:**

1. **Provision new server:**
   ```bash
   # Install OS (Ubuntu 20.04 LTS)
   # Install dependencies
   ```

2. **Restore from backups:**
   ```bash
   # Copy database backup
   scp user@old-server:/backups/db_latest.sql.gz .
   
   # Restore database
   gunzip -c db_latest.sql.gz | psql -U postgres ledwo_db
   
   # Restore media files
   scp -r user@old-server:/backups/media/ ./backend/
   ```

3. **Deploy application:**
   ```bash
   git clone https://github.com/org/Ledwo-Zrekrutowani.git
   cd Ledwo-Zrekrutowani
   docker-compose up -d
   ```

4. **Verify:**
   ```bash
   docker-compose ps
   curl http://localhost:8000/api/studies/editions/
   ```

### 2. Database Corruption

```bash
# 1. Stop application
docker-compose down

# 2. Restore from backup
gunzip -c backup_last_good.sql.gz | psql -U postgres ledwo_db

# 3. Verify database integrity
psql -U postgres ledwo_db -c "REINDEX DATABASE ledwo_db;"

# 4. Start application
docker-compose up -d

# 5. Check logs for errors
docker-compose logs django
```

### 3. Disk Full

```bash
# Find large files
du -sh /var/lib/postgresql/*
du -sh /app/media/*
du -sh /var/log/*

# Clean old backups
rm -f /backups/*.sql.gz  # older than X days

# Clean old logs
find /var/log -name "*.log" -mtime +30 -delete

# Clean Docker dangling images
docker image prune -a --force

# Clean temporary files
rm -rf /tmp/*
```

### 4. Recovery Point Objective (RPO) & Recovery Time Objective (RTO)

| Scenario | RPO | RTO | Procedure |
|----------|-----|-----|-----------|
| Database backup | 24 hours | 1-2 hours | Restore from daily backup |
| Full system failure | 24 hours | 4-6 hours | Rebuild server + restore backups |
| Disk failure | 24 hours | 2-4 hours | Replace disk + restore data |
| Data corruption | 24 hours | 1-2 hours | Restore corrupted table/database |

---

## CI/CD Pipelines

### 1. GitHub Actions (Example)

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:18
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-django
      
      - name: Run tests
        run: |
          cd backend
          pytest
      
      - name: Run Django checks
        run: |
          cd backend
          python manage.py check --deploy

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          docker build -t ledwo:latest backend/
      
      - name: Push to registry
        run: |
          docker tag ledwo:latest myregistry/ledwo:latest
          docker push myregistry/ledwo:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    
    steps:
      - name: Deploy to production
        run: |
          ssh -i ${{ secrets.SSH_KEY }} user@server 'cd /app && docker-compose pull && docker-compose up -d'
```

### 2. Before Deployment Checklist

```bash
# Backend
cd backend
python manage.py check --deploy
pytest
python manage.py migrate --plan  # Preview migrations

# Frontend
cd ../frontend
npm run lint
npm run build
npm run preview
```

### 3. Post-Deployment Verification

```bash
# Health check
curl http://localhost:8000/health/

# API test
curl http://localhost:8000/api/studies/editions/

# Database integrity
psql -U postgres ledwo_db -c "SELECT COUNT(*) FROM users_user;"

# Check logs
docker-compose logs --tail=100 django
docker-compose logs --tail=100 postgres
```

---

**Ostatnia aktualizacja:** 20.05.2026

**Wersja:** 1.0

**Status:** ✅ Kompletny - Production-Ready
