import { describe, expect, it } from "vitest";
import { classify } from "./classify";
import { INTAKE_SCENARIOS } from "./demo-data";

describe("classify", () => {
  it("asfalt to miejsce, nie problem — woda spod asfaltu to awaria wodna", () => {
    expect(classify("Woda tryska spod asfaltu").category).toBe("woda");
  });

  it("uszkodzenie nawierzchni nadal trafia do dróg", () => {
    expect(classify("Dziura w asfalcie na prawym pasie").category).toBe("drogi");
    expect(classify("Zapadnięty chodnik przy przejściu").category).toBe("drogi");
  });

  it("rozpoznaje blokadę ruchu", () => {
    expect(classify("Drzewo leży na jezdni").blocking).toBe(true);
  });

  it("oba scenariusze prezentacji (Telegram, telefon) to awaria wodna", () => {
    for (const s of INTAKE_SCENARIOS) expect(classify(s.text).category, s.channel).toBe("woda");
  });
});
