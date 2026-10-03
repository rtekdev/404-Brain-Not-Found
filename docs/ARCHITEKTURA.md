# ARCHITEKTURA — 404 Brain Not Found („SWIMM")

Stan na: 2026-10-03

## W jednym akapicie

Aplikacja webowa na Next.js 16 (App Router, React 19, TypeScript) w katalogu `website/`. Całość
działa w przeglądarce: mapa MapLibre GL na podkładzie CARTO, dane miasta ze statycznych plików
GeoJSON, zgłoszenia i pomiary zasobów generowane w kliencie (dane pokazowe, bez backendu). Uruchomienie:
`npm run dev` albo `docker compose up --build --watch` w `website/`; produkcja to obraz Next.js
`standalone` za nginx (`docker-compose.prod.yml`). Testy jednostkowe: `npm test` (Vitest).

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
| Ranking dzielnic | `website/lib/sectors.ts` | liczy otwarte i krytyczne zgłoszenia dzielnic i układa je od najpilniejszej |
| Przekierowania | `website/lib/transfer.ts` | wycenia przeniesienie zasobu między sektorami i proponuje najlepsze trasy |
| Dane pokazowe | `website/lib/demo-data.ts`, `website/public/data/krakow/` | dostarcza kamery, zgłoszenia, obiekty z licznikami i geometrię Krakowa |
| Onboarding miasta | `website/scripts/build-city.mjs` | pobiera z OpenStreetMap granicę, dzielnice (jako sektory) i osiedla miasta |

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

Wszystko żyje w pamięci przeglądarki i znika po odświeżeniu. Encje: `Report` (zgłoszenie),
`Camera`, `Asset` (obiekt z opcjonalnymi licznikami `meters`), `AccessPoint`, `Sector`
(z GeoJSON), `Transfer` (przekierowanie). Odczyty sektorów wynikają z profilu sektora (liczba
mieszkańców, straty, rezerwy) i obiektów produkujących w jego granicach.

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

- **Backendu i bazy.** Etap 1 to demo w przeglądarce; zapis zgłoszeń na serwerze jest w planie (etap 2).
- **Prawdziwych liczników.** Pomiary zasobów są pokazowe i deterministyczne w czasie (`live`).
- **Modelu językowego.** Priorytet, klasyfikacja i wnioski to reguły — podmiana w etapie 2.
- **Testów interfejsu.** Testy jednostkowe obejmują logikę w `lib/`; komponenty sprawdzane ręcznie w przeglądarce.
