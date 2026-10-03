import Link from "next/link";
import { connection } from "next/server";
import { getCameras } from "@/lib/reports";
import ReportForm from "./report-form";

export default async function NewReportPage() {
  await connection();
  const cameras = await getCameras();

  return (
    <div className="min-h-dvh bg-zinc-950 p-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/reports" className="text-sm text-zinc-400 hover:text-cyan-300">
          ← Wróć do zgłoszeń
        </Link>
        <h1 className="mt-2 mb-6 text-2xl font-semibold text-white">Nowe zgłoszenie</h1>
        <ReportForm cameras={cameras} />
      </div>
    </div>
  );
}