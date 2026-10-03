"use client";

import { useState } from "react";
import { Crosshair, MessageCircle, MessageSquare, Phone, Smartphone, Sparkles, X } from "lucide-react";
import { classify } from "@/lib/classify";
import { CATEGORY_LABEL, unitForCategory } from "@/lib/meta";
import type { LngLat } from "@/lib/types";
import { CATEGORY_ICON } from "./icons";

interface Props {
  position: LngLat | null;
  sector: string | null;
  onPickStart: () => void;
  onCancel: () => void;
  onSubmit: (r: { title: string; description: string; blocking: boolean }) => void;
}

export default function ReportDialog({ position, sector, onPickStart, onCancel, onSubmit }: Props) {
  const [text, setText] = useState("");
  const [blocking, setBlocking] = useState(false);
  const c = classify(text);
  const Icon = CATEGORY_ICON[c.category];
  const unit = unitForCategory(c.category);
  const ready = text.trim().length >= 8 && position;

  return (
    <div
      role="dialog"
      aria-label="Nowe zgłoszenie"
      className="glass animate-slide-in absolute left-3 right-3 top-20 z-30 rounded-xl p-4 sm:right-auto sm:w-[400px]"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Zgłoś problem</h2>
        <button type="button" onClick={onCancel} aria-label="Zamknij" className="rounded p-1 text-muted hover:bg-panel-hover hover:text-foreground">
          <X size={18} aria-hidden />
        </button>
      </div>

      <label htmlFor="report-text" className="text-xs text-subtle">Co się stało?</label>
      <textarea
        id="report-text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (classify(e.target.value).blocking) setBlocking(true);
        }}
        rows={3}
        autoFocus
        placeholder="Np. Na ulicy leży złamane drzewo i blokuje jezdnię"
        className="mt-1 w-full resize-none rounded-lg border border-line bg-black/20 p-3 text-sm placeholder:text-subtle focus:border-accent focus:outline-none"
      />

      <div className="mt-2 flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-sm" aria-live="polite">
        <Sparkles size={14} className="shrink-0 text-accent-soft" aria-hidden />
        {text.trim().length < 4 ? (
          <span className="text-muted">AI rozpozna kategorię i jednostkę podczas pisania.</span>
        ) : (
          <span className="flex min-w-0 items-center gap-1.5">
            <Icon size={14} aria-hidden />
            <strong className="truncate">{CATEGORY_LABEL[c.category]}</strong>
            <span className="truncate text-muted">→ {unit.short} · {Math.round(c.confidence * 100)}%</span>
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={onPickStart}
        className={`mt-3 flex h-10 w-full items-center gap-2 rounded-lg border px-3 text-sm ${
          position ? "border-line" : "border-dashed border-accent text-accent-ink"
        } hover:bg-panel-hover`}
      >
        <Crosshair size={16} aria-hidden />
        {position ? `Miejsce: sektor ${sector ?? "poza miastem"} — zmień` : "Wskaż miejsce na mapie"}
      </button>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={blocking} onChange={(e) => setBlocking(e.target.checked)} className="size-4 accent-[var(--accent)]" />
        Blokuje przejazd lub przejście
      </label>

      <button
        type="button"
        disabled={!ready}
        onClick={() => onSubmit({ title: text.trim().split(/[.!?\n]/)[0].slice(0, 70), description: text.trim(), blocking })}
        className="mt-4 h-11 w-full rounded-lg bg-accent text-sm font-medium text-white enabled:hover:bg-accent/85 disabled:opacity-40"
      >
        Wyślij zgłoszenie
      </button>

      <div className="mt-3 flex items-center gap-3 text-xs text-subtle">
        Też przez:
        <span className="flex items-center gap-1"><Phone size={12} aria-hidden /> telefon</span>
        <span className="flex items-center gap-1"><MessageSquare size={12} aria-hidden /> SMS</span>
        <span className="flex items-center gap-1"><MessageCircle size={12} aria-hidden /> Messenger</span>
        <span className="flex items-center gap-1"><Smartphone size={12} aria-hidden /> app</span>
      </div>
    </div>
  );
}
