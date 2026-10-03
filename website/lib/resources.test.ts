import { describe, expect, it } from "vitest";
import type { Asset, Sector, SectorProfile } from "./types";
import { insights, live, sectorReading, sumReadings } from "./resources";

const profile = (p: Partial<SectorProfile> = {}): SectorProfile => ({
  pop: 30000,
  waterLoss: 0.08,
  waterReserve: 1,
  wasteCapacity: 1,
  rooftopPv: 1,
  ...p,
});

const sector = (id: string, p: Partial<SectorProfile> = {}): Sector => ({
  id,
  name: id,
  areaKm2: 10,
  anchor: [20, 50],
  profile: profile(p),
});

const pv: Asset = {
  id: "PV",
  kind: "fotowoltaika",
  name: "Farma PV",
  position: [20.15, 50.07],
  sector: "D18",
  unitId: "energia",
  level: 70,
  levelLabel: "",
  meters: [{ metric: "energia", primary: 0, secondary: 7.5 }],
};

describe("live", () => {
  it("waha się wokół wartości bazowej w zadanej amplitudzie", () => {
    for (let t = 0; t < 60_000; t += 1500) {
      const v = live(100, "k", t, 0.05);
      expect(v).toBeGreaterThanOrEqual(100 * (1 - 0.05 * 1.4));
      expect(v).toBeLessThanOrEqual(100 * (1 + 0.05 * 1.4));
    }
  });

  it("jest deterministyczne dla tego samego klucza i chwili", () => {
    expect(live(10, "a", 1234)).toBe(live(10, "a", 1234));
  });
});

describe("sectorReading", () => {
  it("dolicza produkcję obiektów leżących w sektorze", () => {
    const without = sectorReading(sector("D18"), "energia", [], 0);
    const withPv = sectorReading(sector("D18"), "energia", [pv], 0);
    expect(withPv.primary).toBeCloseTo(without.primary);
    expect(withPv.secondary).toBeGreaterThan(without.secondary + 6);
  });

  it("nie dolicza obiektów z innych sektorów", () => {
    expect(sectorReading(sector("D01"), "energia", [pv], 0)).toEqual(sectorReading(sector("D01"), "energia", [], 0));
  });

  it("skaluje zużycie liczbą mieszkańców z profilu dzielnicy", () => {
    const small = sectorReading(sector("A", { pop: 10000 }), "woda", [], 0).primary;
    const big = sectorReading(sector("A", { pop: 40000 }), "woda", [], 0).primary;
    expect(big / small).toBeCloseTo(4);
  });

  it("dla wody potrzeba dolicza straty sieci, dla reszty równa się zużyciu", () => {
    const w = sectorReading(sector("D13", { waterLoss: 0.21 }), "woda", [], 0);
    expect(w.need).toBeCloseTo(w.primary / (1 - 0.21));
    const e = sectorReading(sector("D13", { waterLoss: 0.21 }), "energia", [], 0);
    expect(e.need).toBeCloseTo(e.primary);
  });
});

describe("insights", () => {
  const sectors = (metric: "woda" | "odpady") =>
    [sector("D13", { waterLoss: 0.21 }), sector("D12", { wasteCapacity: 0.8 })].map((s) => ({
      id: s.id,
      name: s.name,
      reading: sectorReading(s, metric, [], 0),
    }));

  it("łączy straty wody ze zgłoszeniem w tym samym sektorze", () => {
    const out = insights("woda", sectors("woda"), [], [
      { id: "Z-1", category: "woda", sector: "D13", status: "nowe", title: "Wyciek" },
    ]);
    const d13 = out.find((i) => i.sector === "D13");
    expect(d13?.tone).toBe("warn");
    expect(d13?.text).toContain("straty 21%");
    expect(d13?.reportId).toBe("Z-1");
  });

  it("pomija zamknięte zgłoszenia przy łączeniu", () => {
    const out = insights("woda", sectors("woda"), [], [
      { id: "Z-1", category: "woda", sector: "D13", status: "zamkniete", title: "Wyciek" },
    ]);
    expect(out.find((i) => i.sector === "D13")?.reportId).toBeUndefined();
  });

  it("wskazuje zaległości w odbiorze odpadów", () => {
    const out = insights("odpady", sectors("odpady"), [], []);
    expect(out.map((i) => i.sector)).toEqual(["D12"]);
  });
});

describe("sumReadings", () => {
  it("sumuje strumienie", () => {
    expect(sumReadings([{ primary: 1, secondary: 2 }, { primary: 3, secondary: 4 }])).toMatchObject({ primary: 4, secondary: 6 });
  });
});
