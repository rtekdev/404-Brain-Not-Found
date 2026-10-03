"use client";

import dynamic from "next/dynamic";
import type { CityData } from "@/lib/city-repo";

// MapLibre działa tylko w przeglądarce — bez SSR.
const CityMapApp = dynamic(() => import("./CityMapApp"), {
  ssr: false,
  loading: () => <div className="grid flex-1 place-items-center text-sm text-muted">Ładowanie mapy miasta…</div>,
});

export default function CityMapLoader({ city }: { city: CityData }) {
  return <CityMapApp city={city} />;
}
