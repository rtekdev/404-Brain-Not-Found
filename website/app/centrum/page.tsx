import CityMapLoader from "@/components/CityMapLoader";
import { db } from "@/lib/db";
import { loadCity } from "@/lib/city-repo";

// Dane miasta zawsze świeże z bazy — bez cache przy budowaniu.
export const dynamic = "force-dynamic";

export default async function CentrumPage() {
  const city = await loadCity(db);
  return <CityMapLoader city={city} />;
}
