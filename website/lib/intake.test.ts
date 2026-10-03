import { describe, expect, it } from "vitest";
import { findPlace, parseMessage } from "./intake";
import type { Place } from "./types";

const places: Place[] = [
  { name: "Zabłocie", position: [19.9735, 50.0511], sector: "D13" },
  { name: "Stare Podgórze", position: [19.9493, 50.0444], sector: "D13" },
  { name: "Podgórze Duchackie", position: [19.9622, 50.0138], sector: "D11" },
  { name: "Osiedle Tysiąclecia", position: [20.0012, 50.0917], sector: "D15" },
  { name: "Kazimierz", position: [19.9449, 50.0519], sector: "D01" },
];

describe("findPlace", () => {
  it("rozpoznaje nazwę w odmianie i bez polskich znaków", () => {
    expect(findPlace("Woda leci na Zablociu przy przystanku", places)?.name).toBe("Zabłocie");
    expect(findPlace("awaria na Starym Podgórzu", places)?.name).toBe("Stare Podgórze");
    expect(findPlace("na osiedlu Tysiąclecia nie ma wody", places)?.name).toBe("Osiedle Tysiąclecia");
  });

  it("wybiera najdłuższe dopasowanie, gdy pasuje kilka nazw", () => {
    expect(findPlace("Podgórze Duchackie, ul. Wielicka", places)?.name).toBe("Podgórze Duchackie");
  });

  it("zwraca null, gdy w tekście nie ma znanego miejsca", () => {
    expect(findPlace("coś się stało gdzieś w mieście", places)).toBeNull();
  });
});

describe("parseMessage", () => {
  it("z wiadomości robi zgłoszenie: kategoria, tytuł, miejsce", () => {
    const d = parseMessage("Woda tryska spod asfaltu na Zabłociu. Robi się duża kałuża, auta omijają.", { places });
    expect(d.category).toBe("woda");
    expect(d.title).toBe("Woda tryska spod asfaltu na Zabłociu");
    expect(d.placeName).toBe("Zabłocie");
    expect(d.sector).toBe("D13");
    expect(d.position).not.toBeNull();
    expect(d.confidence).toBeGreaterThan(0.5);
  });

  it("przesuwa punkt lekko od środka osiedla, żeby nie zasłaniał etykiety", () => {
    const d = parseMessage("wyciek wody na Zabłociu", { places })!;
    expect(d.position).not.toEqual(places[0].position);
    expect(Math.abs(d.position![0] - places[0].position[0])).toBeLessThan(0.003);
  });

  it("lokalizacja wysłana z Telegrama ma pierwszeństwo przed nazwą w tekście", () => {
    const d = parseMessage("wyciek wody na Kazimierzu", { places, location: [19.97, 50.05] });
    expect(d.position).toEqual([19.97, 50.05]);
    expect(d.placeName).toBeNull();
  });

  it("bez miejsca zwraca pustą pozycję — dyspozytor wskaże ją na mapie", () => {
    const d = parseMessage("Przewrócone drzewo blokuje jezdnię", { places });
    expect(d.position).toBeNull();
    expect(d.category).toBe("zielen");
    expect(d.blocking).toBe(true);
  });

  it("skraca długi tytuł do 60 znaków z wielokropkiem", () => {
    const d = parseMessage("Bardzo długa wiadomość bez kropki która opisuje problem z oświetleniem ulicy przy szkole na osiedlu", { places });
    expect(d.title.length).toBeLessThanOrEqual(60);
    expect(d.title.endsWith("…")).toBe(true);
  });
});
