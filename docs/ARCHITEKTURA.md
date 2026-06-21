# Architektura systemu

## Przegląd

```
frontend/     (React 19, JS)   :5173 ──┐
                                        ├─ HTTP/JWT ──►  Backend (Django 6)  ──ORM──►  PostgreSQL
frontend-tsx/ (React 18, TS)   :5174 ──┘                     :8000                         :5432
                                                                 │
                                                              Celery  ──►  Redis :6379
```

Oba frontendy działają równolegle i komunikują się z tym samym backendem. Każdy request (poza publicznymi) niesie token JWT w nagłówku `Authorization: Bearer {access_token}`. Celery obsługuje zadania asynchroniczne (głównie wysyłkę emaili).

---

## Frontend TypeScript — `frontend-tsx/`

**Port dev:** 5174 (`npm run dev`)

### Stack

React 19 + TypeScript + Vite 5 + TailwindCSS 4 + Radix UI + lucide-react  
Komponenty UI wzorowane na shadcn/ui — napisane od zera w `src/components/ui/`.

### Design system (AGH)

| Token | Wartość | Użycie |
|-------|---------|--------|
| Header | `#4c545c` | Tło nagłówka |
| Primary/Accent | `#705d00` | Przyciski, linki |
| Gold container | `#ffd600` | Akcenty, badge |
| Surface light | `#f0edec` | Tło kart |
| Surface lighter | `#f6f3f2` | Tło strony |
| Error | `#ba1a1a` | Błędy |


### Kluczowe pliki

| Plik | Rola |
|------|------|
| `src/api/client.ts` | Bazowy klient HTTP |
| `src/services/api.ts` | Wszystkie endpointy — typowany, zwraca `ApiResult<T>` (discriminated union) |
| `src/services/auth.ts` | Logika autentykacji, token refresh |
| `src/context/AuthContext.tsx` | Globalny stan użytkownika |
| `src/App.tsx` | Routing z ochroną tras |

### Strony (`src/pages/`)

**Publiczne:**
- `StudiesPage` — lista kierunków
- `StudiesDetailPage` — szczegóły edycji
- `LoginPage`, `RegisterPage`, `FAQPage`, `ContactPage`
- `ApplicationFormPage` — formularz aplikacji
- `ApplicationSentPage` — potwierdzenie

**Konto kandydata (`account/`):**
- `MyApplicationsPage`, `MyPaymentsPage`, `MyDocumentsPage`, `MyProfilePage`

**Panel admina (`admin/`):**
- `AdminDashboardPage` — statystyki rekrutacji
- `AdminCandidatesPage` — **ujednolicony panel** kandydatów (zakładki: dane, zgłoszenie, dokumenty, płatności) — zastępuje 4 oddzielne strony ze starego frontendu
- `AdminFinancesPage` — opłaty i transakcje
- `AdminNotificationsPage` — wysyłka emaili (batch i per-user z podstawianiem zmiennych)
- `AdminExportPage` — eksport USOS

**Zarządzanie (`manage/`):**
- `ManageOffersPage`, `ManageEditionsPage`, `ManageEmployeesPage`

### Komponenty UI (`src/components/ui/`)

`Button`, `Card`, `Input`, `Select`, `Table`, `Modal`, `Badge`, `Alert`  
Wszystkie eksportowane przez `src/components/ui/index.ts`.

---

## Frontend JavaScript — `frontend/`

**Port dev:** 5173 (`npm run dev`)

Stack: React 19, JavaScript (JSX), Vite 8, TailwindCSS 4, React Router DOM 7

### Kluczowe pliki

| Plik | Rola |
|------|------|
| `src/api/client.js` | `apiClient()` — bazowy klient HTTP; `BASE_URL` z `VITE_API_URL` lub `http://localhost:8000` |
| `src/services/serverApi.js` | Wszystkie wywołania backendu (718 linii) |
| `src/services/authService.js` | `isLoggedIn()`, `getUser()`, `logout()` — odczyt z localStorage |
| `src/hooks/useAuth.js` | Hook do zarządzania stanem autentykacji |
| `src/App.jsx` | Routing — `ProtectedRoute` z kontrolą ról |

### Strony (`src/pages/`)

**Publiczne:** `StudiesPage`, `StudiesDetailPage`, `Login`, `Register`, `FAQ`, `NavigationPage`, `ApplicationForm`, `ApplicationSent`

**Konto kandydata (`account-pages/`):** `MyApplications`, `MyPayments`, `MyDocuments`, `MyProfile`

**Panel pracownika (`admin-pages/`):** `CoordinatorRecruitmentStats`, `Candidates`, `CandidateDetails`, `ApplicationsReview`, `ApplicationReviewDetails`, `AdminNotifications`, `DataExport`, `Finances`

**Zarządzanie:** `ManageStudiesOffers`, `ManageStudiesEditions`, `ManageEmployees`, `ManageEmployeesAccounts`

---

## Backend

**Lokalizacja:** `backend/`

### Aplikacje Django

