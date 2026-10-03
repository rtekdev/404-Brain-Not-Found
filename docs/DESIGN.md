# DESIGN — 404 Brain Not Found („Puls Miasta")

Stan na: 2026-10-03

## Kierunek

Odpowiedź na pytanie o kierunek (2026-10-03): „Ciemne centrum dowodzenia — ciemna mapa, fioletowy
akcent, świecące przepływy. Kojarzy się z pulpitem dyspozytora, który działa na żywo."

Mapa jest sceną, panele unoszą się nad nią jak szkło. Kolor niesie znaczenie (priorytet, miara),
nie dekorację. Ruch pokazuje, że dane płyną na żywo.

## Tokeny

| Nazwa | Wartość | Gdzie używane |
|---|---|---|
| `--background` | `#15171c` | tło strony |
| `--foreground` | `#eceef3` | tekst podstawowy |
| `--panel` | `rgb(24 26 33 / 0.92)` + blur 10 px | panele „glass" nad mapą |
| `--panel-hover` | `#242733` | najechanie, aktywna zakładka |
| `--line` | `#2c303c` | obramowania, separatory |
| `--muted` / `--subtle` | `#9aa0b0` / `#6b7180` | tekst drugorzędny / etykiety |
| `--accent` / `--accent-soft` / `--accent-ink` | `#8b5cf6` / `#a78bfa` / `#ede9fe` | akcja główna, sektory, AI |
| `--cyan` | `#22d3ee` | obiekty (zasoby) |
| Priorytety | krytyczny `#f43f5e`, wysoki `#f59e0b`, średni `#eab308`, niski `#94a3b8` | znaczniki i plakietki zgłoszeń |
| Miary | energia `#facc15`, woda `#22d3ee`, odpady `#4ade80`, ciepło `#fb923c` | przepływy, wykresy, wartości w widoku Zasoby |
| Krój | Geist Sans, Geist Mono (identyfikatory) | całość |
| Promień | 6 px (pola, plakietki), 8 px (przyciski), 12 px (panele, karty) | — |

## Komponenty

| Komponent | Warianty | Zasada |
|---|---|---|
| Panel „glass" | pasek górny, panel boczny, legenda, okienko na mapie | wszystko, co unosi się nad mapą |
| Przycisk | główny (fiolet), obramowany, ikonowy | jeden główny na widok panelu |
| Zakładki | widok (Zgłoszenia/Zasoby), miara, filtr listy | zakładka widoku zmienia też warstwy mapy |
| Plakietka | priorytet, sektor, przekierowanie | kolor zawsze z tokenu priorytetu albo miary |
| Karta wniosków AI | jedna (fioletowa ramka) | tylko treści wyliczone przez reguły/model, z odnośnikiem do zgłoszenia |
| Zyski / Straty | zielona / bursztynowa karta | wycena zawsze pokazuje obie strony i bilans netto |

## Stany

- **Ładowanie:** napis „Ładowanie mapy miasta…" na środku, bez wirującej ikony.
- **Pustka:** zdanie w liście („Brak zgłoszeń w tym widoku", „Brak opomiarowanych obiektów…").
- **Błąd:** brak osobnego stanu — dane są lokalne; awaria podkładu zostawia warstwy aplikacji.
- **Ryzyko:** czerwona ramka z ikoną ostrzeżenia, gdy akcja szkodzi źródłu (przekierowanie ponad nadwyżkę).

## Ruch

Pulsujący pierścień przy krytycznych zgłoszeniach i przy centrali (1,6–2,2 s), kropki płynące
wzdłuż łuków przepływu (0,9–2,8 s — szybciej przy większej wartości), wjazd paneli 0,25 s,
lot kamery mapy 0,9 s. `prefers-reduced-motion: reduce` wyłącza pulsowanie, przepływy i wjazdy.

## Siatka i responsywność

Od 640 px panel boczny 380 px po prawej, mapa pod spodem na całą szerokość. Poniżej 640 px panel
jest dolną szufladą do 60% wysokości, zwijaną strzałką; legenda chowa się poniżej 768 px.

## Dostępność

Widoczny fokus — obwódka `--accent-soft` 2 px. Zakładki z `role="tab"` i `aria-selected`,
znaczniki mapy jako przyciski z opisem. Cele dotykowe na mapie 28–32 px (mniejsze niż 44 px —
kompromis gęstości mapy). Kontrast nie był mierzony narzędziem.

## Czego świadomie nie robimy

- **Trybu jasnego** — demo to pulpit dyspozytora; jasny motyw nie jest w zakresie hackathonu.
- **Wykresów z biblioteki** — jedna mini-linia w SVG wystarcza; biblioteka wykresów to zbędny ciężar.
