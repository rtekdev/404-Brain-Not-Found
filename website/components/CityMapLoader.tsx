"use client";

import dynamic from "next/dynamic";

// MapLibre działa tylko w przeglądarce — bez SSR.
const CityMapApp = dynamic(() => import("./CityMapApp"), {
  ssr: false,
  loading: () => <div className="grid flex-1 place-items-center text-sm text-muted">Ładowanie mapy miasta…</div>,
});

export default function CityMapLoader() {
  return <CityMapApp />;
}