| App | Prefiks URL | Opis |
|-----|-------------|------|
| `core` | — | `settings.py`, `urls.py`, `celery.py` — konfiguracja projektu |
| `users` | `/api/auth/`, `/api/admin/users/` | Autentykacja JWT, zarządzanie pracownikami |
| `studies` | `/api/studies/`, `/api/admin/studies/` | Kierunki (`Studies`) i edycje (`StudiesEdition`) |
| `enrollments` | `/api/enrollments/`, `/api/admin/enrollments/` | Zgłoszenia rekrutacyjne, dokumenty, statusy |
| `payments` | `/api/payments/`, `/api/admin/finances/` | Opłaty (`Fee`) i historia płatności |
| `files` | `/media/` | Upload i serwowanie plików (przez Django w dev, nginx w prod) |
| `notifications` | `/api/admin/notifications/` | Wysyłka emaili przez Celery |

Każda aplikacja (poza `core`) zawiera `models.py`, `serializers.py`, `views.py`, `urls.py`.  
Aplikacje `enrollments`, `notifications` i `users` mają dodatkowo `admin_urls.py` — osobny routing dla endpointów pracowniczych.

### Routing URL (`core/urls.py`)

```
/api/auth/             → users.urls
/api/admin/users/      → users.admin_urls
/api/studies/          → studies.urls
/api/admin/studies/    → studies.admin_urls
/api/enrollments/      → enrollments.urls
/api/admin/enrollments/→ enrollments.admin_urls
/api/payments/         → payments.urls
/api/admin/finances/   → payments.admin_urls
/api/admin/notifications/ → notifications.admin_urls
/media/                → Django static() (tylko DEBUG=True)
```

---

## Modele danych

### Hierarchia

```
Studies (kierunek)
└── StudiesEdition (edycja / konkretna rekrutacja)
    ├── StudiesDocument (wymagane dokumenty)
    ├── StudiesEditionStaff (przypisani pracownicy)
    └── Enrollment (zgłoszenie kandydata)
        ├── FormData (dane osobowe — relacja OneToOne)
        ├── SubmittedDocument → File
        │   └── DocumentHistory (historia przeglądu)
        └── Fee (opłata rekrutacyjna)
```

### Studies

**`Studies`** — kierunek studiów  
Pola: `name`, `organizational_unit`, `terms_count`, `description`

**`StudiesEdition`** — konkretna edycja (rekrutacja) kierunku  
Pola: FK(`Studies`), `price`, `start_date`, `end_date`, `max_participants`, `status`, `syllabus_url`, `recruitment_start_date`, `recruitment_end_date`, `academic_year`

Status edycji: `HIDDEN` → `ACTIVE` → `CLOSED`  
Kandydaci mogą składać wnioski tylko przy statusie `ACTIVE`.

**`StudiesEditionStaff`** — pracownicy przypisani do edycji  
Unikalna para `(StudiesEdition, User)`.

### Enrollments

**`Enrollment`** — zgłoszenie kandydata  
Pola: FK(`User`), FK(`StudiesEdition`), `status`, `status_note` (max 200 znaków)

Lifecycle statusu: `DRAFT` → `SUBMITTED` → (recenzja) → `STUDENT` lub `CANCELLED`

**`FormData`** — dane osobowe kandydata (OneToOne z `Enrollment`)  
Zawiera dane adresowe, dokumenty tożsamości itp.

**`SubmittedDocument`** — przesłany dokument  
Pola: FK(`Enrollment`), FK(`StudiesDocument`), OneToOne(`File`), `status`, `submitted_date`

**`DocumentHistory`** — historia zmiany statusu dokumentu  
Pola: FK(`SubmittedDocument`), FK(`StudiesEditionStaff`), `previous_status`

### Payments

**`Fee`** — opłata rekrutacyjna  
Pola: FK(`Enrollment`), `amount`, `due_date`, `paid_date`  
`paid_date = null` oznacza nieopłaconą opłatę.

### Users

**`User`** (rozszerzenie Django `AbstractUser`)  
Pola: `email` (używany jako `USERNAME_FIELD`), `phone`, `first_name`, `last_name`, `type`, `role`

---

## Przepływ komunikacji

```
1. Frontend wywołuje apiClient(url, { headers: { Authorization: 'Bearer ...' } })
2. Django CORS middleware — weryfikacja origin
3. SimpleJWT — dekodowanie tokena, ustawienie request.user
4. Permission class — IsAuthenticated / IsEmployee / IsStudent
5. View / ViewSet — logika, deleguje do services.py
6. Django ORM — operacje na bazie danych
7. Serializer — konwersja do JSON
8. HTTP response → Frontend
```

### Refresh tokena

Po wygaśnięciu access tokena (krótki TTL): `POST /api/auth/refresh/` z refresh tokenem → nowy access token.

### Pliki medialne

W trybie deweloperskim (`DEBUG=True`) serwowane przez Django pod `/media/`.  
W produkcji — nginx musi obsługiwać katalog `MEDIA_ROOT` pod URL `MEDIA_URL`.
