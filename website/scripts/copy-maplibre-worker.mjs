// MapLibre 6 ładuje worker jako moduł ES — Turbopack go nie bundluje,
// więc serwujemy pliki workera statycznie z public/maplibre/.
import { cp, mkdir } from "node:fs/promises";

const src = new URL("../node_modules/maplibre-gl/dist/", import.meta.url);
const dst = new URL("../public/maplibre/", import.meta.url);
await mkdir(dst, { recursive: true });
for (const f of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) await cp(new URL(f, src), new URL(f, dst));
