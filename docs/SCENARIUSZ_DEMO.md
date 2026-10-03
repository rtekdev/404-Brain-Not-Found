# Scenariusz demo — SWIMM na prezentacji

Stan na: 2026-10-03 · czas pokazu ok. 3 minuty · ekran: `/centrum`

Jedna historia od początku do końca: **awaria sieci wodnej w Podgórzu (D13)**. Mieszkańcy już ją
zgłosili, AI łączy zgłoszenia z pomiarami sieci, a dyspozytor jednym ruchem kieruje wodę z dzielnicy,
która ma rezerwę. Na koniec alarm: kamera w parku przy Tauron Arenie widzi człowieka, który zasłabł na ławce.

## Przygotowanie (przed wejściem na scenę)

1. W `website/`: `docker compose down -v`, potem `docker compose up -d --build` (baza i aplikacja od zera).
2. Otwórz `http://localhost:3000/centrum` — baza jest w stanie startowym (38 zgłoszeń, po 2 w każdej
   dzielnicy, 4 w Podgórzu). Zgłoszenia przyjęte w trakcie próby zostają w bazie — przed pokazem
   powtórz krok 1.
3. Poczekaj, aż mapa pokaże granice dzielnic (pierwsze ładowanie w trybie deweloperskim trwa do ~10 s).
4. Przeglądarka na pełnym ekranie, szerokość min. 1280 px.

## Przebieg — krok po kroku

Każdy krok: **co robisz** → **co widać** (to jest jednocześnie lista kontrolna testu).

| # | Co robisz | Co ma się pojawić |
|---|---|---|
| 1 | Pokaż mapę całego miasta | Panel „Najważniejsze teraz" pokazuje **ranking dzielnic**: na górze D13 Podgórze (otwarte: 4, krytyczne: 1). Liczniki: 37 otwartych (38 zgłoszeń, 1 zamknięte), 2 krytyczne. |
| 2 | Kliknij **D13 Podgórze** w panelu | Mapa przybliża się do Podgórza; lista 4 zgłoszeń: wyciek wody na Zabłociu, niskie ciśnienie na Płaszowie, mokra plama przy Lipowej, kolizja na rondzie Matecznego. |
| 3 | Zakładka **Zasoby** → miara **Woda** | Mapa: przepływy z dzielnic do centrali. Wnioski AI: **„D13 Podgórze: straty 21% — możliwy wyciek, zgodny ze zgłoszeniem…"** z odnośnikiem do zgłoszenia. |
| 4 | Kliknij pierwszą propozycję **D07 → D13** | Planer: suwak z udziałem dostaw Zwierzyńca (ZUW Bielany), zyski (niedobór D13 mniejszy, pokrycie rośnie), straty przesyłu, bilans w zł/h. Na mapie przerywany łuk D07 → D13. |
| 5 | **Zastosuj** | Łuk staje się ciągły z etykietą „D07 → D13 · +… m³/h"; przekierowanie na liście z możliwością cofnięcia. |
| 6 | (opcjonalnie) Zakładka **Zgłoszenia**, kliknij kamerę na Rynku | Obraz na żywo z Rynku Głównego (WebCamera.pl). |
| 7 | **Symuluj alarm** (górny pasek, czerwony przycisk) | Po ~1 s: czerwona karta „Krytyczne zgłoszenie" — **Człowiek na ławce — prawdopodobne zasłabnięcie** (park przy Tauron Arenie, D14 Czyżyny), „Przejęte przez 112 — pogotowie powiadomione", obok miniatura nagrania z kamery K18. Syrena, pulsująca poświata krawędzi ekranu, krótki sygnał. Gdy baza/serwer nie odpowie — ten sam alarm z danych lokalnych po ~3 s. |
| 8 | Kliknij **miniaturę nagrania** | Powiększone nagranie z kamery K18 i pasek 6 klatek — kliknięcie klatki przewija do tej chwili. (Plik `website/public/clips/K18.mp4`; bez niego widać miejsce na nagranie.) Zamknij Esc. |
| 9 | **Szczegóły i kroki**, potem **Powiadom** przy Straży Miejskiej i **Pokaż na mapie** | Kroki: 112 prowadzi akcję, Straż Miejska — patrol z AED do przyjazdu pogotowia, wskaż ratownikom dojazd (pinezka GPS), podgląd kamery K18. Po „Powiadom": krok „zrobione"; mapa przybliża park przy Tauron Arenie. |

Zdania na każdy krok:

- 1–2: „Dyspozytor nie przegląda setek zgłoszeń — widzi, która dzielnica płonie."
- 3: „Zgłoszenia mieszkańców i pomiary sieci mówią to samo — to nie przypadek, to wyciek."
- 4–5: „Zanim ekipa naprawi rurę, kierujemy wodę z Bielan, gdzie jest rezerwa. System od razu liczy koszt i zysk."
- 7–9: „Kamera zauważa człowieka, który zasłabł na ławce, zanim ktokolwiek zadzwoni. Pogotowie już jedzie — system pokazuje nagranie klatka po klatce i podpowiada, co miasto może zrobić do przyjazdu karetki."

## Kanały zgłoszeń

Pokazów kanałów w aplikacji nie ma (wycięte 2026-10-03 — przycisk „Symuluj" z panelu zgłoszeń).
Prawdziwe kanały czekają na dane:

| Kanał | Co jest potrzebne |
|---|---|
| **Bot Telegram** | token bota od @BotFather, nazwa bota (na stronie głównej jest już `@SwimmKrakowBot`), adres publiczny serwera na czas pokazu (webhook) albo tryb odpytywania |
| **Numer telefonu** | dostawca i numer (np. Twilio), klucze w `.env`, rozpoznawanie mowy (transkrypcja dostawcy albo model) |

Odczyt kategorii z tekstu zostaje w `website/lib/classify.ts`. Rozpoznawanie miejsca z wiadomości
(`parseMessage`, dawne `website/lib/intake.ts`) jest w historii git — do przywrócenia razem z kanałem.

## Plan awaryjny

- Mapa się nie ładuje (brak internetu → brak podkładu CARTO): granice, dzielnice i znaczniki nadal
  działają — pokazuj bez podkładu.
- Kamera na żywo nie odpowiada: pomiń krok 6 — reszta nie zależy od zewnętrznych serwisów.
- Coś poszło nie tak w trakcie: `docker compose down -v && docker compose up -d --build` — baza wraca do stanu startowego (ok. 1 min).
