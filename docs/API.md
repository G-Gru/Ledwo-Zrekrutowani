# API Reference

**Base URL:** `http://localhost:8000` (dev) | konfigurowany przez `VITE_API_URL`

Endpointy chronione przyjmują nagłówek:
```
Authorization: Bearer {access_token}
```

Błędy zwracają JSON: `{ "detail": "..." }` lub słownik z kluczem pola i listą błędów.  
Wszystkie komunikaty błędów są po polsku.

---

## Autentykacja — `/api/auth/`

### `POST /api/auth/register/`
Rejestracja nowego konta (kandydata).

### `POST /api/auth/login/`
Logowanie. Odpowiedź:
```json
{
  "refresh": "...",
  "access": "...",
  "id": 1,
  "email": "jan@example.com",
  "phone": "123456789",
  "first_name": "Jan",
  "last_name": "Kowalski",
  "type": "...",
  "role": "CANDIDATE"
}
```
Email jest używany jako login (nie username).

### `POST /api/auth/refresh/`
Odświeżenie tokena. Body: `{ "refresh": "..." }` → nowy `access`.

### `POST /api/auth/change-password/`
Zmiana hasła zalogowanego użytkownika.

---

## Kierunki studiów — `/api/studies/`

### `GET /api/studies/editions/{id}/documents/`
Lista wymaganych dokumentów dla edycji (kandydaci pobierają przed wypełnieniem formularza).

---

## Rekrutacja (kandydat) — `/api/enrollments/`

Wymagają: zalogowanego użytkownika.

### `GET /api/enrollments/editions/{id}/form/`
Pobiera zapisany formularz dla danej edycji. Zwraca `404` jeśli kandydat nie ma jeszcze zgłoszenia.

### `GET /api/enrollments/form/previous/`
Dane z poprzedniej aplikacji kandydata (do prefillowania formularza). Zwraca `404` jeśli brak historii.  
Uwaga: pole `enrollment` w odpowiedzi jest czyszczone — zawiera tylko dane formularza.

### `POST /api/enrollments/editions/{id}/`
Tworzy nowe zgłoszenie dla edycji. Payload jako `multipart/form-data`:

| Pole | Typ | Opis |
|------|-----|------|
| `residential_address` | int | ID adresu zamieszkania |
| `registered_address` | int | ID adresu zameldowania |
| `files_ids[]` | int (powtórzone) | ID typu dokumentu (`StudiesDocument`) |
| `files_uploads[]` | file (powtórzone) | Plik binarny dokumentu |

Przed wysłaniem formularz musi rozwiązać lub utworzyć adresy przez `/api/enrollments/addresses/`.

### `PUT /api/enrollments/editions/{id}/form/`
Aktualizuje istniejący formularz zgłoszenia (ten sam format co POST).

### `GET /api/enrollments/addresses/`
Lista adresów zapisanych przez użytkownika.

### `POST /api/enrollments/addresses/`
Dodanie nowego adresu.

### `GET /api/enrollments/addresses/{id}/`
Szczegóły adresu (używane podczas ładowania formularza do rozwiązania zapisanych ID → pola tekstowe).

### `DELETE /api/enrollments/addresses/{id}/`
Usunięcie adresu.

### `GET /api/enrollments/{id}/fees/`
Opłaty powiązane ze zgłoszeniem. Używane do sprawdzenia czy etap płatności jest zakończony.

---

## Płatności (kandydat) — `/api/payments/`

Wymagają: `IsAuthenticated` + `IsStudent`

### `GET /api/payments/upcoming/`
Nieopłacone opłaty (`paid_date = null`). Status obliczany po stronie frontendu:
- `"Oczekuje"` — termin jeszcze nie minął
- `"Po terminie ostatecznym"` — minął `due_date`

### `GET /api/payments/history/`
Opłacone opłaty (`paid_date != null`). Status zawsze `"Zaksięgowano"`.

### `POST /api/payments/{fee_pk}/pay/`
Opłaca wskazaną opłatę. Zabezpieczone przed podwójną płatnością (sprawdza `paid_date` przed zapisem).

---

## Rekrutacja (admin) — `/api/admin/enrollments/`

Wymagają: `IsEmployee`

`AdminEnrollmentViewSet` to `ReadOnlyModelViewSet` z dodatkowymi akcjami.  
Lista (`/`) używa `AdminEnrollmentSerializer`; szczegóły (`/{id}/`) używają `AdminEnrollmentDetailSerializer` (dodaje `form_data`, `documents`, `payments`).

### `GET /api/admin/enrollments/`
Lista wszystkich zgłoszeń. Nie zwraca statusu `DRAFT`.

### `GET /api/admin/enrollments/{id}/`
Szczegóły zgłoszenia wraz z danymi formularza, dokumentami i płatnościami.

### `POST /api/admin/enrollments/{id}/accept/`
Akceptuje zgłoszenie. Opcjonalne body:
```json
{ "status_note": "Dokumenty kompletne." }
```

### `POST /api/admin/enrollments/{id}/reject/`
Odrzuca zgłoszenie. Opcjonalne body:
```json
{ "status_note": "Brak matury." }
```
`status_note` — max 200 znaków.

### `POST /api/admin/enrollments/{id}/send-payment-reminder/`
Wysyła przypomnienie o płatności (email przez Celery).

### `POST /api/admin/enrollments/{id}/documents/{doc_id}/accept/`
Akceptuje dokument kandydata.

### `POST /api/admin/enrollments/{id}/documents/{doc_id}/reject/`
Odrzuca dokument kandydata.

### `GET /api/admin/enrollments/recruitment-stats/`
Statystyki rekrutacji (liczby zgłoszeń według statusu, edycji itp.).

### `GET /api/admin/enrollments/usos-export/`
Eksport danych do formatu USOS.

---

## Finanse (admin) — `/api/admin/finances/`

Wymagają: `IsEmployee`

### `GET /api/admin/finances/fees/`
Lista wszystkich opłat z informacjami o zgłoszeniach.

### `GET /api/admin/finances/transactions/`
Historia wszystkich transakcji płatności.

---

## Powiadomienia (admin) — `/api/admin/notifications/`

### `GET /api/admin/notifications/`
Historia wysłanych powiadomień email.

---

## Pliki medialne

### `GET /media/{ścieżka}`
Serwuje przesłane pliki. W trybie deweloperskim obsługiwane przez Django (`DEBUG=True`).  
W produkcji nginx musi mapować `/media/` na katalog `MEDIA_ROOT`.

---

## Kody HTTP

| Kod | Znaczenie |
|-----|-----------|
| 200 | OK |
| 201 | Zasób utworzony |
| 204 | Sukces bez treści (DELETE) |
| 400 | Błędne dane wejściowe |
| 401 | Brak lub nieprawidłowy token |
| 403 | Brak uprawnień |
| 404 | Zasób nie istnieje |
| 500 | Błąd serwera |
