import "server-only";
import { db } from "./db";
import type { Camera, Category, LngLat, Report, Source, Status } from "@/lib/types";
import { rowToReport, rowToSector, sectorOf, type ReportRow, type SectorRow } from "./rows";

/** Zgłoszenie z nazwą dzielnicy i miasta — do listy i szczegółów pod /reports. */
export type ReportItem = Report & { sectorName: string | null; citySlug: string | null; cityName: string | null };

type ItemRow = ReportRow & { sector_name: string | null; city_slug: string | null; city_name: string | null };

const SELECT_ITEMS = `
  SELECT r.*, s.name AS sector_name, c.slug AS city_slug, c.name AS city_name
    FROM reports r
    LEFT JOIN sectors s ON s.id = r.sector
    LEFT JOIN city c ON c.slug = s.city_slug`;

const toItem = (r: ItemRow): ReportItem => ({
  ...rowToReport(r),
  sectorName: r.sector_name,
  citySlug: r.city_slug,
  cityName: r.city_name,
});

export async function getReports(): Promise<ReportItem[]> {
  const { rows } = await db.query<ItemRow>(`${SELECT_ITEMS} ORDER BY r.created_at DESC`);
  return rows.map(toItem);
}
// old
// export async function getReportById(id: string): Promise<Report | null> {
//   const { rows } = await db.query<Report>(
//     "SELECT * FROM reports WHERE id = $1",
//     [id]
//   );

//   let result = rows[0] ?? null;
//   if (!result) return null;

//   result["position"] = [result.longitude, result.latitude];
//   return result;
// }
export async function getReportById(id: string): Promise<ReportItem | null> {
  const { rows } = await db.query<ItemRow>(`${SELECT_ITEMS} WHERE r.id = $1`, [id]);
  return rows[0] ? toItem(rows[0]) : null;
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
  position: LngLat;
  unitId: string | null;
  confirmations: number;
  blocking: boolean;
  cameraId: string | null;
  confidence: number;
}

export async function insertReport(r: NewReport): Promise<string> {
  // Dzielnica z geometrii — bez niej zgłoszenie nie trafi na mapę żadnego miasta.
  const { rows: sectors } = await db.query<SectorRow>("SELECT * FROM sectors");
  const sector = sectorOf(r.position, sectors.map((x) => rowToSector(x).feature));
  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO reports
       (id, title, description, category, source, status, longitude, latitude, sector,
        unit_id, confirmations, blocking, camera_id, confidence)
     VALUES ('Z-' || nextval('report_id_seq'), $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING id`,
    [r.title, r.description, r.category, r.source, r.status, r.position[1], r.position[0], sector,
    r.unitId, r.confirmations, r.blocking, r.cameraId, r.confidence]
  );
  return rows[0].id;
}
