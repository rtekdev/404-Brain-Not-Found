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
  await fillMissingPlacesOnce(pool);
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

// Adresy, których geokoder nie znalazł — nie pytamy o nie w kółko przy każdym odświeżeniu.
const geocodeMisses = new Set<string>();
let filling: Promise<void> | null = null;
let lastGeocode = 0;

/** Adres z opisu zgłoszenia telefonicznego: „Adres zgłoszenia: ul. Floriańska 45, Kraków". */
function addressOf(description: string): string | null {
  return description.match(/Adres zg[łl]oszenia:\s*(.+)/i)?.[1].trim() || null;
}

async function geocode(address: string): Promise<LngLat | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pl&q=${encodeURIComponent(address)}`;
  const res = await fetch(url, { headers: { "User-Agent": "SWIMM-hackyeah/1.0" }, signal: AbortSignal.timeout(4000) });
  const [hit] = (await res.json()) as { lon: string; lat: string }[];
  return hit ? [Number(hit.lon), Number(hit.lat)] : null;
}

/**
 * Zgłoszenia wpisane do bazy z pominięciem aplikacji (np. bot telefoniczny) mogą nie mieć dzielnicy,
 * a nawet współrzędnych — a mapa pokazuje tylko zgłoszenia z dzielnicą. Uzupełniamy je i zapisujemy:
 * współrzędne z adresu w opisie (geokoder OSM), dzielnicę z geometrii.
 */
async function fillMissingPlaces(pool: Pool): Promise<void> {
  const { rows } = await pool.query<{ id: string; description: string; longitude: number | null; latitude: number | null }>(
    "SELECT id, description, longitude, latitude FROM reports WHERE sector IS NULL",
  );
  const todo = rows.filter((r) => !geocodeMisses.has(r.id));
  if (todo.length === 0) return;
  const { rows: sectors } = await pool.query<SectorRow>("SELECT * FROM sectors");
  const { rows: cities } = await pool.query<{ name: string }>("SELECT name FROM city");
  const features = sectors.map((x) => rowToSector(x).feature);
  for (const r of todo) {
    let pos: LngLat | null = r.longitude != null && r.latitude != null ? [r.longitude, r.latitude] : null;
    let sector = pos && sectorOf(pos, features);
    const address = pos ? null : addressOf(r.description);
    if (address) {
      // Od najdokładniejszego: pełny adres, bez „ulica/ul./aleja/al.", a na końcu samo miasto (przybliżone położenie).
      const tries = [
        address,
        address.replace(/\b(ulica|ul\.|aleja|al\.)\s*/gi, ""),
        ...cities.filter((c) => address.includes(c.name)).map((c) => c.name),
      ];
      for (const q of [...new Set(tries)]) {
        if (lastGeocode) await new Promise((ok) => setTimeout(ok, Math.max(0, lastGeocode + 1100 - Date.now()))); // OSM: ≤ 1 zapytanie/s
        lastGeocode = Date.now();
        pos = await geocode(q).catch(() => null);
        sector = pos && sectorOf(pos, features);
        if (sector) break;
      }
    }
    if (!pos || !sector) {
      geocodeMisses.add(r.id);
      continue;
    }
    await pool.query("UPDATE reports SET longitude = $2, latitude = $3, sector = $4 WHERE id = $1", [r.id, pos[0], pos[1], sector]);
  }
}

/** Jedno uzupełnianie naraz — mapa i alarm potrafią wołać równocześnie. */
function fillMissingPlacesOnce(pool: Pool): Promise<void> {
  filling ??= fillMissingPlaces(pool)
    .catch(() => {})
    .finally(() => (filling = null));
  return filling;
}

/** Zgłoszenia utworzone po chwili `sinceMs` (do powiadomień o nowych zgłoszeniach). */
export async function reportsSince(pool: Pool, sinceMs: number): Promise<Report[]> {
  await fillMissingPlacesOnce(pool);
  // Kanały spoza aplikacji (bot telefoniczny) potrafią zapisać datę z przyszłości — wtedy `sinceMs` z przeglądarki
  // wyprzedza zegar bazy i nowe zgłoszenia (np. „Symuluj alarm") nie przychodzą. Granica nie dalej niż „teraz" bazy
  // minus zapas; znane zgłoszenia przeglądarka i tak odfiltrowuje.
  const { rows } = await pool.query<ReportRow>(
    "SELECT * FROM reports WHERE created_at >= LEAST(to_timestamp($1 / 1000.0), now() - interval '2 minutes') ORDER BY created_at",
    [sinceMs],
  );
  return rows.map(rowToReport);
}
