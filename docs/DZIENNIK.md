# DZIENNIK — 404 Brain Not Found

## Stan otwartych ryzyk

| # | Ryzyko | Poziom | Status | Mitygacja |
|---|---|---|---|---|
| R1 | Konflikty przy łączeniu z pracą Gabriela — gałąź `feature/mapa-glowna` zmienia jego `Navbar.tsx`, `layout.tsx`, `globals.css`, `page.tsx`, `map/page.tsx` | średni | ZAMKNIĘTE | Gałęzie `feature/mapa-glowna` i `feture/docker` połączone z `main` 2026-10-03 (jeden konflikt w `page.tsx` rozstrzygnięty na korzyść mapy). Zmierzone: 2026-10-03 |
| R2 | Termin hackathonu — zgłoszenie do 4.10 23:00, zmiany po terminie nie są oceniane | wysoki | OTWARTE | Plan etapów w `docs/PLAN.md`; etap 1 (mapa) gotowy lokalnie. Zmierzone: 2026-10-03 (adopcja) |
| R3 | „AI" w demo to na razie reguły słów kluczowych, nie model — jury ocenia zrozumienie rozwiązania | średni | OTWARTE | Kod klasyfikacji i priorytetu jest wyjaśnialny i opisany jako zastępstwo modelu; podmiana na model w etapie 2 planu. Zmierzone: 2026-10-03 (adopcja) |

## Czeka na człowieka

