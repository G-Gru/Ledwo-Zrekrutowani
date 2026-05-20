# API Reference - Ledwo Zrekrutowani

## Spis Treści

1. [Przegląd API](#przegląd-api)
2. [Autentykacja & Authorization](#autentykacja--authorization)
3. [Konwencje & Standards](#konwencje--standards)
4. [Authentication Endpoints](#authentication-endpoints-users)
5. [Studies Endpoints](#studies-endpoints)
6. [Enrollments Endpoints](#enrollments-endpoints)
7. [Payments Endpoints](#payments-endpoints)
8. [Files Endpoints](#files-endpoints)
9. [Notifications Endpoints](#notifications-endpoints)
10. [Admin Endpoints](#admin-endpoints)
11. [Kody Błędów](#kody-błędów)
12. [Rate Limiting & Throttling](#rate-limiting--throttling)
13. [Integracje Zewnętrzne](#integracje-zewnętrzne)

---

## Przegląd API

### Base URL
```
Development:  http://localhost:8000
Production:   https://yourdomain.com
```

### API Version
- Obecna wersja: **v1** (implicit - nie ma prefiksu w URL)
- Format danych: **JSON**

### Ogólne Struktura Request/Response

**Request Header (obowiązkowy):**
```
Content-Type: application/json
Authorization: Bearer {access_token}  // Dla endpoints wymagających autentykacji
```

**Response Success (2xx):**
```json
{
  "id": 1,
  "data": {...},
  "created_at": "2026-05-20T10:30:00Z"
}
```

**Response Error (4xx/5xx):**
```json
{
  "detail": "Error message",
  "code": "ERROR_CODE",
  "errors": {
    "field_name": ["Error message for field"]
  }
}
```

---

## Autentykacja & Authorization

### JWT (JSON Web Tokens)

Projekt używa **JWT-based authentication** za pomocą biblioteki `djangorestframework-simplejwt`.

**Token Lifecycle:**
```
┌─────────────────────────────────────────────────┐
│ 1. User submits login credentials              │
│    POST /api/auth/login/                        │
│    { "email": "...", "password": "..." }       │
├─────────────────────────────────────────────────┤
│ 2. Backend validates & returns 2 tokens:       │
│    - access_token (1 hour lifetime)            │
│    - refresh_token (7 days lifetime)           │
├─────────────────────────────────────────────────┤
│ 3. Frontend stores tokens (localStorage)       │
├─────────────────────────────────────────────────┤
│ 4. Frontend sends in every request:            │
│    Authorization: Bearer {access_token}        │
├─────────────────────────────────────────────────┤
│ 5. When access_token expires:                  │
│    POST /api/auth/refresh/                     │
│    { "refresh": "{refresh_token}" }            │
├─────────────────────────────────────────────────┤
│ 6. Backend returns new access_token            │
└─────────────────────────────────────────────────┘
```

### Payload Access Token
```json
{
  "token_type": "access",
  "exp": 1716202200,          // Expiration timestamp
  "iat": 1716198600,          // Issued at
  "jti": "abc123...",         // JWT ID
  "user_id": 42,
  "email": "user@example.com",
  "type": "STUDENT"           // STUDENT, EMPLOYEE, ADMIN
}
```

### User Types & Roles

| User Type | Opis | Dostęp |
|-----------|------|--------|
| **STUDENT** | Zwykły użytkownik (kandydat) | Publiczne endpoint'y, własne dane |
| **EMPLOYEE** | Pracownik uczelni (staff) | Admin endpoint'y (ograniczone do przypisanej edycji) |
| **ADMIN** | Administrator systemu | Wszystkie admin endpoint'y |

### Permission Classes

Projekt używa własnych permission classes w `users/permissions.py`:

- `IsStudent` - Tylko studenci
- `IsEmployee` - Tylko pracownicy
- `IsAdmin` - Tylko admini
- `IsObjectOwner` - Tylko właściciel obiektu
- `CanViewDocument` - Dostęp do dokumentów (student + staff)
- `IsDirectorOrCoordinator` - Dyrektor lub koordynator
- `IsDirectorOrAdministrativeCoordinator` - Dyrektor lub admin koordynator

---

## Konwencje & Standards

### HTTP Methods

| Method | Operacja | Endpoint |
|--------|----------|----------|
| **GET** | Pobranie danych | `/api/resource/` lub `/api/resource/{id}/` |
| **POST** | Stworzenie zasobu | `/api/resource/` |
| **PUT/PATCH** | Aktualizacja zasobu | `/api/resource/{id}/` |
| **DELETE** | Usunięcie zasobu | `/api/resource/{id}/` |

### HTTP Status Codes

| Status | Znaczenie | Kiedy |
|--------|-----------|-------|
| **200** | OK | GET, PATCH, PUT - powodzenie |
| **201** | Created | POST - zasób stworzony |
| **204** | No Content | DELETE - powodzenie |
| **400** | Bad Request | Błąd walidacji danych |
| **401** | Unauthorized | Brak/nieważny JWT token |
| **403** | Forbidden | Brak uprawnień |
| **404** | Not Found | Zasób nie znaleziony |
| **500** | Server Error | Błąd wewnętrzny serwera |

### Pagination

Endpoints zwracające listy obsługują **pagination**:

```
GET /api/resource/?page=2&page_size=20
```

**Response:**
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/resource/?page=3",
  "previous": "http://localhost:8000/api/resource/?page=1",
  "results": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" }
  ]
}
```

### Filtering & Searching

Niektóre endpoint'y obsługują **filtering** poprzez query parameters:

```
GET /api/enrollments/?status=ACCEPTED
GET /api/studies/?studies_name=Computer+Science
```

---

## Authentication Endpoints (Users)

### Base Path
```
/api/auth/
```

---

### 1. Register User

**Endpoint:**
```
POST /api/auth/register
```

**Authorization:** Public (nie wymaga JWT)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "Jan",
  "last_name": "Kowalski",
  "phone": "+48123456789"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "Jan",
  "last_name": "Kowalski",
  "phone": "+48123456789"
}
```

**Possible Errors:**
```json
{
  "email": ["Istnieje już użytkownik z tym adresem email."],
  "password": ["Hasło jest zbyt słabe."],
  "phone": ["Niepoprawny format telefonu."]
}
```

---

### 2. Login User

**Endpoint:**
```
POST /api/auth/login
```

**Authorization:** Public (nie wymaga JWT)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "Jan",
    "last_name": "Kowalski",
    "type": "STUDENT"
  }
}
```

**Possible Errors:**
```json
{
  "detail": "Niepoprawne dane logowania."
}
```

---

### 3. Refresh Access Token

**Endpoint:**
```
POST /api/auth/refresh
```

**Authorization:** Public (nie wymaga JWT)

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Possible Errors:**
```json
{
  "detail": "Token is invalid or expired"
}
```

---

## Studies Endpoints

### Base Path
```
/api/studies/
```

---

### 1. List All Public Study Editions

**Endpoint:**
```
GET /api/studies/editions/
```

**Authorization:** Public

**Query Parameters:**
```
?page=1&page_size=20
```

**Response (200 OK):**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "studies": {
        "id": 1,
        "name": "Computer Science"
      },
      "academic_year": "2025/2026",
      "start_date": "2025-10-01",
      "end_date": "2026-06-30",
      "is_public": true,
      "available_slots": 50,
      "remaining_slots": 23
    }
  ]
}
```

---

### 2. Retrieve Study Edition Details

**Endpoint:**
```
GET /api/studies/editions/{edition_pk}/
```

**Authorization:** Public

**Parameters:**
- `edition_pk` (path) - Study Edition ID

**Response (200 OK):**
```json
{
  "id": 1,
  "studies": {
    "id": 1,
    "name": "Computer Science",
    "description": "Program focused on software development..."
  },
  "academic_year": "2025/2026",
  "start_date": "2025-10-01",
  "end_date": "2026-06-30",
  "description": "Edition-specific details",
  "available_slots": 50,
  "remaining_slots": 23,
  "is_public": true
}
```

---

### 3. List Study Edition Staff

**Endpoint:**
```
GET /api/studies/editions/{edition_pk}/staff/
```

**Authorization:** Public

**Parameters:**
- `edition_pk` (path) - Study Edition ID

**Response (200 OK):**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": {
        "id": 2,
        "email": "director@university.edu",
        "first_name": "Anna",
        "last_name": "Nowak",
        "academic_title": "Prof. Dr"
      },
      "role": "STUDIES_DIRECTOR"
    }
  ]
}
```

---

### 4. List Study Edition Required Documents

**Endpoint:**
```
GET /api/studies/editions/{edition_pk}/documents/
```

**Authorization:** Public

**Parameters:**
- `edition_pk` (path) - Study Edition ID

**Response (200 OK):**
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "name": "High School Diploma",
      "description": "Original or certified copy",
      "required": true,
      "file_format": "PDF",
      "max_file_size": 10485760
    },
    {
      "id": 2,
      "name": "PESEL Certificate",
      "required": true,
      "file_format": "PDF"
    }
  ]
}
```

---

## Enrollments Endpoints

### Base Path
```
/api/enrollments/
```

---

### 1. Create Enrollment Form

**Endpoint:**
```
POST /api/enrollments/editions/{edition_pk}/
```

**Authorization:** Required (JWT) - Only STUDENT

**Parameters:**
- `edition_pk` (path) - Study Edition ID

**Request Body:**
```json
{
  "first_name": "Jan",
  "last_name": "Kowalski",
  "pesel": "99010112345",
  "date_of_birth": "1999-01-01",
  "education_year": "2024",
  "high_school_name": "XIV Liceum Ogólnokształcące",
  "address": {
    "street": "ul. Warszawska 10",
    "postal_code": "31-155",
    "city": "Kraków",
    "country": "Poland"
  },
  "email_contact": "jan@example.com",
  "phone_contact": "+48123456789"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "enrollment": 1,
  "user": 1,
  "studies_edition": 1,
  "status": "SUBMITTED",
  "enrollment_date": "2026-05-20T10:30:00Z"
}
```

**Possible Errors:**
```json
{
  "edition_pk": ["Recruitment for this edition has ended"],
  "pesel": ["Invalid PESEL format"],
  "email_contact": ["This email is already used"]
}
```

---

### 2. Retrieve/Update Enrollment Form

**Endpoint:**
```
GET /api/enrollments/editions/{edition_pk}/form/
PUT/PATCH /api/enrollments/editions/{edition_pk}/form/
```

**Authorization:** Required (JWT) - Only STUDENT

**GET Response (200 OK):**
```json
{
  "id": 1,
  "first_name": "Jan",
  "last_name": "Kowalski",
  "pesel": "99010112345",
  "date_of_birth": "1999-01-01",
  "education_year": "2024",
  "high_school_name": "XIV Liceum Ogólnokształcące",
  "address": {
    "id": 1,
    "street": "ul. Warszawska 10",
    "postal_code": "31-155",
    "city": "Kraków"
  },
  "email_contact": "jan@example.com",
  "phone_contact": "+48123456789",
  "status": "SUBMITTED"
}
```

---

### 3. List User's Enrollments

**Endpoint:**
```
GET /api/enrollments/
```

**Authorization:** Required (JWT) - Only STUDENT

**Query Parameters:**
```
?page=1&status=ACCEPTED
```

**Response (200 OK):**
```json
{
  "count": 2,
  "results": [
    {
      "id": 1,
      "studies_name": "Computer Science",
      "status": "ACCEPTED",
      "enrollment_date": "2026-05-20T10:30:00Z",
      "is_fully_paid": false,
      "missing_documents": 1
    }
  ]
}
```

---

### 4. Get Active Enrollments

**Endpoint:**
```
GET /api/enrollments/active/
```

**Authorization:** Required (JWT) - Only STUDENT

**Response (200 OK):**
```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "studies_name": "Computer Science",
      "status": "ACTIVE",
      "semester": 1,
      "year": 1
    }
  ]
}
```

---

### 5. Retrieve Specific Enrollment

**Endpoint:**
```
GET /api/enrollments/{enrollment_pk}/
```

**Authorization:** Required (JWT)

**Parameters:**
- `enrollment_pk` (path) - Enrollment ID

**Response (200 OK):**
```json
{
  "id": 1,
  "student_name": "Jan Kowalski",
  "studies_name": "Computer Science",
  "status": "ACCEPTED",
  "enrollment_date": "2026-05-20",
  "is_fully_paid": false,
  "system_status": "COMPLETE - READY FOR DECISION"
}
```

---

### 6. Upload Documents

**Endpoint:**
```
POST /api/enrollments/{enrollment_pk}/documents/
```

**Authorization:** Required (JWT) - Only STUDENT

**Parameters:**
- `enrollment_pk` (path) - Enrollment ID

**Request Body (multipart/form-data):**
```
studies_document_id: 1
file: <binary file data>
```

**Response (201 Created):**
```json
{
  "id": 1,
  "studies_document": 1,
  "document_name": "High School Diploma",
  "status": "PENDING_REVIEW",
  "uploaded_at": "2026-05-20T10:30:00Z"
}
```

---

### 7. Get Recruitment End Date

**Endpoint:**
```
GET /api/enrollments/{enrollment_pk}/recruitment-end-date/
```

**Authorization:** Required (JWT)

**Response (200 OK):**
```json
{
  "recruitment_end_date": "2026-06-30T23:59:59Z"
}
```

---

### 8. List Fees for Enrollment

**Endpoint:**
```
GET /api/enrollments/{enrollment_pk}/fees/
```

**Authorization:** Required (JWT) - STUDENT or STAFF

**Response (200 OK):**
```json
{
  "count": 2,
  "results": [
    {
      "id": 1,
      "title": "Tuition Fee - Semester 1",
      "amount": "5000.00",
      "due_date": "2025-09-30",
      "issued_date": "2025-09-01",
      "paid_date": "2025-09-15",
      "status": "paid"
    }
  ]
}
```

---

## Payments Endpoints

### Base Path
```
/api/payments/
```

---

### 1. Get Payment History

**Endpoint:**
```
GET /api/payments/history/
```

**Authorization:** Required (JWT) - Only STUDENT

**Query Parameters:**
```
?page=1&page_size=10
```

**Response (200 OK):**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "title": "Tuition Fee - Semester 1",
      "amount": "5000.00",
      "due_date": "2025-09-30",
      "issued_date": "2025-09-01",
      "paid_date": "2025-09-15",
      "studies_name": "Computer Science",
      "enrollment_id": 1,
      "payments": [
        {
          "id": 1,
          "payment_method": "BANK_TRANSFER",
          "reference_number": "REF-2025-001",
          "status": "SUCCESS"
        }
      ]
    }
  ]
}
```

---

### 2. Get Upcoming Payments

**Endpoint:**
```
GET /api/payments/upcoming/
```

**Authorization:** Required (JWT) - Only STUDENT

**Response (200 OK):**
```json
{
  "count": 2,
  "results": [
    {
      "id": 2,
      "title": "Tuition Fee - Semester 2",
      "amount": "5000.00",
      "due_date": "2026-01-31",
      "issued_date": "2025-12-15",
      "paid_date": null,
      "days_until_due": 45
    }
  ]
}
```

---

### 3. Create Payment (Initiate Payment Process)

**Endpoint:**
```
POST /api/payments/{fee_pk}/pay/
```

**Authorization:** Required (JWT) - Only STUDENT

**Parameters:**
- `fee_pk` (path) - Fee ID

**Request Body:**
```json
{
  "payment_method": "BANK_TRANSFER",
  "amount": "5000.00"
}
```

**Response (200 OK):**
```json
{
  "payment_id": 1,
  "status": "PENDING",
  "amount": "5000.00",
  "payment_method": "BANK_TRANSFER",
  "bank_account": {
    "iban": "PL61109010140000071219812874",
    "account_holder": "University Name",
    "reference": "REF-2026-001"
  },
  "payment_url": "https://payment-gateway.example.com/pay?token=xyz"
}
```

---

## Files Endpoints

### Base Path
```
/api/files/
```

---

### 1. Download File

**Endpoint:**
```
GET /api/files/{file_pk}/
```

**Authorization:** Required (JWT) - STUDENT (own files) or STAFF

**Parameters:**
- `file_pk` (path) - File ID

**Response (200 OK):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="document.pdf"
[Binary file data]
```

**Possible Errors:**
```json
{
  "detail": "Not found."
}
```

---

## Notifications Endpoints

### Base Path
```
/api/admin/notifications/
```

---

### 1. Send Notification (Admin Only)

**Endpoint:**
```
POST /api/admin/notifications/new/
```

**Authorization:** Required (JWT) - Only ADMIN

**Request Body:**
```json
{
  "recipient_ids": [1, 2, 3],
  "subject": "Important Update",
  "message": "Please review your enrollment status",
  "notification_type": "EMAIL",
  "priority": "HIGH"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "subject": "Important Update",
  "sent_at": "2026-05-20T10:30:00Z",
  "recipients_count": 3,
  "status": "SENT"
}
```

---

## Admin Endpoints

### Enrollments Admin

**Base Path:** `/api/admin/enrollments/`

#### List All Enrollments (Filtered for Staff)

```
GET /api/admin/enrollments/
```

**Authorization:** Required (JWT) - Only STAFF/ADMIN

**Query Parameters:**
```
?status=SUBMITTED&page=1&page_size=20
```

**Response (200 OK):**
```json
{
  "count": 45,
  "results": [
    {
      "id": 1,
      "student_name": "Jan Kowalski",
      "status": "SUBMITTED",
      "status_note": "Under review",
      "enrollment_date": "2026-05-20",
      "is_fully_paid": false,
      "missing_documents": true,
      "system_status": "INCOMPLETE - Missing Payment/Documents",
      "studies_name": "Computer Science",
      "edition_name": "2025/2026"
    }
  ]
}
```

#### Update Enrollment Status

```
PATCH /api/admin/enrollments/{enrollment_pk}/status/
```

**Authorization:** Required (JWT) - Only STAFF/ADMIN

**Request Body:**
```json
{
  "status": "ACCEPTED",
  "status_note": "All documents verified"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "status": "ACCEPTED",
  "status_note": "All documents verified",
  "updated_at": "2026-05-20T10:30:00Z"
}
```

---

### Studies Admin

**Base Path:** `/api/admin/studies/`

#### Create Study Edition

```
POST /api/admin/studies/editions/
```

**Authorization:** Required (JWT) - Only ADMIN

**Request Body:**
```json
{
  "studies_id": 1,
  "academic_year": "2026/2027",
  "start_date": "2026-10-01",
  "end_date": "2027-06-30",
  "available_slots": 50,
  "is_public": true,
  "recruitment_start": "2026-05-01",
  "recruitment_end": "2026-08-31"
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "studies": 1,
  "academic_year": "2026/2027",
  "start_date": "2026-10-01",
  "available_slots": 50
}
```

---

### Payments Admin

**Base Path:** `/api/admin/finances/`

#### List All Fees

```
GET /api/admin/finances/fees/
```

**Authorization:** Required (JWT) - Only FINANCE_COORDINATOR/ADMIN

**Query Parameters:**
```
?status=unpaid&studies_id=1&page=1
```

**Response (200 OK):**
```json
{
  "count": 120,
  "results": [
    {
      "id": 1,
      "title": "Tuition Fee",
      "amount": "5000.00",
      "due_date": "2026-01-31",
      "status": "unpaid",
      "student_name": "Jan Kowalski",
      "studies_name": "Computer Science",
      "academic_year": "2025/2026"
    }
  ]
}
```

#### List All Payments

```
GET /api/admin/finances/payments/
```

**Authorization:** Required (JWT) - Only FINANCE_COORDINATOR/ADMIN

**Response (200 OK):**
```json
{
  "count": 85,
  "results": [
    {
      "id": 1,
      "fee": 1,
      "fee_title": "Tuition Fee",
      "amount": "5000.00",
      "payment_method": "BANK_TRANSFER",
      "reference_number": "REF-2026-001",
      "status": "SUCCESS",
      "student_name": "Jan Kowalski"
    }
  ]
}
```

---

## Kody Błędów

### Standard Error Response Format

```json
{
  "detail": "Error message",
  "code": "ERROR_CODE",
  "errors": {
    "field_name": ["Error message for field"]
  }
}
```

### Najczęstsze Błędy

| Kod | Status | Znaczenie | Rozwiązanie |
|-----|--------|-----------|------------|
| `AUTHENTICATION_FAILED` | 401 | Nieważny/brakujący JWT token | Zaloguj się ponownie |
| `PERMISSION_DENIED` | 403 | Brak uprawnień do zasobu | Sprawdź typ użytkownika |
| `NOT_FOUND` | 404 | Zasób nie istnieje | Sprawdź ID zasobu |
| `VALIDATION_ERROR` | 400 | Błąd walidacji pól | Sprawdź formát danych |
| `TOKEN_EXPIRED` | 401 | Token wygasł | Użyj refresh token'u |
| `INVALID_PESEL` | 400 | PESEL ma niewłaściwy format | PESEL musi mieć 11 cyfr |
| `DUPLICATE_EMAIL` | 400 | Email już zarejestrowany | Użyj innego emailu |
| `RECRUITMENT_ENDED` | 400 | Rekrutacja dla tego kierunku zakończyła się | Wybierz inny kierunek |
| `INSUFFICIENT_PERMISSIONS` | 403 | Brak wymaganych uprawnień | Skontaktuj się z administracją |

---

## Rate Limiting & Throttling

Projekt nie ma obecnie wdrożonego rate limitingu, ale rekomendujemy go dodać w produkcji:

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',          # 100 requests/hour dla niezalogowanych
        'user': '1000/hour',         # 1000 requests/hour dla zalogowanych
        'login': '5/hour',           # 5 login attempts/hour
        'payment': '10/hour',        # 10 payment operations/hour
    }
}
```

**Headers Response (z rate limitingiem):**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1716202200
```

