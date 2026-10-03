import type { AccessKind, AssetKind, Category, Priority, Source, Status, Unit } from "./types";

export const APP_NAME = "SWIMM";
export const APP_FULL_NAME = "System Wspierania i Monitorowania Miasta";

// Dane kontaktowe dla mieszkańców. Numery pokazowe — do podmiany na prawdziwe przed wdrożeniem.
export const CONTACT = {
  phone: "+48 12 345 67 89",
  sms: "+48 12 345 67 89",
  telegram: "SwimmKrakowBot",
  emergency: "112",
};

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export const CATEGORY_LABEL: Record<Category, string> = {
  drogi: "Drogi i chodniki",
  zielen: "Zieleń",
  woda: "Woda i kanalizacja",
  odpady: "Odpady",
  oswietlenie: "Oświetlenie i energia",
  dostepnosc: "Dostępność",
  bezpieczenstwo: "Bezpieczeństwo",
  inne: "Inne",
};

export const SOURCE_LABEL: Record<Source, string> = {
  kamera: "Kamera",
  telefon: "Telefon",
  sms: "SMS",
  aplikacja: "Aplikacja",
  messenger: "Messenger",
  telegram: "Telegram",
};

export const STATUS_LABEL: Record<Status, string> = {
  nowe: "Nowe",
  przekazane: "Przekazane",
  w_realizacji: "W realizacji",
  zamkniete: "Zamknięte",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  krytyczny: "Krytyczny",
  wysoki: "Wysoki",
  sredni: "Średni",
  niski: "Niski",
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  krytyczny: "#f43f5e",
  wysoki: "#f59e0b",
  sredni: "#eab308",
  niski: "#94a3b8",
};

export const ASSET_LABEL: Record<AssetKind, string> = {
  zbiornik: "Zbiornik wody",
  przepompownia: "Przepompownia",
  kontenery: "Kontenery na odpady",
  trafostacja: "Stacja transformatorowa",
  ladowarka: "Ładowarka EV",
  sprzet: "Sprzęt miejski",
  fotowoltaika: "Farma fotowoltaiczna",
  elektrocieplownia: "Elektrociepłownia",
  spalarnia: "Spalarnia odpadów (ZTPO)",
};

export const ACCESS_LABEL: Record<AccessKind, string> = {
  winda: "Winda",
  podjazd: "Podjazd",
  toaleta: "Toaleta dostępna",
  przeszkoda: "Przeszkoda",
};

export const UNITS: Unit[] = [
  { id: "drogi", name: "Zarząd Dróg", short: "Drogi", categories: ["drogi"] },
  { id: "zielen", name: "Zieleń Miejska", short: "Zieleń", categories: ["zielen"] },
  { id: "woda", name: "Wodociągi", short: "Wodociągi", categories: ["woda"] },
  { id: "odpady", name: "Gospodarka Odpadami", short: "Odpady", categories: ["odpady"] },
  { id: "energia", name: "Oświetlenie i Energia", short: "Energia", categories: ["oswietlenie"] },
  { id: "dostepnosc", name: "Zespół ds. Dostępności", short: "Dostępność", categories: ["dostepnosc"] },
  { id: "kryzys", name: "Centrum Zarządzania Kryzysowego", short: "Kryzysowe", categories: ["bezpieczenstwo", "inne"] },
];

export function unitForCategory(c: Category): Unit {
  return UNITS.find((u) => u.categories.includes(c)) ?? UNITS[UNITS.length - 1];
}

export function unitById(id: string | null): Unit | undefined {
  return UNITS.find((u) => u.id === id);
}

export function timeAgo(ts: number, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - ts) / 60000));
  if (min < 1) return "przed chwilą";
  if (min < 60) return `${min} min temu`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} godz. temu`;
  return `${Math.floor(h / 24)} dni temu`;
}
