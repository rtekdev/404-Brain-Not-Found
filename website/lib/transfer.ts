import type { LngLat, Metric, Sector } from "./types";
import { METRIC, fmt, needFactor, type Reading } from "./resources";

// Przekierowanie części zasobu (produkcji / dostaw / zdolności odbioru) z sektora A do sektora B.
// Model uproszczony i wyjaśnialny: straty rosną z odległością, wartość mierzymy w złotych.

export interface Transfer {
  id: string;
  metric: Metric;
  from: string;
  to: string;
  /** Udział strumienia `secondary` sektora źródłowego, 0–100. */
  pct: number;
}

interface Economics {
  /** Co przenosimy — dopełniacz („produkcji", „dostaw"…). */
  what: string;
  /** Wartość jednostki, której brakuje w sektorze docelowym (zł). */
  price: number;
  /** Wartość jednostki nadwyżki, gdy nikt jej nie przekieruje (np. sprzedaż do sieci). */
  surplusValue: number;
  /** Straty przesyłu na kilometr (udział). */
  lossPerKm: number;
  perDay: boolean;
  lossLabel: string;
}

export const ECONOMICS: Record<Metric, Economics> = {
  energia: { what: "produkcji lokalnej", price: 750, surplusValue: 300, lossPerKm: 0.012, perDay: false, lossLabel: "straty przesyłu w sieci SN" },
  woda: { what: "dostaw wody", price: 6.5, surplusValue: 0, lossPerKm: 0.015, perDay: false, lossLabel: "wycieki i spadek ciśnienia na magistrali" },
  odpady: { what: "zdolności odbioru", price: 420, surplusValue: 0, lossPerKm: 0.02, perDay: true, lossLabel: "dłuższe kursy śmieciarek (czas i paliwo)" },
  cieplo: { what: "produkcji ciepła", price: 95, surplusValue: 25, lossPerKm: 0.035, perDay: false, lossLabel: "straty ciepła w sieci ciepłowniczej" },
};

