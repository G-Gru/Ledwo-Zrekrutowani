# đź“š Dokumentacja - Ledwo Zrekrutowani

Witaj w kompletnej dokumentacji projektu **Ledwo Zrekrutowani**. Ta dokumentacja zawiera wszelkie informacje niezbÄ™dne do zrozumienia, instalacji, wdraĹĽania i administrowania systemem.

---

## đź“– Spis DokumentĂłw

### 1. đźŹ—ď¸Ź **[ARCHITEKTURA_TECHNICZNA.md](ARCHITEKTURA_TECHNICZNA.md)**
PrzeglÄ…d architektury systemu, warstw aplikacji i stosu technologicznego.

**Zawiera:**
- OgĂłlny diagram architektury
- Warstwy: Frontend (React), Backend (Django), Database (PostgreSQL)
- 6 Aplikacji Django z odpowiedzialnoĹ›ciami
- PrzepĹ‚yw komunikacji Backend-Frontend
- Stack technologiczny (React, Django, Vite, TailwindCSS, etc.)
- PorĂłwnanie technologii i alternatywy
- BezpieczeĹ„stwo i Autentykacja JWT

**Dla kogo:** Architekci, DevOps, Developers (overview)

---

### 2. âš™ď¸Ź **[INSTALACJA_KONFIGURACJA_WDROZENIE.md](INSTALACJA_KONFIGURACJA_WDROZENIE.md)**
Instrukcje instalacji, konfiguracji i wdraĹĽania na produkcjÄ™.

**Zawiera:**
- Wymagania systemowe
- Setup Backend'u (Python, PostgreSQL, venv)
- Setup Frontend'u (Node.js, npm, Vite)
- Konfiguracja zmiennych Ĺ›rodowiska (.env)
- Migracje bazy danych
- WdraĹĽanie z Docker
- WdraĹĽanie na VPS (AWS, DigitalOcean, Ubuntu)
- Nginx Reverse Proxy
- SSL/TLS z Let's Encrypt
- Systemd Services
- NajczÄ™stsze polecenia
- Troubleshooting

**Dla kogo:** DevOps, System Administrators, Deployment Engineers

---

### 3. đź“ˇ **[API_REFERENCE.md](API_REFERENCE.md)**
Kompletna dokumentacja API, interfejsĂłw i integracji.

**Zawiera:**
- PrzeglÄ…d API (Base URL, wersjonowanie, konwencje)
- JWT Autentykacja & Token Lifecycle
- Konwencje HTTP (Methods, Status Codes, Pagination)
- Wszystkie Endpoint'y:
  - Authentication (Register, Login, Refresh)
  - Studies (List, Retrieve, Staff, Documents)
  - Enrollments (Create, Update, Upload, Status)
  - Payments (History, Upcoming, Pay)
  - Files (Download)
  - Notifications (Send)
  - Admin Endpoints
- Kody BĹ‚Ä™dĂłw z rozwiÄ…zaniami
- Rate Limiting
- Integracje ZewnÄ™trzne (Payment Gateway, Email, Documents)
- Best Practices dla Frontend
- Testing Endpoints (Postman, cURL)

**Dla kogo:** Frontend Developers, Backend Developers, Integration Specialists

---

### 4. đź‘¨â€Ťđź’Ľ **[ADMINISTRACJA_I_UZYTKOWNIK.md](ADMINISTRACJA_I_UZYTKOWNIK.md)**
Instrukcje administracyjne i guide'y dla uĹĽytkownikĂłw.

**Zawiera:**

**CzÄ™Ĺ›Ä‡ I - Administracja & Utrzymanie:**
- Panel Django Admin (dostÄ™p, struktura)
- ZarzÄ…dzanie UĹĽytkownikami (typy, tworzenie, role)
- ZarzÄ…dzanie Kierunkami & Edycjami
- ZarzÄ…dzanie RekrutacjÄ… (aplikacje, dokumenty, statusy)
- ZarzÄ…dzanie OpĹ‚atami & Finansami
- Backupy & Disaster Recovery
- Monitoring & Performance
- Logowanie & Audyt
- Troubleshooting (najczÄ™stsze problemy)

