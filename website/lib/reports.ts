import "server-only";
import { db } from "./db";
import type { Report } from "@/lib/types";

export async function getReports(): Promise<Report[]> {
  const { rows } = await db.query<Report>(
    "SELECT * FROM reports ORDER BY id"
  );
  return rows;
}

export async function getReportById(id: number): Promise<Report | null> {
  const { rows } = await db.query<Report>(
    "SELECT * FROM reports WHERE id = $1",
    [id]
  );
  return rows[0] ?? null;
}