- **Dane do prawdziwego bota Telegram (token @BotFather) i numeru telefonu (dostawca, numer, klucze)** — warianty B i C z `docs/SCENARIUSZ_DEMO.md` · 2026-10-03 · [wpis 2026-10-03 — Zgłoszenia per dzielnica, Telegram i telefon](#2026-10-03--zgłoszenia-per-dzielnica-telegram-i-telefon)

- **Podać klucz `ANTHROPIC_API_KEY` (do `website/.env`) i prawdziwe numery kontaktowe** · 2026-10-03 · [wpis 2026-10-03 — Landing kontaktowy](#2026-10-03--landing-kontaktowy-z-czatem-ai-nazwa-swimm)

- **Potwierdzić u organizatora godzinę startu (regulamin: „11:00 PM 3.10") i platformę zgłoszeń (HackTribe vs Challenge Rocket)** · 2026-10-03 · [wpis 2026-10-03 — Adopcja RelAI](#2026-10-03--adopcja-relai-wpis-zerowy)
- **Doprecyzować, o który model chodzi pod nazwą „Jev" z koncepcji** · 2026-10-03 · [wpis 2026-10-03 — Adopcja RelAI](#2026-10-03--adopcja-relai-wpis-zerowy)

## Wpisy

### 2026-10-04 — Naprawa builda po merge'u i odporność serwera

Autor: Claude (Opus) + rtek

**Zrobione:**
- Merge `436cd5c` zepsuł `app/reports/page.tsx`: pod nową stroną doklejona stara wersja („temp css changes"
  z `fix/reports`, cyjan, „Available Reports") i podwójny import `Link` — build nie przechodził. Przywrócona
  wersja w wyglądzie aplikacji.
- `lib/db.ts`: obsługa `error` puli (zerwane bezczynne połączenie przy restarcie bazy kończyło proces Node),
  literówka `NODE_ENV_TYPE` → `NODE_ENV`.
- `/api/chat`: klient Anthropic tworzony przy pierwszym zapytaniu (nie przy ładowaniu modułu).
- `app/error.tsx`: przy awarii bazy komunikat w wyglądzie aplikacji z telefonem i „Spróbuj ponownie"
  zamiast pustego ekranu. `/reports/[id]`: zły zapis adresu → 404.
- ESLint pomija kopiowany worker MapLibre (`public/maplibre/**`) — 1125 ostrzeżeń mniej.

**Zweryfikowane — jak dokładnie:**
- `tsc`, `eslint .` (0 błędów, 0 ostrzeżeń), `npm test` z bazą 69/69, `npm run build` — czyste.
- Obraz Dockera: wszystkie trasy 200 (nieznane zgłoszenie → strona 404), czat bez klucza → 503 z komunikatem,
  zły JSON → 400. Baza zatrzymana → strona błędu; baza włączona → „Spróbuj ponownie" wraca do mapy;
  kontener bez restartu (0).

**Świadomie odłożone:**
- Karta otwarta przed wdrożeniem dalej odpytuje stare akcje serwera („Failed to find Server Action" w
  logach, bez skutków dla serwera) — po wdrożeniu odświeżyć otwarte karty.
- Czat odpowiada dopiero po ustawieniu `ANTHROPIC_API_KEY`.

### 2026-10-03 — Drugie miasto (Kielce), lista zgłoszeń w wyglądzie mapy

Autor: Claude (Opus) + rtek

**Zrobione:**
- Kielce jako drugie miasto (D-03): `database/04-kielce.sql` z danych odzyskanych z git (granica,
  9 sektorów S01–S09, 109 osiedli, kamery KC, zgłoszenia Z-2xxx, obiekty KA, dostępność KP).
  Przełącznik w górnym pasku (`/centrum?miasto=`), a po oddaleniu mapy (zoom < 9,5) drugie miasto
  podświetla się i przełącza po kliknięciu. Obiekty należą do miasta przez sektor; centrala per miasto.
- Wycięte pokazy kanałów (decyzja człowieka): przycisk „Symuluj" z panelu zgłoszeń, okno Telegrama
  i telefonu (`IntakeSimulator`, `lib/intake.ts` z `parseMessage`), zdarzenia kamer i ich testy;
  `SCENARIUSZ_DEMO.md` skrócony do 9 kroków (bez kroków Telegram/telefon). Zostaje „Symuluj alarm"
  w górnym pasku — z Kielc przełącza na Kraków. `parseMessage` do odzyskania z git przy prawdziwym kanale.
- `/reports`, `/reports/[id]`, `/reports/add` w wyglądzie panelu (tokeny, ikony, kolory priorytetu).
  Naprawione: lista dostawała surowe wiersze bazy (brak pozycji i czasu), a zgłoszenie z formularza nie
  miało sektora, więc nie trafiało na mapę.
- Strona główna wyśrodkowana; czat zwinięty do jednej linii „Opisz swój problem, pomogę", po kliknięciu
  rozwija się płynnie (wysokość okna dopasowana, pole wpisywania zostaje na ekranie).
- Responsywność na telefonie (360 px): górny pasek bez przepełnienia („Symuluj alarm" jako ikona),
  numer w jednej linii, SMS / Telegram / 112 w jednym rzędzie, zwinięty czat bez przycisku wysyłki.
- Alarm na pokaz zmieniony: jedno zgłoszenie z nowej kamery K18 (park przy Tauron Arenie) — „Człowiek na
  ławce — prawdopodobne zasłabnięcie", „112 — pogotowie powiadomione" (bez drugiego zgłoszenia z dziurą).
  „Zasłab…" liczy się jako zagrożenie zdrowia. W komunikacie miniatura nagrania (`ClipPreview`): klik
  powiększa, pod nagraniem 6 klatek wyciętych w przeglądarce; plik `public/clips/<kamera>.mp4`.
- Numer kontaktowy ze spacjami; wyjaśnione, że produkcyjny Docker wymaga przebudowy po zmianie kodu.

**Zweryfikowane — jak dokładnie:**
- TDD: testy wielu miast (lista miast, izolacja danych, zarysy innych miast, centrala Kielc) —
  czerwone, potem zielone; `npm test` z bazą 67/67 (po wycięciu testów pokazów); `tsc` i `eslint` czyste.
- Przeglądarka (obraz produkcyjny): przełączanie Kraków ↔ Kielce z listy i z mapy po oddaleniu;
  widok zasobów Kielc; `/reports` z filtrem miast, szczegóły Z-2001, formularz w kolorach panelu.

**Świadomie odłożone:**
- Przy wejściu bezpośrednio przez adres mapa startuje mocno oddalona (było wcześniej).
- Brak pliku `public/clips/K18.mp4` — miniatura i klatki pokazują puste miejsca; wycinanie klatek
  z prawdziwego nagrania niesprawdzone (brak ffmpeg do wygenerowania testowego klipu).
- Kamera K18 dopisana do `03-seed.sql` i ręcznie do lokalnej bazy; inne bazy — `docker compose down -v`.

### 2026-10-03 — Alarm na prezentację: szczęśliwa ścieżka przy Tauron Arenie

Autor: Claude (Opus) + rtek

**Zrobione:**
- Scenariusz alarmu: park przy Tauron Arenie, alejka obok food trucków (Arena Garden Street Food
  Market; współrzędne z OSM/Nominatim) — „Wypadek: mężczyzna zemdlał po upadku" (krew z głowy, przejęte
  przez 112 — PRM w drodze) + „Dziura w alejce przy food truckach", oba w D14 Czyżyny.
- Priorytet: objawy zagrożenia zdrowia (zemdlenie, krew, poszkodowani…) +25 i powód „zagrożenie zdrowia
  lub życia" — wypadek bez blokady ruchu też jest krytyczny.
- Plan reagowania: kroki medyczne (Straż Miejska z AED, dojazd dla PRM), przyczyna z pobliskiego
  zgłoszenia (dziura/konar/oświetlenie ≤ 200 m → zabezpiecz, właściwa jednostka); objazdy MPK i SMS-alert
  tylko przy blokadzie ruchu.
- Szczęśliwa ścieżka: gdy serwer/baza nie odpowie w 3 s, alarm z danych lokalnych (`localAlertReports`);
  pula połączeń z limitem 3 s; błędy sprawdzania nowych zgłoszeń nie psują ekranu.

**Zweryfikowane — jak dokładnie:**
- TDD: testy priorytetu, kroków medycznych z przyczyną (i bez — powyżej 200 m), scenariusza w D14,
  alarmu lokalnego — czerwone, potem zielone; `npm test` z bazą 73/73.
- Przeglądarka (obraz produkcyjny): alarm z bazą — krytyczny 76, D14, kroki AED / dojazd / przyczyna
  Z-… dziura (10 m); znacznik przy Tauron Arenie. Baza zatrzymana po załadowaniu strony → alarm lokalny
  po 3,4 s. Baza włączona, testowe wiersze usunięte (38).

**Świadomie odłożone:**
- Bez bazy przy wejściu na stronę `/centrum` zwraca 500 — dane miasta są tylko w bazie (decyzja „baza
  zamiast plików JSON"); szczęśliwa ścieżka obejmuje awarię w trakcie pokazu.

### 2026-10-03 — Alarmy nowych zgłoszeń i plan reagowania

Autor: Claude (Opus) + rtek

**Zrobione:**
- `lib/response.ts`: `responsePlan` (skrót, status, kroki reagowania — 112, MPK, Straż Miejska, Zarząd
  Dróg/VMS, Wodociągi, Zieleń, SMS-alert dzielnicy, kamera, inne zgłoszenia w dzielnicy, przekazanie
  jednostce) i `pickAlert` (najważniejsze do animacji, reszta od najważniejszego).
- `components/AlertCenter.tsx`: alarm krytyczny (czerwona karta, wjazd + drżenie, pulsująca syrena,
  poświata krawędzi ekranu ~7 s, sygnał Web Audio) i lekki komunikat zwykły (znika po 8 s); „+N",
  szczegóły z krokami i przyciskami Powiadom / Przekaż / Podgląd / Pokaż. Bez pełnego ekranu.
- Mapa co 4 s pyta bazę o nowe zgłoszenia (`reportsSinceAction`) — alarm zadziała też dla przyszłego
  bota Telegram i numeru telefonu. Przycisk „Symuluj alarm" w górnym pasku (`AlarmButton`): wypadek
  przejęty przez 112 + przepełniony kosz w tej samej chwili; z innej strony przenosi na `/centrum?alarm=1`.
- Baza: kolumna `reports.handled_by` (kto przejął poza urzędem); Z-1051 — „112 — Policja".
  Na istniejącej bazie dodana przez `ALTER TABLE` (dane zachowane).

**Zweryfikowane — jak dokładnie:**
- TDD: testy `responsePlan`, `pickAlert`, scenariusza alarmu (wypadek krytyczny, kosz nie), mapowania
  `handled_by`, integracyjny (Z-1051 przejęte przez 112) — czerwone, potem zielone; `npm test` z bazą 66/66.
- Przeglądarka (obraz produkcyjny): alarm krytyczny z „+1", szczegóły z krokami, „Powiadom" → zrobione
  + komunikat; zwykłe zgłoszenie dopisane wprost do bazy → lekki komunikat po ~4,5 s, znika po 8 s;
  przycisk z `/reports` → `/centrum` i alarm. Testowe wiersze usunięte (38 zgłoszeń).

**Świadomie odłożone:**
- Powiadomienia „Powiadom MPK / SMS-alert" są pokazowe — bez wysyłki do zewnętrznych systemów.

### 2026-10-03 — Jeden Docker dla aplikacji, mapa ładuje się od razu

Autor: Claude (Opus) + rtek

**Zrobione:**
- Decyzja człowieka: zostaje jeden zestaw, produkcyjny („one shot"). `Dockerfile.prod` → `Dockerfile`;
  usunięte `Dockerfile.dev`, `docker-compose.prod.yml`, `nginx/`. `docker-compose.yml`: `web` (build
  produkcyjny, port 3000) + `db` (Postgres — wymagany, aplikacja na nim działa).
- Mapa: warstwy miasta dodawane po `style.load` zamiast `load` — `load` czekał na wszystkie kafelki
  CARTO (kilkadziesiąt sekund), teraz znaczniki są po ok. 1 s.

**Zweryfikowane — jak dokładnie:**
- `docker compose up -d --build`: `/`, `/centrum`, `/reports`, `/reports/add` → 200, `/map` → 307 na
  `/centrum`; `/reports` czyta bazę na żywo (wiersz dopisany w psql od razu widoczny, potem usunięty).
- Przeglądarka: 80 znaczników na mapie 1,1 s od otwarcia `/centrum`.

**Świadomie odłożone:**
- Tryb deweloperski z przeładowaniem tylko bez Dockera (`npm run dev` + baza z `docker compose up -d db`).

### 2026-10-03 — Przejście z danych w kodzie na bazę PostgreSQL

Autor: Claude (Opus) + rtek

**Zrobione:**
- `database/init.sql` zastąpiony trzema plikami wczytywanymi przy starcie Postgresa:
  `01-schema.sql` (nowe tabele `city`, `sectors` z profilami zasobów, `places`; klucze obce `sector`;
  źródło `telegram`), `02-city.sql` (granica, 18 dzielnic, 271 osiedli — generuje `build-city.mjs`),
  `03-seed.sql` (profile, 17 kamer, 38 zgłoszeń, 15 obiektów, 8 punktów dostępności, z dzielnicami).
  `docker-compose.yml` montuje cały katalog `database/`.
- `/centrum` pobiera dane serwerowo (`lib/city-repo.ts`, `lib/rows.ts`), nowe zgłoszenia i zmiany
  statusu/jednostki zapisują akcje serwera (`app/centrum/actions.ts`). Profile dzielnic przyszły z bazy
  (`Sector.profile`, `Reading.need`).
- Usunięte: `lib/demo-data.ts`, `public/data/krakow/`; skrypty pokazu w `lib/simulation.ts`.
  `/map` przekierowuje na `/centrum`.
- localhost:3000 nie działał — jedyny kontener aplikacji był stary (port 3001, bez bazy); postawiony
  od nowa z aktualnego `docker-compose.yml`.

**Zweryfikowane — jak dokładnie:**
- TDD: testy mapowania wierszy, `sectorOf`, odczytów z profilem i test integracyjny na bazie
  (10 sprawdzeń: dzielnice, przypisania, po 2 zgłoszenia, kamery na żywo, trasa wody, scenariusze,
  źródło telegram) — czerwone, potem zielone. `npm test` 57/57, z `DATABASE_URL` integracyjny 10/10.
  `tsc` czysty.
- Przeglądarka `localhost:3000/centrum`: dane z bazy (37 otwartych), Zasoby bez błędu (36 łuków
  przepływu), Telegram → wiersz `Z-1062` w bazie (telegram, woda, D13), „Przekaż do" → `przekazane`,
  `woda` w bazie. Testowy wiersz usunięty.

**Świadomie odłożone:**
- ESLint zgłasza błąd w `app/reports/page.tsx` (`<a>` zamiast `<Link>`) i ostrzeżenia w `reports.tsx` — pliki
  innej osoby, poza zakresem.
- `docker-compose.prod.yml` nie ma usługi bazy — do dodania przed wdrożeniem.

### 2026-10-03 — Zgłoszenia per dzielnica, Telegram i telefon

Autor: Claude (Opus) + rtek

**Zrobione:**
- Dane pokazowe: po 2 zgłoszenia w każdej z 18 dzielnic, dzielnica pokazowa D13 Podgórze — 4
  (jedna historia: awaria sieci wodnej). Razem 38 zgłoszeń.
- Panel w widoku całego miasta: ranking dzielnic zamiast listy zgłoszeń — otwarte, krytyczne,
  najwyższy priorytet; sortowanie od największej liczby krytycznych; zakładki Otwarte / Krytyczne /
  Zamknięte działają na dzielnicach (`lib/sectors.ts`).
- Przyjęcie zgłoszeń z wiadomości: `lib/intake.ts` (`parseMessage`, `findPlace` — nazwy osiedli
  w odmianie i bez polskich znaków, pinezka z Telegrama ma pierwszeństwo). Nowe źródło `telegram`.
- „Symuluj" ma trzy opcje: kamera, Telegram, telefon (`components/IntakeSimulator.tsx` — rozmowa
  linijka po linijce, analiza AI, „Przyjmij zgłoszenie").
- Klasyfikator: „asfalt" to wskazówka miejsca, nie problem („woda spod asfaltu" → woda, nie drogi).
- Rezerwa wody: D13 0,92 → 0,85, D11 0,93 → 0,98 — propozycja przekierowania wody prowadzi do D13
  stabilnie w czasie.
- Scenariusz prezentacji: `docs/SCENARIUSZ_DEMO.md` (10 kroków, lista kontrolna, warianty A/B/C, plan awaryjny).

**Zweryfikowane — jak dokładnie:**
- TDD: testy rankingu, parsera, liczby zgłoszeń per dzielnica, scenariuszy w D13, klasyfikatora
  i stabilnej trasy wody — najpierw czerwone, potem zielone; `npm test` 131/131, `tsc` i ESLint czyste.
- Przeglądarka 1440×900 (`/centrum`, kontener dev): ranking dzielnic, Telegram → Z-1062 (woda, D13),
  telefon → Z-1063 (woda, Stare Podgórze, D13), wniosek AI o stratach D13 z odnośnikiem,
  propozycje wody D07/D10/D06 → D13.

**Świadomie odłożone:**
- Prawdziwy bot Telegram i numer telefonu — czekają na dane od człowieka (sekcja „Czeka na człowieka").
- Równolegle w katalogu trwały zmiany innej sesji (strona główna dla mieszkańców, `/centrum`, czat);
  tych plików nie ruszałem poza jedną linią `SOURCE_LABEL.telegram` w `lib/meta.ts`.

### 2026-10-03 — Landing kontaktowy z czatem AI, nazwa SWIMM

Autor: Claude (Opus) + użytkownik

**Zrobione:**
- Decyzja D-02: tylko SMART CITY (bez „Kraków bez barier"), nazwa SWIMM, Telegram zamiast Messengera.
- `/` to teraz landing: pełna nazwa, telefon jako link `tel:`, SMS, Telegram, 112, czat AI pod spodem.
  Mapa przeniesiona na `/centrum`; w nawigacji „Mapa" → „Centrum".
- `POST /api/chat` (Anthropic SDK, `claude-opus-5-5`, `effort: low`, `fallbacks: "default"`),
  walidacja wejścia (max 12 wiadomości po 2000 znaków), przy błędzie odpowiedź 503 z numerem telefonu.
- `APP_NAME = "SWIMM"`, `APP_FULL_NAME`, `CONTACT` w `lib/meta.ts` (numery pokazowe).

**Zweryfikowane — jak dokładnie:**
- `tsc --noEmit` i ESLint bez błędów. Przeglądarka 1024×768: landing mieści się bez przewijania,
  link telefonu ma `href="tel:+48123456789"`, wysłanie pytania w czacie pokazuje wiadomość
  użytkownika i odpowiedź zastępczą (brak klucza API w środowisku). Prawdziwej odpowiedzi modelu
  nie sprawdzono — brak klucza.

**Świadomie odłożone:**
- Trasa `/map` (duplikat `/centrum`) i źródło „Messenger" w danych pokazowych — do decyzji człowieka.
- Testy jednostkowe walidacji czatu.

### 2026-10-03 — Kamery na żywo w Krakowie

Autor: Claude (Opus) + rtek

**Zrobione:**
- 6 kamer z obrazem na żywo z WebCamera.pl: Rynek Główny (2 ujęcia), pl. Wszystkich Świętych
  (Urząd Miasta), ul. Floriańska, Wawel, Kazimierz — ul. Szeroka (`lib/demo-data.ts`, K01, K13–K17).
- Rozpoznane, nieużyte: oficjalne kamery krakow.pl (m.in. pl. Centralny, Rynek Podgórski, UMK przy
  Mogilskiej) — serwis wycina odtwarzacz bez zgody na cookies zewnętrzne, więc adresów nie da się
  pobrać bez akceptacji zgody przez człowieka. WebCamera.pl ma jeszcze Bramę Floriańską (bez
  odtwarzacza), Starą Synagogę i hejnał — pominięte, żeby nie zagęszczać centrum.

**Zweryfikowane — jak dokładnie:**
- TDD: test „co najmniej 5 kamer na żywo z player.webcamera.pl, z autorem" + unikalność identyfikatorów
  — czerwone, potem dane — `npm test` 89/89. Każdy odtwarzacz: HTTP 200 i brak `X-Frame-Options`
  / `frame-ancestors`. W aplikacji okienko kamery Wawel odtwarza obraz w iframe.

### 2026-10-03 — Przejście z Kielc na Kraków

Autor: Claude (Opus) + rtek

**Zrobione:**
- Decyzja D-01: miastem demo jest Kraków; sektory to 18 dzielnic (D01–D18) z OpenStreetMap.
- `build-city.mjs` pobiera dzielnice z Nominatim (zamiast Voronoi), osiedla z Overpass po prostokącie
  granicy, z serwerami zapasowymi (główny Overpass zwracał 504). Wynik: `public/data/krakow/`
  (granica 326 km², 18 dzielnic, 271 osiedli); `public/data/kielce/` usunięte.
- Dane pokazowe przeniesione do Krakowa: 12 kamer na prawdziwych skrzyżowaniach, 17 zgłoszeń,
  15 obiektów (m.in. Elektrociepłownia Kraków na Łęgu, ZUW Bielany i Rudawa, ZTPO w Nowej Hucie —
  nowy rodzaj obiektu `spalarnia`), 8 punktów dostępności (identyfikatory `P..`, żeby nie myliły się
  z dzielnicami), profile zasobów dla 18 dzielnic, centrala „Centrala · Kraków".
- Usunięte podglądy na żywo kamer Kielc (WebCamera.pl, Windy) — nie dotyczą Krakowa.

**Zweryfikowane — jak dokładnie:**
- TDD: najpierw testy (dzielnice D01–D18, profil dla każdej dzielnicy, każdy obiekt pokazowy wewnątrz
  dzielnicy, wyciek w dzielnicy ze stratami, kontenery w dzielnicy z zaległościami) — czerwone, potem
  dane — `npm test` 82/82 zielone. `tsc --noEmit` i ESLint bez błędów.
- Przeglądarka 1440×900 (kontener dev): mapa Krakowa z dzielnicami i zgłoszeniami, widok Zasoby —
  18 przepływów do centrali, propozycje przekierowań (D14 → D04 itd.).

**Świadomie odłożone:**
- Prawdziwe kamery na żywo w Krakowie — do znalezienia publicznych strumieni.
- Widok mobilny — testy pominięte na prośbę człowieka.

### 2026-10-03 — Przekierowania zasobów między sektorami, start TDD

Autor: Claude (Opus) + rtek

**Zrobione:**
- Planer przekierowań w widoku Zasoby: wybór sektora źródłowego i docelowego, suwak 0–100%
  strumienia źródła, wycena (straty przesyłu z odległości, zyski i straty opisane zdaniami, bilans
  w zł/h i zł/dobę), ostrzeżenie o niedoborze źródła, lista zastosowanych przekierowań z cofaniem
  i trzy proponowane trasy (`website/lib/transfer.ts`, `components/TransferPlanner.tsx`).
- Mapa rysuje przekierowanie jako osobny łuk sektor → sektor z etykietą (podgląd przerywany,
  zastosowane — ciągłe); przepływy do centrali przygasają, gdy są trasy.
- Model danych: woda ma rezerwę dostaw per sektor, odpady — zdolność odbioru; większe farmy PV,
  żeby demo miało realne nadwyżki.
- Decyzje człowieka: pełny TDD i kierunek wizualny „ciemne centrum dowodzenia" (`USTAWIENIA.md`).
  Powstały `docs/ARCHITEKTURA.md` i `docs/DESIGN.md`. Vitest + `npm test`; `@types/node` 20 → 22
  (wymóg Vitest 5, zgodne z Node 22 w Dockerze).

**Zweryfikowane — jak dokładnie:**
- `npm test`: 21 testów logiki zasobów i przekierowań — zielone. `tsc --noEmit` i ESLint bez błędów.
- Przeglądarka 1440×900 na kontenerze dev: propozycje tras dla wszystkich czterech miar, zastosowanie
  S06 → S01 (energia) zmienia odczyty i rysuje łuk; kontener przebudował się po zmianie zależności.
- **Nie sprawdzono:** widoku mobilnego planera.

**Świadomie odłożone:**
- Testy napisane po kodzie przekierowań (TDD przyjęte w trakcie zadania) — od następnej zmiany test idzie pierwszy.

### 2026-10-03 — Widok zasobów i przepływy do centrali

Autor: Claude (Opus) + rtek

**Zrobione:**
- Docker: `docker compose up --build --watch` (dev, hot reload przez synchronizację plików)
  i `docker-compose.prod.yml` (Next.js standalone + nginx, dodany `nginx/default.conf`).
- Panel boczny rozbity na dwa widoki: „Zgłoszenia" i „Zasoby"; mapa pokazuje tylko warstwy
  wybranego widoku.
- Zasoby: cztery miary (energia, woda, odpady, ciepło) z odczytami „na żywo" (dane pokazowe,
  `website/lib/resources.ts`), wartości per obiekt i per sektor, suma miasta, wykres ostatniej minuty,
  wnioski AI (reguły) łączące anomalie ze zgłoszeniami (straty wody w S03 ↔ „Wyciek wody z jezdni").
- Mapa: animowane przepływy — przy oddaleniu z sektorów do centrali, przy przybliżeniu z obiektów
  do sektora (`components/map/FlowOverlay.tsx`). Nowe obiekty: dwie farmy PV i elektrociepłownia.

**Zweryfikowane — jak dokładnie:**
- `tsc --noEmit` i ESLint bez błędów; przegląd w przeglądarce 1440×900 na kontenerze dev:
  oba widoki, przełączanie miar, wybór sektora, 16 animacji przepływu działa, konsola bez błędów.
- **Nie sprawdzono:** widoku mobilnego z nowym panelem i produkcyjnego `next build` po zmianach.

**Świadomie odłożone:**
- Prawdziwe źródła pomiarów (liczniki, API dostawców) — teraz dane pokazowe.

### 2026-10-03 — Adopcja RelAI (wpis zerowy)

Autor: RelAI (Opus) + rtek

**Zrobione:**
- Historia sprzed adopcji: repozytorium `rtekdev/404-Brain-Not-Found` żyje od 2026-10-03 11:47;
  3 commity, wszystkie autorstwa Gabriela (`test 1`, `Preped default next app`, `basic nav` —
  ostatni `0e62584`, 12:40). Zawartość: szkielet Next.js 16 w `website/` z nawigacją i pustymi
  stronami `/map` i `/reports`.
- Na gałęzi `feature/mapa-glowna` (niezacommitowane w chwili adopcji): mapa główna Kielc
  (MapLibre + CARTO), skrypt onboardingu miasta z OpenStreetMap, sektory, panel zdarzeń
  z priorytetem, zgłoszenia, podgląd kamer (demo), symulacja kamery, `README.md` z instrukcją
  uruchomienia, `docs/KONCEPCJA.md` i `docs/PLAN.md`.
- Adopcja: backup `C:\Backupy\RelAI\404-Brain-Not-Found_2026-10-03_1319.zip`, potem struktura
  RelAI 2.7.0 (`CLAUDE.md`, `docs/STATE.md`, `DZIENNIK.md`, `LEKCJE.md`, `DECYZJE.md`,
  `USTAWIENIA.md`, `KOMENDY.md`, `RAPORT_ADOPCJI.md`). Szczegóły: [RAPORT_ADOPCJI.md](RAPORT_ADOPCJI.md).
- Zasady z `C:\hackyeah\CLAUDE.md` (poza repo) przeniesione dosłownie do sekcji odziedziczonej
  `CLAUDE.md` — za zgodą użytkownika.

**Zweryfikowane — jak dokładnie:**
- Archiwum: nagłówek `50 4B 03 04`, 452 311 B, 189 wpisów (w tym 122 z `.git`); lista wpisów
  przeszukana pod kątem `.env*`, `*.pem`, `*.key`, `*.pfx`, `*.p12`, `id_rsa`, `id_ed25519`,
  `*.keystore`, `.npmrc`, `.pypirc`, `credentials.json`, `serviceAccount*.json` — 0 trafień;
  0 wpisów z `node_modules` i `.next`.
- Sekrety w plikach projektu: `git grep` i `grep` po `api_key|secret|token|password|sk-…|AKIA…`
  w kodzie i dokumentach — 0 trafień.
- **Nie sprawdzono:** produkcyjnego `next build` (sprawdzone wcześniej: `tsc --noEmit` i ESLint bez
  błędów, ręczny przegląd w Edge 1440×900 i 390×844).

**Świadomie odłożone:**
- Commit pracy nad mapą — użytkownik wybrał commit samej adopcji; mapa zostaje niezacommitowana.
- Dokumenty warunkowe profilu `app` (`ARCHITEKTURA.md`, `DESIGN.md`) — powstaną przy pierwszym
  zdarzeniu po adopcji, nie przy adopcji (D-10).

**Do zrobienia przez człowieka:**
- Potwierdzić godzinę startu i platformę zgłoszeń. *(wyprowadzone 2026-10-03 → sekcja „Czeka na człowieka")*
- Doprecyzować model „Jev". *(wyprowadzone 2026-10-03 → sekcja „Czeka na człowieka")*