**CzÄ™Ĺ›Ä‡ II - User Guide:**
- Instrukcja dla KandydatĂłw (Rejestracja, aplikacja, pĹ‚atnoĹ›ci)
- Instrukcja dla PracownikĂłw (Review, zarzÄ…dzanie, finansy)
- FAQ & Support

**Dla kogo:** Administratorzy, Pracownicy Uczelni, Kandydaci/Studenci

---

### 5. ďż˝ **[ZALEZNOSCI_I_PROCEDURY.md](ZALEZNOSCI_I_PROCEDURY.md)**
Dokumentacja zaleĹĽnoĹ›ci technologicznych, procedur uruchomienia i odtwarzania systemu.

**Zawiera:**
- ZaleĹĽnoĹ›ci Backend'u (Django, DRF, PostgreSQL, SimpleJWT, docxtpl, etc.)
- ZaleĹĽnoĹ›ci Frontend'u (React, Vite, TailwindCSS, ESLint, etc.)
- Wymagania systemowe (CPU, RAM, Dysk dla rĂłĹĽnych Ĺ›rodowisk)
- Wersje narzÄ™dzi (Python, Node.js, PostgreSQL, Docker, Git)
- Procedury Uruchomienia (dev, produkcja, Docker)
- Procedury Aktualizacji (pip, npm, migracje)
- Procedury Backupu (PostgreSQL, media files, full backup)
- Procedury Odtwarzania (z SQL, z Docker, od zera)
- Disaster Recovery (kroki dla awarii systemu)
- CI/CD Pipelines (GitHub Actions example)

**Dla kogo:** DevOps, System Administrators, Maintenance Engineers

---

### 6. ďż˝đź“‹ **[WORKFLOW_PROCESY.md](WORKFLOW_PROCESY.md)** (TODO)
Procesy biznesowe i przepĹ‚ywy systemu.

**BÄ™dzie zawieraÄ‡:**
- Workflow rekrutacji (od aplikacji do decyzji)
- Workflow pĹ‚atnoĹ›ci
- Workflow obsĹ‚ugi dokumentĂłw
- State machines (statusy i przejĹ›cia)
- Diagramy procesĂłw
- Notyfikacje i komunikacja

---

### 7. đź’» **[KODOWANIE_KONWENCJE.md](KODOWANIE_KONWENCJE.md)** (TODO)
Konwencje kodowania i best practices.

**BÄ™dzie zawieraÄ‡:**
- Style Guide Python (Backend)
- Style Guide JavaScript/React (Frontend)
- Nazewnictwo zmiennych, funkcji, klas
- Struktura folderĂłw
- Import/Export conventions
- Testing guidelines
- Git commit messages
- Code review guidelines

---

## đźš€ Quick Start

### Dla Nowych DeweloperĂłw

1. **Zapoznaj siÄ™ z architekturÄ…:**
   - Przeczytaj [ARCHITEKTURA_TECHNICZNA.md](ARCHITEKTURA_TECHNICZNA.md) - sekcja 1 & 2

2. **Zainstaluj Ĺ›rodowisko:**
   - ĹšledĹş [INSTALACJA_KONFIGURACJA_WDROZENIE.md](INSTALACJA_KONFIGURACJA_WDROZENIE.md) - sekcja 1

3. **Naucz siÄ™ API:**
   - Przeczytaj [API_REFERENCE.md](API_REFERENCE.md) - sekcje 1-4

4. **Zrozum zaleĹĽnoĹ›ci i procedury:**
   - Przeczytaj [ZALEZNOSCI_I_PROCEDURY.md](ZALEZNOSCI_I_PROCEDURY.md) - dla informacji o wersjonowaniu i procedurach

5. **Zapoznaj siÄ™ z procesami biznesowymi:**
   - Przeczytaj [WORKFLOW_PROCESY.md](WORKFLOW_PROCESY.md) (gdy bÄ™dzie dostÄ™pny)

6. **Koduj zgodnie z konwencjami:**
   - Stosuj [KODOWANIE_KONWENCJE.md](KODOWANIE_KONWENCJE.md) (gdy bÄ™dzie dostÄ™pny)

### Dla AdministratorĂłw

