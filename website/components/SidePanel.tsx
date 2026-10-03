"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Gauge, Siren } from "lucide-react";

export type Mode = "zgloszenia" | "zasoby";

interface Props {
  mode: Mode;
  onMode: (m: Mode) => void;
  openReports: number;
  children: ReactNode;
}

export default function SidePanel({ mode, onMode, openReports, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const tabs: { id: Mode; label: string; icon: ReactNode; badge?: number }[] = [
    { id: "zgloszenia", label: "Zgłoszenia", icon: <Siren size={15} aria-hidden />, badge: openReports },
    { id: "zasoby", label: "Zasoby", icon: <Gauge size={15} aria-hidden /> },
  ];

  return (
    <aside
      aria-label="Panel miasta"
      className={`glass absolute inset-x-3 bottom-3 z-20 flex flex-col overflow-hidden rounded-xl transition-[max-height] sm:inset-x-auto sm:bottom-3 sm:right-3 sm:top-3 sm:w-[380px] sm:max-h-none ${
        collapsed ? "max-h-14" : "max-h-[60vh]"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-line p-2">
        <button type="button" className="px-1 sm:hidden" onClick={() => setCollapsed((c) => !c)} aria-label="Zwiń panel">
          <ChevronDown size={18} className={collapsed ? "rotate-180" : ""} aria-hidden />
        </button>
        <div className="grid flex-1 grid-cols-2 gap-1 rounded-lg bg-black/25 p-1" role="tablist" aria-label="Widok">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={mode === t.id}
              onClick={() => onMode(t.id)}
              className={`flex h-8 items-center justify-center gap-1.5 rounded-md text-sm transition ${
                mode === t.id ? "bg-panel-hover font-medium text-foreground shadow" : "text-muted hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
              {t.badge !== undefined && (
                <span className="rounded bg-accent/25 px-1.5 text-[11px] font-semibold tabular-nums text-accent-ink">{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      {children}
    </aside>
  );
}
