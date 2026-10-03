import { Suspense } from "react";
import Loading from "./loading";
import Reports from "./reports";
import { getReports } from "@/lib/reports";
import { connection } from "next/server";
import { Link } from "lucide-react";
import LiveReports from "./LiveResponseListener";

export default async function Page() {
  await connection();
  const reports = await getReports();

  return (
    <div className="min-h-dvh bg-zinc-950 p-6">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="bg-gradient-to-r from-cyan-300 to-fuchsia-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]">
          Available Reports
        </h1>
        <p className="mt-1 text-sm text-zinc-400">Browse and manage incoming reports</p>
      </div>

      <Link
        href="/reports/add"
        className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-bold text-black shadow-[0_0_14px_rgba(34,211,238,0.8)] transition hover:bg-cyan-300 hover:shadow-[0_0_24px_rgba(34,211,238,1)] active:scale-95"
      >
          <span >+ Add Report</span>
      </Link>
    </div>
    <Suspense fallback={<Loading />}>
      <LiveReports />
      <Reports reports={reports} />
    </Suspense>
  </div>
  );
};