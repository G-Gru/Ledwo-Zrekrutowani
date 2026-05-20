# Dokumentacja Instalacyjna, Konfiguracyjna i Wdrożeniowa - Ledwo Zrekrutowani

## 1. Instalacja Środowiska Development

### 1.1 Wymagania Systemowe

**Ogólne:**
- Windows 10+, macOS 10.14+, lub Linux (Ubuntu 18.04+)
- Git 2.20+
- Terminal (PowerShell, Bash, Zsh)

**Backend:**
- Python 3.10+
- PostgreSQL 12+
- pip (Package manager dla Python)

**Frontend:**
- Node.js 18+
- npm 8+ (lub Yarn/pnpm)

### 1.2 Instalacja Backend'u (Django)

#### **Krok 1: Klonowanie projektu**
```bash
git clone https://github.com/yourorg/Ledwo-Zrekrutowani.git
cd Ledwo-Zrekrutowani
```

#### **Krok 2: Stworzenie Virtual Environment**

**Windows:**
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

#### **Krok 3: Instalacja zależności**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### **Krok 4: Konfiguracja zmiennych środowiska**

Stwórz plik `.env` w katalogu `backend/`:
```bash
# Database
DB_NAME=ledwo_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432

# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Email
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**⚠️ WAŻNE:** Nigdy nie commituj `.env` na git! Dodaj do `.gitignore`:
```
.env
.env.local
*.pyc
__pycache__/
.venv/
db.sqlite3
```

#### **Krok 5: Konfiguracja PostgreSQL**

**Windows (PostgreSQL Installation):**
1. Pobierz z https://www.postgresql.org/download/windows/
2. Zainstaluj z domyślnymi ustawieniami
3. Pamiętaj hasło dla user'a `postgres`
4. Otwórz pgAdmin (dostarczone z instalacją)

**macOS (brew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Stworzenie bazy danych:**
```bash
psql -U postgres
```
```sql
CREATE DATABASE ledwo_db;
CREATE USER ledwo_user WITH PASSWORD 'your_password';
ALTER ROLE ledwo_user SET client_encoding TO 'utf8';
ALTER ROLE ledwo_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ledwo_user SET default_transaction_deferrable TO on;
ALTER ROLE ledwo_user SET default_transaction_level TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE ledwo_db TO ledwo_user;
\q
```

#### **Krok 6: Migracje bazy danych**
```bash
cd backend
python manage.py migrate
```

#### **Krok 7: Stworzenie Super Usera (Admin)**
```bash
python manage.py createsuperuser
```
```
Username: admin
Email: admin@example.com
Password: ***
Password (again): ***
```

#### **Krok 8: Uruchomienie Development Servera**
```bash
python manage.py runserver
```

**Backend będzie dostępny pod:** `http://localhost:8000`
- Django Admin: `http://localhost:8000/admin/`
- API: `http://localhost:8000/api/`

---

### 1.3 Instalacja Frontend'u (React + Vite)

#### **Krok 1: Przejście do katalogu frontend**
```bash
cd frontend
```

#### **Krok 2: Instalacja zależności npm**
```bash
npm install
```

(lub `yarn install` / `pnpm install`)

#### **Krok 3: Konfiguracja zmiennych środowiska (opcjonalne)**

Stwórz plik `.env.local` w `frontend/`:
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Ledwo Zrekrutowani
VITE_ENVIRONMENT=development
```

#### **Krok 4: Uruchomienie Development Servera**
```bash
npm run dev
```

**Frontend będzie dostępny pod:** `http://localhost:5173`

#### **Krok 5: Weryfikacja połączenia Backend-Frontend**

1. Otwórz `http://localhost:5173` w przeglądarce
2. Sprawdź konsolę (F12 → Console) czy są errory CORS
3. Spróbuj zalogować się (jeśli jest formularz logowania)

---

### 1.4 Typowe Problemy & Rozwiązania

| Problem | Przyczyna | Rozwiązanie |
|---------|-----------|------------|
| `ModuleNotFoundError: No module named 'django'` | Brak zainstalowanych zależności | `pip install -r requirements.txt` |
| PostgreSQL connection refused | PostgreSQL nie jest uruchomiony | `pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start` (Windows) |
| CORS error w przeglądarce | Frontend nie na whitelist'cie CORS | Sprawdź `CORS_ALLOWED_ORIGINS` w `.env` |
| Port 8000/5173 już w użyciu | Inny proces na tym porcie | `python manage.py runserver 8001` lub `npm run dev -- --port 5174` |
| `jwt.exceptions.DecodeError` | Tokena JWT przeterminowana/zła | Usuń tokena z localStorage i zaloguj się ponownie |

---

## 2. Dokumentacja Konfiguracyjna

### 2.1 Backend - Zmienne Środowiska

#### **Wymagane zmienne (.env)**

