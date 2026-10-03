"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { Map as MlMap, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { LngLat } from "@/lib/types";

setWorkerUrl(new URL("/maplibre/maplibre-gl-worker.mjs", window.location.origin).href);

const STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export interface CityGeo {
  boundary: Feature<Polygon | MultiPolygon>;
  sectors: FeatureCollection<Polygon | MultiPolygon>;
}

interface Props {
  geo: CityGeo;
  showBoundary: boolean;
  showSectors: boolean;
  selectedSector: string | null;
  picking: boolean;
  onReady: (map: MlMap) => void;
  onSectorClick: (id: string | null) => void;
  onPick: (pos: LngLat) => void;
  /** Prawy margines na panel boczny przy dopasowaniu widoku. */
  paddingRight: number;
}

function worldMask(boundary: Feature<Polygon | MultiPolygon>): Feature<Polygon> {
  const holes =
    boundary.geometry.type === "Polygon"
      ? [boundary.geometry.coordinates[0]]
      : boundary.geometry.coordinates.map((p) => p[0]);
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [
        [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]],
        ...holes,
      ],
    },
  };
}

export function boundsOf(f: Feature<Polygon | MultiPolygon>): [LngLat, LngLat] {
  const rings =
    f.geometry.type === "Polygon" ? [f.geometry.coordinates[0]] : f.geometry.coordinates.map((p) => p[0]);
  let w = 180, s = 90, e = -180, n = -90;
  for (const ring of rings)
    for (const [x, y] of ring) {
      w = Math.min(w, x); e = Math.max(e, x);
      s = Math.min(s, y); n = Math.max(n, y);
    }
  return [[w, s], [e, n]];
}

export default function MapView(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const live = useRef(props);
  useLayoutEffect(() => {
    live.current = props;
  });

  useEffect(() => {
    if (!container.current) return;
    const { geo, paddingRight } = live.current;
    const map = new MlMap({
      container: container.current,
      style: STYLE,
      bounds: boundsOf(geo.boundary),
      fitBoundsOptions: {
        padding:
          window.innerWidth >= 640
            ? { top: 90, bottom: 60, left: 40, right: paddingRight + 40 }
            : { top: 80, bottom: window.innerHeight * 0.45, left: 16, right: 16 },
      },
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    });
    mapRef.current = map;

    map.on("load", () => {
      const firstSymbol = map.getStyle().layers.find((l) => l.type === "symbol")?.id;

      // Zieleń i wody wyraźniejsze niż w bazowym stylu.
      for (const l of map.getStyle().layers) {
        if (l.type !== "fill") continue;
        if (/park|wood|forest|grass|landcover|green/i.test(l.id))
          map.setPaintProperty(l.id, "fill-color", "#1d3a2f");
        if (/water/i.test(l.id)) map.setPaintProperty(l.id, "fill-color", "#0f1d2e");
      }

      map.addSource("mask", { type: "geojson", data: worldMask(geo.boundary) });
      map.addSource("boundary", { type: "geojson", data: geo.boundary });
      map.addSource("sectors", { type: "geojson", data: geo.sectors, promoteId: "id" });

      map.addLayer({ id: "city-fill", type: "fill", source: "boundary", paint: { "fill-color": "#2a2f6b", "fill-opacity": 0.28 } }, firstSymbol);
      map.addLayer({
        id: "sectors-fill",
        type: "fill",
        source: "sectors",
        paint: {
          "fill-color": "#8b5cf6",
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false], 0.2,
            ["boolean", ["feature-state", "hover"], false], 0.08,
            0,
          ],
        },
      }, firstSymbol);
      map.addLayer({ id: "sectors-line", type: "line", source: "sectors", paint: { "line-color": "#8b5cf6", "line-width": 1.4, "line-opacity": 0.75 } }, firstSymbol);
      // Teren poza miastem wyszarzony — nad wszystkimi warstwami bazowymi (także etykietami).
      map.addLayer({ id: "mask", type: "fill", source: "mask", paint: { "fill-color": "#1b1c20", "fill-opacity": 0.83 } });
      map.addLayer({ id: "boundary-glow", type: "line", source: "boundary", paint: { "line-color": "#c4b5fd", "line-width": 9, "line-blur": 7, "line-opacity": 0.45 } });
      map.addLayer({ id: "boundary-line", type: "line", source: "boundary", paint: { "line-color": "#ede9fe", "line-width": 2 } });

      let hovered: string | null = null;
      map.on("mousemove", "sectors-fill", (e) => {
        const id = e.features?.[0]?.id as string | undefined;
        if (hovered && hovered !== id) map.setFeatureState({ source: "sectors", id: hovered }, { hover: false });
        if (id) map.setFeatureState({ source: "sectors", id }, { hover: true });
        hovered = id ?? null;
      });
      map.on("mouseleave", "sectors-fill", () => {
        if (hovered) map.setFeatureState({ source: "sectors", id: hovered }, { hover: false });
        hovered = null;
      });

      live.current.onReady(map);
    });

    map.on("click", (e) => {
      const p = live.current;
      if (p.picking) {
        p.onPick([e.lngLat.lng, e.lngLat.lat]);
        return;
      }
      if (!p.showSectors) return;
      const hit = map.queryRenderedFeatures(e.point, { layers: ["sectors-fill"] })[0];
      p.onSectorClick((hit?.id as string) ?? null);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Widoczność warstw
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !map.getLayer("sectors-fill")) return;
    const vis = (on: boolean) => (on ? "visible" : "none");
    map.setLayoutProperty("boundary-glow", "visibility", vis(props.showBoundary));
    map.setLayoutProperty("boundary-line", "visibility", vis(props.showBoundary));
    map.setLayoutProperty("sectors-fill", "visibility", vis(props.showSectors));
    map.setLayoutProperty("sectors-line", "visibility", vis(props.showSectors));
  });

  // Podświetlenie wybranego sektora
  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getSource("sectors")) return;
    for (const f of props.geo.sectors.features) {
      const id = f.properties?.id as string;
      map.setFeatureState({ source: "sectors", id }, { selected: id === props.selectedSector });
    }
  });

  useEffect(() => {
    const canvas = mapRef.current?.getCanvas();
    if (canvas) canvas.style.cursor = props.picking ? "crosshair" : "";
  }, [props.picking]);

  // MapLibre nadpisuje position kontenera, więc pozycjonujemy wrapper.
  return (
    <div className="absolute inset-0" aria-label="Mapa miasta" role="region">
      <div ref={container} className="h-full w-full" />
    </div>
  );
}
