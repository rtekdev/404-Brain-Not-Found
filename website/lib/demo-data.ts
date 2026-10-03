import { unitForCategory } from "./meta";
import type { AccessPoint, Asset, Camera, Category, LngLat, Report, Source, Status } from "./types";

// Dane demonstracyjne dla Krakowa. Lokalizacje i nazwy obiektów są prawdziwe, wartości pomiarów
// i zdarzenia — fikcyjne. Dzielnice (sektory) dopisywane są w kliencie na podstawie geometrii
// z public/data/krakow/sectors.geojson.

const MIN = 60_000;

/** Publiczna kamera WebCamera.pl — odtwarzacz można osadzić w iframe (sprawdzone 2026-10-03). */
const webcamera = (id: string) => ({ kind: "embed" as const, src: `https://player.webcamera.pl/${id}`, credit: "WebCamera.pl" });

export const CAMERAS: Camera[] = [
  { id: "K01", name: "Rynek Główny", position: [19.9373, 50.0617], sector: null, online: true, live: webcamera("krakow_cam_da9ab3") },
  { id: "K13", name: "Plac Wszystkich Świętych · Urząd Miasta", position: [19.9380, 50.0590], sector: null, online: true, live: webcamera("krakow_cam_6f3258") },
  { id: "K14", name: "ul. Floriańska", position: [19.9405, 50.0640], sector: null, online: true, live: webcamera("krakow_cam_904168") },
  { id: "K15", name: "Wawel · Zamek Królewski", position: [19.9352, 50.0543], sector: null, online: true, live: webcamera("krakow_cam_c78671") },
  { id: "K16", name: "Kazimierz · ul. Szeroka", position: [19.9480, 50.0522], sector: null, online: true, live: webcamera("szeroka_cam_7dabea") },
  { id: "K17", name: "Rynek Główny · Sukiennice", position: [19.9367, 50.0622], sector: null, online: true, live: webcamera("krakow_cam_702b61") },
  { id: "K02", name: "Rondo Mogilskie", position: [19.9592, 50.0662], sector: null, online: true },
  { id: "K03", name: "Rondo Ofiar Katynia", position: [19.8890, 50.0880], sector: null, online: true },
  { id: "K04", name: "Rondo Grunwaldzkie", position: [19.9365, 50.0478], sector: null, online: true },
  { id: "K05", name: "Rondo Matecznego", position: [19.9460, 50.0380], sector: null, online: true },
  { id: "K06", name: "Al. 29 Listopada / Opolska", position: [19.9560, 50.0890], sector: null, online: true },
  { id: "K07", name: "Plac Centralny", position: [20.0370, 50.0720], sector: null, online: true },
  { id: "K08", name: "Rondo Czyżyńskie", position: [20.0100, 50.0700], sector: null, online: true },
  { id: "K09", name: "Kurdwanów · Wielicka", position: [19.9700, 50.0130], sector: null, online: true },
  { id: "K10", name: "Ruczaj · Kobierzyńska", position: [19.9150, 50.0260], sector: null, online: true },
  { id: "K11", name: "Bieżanów · Teligi", position: [20.0200, 50.0180], sector: null, online: false },
  { id: "K12", name: "Mistrzejowice · Kocmyrzowska", position: [20.0080, 50.0960], sector: null, online: true },
];

interface Seed {
  title: string;
  description: string;
  category: Category;
  source: Source;
  status: Status;
  position: [number, number];
  ago: number;
  confirmations?: number;
  blocking?: boolean;
  cameraId?: string;
  confidence?: number;
}

/** Dzielnica pokazowa: jedna prosta historia na prezentację — awaria sieci wodnej w Podgórzu. */
export const SHOWCASE_SECTOR = "D13";

type S = Omit<Seed, "description"> & { description?: string };
const seed = (s: S): Seed => ({ description: s.title, ...s });

