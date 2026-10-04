"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Forward,
  Navigation,
  Play,
  RotateCcw,
  ChevronRight,
  Clock,
  Plus,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  CATEGORY_LABEL,
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  SOURCE_LABEL,
  STATUS_LABEL,
  UNITS,
  timeAgo,
  unitById,
  unitForCategory,
} from "@/lib/meta";
import type { Camera, Sector, Status } from "@/lib/types";
import { rankSectors, type SectorFilter } from "@/lib/sectors";
import { EXTERNAL_SERVICES, dispatchFor } from "@/lib/dispatch";
import { CATEGORY_ICON, SOURCE_ICON } from "./icons";
import CameraFeed from "./CameraFeed";
import type { ScoredReport } from "./CityMapApp";

type Filter = SectorFilter;

interface Props {
  reports: ScoredReport[];
  selectedId: string | null;
  sectorFilter: string | null;
  onClearSector: () => void;
  sectors: Sector[];
  cameras: Camera[];
  onSector: (id: string) => void;
  onSelect: (id: string | null) => void;
  onUpdate: (
    id: string,
    patch: { status?: Status; unitId?: string | null },
  ) => void;
  onNewReport: () => void;
  now: number;
  /** Podgląd jako jednostka (id z UNITS); null — dyspozytor całego miasta. */
  unitView: string | null;
  onUnitView: (id: string | null) => void;
  /** Przekazanie dalej: `unit:<id>` albo nazwa służby zewnętrznej. */
  onForward: (id: string, target: string) => void;
}

