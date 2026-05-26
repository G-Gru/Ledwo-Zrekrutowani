# Dokumentacja - Ledwo Zrekrutowani

Witaj w kompletnej dokumentacji projektu Ledwo Zrekrutowani. Ta dokumentacja zawiera wszelkie informacje niezbedne do zrozumienia, instalacji, wdrazania i administrowania systemem.

---

## Spis Dokumentow

### 1. [ARCHITEKTURA_TECHNICZNA.md](ARCHITEKTURA_TECHNICZNA.md)
Przeglad architektury systemu, warstw aplikacji i stosu technologicznego.

Zawiera:
- Ogolny diagram architektury
- Warstwy: Frontend (React), Backend (Django), Database (PostgreSQL)
- 6 aplikacji Django z odpowiedzialnosciami
- Przeplyw komunikacji Backend-Frontend
- Stack technologiczny (React, Django, Vite, TailwindCSS, etc.)
- Porownanie technologii i alternatywy
- Bezpieczenstwo i autentykacja JWT

Dla kogo: Architekci, DevOps, Developers (overview)

---

### 2. [INSTALACJA_KONFIGURACJA_WDROZENIE.md](INSTALACJA_KONFIGURACJA_WDROZENIE.md)
Instrukcje instalacji, konfiguracji i wdrazania na produkcje.

Zawiera:
- Wymagania systemowe
- Setup backendu (Python, PostgreSQL, venv)
- Setup frontendu (Node.js, npm, Vite)
- Konfiguracja zmiennych srodowiska (.env)
- Migracje bazy danych
- Wdrazanie z Docker
- Wdrazanie na VPS (AWS, DigitalOcean, Ubuntu)
- Nginx reverse proxy
- SSL/TLS z Let's Encrypt
- Systemd services
- Najczestsze polecenia
- Troubleshooting

Dla kogo: DevOps, System Administrators, Deployment Engineers

---

### 3. [API_REFERENCE.md](API_REFERENCE.md)
Kompletna dokumentacja API, interfejsow i integracji.

Zawiera:
- Przeglad API (base URL, wersjonowanie, konwencje)
- JWT autentykacja i token lifecycle
- Konwencje HTTP (methods, status codes, pagination)
- Wszystkie endpointy:
  - Authentication (Register, Login, Refresh)
  - Studies (List, Retrieve, Staff, Documents)
  - Enrollments (Create, Update, Upload, Status)
  - Payments (History, Upcoming, Pay)
  - Files (Download)
  - Notifications (Send)
  - Admin endpoints
- Kody bledow z rozwiazaniami
- Rate limiting
- Integracje zewnetrzne (payment gateway, email, documents)
- Best practices dla frontend
- Testing endpoints (Postman, cURL)

Dla kogo: Frontend Developers, Backend Developers, Integration Specialists

---

### 4. [ADMINISTRACJA_I_UZYTKOWNIK.md](ADMINISTRACJA_I_UZYTKOWNIK.md)
Instrukcje administracyjne i guide dla uzytkownikow.

Zawiera:

Czesc I - Administracja i utrzymanie:
- Panel Django Admin (dostep, struktura)
- Zarzadzanie uzytkownikami (typy, tworzenie, role)
- Zarzadzanie kierunkami i edycjami
- Zarzadzanie rekrutacja (aplikacje, dokumenty, statusy)
- Zarzadzanie oplatami i finansami
- Backupy i disaster recovery
- Monitoring i performance
- Logowanie i audyt
- Troubleshooting (najczestsze problemy)

Czesc II - User guide:
- Instrukcja dla kandydatow (rejestracja, aplikacja, platnosci)
- Instrukcja dla pracownikow (review, zarzadzanie, finanse)
- FAQ i support

Dla kogo: Administratorzy, Pracownicy Uczelni, Kandydaci/Studenci

---

### 5. [ZALEZNOSCI_I_PROCEDURY.md](ZALEZNOSCI_I_PROCEDURY.md)
Dokumentacja zaleznosci technologicznych, procedur uruchomienia i odtwarzania systemu.