// Po dwa zgłoszenia na dzielnicę, dzielnica pokazowa (D13) — cztery.
const SEEDS: Seed[] = [
  // D01 Stare Miasto
  seed({ title: "Brak przejścia dla wózków — remont", description: "Ogrodzenie remontu zamyka jedyne obniżenie krawężnika przy Plantach.", category: "dostepnosc", source: "aplikacja", status: "nowe", position: [19.9400, 50.0600], ago: 65, blocking: true, confidence: 0.8, confirmations: 2 }),
  seed({ title: "Nie działa winda na peron", description: "Osoby na wózkach nie mogą dostać się na peron 2 dworca Kraków Główny.", category: "dostepnosc", source: "aplikacja", status: "nowe", position: [19.9475, 50.0675], ago: 95, blocking: true, confidence: 0.86 }),
  // D02 Grzegórzki
  seed({ title: "Awaria sygnalizacji na Rondzie Mogilskim", description: "Sygnalizacja miga na żółto na wszystkich wlotach ronda.", category: "drogi", source: "kamera", status: "w_realizacji", position: [19.9594, 50.0664], ago: 70, cameraId: "K02", confidence: 0.84, confirmations: 5 }),
  seed({ title: "Śmieci przy Bulwarze Kurlandzkim", description: "Przepełnione kosze, worki leżą na trawniku przy bulwarze.", category: "odpady", source: "sms", status: "nowe", position: [19.9664, 50.0587], ago: 140, confidence: 0.88 }),
  // D03 Prądnik Czerwony
  seed({ title: "Ciemna ulica na Rakowicach", description: "Nie świecą 4 latarnie przy szkole, po zmroku całkiem ciemno.", category: "oswietlenie", source: "aplikacja", status: "nowe", position: [19.9764, 50.0754], ago: 300, confirmations: 2, confidence: 0.88 }),
  seed({ title: "Głęboka dziura w jezdni", description: "Ubytek ok. 40 cm na prawym pasie, samochody omijają po przeciwnym pasie.", category: "drogi", source: "kamera", status: "nowe", position: [19.9563, 50.0887], ago: 52, cameraId: "K06", confidence: 0.91, confirmations: 2 }),
  // D04 Prądnik Biały
  seed({ title: "Drzewo przewrócone na jezdnię", description: "Kamera wykryła powalone drzewo blokujące prawy pas w kierunku centrum.", category: "zielen", source: "kamera", status: "nowe", position: [19.8895, 50.0884], ago: 6, blocking: true, cameraId: "K03", confidence: 0.93, confirmations: 3 }),
  seed({ title: "Uszkodzony podjazd przy przychodni", description: "Pęknięta płyta podjazdu, wózek klinuje się na krawędzi.", category: "dostepnosc", source: "telefon", status: "przekazane", position: [19.9205, 50.0953], ago: 240, confidence: 0.81 }),
  // D05 Krowodrza
  seed({ title: "Zapadnięty chodnik na Nowej Wsi", description: "Zapadlisko przy przejściu dla pieszych, ryzyko potknięcia.", category: "drogi", source: "aplikacja", status: "nowe", position: [19.9150, 50.0720], ago: 150, confidence: 0.77 }),
  seed({ title: "Rozbita wiata przystanku na Łobzowie", description: "Szkło na chodniku przy przystanku, ludzie stoją na jezdni.", category: "bezpieczenstwo", source: "sms", status: "nowe", position: [19.9090, 50.0748], ago: 45, confidence: 0.74 }),
  // D06 Bronowice
  seed({ title: "Zarośnięty chodnik w Bronowicach Małych", description: "Krzewy zasłaniają chodnik, piesi schodzą na jezdnię.", category: "zielen", source: "aplikacja", status: "nowe", position: [19.8785, 50.0876], ago: 230, confidence: 0.81 }),
  seed({ title: "Uszkodzony hydrant", description: "Hydrant przechylony po uderzeniu samochodu, lekki wyciek.", category: "woda", source: "telefon", status: "przekazane", position: [19.8800, 50.0800], ago: 200, confidence: 0.86 }),
  // D07 Zwierzyniec
  seed({ title: "Wymiana lampy zakończona", description: "Latarnia przy przystanku naprawiona.", category: "oswietlenie", source: "aplikacja", status: "zamkniete", position: [19.8900, 50.0560], ago: 900, confidence: 0.92 }),
  seed({ title: "Złamany konar nad ścieżką na Woli Justowskiej", description: "Konar wisi nad ścieżką w parku, może spaść.", category: "zielen", source: "telefon", status: "nowe", position: [19.8700, 50.0660], ago: 110, confidence: 0.87 }),
  // D08 Dębniki
  seed({ title: "Dziura na ścieżce rowerowej na Ruczaju", description: "Ubytek nawierzchni na ścieżce wzdłuż Kobierzyńskiej.", category: "drogi", source: "kamera", status: "nowe", position: [19.9152, 50.0258], ago: 85, cameraId: "K10", confidence: 0.85 }),
  seed({ title: "Śmieci obok altany na Osiedlu Podwawelskim", description: "Kontenery pełne od weekendu, worki leżą obok altany.", category: "odpady", source: "sms", status: "nowe", position: [19.9316, 50.0432], ago: 260, confirmations: 2, confidence: 0.9 }),
  // D09 Łagiewniki-Borek Fałęcki
  seed({ title: "Nie świeci oświetlenie przejścia przy Sanktuarium", description: "Przejście dla pieszych bez oświetlenia, kierowcy późno widzą pieszych.", category: "oswietlenie", source: "telefon", status: "nowe", position: [19.9406, 50.0222], ago: 190, confidence: 0.86 }),
  seed({ title: "Brak podjazdu przy przychodni na Borku", description: "Schody bez rampy, osoba na wózku nie wjedzie do przychodni.", category: "dostepnosc", source: "aplikacja", status: "nowe", position: [19.9278, 50.0138], ago: 400, confidence: 0.8 }),
  // D10 Swoszowice
  seed({ title: "Nielegalne wysypisko gruzu", description: "Gruz i opony porzucone przy drodze leśnej w Swoszowicach.", category: "odpady", source: "messenger", status: "nowe", position: [19.9450, 49.9800], ago: 420, confidence: 0.83 }),
  seed({ title: "Zalana droga w Rajsku", description: "Rów nie odbiera wody, droga zalana na długości 50 m.", category: "woda", source: "telefon", status: "nowe", position: [19.9702, 49.9867], ago: 75, blocking: true, confidence: 0.82 }),
  // D11 Podgórze Duchackie
  seed({ title: "Ciemna ulica na Kurdwanowie", description: "Cały odcinek przy szkole bez oświetlenia po zmroku.", category: "oswietlenie", source: "aplikacja", status: "nowe", position: [19.9650, 50.0090], ago: 300, confirmations: 2, confidence: 0.88 }),
  seed({ title: "Uszkodzona barierka przy przejściu na Woli Duchackiej", description: "Barierka oddzielająca chodnik od jezdni leży na ziemi.", category: "bezpieczenstwo", source: "sms", status: "nowe", position: [19.9615, 50.0202], ago: 160, confidence: 0.76 }),
  // D12 Bieżanów-Prokocim
  seed({ title: "Przepełnione kontenery na odpady", description: "Worki leżą obok altany śmietnikowej na os. Na Kozłówce od dwóch dni.", category: "odpady", source: "sms", status: "nowe", position: [20.0165, 50.0205], ago: 180, confirmations: 3, confidence: 0.9 }),
  seed({ title: "Zerwany kabel oświetlenia na Bieżanowie", description: "Kabel latarni zwisa nad chodnikiem przy przystanku.", category: "oswietlenie", source: "telefon", status: "nowe", position: [20.0296, 50.0140], ago: 35, confidence: 0.84 }),
  // D13 Podgórze — dzielnica pokazowa: awaria sieci wodnej
  seed({ title: "Wyciek wody z jezdni", description: "Woda wypływa spod asfaltu na Zabłociu, tworzy się rozlewisko przy przystanku.", category: "woda", source: "telefon", status: "nowe", position: [19.9640, 50.0480], ago: 38, confirmations: 4, confidence: 0.82 }),
  seed({ title: "Niskie ciśnienie wody w kranach", description: "Na Płaszowie od rana ledwo leci woda, w kilku blokach na wyższych piętrach brak wody.", category: "woda", source: "sms", status: "nowe", position: [19.9935, 50.0395], ago: 50, confirmations: 6, confidence: 0.86 }),
  seed({ title: "Mokra plama na chodniku przy Lipowej", description: "Chodnik cały czas mokry, mimo że nie padało.", category: "woda", source: "aplikacja", status: "nowe", position: [19.9745, 50.0505], ago: 120, confidence: 0.72 }),
  seed({ title: "Kolizja dwóch samochodów", description: "Zatrzymane pojazdy na rondzie, tramwaje stoją w obu kierunkach.", category: "bezpieczenstwo", source: "kamera", status: "przekazane", position: [19.9463, 50.0383], ago: 14, blocking: true, cameraId: "K05", confidence: 0.88, confirmations: 2 }),
  // D14 Czyżyny
  seed({ title: "Zalana ulica po ulewie", description: "Woda na całej szerokości jezdni, studzienki nie odbierają wody.", category: "woda", source: "kamera", status: "nowe", position: [20.0103, 50.0702], ago: 21, blocking: true, cameraId: "K08", confidence: 0.79 }),
  seed({ title: "Złamany znak drogowy", description: "Znak ustąp pierwszeństwa leży na trawniku.", category: "drogi", source: "sms", status: "nowe", position: [20.0050, 50.0650], ago: 160, confidence: 0.85 }),
  // D15 Mistrzejowice
  seed({ title: "Złamany konar nad chodnikiem", description: "Konar wisi nad chodnikiem przy szkole, może spaść.", category: "zielen", source: "telefon", status: "nowe", position: [20.0175, 50.0990], ago: 110, confidence: 0.87 }),
  seed({ title: "Zepsuta winda w bloku na Osiedlu Tysiąclecia", description: "Mieszkanka na wózku nie może wyjść z mieszkania na 8. piętrze.", category: "dostepnosc", source: "aplikacja", status: "nowe", position: [20.0024, 50.0911], ago: 90, blocking: true, confidence: 0.83 }),
  // D16 Bieńczyce
  seed({ title: "Dzikie wysypisko przy Zalewie Nowohuckim", description: "Meble i worki ze śmieciami porzucone przy alejce nad zalewem.", category: "odpady", source: "messenger", status: "nowe", position: [20.0480, 50.0828], ago: 330, confidence: 0.84 }),
  seed({ title: "Nie działa sygnalizacja dla pieszych", description: "Przycisk na przejściu nie reaguje, zielone się nie zapala.", category: "drogi", source: "aplikacja", status: "nowe", position: [20.0152, 50.0822], ago: 55, confidence: 0.8 }),
  // D17 Wzgórza Krzesławickie
  seed({ title: "Powalone drzewo na drodze w Grębałowie", description: "Drzewo leży w poprzek jezdni po nocnej wichurze.", category: "zielen", source: "telefon", status: "nowe", position: [20.0750, 50.0971], ago: 25, blocking: true, confidence: 0.9 }),
  seed({ title: "Brak oświetlenia przystanku w Łuczanowicach", description: "Przystanek autobusowy całkowicie ciemny po zmroku.", category: "oswietlenie", source: "sms", status: "nowe", position: [20.1106, 50.1081], ago: 280, confidence: 0.82 }),
  // D18 Nowa Huta
  seed({ title: "Uszkodzona nawierzchnia przy Placu Centralnym", description: "Wyrwa w asfalcie przy torowisku, samochody hamują gwałtownie.", category: "drogi", source: "kamera", status: "nowe", position: [20.0368, 50.0716], ago: 40, cameraId: "K07", confidence: 0.87 }),
  seed({ title: "Zalana piwnica w Mogile", description: "Woda w piwnicach bloku po awarii rury, mieszkańcy proszą o pomoc.", category: "woda", source: "telefon", status: "w_realizacji", position: [20.0627, 50.0621], ago: 210, confidence: 0.85 }),
];

