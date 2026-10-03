import { Suspense } from "react";
import Loading from "./loading";
import Reports from "./reports";
import { getReports } from "@/lib/reports";
import { connection } from "next/server";

export default async function Page() {
  await connection();
  const reports = await getReports();

  return (<div>
    <p>Available Reports</p>
    <Suspense fallback={<Loading />}>
      <Reports reports={reports}/>
    </Suspense>

  </div>);
};