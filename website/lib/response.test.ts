import { describe, expect, it } from "vitest";
import { pickAlert, responsePlan, type PlanInput } from "./response";
import { scoreReport } from "./priority";
import { ALERT_SCENARIO } from "./simulation";

const accident: PlanInput = {
  id: "Z-2001",
  title: "Wypadek: zderzenie tramwaju z samochodem",
  description: "Dwie osoby poszkodowane, tramwaje stoją.",
  category: "bezpieczenstwo",
  source: "kamera",
  status: "nowe",
  position: [19.9368, 50.048],
  sector: "D13",
  unitId: null,
  confirmations: 3,
  blocking: true,
  cameraId: "K04",
  handledBy: "112 — CPR Kraków",
  confidence: 0.94,
  priority: { level: "krytyczny", score: 87 },
};

const bin: PlanInput = {
  ...accident,
  id: "Z-2002",
  title: "Przepełniony kosz przy przystanku",
  description: "Śmieci wysypują się na chodnik.",
  category: "odpady",
  source: "sms",
  blocking: false,
  cameraId: undefined,
  handledBy: null,
  confirmations: 1,
  priority: { level: "niski", score: 14 },
};

const ctx = {
  sectorName: (id: string | null) => (id === "D13" ? "Podgórze" : "—"),
  cameraName: (id: string) => (id === "K04" ? "Rondo Grunwaldzkie" : id),
  nearbyOpen: 2,
};

describe("responsePlan", () => {
  it("wypadek przejęty przez 112: status, skrót i kroki od najważniejszego", () => {
    const p = responsePlan(accident, ctx);
    expect(p.status).toEqual({ label: "Przejęte przez 112 — CPR Kraków", tone: "external" });
    expect(p.summary.join(" ")).toContain("D13 Podgórze");
    expect(p.summary.join(" ")).toContain("blokuje ruch");
    const labels = p.steps.map((s) => s.label);
    expect(labels[0]).toMatch(/112/);
    expect(labels.some((l) => /MPK/.test(l))).toBe(true);
    expect(labels.some((l) => /Straż Miejska/.test(l))).toBe(true);
    expect(labels.some((l) => /SMS/.test(l))).toBe(true);
    expect(p.steps.find((s) => s.action === "camera")).toMatchObject({ target: "K04" });
    expect(labels.some((l) => /2 inne zgłoszenia/.test(l))).toBe(true);
  });

  it("nie proponuje przekazania jednostce, gdy zgłoszenie przejęły służby", () => {
    expect(responsePlan(accident, ctx).steps.some((s) => s.action === "assign")).toBe(false);
  });

  it("drobne zgłoszenie: lekki plan — przekazanie jednostce, bez alarmu SMS", () => {
    const p = responsePlan({ ...bin, cameraId: undefined }, { ...ctx, nearbyOpen: 0 });
    expect(p.status.tone).toBe("open");
    expect(p.steps[0]).toMatchObject({ action: "assign", target: "odpady" });
    expect(p.steps.some((s) => /SMS/.test(s.label))).toBe(false);
  });

  it("każdy krok ma unikalny identyfikator", () => {
    const ids = responsePlan(accident, ctx).steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("pickAlert", () => {
  it("animuje najważniejsze, pozostałe sortuje od najważniejszego", () => {
    const a = pickAlert([bin, accident, { ...bin, id: "Z-2003", priority: { level: "sredni", score: 35 } }]);
    expect(a?.lead.id).toBe("Z-2001");
    expect(a?.level).toBe("critical");
    expect(a?.all.map((r) => r.id)).toEqual(["Z-2001", "Z-2003", "Z-2002"]);
  });

  it("same zwykłe zgłoszenia dają lekki komunikat", () => {
    expect(pickAlert([bin])?.level).toBe("normal");
  });

  it("brak nowych zgłoszeń — brak komunikatu", () => {
    expect(pickAlert([])).toBeNull();
  });
});

describe("scenariusz alarmu na prezentację", () => {
  it("jedno krytyczne zgłoszenie z kamery: człowiek na ławce, pogotowie powiadomione", () => {
    expect(ALERT_SCENARIO).toHaveLength(1);
    const [s] = ALERT_SCENARIO;
    expect(s.title).toMatch(/Człowiek na ławce/);
    expect(s.title).toMatch(/zasłabnięcie/);
    expect(s.source).toBe("kamera");
    expect(s.cameraId).toBeTruthy();
    expect(s.handledBy).toMatch(/^112 — pogotowie powiadomione/);
    const p = scoreReport({ ...s, id: "x", status: "nowe", sector: null, createdAt: 0, unitId: null, confirmations: s.confirmations ?? 1 }, 0);
    expect(p.level).toBe("krytyczny");
  });

  it("plan: 112 prowadzi, AED i dojazd dla ratowników, podgląd kamery", () => {
    const [s] = ALERT_SCENARIO;
    const p = responsePlan(
      { ...s, id: "Z-4001", status: "nowe", sector: "D14", unitId: null, confirmations: 1, handledBy: s.handledBy ?? null, priority: { level: "krytyczny", score: 80 } },
      { ...ctx, related: [] },
    );
    const ids = p.steps.map((x) => x.id);
    expect(p.status.label).toBe(`Przejęte przez ${s.handledBy}`);
    expect(ids).toEqual(expect.arrayContaining(["112", "aed", "dojazd", "camera"]));
  });
});

describe("wypadek medyczny w parku (scenariusz prezentacji)", () => {
  const faint: PlanInput = {
    ...accident,
    id: "Z-3001",
    title: "Wypadek: mężczyzna zemdlał po upadku",
    description: "Wpadł w dziurę na alejce, upadł, stracił przytomność, krew z głowy.",
    source: "telefon",
    blocking: false,
    cameraId: undefined,
    handledBy: "112 — PRM w drodze",
  };
  const pothole = { id: "Z-3002", title: "Dziura w alejce przy food truckach", category: "drogi" as const, distanceM: 6 };

  it("kroki medyczne zamiast objazdów, z przyczyną w pobliskiej dziurze", () => {
    const p = responsePlan(faint, { ...ctx, nearbyOpen: 0, related: [pothole] });
    const labels = p.steps.map((s) => s.label);
    expect(p.status.label).toBe("Przejęte przez 112 — PRM w drodze");
    expect(labels[0]).toMatch(/112/);
    expect(labels.some((l) => /AED/.test(l))).toBe(true);
    expect(labels.some((l) => /dojazd/i.test(l))).toBe(true);
    expect(labels.some((l) => /MPK/.test(l))).toBe(false);
    expect(p.steps.find((s) => s.id === "cause")).toMatchObject({ action: "notify", target: "Zarząd Dróg" });
    expect(labels.find((l) => /Prawdopodobna przyczyna/.test(l))).toContain("Z-3002");
  });

  it("pomija zgłoszenia dalej niż 200 m jako przyczynę", () => {
    const p = responsePlan(faint, { ...ctx, related: [{ ...pothole, distanceM: 450 }] });
    expect(p.steps.some((s) => s.id === "cause")).toBe(false);
  });
});