export function buildReports(now = Date.now()): Report[] {
  return SEEDS.map((s, i) => ({
    id: `Z-${String(1024 + i)}`,
    title: s.title,
    description: s.description,
    category: s.category,
    source: s.source,
    status: s.status,
    position: s.position,
    sector: null,
    createdAt: now - s.ago * MIN,
    unitId: s.status === "nowe" ? null : unitForCategory(s.category).id,
    confirmations: s.confirmations ?? 1,
    blocking: s.blocking ?? false,
    cameraId: s.cameraId,
    confidence: s.confidence ?? 0.7,
  }));
}

export const ASSETS: Asset[] = [
  { id: "A01", kind: "zbiornik", name: "Zbiorniki wody Kosocice", position: [19.9900, 49.9930], sector: null, unitId: "woda", level: 78, levelLabel: "napełnienie 78%", meters: [{ metric: "woda", primary: 0, secondary: 900 }] },
  { id: "A02", kind: "przepompownia", name: "Zakład Uzdatniania Wody Bielany", position: [19.8420, 50.0430], sector: null, unitId: "woda", level: 92, levelLabel: "obciążenie 92%", meters: [{ metric: "woda", primary: 0, secondary: 1400 }, { metric: "energia", primary: 0.9, secondary: 0 }] },
  { id: "A03", kind: "przepompownia", name: "Zakład Uzdatniania Wody Rudawa", position: [19.8650, 50.0820], sector: null, unitId: "woda", level: 41, levelLabel: "obciążenie 41%", meters: [{ metric: "woda", primary: 0, secondary: 850 }, { metric: "energia", primary: 0.5, secondary: 0 }] },
  { id: "A04", kind: "kontenery", name: "Gniazdo os. Na Kozłówce", position: [20.0170, 50.0200], sector: null, unitId: "odpady", level: 97, levelLabel: "zapełnienie 97%", meters: [{ metric: "odpady", primary: 6.1, secondary: 2.8 }] },
  { id: "A05", kind: "kontenery", name: "Gniazdo Mistrzejowice", position: [20.0060, 50.0990], sector: null, unitId: "odpady", level: 55, levelLabel: "zapełnienie 55%", meters: [{ metric: "odpady", primary: 7.4, secondary: 7.2 }] },
  { id: "A06", kind: "kontenery", name: "Gniazdo Kurdwanów", position: [19.9620, 50.0110], sector: null, unitId: "odpady", level: 83, levelLabel: "zapełnienie 83%", meters: [{ metric: "odpady", primary: 5.0, secondary: 4.2 }] },
  { id: "A07", kind: "trafostacja", name: "Stacja Stare Miasto", position: [19.9420, 50.0640], sector: null, unitId: "energia", level: 64, levelLabel: "obciążenie 64%", meters: [{ metric: "energia", primary: 38, secondary: 0 }] },
  { id: "A08", kind: "trafostacja", name: "Stacja Bieżanów", position: [20.0300, 50.0150], sector: null, unitId: "energia", level: 88, levelLabel: "obciążenie 88%", meters: [{ metric: "energia", primary: 29, secondary: 0 }] },
  { id: "A09", kind: "ladowarka", name: "Ładowarka EV Rondo Mogilskie", position: [19.9600, 50.0650], sector: null, unitId: "energia", level: 50, levelLabel: "2 z 4 stanowisk wolne", meters: [{ metric: "energia", primary: 0.15, secondary: 0 }] },
  { id: "A10", kind: "sprzet", name: "Zamiatarka #3", position: [19.9500, 50.0550], sector: null, unitId: "drogi", level: 100, levelLabel: "dostępna" },
  { id: "A11", kind: "sprzet", name: "Podnośnik koszowy #1", position: [19.9900, 50.0800], sector: null, unitId: "zielen", level: 0, levelLabel: "w użyciu" },
  { id: "A12", kind: "fotowoltaika", name: "Farma PV Przylasek Rusiecki", position: [20.1300, 50.0650], sector: null, unitId: "energia", level: 71, levelLabel: "moc chwilowa 71%", meters: [{ metric: "energia", primary: 0, secondary: 12 }] },
  { id: "A13", kind: "fotowoltaika", name: "Farma PV Wzgórza Krzesławickie", position: [20.0950, 50.1000], sector: null, unitId: "energia", level: 66, levelLabel: "moc chwilowa 66%", meters: [{ metric: "energia", primary: 0, secondary: 14 }] },
  { id: "A14", kind: "elektrocieplownia", name: "Elektrociepłownia Kraków (Łęg)", position: [20.0200, 50.0610], sector: null, unitId: "energia", level: 74, levelLabel: "obciążenie 74%", meters: [{ metric: "energia", primary: 0, secondary: 180 }, { metric: "cieplo", primary: 0, secondary: 1300 }] },
  { id: "A15", kind: "spalarnia", name: "Zakład Termicznego Przekształcania Odpadów", position: [20.0800, 50.0650], sector: null, unitId: "odpady", level: 81, levelLabel: "przepustowość 81%", meters: [{ metric: "energia", primary: 0, secondary: 9 }, { metric: "cieplo", primary: 0, secondary: 120 }, { metric: "odpady", primary: 0, secondary: 600 }] },
];