function UnitActions({ r, unitId, onUpdate, onForward }: { r: ScoredReport; unitId: string; onUpdate: Props["onUpdate"]; onForward: Props["onForward"] }) {
  const [target, setTarget] = useState("");
  const primary =
    r.status === "nowe" || r.status === "przekazane"
      ? { label: "Przyjmij do realizacji", icon: Play, status: "w_realizacji" as Status }
      : r.status === "w_realizacji"
        ? { label: "Zakończ zgłoszenie", icon: Check, status: "zamkniete" as Status }
        : { label: "Wznów realizację", icon: RotateCcw, status: "w_realizacji" as Status };
  const PrimaryIcon = primary.icon;
  return (
    <section className="space-y-3">
      <div className="text-xs text-subtle">
        Status: <span className="font-medium text-foreground">{STATUS_LABEL[r.status]}</span>
        {r.handledBy && <> · przejęte przez {r.handledBy}</>}
      </div>
      <button
        type="button"
        onClick={() => onUpdate(r.id, { status: primary.status })}
        className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-accent text-sm font-medium text-white hover:bg-accent/85"
      >
        <PrimaryIcon size={16} aria-hidden /> {primary.label}
      </button>
      <div>
        <label className="mb-1.5 block text-xs text-subtle" htmlFor="forward">
          Przekaż dalej
        </label>
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <select
              id="forward"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="h-10 w-full appearance-none rounded-lg border border-line bg-black/20 px-3 text-sm focus:border-accent focus:outline-none"
            >
              <option value="">— wybierz —</option>
              <optgroup label="Jednostki miejskie">
                {UNITS.filter((u) => u.id !== unitId).map((u) => (
                  <option key={u.id} value={`unit:${u.id}`}>
                    {u.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Służby">
                {EXTERNAL_SERVICES.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          </div>
          <button
            type="button"
            disabled={!target}
            onClick={() => {
              onForward(r.id, target);
              setTarget("");
            }}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-line px-3 text-sm hover:bg-panel-hover disabled:opacity-40"
          >
            <Forward size={15} aria-hidden /> Przekaż
          </button>
        </div>
      </div>
    </section>
  );
}

function PriorityBadge({ r }: { r: ScoredReport }) {
  const c = PRIORITY_COLOR[r.priority.level];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
      style={{ background: `${c}26`, color: c }}
    >
      <span className="size-1.5 rounded-full" style={{ background: c }} />
      {PRIORITY_LABEL[r.priority.level]} · {r.priority.score}
    </span>
  );
}

function Detail({
  r,
  onBack,
  onUpdate,
  now,
  cameras,
  unitView,
  onForward,
}: {
  r: ScoredReport;
  onBack: () => void;
  onUpdate: Props["onUpdate"];
  now: number;
  cameras: Camera[];
  unitView: string | null;
  onForward: Props["onForward"];
}) {
  const dispatch = dispatchFor(r);
  const SourceIcon = SOURCE_ICON[r.source];
  const suggested = unitForCategory(r.category);
  const unit = unitById(r.unitId);
  return (
    <div className="animate-slide-in flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Wróć do listy"
          className="-ml-1 rounded p-1 text-muted hover:bg-panel-hover hover:text-foreground"
        >
          <ArrowLeft size={18} aria-hidden />
        </button>
        <span className="font-mono text-xs text-subtle">{r.id}</span>
        <span className="ml-auto">
          <PriorityBadge r={r} />
        </span>
      </div>

      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <h2 className="text-lg font-semibold leading-snug">{r.title}</h2>
          {r.description !== r.title && (
            <p className="mt-1 text-sm text-muted">{r.description}</p>
          )}
        </div>

        {r.source === "kamera" && r.cameraId && (
          <CameraFeed
            seed={r.cameraId}
            live={cameras.find((c) => c.id === r.cameraId)?.live}
            detection={{
              label: r.title,
              confidence: r.confidence,
              category: r.category,
            }}
          />
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-subtle">Źródło</dt>
            <dd className="mt-0.5 flex items-center gap-1.5">
              <SourceIcon size={14} aria-hidden />
              {SOURCE_LABEL[r.source]}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Sektor</dt>
            <dd className="mt-0.5">{r.sector ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Zgłoszono</dt>
            <dd className="mt-0.5">{timeAgo(r.createdAt, now)}</dd>
          </div>
          <div>
            <dt className="text-xs text-subtle">Potwierdzenia</dt>
            <dd className="mt-0.5">{r.confirmations}</dd>
          </div>
        </dl>

        {dispatch && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm">
            <Navigation size={15} className="text-rose-300" aria-hidden />
            <span>
              W drodze: <strong>{dispatch.label}</strong>
            </span>
          </div>
        )}

        <section className="rounded-xl border border-accent/30 bg-accent/10 p-3">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-soft">
            <Sparkles size={13} aria-hidden /> Ocena AI
          </h3>
          <p className="mt-2 text-sm">
            Kategoria: <strong>{CATEGORY_LABEL[r.category]}</strong>{" "}
            <span className="text-muted">
              (pewność {Math.round(r.confidence * 100)}%)
            </span>
          </p>
          <p className="mt-1 text-sm">
            Sugerowana jednostka: <strong>{suggested.name}</strong>
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {r.priority.reasons.map((x) => (
              <li
                key={x}
                className="rounded-md bg-black/25 px-2 py-0.5 text-xs text-accent-ink"
              >
                {x}
              </li>
            ))}
          </ul>
        </section>

        {unitView ? (
          <UnitActions r={r} unitId={unitView} onUpdate={onUpdate} onForward={onForward} />
        ) : (
        <>
        <section className="space-y-2">
          <label className="block text-xs text-subtle" htmlFor="unit">
            Jednostka odpowiedzialna
          </label>
          <div className="relative">
            <select
              id="unit"
              value={r.unitId ?? ""}
              onChange={(e) =>
                onUpdate(r.id, {
                  unitId: e.target.value || null,
                  status:
                    e.target.value && r.status === "nowe"
                      ? "przekazane"
                      : r.status,
                })
              }
              className="h-10 w-full appearance-none rounded-lg border border-line bg-black/20 px-3 text-sm focus:border-accent focus:outline-none"
            >
              <option value="">— nieprzypisane —</option>
              {UNITS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden
            />
          </div>
          {!unit && (
            <button
              type="button"
              onClick={() =>
                onUpdate(r.id, { unitId: suggested.id, status: "przekazane" })
              }
              className="h-10 w-full rounded-lg bg-accent text-sm font-medium text-white hover:bg-accent/85"
            >
              Przekaż do: {suggested.short}
            </button>
          )}
        </section>

        <section>
          <div className="mb-2 text-xs text-subtle">Status</div>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={r.status === s}
                onClick={() => onUpdate(r.id, { status: s })}
                className={`h-9 rounded-lg border text-sm ${
                  r.status === s
                    ? "border-accent bg-accent/20 text-accent-ink"
                    : "border-line text-muted hover:bg-panel-hover"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </section>
        </>
        )}
      </div>
    </div>
  );
}

export default function EventsPanel(p: Props) {
  const [filter, setFilter] = useState<Filter>("otwarte");
  // Widok całego miasta: zamiast listy zgłoszeń — ranking dzielnic.
  const cityView = !p.sectorFilter && !p.unitView;
  const viewUnit = unitById(p.unitView);
  const rows = cityView ? rankSectors(p.reports, p.sectors, filter) : [];
  const selected = p.reports.find((r) => r.id === p.selectedId);

  const inScope = p.reports.filter(
    (r) => !p.sectorFilter || r.sector === p.sectorFilter,
  );
  const open = inScope.filter((r) => r.status !== "zamkniete");
  const list = (
    filter === "otwarte"
      ? open
      : filter === "krytyczne"
        ? open.filter((r) => r.priority.level === "krytyczny")
        : inScope.filter((r) => r.status === "zamkniete")
  ).sort((a, b) => b.priority.score - a.priority.score);

  const critical = open.filter((r) => r.priority.level === "krytyczny").length;
  const fromCameras = open.filter((r) => r.source === "kamera").length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {selected ? (
        <Detail
          r={selected}
          now={p.now}
          cameras={p.cameras}
          onBack={() => p.onSelect(null)}
          onUpdate={p.onUpdate}
          unitView={p.unitView}
          onForward={p.onForward}
        />
      ) : (
        <>
          <div className="border-b border-line px-4 pb-3 pt-3">
            <div className="relative mb-3">
              <label htmlFor="unit-view" className="sr-only">
                Podgląd jako
              </label>
              <select
                id="unit-view"
                value={p.unitView ?? ""}
                onChange={(e) => p.onUnitView(e.target.value || null)}
                className="h-9 w-full appearance-none rounded-lg border border-line bg-black/20 pl-3 pr-8 text-sm focus:border-accent focus:outline-none"
              >
                <option value="">Widok: dyspozytor miasta</option>
                {UNITS.map((u) => (
                  <option key={u.id} value={u.id}>
                    Widok jednostki: {u.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{viewUnit ? `Zadania: ${viewUnit.short}` : "Najważniejsze teraz"}</h2>
              <span className="flex items-center gap-1 rounded-md bg-accent/15 px-1.5 py-0.5 text-[11px] font-medium text-accent-soft">
                <Sparkles size={11} aria-hidden /> priorytet AI
              </span>
            </div>
            {p.sectorFilter && (
              <button
                type="button"
                onClick={p.onClearSector}
                className="mt-2 inline-flex items-center gap-1 rounded-md border border-accent/60 bg-accent/15 px-2 py-0.5 text-xs text-accent-ink"
              >
                Sektor {p.sectorFilter} <X size={12} aria-hidden />
              </button>
            )}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { v: open.length, l: "otwarte" },
                { v: critical, l: "krytyczne", c: PRIORITY_COLOR.krytyczny },
                { v: fromCameras, l: "z kamer" },
              ].map((s) => (
                <div key={s.l} className="rounded-lg bg-black/20 py-2">
                  <div
                    className="text-xl font-semibold tabular-nums"
                    style={s.c ? { color: s.c } : undefined}
                  >
                    {s.v}
                  </div>
                  <div className="text-[11px] text-subtle">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-1 text-sm" role="tablist">
              {(["otwarte", "krytyczne", "zamkniete"] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-2.5 py-1 capitalize ${filter === f ? "bg-panel-hover text-foreground" : "text-muted hover:text-foreground"}`}
                >
                  {f === "zamkniete" ? "Zamknięte" : f}
                </button>
              ))}
            </div>
          </div>

          {cityView ? (
            <ul
              className="scroll-thin min-h-0 flex-1 divide-y divide-line/60 overflow-y-auto"
              aria-label="Dzielnice"
            >
              {rows.length === 0 && (
                <li className="p-6 text-center text-sm text-subtle">
                  Żadna dzielnica nie ma zgłoszeń w tym widoku.
                </li>
              )}
              {rows.map((s) => {
                const tone =
                  s.critical > 0
                    ? PRIORITY_COLOR.krytyczny
                    : s.open > 0
                      ? PRIORITY_COLOR.wysoki
                      : "#6b7180";
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => p.onSector(s.id)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-panel-hover"
                    >
                      <span className="w-10 shrink-0 rounded border border-accent/70 bg-[#2a1f4d] py-0.5 text-center text-xs font-semibold text-accent-ink">
                        {s.id}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {s.name}
                        </span>
                        <span className="mt-0.5 flex items-center gap-2.5 text-xs text-subtle">
                          {filter === "zamkniete" ? (
                            <span>zamknięte: {s.closed}</span>
                          ) : (
                            <>
                              <span>otwarte: {s.open}</span>
                              {s.critical > 0 && (
                                <span
                                  className="font-semibold"
                                  style={{ color: PRIORITY_COLOR.krytyczny }}
                                >
                                  krytyczne: {s.critical}
                                </span>
                              )}
                            </>
                          )}
                        </span>
                      </span>
                      {filter !== "zamkniete" && (
                        <span className="text-right">
                          <span
                            className="block text-base font-semibold tabular-nums"
                            style={{ color: tone }}
                          >
                            {s.topScore || "—"}
                          </span>
                          <span className="block text-[10px] text-subtle">
                            maks. priorytet
                          </span>
                        </span>
                      )}
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-subtle"
                        aria-hidden
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="scroll-thin min-h-0 flex-1 divide-y divide-line/60 overflow-y-auto">
              {list.length === 0 && (
                <li className="p-6 text-center text-sm text-subtle">
                  Brak zgłoszeń w tym widoku.
                </li>
              )}
              {list.map((r) => {
                const Icon = CATEGORY_ICON[r.category];
                const SourceIcon = SOURCE_ICON[r.source];
                const unit = unitById(r.unitId);
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => p.onSelect(r.id)}
                      className="flex w-full gap-3 px-4 py-3 text-left hover:bg-panel-hover"
                    >
                      <span
                        className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg"
                        style={{
                          background: `${PRIORITY_COLOR[r.priority.level]}22`,
                          color: PRIORITY_COLOR[r.priority.level],
                        }}
                      >
                        <Icon size={18} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {r.title}
                          </span>
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-subtle">
                          <PriorityBadge r={r} />
                          <span className="flex items-center gap-1">
                            <SourceIcon size={12} aria-hidden />
                            {SOURCE_LABEL[r.source]}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} aria-hidden />
                            {timeAgo(r.createdAt, p.now)}
                          </span>
                          {r.confirmations > 1 && (
                            <span className="flex items-center gap-1">
                              <Users size={12} aria-hidden />
                              {r.confirmations}
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-xs text-muted">
                          {r.sector} ·{" "}
                          {unit ? `→ ${unit.short}` : "nieprzypisane"} ·{" "}
                          {STATUS_LABEL[r.status]}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-line p-3">
            <button
              type="button"
              onClick={p.onNewReport}
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-accent text-sm font-medium text-white hover:bg-accent/85"
            >
              <Plus size={16} aria-hidden /> Zgłoś problem
            </button>
          </div>
        </>
      )}
    </div>
  );
}