1. Przeczytaj [ADMINISTRACJA_I_UZYTKOWNIK.md](ADMINISTRACJA_I_UZYTKOWNIK.md) - CzÄ™Ĺ›Ä‡ I
2. Skonfiguruj Django Admin
3. Przejrzyj Backupy & Monitoring

### Dla UĹĽytkownikĂłw KoĹ„cowych

1. Przeczytaj [ADMINISTRACJA_I_UZYTKOWNIK.md](ADMINISTRACJA_I_UZYTKOWNIK.md) - CzÄ™Ĺ›Ä‡ II
2. Zaloguj siÄ™ i zapoznaj siÄ™ z UI
3. JeĹ›li potrzebujesz pomocy â†’ FAQ & Support

---

## đź“Š Struktura Projektu

```
Ledwo-Zrekrutowani/
â”śâ”€â”€ backend/                              # Django Backend
â”‚   â”śâ”€â”€ core/                             # Konfiguracja Django
â”‚   â”‚   â”śâ”€â”€ settings.py
â”‚   â”‚   â”śâ”€â”€ urls.py
â”‚   â”‚   â”śâ”€â”€ wsgi.py
â”‚   â”‚   â””â”€â”€ asgi.py
â”‚   â”śâ”€â”€ users/                            # Users App
â”‚   â”śâ”€â”€ studies/                          # Studies App
â”‚   â”śâ”€â”€ enrollments/                      # Enrollments App
â”‚   â”śâ”€â”€ payments/                         # Payments App
â”‚   â”śâ”€â”€ files/                            # Files App
â”‚   â”śâ”€â”€ notifications/                    # Notifications App
â”‚   â”śâ”€â”€ manage.py
â”‚   â”śâ”€â”€ requirements.txt
â”‚   â””â”€â”€ docker-compose.yml
â”‚
â”śâ”€â”€ frontend/                             # React Frontend
â”‚   â”śâ”€â”€ src/
â”‚   â”‚   â”śâ”€â”€ components/
â”‚   â”‚   â”śâ”€â”€ pages/
â”‚   â”‚   â”śâ”€â”€ hooks/
â”‚   â”‚   â”śâ”€â”€ services/
â”‚   â”‚   â”śâ”€â”€ api/
â”‚   â”‚   â””â”€â”€ styles/
â”‚   â”śâ”€â”€ vite.config.js
â”‚   â”śâ”€â”€ eslint.config.js
â”‚   â”śâ”€â”€ tailwind.config.js
â”‚   â”śâ”€â”€ package.json
â”‚   â””â”€â”€ index.html
â”‚
â”śâ”€â”€ docs/                                 # đź“Ť Dokumentacja
â”‚   â”śâ”€â”€ README.md                         # Ten plik
â”‚   â”śâ”€â”€ ARCHITEKTURA_TECHNICZNA.md
â”‚   â”śâ”€â”€ INSTALACJA_KONFIGURACJA_WDROZENIE.md
â”‚   â”śâ”€â”€ API_REFERENCE.md
â”‚   â”śâ”€â”€ ADMINISTRACJA_I_UZYTKOWNIK.md
â”‚   â”śâ”€â”€ ZALEZNOSCI_I_PROCEDURY.md
â”‚   â”śâ”€â”€ WORKFLOW_PROCESY.md              # TODO
â”‚   â””â”€â”€ KODOWANIE_KONWENCJE.md           # TODO
â”‚
â””â”€â”€ README.md                             # GĹ‚Ăłwny README projektu
```

---

## đź”— Linki do DokumentĂłw

| Dokument | ĹšcieĹĽka | Status |
|----------|--------|--------|
| Architektura | [ARCHITEKTURA_TECHNICZNA.md](ARCHITEKTURA_TECHNICZNA.md) | âś… Gotowy |
| Instalacja & Deployment | [INSTALACJA_KONFIGURACJA_WDROZENIE.md](INSTALACJA_KONFIGURACJA_WDROZENIE.md) | âś… Gotowy |
| API Reference | [API_REFERENCE.md](API_REFERENCE.md) | âś… Gotowy |
| Admin & User Guide | [ADMINISTRACJA_I_UZYTKOWNIK.md](ADMINISTRACJA_I_UZYTKOWNIK.md) | âś… Gotowy |
| ZaleĹĽnoĹ›ci & Procedury | [ZALEZNOSCI_I_PROCEDURY.md](ZALEZNOSCI_I_PROCEDURY.md) | âś… Gotowy |
| Procesy Biznesowe | [WORKFLOW_PROCESY.md](WORKFLOW_PROCESY.md) | âŹł TODO |
| Konwencje Kodowania | [KODOWANIE_KONWENCJE.md](KODOWANIE_KONWENCJE.md) | âŹł TODO |

