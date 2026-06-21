# Ledwo Zrekrutowani

System rekrutacyjny na studia podyplomowe. Kandydaci składają wnioski, przesyłają dokumenty i opłacają wpisowe. Pracownicy uczelni zarządzają rekrutacją i przeglądają zgłoszenia.

## Uruchomienie

```bash
docker compose up --build
```

| Serwis | URL |
|--------|-----|
| Frontend JS | http://localhost:5173 |
| Frontend TS | http://localhost:5174 |
| Backend API | http://localhost:8000 |

Po pierwszym uruchomieniu zainicjalizuj bazę danych:

```bash
docker compose exec django python manage.py migrate
docker compose exec django python manage.py populate_db_demo
```

## Stack

**Backend:** Django 6, Django REST Framework, PostgreSQL, Celery + Redis  
**Frontend JS** (`frontend/`): React 19, JavaScript, TailwindCSS 4, Vite  
**Frontend TS** (`frontend-tsx/`): React 19, TypeScript, TailwindCSS 4, Vite, Radix UI

## Dokumentacja

Szczegółowa dokumentacja w katalogu [`docs/`](docs/README.md):

- [Architektura systemu](docs/ARCHITEKTURA.md)
- [API Reference](docs/API.md)
- [Role i uprawnienia](docs/ROLE_I_UPRAWNIENIA.md)
- [Instalacja i konfiguracja](docs/INSTALACJA.md)
