# Scenariusz demo — SWIMM na prezentacji

Stan na: 2026-10-03 · czas pokazu ok. 4 minuty · ekran: `/centrum`

Jedna historia od początku do końca: **awaria sieci wodnej w Podgórzu (D13)**. Mieszkańcy zgłaszają ją
różnymi kanałami, AI łączy zgłoszenia z pomiarami sieci, a dyspozytor jednym ruchem kieruje wodę
z dzielnicy, która ma rezerwę.

## Przygotowanie (przed wejściem na scenę)

1. W `website/`: `docker compose up --build --watch` (albo `npm run dev`).
2. Otwórz `http://localhost:3000/centrum` (port z Dockera) i **odśwież stronę** — dane pokazowe
   wracają do stanu startowego (38 zgłoszeń, po 2 w każdej dzielnicy, 4 w Podgórzu).
3. Poczekaj, aż mapa pokaże granice dzielnic (pierwsze ładowanie w trybie deweloperskim trwa do ~10 s).
4. Przeglądarka na pełnym ekranie, szerokość min. 1280 px.

## Przebieg — krok po kroku

Każdy krok: **co robisz** → **co widać** (to jest jednocześnie lista kontrolna testu).

| # | Co robisz | Co ma się pojawić |
|---|---|---|
| 1 | Pokaż mapę całego miasta | Panel „Najważniejsze teraz" pokazuje **ranking dzielnic**: na górze D13 Podgórze (otwarte: 4, krytyczne: 1). Liczniki: 37 otwartych (38 zgłoszeń, 1 zamknięte), 2 krytyczne. |
| 2 | Kliknij **D13 Podgórze** w panelu | Mapa przybliża się do Podgórza; lista 4 zgłoszeń: wyciek wody na Zabłociu, niskie ciśnienie na Płaszowie, mokra plama przy Lipowej, kolizja na rondzie Matecznego. |
| 3 | **Symuluj → Wiadomość z Telegrama** | Okno czatu: wiadomość od @ania_zablocie o wodzie tryskającej spod asfaltu + pinezka. Po chwili „Analiza AI": kategoria **Woda i kanalizacja**, miejsce **pinezka z Telegrama · D13 Podgórze**. |
| 4 | **Przyjmij zgłoszenie** | Komunikat „Telegram: przyjęto Z-…"; mapa leci na Zabłocie; otwiera się karta zgłoszenia ze źródłem „Telegram". |
| 5 | Wróć do listy, **Symuluj → Telefon od mieszkańca** | Okno rozmowy: bot centrum zgłoszeń i mieszkaniec ze Starego Podgórza (brak wody w bloku). Transkrypcja pojawia się linijka po linijce, potem „Analiza AI": **Woda**, **Stare Podgórze · D13**. |
| 6 | **Przyjmij zgłoszenie** | „Telefon: przyjęto Z-…"; D13 ma teraz 6 otwartych zgłoszeń. |
| 7 | Zakładka **Zasoby** → miara **Woda** | Mapa: przepływy z dzielnic do centrali. Wnioski AI: **„D13 Podgórze: straty 21% — możliwy wyciek, zgodny ze zgłoszeniem…"** z odnośnikiem do zgłoszenia. |
| 8 | Kliknij pierwszą propozycję **D07 → D13** | Planer: suwak z udziałem dostaw Zwierzyńca (ZUW Bielany), zyski (niedobór D13 mniejszy, pokrycie rośnie), straty przesyłu, bilans w zł/h. Na mapie przerywany łuk D07 → D13. |
| 9 | **Zastosuj** | Łuk staje się ciągły z etykietą „D07 → D13 · +… m³/h"; przekierowanie na liście z możliwością cofnięcia. |
| 10 | (opcjonalnie) Zakładka **Zgłoszenia**, kliknij kamerę na Rynku | Obraz na żywo z Rynku Głównego (WebCamera.pl). |

Zdania na każdy krok:

- 1–2: „Dyspozytor nie przegląda setek zgłoszeń — widzi, która dzielnica płonie."
- 3–6: „Mieszkaniec pisze albo dzwoni tak, jak mu wygodnie. AI zamienia to w zgłoszenie z kategorią i miejscem."
- 7: „Zgłoszenia mieszkańców i pomiary sieci mówią to samo — to nie przypadek, to wyciek."
- 8–9: „Zanim ekipa naprawi rurę, kierujemy wodę z Bielan, gdzie jest rezerwa. System od razu liczy koszt i zysk."

## Kanały zgłoszeń — trzy warianty

| Wariant | Stan | Co jest potrzebne |
|---|---|---|
| **A. Symulacja w aplikacji** (Symuluj → Telegram / Telefon) | **gotowe** — działa offline, bez kont | nic |
| **B. Prawdziwy bot Telegram** | czeka na dane | token bota od @BotFather, nazwa bota (na stronie głównej jest już `@SwimmKrakowBot`), adres publiczny serwera na czas pokazu (webhook) albo tryb odpytywania |
| **C. Prawdziwy numer telefonu** | czeka na dane | dostawca i numer (np. Twilio), klucze w `.env`, rozpoznawanie mowy (transkrypcja dostawcy albo model) |

Wszystkie trzy warianty kończą się w tej samej funkcji `parseMessage` (`website/lib/intake.ts`):
tekst wiadomości albo transkrypcja → kategoria, tytuł, miejsce (nazwa osiedla w dowolnej odmianie
albo pinezka z Telegrama), dzielnica. Warianty B i C dodadzą tylko odbiór wiadomości i zapis
zgłoszenia na serwerze.

## Plan awaryjny

- Mapa się nie ładuje (brak internetu → brak podkładu CARTO): granice, dzielnice i znaczniki nadal
  działają — pokazuj bez podkładu.
- Kamera na żywo nie odpowiada: pomiń krok 10 — reszta nie zależy od zewnętrznych serwisów.
- Coś poszło nie tak w trakcie: odśwież stronę — stan wraca do startowego w kilka sekund.
- Bot / numer (warianty B, C) nie odpowiada: przełącz na wariant A — ten sam efekt na ekranie.
