import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { ACCESS_POINTS, ASSETS, CAMERAS, CAMERA_EVENTS, buildReports } from "./demo-data";
import { HUB, PROFILE } from "./resources";
import type { LngLat } from "./types";

// Spójność danych pokazowych z geometrią miasta (public/data/krakow).
const sectors = JSON.parse(
  readFileSync(new URL("../public/data/krakow/sectors.geojson", import.meta.url), "utf8"),
) as FeatureCollection<Polygon | MultiPolygon>;

const districtOf = (p: LngLat) =>
  sectors.features.find((f) => booleanPointInPolygon({ type: "Point", coordinates: p }, f))?.properties?.id as string | undefined;

describe("geometria Krakowa", () => {
  it("ma 18 dzielnic D01–D18", () => {
    expect(sectors.features.map((f) => f.properties?.id).sort()).toEqual(
      Array.from({ length: 18 }, (_, i) => `D${String(i + 1).padStart(2, "0")}`),
    );
  });

  it("każda dzielnica ma profil zasobów", () => {
    for (const f of sectors.features) expect(PROFILE[f.properties?.id], f.properties?.id).toBeDefined();
  });

  it("centrala leży w granicach miasta", () => {
    expect(districtOf(HUB.position)).toBeDefined();
  });
});

describe("dane pokazowe", () => {
  const points: [string, LngLat][] = [
    ...CAMERAS.map((c) => [`kamera ${c.id}`, c.position] as [string, LngLat]),
    ...ASSETS.map((a) => [`obiekt ${a.id}`, a.position] as [string, LngLat]),
    ...ACCESS_POINTS.map((a) => [`dostępność ${a.id}`, a.position] as [string, LngLat]),
    ...buildReports(0).map((r) => [`zgłoszenie ${r.title}`, r.position] as [string, LngLat]),
    ...CAMERA_EVENTS.map((e) => [`symulacja ${e.title}`, e.position] as [string, LngLat]),
  ];

  it.each(points)("%s leży w dzielnicy Krakowa", (_, pos) => {
    expect(districtOf(pos)).toBeDefined();
  });

  it("co najmniej 5 kamer ma obraz na żywo z WebCamera.pl, z podanym autorem", () => {
    const live = CAMERAS.filter((c) => c.live);
    expect(live.length).toBeGreaterThanOrEqual(5);
    for (const c of live) {
      expect(c.live!.src, c.id).toMatch(/^https:\/\/player\.webcamera\.pl\/[a-z0-9]+_cam_[a-z0-9]+$/);
      expect(c.live!.credit, c.id).toBe("WebCamera.pl");
    }
  });

  it("identyfikatory kamer są unikalne", () => {
    expect(new Set(CAMERAS.map((c) => c.id)).size).toBe(CAMERAS.length);
  });

  it("zgłoszenia i symulacje wskazują istniejące kamery", () => {
    const ids = new Set(CAMERAS.map((c) => c.id));
    for (const r of [...buildReports(0), ...CAMERA_EVENTS]) if (r.cameraId) expect(ids.has(r.cameraId), r.cameraId).toBe(true);
  });

  it("wyciek wody leży w dzielnicy z dużymi stratami, a przepełnione kontenery — w dzielnicy z zaległościami", () => {
    const reports = buildReports(0);
    const leak = reports.find((r) => r.category === "woda" && r.title.includes("Wyciek"))!;
    const bins = reports.find((r) => r.category === "odpady" && r.title.includes("kontenery"))!;
    expect(PROFILE[districtOf(leak.position)!].waterLoss).toBeGreaterThan(0.15);
    expect(PROFILE[districtOf(bins.position)!].wasteCapacity).toBeLessThan(0.88);
  });
});
