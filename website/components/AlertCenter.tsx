"use client";

import { useEffect, useState } from "react";
import { Bell, Check, ChevronDown, MapPin, Siren, Sparkles, Video, X } from "lucide-react";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "@/lib/meta";
import type { Alert, Plan, Step } from "@/lib/response";
import type { ScoredReport } from "./CityMapApp";
import ClipPreview from "./ClipPreview";

const TONE: Record<Plan["status"]["tone"], string> = {
  external: "bg-sky-500/15 text-sky-300",
  assigned: "bg-accent/15 text-accent-ink",
  open: "bg-amber-500/15 text-amber-300",
  closed: "bg-emerald-500/15 text-emerald-300",
};

const STEP_ICON: Partial<Record<Step["action"], React.ReactNode>> = {
  camera: <Video size={13} aria-hidden />,
  show: <MapPin size={13} aria-hidden />,
  info: <Sparkles size={13} aria-hidden />,
};

interface Props {
  alert: Alert<ScoredReport>;
  plans: Record<string, Plan>;
  /** Wykonane kroki: `${reportId}:${stepId}`. */
  done: Set<string>;
  onStep: (r: ScoredReport, s: Step) => void;
  onShow: (r: ScoredReport) => void;
  onDismiss: () => void;
}

/** Krótki dwutonowy sygnał alarmu (Web Audio, bez plików). */
function beep() {
  try {
    const ctx = new AudioContext();
    [880, 660, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      o.type = "sine";
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.16);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.17);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Przeglądarka bez Web Audio albo bez zgody na dźwięk — sam komunikat wystarczy.
  }
}

export default function AlertCenter({ alert, plans, done, onStep, onShow, onDismiss }: Props) {
  const [open, setOpen] = useState(false);
  const critical = alert.level === "critical";
  const lead = alert.lead;
  const more = alert.all.length - 1;
  const color = PRIORITY_COLOR[lead.priority.level];

  // Nowe najważniejsze zgłoszenie: sygnał dźwiękowy (krytyczne); zwykłe znika samo po chwili.
  useEffect(() => {
    if (critical) beep();
  }, [lead.id, critical]);
  useEffect(() => {
    if (critical || open) return;
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, [lead.id, critical, open, onDismiss]);

  return (
    <>
      {critical && <div key={`glow-${lead.id}`} className="alert-edge-glow pointer-events-none absolute inset-0 z-30" aria-hidden />}

      <div
        role={critical ? "alert" : "status"}
        aria-live={critical ? "assertive" : "polite"}
        className="absolute left-3 right-3 top-[72px] z-40 sm:left-[calc((100%-400px)/2)] sm:right-auto sm:w-[460px] sm:-translate-x-1/2"
      >
        <div
          key={lead.id}
          className={`overflow-hidden rounded-xl border shadow-2xl ${critical ? "alert-critical border-rose-500/80 bg-[#2a1116]/95" : "animate-slide-in glass"}`}
          style={critical ? { boxShadow: `0 0 0 1px ${color}55, 0 0 36px ${color}66` } : undefined}
        >
          <div className="flex items-start gap-3 p-3">
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-full ${critical ? "alert-siren bg-rose-500 text-white" : "bg-panel-hover text-accent-soft"}`}
            >
              {critical ? <Siren size={20} aria-hidden /> : <Bell size={18} aria-hidden />}
            </span>
            <div className="min-w-0 flex-1">
              <div className={`text-[11px] font-bold uppercase tracking-widest ${critical ? "text-rose-300" : "text-subtle"}`}>
                {critical ? "Krytyczne zgłoszenie" : "Nowe zgłoszenie"}
                {more > 0 && <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 font-semibold normal-case tracking-normal text-foreground">+{more}</span>}
              </div>
              <div className="mt-0.5 font-semibold leading-snug">{lead.title}</div>
              <div className="mt-0.5 text-xs text-muted">{plans[lead.id]?.summary[0]}</div>
              {plans[lead.id] && (
                <span className={`mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium ${TONE[plans[lead.id].status.tone]}`}>
                  {plans[lead.id].status.label}
                </span>
              )}
            </div>
            {lead.cameraId && <ClipPreview cameraId={lead.cameraId} label={lead.title} />}
            <button type="button" onClick={onDismiss} aria-label="Zamknij komunikat" className="rounded p-1 text-muted hover:bg-white/10 hover:text-foreground">
              <X size={16} aria-hidden />
            </button>
          </div>

          <div className="flex gap-2 border-t border-white/10 px-3 py-2">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-medium ${critical ? "bg-rose-500 text-white hover:bg-rose-500/85" : "bg-accent text-white hover:bg-accent/85"}`}
            >
              {open ? "Zwiń" : `Szczegóły i kroki${more > 0 ? ` (${alert.all.length})` : ""}`}
              <ChevronDown size={15} className={`transition ${open ? "rotate-180" : ""}`} aria-hidden />
            </button>
            <button type="button" onClick={() => onShow(lead)} className="h-8 rounded-lg border border-white/15 px-3 text-sm hover:bg-white/10">
              Pokaż na mapie
            </button>
          </div>

          {open && (
            <ol className="scroll-thin max-h-[55vh] space-y-2 overflow-y-auto border-t border-white/10 bg-black/25 p-3">
              {alert.all.map((r) => {
                const plan = plans[r.id];
                if (!plan) return null;
                const c = PRIORITY_COLOR[r.priority.level];
                return (
                  <li key={r.id} className="animate-slide-in rounded-lg border border-line bg-panel-solid/90 p-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: `${c}26`, color: c }}>
                        {PRIORITY_LABEL[r.priority.level]} · {r.priority.score}
                      </span>
                      <button type="button" onClick={() => onShow(r)} className="min-w-0 flex-1 text-left text-sm font-semibold hover:underline">
                        {r.title}
                      </button>
                      <span className="font-mono text-[11px] text-subtle">{r.id}</span>
                    </div>
                    <ul className="mt-1.5 space-y-0.5 text-xs text-muted">
                      {plan.summary.map((s) => <li key={s}>{s}</li>)}
                    </ul>
                    <span className={`mt-1.5 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium ${TONE[plan.status.tone]}`}>{plan.status.label}</span>

                    <h4 className="mt-2.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-accent-soft">
                      <Sparkles size={12} aria-hidden /> Kolejne kroki (AI)
                    </h4>
                    <ul className="mt-1 space-y-1">
                      {plan.steps.map((s) => {
                        const key = `${r.id}:${s.id}`;
                        const isDone = done.has(key);
                        const actionable = s.action !== "info";
                        return (
                          <li key={s.id} className="flex items-start gap-2 text-xs">
                            <span className="mt-0.5 text-subtle">{STEP_ICON[s.action] ?? <Bell size={13} aria-hidden />}</span>
                            <span className="min-w-0 flex-1">
                              <span className={isDone ? "text-subtle line-through" : ""}>{s.label}</span>
                              {s.detail && <span className="block text-[11px] text-subtle">{s.detail}</span>}
                            </span>
                            {actionable &&
                              (isDone ? (
                                <span className="flex items-center gap-1 text-emerald-400"><Check size={13} aria-hidden /> zrobione</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onStep(r, s)}
                                  className="shrink-0 rounded-md border border-line px-2 py-0.5 text-[11px] hover:bg-panel-hover"
                                >
                                  {s.action === "notify" ? "Powiadom" : s.action === "assign" ? "Przekaż" : s.action === "camera" ? "Podgląd" : "Pokaż"}
                                </button>
                              ))}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </>
  );
}
