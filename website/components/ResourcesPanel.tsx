"use client";

import { Activity, Sparkles, X } from "lucide-react";
import type { Asset, Metric, Report, Sector } from "@/lib/types";
import { ASSET_LABEL } from "@/lib/meta";
import {
  METRIC,
  METRICS,
  assetMeter,
  fmt,
  insights,
  meterAt,
  sumReadings,
  type Reading,
} from "@/lib/resources";
import { ASSET_ICON, METRIC_ICON } from "./icons";
import TransferPlanner, { type Draft } from "./TransferPlanner";
import type { Transfer } from "@/lib/transfer";

interface Props {
  metric: Metric;
  onMetric: (m: Metric) => void;
  sectors: Sector[];
  readings: Record<string, Reading>;
  /** Odczyty sektorów w chwili `t` (po przekierowaniach) — do wykresu. */
  readingsAt: (t: number) => Record<string, Reading>;
  /** Odczyty przed przekierowaniami. */
  base: Record<string, Reading>;
  transfers: Transfer[];
  draft: Draft | null;
  onDraft: (d: Draft | null) => void;
  onApply: (d: Draft) => void;
  onRemoveTransfer: (id: string) => void;
  assets: Asset[];
  reports: Pick<Report, "id" | "category" | "sector" | "status" | "title">[];
  t: number;
  selectedSector: string | null;
  onSector: (id: string | null) => void;
  onSelectAsset: (id: string) => void;
  onOpenReport: (id: string) => void;
}