export function distanceKm(a: LngLat, b: LngLat): number {
  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLng = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

type Ctx = { metric: Metric; sector: string };
const need = (r: Reading, c: Ctx) => r.primary * needFactor(c.metric, c.sector);
const surplus = (r: Reading, c: Ctx) => Math.max(0, r.secondary - need(r, c));
const deficit = (r: Reading, c: Ctx) => Math.max(0, need(r, c) - r.secondary);
const coverage = (r: Reading, c: Ctx) => (r.primary > 0 ? r.secondary / need(r, c) : 1);
/** Drobne wahania odczytów nie powinny wywoływać ostrzeżeń. */
const EPS = 0.02;

export interface Estimate {
  amount: number;
  delivered: number;
  lost: number;
  km: number;
  lossShare: number;
  /** Zysk netto w zł za godzinę (dla odpadów — za dobę). */
  net: number;
  netDaily: number;
  gains: string[];
  costs: string[];
  /** Źródło po przekierowaniu wpada w niedobór. */
  risky: boolean;
}

/** Wycena przekierowania na odczytach przed zmianą (`base`). */
export function estimate(t: Omit<Transfer, "id">, base: Record<string, Reading>, sectors: Sector[]): Estimate | null {
  const e = ECONOMICS[t.metric];
  const d = METRIC[t.metric];
  const src = base[t.from];
  const dst = base[t.to];
  const a = sectors.find((s) => s.id === t.from);
  const b = sectors.find((s) => s.id === t.to);
  if (!src || !dst || !a || !b || t.from === t.to) return null;

  const km = distanceKm(a.anchor, b.anchor);
  const lossShare = Math.min(0.9, km * e.lossPerKm);
  const amount = (src.secondary * t.pct) / 100;
  const delivered = amount * (1 - lossShare);
  const lost = amount - delivered;

  const cs = { metric: t.metric, sector: t.from };
  const cd = { metric: t.metric, sector: t.to };
  const fromSurplus = Math.min(amount, surplus(src, cs));
  const fromNeed = amount - fromSurplus;
  const useful = Math.min(delivered, deficit(dst, cd));
  const wasted = delivered - useful;

  const net = useful * e.price - fromSurplus * e.surplusValue - fromNeed * e.price;
  const v = (x: number) => `${fmt(x, t.metric)} ${d.unit}`;
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const after = (r: Reading, dSec: number) => ({ ...r, secondary: r.secondary + dSec });

  const gains: string[] = [];
  const costs: string[] = [];
  if (useful > 0)
    gains.push(`${t.to}: niedobór mniejszy o ${v(useful)} — pokrycie ${pct(coverage(dst, cd))} → ${pct(coverage(after(dst, delivered), cd))}`);
  if (fromSurplus > 0)
    gains.push(`${t.from}: zagospodarowana nadwyżka ${v(fromSurplus)}${e.surplusValue ? ` (zamiast sprzedaży po ${e.surplusValue} zł)` : ""}`);
  if (lost > 0) costs.push(`Straty na trasie ${v(lost)} (${pct(lossShare)} · ${km.toFixed(1)} km, ${e.lossLabel})`);
  const shortfall = fromNeed > amount * EPS;
  if (shortfall)
    costs.push(`${t.from}: pokrycie ${pct(coverage(src, cs))} → ${pct(coverage(after(src, -amount), cs))} — brakujące ${v(fromNeed)} trzeba odkupić`);
  if (wasted > delivered * EPS) costs.push(`${t.to}: ${v(wasted)} ponad potrzeby — nie zostanie wykorzystane`);

  return {
    amount,
    delivered,
    lost,
    km,
    lossShare,
    net,
    netDaily: e.perDay ? net : net * 24,
    gains,
    costs,
    risky: shortfall && coverage(after(src, -amount), cs) < 1 - EPS,
  };
}

/** Odczyty po zastosowaniu przekierowań — kwoty liczone od odczytów bazowych. */
export function applyTransfers(base: Record<string, Reading>, transfers: Transfer[], metric: Metric, sectors: Sector[]): Record<string, Reading> {
  const out: Record<string, Reading> = Object.fromEntries(Object.entries(base).map(([k, r]) => [k, { ...r }]));
  for (const t of transfers) {
    if (t.metric !== metric) continue;
    const est = estimate(t, base, sectors);
    if (!est || !out[t.from] || !out[t.to]) continue;
    out[t.from].secondary -= est.amount;
    out[t.to].secondary += est.delivered;
  }
  return out;
}

export interface Suggestion {
  from: string;
  to: string;
  pct: number;
  net: number;
}

/** Najlepsze trasy: z nadwyżki do niedoboru, tyle ile potrzeba (z uwzględnieniem strat). */
export function suggest(metric: Metric, base: Record<string, Reading>, sectors: Sector[], limit = 3): Suggestion[] {
  const e = ECONOMICS[metric];
  const out: Suggestion[] = [];
  for (const a of sectors)
    for (const b of sectors) {
      const src = base[a.id];
      const dst = base[b.id];
      if (a.id === b.id || !src || !dst || src.secondary <= 0) continue;
      const s = surplus(src, { metric, sector: a.id });
      const gap = deficit(dst, { metric, sector: b.id });
      if (s <= 0 || gap <= 0) continue;
      const loss = Math.min(0.9, distanceKm(a.anchor, b.anchor) * e.lossPerKm);
      // 90% nadwyżki — zapas na wahania odczytów.
      const amount = Math.min(s * 0.9, gap / (1 - loss));
      const pct = Math.max(1, Math.min(100, Math.floor((amount / src.secondary) * 100)));
      const est = estimate({ metric, from: a.id, to: b.id, pct }, base, sectors);
      if (est && est.net > 0) out.push({ from: a.id, to: b.id, pct, net: est.net });
    }
  return out.sort((x, y) => y.net - x.net).slice(0, limit);
}

export function money(v: number): string {
  return `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(Math.round(v)).toLocaleString("pl-PL")} zł`;
}
