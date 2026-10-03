import { describe, expect, it } from "vitest";
import { scoreReport } from "./priority";
import type { Report } from "./types";

const base: Report = {
  id: "Z-1",
  title: "Zdarzenie w parku",
  description: "Opis",
  category: "bezpieczenstwo",
  source: "telefon",
  status: "nowe",
  position: [19.99, 50.07],
  sector: "D14",
  createdAt: 0,
  unitId: null,
  confirmations: 1,
  blocking: false,
  confidence: 0.9,
};

describe("scoreReport", () => {
  it("zagrożenie zdrowia (zemdlenie, krew) czyni zgłoszenie krytycznym", () => {
    const r = scoreReport({ ...base, title: "Wypadek: mężczyzna zemdlał", description: "Upadł, krew z głowy." }, 0);
    expect(r.level).toBe("krytyczny");
    expect(r.reasons).toContain("zagrożenie zdrowia lub życia");
  });

  it("zasłabnięcie też jest zagrożeniem zdrowia", () => {
    const r = scoreReport({ ...base, title: "Człowiek na ławce — prawdopodobne zasłabnięcie", description: "Nie reaguje." }, 0);
    expect(r.level).toBe("krytyczny");
  });

  it("to samo zdarzenie bez objawów zdrowotnych nie jest krytyczne", () => {
    expect(scoreReport(base, 0).level).not.toBe("krytyczny");
  });
});