Zawiera:
- Zaleznosci backendu (Django, DRF, PostgreSQL, SimpleJWT, docxtpl, etc.)
- Zaleznosci frontendu (React, Vite, TailwindCSS, ESLint, etc.)
- Wymagania systemowe (CPU, RAM, dysk dla roznych srodowisk)
- Wersje narzedzi (Python, Node.js, PostgreSQL, Docker, Git)
- Procedury uruchomienia (dev, produkcja, Docker)
- Procedury aktualizacji (pip, npm, migracje)
- Procedury backupu (PostgreSQL, media files, full backup)
- Procedury odtwarzania (z SQL, z Docker, od zera)
- Disaster recovery (kroki dla awarii systemu)
- CI/CD pipelines (GitHub Actions example)

Dla kogo: DevOps, System Administrators, Maintenance Engineers

---

### 6. [WORKFLOW_PROCESY.md](WORKFLOW_PROCESY.md)
Procesy biznesowe i przeplywy systemu.

Bedzie zawierac:
- Workflow rekrutacji (od aplikacji do decyzji)
- Workflow platnosci
- Workflow obslugi dokumentow
- State machines (statusy i przejscia)
- Diagramy procesow
- Notyfikacje i komunikacja

---

### 7. [KODOWANIE_KONWENCJE.md](KODOWANIE_KONWENCJE.md)
Konwencje kodowania i best practices.

Bedzie zawierac:
- Style guide Python (backend)
- Style guide JavaScript/React (frontend)
- Nazewnictwo zmiennych, funkcji, klas
- Struktura folderow
- Import/Export conventions
- Testing guidelines
- Git commit messages
- Code review guidelines

---

## Quick Start

### Dla nowych deweloperow

1. Zapoznaj sie z architektura:
   - Przeczytaj [ARCHITEKTURA_TECHNICZNA.md](ARCHITEKTURA_TECHNICZNA.md) - sekcja 1 i 2
2. Zainstaluj srodowisko:
   - Sledz [INSTALACJA_KONFIGURACJA_WDROZENIE.md](INSTALACJA_KONFIGURACJA_WDROZENIE.md) - sekcja 1
3. Naucz sie API:
   - Przeczytaj [API_REFERENCE.md](API_REFERENCE.md) - sekcje 1-4
4. Zrozum zaleznosci i procedury:
   - Przeczytaj [ZALEZNOSCI_I_PROCEDURY.md](ZALEZNOSCI_I_PROCEDURY.md)
5. Zapoznaj sie z procesami biznesowymi:
   - Przeczytaj [WORKFLOW_PROCESY.md](WORKFLOW_PROCESY.md) (gdy bedzie dostepny)
6. Koduj zgodnie z konwencjami:
   - Stosuj [KODOWANIE_KONWENCJE.md](KODOWANIE_KONWENCJE.md) (gdy bedzie dostepny)

### Dla administratorow

1. Przeczytaj [ADMINISTRACJA_I_UZYTKOWNIK.md](ADMINISTRACJA_I_UZYTKOWNIK.md) - Czesc I
2. Skonfiguruj Django Admin
3. Przejrzyj backupy i monitoring

### Dla uzytkownikow koncowych

1. Przeczytaj [ADMINISTRACJA_I_UZYTKOWNIK.md](ADMINISTRACJA_I_UZYTKOWNIK.md) - Czesc II
2. Zaloguj sie i zapoznaj sie z UI
3. Jesli potrzebujesz pomocy, sprawdz FAQ i support

---

## Struktura Projektu

```text
Ledwo-Zrekrutowani/
|- backend/
|  |- core/
|  |  |- settings.py
|  |  |- urls.py
|  |  |- wsgi.py
|  |  \- asgi.py
|  |- users/
|  |- studies/
|  |- enrollments/
|  |- payments/
|  |- files/
|  |- notifications/
|  |- manage.py
|  |- requirements.txt
|  \- docker-compose.yml
|- frontend/
|  |- src/
|  |  |- components/
|  |  |- pages/
|  |  |- hooks/
|  |  |- services/
|  |  |- api/
|  |  \- styles/
|  |- vite.config.js
|  |- eslint.config.js
|  |- tailwind.config.js
|  |- package.json
|  \- index.html
|- docs/
|  |- README.md
|  |- ARCHITEKTURA_TECHNICZNA.md
|  |- INSTALACJA_KONFIGURACJA_WDROZENIE.md
|  |- API_REFERENCE.md
|  |- ADMINISTRACJA_I_UZYTKOWNIK.md
|  |- ZALEZNOSCI_I_PROCEDURY.md
|  |- WORKFLOW_PROCESY.md
|  \- KODOWANIE_KONWENCJE.md
\- README.md
```

