import Link from "next/link";
import { connection } from "next/server";
import LiveReports from "./LiveResponseListener";
import { Plus } from "lucide-react";
import { getReports } from "@/lib/reports";
import Reports from "./reports";
import { Suspense } from "react";
import Loading from "./loading";

export default async function Page() {
  await connection();
  const reports = await getReports();

  return (
    <main className="scroll-thin flex flex-1 flex-col overflow-y-auto px-4 py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Zgłoszenia
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              Wszystkie kanały, od najpilniejszego.
            </p>
          </div>

          <Link
            href="/reports/add"
            className="flex h-10 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent/85"
          >
            <Plus size={16} aria-hidden />
            Zgłoś problem
          </Link>
        </div>

        <Suspense fallback={<Loading />}>
          <LiveReports />
          <Reports reports={reports} />
        </Suspense>
      </div>
    </main>
  );
}
