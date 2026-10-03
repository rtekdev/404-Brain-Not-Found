import { unitForCategory } from "./meta";
import type { AccessPoint, Asset, Camera, Category, Report, Source, Status } from "./types";

// Dane demonstracyjne (fikcyjne) dla Kielc. Sektory dopisywane są w kliencie
// na podstawie geometrii z public/data/kielce/sectors.geojson.

const MIN = 60_000;

export const CAMERAS: Camera[] = [
  {
    id: "K01", name: "Centrum · Rynek", position: [20.6298, 50.8697], sector: null, online: true,
    // Oficjalna kamera miasta na budynku UM (kielce.eu → Kamera – Rynek).
    live: { kind: "embed", src: "https://player.webcamera.pl/kielcerynek_cam_6913aa", credit: "WebCamera.pl" },
  },
  { id: "K02", name: "Warszawska / Żytnia", position: [20.6322, 50.8788], sector: null, online: true },
  { id: "K03", name: "Krakowska · wyjazd", position: [20.6055, 50.8482], sector: null, online: true },
  { id: "K04", name: "Rondo Czwartaków", position: [20.6196, 50.8663], sector: null, online: true },
  { id: "K05", name: "Al. Solidarności", position: [20.6498, 50.8712], sector: null, online: true },
  { id: "K06", name: "Zagnańska / Szydłówek", position: [20.6262, 50.8918], sector: null, online: true },
  {
    id: "K07", name: "Jagiellońska · Karczówka", position: [20.6022, 50.8672], sector: null, online: true,
    // Kamera WSEiP (widok na Karczówkę), zdjęcia przez Windy.com.
    live: {
      kind: "snapshot",
      src: "https://imgproxy.windy.com/_/preview/plain/current/1240732222/original.jpg?v=2",
      refreshSec: 60,
      credit: "Windy.com",
    },
  },
  { id: "K08", name: "Zagórze · pętla", position: [20.6628, 50.8590], sector: null, online: true },
  { id: "K09", name: "Czarnów · Grunwaldzka", position: [20.6050, 50.8790], sector: null, online: false },
  { id: "K10", name: "Barwinek", position: [20.6300, 50.8470], sector: null, online: true },
  { id: "K11", name: "Dąbrowa · Witosa", position: [20.6630, 50.9020], sector: null, online: true },
  { id: "K12", name: "Zalesie · Łódzka", position: [20.5520, 50.8530], sector: null, online: true },
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

const SEEDS: Seed[] = [
  {
    title: "Drzewo przewrócone na jezdnię",
    description: "Kamera wykryła powalone drzewo blokujące prawy pas w kierunku centrum.",
    category: "zielen", source: "kamera", status: "nowe", position: [20.6062, 50.8489],
    ago: 6, blocking: true, cameraId: "K03", confidence: 0.93, confirmations: 3,
  },
  {
    title: "Kolizja dwóch samochodów",
    description: "Zatrzymane pojazdy na skrzyżowaniu, ruch spowolniony.",
    category: "bezpieczenstwo", source: "kamera", status: "przekazane", position: [20.6494, 50.8716],
    ago: 14, blocking: true, cameraId: "K05", confidence: 0.88, confirmations: 2,
  },
  {
    title: "Wyciek wody z jezdni",
    description: "Woda wypływa spod asfaltu, tworzy się rozlewisko przy przystanku.",
    category: "woda", source: "telefon", status: "nowe", position: [20.6112, 50.8699],
    ago: 38, confirmations: 4, confidence: 0.82,
  },
  {
    title: "Głęboka dziura w jezdni",
    description: "Ubytek ok. 40 cm na prawym pasie, samochody omijają po przeciwnym pasie.",
    category: "drogi", source: "kamera", status: "nowe", position: [20.6327, 50.8783],
    ago: 52, cameraId: "K02", confidence: 0.91, confirmations: 2,
  },
  {
    title: "Nie działa winda na peron",
    description: "Osoby na wózkach nie mogą dostać się na peron 2.",
    category: "dostepnosc", source: "aplikacja", status: "nowe", position: [20.6177, 50.8733],
    ago: 95, blocking: true, confidence: 0.86,
  },
  {
    title: "Awaria sygnalizacji świetlnej",
    description: "Sygnalizacja miga na żółto na wszystkich wlotach.",
    category: "drogi", source: "kamera", status: "w_realizacji", position: [20.6199, 50.8660],
    ago: 70, cameraId: "K04", confidence: 0.84, confirmations: 5,
  },
  {
    title: "Zalana ulica po ulewie",
    description: "Woda na całej szerokości jezdni, studzienki nie odbierają wody.",
    category: "woda", source: "kamera", status: "nowe", position: [20.6258, 50.8921],
    ago: 21, blocking: true, cameraId: "K06", confidence: 0.79,
  },
  {
    title: "Przepełnione kontenery na odpady",
    description: "Worki leżą obok altany śmietnikowej od dwóch dni.",
    category: "odpady", source: "sms", status: "nowe", position: [20.6286, 50.8478],
    ago: 180, confirmations: 3, confidence: 0.9,
  },
  {
    title: "Ciemna ulica — nie świecą 4 latarnie",
    description: "Cały odcinek przy szkole bez oświetlenia po zmroku.",
    category: "oswietlenie", source: "aplikacja", status: "nowe", position: [20.6388, 50.8592],
    ago: 300, confirmations: 2, confidence: 0.88,
  },
  {
    title: "Nielegalne wysypisko gruzu",
    description: "Gruz i opony porzucone przy drodze leśnej.",
    category: "odpady", source: "messenger", status: "nowe", position: [20.6200, 50.8130],
    ago: 420, confidence: 0.83,
  },
  {
    title: "Uszkodzony podjazd przy przychodni",
    description: "Pęknięta płyta podjazdu, wózek klinuje się na krawędzi.",
    category: "dostepnosc", source: "telefon", status: "przekazane", position: [20.6412, 50.8889],
    ago: 240, confidence: 0.81,
  },
  {
    title: "Zapadnięty chodnik",
    description: "Zapadlisko przy przejściu dla pieszych, ryzyko potknięcia.",
    category: "drogi", source: "aplikacja", status: "nowe", position: [20.6095, 50.8771],
    ago: 130, confidence: 0.77,
  },
  {
    title: "Złamany znak drogowy",
    description: "Znak ustąp pierwszeństwa leży na trawniku.",
    category: "drogi", source: "sms", status: "nowe", position: [20.6615, 50.8601],
    ago: 160, confidence: 0.85,
  },
  {
    title: "Brak przejścia dla wózków — remont",
    description: "Ogrodzenie remontu zamyka jedyne obniżenie krawężnika.",
    category: "dostepnosc", source: "aplikacja", status: "nowe", position: [20.6302, 50.8702],
    ago: 65, blocking: true, confidence: 0.8, confirmations: 2,
  },
  {
    title: "Złamany konar nad chodnikiem",
    description: "Konar wisi nad ścieżką w parku, może spaść.",
    category: "zielen", source: "telefon", status: "nowe", position: [20.6575, 50.9010],
    ago: 110, confidence: 0.87,
  },
  {
    title: "Wymiana lampy zakończona",
    description: "Latarnia przy przystanku naprawiona.",
    category: "oswietlenie", source: "aplikacja", status: "zamkniete", position: [20.5530, 50.8520],
    ago: 900, confidence: 0.92,
  },
  {
    title: "Uszkodzony hydrant",
    description: "Hydrant przechylony po uderzeniu samochodu, lekki wyciek.",
    category: "woda", source: "telefon", status: "przekazane", position: [20.5870, 50.8960],
    ago: 200, confidence: 0.86,
  },
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
  { id: "A01", kind: "zbiornik", name: "Zbiornik Telegraf", position: [20.6405, 50.8445], sector: null, unitId: "woda", level: 78, levelLabel: "napełnienie 78%" },
  { id: "A02", kind: "przepompownia", name: "Przepompownia Białogon", position: [20.5540, 50.8545], sector: null, unitId: "woda", level: 92, levelLabel: "obciążenie 92%" },
  { id: "A03", kind: "przepompownia", name: "Przepompownia Sady", position: [20.6340, 50.8800], sector: null, unitId: "woda", level: 41, levelLabel: "obciążenie 41%" },
  { id: "A04", kind: "kontenery", name: "Gniazdo Barwinek", position: [20.6270, 50.8465], sector: null, unitId: "odpady", level: 97, levelLabel: "zapełnienie 97%" },
  { id: "A05", kind: "kontenery", name: "Gniazdo Szydłówek", position: [20.6430, 50.8900], sector: null, unitId: "odpady", level: 55, levelLabel: "zapełnienie 55%" },
  { id: "A06", kind: "kontenery", name: "Gniazdo Czarnów", position: [20.6030, 50.8810], sector: null, unitId: "odpady", level: 83, levelLabel: "zapełnienie 83%" },
  { id: "A07", kind: "trafostacja", name: "Stacja Śródmieście", position: [20.6260, 50.8730], sector: null, unitId: "energia", level: 64, levelLabel: "obciążenie 64%" },
  { id: "A08", kind: "trafostacja", name: "Stacja Zagórze", position: [20.6650, 50.8620], sector: null, unitId: "energia", level: 88, levelLabel: "obciążenie 88%" },
  { id: "A09", kind: "ladowarka", name: "Ładowarka EV Rynek", position: [20.6315, 50.8690], sector: null, unitId: "energia", level: 50, levelLabel: "1 z 2 stanowisk wolne" },
  { id: "A10", kind: "sprzet", name: "Zamiatarka #3", position: [20.6150, 50.8600], sector: null, unitId: "drogi", level: 100, levelLabel: "dostępna" },
  { id: "A11", kind: "sprzet", name: "Podnośnik koszowy #1", position: [20.6480, 50.8660], sector: null, unitId: "zielen", level: 0, levelLabel: "w użyciu" },
];

export const ACCESS_POINTS: AccessPoint[] = [
  { id: "D01", kind: "winda", name: "Winda — dworzec PKP, peron 2", position: [20.6180, 50.8737], sector: null, ok: false },
  { id: "D02", kind: "winda", name: "Winda — przejście podziemne", position: [20.6220, 50.8716], sector: null, ok: true },
  { id: "D03", kind: "toaleta", name: "Toaleta dostępna — Rynek", position: [20.6290, 50.8693], sector: null, ok: true },
  { id: "D04", kind: "podjazd", name: "Podjazd — Urząd, wejście B", position: [20.6345, 50.8712], sector: null, ok: true },
  { id: "D05", kind: "podjazd", name: "Podjazd — przychodnia Szydłówek", position: [20.6415, 50.8893], sector: null, ok: false },
  { id: "D06", kind: "przeszkoda", name: "Remont — zamknięte obniżenie krawężnika", position: [20.6306, 50.8705], sector: null, ok: false },
  { id: "D07", kind: "toaleta", name: "Toaleta dostępna — park miejski", position: [20.6255, 50.8668], sector: null, ok: true },
  { id: "D08", kind: "podjazd", name: "Podjazd — biblioteka", position: [20.6390, 50.8760], sector: null, ok: true },
];

/** Scenariusze do symulacji orkiestratora kamer (demo na pitch). */
export const CAMERA_EVENTS: Omit<Seed, "status" | "ago" | "source">[] = [
  {
    title: "Dziura w jezdni wykryta automatycznie",
    description: "Orkiestrator wykrył ubytek nawierzchni na pasie ruchu (seria 12 klatek).",
    category: "drogi", position: [20.6060, 50.8793], cameraId: "K09", confidence: 0.9,
  },
  {
    title: "Gałęzie na ścieżce rowerowej",
    description: "Wykryto przeszkodę na ścieżce rowerowej po silnym wietrze.",
    category: "zielen", position: [20.6632, 50.8594], cameraId: "K08", confidence: 0.86, blocking: true,
  },
  {
    title: "Dym nad budynkiem gospodarczym",
    description: "Wykryto zadymienie w kadrze, zalecana weryfikacja przez służby.",
    category: "bezpieczenstwo", position: [20.5525, 50.8535], cameraId: "K12", confidence: 0.81, blocking: false,
  },
  {
    title: "Rozlewisko na skrzyżowaniu",
    description: "Wykryto zbierającą się wodę na skrzyżowaniu, pojazdy zwalniają.",
    category: "woda", position: [20.6634, 50.9023], cameraId: "K11", confidence: 0.84, blocking: true,
  },
];
