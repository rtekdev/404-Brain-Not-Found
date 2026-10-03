import type { Category, LngLat, Report, Source } from "./types";

// Skrypt alarmu na prezentację („Symuluj alarm").
// Dane miasta (zgłoszenia, kamery, obiekty, dzielnice) są w bazie — database/*.sql.

/** Dzielnica pokazowa: jedna prosta historia na prezentację — awaria sieci wodnej w Podgórzu. */
export const SHOWCASE_SECTOR = "D13";

/** Scenariusz alarmu jest napisany pod Kraków (park przy Tauron Arenie, D14, kamera K18). */
export const SCRIPTED_CITY = "krakow";

/**
 * Alarm na prezentację („szczęśliwa ścieżka" — działa też bez bazy): park przy Tauron Arenie (D14). Kamera K18
 * widzi człowieka, który osunął się na ławce i nie reaguje — jedno krytyczne zgłoszenie, pogotowie już powiadomione.
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
  cameraId?: string;
  handledBy?: string;
}

export const ALERT_SCENARIO: AlertSeed[] = [
  {
    title: "Człowiek na ławce — prawdopodobne zasłabnięcie",
    description:
      "Park przy Tauron Arenie: mężczyzna osunął się na ławce i od kilku minut się nie porusza. Kamera wykryła nietypową pozycję ciała. Pogotowie ratunkowe zostało powiadomione.",
    category: "bezpieczenstwo",
    source: "kamera",
    position: [19.9944, 50.0679],
    blocking: false,
    confidence: 0.88,
    cameraId: "K18",
    handledBy: "112 — pogotowie powiadomione",
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