---

## đź› ď¸Ź GĹ‚Ăłwne NarzÄ™dzia & Technologie

### Backend
- **Framework:** Django 6.0.3
- **API:** Django REST Framework 3.17.1
- **Database:** PostgreSQL 18
- **Authentication:** JWT (SimpleJWT)
- **Language:** Python 3.10+

### Frontend
- **Framework:** React 19.2.4
- **Build Tool:** Vite 8.0.2
- **Styling:** TailwindCSS 4.2.2
- **Routing:** React Router DOM 7.13.1
- **Linting:** ESLint 9.39.4
- **Language:** JavaScript (ES2024+)

### Deployment
- **Container:** Docker & Docker Compose
- **Server:** Gunicorn (Django), Nginx (Reverse Proxy)
- **SSL:** Let's Encrypt

---

## âť“ NajczÄ™stsze Pytania

**P: Gdzie znaleĹşÄ‡ informacje o API?**
O: [API_REFERENCE.md](API_REFERENCE.md)

**P: Jak zainstalowaÄ‡ projekt?**
O: [INSTALACJA_KONFIGURACJA_WDROZENIE.md](INSTALACJA_KONFIGURACJA_WDROZENIE.md) - Sekcja 1

**P: Jak zarzÄ…dzaÄ‡ uĹĽytkownikami?**
O: [ADMINISTRACJA_I_UZYTKOWNIK.md](ADMINISTRACJA_I_UZYTKOWNIK.md) - Sekcja "ZarzÄ…dzanie UĹĽytkownikami"

**P: Jak wdraĹĽaÄ‡ na produkcjÄ™?**
O: [INSTALACJA_KONFIGURACJA_WDROZENIE.md](INSTALACJA_KONFIGURACJA_WDROZENIE.md) - Sekcja 3

**P: Jakie sÄ… wymagania systemowe i wersje zaleĹĽnoĹ›ci?**
O: [ZALEZNOSCI_I_PROCEDURY.md](ZALEZNOSCI_I_PROCEDURY.md) - Sekcja "Wymagania Systemowe" i "Wersje NarzÄ™dzi"

**P: Jak wykonaÄ‡ backup lub odtworzyÄ‡ system?**
O: [ZALEZNOSCI_I_PROCEDURY.md](ZALEZNOSCI_I_PROCEDURY.md) - Sekcje "Procedury Backupu" i "Procedury Odtwarzania"

**P: Gdzie sa konwencje kodowania?**
O: [KODOWANIE_KONWENCJE.md](KODOWANIE_KONWENCJE.md) (w przygotowaniu)

---

## đź“ž Support & Kontakt

- **Email:** support@ledwo.edu
- **Bug Reports:** GitHub Issues
- **Documentation Issues:** [UtwĂłrz Issue](https://github.com/yourorg/Ledwo-Zrekrutowani/issues)
- **Chat:** Discord/Slack (jeĹ›li dostÄ™pny)

---

## đź“ť Historia Zmian

| Data | Zmiany | Autor |
|------|--------|-------|
| 20.05.2026 | Inicjalna dokumentacja | Team |
| - | - | - |

---

## đź“„ Licencja

Projekt dostÄ™pny na licencji MIT (lub inna - do uzupeĹ‚nienia)

---

## âś¨ Przydatne Linki

- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://react.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [API Design Guide](https://restfulapi.net/)
- [Git Workflow](https://git-scm.com/doc)

---

**Ostatnia aktualizacja:** 20.05.2026  
**Wersja dokumentacji:** 1.0  
**Status:** Production-Ready âś…

