export type LngLat = [number, number];

export type Category =
  | "drogi"
  | "zielen"
  | "woda"
  | "odpady"
  | "oswietlenie"
  | "dostepnosc"
  | "bezpieczenstwo"
  | "inne";

export type Source = "kamera" | "telefon" | "sms" | "aplikacja" | "messenger";

export type Status = "nowe" | "przekazane" | "w_realizacji" | "zamkniete";

export type Priority = "krytyczny" | "wysoki" | "sredni" | "niski";

export interface Unit {
  id: string;
  name: string;
  short: string;
  categories: Category[];
}

export interface Report {
  id: string;
  title: string;
  description: string;
  category: Category;
  source: Source;
  status: Status;
  position: LngLat;
  sector: string | null;
  createdAt: number;
  unitId: string | null;
  /** Ile osób / zgłoszeń dotyczy tego samego problemu. */
  confirmations: number;
  /** Czy blokuje ruch, przejście lub dostęp do usługi. */
  blocking: boolean;
  cameraId?: string;
  /** Pewność klasyfikacji 0–1 (z orkiestratora kamer lub modelu językowego). */
  confidence: number;
}

export interface Camera {
  id: string;
  name: string;
  position: LngLat;
  sector: string | null;
  online: boolean;
  /** Prawdziwy obraz z publicznej kamery; bez tego pola podgląd jest stylizowany (DEMO). */
  live?: LiveSource;
}

export type LiveSource =
  /** Osadzony odtwarzacz wideo na żywo (iframe). */
  | { kind: "embed"; src: string; credit: string }
  /** Zdjęcie odświeżane co `refreshSec` sekund. */
  | { kind: "snapshot"; src: string; refreshSec: number; credit: string };

export type AssetKind =
  | "zbiornik"
  | "przepompownia"
  | "kontenery"
  | "trafostacja"
  | "ladowarka"
  | "sprzet"
  | "fotowoltaika"
  | "elektrocieplownia"
  | "spalarnia";

export type Metric = "energia" | "woda" | "odpady" | "cieplo";

/** Pomiar obiektu dla jednej miary (wartości bazowe; na żywo wahają się wokół nich). */
export interface Meter {
  metric: Metric;
  primary: number;
  secondary: number;
}

export interface Asset {
  id: string;
  kind: AssetKind;
  name: string;
  position: LngLat;
  sector: string | null;
  unitId: string;
  /** Stan 0–100 (zapełnienie, obciążenie, sprawność). */
  level: number;
  levelLabel: string;
  meters?: Meter[];
}

export type AccessKind = "winda" | "podjazd" | "toaleta" | "przeszkoda";

export interface AccessPoint {
  id: string;
  kind: AccessKind;
  name: string;
  position: LngLat;
  sector: string | null;
  ok: boolean;
}

export interface Sector {
  id: string;
  name: string;
  areaKm2: number;
  anchor: LngLat;
}

export interface Place {
  name: string;
  position: LngLat;
  sector: string | null;
}