export const ACCESS_POINTS: AccessPoint[] = [
  { id: "P01", kind: "winda", name: "Winda — dworzec Kraków Główny, peron 2", position: [19.9475, 50.0675], sector: null, ok: false },
  { id: "P02", kind: "winda", name: "Winda — tunel pod dworcem", position: [19.9440, 50.0660], sector: null, ok: true },
  { id: "P03", kind: "toaleta", name: "Toaleta dostępna — Sukiennice", position: [19.9370, 50.0615], sector: null, ok: true },
  { id: "P04", kind: "podjazd", name: "Podjazd — Urząd Miasta, pl. Wszystkich Świętych", position: [19.9385, 50.0590], sector: null, ok: true },
  { id: "P05", kind: "podjazd", name: "Podjazd — przychodnia Prądnik Biały", position: [19.9205, 50.0953], sector: null, ok: false },
  { id: "P06", kind: "przeszkoda", name: "Remont — zamknięte obniżenie krawężnika", position: [19.9403, 50.0602], sector: null, ok: false },
  { id: "P07", kind: "toaleta", name: "Toaleta dostępna — Park Jordana", position: [19.9160, 50.0630], sector: null, ok: true },
  { id: "P08", kind: "podjazd", name: "Podjazd — Biblioteka Kraków, Rajska", position: [19.9300, 50.0630], sector: null, ok: true },
];

