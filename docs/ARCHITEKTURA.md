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
| Przyjęcie zgłoszeń | `website/lib/intake.ts`, `components/IntakeSimulator.tsx` | zamienia wiadomość (Telegram, SMS) albo transkrypcję rozmowy w szkic zgłoszenia: kategoria, tytuł, osiedle, dzielnica |
| Alarmy i plan reagowania | `website/lib/response.ts`, `components/AlertCenter.tsx`, `components/AlarmButton.tsx` | wybiera najważniejsze nowe zgłoszenie do animacji, układa skrót, status i kroki reagowania (reguły w miejsce modelu) |
| Ranking dzielnic | `website/lib/sectors.ts` | liczy otwarte i krytyczne zgłoszenia dzielnic i układa je od najpilniejszej |
| Przekierowania | `website/lib/transfer.ts` | wycenia przeniesienie zasobu między sektorami i proponuje najlepsze trasy |
| Baza danych | `website/database/01-schema.sql`, `02-city.sql`, `03-seed.sql` | definiuje schemat i wczytuje miasto oraz dane startowe przy pierwszym starcie Postgresa |
| Dostęp do danych | `website/lib/city-repo.ts`, `lib/rows.ts`, `app/centrum/actions.ts` | wczytuje dane miasta, zapisuje zgłoszenia (z dzielnicą wyliczoną z geometrii) i zmiany statusu |
| Symulacje | `website/lib/simulation.ts` | trzyma skrypty pokazu: zdarzenia kamer, Telegram, telefon, dzielnica pokazowa |
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
