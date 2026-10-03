import CityMapLoader from "@/components/CityMapLoader";
import { db } from "@/lib/db";
import { DEFAULT_CITY, listCities, loadCity, otherCityOutlines } from "@/lib/city-repo";

// Dane miasta zawsze świeże z bazy — bez cache przy budowaniu.
export const dynamic = "force-dynamic";

export default async function CentrumPage({ searchParams }: { searchParams: Promise<{ miasto?: string }> }) {
  const { miasto } = await searchParams;
  const cities = await listCities(db);
  const slug = cities.some((c) => c.slug === miasto) ? miasto! : DEFAULT_CITY;
  const [city, others] = await Promise.all([loadCity(db, slug), otherCityOutlines(db, slug)]);
  return <CityMapLoader city={city} cities={cities} others={others} />;
}
