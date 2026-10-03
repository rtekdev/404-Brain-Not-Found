"use client";

import type { Map as MlMap } from "maplibre-gl";
import { ArrowRightLeft } from "lucide-react";
import type { CityOutline } from "@/lib/city-repo";
import MapAnchor, { useMapZoom } from "./MapAnchor";
import { SWITCH_ZOOM, boundsOf } from "./MapView";

/** Etykiety pozostałych miast po oddaleniu mapy — kliknięcie przełącza miasto (granica w MapView). */
export default function OtherCities({ map, others, onCity }: { map: MlMap; others: CityOutline[]; onCity: (slug: string) => void }) {
  const zoom = useMapZoom(map);
  if (zoom >= SWITCH_ZOOM) return null;
  return others.map((c) => {
    const [[w, s], [e, n]] = boundsOf(c.boundary);
    return (
      <MapAnchor key={c.slug} map={map} at={[(w + e) / 2, (s + n) / 2]} z={9}>
        <button
          type="button"
          onClick={() => onCity(c.slug)}
          title={`Przełącz na ${c.name}`}
          className="glass animate-slide-in flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-accent-ink hover:bg-panel-hover"
        >
          {c.name}
          <ArrowRightLeft size={13} className="text-accent-soft" aria-hidden />
        </button>
      </MapAnchor>
    );
  });
}
