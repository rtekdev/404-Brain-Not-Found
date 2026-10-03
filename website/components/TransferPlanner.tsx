"use client";

import { ArrowRight, ChevronDown, Shuffle, TrendingDown, TrendingUp, TriangleAlert, X } from "lucide-react";
import type { Metric, Sector } from "@/lib/types";
import { METRIC, fmt, type Reading } from "@/lib/resources";
import { ECONOMICS, estimate, money, suggest, type Transfer } from "@/lib/transfer";

export type Draft = { from: string; to: string; pct: number };

interface Props {
  metric: Metric;
  sectors: Sector[];
  /** Odczyty przed przekierowaniami — od nich liczona jest wycena. */
  base: Record<string, Reading>;
  transfers: Transfer[];
  draft: Draft | null;
  onDraft: (d: Draft | null) => void;
  onApply: (d: Draft) => void;
  onRemove: (id: string) => void;
}

function SectorSelect({ id, value, sectors, onChange, label }: { id: string; value: string; sectors: Sector[]; onChange: (v: string) => void; label: string }) {
  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none truncate rounded-lg border border-line bg-black/20 pl-2.5 pr-7 text-sm focus:border-accent focus:outline-none"
      >
        {sectors.map((s) => (
          <option key={s.id} value={s.id}>{s.id} · {s.name}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
    </div>
  );
}

export default function TransferPlanner(p: Props) {
  const def = METRIC[p.metric];
  const eco = ECONOMICS[p.metric];
  const active = p.transfers.filter((t) => t.metric === p.metric);
  const ideas = suggest(p.metric, p.base, p.sectors);
  const per = eco.perDay ? "dobę" : "h";

  const start = () => {
    const best = ideas[0];
    p.onDraft(best ? { from: best.from, to: best.to, pct: best.pct } : { from: p.sectors[0].id, to: p.sectors[1].id, pct: 25 });
  };

  if (!p.draft)
    return (
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs text-subtle">Przekierowanie między sektorami</h3>
          <button
            type="button"
            onClick={start}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs hover:bg-panel-hover"
          >
            <Shuffle size={13} aria-hidden /> Zaplanuj
          </button>
        </div>

        {active.map((t) => {
          const est = estimate(t, p.base, p.sectors);
          return (
            <div key={t.id} className="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs" style={{ borderColor: `${def.color}55`, background: `${def.color}10` }}>
              <span className="font-semibold">{t.from}</span>
              <ArrowRight size={12} className="text-muted" aria-hidden />
              <span className="font-semibold">{t.to}</span>
              <span className="text-muted">{t.pct}%</span>
              <span className="tabular-nums" style={{ color: def.color }}>+{est ? fmt(est.delivered, p.metric) : "—"} {def.unit}</span>
              <span className={`ml-auto tabular-nums ${est && est.net >= 0 ? "text-emerald-400" : "text-amber-300"}`}>
                {est ? money(est.net) : ""}/{per}
              </span>
              <button type="button" onClick={() => p.onRemove(t.id)} aria-label={`Cofnij przekierowanie ${t.from} → ${t.to}`} className="rounded p-0.5 text-muted hover:bg-panel-hover hover:text-foreground">
                <X size={13} aria-hidden />
              </button>
            </div>
          );
        })}

        {ideas.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ideas.map((s) => (
              <button
                key={`${s.from}-${s.to}`}
                type="button"
                onClick={() => p.onDraft({ from: s.from, to: s.to, pct: s.pct })}
                className="rounded-md bg-black/25 px-2 py-1 text-[11px] text-muted hover:bg-panel-hover hover:text-foreground"
                title="Proponowana trasa — z nadwyżki do niedoboru"
              >
                {s.from} → {s.to} · <span className="text-emerald-400">{money(s.net)}/{per}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    );

  const d = p.draft;
  const est = estimate({ metric: p.metric, ...d }, p.base, p.sectors);
  const src = p.base[d.from];

  return (
    <section className="animate-slide-in space-y-3 rounded-xl border p-3" style={{ borderColor: `${def.color}66` }}>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Shuffle size={14} style={{ color: def.color }} aria-hidden /> Przekieruj {def.label.toLowerCase()}
        </h3>
        <button type="button" onClick={() => p.onDraft(null)} aria-label="Zamknij planer" className="rounded p-1 text-muted hover:bg-panel-hover">
          <X size={14} aria-hidden />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <SectorSelect id="tr-from" label="Z sektora" value={d.from} sectors={p.sectors} onChange={(v) => p.onDraft({ ...d, from: v })} />
        <ArrowRight size={16} className="shrink-0 text-muted" aria-hidden />
        <SectorSelect id="tr-to" label="Do sektora" value={d.to} sectors={p.sectors} onChange={(v) => p.onDraft({ ...d, to: v })} />
      </div>

      <div>
        <div className="flex items-baseline justify-between text-xs">
          <label htmlFor="tr-pct" className="text-subtle">Udział {eco.what} {d.from}</label>
          <span className="text-base font-semibold tabular-nums" style={{ color: def.color }}>{d.pct}%</span>
        </div>
        <input
          id="tr-pct"
          type="range"
          min={0}
          max={100}
          value={d.pct}
          onChange={(e) => p.onDraft({ ...d, pct: Number(e.target.value) })}
          className="mt-1 w-full"
          style={{ accentColor: def.color }}
        />
        <div className="text-[11px] text-subtle">
          {est ? `${fmt(est.amount, p.metric)} z ${fmt(src?.secondary ?? 0, p.metric)} ${def.unit} · dociera ${fmt(est.delivered, p.metric)} ${def.unit}` : "Wybierz dwa różne sektory"}
        </div>
      </div>

      {est && (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <div className="mb-1 flex items-center gap-1 font-semibold text-emerald-400"><TrendingUp size={13} aria-hidden /> Zyski</div>
              {est.gains.length ? (
                <ul className="space-y-1 leading-snug">{est.gains.map((g) => <li key={g}>{g}</li>)}</ul>
              ) : (
                <p className="text-subtle">Brak — cel nie ma niedoboru.</p>
              )}
            </div>
            <div className="rounded-lg bg-amber-500/10 p-2">
              <div className="mb-1 flex items-center gap-1 font-semibold text-amber-300"><TrendingDown size={13} aria-hidden /> Straty</div>
              {est.costs.length ? (
                <ul className="space-y-1 leading-snug">{est.costs.map((c) => <li key={c}>{c}</li>)}</ul>
              ) : (
                <p className="text-subtle">Brak istotnych strat.</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-black/25 px-3 py-2">
            <span className="text-xs text-subtle">Bilans netto</span>
            <span className="text-right">
              <span className={`block text-lg font-semibold tabular-nums ${est.net >= 0 ? "text-emerald-400" : "text-amber-300"}`}>
                {money(est.net)}<span className="text-xs font-normal text-muted"> /{per}</span>
              </span>
              {!eco.perDay && <span className="block text-[11px] tabular-nums text-subtle">≈ {money(est.netDaily)} / dobę</span>}
            </span>
          </div>

          {est.risky && (
            <p className="flex items-start gap-1.5 rounded-lg bg-rose-500/10 px-2.5 py-2 text-xs text-rose-300">
              <TriangleAlert size={14} className="mt-0.5 shrink-0" aria-hidden />
              {d.from} po przekierowaniu nie pokryje własnych potrzeb — rozważ mniejszy udział.
            </p>
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => p.onDraft(null)} className="h-9 rounded-lg border border-line text-sm hover:bg-panel-hover">Anuluj</button>
        <button
          type="button"
          disabled={!est || d.pct === 0}
          onClick={() => p.onApply(d)}
          className="h-9 rounded-lg bg-accent text-sm font-medium text-white hover:bg-accent/85 disabled:opacity-40"
        >
          Zastosuj
        </button>
      </div>
      <p className="text-[11px] leading-snug text-subtle">
        Wycena orientacyjna: {eco.price} zł/{def.unit.split("/")[0]} brakującego zasobu{eco.surplusValue ? `, nadwyżka ${eco.surplusValue} zł` : ""}, straty {Math.round(eco.lossPerKm * 1000) / 10}%/km.
      </p>
    </section>
  );
}
