import { describe, expect, it } from "vitest";
import type { Sector } from "./types";
import type { Reading } from "./resources";
import { applyTransfers, distanceKm, estimate, money, suggest } from "./transfer";

const profile = { pop: 10000, waterLoss: 0.1, waterReserve: 1, wasteCapacity: 1, rooftopPv: 1 };
const sectors: Sector[] = [
  { id: "A", name: "Nadwyżka", areaKm2: 1, anchor: [20.6, 50.86], profile },
  { id: "B", name: "Niedobór", areaKm2: 1, anchor: [20.63, 50.87], profile },
  { id: "C", name: "Na styk", areaKm2: 1, anchor: [20.6, 50.89], profile },
];

// Energia: A produkuje 10 przy zużyciu 4 (nadwyżka 6), B produkuje 1 przy zużyciu 8, C jest pokryty dokładnie.
const base: Record<string, Reading> = {
  A: { primary: 4, secondary: 10 },
  B: { primary: 8, secondary: 1 },
  C: { primary: 5, secondary: 5 },
};

describe("distanceKm", () => {
  it("liczy odległość po kuli ziemskiej", () => {
    expect(distanceKm([20.6, 50.86], [20.6, 50.86])).toBe(0);
    // 0,03° długości na 50,86° szerokości ≈ 2,1 km, 0,01° szerokości ≈ 1,1 km.
    expect(distanceKm(sectors[0].anchor, sectors[1].anchor)).toBeCloseTo(2.38, 1);
  });
});

describe("estimate", () => {
  it("odrzuca przekierowanie do tego samego sektora i nieznane sektory", () => {
    expect(estimate({ metric: "energia", from: "A", to: "A", pct: 50 }, base, sectors)).toBeNull();
    expect(estimate({ metric: "energia", from: "A", to: "X", pct: 50 }, base, sectors)).toBeNull();
  });

  it("przy 0% nic nie przenosi i nic nie kosztuje", () => {
    const e = estimate({ metric: "energia", from: "A", to: "B", pct: 0 }, base, sectors)!;
    expect(e.amount).toBe(0);
    expect(e.net).toBe(0);
    expect(e.risky).toBe(false);
  });

  it("z nadwyżki do niedoboru daje zysk pomniejszony o straty przesyłu", () => {
    const e = estimate({ metric: "energia", from: "A", to: "B", pct: 50 }, base, sectors)!;
    expect(e.amount).toBeCloseTo(5);
    expect(e.lossShare).toBeCloseTo(e.km * 0.012);
    expect(e.delivered).toBeCloseTo(5 * (1 - e.lossShare));
    // Cel kupowałby po 750 zł, nadwyżka byłaby sprzedana po 300 zł.
    expect(e.net).toBeCloseTo(e.delivered * 750 - 5 * 300);
    expect(e.netDaily).toBeCloseTo(e.net * 24);
    expect(e.risky).toBe(false);
    expect(e.gains.some((g) => g.startsWith("B:"))).toBe(true);
  });

  it("ostrzega, gdy źródło oddaje więcej niż ma nadwyżki", () => {
    const e = estimate({ metric: "energia", from: "C", to: "B", pct: 40 }, base, sectors)!;
    expect(e.risky).toBe(true);
    expect(e.net).toBeLessThan(0);
    expect(e.costs.some((c) => c.includes("odkupić"))).toBe(true);
  });

  it("nie ostrzega przy wahaniach poniżej progu", () => {
    // Nadwyżka 6, przenosimy 6,05 — różnica mniejsza niż 2% przenoszonej ilości.
    const e = estimate({ metric: "energia", from: "A", to: "B", pct: 60.5 }, base, sectors)!;
    expect(e.risky).toBe(false);
    expect(e.costs.some((c) => c.includes("odkupić"))).toBe(false);
  });

  it("dla odpadów wycenia na dobę, nie na godzinę", () => {
    const e = estimate({ metric: "odpady", from: "A", to: "B", pct: 30 }, base, sectors)!;
    expect(e.netDaily).toBe(e.net);
  });
});

describe("applyTransfers", () => {
  it("przenosi kwotę ze źródła i dostarcza ją pomniejszoną o straty", () => {
    const t = { id: "t1", metric: "energia" as const, from: "A", to: "B", pct: 50 };
    const e = estimate(t, base, sectors)!;
    const out = applyTransfers(base, [t], "energia", sectors);
    expect(out.A.secondary).toBeCloseTo(10 - e.amount);
    expect(out.B.secondary).toBeCloseTo(1 + e.delivered);
    expect(out.A.primary).toBe(4);
    expect(base.A.secondary).toBe(10);
  });

  it("pomija przekierowania innej miary", () => {
    const out = applyTransfers(base, [{ id: "t1", metric: "woda", from: "A", to: "B", pct: 50 }], "energia", sectors);
    expect(out).toEqual(base);
  });
});

describe("suggest", () => {
  it("proponuje tylko trasy z nadwyżki do niedoboru, od najbardziej opłacalnej", () => {
    const s = suggest("energia", base, sectors);
    expect(s.length).toBeGreaterThan(0);
    expect(s.every((x) => x.from === "A" && x.net > 0)).toBe(true);
    expect(s[0].to).toBe("B");
    for (let i = 1; i < s.length; i++) expect(s[i - 1].net).toBeGreaterThanOrEqual(s[i].net);
  });

  it("zostawia zapas — nie wyczerpuje całej nadwyżki źródła", () => {
    const [best] = suggest("energia", base, sectors);
    expect((base.A.secondary * best.pct) / 100).toBeLessThanOrEqual(6 * 0.9 + 1e-9);
  });
});

describe("money", () => {
  it("formatuje kwoty ze znakiem", () => {
    // Polski zapis: separator tysięcy dopiero od pięciu cyfr.
    expect(money(1234.4)).toBe("+1234 zł");
    expect(money(12345.6).replace(/\s/g, " ")).toBe("+12 346 zł");
    expect(money(-50).replace(/\s/g, " ")).toBe("−50 zł");
    expect(money(0)).toBe("0 zł");
  });
});
