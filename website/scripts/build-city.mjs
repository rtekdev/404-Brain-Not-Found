// Onboarding miasta: pobiera z OpenStreetMap granicę, dzielnice (jako sektory) i osiedla
// i zapisuje statyczne GeoJSON-y do public/data/<slug>/.
//
// Użycie: node scripts/build-city.mjs
// Dane © OpenStreetMap contributors (ODbL).

import { mkdir, writeFile } from "node:fs/promises";
import * as turf from "@turf/turf";

const CITY = {
  slug: "krakow",
  name: "Kraków",
  country: "Poland",
  // Sektory = 18 dzielnic samorządowych; `osm` to nazwa obszaru w OpenStreetMap.
  districts: [
    { id: "D01", name: "Stare Miasto", osm: "Dzielnica I Stare Miasto" },
    { id: "D02", name: "Grzegórzki", osm: "Dzielnica II Grzegórzki" },
    { id: "D03", name: "Prądnik Czerwony", osm: "Dzielnica III Prądnik Czerwony" },
    { id: "D04", name: "Prądnik Biały", osm: "Dzielnica IV Prądnik Biały" },
    { id: "D05", name: "Krowodrza", osm: "Dzielnica V Krowodrza" },
    { id: "D06", name: "Bronowice", osm: "Dzielnica VI Bronowice" },
    { id: "D07", name: "Zwierzyniec", osm: "Dzielnica VII Zwierzyniec" },
    { id: "D08", name: "Dębniki", osm: "Dzielnica VIII Dębniki" },
    { id: "D09", name: "Łagiewniki-Borek Fałęcki", osm: "Dzielnica IX Łagiewniki-Borek Fałęcki" },
    { id: "D10", name: "Swoszowice", osm: "Dzielnica X Swoszowice" },
    { id: "D11", name: "Podgórze Duchackie", osm: "Dzielnica XI Podgórze Duchackie" },
    { id: "D12", name: "Bieżanów-Prokocim", osm: "Dzielnica XII Bieżanów-Prokocim" },
    { id: "D13", name: "Podgórze", osm: "Dzielnica XIII Podgórze" },
    { id: "D14", name: "Czyżyny", osm: "Dzielnica XIV Czyżyny" },
    { id: "D15", name: "Mistrzejowice", osm: "Dzielnica XV Mistrzejowice" },
    { id: "D16", name: "Bieńczyce", osm: "Dzielnica XVI Bieńczyce" },
    { id: "D17", name: "Wzgórza Krzesławickie", osm: "Dzielnica XVII Wzgórza Krzesławickie" },
    { id: "D18", name: "Nowa Huta", osm: "Dzielnica XVIII Nowa Huta" },
  ],
};

const UA = "hackyeah-404-brain-not-found/0.1";
const OUT = new URL(`../public/data/${CITY.slug}/`, import.meta.url);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, init) {
  const res = await fetch(url, { ...init, headers: { "User-Agent": UA, Accept: "application/json", ...init?.headers } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

/** Obszar z Nominatim jako poligon; Nominatim wymaga najwyżej 1 zapytania na sekundę. */
async function nominatimArea(params) {
  const q = new URLSearchParams({ ...params, format: "geojson", polygon_geojson: "1", polygon_threshold: "0.0002", limit: "1" });
  const data = await fetchJson(`https://nominatim.openstreetmap.org/search?${q}`);
  await sleep(1100);
  const f = data.features.find((x) => x.geometry.type === "Polygon" || x.geometry.type === "MultiPolygon");
  if (!f) throw new Error(`Brak poligonu: ${JSON.stringify(params)}`);
  return f;
}

async function fetchBoundary() {
  const f = await nominatimArea({ city: CITY.name, country: CITY.country });
  return turf.feature(f.geometry, { name: CITY.name, osm_id: f.properties.osm_id });
}

async function fetchDistricts(boundary) {
  const out = [];
  for (const d of CITY.districts) {
    const f = await nominatimArea({ q: `${d.osm}, ${CITY.name}` });
    // Przycięcie do granicy miasta usuwa drobne wystające fragmenty po uproszczeniu geometrii.
    const clipped = turf.intersect(turf.featureCollection([turf.feature(f.geometry), boundary])) ?? turf.feature(f.geometry);
    out.push(
      turf.feature(clipped.geometry, {
        id: d.id,
        name: d.name,
        areaKm2: Math.round((turf.area(clipped) / 1e6) * 10) / 10,
        anchor: turf.pointOnFeature(clipped).geometry.coordinates,
      }),
    );
    console.log(`  ${d.id} ${d.name}: ${out.at(-1).properties.areaKm2} km²`);
  }
  return turf.featureCollection(out);
}

async function fetchPlaces(boundary, sectors) {
  // Prostokąt wokół granicy zamiast `area` — wyszukiwanie obszaru po nazwie bywa zawodne.
  const [w, s, e, n] = turf.bbox(boundary);
  const query = `[out:json][timeout:90];node(${s},${w},${n},${e})["place"~"suburb|quarter|neighbourhood"];out;`;
  // Publiczne serwery Overpass bywają przeciążone — próbujemy kolejnych.
  let data;
  for (const url of ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"]) {
    try {
      data = await fetchJson(url, { method: "POST", body: new URLSearchParams({ data: query }) });
      break;
    } catch (e) {
      console.warn(`  Overpass: ${e.message}, próbuję dalej`);
    }
  }
  if (!data) throw new Error("Żaden serwer Overpass nie odpowiedział");
  const seen = new Set();
  const places = data.elements
    .filter((e) => e.tags?.name && !seen.has(e.tags.name) && seen.add(e.tags.name))
    .map((e) => {
      const p = turf.point([e.lon, e.lat], { name: e.tags.name, place: e.tags.place });
      p.properties.sector = sectors.features.find((s) => turf.booleanPointInPolygon(p, s))?.properties.id ?? null;
      return p;
    })
    .filter((p) => p.properties.sector);
  return turf.featureCollection(places);
}

const boundary = await fetchBoundary();
console.log(`${CITY.name}: granica OK, ${Math.round(turf.area(boundary) / 1e6)} km²`);
const sectors = await fetchDistricts(boundary);
const places = await fetchPlaces(boundary, sectors);

await mkdir(OUT, { recursive: true });
const round = (fc) =>
  JSON.parse(JSON.stringify(fc, (k, v) => (typeof v === "number" ? Math.round(v * 1e5) / 1e5 : v)));
await writeFile(new URL("boundary.geojson", OUT), JSON.stringify(round(boundary)));
await writeFile(new URL("sectors.geojson", OUT), JSON.stringify(round(sectors)));
await writeFile(new URL("places.geojson", OUT), JSON.stringify(round(places)));

console.log(`${CITY.name}: ${sectors.features.length} sektorów (dzielnic), ${places.features.length} osiedli`);
