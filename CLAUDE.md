# 404 Brain Not Found — „Puls Miasta", platforma SMART CITY dla urzędów (HackYeah)

## Rytuał startu sesji

Czytaj w tej kolejności, nie skanuj repo pełnotekstowo:
1. Ten plik.
2. [docs/STATE.md](docs/STATE.md) — stan na dziś.
3. [docs/DZIENNIK.md](docs/DZIENNIK.md) — „Stan otwartych ryzyk", „Czeka na człowieka" + ostatni wpis.
4. [docs/LEKCJE.md](docs/LEKCJE.md) — wyłącznie sekcja „Zasady aktywne".
5. [docs/USTAWIENIA.md](docs/USTAWIENIA.md) — preferencje projektu.

**Frazy sesji:** „kontynuujemy pracę" → rytuał, akapit „gdzie jesteśmy" **i zdanie z propozycją
najbliższego kroku**; „sprawdź status" → stan, plany, ryzyka, zaległości; „kończymy na dziś" →
sync dokumentów, wpis do dziennika, ryzyka, sprzątanie artefaktów roboczych, propozycja commita.

**Sprawa przeterminowana:** pozycja sekcji „Czeka na człowieka" starsza niż `N` dni (wiersz
`Przegląd spraw człowieka` w [docs/USTAWIENIA.md](docs/USTAWIENIA.md), domyślnie 30) wymusza
decyzję **przed** akapitem „gdzie jesteśmy": pytasz partiami po cztery — zamknąć / odroczyć
o kolejne `N` dni / rozstrzygnąć teraz. Sesja nieinteraktywna: sam raport, bez pytań — rozpoznajesz ją z kontekstu (`claude -p`, agent w tle); żaden hook jej nie sygnalizuje.

## Stan prac

| Co | Status | Gdzie |
|---|---|---|
| Mapa główna (etap 1) | DZIAŁA lokalnie, niezacommitowana | docs/STATE.md |
| Backend i AI (etap 2) | NIEROZPOCZĘTE | docs/PLAN.md |
| Zgłoszenie na hackathon | NIEROZPOCZĘTE | docs/PLAN.md |

Aktywny plan: brak

## Reguły procesu

- Dokumentacja po polsku, kod i identyfikatory po angielsku, commity po angielsku.
- Sekrety wyłącznie w `.env` (gitignored) — nigdy w plikach śledzonych.
- Zadanie jest ukończone dopiero z aktualnym STATE i wpisem w DZIENNIKU (ta sama tura).
- Decyzji z `docs/DECYZJE.md` nie proponuje się ponownie.
- Nowe rozstrzygnięcia zapisuj w `docs/DECYZJE.md` jako `D-NN` z datą i powodem. Sekcja „Zasady
  projektu (odziedziczone)" jest zapisem stanu sprzed adopcji — czytasz ją, nie dopisujesz do niej.
- Wątek spoza zakresu etapu → zatrzymaj się i zapytaj: odnoga (`/relai-branch`), aneks do planu czy
  „świadomie odłożone" do dziennika. Nigdy „przy okazji".
- Kod Next.js w `website/` → najpierw `website/AGENTS.md` (wersja Next.js z nowymi API).

## Reguły profilu (app)

- Pierwszy plik źródłowy w projekcie → w tej samej turze powstaje `docs/ARCHITEKTURA.md` i pada
  jedno pytanie o podejście do testów; odpowiedź do `docs/USTAWIENIA.md`.
- Pierwszy plik interfejsu → jedno pytanie o kierunek wizualny i `docs/DESIGN.md`.
- Przed pierwszym wdrożeniem środowiska → lista kontrolna z `first-deploy.md`; po wdrożeniu →
  `docs/srodowiska/<nazwa>.md` z URL-em, wskazaniem dostępów, procedurą wdrożenia i cofnięcia.
- W `docs/srodowiska/` są nazwy zmiennych i miejsce przechowywania sekretu — nigdy wartości.
- Zmiana modułu opisanego w `ARCHITEKTURA.md` aktualizuje ten opis w tej samej turze.

## Zasady projektu (odziedziczone)

Nowe rozstrzygnięcia zapisuj w `docs/DECYZJE.md` jako `D-NN` z datą i powodem. Ta sekcja jest zapisem stanu sprzed adopcji — czytasz ją, nie dopisujesz do niej.

Źródło: `C:\hackyeah\CLAUDE.md` (poza repozytorium), przeniesione 2026-10-03 za zgodą użytkownika, brzmienie dosłowne:

> - **Commity i PR-y bez atrybucji Claude** — żadnych linii `Co-Authored-By: Claude ...` ani stopki "Generated with Claude Code".
> - Pracujemy na osobnej gałęzi roboczej, nie bezpośrednio na `main`.
> - Tempo hackathonowe: najpierw działające demo, potem szlify.

## Definicja ukończenia

Zadanie jest ukończone, gdy kod działa **i** `docs/STATE.md` oraz wpis w `docs/DZIENNIK.md` są
zaktualizowane w tej samej turze. Bez tego zadanie jest w toku, niezależnie od stanu kodu.

## Dobór modeli (rekomendacja, nie reguła)

Analiza i plany → model najsilniejszy. Wykonanie etapów → model wyważony. Zadania mechaniczne →
model najtańszy. Przy każdym planie potwierdzasz wybór; trafia on do STATUS planu.
Nazwy modeli tego narzędzia są w `.claude/relai/MODELE-<narzędzie>.md` (data listy w polu
`list-date`, odświeżenie: `/relai-models`) — tutaj stoją klasy, bo nazwy się starzeją.

## Implementation guidelines (sekcja niemutowalna)

- **Think before coding**: nie zakładaj — sprawdź; niejasność → pytanie, nie domysł.
- **Simplicity first**: najprostsze działające rozwiązanie; zero spekulacyjnej generyczności.
- **Surgical changes**: zmieniaj minimum konieczne; nie refaktoryzuj przy okazji.
- **Goal-driven**: każda zmiana mapuje się na cel zadania; poza zakresem → do DZIENNIKA.
