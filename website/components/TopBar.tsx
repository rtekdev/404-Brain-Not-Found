"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Box, Building2, Check, ChevronDown, Layers, MapPin, Search, Video } from "lucide-react";
import type { Camera, LngLat, Place, Sector } from "@/lib/types";
import type { ScoredReport } from "./CityMapApp";
import type { CityRef } from "@/lib/city-repo";

export const LAYER_DEFS = [
  { id: "boundary", label: "Granica miasta" },
  { id: "sectors", label: "Sektory" },
  { id: "reports", label: "Zgłoszenia" },
  { id: "cameras", label: "Kamery" },
  { id: "assets", label: "Zasoby i infrastruktura" },
  { id: "access", label: "Dostępność" },
] as const;

export type LayerId = (typeof LAYER_DEFS)[number]["id"];

function useOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    const k = (e: KeyboardEvent) => e.key === "Escape" && onOutside();
    document.addEventListener("pointerdown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("pointerdown", h);
      document.removeEventListener("keydown", k);
    };
  }, [onOutside]);
  return ref;
}

function Dropdown({
  label,
  icon,
  children,
  wide,
  plain,
}: {
  label: ReactNode;
  icon?: ReactNode;
  children: (close: () => void) => ReactNode;
  wide?: boolean;
  /** Etykieta zawsze widoczna i wyróżniona (wybór miasta). */
  plain?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutside(() => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={
          plain
            ? "flex h-10 items-center gap-1.5 rounded-lg px-2 text-lg font-bold tracking-tight hover:bg-panel-hover"
            : "flex h-10 items-center gap-2 rounded-lg border border-line px-3 text-sm hover:bg-panel-hover"
        }
      >
        {icon}
        <span className={plain ? "" : "hidden md:inline"}>{label}</span>
        <ChevronDown size={14} className={`text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div
          className={`glass animate-slide-in absolute left-0 top-12 z-30 rounded-xl p-1.5 ${wide ? "w-72" : "w-60"}`}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

interface Props {
  /** Slug bieżącego miasta. */
  city: string;
  cities: CityRef[];
  layers: Record<LayerId, boolean>;
  onToggleLayer: (id: LayerId) => void;
  sectors: Sector[];
  sectorCounts: Record<string, number>;
  selectedSector: string | null;
  onSector: (id: string | null) => void;
  places: Place[];
  reports: ScoredReport[];
  cameras: Camera[];
  onGo: (pos: LngLat, select?: { type: "report" | "camera"; id: string }) => void;
}

type Hit =
  | { kind: "place"; label: string; sub: string; pos: LngLat }
  | { kind: "report"; label: string; sub: string; pos: LngLat; id: string }
  | { kind: "camera"; label: string; sub: string; pos: LngLat; id: string };

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

export default function TopBar(p: Props) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const searchRef = useOutside(() => setFocused(false));
  const router = useRouter();
  const current = p.cities.find((c) => c.slug === p.city);

  const hits = useMemo<Hit[]>(() => {
    const n = norm(q.trim());
    if (n.length < 2) return [];
    const out: Hit[] = [];
    for (const r of p.reports)
      if (norm(r.title).includes(n) || r.id.toLowerCase().includes(n))
        out.push({ kind: "report", label: r.title, sub: `${r.id} · ${r.sector ?? ""}`, pos: r.position, id: r.id });
    for (const c of p.cameras)
      if (norm(c.name).includes(n)) out.push({ kind: "camera", label: `Kamera · ${c.name}`, sub: c.sector ?? "", pos: c.position, id: c.id });
    for (const pl of p.places)
      if (norm(pl.name).includes(n)) out.push({ kind: "place", label: pl.name, sub: `osiedle · ${pl.sector ?? ""}`, pos: pl.position });
    return out.slice(0, 8);
  }, [q, p.reports, p.cameras, p.places]);

  const go = (h: Hit) => {
    p.onGo(h.pos, h.kind === "place" ? undefined : { type: h.kind, id: h.id });
    setQ("");
    setFocused(false);
  };

  return (
    <div className="glass absolute left-3 right-3 top-3 z-20 flex items-center gap-2 rounded-xl p-2 sm:right-auto">
      <Dropdown plain label={current?.name ?? p.city}>
        {(close) =>
          p.cities.map((c) => (
            <button
              key={c.slug}
              type="button"
              role="menuitemradio"
              aria-checked={c.slug === p.city}
              onClick={() => {
                close();
                if (c.slug !== p.city) router.push(`/centrum?miasto=${c.slug}`);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-panel-hover"
            >
              <Building2 size={15} className="text-muted" aria-hidden />
              <span className="flex-1">{c.name}</span>
              {c.slug === p.city && <Check size={14} className="text-accent-soft" aria-hidden />}
            </button>
          ))
        }
      </Dropdown>

      <div ref={searchRef} className="relative min-w-0 flex-1 sm:w-72 sm:flex-none">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => e.key === "Enter" && hits[0] && go(hits[0])}
          placeholder="Szukaj osiedla, zgłoszenia, kamery…"
          aria-label="Szukaj na mapie"
          className="h-10 w-full rounded-lg border border-line bg-black/20 pl-9 pr-3 text-sm placeholder:text-subtle focus:border-accent focus:outline-none"
        />
        {focused && hits.length > 0 && (
          <ul className="glass absolute left-0 right-0 top-12 z-30 rounded-xl p-1.5" role="listbox">
            {hits.map((h, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => go(h)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-panel-hover"
                >
                  {h.kind === "camera" ? (
                    <Video size={15} className="text-muted" aria-hidden />
                  ) : (
                    <MapPin size={15} className={h.kind === "report" ? "text-amber-400" : "text-muted"} aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate">{h.label}</span>
                  <span className="shrink-0 text-xs text-subtle">{h.sub}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dropdown label="Warstwy" icon={<Layers size={16} aria-hidden />}>
        {() =>
          LAYER_DEFS.map((l) => (
            <button
              key={l.id}
              type="button"
              role="menuitemcheckbox"
              aria-checked={p.layers[l.id]}
              onClick={() => p.onToggleLayer(l.id)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-panel-hover"
            >
              <span
                className={`grid size-4 place-items-center rounded border ${
                  p.layers[l.id] ? "border-accent bg-accent text-white" : "border-line"
                }`}
              >
                {p.layers[l.id] && <Check size={12} strokeWidth={3} aria-hidden />}
              </span>
              {l.label}
            </button>
          ))
        }
      </Dropdown>

      <Dropdown
        wide
        label={p.selectedSector ? `Sektor ${p.selectedSector}` : "Sektory"}
        icon={<Box size={16} aria-hidden />}
      >
        {(close) => (
          <div className="scroll-thin max-h-80 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                p.onSector(null);
                close();
              }}
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm hover:bg-panel-hover"
            >
              Całe miasto
              {!p.selectedSector && <Check size={14} className="text-accent-soft" aria-hidden />}
            </button>
            {p.sectors.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  p.onSector(s.id);
                  close();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-panel-hover"
              >
                <span className="rounded border border-accent/70 bg-[#2a1f4d] px-1.5 text-xs font-semibold text-accent-ink">
                  {s.id}
                </span>
                <span className="flex-1">{s.name}</span>
                <span className="text-xs text-subtle">
                  {p.sectorCounts[s.id] ?? 0} otw. · {s.areaKm2} km²
                </span>
              </button>
            ))}
          </div>
        )}
      </Dropdown>
    </div>
  );
}
