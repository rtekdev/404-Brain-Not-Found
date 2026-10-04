# ARCHITEKTURA — 404 Brain Not Found („SWIMM")

Stan na: 2026-10-03

## W jednym akapicie

Aplikacja webowa na Next.js 16 (App Router, React 19, TypeScript) w katalogu `website/` z bazą
PostgreSQL 17 (`pg`). Strona `/centrum` pobiera po stronie serwera wszystkie dane miasta z bazy
(granica, dzielnice z profilami zasobów, osiedla, zgłoszenia, kamery, obiekty) i przekazuje je mapie
MapLibre GL w przeglądarce; nowe zgłoszenia i zmiany statusu zapisują akcje serwera. Uruchomienie:
`docker compose up -d --build` w `website/` — jeden `Dockerfile` (Next.js standalone) i jeden
`docker-compose.yml` z usługami `web` i `db`. Testy: `npm test` (Vitest);
z `DATABASE_URL` uruchamia się też test integracyjny na bazie.

## Mapa modułów

| Moduł | Katalog / plik | Odpowiedzialność |
|---|---|---|
| Strona główna | `website/app/page.tsx`, `components/HelpChat.tsx` | landing dla mieszkańców: pełna nazwa, klikalny telefon, SMS / Telegram / 112 i czat z asystentem AI |
| Centrum | `website/app/centrum/` | panel dla urzędu — ładuje mapę po stronie klienta (trasa `/map` to stary duplikat) |
| Czat AI | `website/app/api/chat/route.ts` | `POST /api/chat` — rozmowa z modelem Claude (Anthropic SDK) z promptem o kanałach kontaktu z `lib/meta.ts` |
| Ekran mapy | `website/components/CityMapApp.tsx` | trzyma stan ekranu (zgłoszenia, widok, miara, przekierowania) i łączy mapę z panelem |
| Mapa | `website/components/map/` | rysuje mapę, sektory, znaczniki HTML i animowane przepływy zasobów |
| Panel boczny | `website/components/SidePanel.tsx`, `EventsPanel.tsx`, `ResourcesPanel.tsx`, `TransferPlanner.tsx` | przełącza widok Zgłoszenia / Zasoby i pokazuje listy, szczegóły i planer przekierowań |
| Zgłoszenia | `website/lib/priority.ts`, `classify.ts` | nadaje zgłoszeniom priorytet i kategorię regułami zastępującymi model |
| Zasoby | `website/lib/resources.ts` | liczy odczyty miar (energia, woda, odpady, ciepło) per obiekt i sektor oraz wnioski |
| Lista zgłoszeń | `website/app/reports/`, `lib/reports.ts`, `lib/report-event.ts`, `app/api/reports/` | `/reports` — lista od najpilniejszego z filtrem miast, odświeżana na żywo (trigger `NOTIFY new_report` → `LISTEN` → SSE `/api/reports/stream`; ten sam strumień zasila mapę `/centrum` w `CityMapApp`), szczegóły, formularz nowego zgłoszenia (położenie z wybranej kamery albo wpisane; dzielnica z geometrii) |
| Alarmy i plan reagowania | `website/lib/response.ts`, `components/AlertCenter.tsx`, `components/AlarmButton.tsx`, `components/ClipPreview.tsx` | wybiera najważniejsze nowe zgłoszenie do animacji, układa skrót, status i kroki reagowania (reguły w miejsce modelu); nagranie z kamery (`public/clips/<kamera>.mp4`) z powiększeniem i paskiem klatek |
| Widok jednostki i pojazdy | `website/components/EventsPanel.tsx` (`UnitActions`), `lib/dispatch.ts`, `components/map/VehicleOverlay.tsx` | podgląd jako jednostka (przyjęcie, zakończenie, przekazanie dalej); dobór pojazdu do zgłoszenia i animacja przejazdu trasą z OSRM (pokaz, bez zapisu) |
| Ranking dzielnic | `website/lib/sectors.ts` | liczy otwarte i krytyczne zgłoszenia dzielnic i układa je od najpilniejszej |
| Przekierowania | `website/lib/transfer.ts` | wycenia przeniesienie zasobu między sektorami i proponuje najlepsze trasy |
| Baza danych | `website/database/01-schema.sql`, `02-city.sql`, `03-seed.sql`, `04-kielce.sql` | definiuje schemat i wczytuje miasta (Kraków, Kielce) oraz dane startowe przy pierwszym starcie Postgresa |
| Dostęp do danych | `website/lib/city-repo.ts`, `lib/rows.ts`, `app/centrum/actions.ts` | wczytuje listę miast i dane wybranego miasta (`/centrum?miasto=`; obiekty należą do miasta przez sektor), zapisuje zgłoszenia (z dzielnicą wyliczoną z geometrii) i zmiany statusu |
| Symulacje | `website/lib/simulation.ts` | trzyma skrypt alarmu na pokaz (Kraków) i dzielnicę pokazową |
| Onboarding miasta | `website/scripts/build-city.mjs` | pobiera z OpenStreetMap granicę, dzielnice (jako sektory) i osiedla i zapisuje je jako `database/02-city.sql` |

