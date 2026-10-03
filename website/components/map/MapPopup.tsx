"use client";

import type { ReactNode } from "react";
import type { Map as MlMap } from "maplibre-gl";
import { X } from "lucide-react";
import type { LngLat } from "@/lib/types";
import MapAnchor from "./MapAnchor";

interface Props {
  map: MlMap;
  at: LngLat;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

/** Dymek zakotwiczony obok punktu na mapie, po prawej stronie znacznika. */
export default function MapPopup({
  map,
  at,
  title,
  onClose,
  children,
  width = 240,
}: Props) {
  // Strona dymka liczona przy otwarciu; potem dymek jedzie razem z mapą.
  const p = map.project(at);
  const flip = p.x + 28 + width > map.getContainer().clientWidth - 400;
  return (
    <MapAnchor
      key={flip ? "l" : "r"}
      map={map}
      at={at}
      z={20}
      anchor={flip ? "top-right" : "top-left"}
      offset={[flip ? -28 : 28, -40]}
    >
      <div
        role="dialog"
        aria-label={typeof title === "string" ? title : undefined}
        className="glass animate-slide-in rounded-xl p-3 text-sm"
        style={{ width }}
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="font-medium leading-tight">{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="-m-1 rounded p-1 text-muted hover:bg-panel-hover hover:text-foreground"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </MapAnchor>
  );
}
