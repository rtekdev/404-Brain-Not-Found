"use client";

import type { Map as MlMap } from "maplibre-gl";
import { Camera as CameraIcon, MapPin } from "lucide-react";
import type { AccessPoint, Asset, Camera, LngLat, Sector } from "@/lib/types";
import { PRIORITY_COLOR } from "@/lib/meta";
import { ACCESS_ICON, ASSET_ICON, CATEGORY_ICON } from "@/components/icons";
import type { ScoredReport, Selection } from "@/components/CityMapApp";
import MapAnchor, { useMapZoom } from "./MapAnchor";

interface Props {
  map: MlMap;
  layers: Record<string, boolean>;
  sectors: Sector[];
  selectedSector: string | null;
  reports: ScoredReport[];
  cameras: Camera[];
  assets: Asset[];
  access: AccessPoint[];
  selection: Selection | null;
  draft: LngLat | null;
  onSelect: (s: Selection) => void;
  onSectorClick: (id: string) => void;
}

export default function MarkerOverlay(props: Props) {
  const { map, layers, selection } = props;
  const zoom = useMapZoom(map);
  // Przy widoku całego miasta pomocnicze warstwy jako kropki, żeby nie zasłaniały zgłoszeń.
  const compact = zoom < 13.2;
  const isSel = (type: Selection["type"], id: string) => selection?.type === type && selection.id === id;

  return (
    <>
      {layers.sectors &&
        props.sectors.map((s) => (
          <MapAnchor key={s.id} map={map} at={s.anchor} z={1}>
            <button
              type="button"
              onClick={() => props.onSectorClick(s.id)}
              title={`Sektor ${s.id} · ${s.name}`}
              className={`rounded-md border px-1.5 py-0.5 text-xs font-semibold tracking-wide transition ${
                props.selectedSector === s.id
                  ? "border-accent-soft bg-accent text-white"
                  : "border-accent/70 bg-[#2a1f4d]/90 text-accent-ink hover:bg-accent/60"
              }`}
            >
              {s.id}
              {zoom > 12.6 && <span className="ml-1 font-normal opacity-80">{s.name}</span>}
            </button>
          </MapAnchor>
        ))}

      {layers.assets &&
        props.assets.map((a) => {
          const Icon = ASSET_ICON[a.kind];
          const warn = a.level >= 85 && a.kind !== "sprzet" && a.kind !== "ladowarka";
          return (
            <MapAnchor key={a.id} map={map} at={a.position} z={2}>
              <button
                type="button"
                aria-label={`${a.name}, ${a.levelLabel}`}
                onClick={() => props.onSelect({ type: "asset", id: a.id })}
                className={`grid place-items-center border bg-[#10262b] transition hover:scale-110 ${
                  compact ? "size-3 rounded-sm" : "size-7 rounded-md"
                } ${warn ? "border-amber-400 text-amber-300" : "border-cyan/60 text-cyan"} ${
                  isSel("asset", a.id) ? "ring-2 ring-white" : ""
                }`}
              >
                {!compact && <Icon size={14} aria-hidden />}
              </button>
            </MapAnchor>
          );
        })}

      {layers.access &&
        props.access.map((d) => {
          const Icon = ACCESS_ICON[d.kind];
          return (
            <MapAnchor key={d.id} map={map} at={d.position} z={2}>
              <button
                type="button"
                aria-label={`${d.name}${d.ok ? "" : " — niedostępne"}`}
                onClick={() => props.onSelect({ type: "access", id: d.id })}
                className={`grid place-items-center rounded-full transition hover:scale-110 ${
                  compact ? "size-2.5 border" : "size-7 border-2"
                } ${
                  d.ok ? "border-sky-300 bg-sky-500 text-white" : "border-rose-300 bg-rose-500 text-white"
                } ${isSel("access", d.id) ? "ring-2 ring-white" : ""}`}
              >
                {!compact && <Icon size={14} aria-hidden />}
              </button>
            </MapAnchor>
          );
        })}

      {layers.cameras &&
        props.cameras.map((c) => (
          <MapAnchor key={c.id} map={map} at={c.position} z={3}>
            <button
              type="button"
              aria-label={`Kamera ${c.name}${c.online ? "" : " (offline)"}`}
              onClick={() => props.onSelect({ type: "camera", id: c.id })}
              className={`grid place-items-center rounded-full border transition hover:scale-110 ${
                compact && !isSel("camera", c.id) ? "size-4" : "size-8"
              } ${
                isSel("camera", c.id)
                  ? "border-accent-soft bg-accent text-white ring-4 ring-accent/40"
                  : "border-white/15 bg-[#2a2d38] text-white/90"
              } ${c.online ? "" : "opacity-45"}`}
            >
              <CameraIcon size={compact && !isSel("camera", c.id) ? 9 : 15} aria-hidden />
            </button>
          </MapAnchor>
        ))}

      {layers.reports &&
        props.reports
          .filter((r) => r.status !== "zamkniete")
          .map((r) => {
            const Icon = CATEGORY_ICON[r.category];
            const color = PRIORITY_COLOR[r.priority.level];
            const sel = isSel("report", r.id);
            return (
              <MapAnchor key={r.id} map={map} at={r.position} z={sel ? 6 : r.priority.level === "krytyczny" ? 5 : 4}>
                <button
                  type="button"
                  aria-label={`Zgłoszenie: ${r.title}, priorytet ${r.priority.level}`}
                  onClick={() => props.onSelect({ type: "report", id: r.id })}
                  className={`relative grid size-8 place-items-center rounded-full border-2 border-[#15171c] text-[#15171c] shadow-lg transition hover:scale-110 ${sel ? "scale-125 ring-2 ring-white" : ""}`}
                  style={{ background: color }}
                >
                  {r.priority.level === "krytyczny" && (
                    <span style={{ color }} className="marker-pulse absolute inset-0 rounded-full" aria-hidden />
                  )}
                  <Icon size={15} strokeWidth={2.4} aria-hidden className="relative" />
                </button>
              </MapAnchor>
            );
          })}

      {props.draft && (
        <MapAnchor map={map} at={props.draft} z={10}>
          <MapPin size={34} className="-translate-y-3 fill-accent text-white drop-shadow-lg" aria-label="Wybrane miejsce" />
        </MapAnchor>
      )}
    </>
  );
}
