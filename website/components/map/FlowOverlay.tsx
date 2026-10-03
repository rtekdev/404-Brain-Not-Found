"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Map as MlMap } from "maplibre-gl";
import { Building2 } from "lucide-react";
import type { Asset, LngLat, Metric, Sector } from "@/lib/types";
import { HUB, METRIC, assetMeter, fmt, meterAt, type Reading } from "@/lib/resources";
import MapAnchor, { useMapZoom } from "./MapAnchor";

/** Poniżej tego zoomu dane płyną z sektorów do centrali, powyżej — z obiektów do sektorów. */
export const CITY_ZOOM = 12.9;

interface Flow {
  id: string;
  from: LngLat;
  to: LngLat;
  value: number;
  dim: boolean;
}

/** Przekierowanie zasobu między sektorami (zastosowane albo planowane). */
export interface Route {
  id: string;
  from: string;
  to: string;
  value: number;
  preview: boolean;
}

interface Props {
  map: MlMap;
  metric: Metric;
  sectors: Sector[];
  readings: Record<string, Reading>;
  assets: Asset[];
  selectedSector: string | null;
  t: number;
  routes: Route[];
  onSectorClick: (id: string) => void;
}

/** Łuk między punktami ekranu — krzywa Béziera wygięta w bok o `bend` długości. */
function arc(map: MlMap, a: LngLat, b: LngLat, bend = 0.18): string {
  const p = map.project(a);
  const q = map.project(b);
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const cx = (p.x + q.x) / 2 - dy * bend;
  const cy = (p.y + q.y) / 2 + dx * bend;
  return `M${p.x.toFixed(1)} ${p.y.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
}

const ROUTE_BEND = -0.28;

/** Środek łuku `arc` w współrzędnych geograficznych — tam stawiamy etykietę trasy. */
function arcApex(a: LngLat, b: LngLat, bend: number): LngLat {
  const cos = Math.cos((((a[1] + b[1]) / 2) * Math.PI) / 180);
  const dLng = b[0] - a[0];
  const dLat = b[1] - a[1];
  return [(a[0] + b[0]) / 2 + (dLat * bend) / 2 / cos, (a[1] + b[1]) / 2 - (dLng * cos * bend) / 2];
}

export default function FlowOverlay(p: Props) {
  const { map } = p;
  const zoom = useMapZoom(map);
  const cityView = zoom < CITY_ZOOM;
  const def = METRIC[p.metric];

  // Warstwa SVG pod znacznikami HTML, nad kanwą mapy.
  const [layer] = useState(() => {
    const div = document.createElement("div");
    div.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:0";
    return div;
  });
  useEffect(() => {
    const host = map.getCanvasContainer();
    host.insertBefore(layer, map.getCanvas().nextSibling);
    return () => layer.remove();
  }, [map, layer]);

  const anchorOf = (id: string | null) => p.sectors.find((s) => s.id === id)?.anchor;

  const flows: Flow[] = cityView
    ? p.sectors.map((s) => ({
        id: s.id,
        from: s.anchor,
        to: HUB.position,
        value: p.readings[s.id]?.primary ?? 0,
        dim: !!p.selectedSector && p.selectedSector !== s.id,
      }))
    : p.assets.flatMap((a) => {
        const m = assetMeter(a, p.metric);
        const to = anchorOf(a.sector);
        if (!m || !to) return [];
        const r = meterAt(m, a.id, p.t);
        return [{ id: a.id, from: a.position, to, value: r.primary + r.secondary, dim: !!p.selectedSector && p.selectedSector !== a.sector }];
      });
  const max = Math.max(...flows.map((f) => f.value), 1e-6);

  const routes = p.routes.flatMap((r) => {
    const from = anchorOf(r.from);
    const to = anchorOf(r.to);
    return from && to ? [{ ...r, a: from, b: to }] : [];
  });

  // Ścieżki przeliczane imperatywnie przy każdym ruchu mapy — w tej samej klatce co znaczniki.
  const paths = useRef(new Map<string, SVGPathElement[]>());
  const live = useRef({ flows, routes });
  useLayoutEffect(() => {
    live.current = { flows, routes };
  });
  useEffect(() => {
    const update = () => {
      for (const f of live.current.flows) {
        const d = arc(map, f.from, f.to);
        for (const el of paths.current.get(f.id) ?? []) el.setAttribute("d", d);
      }
      for (const r of live.current.routes) {
        const d = arc(map, r.a, r.b, ROUTE_BEND);
        for (const el of paths.current.get(`route-${r.id}`) ?? []) el.setAttribute("d", d);
      }
    };
    update();
    map.on("move", update);
    return () => {
      map.off("move", update);
    };
  });

  const register = (id: string, i: number) => (el: SVGPathElement | null) => {
    const arr = paths.current.get(id) ?? [];
    if (el) arr[i] = el;
    paths.current.set(id, arr);
  };

  const total = Object.values(p.readings).reduce((s, r) => s + r.primary, 0);

  return (
    <>
      {createPortal(
        <svg width="100%" height="100%" className="absolute inset-0 overflow-visible" aria-hidden>
          <defs>
            <filter id="flow-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.4" />
            </filter>
          </defs>
          {flows.map((f) => {
            const ratio = f.value / max;
            const w = (cityView ? 2 : 1.4) + ratio * (cityView ? 5 : 3);
            const dur = `${(2.8 - 1.9 * ratio).toFixed(2)}s`;
            return (
              <g key={`${p.metric}-${f.id}`} opacity={f.dim ? 0.18 : routes.length ? 0.4 : 1} className="transition-opacity duration-300">
                <path ref={register(f.id, 0)} fill="none" stroke={def.color} strokeOpacity={0.16} strokeWidth={w + 2} strokeLinecap="round" />
                <path
                  ref={register(f.id, 1)}
                  fill="none"
                  stroke={def.color}
                  strokeWidth={w + 2}
                  strokeLinecap="round"
                  strokeDasharray="0.1 13.9"
                  filter="url(#flow-glow)"
                  className="flow-dash"
                  style={{ animationDuration: dur }}
                />
                <path
                  ref={register(f.id, 2)}
                  fill="none"
                  stroke="#fff"
                  strokeOpacity={0.9}
                  strokeWidth={Math.max(1.5, w * 0.55)}
                  strokeLinecap="round"
                  strokeDasharray="0.1 13.9"
                  className="flow-dash"
                  style={{ animationDuration: dur }}
                />
              </g>
            );
          })}
          {routes.map((r) => {
            const w = 3 + Math.min(1, r.value / max) * 4;
            return (
              <g key={`route-${p.metric}-${r.id}`} opacity={r.preview ? 0.75 : 1}>
                <path ref={register(`route-${r.id}`, 0)} fill="none" stroke="#fff" strokeOpacity={0.12} strokeWidth={w + 6} strokeLinecap="round" />
                <path
                  ref={register(`route-${r.id}`, 1)}
                  fill="none"
                  stroke={def.color}
                  strokeWidth={w}
                  strokeLinecap="round"
                  strokeDasharray={r.preview ? "2 10" : "9 7"}
                  className="flow-dash"
                  style={{ animationDuration: r.preview ? "1.4s" : "0.9s" }}
                />
              </g>
            );
          })}
        </svg>,
        layer,
      )}

      {p.sectors.map((s) => {
        const r = p.readings[s.id];
        const sel = p.selectedSector === s.id;
        return (
          <MapAnchor key={s.id} map={map} at={s.anchor} z={sel ? 7 : 3}>
            <button
              type="button"
              onClick={() => p.onSectorClick(s.id)}
              title={`Sektor ${s.id} · ${s.name}`}
              className={`flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-xs shadow-lg transition ${
                sel ? "bg-[#2a2410] ring-2 ring-white/70" : "bg-[#17181d]/90 hover:bg-[#23252d]"
              } ${p.selectedSector && !sel ? "opacity-50" : ""}`}
              style={{ borderColor: def.color }}
            >
              <span className="font-semibold text-accent-ink">{s.id}</span>
              {zoom > 12.6 && <span className="text-muted">{s.name}</span>}
              <span className="font-semibold tabular-nums" style={{ color: def.color }}>
                {r ? fmt(r.primary, p.metric) : "—"}
              </span>
            </button>
          </MapAnchor>
        );
      })}

      {routes.map((r) => (
        <MapAnchor key={`route-label-${r.id}`} map={map} at={arcApex(r.a, r.b, ROUTE_BEND)} z={9}>
          <span
            className={`pointer-events-none whitespace-nowrap rounded-full border bg-[#131418]/95 px-2 py-0.5 text-[11px] font-semibold tabular-nums shadow-lg ${r.preview ? "border-dashed" : ""}`}
            style={{ borderColor: def.color, color: def.color }}
          >
            {r.from} → {r.to} · +{fmt(r.value, p.metric)} {def.unit}
          </span>
        </MapAnchor>
      ))}

      {cityView && (
        <MapAnchor map={map} at={HUB.position} z={8}>
          <div className="relative grid place-items-center">
            <span className="hub-pulse absolute size-16 rounded-full" style={{ color: def.color }} aria-hidden />
            <div
              className="relative flex flex-col items-center rounded-xl border-2 bg-[#131418]/95 px-3 py-1.5 text-center shadow-2xl"
              style={{ borderColor: def.color, boxShadow: `0 0 28px ${def.color}55` }}
            >
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                <Building2 size={11} aria-hidden /> {HUB.name}
              </span>
              <span className="text-base font-bold tabular-nums" style={{ color: def.color }}>
                {fmt(total, p.metric)} <span className="text-xs font-medium text-muted">{def.unit}</span>
              </span>
            </div>
          </div>
        </MapAnchor>
      )}

      {!cityView &&
        p.assets.map((a) => {
          const m = assetMeter(a, p.metric);
          if (!m) return null;
          const r = meterAt(m, a.id, p.t);
          const v = r.secondary > 0 ? r.secondary : r.primary;
          return (
            <MapAnchor key={a.id} map={map} at={a.position} z={3} offset={[0, 24]}>
              <span
                className="pointer-events-none whitespace-nowrap rounded bg-[#131418]/90 px-1 text-[11px] font-semibold tabular-nums"
                style={{ color: def.color }}
              >
                {r.secondary > 0 ? "+" : ""}
                {fmt(v, p.metric)} {def.unit}
              </span>
            </MapAnchor>
          );
        })}
    </>
  );
}
