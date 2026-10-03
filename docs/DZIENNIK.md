# DZIENNIK — 404 Brain Not Found

## Stan otwartych ryzyk

| # | Ryzyko | Poziom | Status | Mitygacja |
|---|---|---|---|---|
| R1 | Konflikty przy łączeniu z pracą Gabriela — gałąź `feature/mapa-glowna` zmienia jego `Navbar.tsx`, `layout.tsx`, `globals.css`, `page.tsx`, `map/page.tsx` | średni | OTWARTE | Praca nad mapą jest niezacommitowana; otwarte, dopóki gałąź nie zostanie wypchnięta i połączona z `main`. Zmierzone: 2026-10-03 (adopcja) |
| R2 | Termin hackathonu — zgłoszenie do 4.10 23:00, zmiany po terminie nie są oceniane | wysoki | OTWARTE | Plan etapów w `docs/PLAN.md`; etap 1 (mapa) gotowy lokalnie. Zmierzone: 2026-10-03 (adopcja) |
| R3 | „AI" w demo to na razie reguły słów kluczowych, nie model — jury ocenia zrozumienie rozwiązania | średni | OTWARTE | Kod klasyfikacji i priorytetu jest wyjaśnialny i opisany jako zastępstwo modelu; podmiana na model w etapie 2 planu. Zmierzone: 2026-10-03 (adopcja) |

## Czeka na człowieka

- **Potwierdzić u organizatora godzinę startu (regulamin: „11:00 PM 3.10") i platformę zgłoszeń (HackTribe vs Challenge Rocket)** · 2026-10-03 · [wpis 2026-10-03 — Adopcja RelAI](#2026-10-03--adopcja-relai-wpis-zerowy)
- **Doprecyzować, o który model chodzi pod nazwą „Jev" z koncepcji** · 2026-10-03 · [wpis 2026-10-03 — Adopcja RelAI](#2026-10-03--adopcja-relai-wpis-zerowy)

## Wpisy

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
