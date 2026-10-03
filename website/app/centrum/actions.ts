"use server";

import { db } from "@/lib/db";
import { createReport, reportsSince, updateReport, type NewCityReport } from "@/lib/city-repo";
import { ALERT_SCENARIO } from "@/lib/simulation";
import type { Report, Status } from "@/lib/types";

export async function createReportAction(input: NewCityReport): Promise<Report> {
  return createReport(db, input);
}

export async function updateReportAction(id: string, patch: { status?: Status; unitId?: string | null }): Promise<void> {
  await updateReport(db, id, patch);
}

export async function reportsSinceAction(sinceMs: number): Promise<Report[]> {
  return reportsSince(db, sinceMs);
}

/** Pokaz: dwa zgłoszenia w tej samej chwili — krytyczne i zwykłe. */
export async function simulateAlertAction(): Promise<string[]> {
  const saved = await Promise.all(ALERT_SCENARIO.map((r) => createReport(db, r)));
  return saved.map((r) => r.id);
}
