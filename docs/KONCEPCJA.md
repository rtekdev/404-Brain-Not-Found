# Koncepcja — 404 Brain Not Found (HackYeah, zadanie SMART CITY)

## W jednym zdaniu

Oprogramowanie dla miast, które w jednym miejscu łączy zarządzanie zasobami i infrastrukturą, zgłoszenia od mieszkańców i z kamer oraz reagowanie na awarie. Całość opiera się na danych miejskich, a model językowy priorytetyzuje najważniejsze wydarzenia.

## Pokrycie obszarów zadania (5/6)

| Obszar z zadania | Pokrycie |
|---|---|
| Transport i planowanie podróży | ✗ (świadomie poza zakresem) |
| Dostępność przestrzeni i usług | ✓ |
| Zarządzanie energią, wodą, odpadami, wspólną infrastrukturą | ✓ |
| Komunikacja mieszkańcy ↔ instytucje | ✓ **(mocny nacisk)** |
| Wykorzystanie danych miejskich do decyzji | ✓ (fundament całego systemu) |
| Reagowanie na awarie i utrudnienia | ✓ **(mocny nacisk)** |

## Filary rozwiązania

### 1. Szybkie wdrożenie dla dowolnego miasta
- Miasto startuje bez wdrożeniowego projektu IT: granica miasta, dzielnice i ulice pobierane są automatycznie z danych mapowych (koncepcyjnie Google Maps).
- Miasto tworzy **podzespoły / jednostki** dla różnych usług (np. drogi, zieleń, wodociągi, odpady) i przypisuje im obszary.
- Zgłoszenia i zadania trafiają do właściwych jednostek.
- **Integracje z danymi jednostek**: import z Excela / systemów wewnętrznych. Nie znamy ich systemów, więc w pitchu to **kierunek rozwoju**, a w demo np. import CSV/XLSX.

### 2. Kamery miejskie i orkiestrator zgłoszeń
- Podpinamy istniejący monitoring miejski.
- Orkiestrator analizuje obraz i **automatycznie tworzy zgłoszenia**, np. dziura w drodze albo drzewo na jezdni. Wpis od razu pojawia się w systemie i na mapie.

### 3. Wielokanałowe zgłoszenia od mieszkańców
- Aplikacja / strona.
- Telefon na wskazany numer (rozmowa → zgłoszenie).
- Messenger / SMS (koncept do wdrożenia).

### 4. Warstwa AI — klasyfikacja i priorytety
- Za mapą, zasobami i zgłoszeniami stoi model językowy („Jev” lub inny LM), który szybko i tanio:
  - klasyfikuje zgłoszenia (kategoria, jednostka, lokalizacja),
  - wyciąga na pierwszy plan najważniejsze informacje i wydarzenia w mieście.

## Do ustalenia

- Zakres MVP na demo: które filary pokazujemy działające, a które jako mock / koncept.
- Źródło danych mapowych (Google Maps vs OpenStreetMap — koszty, licencja).
- Model AI („Jev” — doprecyzować) i model do analizy obrazu z kamer.
- Scenariusz demo: jedna konkretna sytuacja (np. drzewo przewrócone na ulicę → kamera → zgłoszenie → priorytet → jednostka zieleni).
