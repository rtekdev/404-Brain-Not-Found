import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { HUB, sectorReading } from "./resources";
import { suggest } from "./transfer";
import { parseMessage } from "./intake";
import { ALERT_SCENARIO, CAMERA_EVENTS, INTAKE_SCENARIOS, SHOWCASE_SECTOR } from "./simulation";
import { loadCity, type CityData } from "./city-repo";
import { sectorOf } from "./rows";

// Testy na prawdziwej bazie (docker compose up db). Bez DATABASE_URL — pomijane.
const url = process.env.DATABASE_URL;

describe.skipIf(!url)("baza danych — Kraków", () => {
  let pool: Pool;
  let city: CityData;

  beforeAll(async () => {
    pool = new Pool({ connectionString: url });
    city = await loadCity(pool);
  });
  afterAll(() => pool?.end());

  it("ma granicę miasta i 18 dzielnic D01–D18 z profilami zasobów", () => {
    expect(city.boundary.geometry.type).toMatch(/Polygon/);
    expect(city.sectors.map((s) => s.id)).toEqual(Array.from({ length: 18 }, (_, i) => `D${String(i + 1).padStart(2, "0")}`));
    for (const s of city.sectors) expect(s.profile.pop, s.id).toBeGreaterThan(0);
    expect(city.places.length).toBeGreaterThan(100);
  });

  it("każdy obiekt ma zapisaną dzielnicę zgodną z geometrią", () => {
    const rows = [...city.reports, ...city.cameras, ...city.assets, ...city.access];
    for (const x of rows) expect(x.sector, x.id).toBe(sectorOf(x.position, city.sectorFeatures));
    for (const x of rows) expect(x.sector, x.id).not.toBeNull();
  });

  it("każda dzielnica ma 2 zgłoszenia, a pokazowa co najmniej 4", () => {
    const seeded = city.reports.filter((r) => Number(r.id.slice(2)) < 1062);
    for (const s of city.sectors) {
      const n = seeded.filter((r) => r.sector === s.id).length;
      if (s.id === SHOWCASE_SECTOR) expect(n, s.id).toBeGreaterThanOrEqual(4);
      else expect(n, s.id).toBe(2);
    }
  });

  it("co najmniej 5 kamer ma obraz na żywo z WebCamera.pl", () => {
    const live = city.cameras.filter((c) => c.live);
    expect(live.length).toBeGreaterThanOrEqual(5);
    for (const c of live) expect(c.live!.src, c.id).toMatch(/^https:\/\/player\.webcamera\.pl\/[a-z0-9]+_cam_[a-z0-9]+$/);
  });

  it("centrala leży w granicach miasta", () => {
    expect(sectorOf(HUB.position, city.sectorFeatures)).not.toBeNull();
  });

  it("wyciek wody leży w dzielnicy ze stratami, przepełnione kontenery — w dzielnicy z zaległościami", () => {
    const profile = (id: string | null) => city.sectors.find((s) => s.id === id)!.profile;
    const leak = city.reports.find((r) => r.title === "Wyciek wody z jezdni")!;
    const bins = city.reports.find((r) => r.title === "Przepełnione kontenery na odpady")!;
    expect(profile(leak.sector).waterLoss).toBeGreaterThan(0.15);
    expect(profile(bins.sector).wasteCapacity).toBeLessThan(0.88);
  });

  it("dla wody najlepsza proponowana trasa prowadzi do dzielnicy pokazowej przez całe 2 minuty", () => {
    for (let t = 0; t <= 120_000; t += 1500) {
      const base = Object.fromEntries(city.sectors.map((s) => [s.id, sectorReading(s, "woda", city.assets, t)]));
      expect(suggest("woda", base, city.sectors)[0]?.to, `t=${t}`).toBe(SHOWCASE_SECTOR);
    }
  });

  it("scenariusze Telegrama i telefonu kończą się w dzielnicy pokazowej", () => {
    for (const s of INTAKE_SCENARIOS) {
      const d = parseMessage(s.text, { places: city.places, location: s.location });
      expect(d.position, s.channel).not.toBeNull();
      expect(sectorOf(d.position!, city.sectorFeatures), s.channel).toBe(SHOWCASE_SECTOR);
    }
  });

  it("symulacje kamer wskazują istniejące kamery i leżą w mieście", () => {
    const ids = new Set(city.cameras.map((c) => c.id));
    for (const e of CAMERA_EVENTS) {
      expect(ids.has(e.cameraId!), e.cameraId).toBe(true);
      expect(sectorOf(e.position, city.sectorFeatures), e.title).not.toBeNull();
    }
  });

  it("scenariusz alarmu leży w Czyżynach (D14), przy Tauron Arenie", () => {
    for (const s of ALERT_SCENARIO) expect(sectorOf(s.position, city.sectorFeatures), s.title).toBe("D14");
  });

  it("kolizja na rondzie Matecznego jest przejęta przez 112", () => {
    expect(city.reports.find((r) => r.title === "Kolizja dwóch samochodów")?.handledBy).toMatch(/^112/);
  });

  it("przyjmuje zgłoszenia z Telegrama (ograniczenie kolumny source)", async () => {
    const c = await pool.connect();
    try {
      await c.query("BEGIN");
      await c.query(
        `INSERT INTO reports (id, title, description, category, source, longitude, latitude, sector)
         VALUES ('Z-TEST', 't', 'd', 'woda', 'telegram', 19.97, 50.05, 'D13')`,
      );
      await c.query("ROLLBACK");
    } finally {
      c.release();
    }
  });
});
