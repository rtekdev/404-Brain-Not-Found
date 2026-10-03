# STATE — 404 Brain Not Found

Stan na: 2026-10-03

## Gdzie jesteśmy

Budujemy na hackathon HackYeah (zadanie SMART CITY) „SWIMM" — jedną mapę miasta dla
urzędu, na której widać zgłoszenia od mieszkańców i z kamer, zasoby miejskie i dostępność, a sztuczna
inteligencja wyciąga na wierzch to, co najpilniejsze. Pierwszy ekran — mapa Krakowa z panelem
zdarzeń — działa lokalnie na danych pokazowych. Praca nad nim nie jest jeszcze zapisana we wspólnym
repozytorium. Termin zgłoszenia: 4 października, 23:00.

## Co działa

- Strona główna dla mieszkańców: pełna nazwa SWIMM, numer telefonu (kliknięcie od razu dzwoni), SMS, Telegram, 112 i czat z asystentem AI. Numery są pokazowe. Czat odpowiada dopiero po ustawieniu `ANTHROPIC_API_KEY` w `website/.env`; bez klucza mówi, że jest niedostępny, i podaje telefon.
- Panel urzędu (mapa, zgłoszenia, zasoby) jest pod adresem `/centrum`.

- Dyspozytor widzi Kraków podzielony na 18 dzielnic (sektory D01–D18), z granicami pobranymi automatycznie z otwartych map.
- Na mapie są zgłoszenia, kamery, zasoby (zbiorniki, kontenery, stacje) i punkty dostępności; warstwy można włączać i wyłączać.
- Panel „Najważniejsze teraz" układa zgłoszenia od najpilniejszego i pokazuje, skąd przyszły (kamera, telefon, SMS, aplikacja, Messenger).
- Dyspozytor przekazuje zgłoszenie właściwej jednostce i zmienia jego status.
- Mieszkaniec zgłasza problem, wskazując miejsce na mapie; kategoria rozpoznaje się podczas pisania.
- Sześć kamer w centrum Krakowa pokazuje prawdziwy obraz na żywo (WebCamera.pl).
- W widoku całego miasta panel pokazuje ranking dzielnic (otwarte, krytyczne, najwyższy priorytet); kliknięcie dzielnicy pokazuje jej zgłoszenia.
- Pokaz „Symuluj": zgłoszenie z kamery, wiadomość z Telegrama albo telefon od mieszkańca — AI odczytuje kategorię i miejsce; scenariusz prezentacji w [SCENARIUSZ_DEMO.md](SCENARIUSZ_DEMO.md).
- Pokaz „symuluj kamerę" tworzy zgłoszenie tak, jakby wykryła je kamera — na potrzeby prezentacji.
- Widok „Zasoby": zużycie i produkcja energii, woda, odpady i ciepło — dla każdego obiektu, sektora i całego miasta, z odczytami na żywo (dane pokazowe).
- Na oddalonej mapie dane z sektorów spływają animacją do centrali; po przybliżeniu — z obiektów do sektora.
- Asystent wskazuje anomalie w pomiarach i łączy je ze zgłoszeniami mieszkańców (np. straty wody ↔ zgłoszony wyciek).
- Dyspozytor przekierowuje część zasobu (0–100%) z jednego sektora do drugiego i od razu widzi zyski, straty i bilans w złotych; system sam proponuje najbardziej opłacalne trasy, a mapa rysuje przekierowanie.
- Aplikację uruchamia się w Dockerze (tryb deweloperski i produkcyjny).

## Nad czym pracujemy teraz

- Widok zasobów z przekierowaniami jest gotowy na gałęzi `feature/zasoby` i czeka na zapisanie.
- Od teraz pracujemy w trybie TDD — każda zmiana logiki zaczyna się od testu.
- Miastem demo jest Kraków (decyzja D-01); Kielce zostały porzucone.

## Co dalej

- Klucz `ANTHROPIC_API_KEY` w `website/.env`, żeby czat na stronie głównej odpowiadał, i prawdziwe numery kontaktowe w `website/lib/meta.ts`.
- Prawdziwy model językowy zamiast reguł do oceny i układania zgłoszeń.
- Zapisywanie zgłoszeń na serwerze, żeby nie znikały po odświeżeniu strony.
- Jeden działający przykład zgłoszenia telefonem albo SMS-em.
- Widok jednostki (np. zieleni miejskiej) z jej kolejką zadań.
- Prezentacja do 10 slajdów i opis zgłoszenia na hackathon.

## Co blokuje

- Potwierdzenie u organizatora godziny startu i platformy zgłoszeń (regulamin i opis zadania mówią różnie).
- Model „Jev" z koncepcji — trzeba doprecyzować, o który model chodzi.

---

## Szczegóły techniczne

### Środowiska

| Środowisko | URL | Stan |
|---|---|---|
| lokalne | http://localhost:3000 | działa (`npm run dev` albo `docker compose up --build --watch` w `website/`) |
| produkcja / demo | — | nie wdrożone |

### Wersje

Node.js 24 (min. 20.9; Docker: 22) • Next.js 16.3.8 • React 19.2 • TypeScript 5 • Tailwind 4 • MapLibre GL 6.11 • Turf 7.4 • Vitest 5

### Dane zewnętrzne

Granica i osiedla: OpenStreetMap (Nominatim, Overpass, ODbL) • Podkład mapy: CARTO Dark Matter.

### Linki

Repo: github.com/rtekdev/404-Brain-Not-Found • Koncepcja: [KONCEPCJA.md](KONCEPCJA.md) • Plan hackathonowy: [PLAN.md](PLAN.md) • Architektura: [ARCHITEKTURA.md](ARCHITEKTURA.md) • Wygląd: [DESIGN.md](DESIGN.md)
