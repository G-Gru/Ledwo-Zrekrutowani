# Ledwo Zrekrutowani — Dokumentacja

System rekrutacyjny na studia. Umożliwia kandydatom składanie wniosków, przesyłanie dokumentów i opłacanie wpisowego. Pracownicy uczelni zarządzają rekrutacją, przeglądają zgłoszenia, akceptują dokumenty i obsługują płatności.

## Dokumenty

| Plik | Opis |
|------|------|
| [ARCHITEKTURA.md](ARCHITEKTURA.md) | Struktura systemu, aplikacje backendowe, modele danych, przepływ komunikacji |
| [API.md](API.md) | Endpointy REST API pogrupowane według domeny |
| [ROLE_I_UPRAWNIENIA.md](ROLE_I_UPRAWNIENIA.md) | Role użytkowników i macierz dostępu do tras i API |
| [INSTALACJA.md](INSTALACJA.md) | Uruchomienie lokalne i Docker |

## Stack technologiczny

| Warstwa | Technologie |
|---------|-------------|
| Frontend JS (`frontend/`) | React 19, JavaScript, Vite 8, TailwindCSS 4 — port 5173 |
| Frontend TS (`frontend-tsx/`) | React 19, TypeScript, Vite 5, TailwindCSS 4, Radix UI, lucide-react — port 5174 |
| Backend | Django 6.0.3, Django REST Framework 3.17.1, SimpleJWT 5.5.1 |
| Baza danych | PostgreSQL |
| Kolejka zadań | Celery 5.6.3 + Redis 7.4.0 |
| Konteneryzacja | Docker + Docker Compose |

## Struktura repozytorium

```
Ledwo-Zrekrutowani/
├── backend/
│   ├── core/          # konfiguracja projektu Django
│   ├── users/         # autentykacja i pracownicy
│   ├── studies/       # kierunki i edycje studiów
│   ├── enrollments/   # wnioski rekrutacyjne i dokumenty
│   ├── payments/      # opłaty i płatności
│   ├── files/         # upload plików
│   ├── notifications/ # powiadomienia email
│   ├── manage.py
│   └── requirements.txt
├── frontend/          # frontend JavaScript (JSX), port 5173
│   ├── src/
│   │   ├── api/       # klient HTTP (client.js)
│   │   ├── services/  # serverApi.js — wszystkie endpointy, authService.js
│   │   ├── hooks/     # useAuth.js
│   │   ├── pages/     # strony aplikacji (.jsx)
│   │   └── components/
│   └── package.json
├── frontend-tsx/      # frontend TypeScript (TSX), port 5174
│   ├── src/
│   │   ├── api/       # klient HTTP (client.ts)
│   │   ├── services/  # api.ts — wszystkie endpointy, auth.ts
│   │   ├── context/   # AuthContext
│   │   ├── hooks/
│   │   ├── pages/     # strony aplikacji (.tsx)
│   │   ├── components/
│   │   │   ├── ui/    # design system (Button, Card, Table, Modal, ...)
│   │   │   └── layout/# Header, AdminSidebar, AccountSidebar
│   │   └── types/
│   └── package.json
├── docs/
└── docker-compose.yml
```