---

## Linki do Dokumentow

| Dokument | Sciezka |
|----------|---------|
| Architektura | [ARCHITEKTURA_TECHNICZNA.md](ARCHITEKTURA_TECHNICZNA.md) |
| Instalacja i deployment | [INSTALACJA_KONFIGURACJA_WDROZENIE.md](INSTALACJA_KONFIGURACJA_WDROZENIE.md) |
| API Reference | [API_REFERENCE.md](API_REFERENCE.md) |
| Admin i User Guide | [ADMINISTRACJA_I_UZYTKOWNIK.md](ADMINISTRACJA_I_UZYTKOWNIK.md) |
| Zaleznosci i procedury | [ZALEZNOSCI_I_PROCEDURY.md](ZALEZNOSCI_I_PROCEDURY.md) |

---

## Glowne Narzedzia i Technologie

### Backend
- Framework: Django 6.0.3
- API: Django REST Framework 3.17.1
- Database: PostgreSQL 18
- Authentication: JWT (SimpleJWT)
- Language: Python 3.10+

### Frontend
- Framework: React 19.2.4
- Build tool: Vite 8.0.2
- Styling: TailwindCSS 4.2.2
- Routing: React Router DOM 7.13.1
- Linting: ESLint 9.39.4
- Language: JavaScript (ES2024+)

### Deployment
- Container: Docker i Docker Compose
- Server: Gunicorn (Django), Nginx (reverse proxy)
- SSL: Let's Encrypt

---

## Najczestsze Pytania

P: Gdzie znalezc informacje o API?
O: [API_REFERENCE.md](API_REFERENCE.md)

P: Jak zainstalowac projekt?
O: [INSTALACJA_KONFIGURACJA_WDROZENIE.md](INSTALACJA_KONFIGURACJA_WDROZENIE.md) - Sekcja 1

P: Jak zarzadzac uzytkownikami?
O: [ADMINISTRACJA_I_UZYTKOWNIK.md](ADMINISTRACJA_I_UZYTKOWNIK.md) - Sekcja Zarzadzanie Uzytkownikami

P: Jak wdrazac na produkcje?
O: [INSTALACJA_KONFIGURACJA_WDROZENIE.md](INSTALACJA_KONFIGURACJA_WDROZENIE.md) - Sekcja 3

P: Jakie sa wymagania systemowe i wersje zaleznosci?
O: [ZALEZNOSCI_I_PROCEDURY.md](ZALEZNOSCI_I_PROCEDURY.md) - Sekcje Wymagania Systemowe i Wersje Narzedzi

P: Jak wykonac backup lub odtworzyc system?
O: [ZALEZNOSCI_I_PROCEDURY.md](ZALEZNOSCI_I_PROCEDURY.md) - Sekcje Procedury Backupu i Procedury Odtwarzania

P: Gdzie sa konwencje kodowania?
O: [KODOWANIE_KONWENCJE.md](KODOWANIE_KONWENCJE.md) (w przygotowaniu)

---

## Support i Kontakt

- Email: support@ledwo.edu
- Bug reports: GitHub Issues
- Documentation issues: [Utworz Issue](https://github.com/yourorg/Ledwo-Zrekrutowani/issues)
- Chat: Discord/Slack (jesli dostepny)

---

## Historia Zmian

| Data | Zmiany | Autor |
|------|--------|-------|
| 20.05.2026 | Inicjalna dokumentacja | Team |
| - | - | - |

---

## Licencja

All Rights Reserved.

---

## Przydatne Linki

- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [API Design Guide](https://restfulapi.net/)
- [Git Workflow](https://git-scm.com/doc)

---

Ostatnia aktualizacja: 20.05.2026
Wersja dokumentacji: 1.0
Status: Production-Ready
