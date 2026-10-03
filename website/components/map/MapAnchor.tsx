"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Marker, type Map as MlMap, type PositionAnchor } from "maplibre-gl";
import type { LngLat } from "@/lib/types";

/**
 * Element React przypięty do punktu na mapie. Pozycją steruje natywny Marker
 * MapLibre, więc przesuwa się razem z mapą w tej samej klatce (bez re-renderu React).
 */
export default function MapAnchor({
  map,
  at,
  children,
  z = 1,
  anchor = "center",
  offset = [0, 0],
}: {
  map: MlMap;
  at: LngLat;
  children: ReactNode;
  z?: number;
  anchor?: PositionAnchor;
  offset?: [number, number];
}) {
  const [el] = useState(() => {
    const div = document.createElement("div");
    // Kliknięcie w znacznik nie może trafić do mapy (zaznaczenie sektora / wskazanie miejsca).
    for (const type of ["click", "dblclick", "mousedown", "touchstart"])
      div.addEventListener(type, (e) => e.stopPropagation());
    return div;
  });
  const [marker] = useState(() => new Marker({ element: el, anchor, offset }).setLngLat(at));

  useEffect(() => {
    marker.addTo(map);
    return () => {
      marker.remove();
    };
  }, [map, marker]);

  useEffect(() => {
    marker.setLngLat(at);
  }, [marker, at]);

  useEffect(() => {
    marker.getElement().style.zIndex = String(z);
  }, [marker, z]);

  useEffect(() => {
    marker.setOffset(offset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marker, offset[0], offset[1]]);

  return createPortal(children, el);
}

/** Aktualny zoom zaokrąglony do 0,1 — re-render tylko przy realnej zmianie. */
export function useMapZoom(map: MlMap) {
  const [zoom, setZoom] = useState(() => Math.round(map.getZoom() * 10) / 10);
  useEffect(() => {
    const onZoom = () => setZoom(Math.round(map.getZoom() * 10) / 10);
    map.on("zoom", onZoom);
    return () => {
      map.off("zoom", onZoom);
    };
  }, [map]);
  return zoom;
}
