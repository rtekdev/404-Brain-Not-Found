import Link from "next/link";
import { connection } from "next/server";
import { Plus, Link } from "lucide-react";
import { getReports } from "@/lib/reports";
import Reports from "./reports";

export default async function Page() {
  await connection();
  const reports = await getReports();

  return (
    <main className="scroll-thin flex flex-1 flex-col overflow-y-auto px-4 py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Zgłoszenia</h1>
            <p className="mt-0.5 text-sm text-muted">Wszystkie kanały, od najpilniejszego.</p>
          </div>
          <Link
            href="/reports/add"
            className="flex h-10 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent/85"
          >
            <Plus size={16} aria-hidden /> Zgłoś problem
          </Link>
        </div>
        <Reports reports={reports} />
      </div>
    </main>
  );
}
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
        <span className="text-lg leading-none">+</span> Add Report
      </Link>
    </div>

    <Suspense fallback={<Loading />}>
      <Reports reports={reports} />
    </Suspense>
  </div>
  );
};