```bash
# ========== DATABASE ==========
DB_NAME=ledwo_db                    # Nazwa bazy danych
DB_USER=postgres                    # User PostgreSQL
DB_PASSWORD=your_password           # Hasło user'a
DB_HOST=localhost                   # Host bazy (localhost dla dev)
DB_PORT=5432                        # Port bazy

# ========== DJANGO ==========
SECRET_KEY=change-me-in-production  # Zmień w produkcji!
DEBUG=True                          # False w produkcji
ALLOWED_HOSTS=localhost,127.0.0.1  # Hosts do akceptacji

# ========== EMAIL ==========
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-app-password

# ========== CORS ==========
CORS_ALLOWED_ORIGINS=http://localhost:5173

# ========== JWT ==========
JWT_SECRET_KEY=your-jwt-secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
JWT_REFRESH_EXPIRATION_DAYS=7
```

#### **Generowanie SECRET_KEY**
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 2.2 Backend - Plik settings.py

**Lokalizacja:** `backend/core/settings.py`

**Główne sekcje konfiguracji:**

```python
# ========== BASIC SETTINGS ==========
DEBUG = True  # Set to False in production
ALLOWED_HOSTS = []  # Add your domain

# ========== INSTALLED APPS ==========
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    
    # External
    "rest_framework",
    "corsheaders",
    
    # Local
    "users",
    "studies",
    "enrollments",
    "payments",
    "files",
    "notifications",
]

# ========== MIDDLEWARE ==========
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # MUSI BYĆ NA GÓRZE
]

# ========== DATABASE ==========
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
        "CONN_MAX_AGE": 600,  # Connection pooling
    }
}

# ========== AUTHENTICATION & JWT ==========
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
}

# ========== CORS ==========
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://yourdomain.com",
]

CORS_ALLOW_CREDENTIALS = True

# ========== STATIC & MEDIA FILES ==========
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# ========== LOGGING ==========
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
}
```

### 2.3 Frontend - Zmienne Środowiska

**Plik:** `frontend/.env.local` (nie commitować!)

```bash
# API
VITE_API_BASE_URL=http://localhost:8000

# App Info
VITE_APP_NAME=Ledwo Zrekrutowani
VITE_ENVIRONMENT=development

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_MODE=false
```

**Dostęp w kodzie React:**
```javascript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const appName = import.meta.env.VITE_APP_NAME;
```

### 2.4 Frontend - vite.config.js

**Lokalizacja:** `frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  }
})
```

### 2.5 Frontend - eslint.config.js

**Lokalizacja:** `frontend/eslint.config.js`

```javascript
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': 'warn',
    },
  },
])
```

### 2.6 Frontend - tailwind.config.js

**Lokalizacja:** `frontend/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#10b981",
      },
      spacing: {
        xs: "0.5rem",
        sm: "1rem",
        md: "1.5rem",
        lg: "2rem",
      },
    },
  },
  plugins: [],
}
```

### 2.7 Docker - docker-compose.yml

**Lokalizacja:** `backend/docker-compose.yml`

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:18-alpine
    container_name: lz-postgres
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "${DB_PORT}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  django:
    build: .
    container_name: lz-django
    command: python manage.py runserver 0.0.0.0:8000
    environment:
      - DEBUG=False
      - DB_HOST=postgres
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_PORT=5432
    ports:
      - "8000:8000"
    volumes:
      - .:/app
      - media:/app/media
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ledwo-network

volumes:
  pgdata:
  media:

networks:
  ledwo-network:
    driver: bridge
```

**Plik:** `backend/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Run migrations and start server
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]
```

---

## 3. Wdrażanie (Deployment)

### 3.1 Wdrażanie na produkcję - Checklist

- [ ] Zmień `DEBUG=False` w `settings.py`
- [ ] Zmień `SECRET_KEY` na nowy (nie hardcoded!)
- [ ] Skonfiguruj `ALLOWED_HOSTS` z właściwymi domenami
- [ ] Skonfiguruj `CSRF_TRUSTED_ORIGINS`
- [ ] Włącz HTTPS (SSL/TLS)
- [ ] Skonfiguruj `CORS_ALLOWED_ORIGINS` na produkcyjne adresy
- [ ] Ustaw `SECURE_SSL_REDIRECT=True`
- [ ] Ustaw `SESSION_COOKIE_SECURE=True`
- [ ] Ustaw `CSRF_COOKIE_SECURE=True`
- [ ] Użyj `SECURE_HSTS_SECONDS` (HTTP Strict Transport Security)
- [ ] Skonfiguruj Email backend (np. SendGrid, Mailgun)
- [ ] Skonfiguruj Storage backend (np. AWS S3)
- [ ] Włącz logowanie (monitoring errors)
- [ ] Skonfiguruj backupy bazy danych
- [ ] Skonfiguruj monitorowanie performance
- [ ] Dodaj rate limiting
- [ ] Przetestuj error pages (404, 500)

### 3.2 Wdrażanie z Docker

#### **1. Build image'u**
```bash
cd backend
docker build -t ledwo-django:latest .
```

#### **2. Run Docker Compose**
```bash
docker-compose up -d
```

#### **3. Uruchomienie migracji**
```bash
docker-compose exec django python manage.py migrate
```

#### **4. Stworzenie admin user'a**
```bash
docker-compose exec django python manage.py createsuperuser
```

#### **5. Weryfikacja**
- Django: `http://localhost:8000`
- Admin: `http://localhost:8000/admin/`
- PostgreSQL: Dostępna na `localhost:5432`

