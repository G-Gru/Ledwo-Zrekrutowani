# Instalacja i uruchomienie

## Wymagania

| Narzędzie | Wersja min. |
|-----------|-------------|
| Python | 3.10+ |
| Node.js | 18+ |
| PostgreSQL | 14+ (lub Docker) |
| Redis | 6+ (lub Docker) |

---

## Uruchomienie lokalne (bez Dockera)

### Backend

```bash
cd backend

# utwórz i aktywuj środowisko wirtualne
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# zainstaluj zależności
pip install -r requirements.txt

# skopiuj plik konfiguracji i uzupełnij wartości
cp .env.example .env

# zastosuj migracje
python manage.py migrate

# uruchom serwer deweloperski
python manage.py runserver
```

Backend dostępny pod `http://localhost:8000`.  
Django Admin: `http://localhost:8000/admin/`

### Frontend TypeScript (`frontend-tsx/`)

```bash
cd frontend-tsx
npm install
npm run dev
```

Frontend dostępny pod `http://localhost:5174`.

### Frontend JavaScript (`frontend/`)

```bash
cd frontend
npm install
npm run dev
```

Frontend dostępny pod `http://localhost:5173`.

Oba frontendy można uruchomić jednocześnie — działają na różnych portach i łączą się z tym samym backendem.

### Celery (opcjonalnie — do wysyłki emaili)

```bash
cd backend
celery -A core worker --loglevel=info
```

---

## Zmienne środowiskowe

### Backend — `backend/.env`

| Zmienna | Opis | Przykład |
|---------|------|---------|
| `SECRET_KEY` | Django secret key | `django-insecure-...` |
| `DEBUG` | Tryb deweloperski | `True` |
| `DB_NAME` | Nazwa bazy PostgreSQL | `ledwo_db` |
| `DB_USER` | Użytkownik bazy | `postgres` |
| `DB_PASSWORD` | Hasło bazy | `haslo123` |
| `DB_HOST` | Host bazy | `localhost` |
| `DB_PORT` | Port bazy | `5432` |
| `ALLOWED_HOSTS` | Dozwolone hosty | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Dozwolone originy frontendu | `http://localhost:5173` |

### Frontend nowy — `frontend-tsx/.env`

| Zmienna | Opis | Przykład |
|---------|------|---------|
| `VITE_API_URL` | URL backendu | `http://localhost:8000` |

### Frontend stary — `frontend/.env`

| Zmienna | Opis | Przykład |
|---------|------|---------|
| `VITE_API_URL` | URL backendu | `http://localhost:8000` |

Jeśli `VITE_API_URL` nie jest ustawione, klient używa `http://localhost:8000` jako domyślnego.

---

## Docker

Plik: `docker-compose.yml` w katalogu głównym projektu.

Serwisy: `postgres` (:5432), `redis` (:6379), `celery`, `django` (:8000), `frontend` (:5173).

```bash
# pierwsze uruchomienie lub po zmianie Dockerfile / requirements.txt
docker compose up --build

# normalne uruchomienie
docker compose up -d

# logi
docker compose logs -f

# zatrzymanie
docker compose down
```

**Uwaga:** katalog `./backend` jest montowany jako wolumin — Django reloaduje zmiany w kodzie na żywo. Przebudowanie (`--build`) jest potrzebne tylko po zmianach w `requirements.txt` lub `Dockerfile`.

---

## Inicjalizacja bazy danych

Komendy należy uruchomić wewnątrz kontenera `django` (jeśli używasz Dockera) lub w katalogu `backend/` z aktywnym venv (jeśli lokalnie).

**Docker:**
```bash
docker compose exec django python manage.py migrate
docker compose exec django python manage.py populate_db_demo  # opcjonalnie — dane testowe
```

**Lokalnie (`backend/`):**
```bash
python manage.py migrate
python manage.py populate_db_demo  # opcjonalnie — dane testowe
```

---

## Zależności backendu (requirements.txt)

| Pakiet | Wersja | Rola |
|--------|--------|------|
| Django | 6.0.3 | Framework webowy |
| djangorestframework | 3.17.1 | REST API |
| djangorestframework-simplejwt | 5.5.1 | Autentykacja JWT |
| django-cors-headers | 4.9.0 | Obsługa CORS |
| celery | 5.6.3 | Kolejka zadań asynchronicznych |
| redis | 7.4.0 | Broker Celery |
| psycopg2-binary | 2.9.11 | Adapter PostgreSQL |
| python-dotenv | 1.2.2 | Wczytywanie `.env` |
| docxtpl | 0.20.2 | Generowanie dokumentów Word (szablony) |
| python-docx | 1.2.0 | Tworzenie dokumentów Word |
| Jinja2 | 3.1.6 | Silnik szablonów (używany przez docxtpl) |

## Zależności frontendu

### frontend-tsx/ (TypeScript)

| Pakiet | Rola |
|--------|------|
| react 19, react-dom 19 | Framework UI |
| typescript | Typowanie statyczne |
| vite 5 | Build tool i dev server (port 5174) |
| react-router-dom | Routing |
| @tailwindcss/vite | TailwindCSS v4 |
| @radix-ui/* | Dostępne prymitywy UI |
| lucide-react | Ikony |
| zod | Walidacja schematów |

### frontend/ (JavaScript)

| Pakiet | Wersja | Rola |
|--------|--------|------|
| react | 19 | Framework UI |
| react-router-dom | 7.13.1 | Routing |
| @tailwindcss/vite | 4.2.2 | TailwindCSS v4 |
| vite | 8.0.2 | Build tool (port 5173) |
| eslint | 9.39.4 | Linting |