---

## Integracje Zewnętrzne

### 1. Payment Gateway Integration

**Aktualnie:** Endpoint `/api/payments/{fee_pk}/pay/` jest gotowy do integracji

**Wspierani Dostawcy (plany):**
- Stripe
- PayU
- Przelewy24
- GoPay

**Webhook dla potwierdzenia płatności:**
```
POST /api/payments/webhook/
```

Przychodzący event:
```json
{
  "event_type": "payment.success",
  "payment_id": 123,
  "fee_id": 456,
  "amount": "5000.00",
  "timestamp": "2026-05-20T10:30:00Z",
  "signature": "webhook_signature_hash"
}
```

### 2. Email Notifications

**Aktualnie:** Integracja z backend email settings

**Obsługiwane zdarzenia:**
- Potwierdzenie rejestracji
- Powiadomienie o statusie aplikacji
- Przypomnienie o płatności
- Powiadomienie o nowych dokumentach

**SMTP Configuration (settings.py):**
```python
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', True)
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@ledwo.edu')
```

### 3. Document Generation

**Library:** docxtpl (Word templates)

**Endpoint (Future):**
```
GET /api/enrollments/{enrollment_pk}/generate-certificate/
```

**Obsługiwane dokumenty:**
- Certificate of Enrollment
- Academic Transcript
- Degree Certificate