#### **Przydatne komendy Docker:**
```bash
# View logs
docker-compose logs -f django
docker-compose logs -f postgres

# Execute command in container
docker-compose exec django python manage.py shell

# Stop containers
docker-compose down

# Remove volumes (UWAGA - usuwa dane!)
docker-compose down -v

# Rebuild after changes
docker-compose up -d --build
```

### 3.3 Wdrażanie Frontend'u

#### **1. Build produkcji**
```bash
cd frontend
npm run build
```

Wynik: `frontend/dist/` - gotowe pliki do serwowania

#### **2. Preview build'u**
```bash
npm run preview
```

#### **3. Deploy na hosting (przykład: Vercel)**
```bash
npm install -g vercel
vercel
```

#### **4. Deploy na hosting (przykład: GitHub Pages)**
```bash
npm install --save-dev gh-pages
# Dodaj do package.json:
# "homepage": "https://yourusername.github.io/repo-name",
# "predeploy": "npm run build",
# "deploy": "gh-pages -d dist"
npm run deploy
```

### 3.4 Wdrażanie na VPS (AWS EC2, DigitalOcean, itp.)

#### **Setup serwera (Ubuntu 20.04+):**

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Python, pip, postgres client
sudo apt-get install -y python3.11 python3-pip postgresql-client

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone project
git clone https://github.com/yourorg/Ledwo-Zrekrutowani.git
cd Ledwo-Zrekrutowani
```

#### **Konfiguracja .env dla produkcji:**

```bash
# Settings
DEBUG=False
SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())")
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DB_NAME=ledwo_prod
DB_USER=ledwo_user
DB_PASSWORD=$(openssl rand -base64 32)
DB_HOST=localhost
DB_PORT=5432

# Email (SendGrid example)
EMAIL_BACKEND=sendgrid_backend.SendgridBackend
SENDGRID_API_KEY=your_sendgrid_key

# CORS (produkcyjne adresy)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### **Nginx Reverse Proxy Config:**

**Plik:** `/etc/nginx/sites-available/ledwo`

```nginx
upstream django {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Frontend
    location / {
        alias /var/www/ledwo-frontend/dist/;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django static files
    location /static/ {
        alias /var/www/ledwo-backend/staticfiles/;
    }

    # Django media files
    location /media/ {
        alias /var/www/ledwo-backend/media/;
    }
}
```

#### **Setup SSL z Let's Encrypt:**
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

#### **Systemd Service dla Django:**

**Plik:** `/etc/systemd/system/ledwo-django.service`

```ini
[Unit]
Description=Ledwo Django Application
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/ledwo-backend
Environment="PATH=/var/www/ledwo-backend/.venv/bin"
ExecStart=/var/www/ledwo-backend/.venv/bin/gunicorn \
    --workers 4 \
    --bind 127.0.0.1:8000 \
    core.wsgi:application

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Uruchomienie:**
```bash
sudo systemctl start ledwo-django
sudo systemctl enable ledwo-django
sudo systemctl status ledwo-django
```

---

## 4. Najczęstsze Polecenia

### Backend
```bash
# Uruchom dev server
python manage.py runserver

# Stwórz migracje
python manage.py makemigrations

# Zastosuj migracje
python manage.py migrate

# Stwórz super user'a
python manage.py createsuperuser

# Shell Django
python manage.py shell

# Collect static files
python manage.py collectstatic

# Flush database (UWAGA!)
python manage.py flush

# Run tests
python manage.py test

# Check deployment
python manage.py check --deploy
```

### Frontend
```bash
# Dev server
npm run dev

# Build produkcji
npm run build

# Lint kodu
npm run lint

# Preview build'u
npm run preview
```

### Docker
```bash
docker-compose up -d
docker-compose down
docker-compose logs -f
docker-compose exec django python manage.py migrate
```

---

## 5. Monitoring & Logging

### 5.1 Backend Logging

**W settings.py:**
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['file', 'console'],
        'level': 'INFO',
    },
}
```

### 5.2 Frontend Console Errors

Monitoruj w przeglądarce (F12 → Console) czy są errory:
- CORS errors
- API connection errors
- JWT token errors
- JavaScript exceptions

---

**Ostatnia aktualizacja:** 20.05.2026

**Status:** ✅ Kompletny - Gotowy do produkcji
