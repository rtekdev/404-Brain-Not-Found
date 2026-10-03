import "server-only";
import { db } from "./db";
import type { Camera, Category, Report, Source, Status } from "@/lib/types";

export async function getReports(): Promise<Report[]> {
  const { rows } = await db.query<Report>(
    "SELECT * FROM reports ORDER BY id"
  );
  return rows;
}

export async function getReportById(id: string ): Promise<Report | null> {
  const { rows } = await db.query<Report>(
    "SELECT * FROM reports WHERE id = $1",
    [id]
  );

  let result = rows[0] ?? null;
  if (!result) return null;

  result["position"] = [result.longitude, result.latitude];
  return result;
}

export async function getCameras(): Promise<Camera[]> {
  const { rows } = await db.query("SELECT * FROM cameras ORDER BY id");
  return rows;
}

export interface NewReport {
  title: string;
  description: string;
  category: Category;
  source: Source;
  status: Status;
  longitude: number | null;
  latitude: number | null;
  unitId: string | null;
  confirmations: number;
  blocking: boolean;
  cameraId: string | null;
  confidence: number;
}

export async function insertReport(r: NewReport): Promise<string> {
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO reports
       (id, title, description, category, source, status, longitude, latitude,
        unit_id, confirmations, blocking, camera_id, confidence)
     VALUES ('Z-' || nextval('report_id_seq'), $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id`,
    [r.title, r.description, r.category, r.source, r.status, r.longitude, r.latitude,
    r.unitId, r.confirmations, r.blocking, r.cameraId, r.confidence]
  );
  return rows[0].id;
}