---

## Best Practices dla Frontend

### 1. JWT Token Management

```javascript
// Store tokens securely
localStorage.setItem('access_token', response.data.access);
localStorage.setItem('refresh_token', response.data.refresh);

// Add token to every request
axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

// Handle token expiration
interceptor.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refresh_token = localStorage.getItem('refresh_token');
      // POST /api/auth/refresh with refresh_token
      // Set new access_token
      // Retry original request
    }
  }
);
```

### 2. Error Handling

```javascript
try {
  const response = await axios.post('/api/enrollments/', formData);
  // Success
} catch (error) {
  if (error.response?.status === 400) {
    // Validation error - show field errors
    setErrors(error.response.data.errors);
  } else if (error.response?.status === 401) {
    // Redirect to login
    navigate('/login');
  } else if (error.response?.status === 403) {
    // Show permission error
  }
}
```

### 3. Pagination Implementation

```javascript
const [page, setPage] = useState(1);

const fetchEnrollments = async (pageNum) => {
  const response = await axios.get(
    `/api/enrollments/?page=${pageNum}&page_size=20`
  );
  setEnrollments(response.data.results);
  setTotalCount(response.data.count);
};
```

---

## Testing Endpoints

### Zainstaluj Postman lub Insomnia

1. **Insomnia:** https://insomnia.rest/
2. **Postman:** https://www.postman.com/

### Test Flow

```
1. Register User (POST /api/auth/register)
2. Login User (POST /api/auth/login) → Get tokens
3. List Studies (GET /api/studies/editions)
4. Create Enrollment (POST /api/enrollments/editions/{id}/)
5. Upload Documents (POST /api/enrollments/{id}/documents/)
6. Check Payment Status (GET /api/payments/upcoming/)
```

### cURL Examples

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Pass123!"}'

# List Studies (z Access Token)
curl -X GET http://localhost:8000/api/studies/editions/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

**Ostatnia aktualizacja:** 20.05.2026

**Wersja API:** 1.0

**Status:** ✅ Kompletny - Production-Ready