## Przepływ — przekierowanie zasobu między sektorami

1. Dyspozytor w widoku Zasoby wybiera miarę; `CityMapApp` co 1,5 s przelicza odczyty sektorów
   (`sectorReading`) — to odczyty **bazowe**.
2. „Zaplanuj" albo kliknięcie proponowanej trasy (`suggest`) tworzy szkic `{from, to, pct}`.
3. `TransferPlanner` wycenia szkic (`estimate`) na odczytach bazowych: straty przesyłu z odległości,
   zysk w złotych, ostrzeżenie o niedoborze źródła. Mapa rysuje trasę jako podgląd.
4. „Zastosuj" dopisuje przekierowanie do listy; `applyTransfers` nakłada wszystkie przekierowania
   miary na odczyty bazowe i z tego powstają odczyty pokazywane w panelu, na mapie i na wykresie.

## Zależności i kierunek

`components/*` → `lib/*` → `lib/types.ts`. Moduły w `lib/` nie importują Reacta ani MapLibre —
dzięki temu da się je testować w Node bez przeglądarki. `transfer.ts` zależy od `resources.ts`,
nigdy odwrotnie. Wycena przekierowań zawsze liczy od odczytów bazowych, żeby kolejność i liczba
przekierowań nie zmieniała ich wyceny wzajemnie.

## Dane

PostgreSQL, tabele: `city` (granica jako GeoJSON w JSONB), `sectors` (dzielnice: geometria JSONB +
profil zasobów: mieszkańcy, straty wody, rezerwa, zdolność odbioru odpadów, PV), `places` (osiedla),
`reports`, `cameras` (`webcam_id` → podgląd WebCamera.pl), `assets` (liczniki w `meters` JSONB),
`access_points`. Każdy wiersz z położeniem ma kolumnę `sector` (klucz obcy do `sectors`), wyliczaną
przy zapisie z geometrii (turf, bez PostGIS). Identyfikatory zgłoszeń `Z-<nr>` z sekwencji
`report_id_seq`. W pamięci przeglądarki zostają tylko przekierowania (`Transfer`) i odczyty „na żywo"
liczone z profili dzielnic. Odtworzenie bazy od zera: `docker compose down -v && docker compose up`.

## Integracje zewnętrzne

| Usługa | Po co | Gdzie w kodzie | Co się dzieje, gdy padnie |
|---|---|---|---|
| CARTO Dark Matter | podkład mapy | `components/map/MapView.tsx` | brak ulic i etykiet; granice, sektory i znaczniki dalej działają |
| WebCamera.pl | obraz na żywo 6 kamer w Starym Mieście i na Kazimierzu (iframe `player.webcamera.pl`) | `lib/demo-data.ts`, `components/CameraFeed.tsx` | pusty podgląd tej kamery; reszta aplikacji działa, pozostałe kamery mają podgląd stylizowany |
| Anthropic API (Claude Opus 5.5, `effort: low`, fallback serwerowy) | odpowiedzi czatu na stronie głównej | `app/api/chat/route.ts`; klucz `ANTHROPIC_API_KEY` w `website/.env` | czat odpowiada „chwilowo niedostępny" i podaje numer telefonu; reszta strony działa |
| OSRM (router.project-osrm.org) | trasa przejazdu pojazdu do zgłoszenia | `components/map/VehicleOverlay.tsx` | po 2,5 s pojazd jedzie łukiem zamiast ulicami; reszta działa |
| OpenStreetMap (Nominatim, Overpass) | granica, dzielnice i osiedla przy onboardingu miasta | `scripts/build-city.mjs` | nie da się odświeżyć danych miasta; aplikacja używa zapisanych plików GeoJSON (Overpass ma serwery zapasowe) |

## Decyzje techniczne, które kształtują ten układ

- [D-01](DECYZJE.md) — sektory to dzielnice Krakowa z OSM; `build-city.mjs` pobiera je z Nominatim
  (1 zapytanie/s), a test `lib/demo-data.test.ts` pilnuje, by dane pokazowe leżały w dzielnicach.

## Czego tu świadomie nie ma

- **PostGIS.** Przynależność do dzielnicy liczy aplikacja (turf) — 18 poligonów nie uzasadnia rozszerzenia bazy.
- **Jednostek w bazie.** Jednostki miejskie (`UNITS`), kategorie i źródła to konfiguracja w kodzie (`lib/meta.ts`); w bazie pilnują ich ograniczenia CHECK.
- **Zapisu przekierowań.** Przekierowania zasobów żyją w sesji dyspozytora i znikają po odświeżeniu.
- **Prawdziwych liczników.** Pomiary zasobów są pokazowe i deterministyczne w czasie (`live`).
- **Modelu językowego.** Priorytet, klasyfikacja i wnioski to reguły — podmiana w etapie 2.
- **Testów interfejsu.** Testy jednostkowe obejmują logikę w `lib/`; komponenty sprawdzane ręcznie w przeglądarce.
