"use client";

import { useState } from "react";
import { ArrowLeft, ChevronDown, Clock, Plus, Radio, Sparkles, Users, X } from "lucide-react";
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
import { CAMERAS } from "@/lib/demo-data";
import type { Status } from "@/lib/types";
import { CATEGORY_ICON, SOURCE_ICON } from "./icons";
import CameraFeed from "./CameraFeed";
import type { ScoredReport } from "./CityMapApp";

type Filter = "otwarte" | "krytyczne" | "zamkniete";

interface Props {
  reports: ScoredReport[];
  selectedId: string | null;
  sectorFilter: string | null;
  onClearSector: () => void;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, patch: { status?: Status; unitId?: string | null }) => void;
  onNewReport: () => void;
  onSimulate: () => void;
  now: number;
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

function Detail({ r, onBack, onUpdate, now }: { r: ScoredReport; onBack: () => void; onUpdate: Props["onUpdate"]; now: number }) {
  const SourceIcon = SOURCE_ICON[r.source];
  const suggested = unitForCategory(r.category);
  const unit = unitById(r.unitId);
  return (
    <div className="animate-slide-in flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <button type="button" onClick={onBack} aria-label="Wróć do listy" className="-ml-1 rounded p-1 text-muted hover:bg-panel-hover hover:text-foreground">
          <ArrowLeft size={18} aria-hidden />
        </button>
        <span className="font-mono text-xs text-subtle">{r.id}</span>
        <span className="ml-auto"><PriorityBadge r={r} /></span>
      </div>

      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <h2 className="text-lg font-semibold leading-snug">{r.title}</h2>
          {r.description !== r.title && <p className="mt-1 text-sm text-muted">{r.description}</p>}
        </div>

        {r.source === "kamera" && r.cameraId && (
          <CameraFeed
            seed={r.cameraId}
            live={CAMERAS.find((c) => c.id === r.cameraId)?.live}
            detection={{ label: r.title, confidence: r.confidence, category: r.category }} />
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-xs text-subtle">Źródło</dt>
            <dd className="mt-0.5 flex items-center gap-1.5"><SourceIcon size={14} aria-hidden />{SOURCE_LABEL[r.source]}</dd>
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

        <section className="rounded-xl border border-accent/30 bg-accent/10 p-3">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-soft">
            <Sparkles size={13} aria-hidden /> Ocena AI
          </h3>
          <p className="mt-2 text-sm">
            Kategoria: <strong>{CATEGORY_LABEL[r.category]}</strong>{" "}
            <span className="text-muted">(pewność {Math.round(r.confidence * 100)}%)</span>
          </p>
          <p className="mt-1 text-sm">
            Sugerowana jednostka: <strong>{suggested.name}</strong>
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {r.priority.reasons.map((x) => (
              <li key={x} className="rounded-md bg-black/25 px-2 py-0.5 text-xs text-accent-ink">{x}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-2">
          <label className="block text-xs text-subtle" htmlFor="unit">Jednostka odpowiedzialna</label>
          <div className="relative">
            <select
              id="unit"
              value={r.unitId ?? ""}
              onChange={(e) => onUpdate(r.id, { unitId: e.target.value || null, status: e.target.value && r.status === "nowe" ? "przekazane" : r.status })}
              className="h-10 w-full appearance-none rounded-lg border border-line bg-black/20 px-3 text-sm focus:border-accent focus:outline-none"
            >
              <option value="">— nieprzypisane —</option>
              {UNITS.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          </div>
          {!unit && (
            <button
              type="button"
              onClick={() => onUpdate(r.id, { unitId: suggested.id, status: "przekazane" })}
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
                  r.status === s ? "border-accent bg-accent/20 text-accent-ink" : "border-line text-muted hover:bg-panel-hover"
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function EventsPanel(p: Props) {
  const [filter, setFilter] = useState<Filter>("otwarte");
  const [collapsed, setCollapsed] = useState(false);
  const selected = p.reports.find((r) => r.id === p.selectedId);

  const inScope = p.reports.filter((r) => !p.sectorFilter || r.sector === p.sectorFilter);
  const open = inScope.filter((r) => r.status !== "zamkniete");
  const list = (
    filter === "otwarte" ? open : filter === "krytyczne" ? open.filter((r) => r.priority.level === "krytyczny") : inScope.filter((r) => r.status === "zamkniete")
  ).sort((a, b) => b.priority.score - a.priority.score);

  const critical = open.filter((r) => r.priority.level === "krytyczny").length;
  const fromCameras = open.filter((r) => r.source === "kamera").length;

  return (
    <aside
      aria-label="Zdarzenia w mieście"
      className={`glass absolute inset-x-3 bottom-3 z-20 flex flex-col overflow-hidden rounded-xl transition-[max-height] sm:inset-x-auto sm:bottom-3 sm:right-3 sm:top-3 sm:w-[380px] sm:max-h-none ${
        collapsed ? "max-h-14" : "max-h-[60vh]"
      }`}
    >
      {selected ? (
        <Detail r={selected} now={p.now} onBack={() => p.onSelect(null)} onUpdate={p.onUpdate} />
      ) : (
        <>
          <div className="border-b border-line px-4 pb-3 pt-3.5">
            <div className="flex items-center gap-2">
              <button type="button" className="sm:hidden" onClick={() => setCollapsed((c) => !c)} aria-label="Zwiń panel">
                <ChevronDown size={18} className={collapsed ? "rotate-180" : ""} aria-hidden />
              </button>
              <h2 className="font-semibold">Najważniejsze teraz</h2>
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
                  <div className="text-xl font-semibold tabular-nums" style={s.c ? { color: s.c } : undefined}>{s.v}</div>
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

          <ul className="scroll-thin min-h-0 flex-1 divide-y divide-line/60 overflow-y-auto">
            {list.length === 0 && <li className="p-6 text-center text-sm text-subtle">Brak zgłoszeń w tym widoku.</li>}
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
                      style={{ background: `${PRIORITY_COLOR[r.priority.level]}22`, color: PRIORITY_COLOR[r.priority.level] }}
                    >
                      <Icon size={18} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{r.title}</span>
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-subtle">
                        <PriorityBadge r={r} />
                        <span className="flex items-center gap-1"><SourceIcon size={12} aria-hidden />{SOURCE_LABEL[r.source]}</span>
                        <span className="flex items-center gap-1"><Clock size={12} aria-hidden />{timeAgo(r.createdAt, p.now)}</span>
                        {r.confirmations > 1 && (
                          <span className="flex items-center gap-1"><Users size={12} aria-hidden />{r.confirmations}</span>
                        )}
                      </span>
                      <span className="mt-1 block text-xs text-muted">
                        {r.sector} · {unit ? `→ ${unit.short}` : "nieprzypisane"} · {STATUS_LABEL[r.status]}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="grid grid-cols-2 gap-2 border-t border-line p-3">
            <button
              type="button"
              onClick={p.onSimulate}
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-line text-sm hover:bg-panel-hover"
              title="Demo: orkiestrator kamer tworzy zgłoszenie"
            >
              <Radio size={15} aria-hidden /> Symuluj kamerę
            </button>
            <button
              type="button"
              onClick={p.onNewReport}
              className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-accent text-sm font-medium text-white hover:bg-accent/85"
            >
              <Plus size={16} aria-hidden /> Zgłoś problem
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
