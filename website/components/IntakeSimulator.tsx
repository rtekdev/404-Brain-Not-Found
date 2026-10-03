"use client";

import { useEffect, useState } from "react";
import { Bot, Phone, Send, Sparkles, X } from "lucide-react";
import type { IntakeScenario } from "@/lib/simulation";
import { parseMessage, type IntakeDraft } from "@/lib/intake";
import { CATEGORY_LABEL } from "@/lib/meta";
import type { LngLat, Place } from "@/lib/types";

const STEP_MS = 1100;

interface Props {
  scenario: IntakeScenario;
  places: Place[];
  /** Nazwa dzielnicy dla punktu — do pokazania wyniku analizy. */
  sectorLabel: (pos: LngLat) => string;
  onAccept: (draft: IntakeDraft) => void;
  onClose: () => void;
}

/** Pokaz na prezentację: wiadomość z Telegrama albo rozmowa telefoniczna zamienia się w zgłoszenie. */
export default function IntakeSimulator({ scenario, places, sectorLabel, onAccept, onClose }: Props) {
  const [shown, setShown] = useState(0);
  const done = shown >= scenario.lines.length;
  const draft = parseMessage(scenario.text, { places, location: scenario.location });
  const telegram = scenario.channel === "telegram";

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 400 : STEP_MS);
    return () => clearTimeout(t);
  }, [shown, done]);

  return (
    <div role="dialog" aria-label={telegram ? "Wiadomość z Telegrama" : "Połączenie telefoniczne"} className="glass animate-slide-in absolute left-3 top-20 z-40 w-[min(380px,calc(100%-24px))] rounded-xl">
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <span className={`grid size-9 place-items-center rounded-full ${telegram ? "bg-sky-500/20 text-sky-300" : "bg-emerald-500/20 text-emerald-300"}`}>
          {telegram ? <Send size={17} aria-hidden /> : <Phone size={17} aria-hidden className={done ? "" : "animate-pulse"} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{telegram ? "Telegram · bot zgłoszeń" : done ? "Rozmowa zakończona" : "Połączenie przychodzące…"}</div>
          <div className="text-xs text-subtle">{scenario.sender}</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Zamknij" className="rounded p-1 text-muted hover:bg-panel-hover">
          <X size={16} aria-hidden />
        </button>
      </div>

      <ul className="space-y-2 px-4 py-3" aria-live="polite">
        {scenario.lines.slice(0, shown).map((l, i) => (
          <li key={i} className={`flex ${l.who === "bot" ? "justify-start" : "justify-end"}`}>
            <span
              className={`animate-slide-in max-w-[85%] rounded-xl px-3 py-1.5 text-sm ${
                l.who === "bot" ? "flex items-start gap-1.5 bg-black/30 text-muted" : telegram ? "bg-sky-600/80 text-white" : "bg-emerald-700/70 text-white"
              }`}
            >
              {l.who === "bot" && <Bot size={14} className="mt-0.5 shrink-0" aria-hidden />}
              {l.text}
            </span>
          </li>
        ))}
        {!done && <li className="text-xs text-subtle">{telegram ? "pisze…" : "transkrypcja na żywo…"}</li>}
      </ul>

      {done && (
        <div className="animate-slide-in space-y-3 border-t border-line px-4 py-3">
          <section className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-soft">
              <Sparkles size={13} aria-hidden /> Analiza AI
            </h3>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-subtle">Problem</dt>
              <dd>{draft.title}</dd>
              <dt className="text-subtle">Kategoria</dt>
              <dd>
                {CATEGORY_LABEL[draft.category]} <span className="text-muted">({Math.round(draft.confidence * 100)}%)</span>
              </dd>
              <dt className="text-subtle">Miejsce</dt>
              <dd>
                {draft.position
                  ? `${draft.placeName ?? (scenario.location ? "pinezka z Telegrama" : "—")} · ${sectorLabel(draft.position)}`
                  : "nie rozpoznano — wskaż na mapie"}
              </dd>
              {draft.blocking && (
                <>
                  <dt className="text-subtle">Uwaga</dt>
                  <dd className="text-amber-300">blokuje ruch lub dostęp</dd>
                </>
              )}
            </dl>
          </section>
          <button
            type="button"
            onClick={() => onAccept(draft)}
            className="h-10 w-full rounded-lg bg-accent text-sm font-medium text-white hover:bg-accent/85"
          >
            Przyjmij zgłoszenie
          </button>
        </div>
      )}
    </div>
  );
}
