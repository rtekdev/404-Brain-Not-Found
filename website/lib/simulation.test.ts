import { describe, expect, it } from "vitest";
import { ALERT_SCENARIO, localAlertReports } from "./simulation";

describe("localAlertReports — alarm bez bazy", () => {
  it("buduje zgłoszenia scenariusza lokalnie, z dzielnicą i unikalnymi numerami", () => {
    const rs = localAlertReports(1000, () => "D14");
    expect(rs).toHaveLength(ALERT_SCENARIO.length);
    expect(new Set(rs.map((r) => r.id)).size).toBe(rs.length);
    for (const r of rs) expect(r).toMatchObject({ status: "nowe", sector: "D14", createdAt: 1000, unitId: null });
    expect(rs[0].handledBy).toMatch(/^112/);
  });

  it("kolejne wywołania dają nowe numery", () => {
    const a = localAlertReports(1, () => null).map((r) => r.id);
    const b = localAlertReports(2, () => null).map((r) => r.id);
    expect(a.some((id) => b.includes(id))).toBe(false);
  });
});
