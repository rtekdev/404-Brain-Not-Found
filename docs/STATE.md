# STATE — 404 Brain Not Found

Stan na: 2026-10-03

## Gdzie jesteśmy

Budujemy na hackathon HackYeah (zadanie SMART CITY) „Puls Miasta" — jedną mapę miasta dla
urzędu, na której widać zgłoszenia od mieszkańców i z kamer, zasoby miejskie i dostępność, a sztuczna
inteligencja wyciąga na wierzch to, co najpilniejsze. Pierwszy ekran — mapa Kielc z panelem
zdarzeń — działa lokalnie na danych pokazowych. Praca nad nim nie jest jeszcze zapisana we wspólnym
repozytorium. Termin zgłoszenia: 4 października, 23:00.

## Co działa

- Dyspozytor widzi Kielce podzielone na 9 sektorów, z granicą miasta pobraną automatycznie z otwartych map.
- Na mapie są zgłoszenia, kamery, zasoby (zbiorniki, kontenery, stacje) i punkty dostępności; warstwy można włączać i wyłączać.
- Panel „Najważniejsze teraz" układa zgłoszenia od najpilniejszego i pokazuje, skąd przyszły (kamera, telefon, SMS, aplikacja, Messenger).
- Dyspozytor przekazuje zgłoszenie właściwej jednostce i zmienia jego status.
- Mieszkaniec zgłasza problem, wskazując miejsce na mapie; kategoria rozpoznaje się podczas pisania.
- Pokaz „symuluj kamerę" tworzy zgłoszenie tak, jakby wykryła je kamera — na potrzeby prezentacji.

## Nad czym pracujemy teraz

- Mapa główna jest gotowa, ale czeka na zapisanie i połączenie z pracą drugiej osoby w zespole — żeby obie części aplikacji działały razem.

## Co dalej

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
| lokalne | http://localhost:3000 | działa (`npm run dev` w `website/`) |
| produkcja / demo | — | nie wdrożone |

### Wersje

Node.js 24 (min. 20.9) • Next.js 16.3.8 • React 19.2 • TypeScript 5 • Tailwind 4 • MapLibre GL 6.11 • Turf 7.4

### Dane zewnętrzne

Granica i osiedla: OpenStreetMap (Nominatim, Overpass, ODbL) • Podkład mapy: CARTO Dark Matter.

### Linki

Repo: github.com/rtekdev/404-Brain-Not-Found • Koncepcja: [KONCEPCJA.md](KONCEPCJA.md) • Plan hackathonowy: [PLAN.md](PLAN.md)
