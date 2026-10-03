import type { Pool } from "pg";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import type { AccessPoint, Asset, Camera, Category, LngLat, Place, Report, Sector, Source, Status } from "./types";
import {
  rowToAccessPoint,
  rowToAsset,
  rowToCamera,
  rowToPlace,
  rowToReport,
  rowToSector,
  sectorOf,
  type AccessPointRow,
  type AssetRow,
  type CameraRow,
  type PlaceRow,
  type ReportRow,
  type SectorFeature,
  type SectorRow,
} from "./rows";

// Dostęp do danych miasta w Postgresie. Pool przekazywany z zewnątrz — ten sam kod w serwerze i w testach.

export interface CityData {
  slug: string;
  name: string;
  boundary: Feature<Polygon | MultiPolygon>;
  sectors: Sector[];
  sectorFeatures: SectorFeature[];
  places: Place[];
  reports: Report[];
  cameras: Camera[];
  assets: Asset[];
  access: AccessPoint[];
}

export interface CityRef {
  slug: string;
  name: string;
}

export const DEFAULT_CITY = "krakow";

/** Miasta dostępne w bazie — do przełącznika w górnym pasku. */
export async function listCities(pool: Pool): Promise<CityRef[]> {
  const { rows } = await pool.query<CityRef>("SELECT slug, name FROM city ORDER BY name");
  return rows;
}

export interface CityOutline extends CityRef {
  boundary: Feature<Polygon | MultiPolygon>;
}

/** Granice pozostałych miast — po oddaleniu mapy można w nie kliknąć i przełączyć miasto. */
export async function otherCityOutlines(pool: Pool, slug: string): Promise<CityOutline[]> {
  const { rows } = await pool.query<{ slug: string; name: string; boundary: Polygon | MultiPolygon }>(
    "SELECT slug, name, boundary FROM city WHERE slug <> $1 ORDER BY name",
    [slug],
  );
  return rows.map((r) => ({ slug: r.slug, name: r.name, boundary: { type: "Feature", properties: {}, geometry: r.boundary } }));
}

/** Obiekty należą do miasta przez swój sektor (dzielnicę). */
const IN_CITY = "sector IN (SELECT id FROM sectors WHERE city_slug = $1)";

export async function loadCity(pool: Pool, slug = DEFAULT_CITY): Promise<CityData> {
  const [city, sectors, places, reports, cameras, assets, access] = await Promise.all([
    pool.query<{ slug: string; name: string; boundary: Polygon | MultiPolygon }>("SELECT slug, name, boundary FROM city WHERE slug = $1", [slug]),
    pool.query<SectorRow>("SELECT * FROM sectors WHERE city_slug = $1 ORDER BY id", [slug]),
    pool.query<PlaceRow>(`SELECT name, longitude, latitude, sector FROM places WHERE ${IN_CITY} ORDER BY name`, [slug]),
    pool.query<ReportRow>(`SELECT * FROM reports WHERE ${IN_CITY} ORDER BY created_at DESC`, [slug]),
    pool.query<CameraRow>(`SELECT * FROM cameras WHERE ${IN_CITY} ORDER BY id`, [slug]),
    pool.query<AssetRow>(`SELECT * FROM assets WHERE ${IN_CITY} ORDER BY id`, [slug]),
    pool.query<AccessPointRow>(`SELECT * FROM access_points WHERE ${IN_CITY} ORDER BY id`, [slug]),
  ]);
  if (!city.rows[0]) throw new Error(`Brak miasta „${slug}" w bazie — uruchom database/*.sql`);
  const s = sectors.rows.map(rowToSector);
  return {
    slug: city.rows[0].slug,
    name: city.rows[0].name,
    boundary: { type: "Feature", properties: {}, geometry: city.rows[0].boundary },
    sectors: s.map((x) => x.sector),
    sectorFeatures: s.map((x) => x.feature),
    places: places.rows.map(rowToPlace),
    reports: reports.rows.map(rowToReport),
    cameras: cameras.rows.map(rowToCamera),
    assets: assets.rows.map(rowToAsset),
    access: access.rows.map(rowToAccessPoint),
  };
}

export interface NewCityReport {
  title: string;
  description: string;
  category: Category;
  source: Source;
  position: LngLat;
  blocking: boolean;
  confidence: number;
  cameraId?: string;
  confirmations?: number;
  handledBy?: string | null;
}

/** Zapisuje nowe zgłoszenie; dzielnica wyliczana z geometrii dzielnic w bazie. */
export async function createReport(pool: Pool, r: NewCityReport): Promise<Report> {
  const { rows: sectors } = await pool.query<SectorRow>("SELECT * FROM sectors");
  const sector = sectorOf(r.position, sectors.map((x) => rowToSector(x).feature));
  const { rows } = await pool.query<ReportRow>(
    `INSERT INTO reports (id, title, description, category, source, status, longitude, latitude, sector, blocking, camera_id, confidence, confirmations, handled_by)
     VALUES ('Z-' || nextval('report_id_seq'), $1, $2, $3, $4, 'nowe', $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [r.title, r.description, r.category, r.source, r.position[0], r.position[1], sector, r.blocking, r.cameraId ?? null, r.confidence, r.confirmations ?? 1, r.handledBy ?? null],
  );
  return rowToReport(rows[0]);
}

export async function updateReport(pool: Pool, id: string, patch: { status?: Status; unitId?: string | null }): Promise<void> {
  await pool.query(
    `UPDATE reports
        SET status  = COALESCE($2, status),
            unit_id = CASE WHEN $3 THEN $4 ELSE unit_id END
      WHERE id = $1`,
    [id, patch.status ?? null, patch.unitId !== undefined, patch.unitId ?? null],
  );
}

/** Zgłoszenia utworzone po chwili `sinceMs` (do powiadomień o nowych zgłoszeniach). */
export async function reportsSince(pool: Pool, sinceMs: number): Promise<Report[]> {
  const { rows } = await pool.query<ReportRow>(
    "SELECT * FROM reports WHERE created_at >= to_timestamp($1 / 1000.0) ORDER BY created_at",
    [sinceMs],
  );
  return rows.map(rowToReport);
}
