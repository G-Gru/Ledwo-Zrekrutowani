# Role i uprawnienia

## Role użytkowników

Rola jest zwracana przy logowaniu (`POST /api/auth/login/`) w polu `role` i zapisywana w localStorage.  
Logika rozwiązywania roli na podstawie atrybutów użytkownika: `backend/users/views.py` → `_resolve_login_role()`.

| Rola | Typ | Opis |
|------|-----|------|
| `ADMIN` | Pracownik | Pełny dostęp — wszystkie funkcje systemu |
| `STUDIES_DIRECTOR` | Pracownik | Dostęp do panelu admin z wyjątkiem finansów |
| `ADMINISTRATIVE_COORDINATOR` | Pracownik | Dostęp do panelu admin z wyjątkiem finansów |
| `FINANCE_COORDINATOR` | Pracownik | Dostęp tylko do widoku finansów |
| `UNASSIGNED_EMPLOYEE` | Pracownik | Konto pracownicze bez przypisanej roli — brak dostępu do panelu |
| `STUDENT` | Kandydat | Przyjęty na studia — dostęp do widoków konta (moje zgłoszenia, płatności, dokumenty) |
| `CANDIDATE` | Kandydat | W trakcie rekrutacji — dostęp do widoków konta |

---

## Dostęp do tras frontendowych

`ProtectedRoute` w `App.jsx` sprawdza `authService.isLoggedIn()` i `authService.getUser().role`.  
Nieupoważnieni użytkownicy są przekierowywani na `/studies`.

| Trasa | Dostęp |
|-------|--------|
| `/studies` | Publiczny |
| `/studies/editions/:id` | Publiczny |
| `/login`, `/register` | Publiczny |
| `/applicationForm`, `/applicationSent` | Publiczny |
| `/faq`, `/navigation` | Publiczny |
| `/my-applications` | Dowolny zalogowany |
| `/my-payments` | Dowolny zalogowany |
| `/my-documents` | Dowolny zalogowany |
| `/my-profile` | Dowolny zalogowany |
| `/manage-studies/offers` | `ADMIN` |
| `/manage-studies/editions` | `ADMIN` |
| `/manage-studies/employees` | `ADMIN` |
| `/admin/recruitment-stats` | `ADMIN`, `STUDIES_DIRECTOR`, `ADMINISTRATIVE_COORDINATOR` |
| `/admin/candidates` | `ADMIN`, `STUDIES_DIRECTOR`, `ADMINISTRATIVE_COORDINATOR` |
| `/admin/candidates/:id` | `ADMIN`, `STUDIES_DIRECTOR`, `ADMINISTRATIVE_COORDINATOR` |
| `/admin/applications` | `ADMIN`, `STUDIES_DIRECTOR`, `ADMINISTRATIVE_COORDINATOR` |
| `/admin/applications/:id` | `ADMIN`, `STUDIES_DIRECTOR`, `ADMINISTRATIVE_COORDINATOR` |
| `/admin/export` | `ADMIN`, `STUDIES_DIRECTOR`, `ADMINISTRATIVE_COORDINATOR` |
| `/admin/notifications` | `ADMIN`, `STUDIES_DIRECTOR`, `ADMINISTRATIVE_COORDINATOR` |
| `/admin/finances` | `ADMIN`, `FINANCE_COORDINATOR` |

---

## Klasy uprawnień backendu

Zdefiniowane w `backend/users/permissions.py`.

| Klasa | Kogo dopuszcza |
|-------|----------------|
| `IsAuthenticated` (DRF) | Dowolny zalogowany użytkownik z ważnym tokenem |
| `IsStudent` | Użytkownicy z rolą `STUDENT` lub `CANDIDATE` |
| `IsEmployee` | Pracownicy uczelni (role inne niż `STUDENT`/`CANDIDATE`) |
| `IsObjectOwner` | Właściciel konkretnego zasobu |

Płatności kandydata: `[IsAuthenticated, IsStudent]`  
Endpointy admin: `[IsEmployee]`

---

## Schemat uprawnień API

```
Publiczne (bez tokena):
  POST /api/auth/register/
  POST /api/auth/login/
  POST /api/auth/refresh/
  GET  /api/studies/*

Kandydaci (IsAuthenticated + IsStudent):
  GET/POST /api/enrollments/*
  GET/POST /api/payments/*

Pracownicy (IsEmployee):
  GET/POST /api/admin/enrollments/*
  GET/POST /api/admin/finances/*
  GET      /api/admin/notifications/*
  GET/POST /api/admin/studies/*
  GET/POST /api/admin/users/*
```
