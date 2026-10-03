import { classify } from "./classify";
import type { Category, LngLat, Place } from "./types";

// Przyjęcie zgłoszenia z wiadomości tekstowej (Telegram, SMS) albo transkrypcji rozmowy telefonicznej.
// Ta sama funkcja obsłuży symulację na prezentacji i prawdziwego bota / numer telefonu.

export interface IntakeDraft {
  title: string;
  description: string;
  category: Category;
  confidence: number;
  blocking: boolean;
  /** null — w wiadomości nie było miejsca; dyspozytor wskazuje je na mapie. */
  position: LngLat | null;
  placeName: string | null;
  sector: string | null;
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ł/g, "l");

const words = (s: string) => norm(s).split(/[^a-z0-9]+/).filter(Boolean);

/** Rdzeń słowa odporny na polską odmianę: „Zabłocie" → „zablo" pasuje do „Zabłociu". */
const stem = (w: string) => w.slice(0, Math.max(4, w.length - 2));

/** Najdłuższa nazwa osiedla, której wszystkie słowa występują w tekście (w dowolnej odmianie). */
export function findPlace(text: string, places: Place[]): Place | null {
  const tw = words(text);
  let best: Place | null = null;
  let bestLen = 0;
  for (const p of places) {
    const pw = words(p.name).filter((w) => w.length >= 3);
    if (pw.length === 0) continue;
    const hit = pw.every((w) => tw.some((t) => t.startsWith(stem(w))));
    const len = pw.join("").length;
    if (hit && len > bestLen) {
      best = p;
      bestLen = len;
    }
  }
  return best;
}

const MAX_TITLE = 60;

function titleOf(text: string): string {
  const first = text.trim().split(/(?<=[.!?])\s|\n/)[0].replace(/[.!?]+$/, "").trim();
  return first.length <= MAX_TITLE ? first : `${first.slice(0, MAX_TITLE - 1).trimEnd()}…`;
}

export function parseMessage(text: string, opts: { places: Place[]; location?: LngLat }): IntakeDraft {
  const c = classify(text);
  const place = opts.location ? null : findPlace(text, opts.places);
  // Punkt lekko obok środka osiedla, żeby znacznik nie zasłaniał etykiety.
  const position: LngLat | null = opts.location ?? (place ? [place.position[0] + 0.0012, place.position[1] - 0.0006] : null);
  return {
    title: titleOf(text),
    description: text.trim(),
    category: c.category,
    confidence: c.confidence,
    blocking: c.blocking,
    position,
    placeName: place?.name ?? null,
    sector: place?.sector ?? null,
  };
}
