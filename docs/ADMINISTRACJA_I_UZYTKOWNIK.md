# Instrukcja Administracyjna, Utrzymaniowa i Użytkowania - Ledwo Zrekrutowani

## Spis Treści

### Część I: Instrukcje Administracyjne & Utrzymanie
1. [Panel Administracyjny Django](#panel-administracyjny-django)
2. [Zarządzanie Użytkownikami](#zarządzanie-użytkownikami)
3. [Zarządzanie Kierunkami & Edycjami](#zarządzanie-kierunkami--edycjami)
4. [Zarządzanie Rekrutacją](#zarządzanie-rekrutacją)
5. [Zarządzanie Opłatami & Finansami](#zarządzanie-opłatami--finansami)
6. [Backupy & Disaster Recovery](#backupy--disaster-recovery)
7. [Monitoring & Performance](#monitoring--performance)
8. [Logowanie & Audyt](#logowanie--audyt)
9. [Troubleshooting & Problemy](#troubleshooting--problemy)

### Część II: Instrukcje Użytkowania
10. [Instrukcja dla Kandydatów (Studenci)](#instrukcja-dla-kandydatów-studenci)
11. [Instrukcja dla Pracowników (Staff)](#instrukcja-dla-pracowników-staff)
12. [FAQ & Wsparcie](#faq--wsparcie)

---

## CZĘŚĆ I: INSTRUKCJE ADMINISTRACYJNE & UTRZYMANIE

---

## Panel Administracyjny Django

### Dostęp do Admin Panelu

**URL:**
```
http://localhost:8000/admin/
Production: https://yourdomain.com/admin/
```

**Login:**
```
Username: admin (lub inny superuser)
Password: ***
```

**Dostęp do dashboard'u:**
1. Otwórz `/admin/`
2. Zaloguj się credentialami super user'a
3. Będziesz widzieć listę dostępnych modeli do edycji

### Struktura Django Admin

```
Django Administration
├── Authentication and Authorization
│   ├── Users
│   ├── Groups
│   └── Permissions
├── Studies
│   ├── Study Programs
│   ├── Study Editions
│   ├── Study Edition Staff
│   └── Study Documents
├── Enrollments
│   ├── Enrollments
│   ├── Form Data
│   ├── Submitted Documents
│   └── Addresses
├── Payments
│   ├── Fees
│   └── Payments
├── Files
│   └── Uploaded Files
└── Notifications
    └── Notifications
```

---

## Zarządzanie Użytkownikami

### Typy Użytkowników

| Typ | Rola | Uprawnienia |
|-----|------|------------|
| **STUDENT** | Kandydat/Student | Własny profil, aplikacje, płatności |
| **EMPLOYEE** | Pracownik uczelni | Edycja aplikacji, dokumenty (przypisana edycja) |
| **ADMIN** | Administrator | Pełny dostęp do wszystkich danych |

### Stworzenie Nowego User'a (Admin Panel)

1. Przejdź do `/admin/auth/user/`
2. Kliknij "ADD USER"
3. Wypełnij:
   ```
   Username: user_email@example.com
   Password: (wygeneruj bezpieczne hasło)
   ```
4. Kliknij "Save"
5. Na następnej stronie:
   ```
   First name: Jan
   Last name: Kowalski
   Email: user_email@example.com
   Is staff: ☐ (unchecked dla studentów, checked dla staff)
   Is active: ☑ (checked - aktywny user)
   Is superuser: ☐ (unchecked)
   ```

### Przypisanie Roli Employee'a

1. Zaloguj się jako superuser
2. Przejdź do `/admin/studies/studieseditionstaff/`
3. Kliknij "ADD STUDIES EDITION STAFF"
4. Wypełnij:
   ```
   User: [Wybierz user'a z dropdown]
   Studies Edition: [Wybierz edycję]
   Role: [STUDIES_DIRECTOR / ADMINISTRATIVE_COORDINATOR / FINANCE_COORDINATOR]
   ```
5. Kliknij "Save"

### Zmiana Hasła User'a

**Metoda 1 - Admin Panel:**
1. Przejdź do `/admin/auth/user/`
2. Kliknij na user'a
3. Kliknij "this form" w sekcji password
4. Wpisz nowe hasło
5. Kliknij "Save"

**Metoda 2 - Django Shell:**
```bash
python manage.py shell
from users.models import User
user = User.objects.get(email='user@example.com')
user.set_password('new_password')
user.save()
exit()
```

### Deaktywacja User'a

1. Przejdź do `/admin/auth/user/`
2. Kliknij na user'a
3. Odznacz "Is active"
4. Kliknij "Save"

**Efekt:** User nie będzie mógł się zalogować

### Usunięcie User'a

1. Przejdź do `/admin/auth/user/`
2. Zaznacz checkbox przy user'em
3. W dropdown u góry wybierz "Delete selected users"
4. Kliknij "Go"
5. Potwierdź na stronie potwierdzenia

**⚠️ UWAGA:** Usunięcie user'a spowoduje usunięcie wszystkich powiązanych danych (aplikacje, opłaty)!

---

## Zarządzanie Kierunkami & Edycjami

### Stworzenie Nowego Kierunku (Study Program)

1. Przejdź do `/admin/studies/studies/`
2. Kliknij "ADD STUDIES"
3. Wypełnij:
   ```
   Name: Computer Science
   Description: Program focused on software development...
   ```
4. Kliknij "Save"

### Stworzenie Nowej Edycji (Study Edition)

1. Przejdź do `/admin/studies/studiesedition/`
2. Kliknij "ADD STUDIES EDITION"
3. Wypełnij:
   ```
   Studies: [Wybierz kierunek z dropdown]
   Academic Year: 2026/2027
   Start Date: 2026-10-01
   End Date: 2027-06-30
   Is Public: ☑ (checked - widoczna dla kandydatów)
   Available Slots: 50
   Recruitment Start: 2026-05-01
   Recruitment End: 2026-08-31
   ```
4. Kliknij "Save"

### Dodanie Wymaganych Dokumentów do Edycji

1. Przejdź do `/admin/studies/studiesdocument/`
2. Kliknij "ADD STUDIES DOCUMENT"
3. Wypełnij:
   ```
   Studies Edition: [Wybierz edycję]
   Name: High School Diploma
   Description: Original or certified copy
   Required: ☑ (checked)
   File Format: PDF
   Max File Size: 10485760 (10MB)
   ```
4. Kliknij "Save"

### Przypisanie Staff'u do Edycji

1. Przejdź do `/admin/studies/studieseditionstaff/`
2. Kliknij "ADD STUDIES EDITION STAFF"
3. Wypełnij:
   ```
   User: [Staff member]
   Studies Edition: [Edycja do przypisania]
   Role: 
     - STUDIES_DIRECTOR (Zarządza edycją)
     - ADMINISTRATIVE_COORDINATOR (Koordynator rekrutacji)
     - FINANCE_COORDINATOR (Koordynator finansów)
   ```
4. Kliknij "Save"

### Zamknięcie Rekrutacji

1. Przejdź do `/admin/studies/studiesedition/`
2. Kliknij na edycję
3. Zmień "Recruitment End" na wcześniejszą datę
4. Kliknij "Save"

**Efekt:** Kandydaci już nie będą mogli aplikować na tę edycję

---

## Zarządzanie Rekrutacją

### Przeglądanie Aplikacji Kandydatów

1. Przejdź do `/admin/enrollments/enrollment/`
2. Lista pokazuje wszystkie aplikacje z:
   - Student name
   - Status (DRAFT, CANDIDATE, STUDENT, EXPELLED)
   - Enrollment date
   - Documents status
   - Payment status

### Zmiana Statusu Aplikacji

1. Kliknij na aplikację
2. Zmień status:
   ```
   DRAFT         - Kandydat zaczął wypełniać formularz
   CANDIDATE     - Aplikacja wysłana, oczekuje na review
   STUDENT       - Zaakceptowana, student zarejestrowany
   EXPELLED      - Usunięty z programu
   ```
3. Opcjonalnie dodaj status_note (np. powód odrzucenia)
4. Kliknij "Save"

### Przegląd Przesłanych Dokumentów

1. Przejdź do `/admin/enrollments/submitteddocument/`
2. Lista pokazuje:
   - Document name
   - Enrollment (student)
   - Status (SUBMITTED, ACCEPTED, VERIFIED, REJECTED, DELIVERY)
   - Submitted date

### Akceptacja Dokumentu

1. Kliknij na dokument
2. Zmień status na "ACCEPTED" lub "VERIFIED"
3. Opcjonalnie dodaj notatkę
4. Kliknij "Save"

### Odrzucenie Dokumentu

1. Kliknij na dokument
2. Zmień status na "REJECTED"
3. Dodaj notatkę wyjaśniającą powód
4. Kliknij "Save"

**Efekt:** Kandydat zobaczy komunikat o odrzuceniu i będzie mógł przesłać nowy dokument

---

## Zarządzanie Opłatami & Finansami

### Stworzenie Opłaty (Fee)

1. Przejdź do `/admin/payments/fee/`
2. Kliknij "ADD FEE"
3. Wypełnij:
   ```
   Enrollment: [Wybierz enrollment]
   Title: Tuition Fee - Semester 1
   Amount: 5000.00 (PLN)
   Due Date: 2026-01-31
   ```
4. Kliknij "Save"

### Śledzenie Płatności

1. Przejdź do `/admin/payments/payment/`
2. Lista pokazuje:
   - Fee (jaką opłatę dotyczy)
   - Payment Method (BANK_TRANSFER, etc.)
   - Reference Number (np. transakcji)
   - Status (PENDING, SUCCESS, FAILED)

### Oznaczenie Płatności jako Ukończonej

1. Kliknij na payment
2. Zmień status na "SUCCESS"
3. Dodaj "Reference Number" (np. numer transakcji bankowej)
4. Kliknij "Save"

**Efekt:** Opłata zostanie oznaczona jako "paid" dla studenta

### Przegląd Finansów (Raport)

```python
# Django Shell - statystyki finansowe
python manage.py shell

from payments.models import Fee, Payment
from django.db.models import Sum

# Całkowita wartość wszystkich opłat
total_fees = Fee.objects.aggregate(Sum('amount'))['amount__sum']

# Opłacone opłaty
paid_fees = Fee.objects.filter(paid_date__isnull=False).aggregate(Sum('amount'))['amount__sum']

# Zaległy
unpaid_fees = Fee.objects.filter(paid_date__isnull=True).aggregate(Sum('amount'))['amount__sum']

print(f"Total Fees: {total_fees}")
print(f"Paid: {paid_fees}")
print(f"Unpaid: {unpaid_fees}")
```

---

## Backupy & Disaster Recovery

### Backup Bazy Danych PostgreSQL

#### **1. Backup ręczny (pg_dump)**

**Windows:**
```powershell
$env:PGPASSWORD='your_db_password'
pg_dump -U postgres -h localhost ledwo_db > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql
```

**macOS/Linux:**
```bash
PGPASSWORD='your_db_password' pg_dump -U postgres -h localhost ledwo_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### **2. Scheduled Backup (Cron Job)**

**Linux/macOS:**
```bash
# Dodaj do crontab (-e)
0 2 * * * PGPASSWORD='password' pg_dump -U postgres ledwo_db > /backups/ledwo_$(date +\%Y\%m\%d).sql
```

Wyjaśnienie: Uruchamiaj backup codziennie o 2:00 AM

#### **3. Backup z Docker**

```bash
docker-compose exec postgres pg_dump -U postgres ledwo_db > backup.sql
```

### Restore Bazy Danych

```bash
PGPASSWORD='your_db_password' psql -U postgres -h localhost ledwo_db < backup_20260520.sql
```

### Backup Plików Upload'owanych (Media Files)

```bash
# Kopia katalogu media/
cp -r backend/media/ backup/media_$(date +%Y%m%d)/

# Lub TAR
tar -czf backup_media_$(date +%Y%m%d).tar.gz backend/media/
```

### Backup Cały Projekt

```bash
# Wyklucz venv, node_modules, .git
tar --exclude='backend/.venv' \
    --exclude='frontend/node_modules' \
    --exclude='.git' \
    -czf ledwo_backup_$(date +%Y%m%d).tar.gz .
```

### Automation Backup'u (Production)

**Script:** `backup.sh`
```bash
#!/bin/bash

BACKUP_DIR="/backups/ledwo"
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP="$BACKUP_DIR/db_$DATE.sql"
MEDIA_BACKUP="$BACKUP_DIR/media_$DATE.tar.gz"

# Backup bazy
PGPASSWORD=$DB_PASSWORD pg_dump -U $DB_USER -h $DB_HOST $DB_NAME > $DB_BACKUP
gzip $DB_BACKUP

# Backup media
tar -czf $MEDIA_BACKUP /var/www/ledwo/media/

# Usuń stare backupy (starsze niż 30 dni)
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete
find $BACKUP_DIR -name "media_*.tar.gz" -mtime +30 -delete

echo "Backup completed at $DATE"
```

**Uruchomienie przez cron:**
```bash
0 2 * * * /scripts/backup.sh >> /var/log/backup.log 2>&1
```

---

## Monitoring & Performance

### Django Health Check

```bash
python manage.py check --deploy
```

**Sprawdzanie:**
- Database connectivity
- Static files configuration
- Security settings
- Email configuration

### Monitoring Bazy Danych

```python
# Django Shell
python manage.py shell

from django.db import connection
from django.db.utils import DatabaseError

# Test connection
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    print("✓ Database is connected")
except DatabaseError:
    print("✗ Database is DOWN")

# Check slow queries
from django.core.management import call_command
call_command('dbshell')
# \dt - list tables
# \l - list databases
```

### Monitoring aplikacji (Logs)

```bash
# Django logs
tail -f debug.log

# Docker logs
docker-compose logs -f django
docker-compose logs -f postgres

# Nginx logs (production)
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Performance Metrics

```python
# Django Debug Toolbar (development)
# Zainstaluj: pip install django-debug-toolbar

# Check query count
from django.test.utils import override_settings
from django.db import connection
from django.test import TestCase

# Monitoring:
print(f"Queries executed: {len(connection.queries)}")
for query in connection.queries:
    print(f"Time: {query['time']}s - {query['sql'][:50]}...")
```

---

## Logowanie & Audyt

### Django Logging Configuration

**Settings.py:**
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {funcName} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['file', 'console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'payments': {
            'handlers': ['file'],
            'level': 'DEBUG',  # Szczegółowy log dla payments
        },
        'enrollments': {
            'handlers': ['file'],
            'level': 'DEBUG',  # Szczegółowy log dla rekrutacji
        },
    },
}
```

### Audyt Actions

```python
# Log important actions
import logging

logger = logging.getLogger(__name__)

def change_enrollment_status(enrollment, old_status, new_status, user):
    logger.info(
        f"Status changed: {old_status} → {new_status} "
        f"for enrollment {enrollment.id} by {user.email}"
    )
    # Save to database
```

### Przeglądanie Logów

```bash
# Ostatnie 50 linii
tail -50 debug.log

# Real-time log monitoring
tail -f debug.log

# Szukaj błędów
grep "ERROR" debug.log

# Szukaj konkretnego user'a
grep "user@example.com" debug.log

# Liczba błędów dziennie
grep "ERROR" debug.log | wc -l
```

---

## Troubleshooting & Problemy

### Problemy Połączenia z Bazą Danych

**Problem:** `OperationalError: could not connect to server`

**Rozwiązanie:**
```bash
# 1. Sprawdź czy PostgreSQL jest uruchomiony
psql -U postgres -h localhost

# 2. Sprawdź credentials w .env
# DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT

# 3. Zresetuj connection
python manage.py dbshell
\q

# 4. Restart Docker Compose
docker-compose down
docker-compose up -d
```

### Migracje nie zostały zastosowane

**Problem:** `django.db.utils.ProgrammingError: relation does not exist`

**Rozwiązanie:**
```bash
# 1. Pokaż status migracji
python manage.py showmigrations

# 2. Zastosuj wszystkie migracje
python manage.py migrate

# 3. Sprawdź czy migracje są aktualne
python manage.py migrate --plan
```

### Static Files nie są ładowane (Production)

**Problem:** CSS/JS zwraca 404

**Rozwiązanie:**
```bash
# Collect static files
python manage.py collectstatic --noinput

# Sprawdź uprawnienia
chmod -R 755 staticfiles/

# Sprawdź nginx config - musi mieć location dla /static/
```

### Disk Space Full

**Problem:** `IOError: No space left on device`

**Rozwiązanie:**
```bash
# Sprawdź disk usage
df -h

# Duże pliki w media/
du -sh media/*

# Stare backupy
du -sh backups/*

# Czyszczenie (OSTROŻNIE!)
rm -rf backend/media/submitted/*.pdf  # Stare pliki
```

### Memory/CPU High Usage

**Problem:** Django proces zużywa dużo zasobów

**Rozwiązanie:**
```bash
# Sprawdzenie procesów
ps aux | grep python

# Zabij proces
kill -9 <PID>

# Limit threads w Gunicorn
gunicorn --workers=4 --threads=2 core.wsgi:application

# Memory profiling
pip install memory-profiler
python -m memory_profiler manage.py runserver
```

---

---

## CZĘŚĆ II: INSTRUKCJE UŻYTKOWANIA

---

## Instrukcja dla Kandydatów (Studenci)

### 1. Rejestracja & Login

#### **Rejestracja**

1. Otwórz aplikację: `http://localhost:5173/`
2. Kliknij "Rejestracja" lub przejdź na `/register`
3. Wypełnij formularz:
   ```
   Email: your_email@example.com
   Hasło: BezpieczneHasło123!
   Imię: Jan
   Nazwisko: Kowalski
   Telefon: +48123456789
   ```
4. Kliknij "Zarejestruj się"
5. Powinienneś otrzymać email potwierdzający

#### **Logowanie**

1. Przejdź na `/login`
2. Wpisz:
   ```
   Email: your_email@example.com
   Hasło: BezpieczneHasło123!
   ```
3. Kliknij "Zaloguj się"
4. Po zalogowaniu będziesz w menu głównym

**💡 Tip:** Hasło możesz zmienić w ustawieniach profilu

---

### 2. Przeglądanie Dostępnych Kierunków

1. Po zalogowaniu, przejdź na stronę główną
2. Zobaczysz listę dostępnych kierunków studiów:
   ```
   [Computer Science]
   [Mechanical Engineering]
   [Economics]
   ```
3. Kliknij na kierunek aby zobaczyć szczegóły:
   - Opis programu
   - Termin akademiczny
   - Liczba dostępnych miejsc
   - Wymagane dokumenty
   - Informacje o staff'u

4. Kliknij "Aplikuj" aby przejść do aplikacji

---

### 3. Wypełnianie Formularza Aplikacji

1. Kliknij "Aplikuj" na wybrany kierunek
2. Wypełnij dane osobowe:
   ```
   Imię: Jan
   Nazwisko: Kowalski
   PESEL: 99010112345
   Data urodzenia: 01.01.1999
   ```
3. Wypełnij dane edukacyjne:
   ```
   Rok ukończenia liceum: 2024
   Nazwa szkoły: XIV Liceum Ogólnokształcące w Krakowie
   ```
4. Wpisz adres zamieszkania:
   ```
   Ulica: ul. Warszawska 10
   Kod pocztowy: 31-155
   Miasto: Kraków
   Kraj: Polska
   ```
5. Wpisz dane kontaktowe:
   ```
   Email: your_email@example.com
   Telefon: +48123456789
   ```
6. Kliknij "Dalej" lub "Zapisz jako szkic"

---

### 4. Przesyłanie Dokumentów

1. Po wypełnieniu formularza, przejdziesz do sekcji dokumentów
2. Zobaczysz listę wymaganych dokumentów:
   - ☑️ High School Diploma
   - ☑️ PESEL Certificate
   - ☐ Passport (opcjonalny)

3. Dla każdego dokumentu:
   - Kliknij "Prześlij plik"
   - Wybierz plik z komputera (PDF, max 10MB)
   - Kliknij "Zatwierdź"

4. Status dokumentu zmieni się na:
   - 🔄 **SUBMITTED** - Oczekuje na review
   - ✅ **ACCEPTED** - Zaakceptowany
   - ❌ **REJECTED** - Odrzucony (możesz przesłać ponownie)

5. Kliknij "Prześlij aplikację" gdy wszystkie dokumenty są gotowe

---

### 5. Śledzenie Statusu Aplikacji

1. Przejdź do "Moje Aplikacje"
2. Zobaczysz listę twoich aplikacji z statusami:
   ```
   [Computer Science 2025/2026]
   Status: SUBMITTED
   Wysłano: 20.05.2026
   Dokumenty: 2/2 ✅
   Opłata: Oczekuje
   ```

3. Kliknij na aplikację aby zobaczyć szczegóły:
   - Aktualne dane w formularzu
   - Status każdego dokumentu
   - Historia zmian statusu
   - Notatki od staff'u

---

### 6. Płatności

#### **Przeglądanie Opłat**

1. W sekcji aplikacji kliknij "Opłaty" lub przejdź do "Moje Płatności"
2. Zobaczysz listę opłat:
   ```
   Tuition Fee - Semester 1: 5000.00 PLN
   Status: UNPAID
   Do zapłaty do: 31.01.2027
   
   Student Fee: 200.00 PLN
   Status: PAID (15.05.2026)
   ```

#### **Wykonanie Płatności**

1. Kliknij na opłatę
2. Kliknij "Zapłać teraz"
3. Wybierz metodę płatności:
   - Bank Transfer
   - Credit Card
   - PayU
   - Przelewy24

4. **Bank Transfer:**
   ```
   Rachunek bankowy: PL61109010140000071219812874
   Na rzecz: Ledwo University
   Tytuł przelewu: REF-2026-001
   ```
   Przelej z banku i przesłanie dowodu w aplikacji

5. **Karta Kredytowa:**
   - Zostaniesz przekierowany do portalu płatności
   - Wpisz dane karty
   - Potwierdź płatność (2FA/SMS)

6. Po płatności:
   - Status zmieni się na "PAID"
   - Otrzymasz email potwierdzenia
   - Rachunek będzie dostępny do pobrania

---

### 7. Profil & Ustawienia

1. Kliknij na swoje imię (prawa górna część) → "Profil"
2. Możesz zmienić:
   - **Imię i Nazwisko**
   - **Email**
   - **Numer telefonu**
   - **Hasło** (będziesz musiał wpisać stare hasło)

3. Kliknij "Zapisz zmiany"

---

### 8. Powiadomienia

1. Kliknij dzwonek (🔔) w górnym pasku
2. Zobaczysz powiadomienia o:
   - Zmianach statusu aplikacji
   - Nowych dokumentach do przesłania
   - Zbliżających się terminom płatności
   - Wiadomościach od staff'u

3. Możesz oznaczyć jako przeczytane lub usunąć

---

### 9. FAQ & Pomoc

1. Przejdź do "FAQ" lub "Pomoc"
2. Najczęstsze pytania:
   - Jak wznowić aplikację?
   - Co zrobić jeśli dokument został odrzucony?
   - Jak zmienić kierunek studiów?
   - Czy mogę anulować aplikację?

3. Jeśli nie znalazłeś odpowiedzi → "Kontakt" → Wiadomość do support'u

---

## Instrukcja dla Pracowników (Staff)

### 1. Login Pracownika

1. Przejdź na `/login`
2. Zaloguj się kontami pracownika (Email + Hasło)
3. Po zalogowaniu będziesz widzieć dodatkowe menu:
   ```
   [Recruitement Management]
   [Finance Management]
   [Document Review]
   ```

---

### 2. Zarządzanie Rekrutacją (Koordynator Administracyjny)

#### **Przeglądanie Aplikacji**

1. Przejdź do "Recruitement" → "Applications"
2. Zobaczysz tabelę z aplikacjami:
   ```
   [Jan Kowalski] [Computer Science] [SUBMITTED] [15.05.2026]
   [Anna Nowak]  [Engineering]       [DRAFT]     [18.05.2026]
   ```

3. Filtry:
   - Status: DRAFT, SUBMITTED, ACCEPTED, REJECTED
   - Kierunek: Computer Science, Engineering, etc.
   - Data: Custom range

#### **Przeglądanie Szczegółów Aplikacji**

1. Kliknij na aplikację
2. Zobaczysz:
   - Dane osobowe kandydata
   - Formularz aplikacji
   - Przesłane dokumenty
   - Historia zmian statusu
   - Notatki poprzednich reviewerów

#### **Review Dokumentów**

1. W aplikacji przejdź do sekcji "Documents"
2. Lista wymaganych dokumentów:
   ```
   ✅ High School Diploma (VERIFIED)
   🔄 PESEL Certificate (SUBMITTED - pending)
   ❌ Passport (REJECTED - wrong format)
   ```

3. Dla każdego dokumentu możesz:
   - ✅ **Accept** - Dokument jest OK
   - 📋 **Review** - Wymaga review'u
   - ❌ **Reject** - Zwróć do poprawy

4. Dodaj notatkę (opcjonalnie):
   ```
   "Document is valid. Confirmed 20.05.2026"
   ```

5. Kliknij "Approve" lub "Reject"

#### **Zmiana Statusu Aplikacji**

1. Kliknij na aplikację
2. Zmień status:
   ```
   SUBMITTED → ACCEPTED  (Zaakceptuj kandydata)
   SUBMITTED → REJECTED  (Odrzuć kandydata)
   ```

3. Dodaj notatkę wyjaśniającą (obowiązkowe dla REJECTED):
   ```
   "Brakuje dokumentów" lub "Nie spełnia kryteriów"
   ```

4. Kliknij "Save"

5. Kandydat otrzyma powiadomienie email

---

### 3. Zarządzanie Finansami (Koordynator Finansów)

#### **Przeglądanie Opłat**

1. Przejdź do "Finance" → "Fees"
2. Tabela opłat:
   ```
   [ID] [Student]      [Fee]           [Amount] [Due]       [Status]
   [1]  [Jan Kowalski] [Tuition]       [5000]   [31.01.27]  [UNPAID]
   [2]  [Anna Nowak]   [Admin Fee]     [200]    [20.05.26]  [PAID]
   ```

3. Filtry:
   - Status: PAID, UNPAID, OVERDUE
   - Kierunek
   - Data zakresu

#### **Tworzenie Nowej Opłaty**

1. Kliknij "Add Fee"
2. Wybierz enrollment
3. Wypełnij:
   ```
   Title: Tuition Fee - Semester 2
   Amount: 5000.00 PLN
   Due Date: 31.01.2027
   ```
4. Kliknij "Create"

Kandydat zobaczy nową opłatę w aplikacji

#### **Śledzenie Płatności**

1. Przejdź do "Finance" → "Payments"
2. Lista płatności:
   ```
   [ID] [Fee]         [Method]        [Reference]    [Status]    [Date]
   [1]  [Tuition]     [Bank Transfer] [REF-2026-001] [SUCCESS]  [15.05.26]
   [2]  [Admin Fee]   [Credit Card]   [CARD-2026-02] [PENDING]  [20.05.26]
   ```

3. Dla każdej płatności:
   - Sprawdź numer referencyjny
   - Porównaj z wyciągiem bankowym
   - Oznacz jako verified

#### **Eksport Raportów**

1. Przejdź do "Finance" → "Reports"
2. Kliknij "Export to Excel"
3. Wybierz zakres czasu
4. Plik będzie zawierać:
   - Wszystkie opłaty
   - Stany płatności
   - Zaległości
   - Statystyki

---

### 4. Zarządzanie Kierunkami (Dyrektor Edycji)

#### **Edycja Informacji o Kierunku**

1. Przejdź do "Studies" → "Manage Edition"
2. Możesz zmienić:
   - Opis kierunku
   - Termin rekrutacji
   - Liczbę dostępnych miejsc
   - Wymagane dokumenty

3. Kliknij "Save"

#### **Dodanie Dokumentów Wymaganych**

1. W edycji przejdź do "Required Documents"
2. Kliknij "Add Document"
3. Wybierz:
   ```
   Name: Vaccination Certificate
   Required: YES/NO
   File Format: PDF
   Max Size: 10 MB
   ```
4. Kliknij "Add"

#### **Zarządzanie Staff'em**

1. Przejdź do "Studies" → "Staff"
2. Zobaczysz team:
   ```
   [Anna Kowalska] [Director]
   [Jan Nowak]    [Admin Coordinator]
   [Maria Lewska] [Finance Coordinator]
   ```

3. Aby dodać staff'a:
   - Kliknij "Add Staff"
   - Wybierz user'a
   - Przypisz rolę
   - Kliknij "Add"

---

### 5. Dashboard & Statystyki

1. Po zalogowaniu zobaczysz dashboard z metrykami:
   ```
   📊 Aplikacje
   - Submitted: 45
   - Accepted: 12
   - Rejected: 5
   - Pending: 28
   
   💰 Finansy
   - Całkowite opłaty: 225,000 PLN
   - Opłacone: 185,000 PLN (82%)
   - Zaległe: 40,000 PLN (18%)
   
   📄 Dokumenty
   - Do review: 15
   - Zaakceptowane: 120
   - Odrzucone: 8
   ```

2. Kliknij na metrykę aby zobaczyć szczegóły

---

### 6. Powiadomienia & Komunikacja

1. Dzwonek (🔔) pokazuje:
   - Nowe aplikacje do review
   - Dokumenty do sprawdzenia
   - Zaległe płatności
   - Wiadomości od innych staff'u

2. Aby wysłać powiadomienie do kandydatów:
   - Przejdź do "Notifications"
   - Kliknij "Send Message"
   - Wybierz odbiorców
   - Wpisz wiadomość
   - Kliknij "Send"

---

## FAQ & Wsparcie

### Dla Kandydatów

**P: Zapomniałem hasła. Co robić?**
O: Kliknij "Zapomniałem hasła" na stronie logowania, wpisz email, a otrzymasz link do resetowania.

**P: Dokument został odrzucony. Co to oznacza?**
O: Staff uznał, że dokument nie spełnia wymogów. Możesz przesłać nowy dokument - staff wyśle Ci informacje o tym, co było nie tak.

**P: Czy mogę edytować aplikację po wysłaniu?**
O: Tak, możesz edytować aplikację dopóki status jest DRAFT. Po wysłaniu (SUBMITTED) nie możesz, ale możesz kontaktować się ze staff'em.

**P: Kiedy dowiedzę się o wyniku aplikacji?**
O: Zwyczajnie 3-5 dni roboczych. Otrzymasz email z wynikiem.

**P: Czy mogę aplikować na kilka kierunków?**
O: Tak, możesz aplikować na różne kierunki i edycje.

---

### Dla Pracowników

**P: Jak zmienić role staff'owi?**
O: W Django Admin przejdź do Studies → Edition Staff, wybierz staff'a i zmień rolę.

**P: Które dokumenty są obowiązkowe?**
O: Określasz to przy tworzeniu edycji. Zaznacz "Required: YES" dla obowiązkowych dokumentów.

**P: Jak eksportować listę aplikacji?**
O: W aplikacjach kliknij przycisk "Export to Excel" (jeśli dostępny) lub skopiuj z tabeli.

**P: Czy mogę zobaczyć historię zmian?**
O: Tak, każdy dokument ma historię z datą i notatką, kto dokonał zmiany.

---

### Support & Kontakt

**Email Support:** support@ledwo.edu
**Telefon:** +48 12 XXX XX XX
**Chat:** Dostępny w aplikacji (pracownie biznesowe)

---

**Ostatnia aktualizacja:** 20.05.2026

**Wersja:** 1.0

**Status:** ✅ Kompletny - Production-Ready
