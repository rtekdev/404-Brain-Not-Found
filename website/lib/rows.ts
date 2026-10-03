import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import type { AccessKind, AccessPoint, Asset, AssetKind, Camera, Category, LngLat, Meter, Place, Report, Sector, Source, Status } from "./types";

// Wiersze z Postgresa (snake_case) → typy aplikacji. Czyste funkcje — bez połączenia z bazą.

export type SectorFeature = Feature<Polygon | MultiPolygon, { id: string; name: string }>;

export interface ReportRow {
  id: string;
  title: string;
  description: string;
  category: Category;
  source: Source;
  status: Status;
  longitude: number;
  latitude: number;
  sector: string | null;
  created_at: Date;
  unit_id: string | null;
  confirmations: number;
  blocking: boolean;
  camera_id: string | null;
  confidence: number;
  handled_by: string | null;
}

export function rowToReport(r: ReportRow): Report {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    source: r.source,
    status: r.status,
    position: [r.longitude, r.latitude],
    sector: r.sector,
    createdAt: new Date(r.created_at).getTime(),
    unitId: r.unit_id,
    confirmations: r.confirmations,
    blocking: r.blocking,
    cameraId: r.camera_id ?? undefined,
    confidence: r.confidence,
    handledBy: r.handled_by,
  };
}

export interface CameraRow {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  sector: string | null;
  online: boolean;
  webcam_id: string | null;
}

export function rowToCamera(r: CameraRow): Camera {
  return {
    id: r.id,
    name: r.name,
    position: [r.longitude, r.latitude],
    sector: r.sector,
    online: r.online,
    live: r.webcam_id ? { kind: "embed", src: `https://player.webcamera.pl/${r.webcam_id}`, credit: "WebCamera.pl" } : undefined,
  };
}

export interface AssetRow {
  id: string;
  kind: AssetKind;
  name: string;
  longitude: number;
  latitude: number;
  sector: string | null;
  unit_id: string;
  level: number;
  level_label: string;
  meters: Meter[] | null;
}

export function rowToAsset(r: AssetRow): Asset {
  return {
    id: r.id,
    kind: r.kind,
    name: r.name,
    position: [r.longitude, r.latitude],
    sector: r.sector,
    unitId: r.unit_id,
    level: r.level,
    levelLabel: r.level_label,
    meters: r.meters ?? undefined,
  };
}

export interface AccessPointRow {
  id: string;
  kind: AccessKind;
  name: string;
  longitude: number;
  latitude: number;
  sector: string | null;
  ok: boolean;
}

export function rowToAccessPoint(r: AccessPointRow): AccessPoint {
  return { id: r.id, kind: r.kind, name: r.name, position: [r.longitude, r.latitude], sector: r.sector, ok: r.ok };
}

export interface SectorRow {
  id: string;
  name: string;
  area_km2: number;
  anchor_lon: number;
  anchor_lat: number;
  geometry: Polygon | MultiPolygon;
  pop: number;
  water_loss: number;
  water_reserve: number;
  waste_capacity: number;
  rooftop_pv: number;
}

export function rowToSector(r: SectorRow): { sector: Sector; feature: SectorFeature } {
  return {
    sector: {
      id: r.id,
      name: r.name,
      areaKm2: r.area_km2,
      anchor: [r.anchor_lon, r.anchor_lat],
      profile: {
        pop: r.pop,
        waterLoss: r.water_loss,
        waterReserve: r.water_reserve,
        wasteCapacity: r.waste_capacity,
        rooftopPv: r.rooftop_pv,
      },
    },
    feature: { type: "Feature", id: r.id, properties: { id: r.id, name: r.name }, geometry: r.geometry },
  };
}

export interface PlaceRow {
  name: string;
  longitude: number;
  latitude: number;
  sector: string | null;
}

export function rowToPlace(r: PlaceRow): Place {
  return { name: r.name, position: [r.longitude, r.latitude], sector: r.sector };
}

/** Dzielnica, w której leży punkt; null — poza miastem. */
export function sectorOf(pos: LngLat, sectors: SectorFeature[]): string | null {
  const pt = { type: "Point" as const, coordinates: pos };
  return sectors.find((f) => booleanPointInPolygon(pt, f))?.properties.id ?? null;
}
