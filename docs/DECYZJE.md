# DECYZJE — 404 Brain Not Found

Decyzji z tego rejestru **nie proponuje się ponownie**. Zmiana wymaga jawnej prośby i nowego wpisu
z datą oraz powodem.

Rejestr startuje pusty, bo projekt przeszedł adopcję 2026-10-03: rozstrzygnięcia sprzed niej żyją
w `CLAUDE.md`, w sekcji „Zasady projektu (odziedziczone)". Każde rozstrzygnięcie podjęte po adopcji
zapisuje się tutaj jako `D-NN`.

## D-03 — Kielce wracają jako drugie miasto, z przełącznikiem miast

Data: 2026-10-03 · Decyzja człowieka · Zmienia D-01

Na mapie urzędu można przełączać miasto (Kraków ↔ Kielce) w górnym pasku; adres `/centrum?miasto=kielce`.
Kraków zostaje miastem domyślnym i jedynym ze scenariuszami Telegrama, telefonu i alarmu (dzielnica
pokazowa D13) — w Kielcach działa tylko pokaz kamery, a „Symuluj alarm" przełącza na Kraków. Dane Kielc
(`database/04-kielce.sql`) odzyskane z historii git: granica i osiedla z OSM, 9 umownych sektorów S01–S09
(Kielce nie mają dzielnic), kamery, zgłoszenia i obiekty fikcyjne. Obiekty należą do miasta przez sektor.

## D-02 — Tylko zadanie SMART CITY, nazwa SWIMM, Telegram zamiast Messengera

Data: 2026-10-03 · Decyzja człowieka

Nie startujemy w zadaniu „Kraków bez barier" — to inny produkt (narzędzie dla turystów z wymogiem
wiarygodności danych, bez dostępu do systemów miasta), a łączenie osłabiłoby oba zgłoszenia.
Odnoga „planer wycieczek z alertami o incydentach" zostaje jako kierunek w SMART CITY (obszar
transportu). Aplikacja nazywa się SWIMM — System Wspierania i Monitorowania Miasta (wcześniej
„Puls Miasta"). Kanałem komunikatora jest Telegram, nie Messenger. Strona główna to prosty landing
kontaktowy z czatem AI; panel urzędu jest pod `/centrum`.

## D-01 — Miastem demo jest Kraków, sektory to dzielnice

Data: 2026-10-03 · Decyzja człowieka

Rezygnujemy z Kielc; cała aplikacja i dane pokazowe dotyczą Krakowa. Sektory to 18 dzielnic
samorządowych (D01 Stare Miasto … D18 Nowa Huta) pobranych z OpenStreetMap, a nie sztuczny podział
Voronoi — urząd myśli dzielnicami, więc demo mówi jego językiem. Dane Kielc usunięte z repozytorium
(są w historii git).
