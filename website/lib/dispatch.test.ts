import { describe, expect, it } from "vitest";
import { dispatchFor, pointAlong, startPoint } from "./dispatch";
import { distanceKm } from "./transfer";
import type { Report } from "./types";

const base: Report & { priority: { level: "krytyczny" | "wysoki" | "sredni" | "niski" } } = {
  id: "Z-1",
  title: "Wyciek wody z jezdni",
  description: "Woda płynie ulicą",
  category: "woda",
  source: "telefon",
  status: "przekazane",
  position: [19.95, 50.04],
  sector: "D13",
  createdAt: 0,
  unitId: "woda",
  confirmations: 1,
  blocking: false,
  confidence: 0.9,
  priority: { level: "wysoki" },
};

describe("dispatchFor", () => {
  it("zwykłe zgłoszenie czekające w kolejce nie wysyła pojazdu", () => {
    expect(dispatchFor(base)).toBeNull();
  });

  it("zgłoszenie w realizacji wysyła ekipę jednostki", () => {
    const d = dispatchFor({ ...base, status: "w_realizacji" });
    expect(d?.kind).toBe("sluzby");
    expect(d?.label).toContain("Wodociągi");
  });

  it("zasłabnięcie jedzie karetką", () => {
    const d = dispatchFor({ ...base, category: "bezpieczenstwo", title: "Człowiek na ławce — zasłabnięcie", priority: { level: "krytyczny" } });
    expect(d?.kind).toBe("karetka");
  });

  it("krytyczne zdarzenie bezpieczeństwa bez objawów zdrowotnych jedzie policja", () => {
    const d = dispatchFor({ ...base, category: "bezpieczenstwo", title: "Bójka przed sklepem", priority: { level: "krytyczny" } });
    expect(d?.kind).toBe("policja");
  });

  it("przekazanie służbom zewnętrznym decyduje o pojeździe", () => {
    expect(dispatchFor({ ...base, handledBy: "Straż Pożarna" })?.kind).toBe("straz");
    expect(dispatchFor({ ...base, handledBy: "Policja" })?.kind).toBe("policja");
  });

  it("zamknięte zgłoszenie nie wysyła nikogo", () => {
    expect(dispatchFor({ ...base, status: "zamkniete", priority: { level: "krytyczny" } })).toBeNull();
  });
});

describe("startPoint", () => {
  it("baza pojazdu leży 1,2–2 km od celu i zależy tylko od identyfikatora", () => {
    const a = startPoint(base.position, "Z-1");
    expect(distanceKm(a, base.position)).toBeGreaterThan(1.2);
    expect(distanceKm(a, base.position)).toBeLessThan(2);
    expect(startPoint(base.position, "Z-1")).toEqual(a);
    expect(startPoint(base.position, "Z-2")).not.toEqual(a);
  });
});

describe("pointAlong", () => {
  const path: [number, number][] = [[0, 0], [1, 0], [1, 1]];
  it("początek i koniec trasy", () => {
    expect(pointAlong(path, 0).at).toEqual([0, 0]);
    expect(pointAlong(path, 1).at).toEqual([1, 1]);
  });
  it("połowa długości trasy wypada w zakręcie", () => {
    const p = pointAlong(path, 0.5).at;
    expect(p[0]).toBeCloseTo(1, 1);
    expect(p[1]).toBeCloseTo(0, 1);
  });
});
