import type { Category, Priority, Report } from "./types";

// Wyjaśnialny scoring priorytetu. Docelowo model językowy dostaje te same
// sygnały i zwraca ocenę + uzasadnienie; heurystyka zostaje jako fallback.

const CATEGORY_WEIGHT: Record<Category, number> = {
  bezpieczenstwo: 45,
  woda: 32,
  zielen: 28,
  drogi: 26,
  dostepnosc: 26,
  oswietlenie: 20,
  odpady: 14,
  inne: 10,
};

const HEALTH = ["zemdl", "nieprzytomn", "przytomno", "krew", "krwaw", "ranny", "ranna", "poszkodowan", "zawał", "duszno"];

/** Czy opis wskazuje na zagrożenie zdrowia lub życia (zemdlenie, krew, poszkodowani). */
export function isHealthThreat(text: string): boolean {
  const t = text.toLowerCase();
  return HEALTH.some((w) => t.includes(w));
}

export interface PriorityResult {
  score: number;
  level: Priority;
  reasons: string[];
}

export function scoreReport(r: Report, now = Date.now()): PriorityResult {
  const reasons: string[] = [];
  let score = CATEGORY_WEIGHT[r.category];

  if (isHealthThreat(`${r.title} ${r.description}`)) {
    score += 25;
    reasons.push("zagrożenie zdrowia lub życia");
  }
  if (r.blocking) {
    score += 30;
    reasons.push("blokuje ruch lub dostęp");
  }
  if (r.confirmations > 1) {
    const bonus = Math.min(15, (r.confirmations - 1) * 3);
    score += bonus;
    reasons.push(`${r.confirmations} potwierdzeń`);
  }
  if (r.source === "kamera" && r.confidence >= 0.8) {
    score += 6;
    reasons.push(`wykryte przez kamerę (${Math.round(r.confidence * 100)}%)`);
  }
  if (r.status === "nowe") {
    const hours = (now - r.createdAt) / 3_600_000;
    if (hours > 2) {
      const bonus = Math.min(12, Math.round(hours * 1.5));
      score += bonus;
      reasons.push("długo bez reakcji");
    }
  }
  if (r.status === "zamkniete") score = Math.round(score * 0.2);
  else if (r.status === "w_realizacji") score = Math.round(score * 0.75);

  score = Math.max(0, Math.min(100, score));
  if (reasons.length === 0) reasons.push("standardowa kolejka");

  const level: Priority =
    score >= 70 ? "krytyczny" : score >= 48 ? "wysoki" : score >= 28 ? "sredni" : "niski";
  return { score, level, reasons };
}
