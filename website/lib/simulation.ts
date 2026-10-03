import type { Category, LngLat, Report, Source } from "./types";

// Skrypty symulacji na prezentację: zdarzenie z kamery, wiadomość z Telegrama, telefon.
// Dane miasta (zgłoszenia, kamery, obiekty, dzielnice) są w bazie — database/*.sql.

/** Dzielnica pokazowa: jedna prosta historia na prezentację — awaria sieci wodnej w Podgórzu. */
export const SHOWCASE_SECTOR = "D13";

/** Zdarzenie wykryte przez orkiestrator kamer. */
export interface CameraEvent {
  title: string;
  description: string;
  category: Category;
  position: LngLat;
  cameraId: string;
  confidence: number;
  blocking?: boolean;
}

/** Scenariusze do symulacji orkiestratora kamer (demo na pitch). */
export const CAMERA_EVENTS: CameraEvent[] = [
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

/**
 * Alarm na prezentację („szczęśliwa ścieżka" — działa też bez bazy): park przy Tauron Arenie, obok food trucków
 * (Arena Garden Street Food Market). Mężczyzna wpadł w dziurę na alejce, upadł i zemdlał — w tej samej chwili
 * wpada wypadek (krytyczny, przejęty przez 112) i sama dziura (zwykłe). Lokalizacja z OpenStreetMap.
 */
export interface AlertSeed {
  title: string;
  description: string;
  category: Category;
  source: Source;
  position: LngLat;
  blocking: boolean;
  confidence: number;
  confirmations?: number;
  handledBy?: string;
}

export const ALERT_SCENARIO: AlertSeed[] = [
  {
    title: "Wypadek: mężczyzna zemdlał po upadku",
    description:
      "Park przy Tauron Arenie, alejka obok food trucków. Wpadł w dziurę w nawierzchni, upadł, stracił przytomność, krew z głowy. Zgłoszenie przejęte przez 112 — karetka w drodze.",
    category: "bezpieczenstwo",
    source: "telefon",
    position: [19.9944, 50.0679],
    blocking: false,
    confidence: 0.93,
    confirmations: 3,
    handledBy: "112 — PRM w drodze",
  },
  {
    title: "Dziura w alejce przy food truckach",
    description: "Park przy Tauron Arenie: głęboka dziura w nawierzchni alejki, niewidoczna po zmroku — ktoś już się przewrócił.",
    category: "drogi",
    source: "aplikacja",
    position: [19.9945, 50.06784],
    blocking: false,
    confidence: 0.86,
  },
];

let localSeq = 0;

/** Alarm bez serwera i bazy — te same zgłoszenia, zbudowane w przeglądarce (numery Z-DEMO-…). */
export function localAlertReports(now: number, sectorOf: (pos: LngLat) => string | null): Report[] {
  return ALERT_SCENARIO.map((s) => ({
    ...s,
    id: `Z-DEMO-${++localSeq}`,
    status: "nowe" as const,
    sector: sectorOf(s.position),
    createdAt: now,
    unitId: null,
    confirmations: s.confirmations ?? 1,
    handledBy: s.handledBy ?? null,
  }));
}
