import { CATEGORY_LABEL, SOURCE_LABEL, STATUS_LABEL, unitById, unitForCategory } from "./meta";
import { isHealthThreat } from "./priority";
import type { Category, Priority, Report } from "./types";

// Plan reagowania na zgłoszenie — reguły zastępujące model językowy (ta sama sygnatura posłuży modelowi).

export type PlanInput = Omit<Report, "createdAt"> & { priority: { level: Priority; score: number } };

export interface PlanContext {
  sectorName: (id: string | null) => string;
  cameraName: (id: string) => string;
  /** Liczba innych otwartych zgłoszeń w tej samej dzielnicy. */
  nearbyOpen: number;
  /** Inne otwarte zgłoszenia w pobliżu — kandydaci na przyczynę zdarzenia. */
  related?: { id: string; title: string; category: Category; distanceM: number }[];
}

/** Zgłoszenia, które mogą być przyczyną wypadku, gdy leżą blisko (np. dziura, konar, brak oświetlenia). */
const CAUSES: Category[] = ["drogi", "zielen", "oswietlenie"];
const CAUSE_RADIUS_M = 200;

export type StepAction = "info" | "notify" | "assign" | "camera" | "show";

export interface Step {
  id: string;
  label: string;
  detail?: string;
  action: StepAction;
  /** Jednostka (assign), kamera (camera) albo odbiorca powiadomienia (notify). */
  target?: string;
}

export interface Plan {
  summary: string[];
  status: { label: string; tone: "external" | "assigned" | "open" | "closed" };
  steps: Step[];
}

export function responsePlan(r: PlanInput, ctx: PlanContext): Plan {
  const critical = r.priority.level === "krytyczny";
  const where = r.sector ? `${r.sector} ${ctx.sectorName(r.sector)}` : "poza dzielnicami";
  const summary = [
    `${CATEGORY_LABEL[r.category]} · ${where}`,
    [r.blocking && "blokuje ruch lub dostęp", r.confirmations > 1 && `${r.confirmations} potwierdzenia`, `źródło: ${SOURCE_LABEL[r.source]}`]
      .filter(Boolean)
      .join(" · "),
  ];

  const unit = unitById(r.unitId);
  const status: Plan["status"] = r.handledBy
    ? { label: `Przejęte przez ${r.handledBy}`, tone: "external" }
    : r.status === "zamkniete"
      ? { label: STATUS_LABEL.zamkniete, tone: "closed" }
      : unit
        ? { label: `${STATUS_LABEL[r.status]} → ${unit.name}`, tone: "assigned" }
        : { label: `${STATUS_LABEL[r.status]} · nieprzypisane`, tone: "open" };

  const steps: Step[] = [];
  const add = (s: Step) => steps.push(s);

  if (r.handledBy?.startsWith("112"))
    add({ id: "112", action: "info", label: "Służby ratunkowe (112) prowadzą akcję — nie dublujemy wezwania", detail: "Miasto zabezpiecza otoczenie i komunikację." });
  else if (!unit) {
    const u = unitForCategory(r.category);
    add({ id: "assign", action: "assign", target: u.id, label: `Przekaż do: ${u.name}` });
  }

  const medical = isHealthThreat(`${r.title} ${r.description}`);
  if (medical) {
    add({ id: "aed", action: "notify", target: "Straż Miejska", label: "Straż Miejska — najbliższy patrol z AED do czasu przyjazdu PRM" });
    add({ id: "dojazd", action: "notify", target: "PRM", label: "Wskaż ratownikom dojazd i dokładne miejsce (pinezka GPS)", detail: where });
  }
  const cause = (ctx.related ?? [])
    .filter((x) => x.distanceM <= CAUSE_RADIUS_M && CAUSES.includes(x.category))
    .sort((a, b) => a.distanceM - b.distanceM)[0];
  if (cause && r.category === "bezpieczenstwo")
    add({
      id: "cause",
      action: "notify",
      target: unitForCategory(cause.category).name,
      label: `Prawdopodobna przyczyna: ${cause.id} „${cause.title}" (${Math.round(cause.distanceM)} m) — zabezpiecz i oznakuj miejsce`,
    });

  if (r.category === "bezpieczenstwo" && r.blocking) {
    add({ id: "mpk", action: "notify", target: "MPK", label: "Powiadom MPK — objazdy tramwajów i autobusów" });
    add({ id: "sm", action: "notify", target: "Straż Miejska", label: "Straż Miejska — zabezpieczenie terenu i kierowanie ruchem" });
    add({ id: "zdmk", action: "notify", target: "Zarząd Dróg", label: "Zarząd Dróg — komunikat na tablicach VMS i zmiana sygnalizacji" });
  }
  if (r.category === "woda") {
    add({ id: "wodociagi", action: "notify", target: "Wodociągi", label: "Wodociągi — zamknięcie zasuwy i ekipa awaryjna" });
    if (r.blocking) add({ id: "mpk", action: "notify", target: "MPK", label: "Powiadom MPK — możliwe objazdy" });
  }
  if (r.category === "zielen" && r.blocking)
    add({ id: "zielen", action: "notify", target: "Zieleń Miejska", label: "Zieleń Miejska — ekipa z piłą do usunięcia przeszkody" });
  if (r.category === "dostepnosc")
    add({ id: "trasa", action: "info", label: "Wskaż mieszkańcom alternatywną, dostępną trasę" });

  if (critical && r.blocking)
    add({ id: "sms", action: "notify", target: `mieszkańcy ${where}`, label: `SMS-alert dla mieszkańców: ${where}`, detail: "Utrudnienia i zalecenie omijania miejsca." });

  if (r.cameraId)
    add({ id: "camera", action: "camera", target: r.cameraId, label: `Podgląd kamery ${r.cameraId} · ${ctx.cameraName(r.cameraId)}` });

  if (ctx.nearbyOpen > 0)
    add({ id: "nearby", action: "show", target: r.sector ?? undefined, label: `W dzielnicy ${ctx.nearbyOpen} ${ctx.nearbyOpen === 1 ? "inne zgłoszenie" : ctx.nearbyOpen < 5 ? "inne zgłoszenia" : "innych zgłoszeń"} — sprawdź związek` });

  return { summary, status, steps };
}

export interface Alert<T extends PlanInput = PlanInput> {
  /** Zgłoszenie do animacji — najważniejsze. */
  lead: T;
  level: "critical" | "normal";
  /** Wszystkie nowe zgłoszenia, od najważniejszego. */
  all: T[];
}

export function pickAlert<T extends PlanInput>(fresh: T[]): Alert<T> | null {
  if (fresh.length === 0) return null;
  const all = [...fresh].sort((a, b) => b.priority.score - a.priority.score);
  return { lead: all[0], level: all[0].priority.level === "krytyczny" ? "critical" : "normal", all };
}
