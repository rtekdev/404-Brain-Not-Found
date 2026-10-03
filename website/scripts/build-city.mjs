// Onboarding miasta: pobiera granicę i osiedla z OpenStreetMap,
// dzieli miasto na sektory (Voronoi z punktów bazowych przycięty do granicy)
// i zapisuje statyczne GeoJSON-y do public/data/<slug>/.
//
// Użycie: node scripts/build-city.mjs
// Dane © OpenStreetMap contributors (ODbL).

import { mkdir, writeFile } from "node:fs/promises";
import * as turf from "@turf/turf";

const CITY = {
  slug: "kielce",
  name: "Kielce",
  country: "Poland",
  // Punkty bazowe sektorów — nazwane od osiedla, w którym leżą.
  sectorSeeds: [
    { id: "S01", name: "Śródmieście", lon: 20.6305, lat: 50.8704 },
    { id: "S02", name: "Szydłówek", lon: 20.6406, lat: 50.8893 },
    { id: "S03", name: "Czarnów", lon: 20.5995, lat: 50.8800 },
    { id: "S04", name: "Zagórze", lon: 20.6680, lat: 50.8600 },
    { id: "S05", name: "Barwinek", lon: 20.6380, lat: 50.8420 },
    { id: "S06", name: "Zalesie", lon: 20.5450, lat: 50.8480 },
    { id: "S07", name: "Dąbrowa", lon: 20.6600, lat: 50.9030 },
    { id: "S08", name: "Dyminy", lon: 20.6230, lat: 50.8150 },
    { id: "S09", name: "Niewachlów", lon: 20.5800, lat: 50.9000 },
  ],
};

const UA = "hackyeah-404-brain-not-found/0.1";
const OUT = new URL(`../public/data/${CITY.slug}/`, import.meta.url);

async function fetchJson(url, init) {
  const res = await fetch(url, { ...init, headers: { "User-Agent": UA, ...init?.headers } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function fetchBoundary() {
  const q = new URLSearchParams({
    city: CITY.name,
    country: CITY.country,
    format: "geojson",
    polygon_geojson: "1",
    polygon_threshold: "0.0002",
    limit: "1",
  });
  const data = await fetchJson(`https://nominatim.openstreetmap.org/search?${q}`);
  const f = data.features[0];
  return turf.feature(f.geometry, { name: CITY.name, osm_id: f.properties.osm_id });
}

async function fetchPlaces() {
  const query = `[out:json][timeout:60];area["name"="${CITY.name}"]["admin_level"="8"]->.a;node(area.a)["place"~"suburb|quarter|neighbourhood"];out;`;
  const data = await fetchJson("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: new URLSearchParams({ data: query }),
  });
  return turf.featureCollection(
    data.elements.map((e) =>
      turf.point([e.lon, e.lat], { name: e.tags.name, place: e.tags.place }),
    ),
  );
}

function buildSectors(boundary, places) {
  const seeds = turf.featureCollection(
    CITY.sectorSeeds.map((s) => turf.point([s.lon, s.lat], { id: s.id, name: s.name })),
  );
  const bbox = turf.bbox(turf.buffer(boundary, 2, { units: "kilometers" }));
  const cells = turf.voronoi(seeds, { bbox });

  const sectors = cells.features.map((cell, i) => {
    const clipped = turf.intersect(turf.featureCollection([cell, boundary]));
    const props = seeds.features[i].properties;
    const area = turf.area(clipped) / 1e6;
    return turf.feature(clipped.geometry, {
      ...props,
      areaKm2: Math.round(area * 10) / 10,
      anchor: turf.pointOnFeature(clipped).geometry.coordinates,
    });
  });

  for (const p of places.features) {
    const s = sectors.find((s) => turf.booleanPointInPolygon(p, s));
    p.properties.sector = s?.properties.id ?? null;
  }
  return turf.featureCollection(sectors);
}

const boundary = await fetchBoundary();
const places = await fetchPlaces();
const sectors = buildSectors(boundary, places);

await mkdir(OUT, { recursive: true });
const round = (fc) =>
  JSON.parse(JSON.stringify(fc, (k, v) => (typeof v === "number" ? Math.round(v * 1e5) / 1e5 : v)));
await writeFile(new URL("boundary.geojson", OUT), JSON.stringify(round(boundary)));
await writeFile(new URL("sectors.geojson", OUT), JSON.stringify(round(sectors)));
await writeFile(new URL("places.geojson", OUT), JSON.stringify(round(places)));

console.log(
  `${CITY.name}: granica OK, ${sectors.features.length} sektorów, ${places.features.length} osiedli`,
);
