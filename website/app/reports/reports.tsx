"use client";

import { Report } from "@/lib/types";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Clock, Users } from "lucide-react";
import { CATEGORY_ICON, SOURCE_ICON } from "@/components/icons";
import { PRIORITY_COLOR, PRIORITY_LABEL, SOURCE_LABEL, STATUS_LABEL, timeAgo } from "@/lib/meta";
import { scoreReport } from "@/lib/priority";
import type { ReportItem } from "@/lib/reports";

type Filter = "otwarte" | "krytyczne" | "zamkniete";

const TABS: { id: Filter; label: string }[] = [
  { id: "otwarte", label: "Otwarte" },
  { id: "krytyczne", label: "Krytyczne" },
  { id: "zamkniete", label: "Zamknięte" },
];

export default function Reports({ reports }: { reports: ReportItem[] }) {
  const [filter, setFilter] = useState<Filter>("otwarte");
  const [city, setCity] = useState("");
  const [now] = useState(() => Date.now());

  const scored = useMemo(() => reports.map((r) => ({ ...r, priority: scoreReport(r, now) })), [reports, now]);
  const cities = useMemo(
    () => [...new Map(scored.filter((r) => r.citySlug).map((r) => [r.citySlug!, r.cityName!])).entries()],
    [scored],
  );
  const inCity = scored.filter((r) => !city || r.citySlug === city);
  const open = inCity.filter((r) => r.status !== "zamkniete");
  const critical = open.filter((r) => r.priority.level === "krytyczny");
  const list = (filter === "otwarte" ? open : filter === "krytyczne" ? critical : inCity.filter((r) => r.status === "zamkniete"))
    .sort((a, b) => b.priority.score - a.priority.score);

  return (
    <section className="rounded-xl border border-line bg-panel-solid">
      <div className="border-b border-line p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { v: open.length, l: "otwarte" },
            { v: critical.length, l: "krytyczne", c: PRIORITY_COLOR.krytyczny },
            { v: open.filter((r) => r.source === "kamera").length, l: "z kamer" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg bg-black/20 py-2">
              <div className="text-xl font-semibold tabular-nums" style={s.c ? { color: s.c } : undefined}>{s.v}</div>
              <div className="text-[11px] text-subtle">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="flex gap-1" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={filter === t.id}
                onClick={() => setFilter(t.id)}
                className={`rounded-md px-2.5 py-1 text-sm ${filter === t.id ? "bg-panel-hover text-foreground" : "text-muted hover:text-foreground"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {cities.length > 1 && (
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-label="Miasto"
              className="ml-auto h-8 rounded-lg border border-line bg-black/20 px-2 text-sm focus:border-accent focus:outline-none"
            >
              <option value="">Wszystkie miasta</option>
              {cities.map(([slug, name]) => (
                <option key={slug} value={slug}>{name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <ul className="divide-y divide-line/60">
        {list.length === 0 && <li className="p-6 text-center text-sm text-subtle">Brak zgłoszeń w tym widoku.</li>}
        {list.map((r) => {
          const Icon = CATEGORY_ICON[r.category];
          const SourceIcon = SOURCE_ICON[r.source];
          const color = PRIORITY_COLOR[r.priority.level];
          return (
            <li key={r.id}>
              <Link href={`/reports/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-panel-hover">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ background: `${color}22`, color }}>
                  <Icon size={18} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.title}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-subtle">
                    <span className="rounded-md px-1.5 py-0.5 text-[11px] font-semibold" style={{ background: `${color}22`, color }}>
                      {PRIORITY_LABEL[r.priority.level]} · {r.priority.score}
                    </span>
                    <span className="flex items-center gap-1"><SourceIcon size={12} aria-hidden />{SOURCE_LABEL[r.source]}</span>
                    <span className="flex items-center gap-1"><Clock size={12} aria-hidden />{timeAgo(r.createdAt, now)}</span>
                    {r.confirmations > 1 && <span className="flex items-center gap-1"><Users size={12} aria-hidden />{r.confirmations}</span>}
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted">
                    <span className="font-mono">{r.id}</span>
                    {r.cityName && ` · ${r.cityName}`}
                    {r.sectorName && `, ${r.sectorName}`} · {STATUS_LABEL[r.status]}
                  </span>
                </span>
                <ChevronRight size={16} className="shrink-0 text-subtle" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