/** Scenariusze do symulacji orkiestratora kamer (demo na pitch). */
export const CAMERA_EVENTS: Omit<Seed, "status" | "ago" | "source">[] = [
  {
    title: "Dziura w jezdni wykryta automatycznie",
    description: "Orkiestrator wykrył ubytek nawierzchni na pasie ruchu (seria 12 klatek).",
    category: "drogi", position: [19.9703, 50.0133], cameraId: "K09", confidence: 0.9,
  },
  {
    title: "Gałęzie na ścieżce rowerowej",
    description: "Wykryto przeszkodę na ścieżce rowerowej po silnym wietrze.",
    category: "zielen", position: [19.9155, 50.0262], cameraId: "K10", confidence: 0.86, blocking: true,
  },
  {
    title: "Dym nad budynkiem gospodarczym",
    description: "Wykryto zadymienie w kadrze, zalecana weryfikacja przez służby.",
    category: "bezpieczenstwo", position: [20.0375, 50.0723], cameraId: "K07", confidence: 0.81, blocking: false,
  },
  {
    title: "Rozlewisko na skrzyżowaniu",
    description: "Wykryto zbierającą się wodę na skrzyżowaniu, pojazdy zwalniają.",
    category: "woda", position: [20.0083, 50.0963], cameraId: "K12", confidence: 0.84, blocking: true,
  },
];

