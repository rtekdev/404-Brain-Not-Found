import type { Asset, LngLat, Metric, Meter, Report } from "./types";

// Pomiary zasobów miejskich (dane demonstracyjne, fikcyjne). Każda miara ma dwa strumienie:
// `primary` (to, co płynie do centrali — zwykle zużycie) i `secondary` (produkcja / dostawa / odbiór).

export interface MetricDef {
  id: Metric;
  label: string;
  unit: string;
  color: string;
  primary: string;
  secondary: string;
  /** Etykieta różnicy secondary − primary. */
  balance: string;
  digits: number;
}

export const METRICS: MetricDef[] = [
  { id: "energia", label: "Energia", unit: "MW", color: "#facc15", primary: "Zużycie", secondary: "Produkcja lokalna", balance: "Bilans", digits: 1 },
  { id: "woda", label: "Woda", unit: "m³/h", color: "#22d3ee", primary: "Zużycie", secondary: "Zdolność dostaw", balance: "Rezerwa i straty", digits: 0 },
  { id: "odpady", label: "Odpady", unit: "t/dobę", color: "#4ade80", primary: "Wytworzone", secondary: "Zdolność odbioru", balance: "Bilans odbioru", digits: 1 },
  { id: "cieplo", label: "Ciepło", unit: "GJ/h", color: "#fb923c", primary: "Zużycie", secondary: "Produkcja", balance: "Bilans", digits: 0 },
];

export const METRIC = Object.fromEntries(METRICS.map((m) => [m.id, m])) as Record<Metric, MetricDef>;

/** Centrala — punkt, do którego spływają dane z sektorów (Centrum Zarządzania Miastem). */
// Punkt umowny między dzielnicami, żeby węzeł nie zasłaniał etykiet sektorów.
export const HUB: { name: string; position: LngLat } = { name: "Centrala · Kraków", position: [19.985, 50.04] };

interface SectorProfile {
  /** Liczba mieszkańców (fikcyjna, do skalowania). */
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

export const PROFILE: Record<string, SectorProfile> = {
  // Dzielnice Krakowa; liczba mieszkańców przybliżona, pozostałe parametry fikcyjne.
  D01: { pop: 31000, waterLoss: 0.09, waterReserve: 0.94, wasteCapacity: 0.95, rooftopPv: 0.3 },
  D02: { pop: 29000, waterLoss: 0.08, waterReserve: 0.97, wasteCapacity: 1.02, rooftopPv: 0.6 },
  D03: { pop: 47000, waterLoss: 0.07, waterReserve: 0.98, wasteCapacity: 1.04, rooftopPv: 0.8 },
  D04: { pop: 72000, waterLoss: 0.08, waterReserve: 0.96, wasteCapacity: 1.0, rooftopPv: 1.1 },
  D05: { pop: 31000, waterLoss: 0.07, waterReserve: 1.0, wasteCapacity: 0.99, rooftopPv: 0.7 },
  D06: { pop: 23000, waterLoss: 0.08, waterReserve: 1.3, wasteCapacity: 1.03, rooftopPv: 1.2 },
  D07: { pop: 21000, waterLoss: 0.1, waterReserve: 1.45, wasteCapacity: 1.06, rooftopPv: 1.3 },
  D08: { pop: 64000, waterLoss: 0.09, waterReserve: 0.95, wasteCapacity: 0.98, rooftopPv: 1.2 },
  D09: { pop: 17000, waterLoss: 0.08, waterReserve: 0.97, wasteCapacity: 1.0, rooftopPv: 1.0 },
  D10: { pop: 30000, waterLoss: 0.11, waterReserve: 1.25, wasteCapacity: 1.05, rooftopPv: 1.7 },
  D11: { pop: 54000, waterLoss: 0.08, waterReserve: 0.98, wasteCapacity: 0.97, rooftopPv: 0.9 },
  D12: { pop: 63000, waterLoss: 0.09, waterReserve: 0.96, wasteCapacity: 0.8, rooftopPv: 1.0 },
  D13: { pop: 37000, waterLoss: 0.21, waterReserve: 0.85, wasteCapacity: 1.04, rooftopPv: 0.9 },
  D14: { pop: 30000, waterLoss: 0.07, waterReserve: 1.02, wasteCapacity: 1.12, rooftopPv: 1.0 },
  D15: { pop: 51000, waterLoss: 0.07, waterReserve: 0.96, wasteCapacity: 1.01, rooftopPv: 0.8 },
  D16: { pop: 39000, waterLoss: 0.08, waterReserve: 0.97, wasteCapacity: 1.08, rooftopPv: 0.7 },
  D17: { pop: 20000, waterLoss: 0.1, waterReserve: 1.1, wasteCapacity: 1.02, rooftopPv: 1.8 },
  D18: { pop: 50000, waterLoss: 0.09, waterReserve: 1.05, wasteCapacity: 1.18, rooftopPv: 1.4 },
};

const profile = (id: string): SectorProfile =>
  PROFILE[id] ?? { pop: 10000, waterLoss: 0.1, waterReserve: 1, wasteCapacity: 1, rooftopPv: 1 };

/** Ile `secondary` potrzeba na jednostkę `primary`, by sektor był pokryty (woda: z doliczeniem strat sieci). */
export function needFactor(metric: Metric, sectorId: string): number {
  return metric === "woda" ? 1 / (1 - profile(sectorId).waterLoss) : 1;
}

export interface Reading {
  primary: number;
  secondary: number;
}

const phaseOf = (key: string) => [...key].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) / 997 * Math.PI * 2;