const TICK = 1500;
const POINTS = 40;

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / span) * 24}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-9 w-full" aria-hidden>
      <polyline points={`0,30 ${pts} 100,30`} fill={color} fillOpacity={0.12} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export default function ResourcesPanel(p: Props) {
  const def = METRIC[p.metric];
  const scope = p.selectedSector ? p.sectors.filter((s) => s.id === p.selectedSector) : p.sectors;
  const scopeAt = (t: number) => {
    const r = p.readingsAt(t);
    return sumReadings(scope.map((s) => r[s.id]).filter(Boolean));
  };
  const now = sumReadings(scope.map((s) => p.readings[s.id]).filter(Boolean));
  const history = Array.from({ length: POINTS }, (_, i) => scopeAt(p.t - (POINTS - 1 - i) * TICK).primary);
  const balance = now.secondary - now.primary;
  const sectorName = p.sectors.find((s) => s.id === p.selectedSector)?.name;

  const ranked = [...p.sectors].sort((a, b) => (p.readings[b.id]?.primary ?? 0) - (p.readings[a.id]?.primary ?? 0));
  const maxSector = Math.max(...ranked.map((s) => p.readings[s.id]?.primary ?? 0), 1e-6);

  const objects = p.assets
    .filter((a) => (!p.selectedSector || a.sector === p.selectedSector) && assetMeter(a, p.metric))
    .map((a) => ({ a, r: meterAt(assetMeter(a, p.metric)!, a.id, p.t) }));

  const notes = insights(
    p.metric,
    scope.map((s) => ({ id: s.id, name: s.name, reading: p.readings[s.id] })).filter((s) => s.reading),
    p.assets.filter((a) => !p.selectedSector || a.sector === p.selectedSector),
    p.reports,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-line px-4 pb-3 pt-3">
        <div className="grid grid-cols-4 gap-1" role="tablist" aria-label="Miara">
          {METRICS.map((m) => {
            const Icon = METRIC_ICON[m.id];
            const on = m.id === p.metric;
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => p.onMetric(m.id)}
                className={`flex flex-col items-center gap-0.5 rounded-lg border py-1.5 text-[11px] transition ${
                  on ? "bg-panel-hover text-foreground" : "border-transparent text-muted hover:text-foreground"
                }`}
                style={on ? { borderColor: `${m.color}88` } : undefined}
              >
                <Icon size={16} style={{ color: m.color }} aria-hidden />
                {m.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between">
          {p.selectedSector ? (
            <button
              type="button"
              onClick={() => p.onSector(null)}
              className="inline-flex items-center gap-1 rounded-md border border-accent/60 bg-accent/15 px-2 py-0.5 text-xs text-accent-ink"
            >
              Sektor {p.selectedSector} · {sectorName} <X size={12} aria-hidden />
            </button>
          ) : (
            <span className="text-xs text-muted">Całe miasto · {p.sectors.length} sektorów</span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
            <Activity size={12} aria-hidden /> na żywo
          </span>
        </div>

        <div className="mt-2 rounded-xl bg-black/20 p-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="text-[11px] text-subtle">{def.primary}</div>
              <div className="text-2xl font-semibold tabular-nums" style={{ color: def.color }}>
                {fmt(now.primary, p.metric)} <span className="text-sm font-normal text-muted">{def.unit}</span>
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-subtle">{def.secondary}</div>
              <div className="tabular-nums">{fmt(now.secondary, p.metric)} {def.unit}</div>
              <div className="mt-0.5 text-subtle">
                {def.balance}{" "}
                <span className={`tabular-nums ${balanceTone(p.metric, balance)}`}>
                  {signed(p.metric) ? `${balance > 0 ? "+" : ""}${fmt(balance, p.metric)}` : fmt(Math.abs(balance), p.metric)}
                </span>
              </div>
            </div>
          </div>
          <Sparkline values={history} color={def.color} />
        </div>
      </div>

      <div className="scroll-thin min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <TransferPlanner
          metric={p.metric}
          sectors={p.sectors}
          base={p.base}
          transfers={p.transfers}
          draft={p.draft}
          onDraft={p.onDraft}
          onApply={p.onApply}
          onRemove={p.onRemoveTransfer}
        />

        {notes.length > 0 && (
          <section className="rounded-xl border border-accent/30 bg-accent/10 p-3">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-soft">
              <Sparkles size={13} aria-hidden /> Wnioski AI
            </h3>
            <ul className="mt-2 space-y-1.5">
              {notes.map((n) => (
                <li key={n.text} className="flex gap-2 text-xs leading-snug">
                  <span className={`mt-1 size-1.5 shrink-0 rounded-full ${n.tone === "warn" ? "bg-amber-400" : "bg-emerald-400"}`} />
                  <span>
                    {n.text}
                    {n.reportId && (
                      <button type="button" onClick={() => p.onOpenReport(n.reportId!)} className="ml-1 font-medium text-accent-soft hover:underline">
                        {n.reportId} →
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!p.selectedSector && (
          <section>
            <h3 className="mb-2 text-xs text-subtle">Sektory → centrala</h3>
            <ul className="space-y-0.5">
              {ranked.map((s) => {
                const r = p.readings[s.id];
                if (!r) return null;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => p.onSector(s.id)}
                      className="grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-panel-hover"
                    >
                      <span className="rounded border border-accent/70 bg-[#2a1f4d] text-center text-xs font-semibold text-accent-ink">{s.id}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs">{s.name}</span>
                        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-black/30">
                          <span
                            className="block h-full rounded-full transition-[width] duration-700"
                            style={{ width: `${(r.primary / maxSector) * 100}%`, background: def.color }}
                          />
                        </span>
                      </span>
                      <span className="text-xs tabular-nums text-muted">{fmt(r.primary, p.metric)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-xs text-subtle">Obiekty z pomiarem · {def.label.toLowerCase()}</h3>
          {objects.length === 0 ? (
            <p className="rounded-lg bg-black/20 p-3 text-xs text-subtle">
              Brak opomiarowanych obiektów — wartość sektora to odbiorcy rozproszeni (szacunek z liczników).
            </p>
          ) : (
            <ul className="space-y-0.5">
              {objects.map(({ a, r }) => {
                const Icon = ASSET_ICON[a.kind];
                const produces = r.secondary > 0;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => p.onSelectAsset(a.id)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-panel-hover"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-md border bg-[#10262b]" style={{ borderColor: `${def.color}88`, color: def.color }}>
                        <Icon size={15} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm">{a.name}</span>
                        <span className="block text-[11px] text-subtle">
                          {ASSET_LABEL[a.kind]} · {a.sector} · {produces ? def.secondary.toLowerCase() : def.primary.toLowerCase()}
                        </span>
                      </span>
                      <span className="text-right text-xs tabular-nums">
                        {produces && r.primary > 0 && <span className="block text-muted">−{fmt(r.primary, p.metric)}</span>}
                        <span style={{ color: def.color }}>
                          {produces ? "+" : ""}
                          {fmt(produces ? r.secondary : r.primary, p.metric)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

// Dla energii i ciepła liczy się znak bilansu; dla wody i odpadów różnica to straty / zaległości.
const signed = (metric: Metric) => metric === "energia" || metric === "cieplo";

function balanceTone(metric: Metric, balance: number) {
  if (signed(metric)) return balance >= 0 ? "text-emerald-400" : "text-amber-300";
  return "text-amber-300";
}
