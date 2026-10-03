import { describe, expect, it } from "vitest";
import { rankSectors, type RankInput } from "./sectors";

const sectors = [
  { id: "D01", name: "Stare Miasto" },
  { id: "D02", name: "Grzegórzki" },
  { id: "D03", name: "Prądnik Czerwony" },
];

const r = (sector: string, level: RankInput["priority"]["level"], status: RankInput["status"] = "nowe", score = 50): RankInput => ({
  sector,
  status,
  priority: { level, score },
});

const reports: RankInput[] = [
  r("D01", "wysoki", "nowe", 60),
  r("D01", "sredni", "nowe", 40),
  r("D02", "krytyczny", "nowe", 80),
  r("D02", "niski", "zamkniete", 5),
  r("D03", "krytyczny", "nowe", 75),
  r("D03", "krytyczny", "przekazane", 72),
  r("D03", "wysoki", "zamkniete", 10),
];

describe("rankSectors", () => {
  it("liczy otwarte, krytyczne i zamknięte zgłoszenia każdej dzielnicy", () => {
    const rows = rankSectors(reports, sectors, "otwarte");
    expect(rows.find((x) => x.id === "D03")).toMatchObject({ name: "Prądnik Czerwony", open: 2, critical: 2, closed: 1, topScore: 75 });
    expect(rows.find((x) => x.id === "D01")).toMatchObject({ open: 2, critical: 0, closed: 0, topScore: 60 });
  });

  it("sortuje od największej liczby krytycznych, potem otwartych, potem najwyższego priorytetu", () => {
    expect(rankSectors(reports, sectors, "otwarte").map((x) => x.id)).toEqual(["D03", "D02", "D01"]);
  });

  it("w zakładce Krytyczne pokazuje tylko dzielnice z krytycznymi", () => {
    expect(rankSectors(reports, sectors, "krytyczne").map((x) => x.id)).toEqual(["D03", "D02"]);
  });

  it("w zakładce Zamknięte pokazuje dzielnice z zamkniętymi, od największej liczby", () => {
    expect(rankSectors([...reports, r("D02", "niski", "zamkniete", 3)], sectors, "zamkniete").map((x) => x.id)).toEqual(["D02", "D03"]);
  });

  it("pokazuje też dzielnice bez zgłoszeń w zakładce Otwarte — na końcu", () => {
    const rows = rankSectors([r("D02", "wysoki")], sectors, "otwarte");
    expect(rows.map((x) => x.id)).toEqual(["D02", "D01", "D03"]);
    expect(rows[1]).toMatchObject({ open: 0, critical: 0, topScore: 0 });
  });

  it("zgłoszenia poza dzielnicami są pomijane", () => {
    expect(rankSectors([{ ...r("D01", "krytyczny"), sector: null }], sectors, "krytyczne")).toEqual([]);
  });
});
