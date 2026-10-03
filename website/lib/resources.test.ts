import { describe, expect, it } from "vitest";
import type { Asset } from "./types";
import { insights, live, needFactor, sectorReading, sumReadings } from "./resources";

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
    const without = sectorReading("D18", "energia", [], 0);
    const withPv = sectorReading("D18", "energia", [pv], 0);
    expect(withPv.primary).toBeCloseTo(without.primary);
    expect(withPv.secondary).toBeGreaterThan(without.secondary + 6);
  });

  it("nie dolicza obiektów z innych sektorów", () => {
    expect(sectorReading("D01", "energia", [pv], 0)).toEqual(sectorReading("D01", "energia", [], 0));
  });
});

describe("needFactor", () => {
  it("dla wody dolicza straty sieci, dla reszty jest neutralny", () => {
    expect(needFactor("woda", "D13")).toBeCloseTo(1 / (1 - 0.21));
    expect(needFactor("energia", "D13")).toBe(1);
  });
});

describe("insights", () => {
  const sectors = (metric: "woda" | "odpady") =>
    ["D13", "D12"].map((id) => ({ id, name: id, reading: sectorReading(id, metric, [], 0) }));

  it("łączy straty wody ze zgłoszeniem w tym samym sektorze", () => {
    const out = insights("woda", sectors("woda"), [], [
      { id: "Z-1", category: "woda", sector: "D13", status: "nowe", title: "Wyciek" },
    ]);
    const d13 = out.find((i) => i.sector === "D13");
    expect(d13?.tone).toBe("warn");
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
  it("sumuje oba strumienie", () => {
    expect(sumReadings([{ primary: 1, secondary: 2 }, { primary: 3, secondary: 4 }])).toEqual({ primary: 4, secondary: 6 });
  });
});
