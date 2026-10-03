# 404 Brain Not Found

## Uruchomienie w Dockerze

Wymagany Docker z Compose v2. Jedna komenda stawia aplikację (Next.js, build produkcyjny) i bazę PostgreSQL:

```bash
git clone git@github.com:rtekdev/404-Brain-Not-Found.git
cd 404-Brain-Not-Found/website
docker compose up -d --build
```

Otwórz http://localhost:3000 (mapa dyspozytora: http://localhost:3000/centrum). Inny port: `PORT=8080 docker compose up -d --build`.

- Baza przy pierwszym starcie wczytuje `database/*.sql`: schemat, Kraków (dzielnice, osiedla) i dane startowe.
- Po zmianach w kodzie: `docker compose up -d --build` (przebudowuje obraz aplikacji).
- Baza od zera (np. przed prezentacją): `docker compose down -v`, potem `docker compose up -d --build`.
- Zatrzymanie: `docker compose down`.

Testy: `npm test`; z bazą także test integracyjny — w Git Bash: `DATABASE_URL=postgres://postgres:pass@localhost:5432/reports npm test`.

## Uruchomienie bez Dockera

Wymagany Node.js 20.9+ i baza z Dockera (`docker compose up -d db`).

```bash
cd website
npm install
DATABASE_URL=postgres://postgres:pass@localhost:5432/reports npm run dev
```

Otwórz http://localhost:3000 — tryb deweloperski z przeładowaniem po zmianach.

## Dane miasta

Opcjonalnie, odświeżenie danych miasta z OpenStreetMap (lokalnie, wymaga `npm install`):

```bash
npm run build-city
```
