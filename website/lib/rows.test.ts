import { describe, expect, it } from "vitest";
import type { MultiPolygon, Polygon } from "geojson";
import { rowToAccessPoint, rowToAsset, rowToCamera, rowToPlace, rowToReport, rowToSector, sectorOf } from "./rows";

// Wiersze z Postgresa (snake_case, liczby jako number, daty jako Date) → typy aplikacji.

describe("rowToReport", () => {
  it("mapuje kolumny na zgłoszenie z pozycją [lon, lat] i czasem w ms", () => {
    const created = new Date("2026-10-03T10:00:00Z");
    const r = rowToReport({
      id: "Z-1048", title: "Wyciek", description: "Opis", category: "woda", source: "telegram", status: "nowe",
      longitude: 19.964, latitude: 50.048, sector: "D13", created_at: created, unit_id: null,
      confirmations: 4, blocking: false, camera_id: null, confidence: 0.82, handled_by: "112 — Policja",
    });
    expect(r).toEqual({
      id: "Z-1048", title: "Wyciek", description: "Opis", category: "woda", source: "telegram", status: "nowe",
      position: [19.964, 50.048], sector: "D13", createdAt: created.getTime(), unitId: null,
      confirmations: 4, blocking: false, cameraId: undefined, confidence: 0.82, handledBy: "112 — Policja",
    });
  });
});

describe("rowToCamera", () => {
  it("z identyfikatora WebCamera.pl robi osadzany podgląd na żywo", () => {
    const c = rowToCamera({ id: "K01", name: "Rynek", longitude: 19.9, latitude: 50.06, sector: "D01", online: true, webcam_id: "krakow_cam_da9ab3" });
    expect(c.live).toEqual({ kind: "embed", src: "https://player.webcamera.pl/krakow_cam_da9ab3", credit: "WebCamera.pl" });
    expect(c.position).toEqual([19.9, 50.06]);
  });

  it("bez identyfikatora kamera nie ma podglądu na żywo", () => {
    expect(rowToCamera({ id: "K02", name: "Rondo", longitude: 1, latitude: 2, sector: null, online: false, webcam_id: null }).live).toBeUndefined();
  });
});

describe("rowToAsset i rowToAccessPoint", () => {
  it("mapują obiekt z licznikami i punkt dostępności", () => {
    const a = rowToAsset({
      id: "A14", kind: "elektrocieplownia", name: "EC", longitude: 20.02, latitude: 50.06, sector: "D14",
      unit_id: "energia", level: 74, level_label: "obciążenie 74%", meters: [{ metric: "energia", primary: 0, secondary: 180 }],
    });
    expect(a).toMatchObject({ unitId: "energia", levelLabel: "obciążenie 74%", position: [20.02, 50.06], meters: [{ metric: "energia" }] });
    expect(rowToAsset({ ...a, unit_id: "drogi", level_label: "", longitude: 1, latitude: 2, meters: null }).meters).toBeUndefined();

    const p = rowToAccessPoint({ id: "P01", kind: "winda", name: "Winda", longitude: 19.94, latitude: 50.06, sector: "D01", ok: false });
    expect(p).toEqual({ id: "P01", kind: "winda", name: "Winda", position: [19.94, 50.06], sector: "D01", ok: false });
  });
});

const square = (x: number, y: number): Polygon => ({
  type: "Polygon",
  coordinates: [[[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1], [x, y]]],
});

describe("rowToSector i sectorOf", () => {
  const rows = [
    { id: "D01", name: "A", area_km2: 5.5, anchor_lon: 0.5, anchor_lat: 0.5, geometry: square(0, 0) as Polygon | MultiPolygon,
      pop: 31000, water_loss: 0.09, water_reserve: 0.94, waste_capacity: 0.95, rooftop_pv: 0.3 },
    { id: "D02", name: "B", area_km2: 6, anchor_lon: 1.5, anchor_lat: 0.5, geometry: square(1, 0) as Polygon | MultiPolygon,
      pop: 29000, water_loss: 0.08, water_reserve: 0.97, waste_capacity: 1.02, rooftop_pv: 0.6 },
  ];

  it("dzielnica ma profil zasobów i geometrię jako Feature", () => {
    const { sector, feature } = rowToSector(rows[0]);
    expect(sector).toEqual({
      id: "D01", name: "A", areaKm2: 5.5, anchor: [0.5, 0.5],
      profile: { pop: 31000, waterLoss: 0.09, waterReserve: 0.94, wasteCapacity: 0.95, rooftopPv: 0.3 },
    });
    expect(feature.properties).toMatchObject({ id: "D01", name: "A" });
    expect(feature.id).toBe("D01");
  });

  it("sectorOf znajduje dzielnicę punktu albo zwraca null", () => {
    const features = rows.map((r) => rowToSector(r).feature);
    expect(sectorOf([0.2, 0.2], features)).toBe("D01");
    expect(sectorOf([1.7, 0.9], features)).toBe("D02");
    expect(sectorOf([5, 5], features)).toBeNull();
  });

  it("rowToPlace mapuje osiedle", () => {
    expect(rowToPlace({ name: "Zabłocie", longitude: 19.97, latitude: 50.05, sector: "D13" })).toEqual({
      name: "Zabłocie", position: [19.97, 50.05], sector: "D13",
    });
  });
});
