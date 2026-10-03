import type { Asset, LngLat, Metric, Meter, Report, Sector } from "./types";

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

export interface Reading {
  primary: number;
  secondary: number;
  /** Ile `secondary` potrzeba, by pokryć `primary` (woda: z doliczeniem strat sieci). Brak = `primary`. */
  need?: number;
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

/** Odczyt sektora: odbiorcy rozproszeni (z profilu dzielnicy) + obiekty produkujące w sektorze. */
export function sectorReading(sector: Sector, metric: Metric, assets: Asset[], t: number): Reading {
  const p = sector.profile;
  const sectorId = sector.id;
  const k = `${sectorId}:${metric}`;
  const produced = (m: Metric) =>
    assets
      .filter((a) => a.sector === sectorId)
      .reduce((s, a) => s + (assetMeter(a, m)?.secondary ?? 0), 0);

  switch (metric) {
    case "energia": {
      const use = live(p.pop * 0.00052, `${k}:p`, t);
      const rooftop = p.pop * 0.00004 * p.rooftopPv;
      return { primary: use, secondary: live(rooftop + produced("energia"), `${k}:s`, t, 0.08), need: use };
    }
    case "woda": {
      const use = live(p.pop * 0.0051, `${k}:p`, t);
      const need = use / (1 - p.waterLoss);
      return { primary: use, secondary: need * p.waterReserve, need };
    }
    case "odpady": {
      const made = live(p.pop * 0.00094, `${k}:p`, t, 0.02);
      return { primary: made, secondary: made * p.wasteCapacity, need: made };
    }
    case "cieplo": {
      const use = live(p.pop * 0.0021, `${k}:p`, t);
      return { primary: use, secondary: live(produced("cieplo"), `${k}:s`, t, 0.03), need: use };
    }
  }
}

export function sumReadings(rs: Reading[]): Reading {
  return rs.reduce(
    (s, r) => ({ primary: s.primary + r.primary, secondary: s.secondary + r.secondary, need: s.need! + (r.need ?? r.primary) }),
    { primary: 0, secondary: 0, need: 0 },
  );
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
      // Potrzeba = zużycie / (1 − straty), więc straty = 1 − zużycie / potrzeba.
      const loss = 1 - primary / (s.reading.need ?? primary);
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
