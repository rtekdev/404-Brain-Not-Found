# Plan — 404 Brain Not Found (SMART CITY)

Koncepcja: [KONCEPCJA.md](KONCEPCJA.md).

## Ramy z regulaminu (Rules)

- Zespół 1–6 osób. Praca od **3.10, 11:00** do **4.10, 23:00** (w regulaminie wpisano „11:00 PM”, ale to raczej literówka — do potwierdzenia u organizatora). Zmiany po terminie nie są brane pod uwagę.
- Zgłoszenie: tytuł, nazwa zespołu, członkowie, opis, **PDF do 10 slajdów**. Opcjonalnie repo, demo, zrzuty. Język: PL lub EN.
- Platforma zgłoszeń: w regulaminie **HackTribe**, w opisie zadania **Challenge Rocket** — do potwierdzenia.
- Ocena dwuetapowa: 1) mentorzy oceniają zgłoszenie (próg nagrody: min. 50% punktów), 2) **pitch na żywo** finalistów przed jury.
- Kryteria: pomysł 30%, związek z kategorią 20%, użyteczność 20%, **design 20%**, kompletność 10%.
- Ujawniamy użycie AI, API, datasetów i bibliotek (OSM, CARTO, MapLibre, turf…). Musimy umieć obronić każdą decyzję techniczną.
- Prawa autorskie zostają przy nas.

## Kierunek wizualny

Praktyczny minimalizm, ciemna mapa, fiolet jako akcent:
- tło mapy grafitowe, miasto podświetlone granatem, granica w kolorze lawendowym z poświatą,
- sektory (dzielnice Krakowa, D-01): fioletowe linie i etykiety-pigułki `D01…D18`,
- pływające panele (ciemne, zaokrąglone, z cienką ramką): pasek górny (miasto, wyszukiwarka, Warstwy, Sektory), legenda w lewym dolnym rogu, zoom w prawym dolnym,
- kolory priorytetów: krytyczny czerwony, wysoki pomarańczowy, średni żółty, niski szary,
- dostępność: duży kontrast, cele kliknięcia ≥ 40 px, etykiety ARIA, obsługa z klawiatury.

## Etapy

### Etap 1 — Mapa główna (gotowe, dane demo w pamięci przeglądarki)
- [x] Onboarding miasta: `website/scripts/build-city.mjs` pobiera granicę i osiedla z OSM i generuje sektory (Voronoi przycięty do granicy) → `public/data/kielce/` (od D-01: dzielnice Krakowa → `public/data/krakow/`).
- [x] Mapa (MapLibre + CARTO Dark Matter): granica, maska poza miastem, sektory, etykiety.
- [x] Warstwy: kamery, zgłoszenia, infrastruktura/zasoby, dostępność.
- [x] Pasek górny: wyszukiwarka (osiedla, zgłoszenia), menu Warstwy, menu Sektory (przelot + podświetlenie).
- [x] Panel „Najważniejsze teraz”: zgłoszenia posortowane według priorytetu, ze źródłem (kamera / telefon / SMS / aplikacja) i jednostką.
- [x] Szczegóły zgłoszenia: klasyfikacja AI, przekazanie do jednostki, zmiana statusu.
- [x] Podgląd kamery (demo) z wykrytym obiektem.
- [x] „Zgłoś problem”: formularz z automatyczną klasyfikacją i wskazaniem miejsca na mapie.
- [x] „Symuluj zdarzenie z kamery”: demo orkiestratora na pitch.

### Etap 2 — Backend i AI
- API zgłoszeń (Next route handlers) i trwały zapis.
- Klasyfikacja i priorytetyzacja przez model językowy (obecnie heurystyka w `lib/priority.ts` i `lib/classify.ts`).
- Kanał telefon / SMS: transkrypcja → zgłoszenie (choćby jeden działający przykład).

### Etap 3 — Panel jednostek i zasoby
- Widok jednostki (np. Zieleń): kolejka zadań w jej sektorach.
- Import CSV/XLSX zasobów jednostki → warstwa na mapie.

### Etap 4 — Zgłoszenie
- Scenariusz demo (drzewo na jezdni → kamera → zgłoszenie → priorytet → jednostka zieleni → status).
- PDF do 10 slajdów, opis, lista użytych zasobów i AI, zrzuty ekranu.
