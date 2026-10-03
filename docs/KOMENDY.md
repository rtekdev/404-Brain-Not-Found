# KOMENDY — 404 Brain Not Found

RelAI 2.7.0

Nic z tej listy nie jest obowiązkowe. RelAI działa w zwykłej rozmowie — piszesz normalnie,
a struktura projektu nadąża. Komendy są skrótem do rzadszych operacji.

## Komendy

| Komenda | Co robi | Kiedy użyć |
|---|---|---|
| `/relai-stage` · `/relai-stage TEMAT E2` | znajduje aktywny plan i etap gotowy do startu, pokazuje, co się wydarzy, i czeka na Twoje „zaczynamy" | na początku sesji, w której robisz kolejny etap planu |
| `/relai-backup` | pakuje projekt do jednego pliku ZIP w Twoim folderze backupów; hasła i klucze zostają poza archiwum | przed większą zmianą albo raz na jakiś czas |
| `/relai-audit` | przegląda dokumenty i mówi, co się rozjechało, czego brakuje, co czeka — i proponuje, co z tym zrobić | po przerwie albo przed przekazaniem projektu |
| `/relai-changelog` | zamienia dziennik w listę zmian po ludzku | gdy ktoś pyta „co się zmieniło" |
| `/relai-handover` | składa pakiet przekazania: jeden plik HTML ze stanem, planami, ryzykami i pierwszymi krokami | gdy oddajesz projekt komuś innemu |
| `/relai-tour` | oprowadza po projekcie: co to jest, gdzie jesteśmy, od czego zacząć | gdy dołączasz do projektu albo wracasz po przerwie |
| `/relai-help` | pokazuje tę ściągę | gdy nie pamiętasz, co można wpisać |
| `/relai-adopt` | przenosi istniejący projekt na RelAI z backupem i raportem cofnięcia | w innym projekcie — ten jest już objęty |
| `/relai-update` | podnosi projekt do wersji zainstalowanego RelAI, pokazuje różnice i czeka na „tak" | gdy RelAI powie na starcie, że projekt jest starszy niż plugin |
| `/relai-branch` | odkłada boczny wątek: spisuje cel i przygotowuje prompt do nowej sesji | gdy wypływa coś ważnego, ale nie na teraz |
| `/relai-clean` · `/relai-clean raport` | pokazuje pliki robocze po zamkniętych etapach i kasuje tylko grupy, na które powiesz „tak" | gdy plików roboczych zrobiło się dużo |
| `/relai-models` | odświeża listę modeli narzędzia — pyta o zgodę na połączenie z siecią i pokazuje różnicę | gdy RelAI powie, że lista modeli jest stara |
| `/relai-crew` | robi z sesji koordynatora: dzieli cel na zadania dla kilku agentów, sprawdza ich wyniki krzyżowo; nic nie startuje bez „zaczynamy" | przy większym celu, który da się rozdzielić |
| `/relai-prompt` | zamienia podyktowane zdanie w precyzyjny prompt i pokazuje go obok oryginału; niczego nie wykonuje | gdy chcesz dopracować polecenie przed wykonaniem |

Pełna nazwa każdej z nich to `/relai:relai-…` (np. `/relai:relai-backup`) — wpisz `/relai` i wybierz
z podpowiedzi; skrócona forma działa tam, gdzie podpowiadacz ją rozwinie.

## Frazy, które działają

| Powiesz | Co się stanie |
|---|---|
| „kończymy na dziś" / „wrapping up" | RelAI domyka dokumenty, zapisuje wpis w dzienniku, aktualizuje ryzyka, proponuje commit i podsumowuje sesję |
| „kontynuujemy pracę" / „let's continue" | RelAI odtwarza kontekst z dokumentów, mówi, gdzie jesteśmy, i proponuje najbliższy krok |
| „sprawdź status" / „status check" | krótki raport: stan, plany i etapy, otwarte ryzyka, zaległości w dokumentach |
| „przygotuj plan…" / „zaplanuj…" / „rozpisz to na etapy" | plan w `docs/plany/` z etapami albo krótki miniplan w dzienniku |

## Czego RelAI pilnuje bez proszenia

- Po każdej zmianie funkcjonalnej aktualizuje `STATE.md` i dopisuje wpis do `DZIENNIK.md` — w tej samej turze.
- Po Twojej korekcie zapisuje lekcję w `LEKCJE.md`; gdy uwaga wraca, proponuje wpisać ją na stałe do reguł.
- Gdy ten sam temat rozstrzygasz drugi raz tak samo, proponuje zamrozić go jako decyzję.
- Gdy w trakcie etapu wypływa coś spoza zakresu, pyta: odnoga, aneks do planu czy odłożenie — zamiast robić to przy okazji.
- To, co czeka na Twoją decyzję, stoi na górze dziennika; sprawa starsza niż 30 dni wraca na starcie sesji jako pytanie.
- **Blokuje** zapis klucza, tokenu albo hasła do pliku trafiającego do repozytorium.
- Każdy wpis w dzienniku podpisuje modelem i Tobą (z konfiguracji gita).
- Nie nadpisuje i nie kasuje plików, których sam nie utworzył.
- Gdy dziennik albo lekcje urosną ponad próg, przenosi najstarszą historię do `docs/archiwum/` w całości.
- Ostrzega przed `console.log` w kodzie; w projekcie z TypeScriptem i ESLintem pokazuje ich błędy po edycji.
- Przy pierwszym kodzie zakłada opis architektury i pyta o testy, przy pierwszym ekranie pyta o kierunek wizualny, przy pierwszym wdrożeniu opisuje środowisko — dopiero wtedy, nie na zapas.
- Z backupu wyrzuca hasła i klucze i sprawdza to na gotowym archiwum.

Lista rośnie z kolejnymi wersjami RelAI. Numer wersji tego projektu znajdziesz
w [USTAWIENIA.md](USTAWIENIA.md).