/** Łagodne wahania „na żywo" — deterministyczne w czasie, różne dla każdego obiektu. */
export function live(base: number, key: string, t: number, amp = 0.05): number {
  const p = phaseOf(key);
  return base * (1 + amp * Math.sin(t / 9000 + p) + amp * 0.4 * Math.sin(t / 2300 + p * 3));
}

export function meterAt(m: Meter, key: string, t: number): Reading {
  return { primary: live(m.primary, `${key}:p`, t), secondary: live(m.secondary, `${key}:s`, t) };
}

export function assetMeter(a: Asset, metric: Metric): Meter | undefined {
  return a.meters?.find((m) => m.metric === metric);
}

/** Odczyt sektora: odbiorcy rozproszeni (z liczby mieszkańców) + obiekty produkujące w sektorze. */
export function sectorReading(sectorId: string, metric: Metric, assets: Asset[], t: number): Reading {
  const p = profile(sectorId);
  const k = `${sectorId}:${metric}`;
  const produced = (m: Metric) =>
    assets
      .filter((a) => a.sector === sectorId)
      .reduce((s, a) => s + (assetMeter(a, m)?.secondary ?? 0), 0);

  switch (metric) {
    case "energia": {
      const use = live(p.pop * 0.00052, `${k}:p`, t);
      const rooftop = p.pop * 0.00004 * p.rooftopPv;
      return { primary: use, secondary: live(rooftop + produced("energia"), `${k}:s`, t, 0.08) };
    }
    case "woda": {
      const use = live(p.pop * 0.0051, `${k}:p`, t);
      return { primary: use, secondary: (use / (1 - p.waterLoss)) * p.waterReserve };
    }
    case "odpady": {
      const made = live(p.pop * 0.00094, `${k}:p`, t, 0.02);
      return { primary: made, secondary: made * p.wasteCapacity };
    }
    case "cieplo":
      return { primary: live(p.pop * 0.0021, `${k}:p`, t), secondary: live(produced("cieplo"), `${k}:s`, t, 0.03) };
  }
}

export function sumReadings(rs: Reading[]): Reading {
  return rs.reduce((s, r) => ({ primary: s.primary + r.primary, secondary: s.secondary + r.secondary }), { primary: 0, secondary: 0 });
}

export function fmt(v: number, metric: Metric): string {
  return v.toLocaleString("pl-PL", { maximumFractionDigits: METRIC[metric].digits, minimumFractionDigits: METRIC[metric].digits });
}

export interface Insight {
  sector: string | null;
  text: string;
  tone: "warn" | "ok";
  reportId?: string;
}

/** Proste reguły „AI" nad pomiarami — wiążą anomalie ze zgłoszeniami mieszkańców. */
export function insights(
  metric: Metric,
  sectors: { id: string; name: string; reading: Reading }[],
  assets: Asset[],
  reports: Pick<Report, "id" | "category" | "sector" | "status" | "title">[],
): Insight[] {
  const out: Insight[] = [];
  const linked = (sector: string, cat: Report["category"]) =>
    reports.find((r) => r.sector === sector && r.category === cat && r.status !== "zamkniete");

  for (const s of sectors) {
    const { primary, secondary } = s.reading;
    if (metric === "woda") {
      const loss = profile(s.id).waterLoss;
      if (loss > 0.15) {
        const r = linked(s.id, "woda");
        out.push({
          sector: s.id,
          tone: "warn",
          reportId: r?.id,
          text: `${s.id} ${s.name}: straty ${Math.round(loss * 100)}% — możliwy wyciek${r ? `, zgodny ze zgłoszeniem „${r.title}"` : ""}`,
        });
      }
    }
    if (metric === "odpady") {
      const backlog = 1 - secondary / primary;
      if (backlog > 0.12) {
        const r = linked(s.id, "odpady");
        out.push({
          sector: s.id,
          tone: "warn",
          reportId: r?.id,
          text: `${s.id} ${s.name}: ${Math.round(backlog * 100)}% odpadów nieodebranych — dołóż kurs śmieciarki${r ? `; potwierdza to zgłoszenie „${r.title}"` : ""}`,
        });
      }
    }
    if (metric === "energia" && secondary > primary)
      out.push({ sector: s.id, tone: "ok", text: `${s.id} ${s.name}: nadwyżka produkcji ${fmt(secondary - primary, "energia")} MW — oddaje energię do sieci` });
  }

  if (metric === "energia")
    for (const a of assets)
      if (a.kind === "trafostacja" && a.level >= 85)
        out.push({ sector: a.sector, tone: "warn", text: `${a.name}: obciążenie ${a.level}% — przesuń ładowanie EV poza szczyt` });

  return out;
}
