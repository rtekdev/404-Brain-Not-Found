"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LngLatBounds, Marker, type GeoJSONSource, type Map as MlMap, type PaddingOptions } from "maplibre-gl";
import { Ambulance, Car, Flame, Truck } from "lucide-react";
import { fallbackRoute, pointAlong, startPoint, type Dispatch, type VehicleKind } from "@/lib/dispatch";
import { distanceKm } from "@/lib/transfer";
import type { LngLat } from "@/lib/types";

// Pokaz: pojazd służb jedzie ulicami do zgłoszenia. Trasa z publicznego serwera OSRM,
// a gdy nie odpowie w 2,5 s — łuk z bazy do celu. Nic nie trafia do bazy.

const LOOK: Record<VehicleKind, { icon: typeof Car; color: string; lights: [string, string] }> = {
  karetka: { icon: Ambulance, color: "#f43f5e", lights: ["#f43f5e", "#38bdf8"] },
  policja: { icon: Car, color: "#3b82f6", lights: ["#3b82f6", "#f43f5e"] },
  straz: { icon: Flame, color: "#ef4444", lights: ["#ef4444", "#f59e0b"] },
  sluzby: { icon: Truck, color: "#f59e0b", lights: ["#f59e0b", "#fde68a"] },
};

const SRC = "dispatch-route";
const KMH = 45;

async function fetchRoute(from: LngLat, to: LngLat, signal: AbortSignal): Promise<LngLat[]> {
  const timeout = AbortSignal.timeout(2500);
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.join(",")};${to.join(",")}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.any([signal, timeout]) });
    const json = await res.json();
    const coords = json?.routes?.[0]?.geometry?.coordinates as LngLat[] | undefined;
    if (coords && coords.length > 1) return [...coords, to];
  } catch {
    if (signal.aborted) throw new Error("aborted");
  }
  return fallbackRoute(from, to);
}

function lengthKm(path: LngLat[]) {
  return path.slice(1).reduce((s, p, i) => s + distanceKm(path[i], p), 0);
}

export default function VehicleOverlay({
  map,
  reportId,
  target,
  dispatch,
  padding,
}: {
  map: MlMap;
  reportId: string;
  target: LngLat;
  dispatch: Dispatch;
  padding: () => PaddingOptions;
}) {
  const look = LOOK[dispatch.kind];
  const [el] = useState(() => document.createElement("div"));
  const [state, setState] = useState<{ eta: number; arrived: boolean } | null>(null);
  const [tx, ty] = target;

  useEffect(() => {
    const ctrl = new AbortController();
    const marker = new Marker({ element: el, anchor: "top", offset: [0, -18] });
    let raf = 0;
    const empty = { type: "FeatureCollection" as const, features: [] };

    map.addSource(SRC, { type: "geojson", data: empty });
    map.addLayer({ id: `${SRC}-glow`, type: "line", source: SRC, filter: ["==", ["get", "part"], "all"], paint: { "line-color": look.color, "line-width": 8, "line-blur": 6, "line-opacity": 0.35 } });
    map.addLayer({ id: `${SRC}-line`, type: "line", source: SRC, filter: ["==", ["get", "part"], "all"], paint: { "line-color": look.color, "line-width": 2, "line-dasharray": [2, 2], "line-opacity": 0.85 } });
    map.addLayer({ id: `${SRC}-done`, type: "line", source: SRC, filter: ["==", ["get", "part"], "done"], paint: { "line-color": "#ffffff", "line-width": 3, "line-opacity": 0.85 } });

    void fetchRoute(startPoint([tx, ty], reportId), [tx, ty], ctrl.signal)
      .then((path) => {
        const km = lengthKm(path);
        const minutes = Math.max(2, Math.round((km / KMH) * 60));
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const duration = reduced ? 0 : Math.min(14_000, Math.max(8_000, km * 3_000));
        const src = map.getSource(SRC) as GeoJSONSource | undefined;

        const bounds = path.reduce((b, p) => b.extend(p), new LngLatBounds(path[0], path[0]));
        map.fitBounds(bounds, { padding: padding(), duration: 900, maxZoom: 15 });

        marker.setLngLat(path[0]).addTo(map);
        const start = performance.now() + 900;
        let lastUi = 0;
        const frame = (now: number) => {
          const t = duration ? Math.max(0, (now - start) / duration) : 1;
          const eased = t < 1 ? 1 - (1 - t) ** 2 : 1;
          const { at } = pointAlong(path, eased);
          marker.setLngLat(at);
          const doneIdx = Math.max(1, Math.round(eased * (path.length - 1)));
          src?.setData({
            type: "FeatureCollection",
            features: [
              { type: "Feature", properties: { part: "all" }, geometry: { type: "LineString", coordinates: path } },
              { type: "Feature", properties: { part: "done" }, geometry: { type: "LineString", coordinates: [...path.slice(0, doneIdx), at] } },
            ],
          });
          if (now - lastUi > 200 || t >= 1) {
            lastUi = now;
            setState({ eta: Math.max(0, Math.ceil(minutes * (1 - eased))), arrived: t >= 1 });
          }
          if (t < 1) raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
      })
      .catch(() => {});

    return () => {
      ctrl.abort();
      cancelAnimationFrame(raf);
      marker.remove();
      for (const id of [`${SRC}-done`, `${SRC}-line`, `${SRC}-glow`]) if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(SRC)) map.removeSource(SRC);
      setState(null);
    };
    // padding to funkcja tworzona przy renderze — jej zmiana nie restartuje przejazdu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, el, reportId, tx, ty, look.color]);

  const Icon = look.icon;
  return createPortal(
    <div className="pointer-events-none flex flex-col items-center gap-1">
      <span
        className="vehicle-beacon grid size-9 place-items-center rounded-full border-2 border-white/90 text-white"
        style={{ background: look.color, ["--l1" as string]: look.lights[0], ["--l2" as string]: look.lights[1] }}
      >
        <Icon size={18} aria-hidden />
      </span>
      {state && (
        <span className="glass whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium">
          {dispatch.label} · {state.arrived ? "na miejscu" : `dojazd ~${state.eta} min`}
        </span>
      )}
    </div>,
    el,
  );
}
