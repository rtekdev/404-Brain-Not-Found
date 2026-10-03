export type LngLat = [number | null, number | null];

export type Category =
  | "drogi"
  | "zielen"
  | "woda"
  | "odpady"
  | "oswietlenie"
  | "dostepnosc"
  | "bezpieczenstwo"
  | "inne";

export type Source = "kamera" | "telefon" | "sms" | "aplikacja" | "messenger" | "telegram";

export type Status = "nowe" | "przekazane" | "w_realizacji" | "zamkniete";

export type Priority = "krytyczny" | "wysoki" | "sredni" | "niski";

export const CATEGORY_LABELS: Record<Category, string> = {
  drogi: "Drogi", zielen: "Zieleń", woda: "Woda", odpady: "Odpady",
  oswietlenie: "Oświetlenie", dostepnosc: "Dostępność",
  bezpieczenstwo: "Bezpieczeństwo", inne: "Inne",
};

export const SOURCE_LABELS: Record<Source, string> = {
  kamera: "Kamera", telefon: "Telefon", sms: "SMS",
  aplikacja: "Aplikacja", messenger: "Messenger", telegram: "Telegram",
};

export const STATUS_LABELS: Record<Status, string> = {
  nowe: "Nowe", przekazane: "Przekazane",
  w_realizacji: "W realizacji", zamkniete: "Zamknięte",
};

export interface Unit {
  id: string;
  name: string;
  short: string;
  categories: Category[];
}

export interface Report {
  id: string;                       // "Z-1048"
  title: string;
  description: string;
  category: Category;
  source: Source;
  status: Status;
  latitude: number;
  longitude: number;
  position: LngLat;       // [lng, lat], built in SQL
  sector: string | null;            // sectors.id, e.g. "D13"
  createdAt: number;                // ms timestamp
  unitId: string | null;
  confirmations: number;
  blocking: boolean;
  cameraId: string | null;
  confidence: number;               // 0..1
  handledBy: string | null;
}

export interface Camera {
  id: string;
  name: string;
  latitude: null;
  longitude: null;
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

/** Parametry dzielnicy do modelu zasobów (z bazy, tabela sectors). */
export interface SectorProfile {
  /** Liczba mieszkańców (do skalowania zużycia). */
  pop: number;
  /** Straty wody w sieci (udział dostarczonej). */
  waterLoss: number;
  /** Zdolność dostaw wody względem potrzeb (zbiorniki, ujęcia); >1 = rezerwa. */
  waterReserve: number;
  /** Zdolność odbioru odpadów względem wytwarzanych; <1 = zaległości. */
  wasteCapacity: number;
  /** Udział dachów z fotowoltaiką (względny). */
  rooftopPv: number;
}

export interface Sector {
  id: string;
  name: string;
  areaKm2: number;
  anchor: LngLat;
  profile: SectorProfile;
}

export interface Place {
  name: string;
  position: LngLat;
  sector: string | null;
}