export interface IntakeLine {
  who: "mieszkaniec" | "bot";
  text: string;
}

/** Scenariusze prezentacji: zgłoszenie przychodzi Telegramem albo telefonem i trafia do dzielnicy pokazowej. */
export interface IntakeScenario {
  channel: "telegram" | "telefon";
  sender: string;
  /** Przebieg rozmowy pokazywany na ekranie. */
  lines: IntakeLine[];
  /** Tekst analizowany przez AI — wiadomość albo słowa mieszkańca z transkrypcji. */
  text: string;
  /** Pinezka wysłana z Telegrama. */
  location?: LngLat;
  /** Gdzie ma wylądować zgłoszenie — sprawdzane w testach. */
  expectedPosition: LngLat;
}

const TELEGRAM_TEXT = "Woda tryska spod asfaltu przy Lipowej na Zabłociu! Zrobiło się jezioro, auta jadą środkiem.";
const PHONE_TEXT = "Od rana nie mamy wody w całym bloku na Starym Podgórzu. Limanowskiego 24, sąsiedzi też nie mają wody.";

export const INTAKE_SCENARIOS: IntakeScenario[] = [
  {
    channel: "telegram",
    sender: "@ania_zablocie",
    lines: [
      { who: "mieszkaniec", text: TELEGRAM_TEXT },
      { who: "mieszkaniec", text: "📍 Lokalizacja: ul. Lipowa, Zabłocie" },
    ],
    text: TELEGRAM_TEXT,
    location: [19.9752, 50.0498],
    expectedPosition: [19.9752, 50.0498],
  },
  {
    channel: "telefon",
    sender: "+48 600 *** 214",
    lines: [
      { who: "bot", text: "Centrum zgłoszeń SWIMM, w czym możemy pomóc?" },
      { who: "mieszkaniec", text: "Od rana nie mamy wody w całym bloku na Starym Podgórzu." },
      { who: "bot", text: "Proszę podać adres." },
      { who: "mieszkaniec", text: "Limanowskiego 24, sąsiedzi też nie mają wody." },
      { who: "bot", text: "Dziękujemy, zgłoszenie przyjęte. Wyślemy SMS z numerem." },
    ],
    text: PHONE_TEXT,
    expectedPosition: [19.9505, 50.0438],
  },
];
