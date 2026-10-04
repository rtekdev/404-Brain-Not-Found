import { unitById, unitForCategory } from "./meta";
import { isHealthThreat } from "./priority";
import type { LngLat, Priority, Report } from "./types";

// Pojazd jadący na miejsce zgłoszenia — tylko pokaz na mapie, bez zapisu w bazie.

export type VehicleKind = "karetka" | "policja" | "straz" | "sluzby";

export interface Dispatch {
  kind: VehicleKind;
  label: string;
}

/** Służby zewnętrzne, do których jednostka może przekazać zgłoszenie. */
export const EXTERNAL_SERVICES = ["Policja", "Pogotowie ratunkowe", "Straż Pożarna"] as const;

const FIRE = ["pożar", "pali się", "dym", "ogień"];

/** Czy i jaki pojazd jedzie: zgłoszenia krytyczne, w realizacji albo przejęte przez służby. */
export function dispatchFor(r: Report & { priority: { level: Priority } }): Dispatch | null {
  if (r.status === "zamkniete") return null;
  if (r.priority.level !== "krytyczny" && r.status !== "w_realizacji" && !r.handledBy) return null;

  const by = (r.handledBy ?? "").toLowerCase();
  const text = `${r.title} ${r.description}`.toLowerCase();
  if (by.includes("straż") || FIRE.some((w) => text.includes(w))) return { kind: "straz", label: "Straż Pożarna" };
  if (by.includes("pogotow") || isHealthThreat(text)) return { kind: "karetka", label: "Pogotowie ratunkowe" };
  if (by.includes("polic") || r.category === "bezpieczenstwo" || (r.category === "drogi" && r.blocking))
    return { kind: "policja", label: "Policja" };
  const unit = unitById(r.unitId) ?? unitForCategory(r.category);
  return { kind: "sluzby", label: `Ekipa: ${unit.short}` };
}

/** Baza pojazdu: ok. 1,6 km od celu, kierunek wyznaczony z identyfikatora zgłoszenia. */
export function startPoint(target: LngLat, seed: string): LngLat {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const angle = ((h % 360) * Math.PI) / 180;
  const km = 1.6;
  const dLat = (km / 111.32) * Math.sin(angle);
  const dLng = ((km / 111.32) * Math.cos(angle)) / Math.cos((target[1] * Math.PI) / 180);
  return [target[0] + dLng, target[1] + dLat];
}

/** Punkt na łamanej w ułamku `t` jej długości (0–1) oraz kierunek jazdy w stopniach. */
export function pointAlong(path: LngLat[], t: number): { at: LngLat; bearing: number } {
  const seg = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  let left = Math.max(0, Math.min(1, t)) * total;
  for (let i = 0; i < seg.length; i++) {
    const a = path[i];
    const b = path[i + 1];
    if (left <= seg[i] || i === seg.length - 1) {
      const k = seg[i] ? Math.min(1, left / seg[i]) : 1;
      const bearing = (Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI;
      return { at: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k], bearing };
    }
    left -= seg[i];
  }
  return { at: path[path.length - 1], bearing: 0 };
}

/** Trasa zapasowa (bez serwera tras): łagodny łuk z bazy do celu. */
export function fallbackRoute(from: LngLat, to: LngLat, steps = 40): LngLat[] {
  const cx = (from[0] + to[0]) / 2 - (to[1] - from[1]) * 0.25;
  const cy = (from[1] + to[1]) / 2 + (to[0] - from[0]) * 0.25;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const u = i / steps;
    const a = (1 - u) ** 2, b = 2 * (1 - u) * u, c = u ** 2;
    return [a * from[0] + b * cx + c * to[0], a * from[1] + b * cy + c * to[1]] as LngLat;
  });
}
