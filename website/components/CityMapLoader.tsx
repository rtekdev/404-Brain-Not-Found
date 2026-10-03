"use client";

import dynamic from "next/dynamic";
import type { CityData, CityOutline, CityRef } from "@/lib/city-repo";

// MapLibre działa tylko w przeglądarce — bez SSR.
const CityMapApp = dynamic(() => import("./CityMapApp"), {
  ssr: false,
  loading: () => <div className="grid flex-1 place-items-center text-sm text-muted">Ładowanie mapy miasta…</div>,
});

export default function CityMapLoader({ city, cities, others }: { city: CityData; cities: CityRef[]; others: CityOutline[] }) {
  // Klucz = miasto: po przełączeniu mapa i cały stan widoku startują od nowa.
  return <CityMapApp key={city.slug} city={city} cities={cities} others={others} />;
}
