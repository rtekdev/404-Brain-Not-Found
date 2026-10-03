import type { Priority, Status } from "./types";

// Ranking dzielnic do panelu bocznego w widoku całego miasta.

export type SectorFilter = "otwarte" | "krytyczne" | "zamkniete";

export interface RankInput {
  sector: string | null;
  status: Status;
  priority: { level: Priority; score: number };
}

export interface SectorRow {
  id: string;
  name: string;
  open: number;
  critical: number;
  closed: number;
  /** Najwyższy priorytet wśród otwartych zgłoszeń (0 — brak). */
  topScore: number;
}

export function rankSectors(reports: RankInput[], sectors: { id: string; name: string }[], filter: SectorFilter): SectorRow[] {
  const rows = new Map<string, SectorRow>(
    sectors.map((s) => [s.id, { id: s.id, name: s.name, open: 0, critical: 0, closed: 0, topScore: 0 }]),
  );
  for (const r of reports) {
    const row = r.sector ? rows.get(r.sector) : undefined;
    if (!row) continue;
    if (r.status === "zamkniete") {
      row.closed++;
      continue;
    }
    row.open++;
    if (r.priority.level === "krytyczny") row.critical++;
    row.topScore = Math.max(row.topScore, r.priority.score);
  }

  const all = [...rows.values()];
  if (filter === "zamkniete")
    return all.filter((x) => x.closed > 0).sort((a, b) => b.closed - a.closed || a.id.localeCompare(b.id));

  return all
    .filter((x) => filter === "otwarte" || x.critical > 0)
    .sort((a, b) => b.critical - a.critical || b.open - a.open || b.topScore - a.topScore || a.id.localeCompare(b.id));
}
