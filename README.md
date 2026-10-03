# 404 Brain Not Found

## Uruchomienie w Dockerze

Wymagany Docker z Compose v2.22+. Wszystkie komendy uruchamiamy z katalogu `website/`.

```bash
git clone git@github.com:rtekdev/404-Brain-Not-Found.git
cd 404-Brain-Not-Found/website
```

### Tryb deweloperski (hot reload)

```bash
docker compose up --build --watch
```

Otwórz http://localhost:3000. Zmiany w plikach są synchronizowane do kontenera, a Next.js przeładowuje stronę. Zmiana `package.json` przebudowuje obraz.

Inny port: `PORT=3001 docker compose up --build --watch`.

### Tryb produkcyjny (Next.js standalone + nginx)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Otwórz http://localhost (port 80, inny przez `PORT=8080`). Zatrzymanie: `docker compose -f docker-compose.prod.yml down`.

## Uruchomienie bez Dockera

Wymagany Node.js 20.9+.

```bash
cd website
npm install
npm run dev
```

Otwórz http://localhost:3000.

## Dane miasta

Opcjonalnie, odświeżenie danych miasta z OpenStreetMap (lokalnie, wymaga `npm install`):

```bash
npm run build-city
```
