// app/reports/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getReportById } from "@/lib/reports";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  const report = await getReportById(id);
  if (!report) notFound();
  console.log(report)

  return (
    <div className="min-h-dvh bg-zinc-950 p-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/reports" className="text-sm text-zinc-400 hover:text-cyan-300">
          ← Back to reports
        </Link>

        <div className="mt-3 rounded-xl border-2 border-cyan-400/60 bg-zinc-900 p-6 shadow-[0_0_24px_rgba(34,211,238,0.25)]">
          <span className="text-sm text-zinc-400">#{report.id}</span>
          <h1 className="mt-1 text-2xl font-semibold text-white">{report.title}</h1>
          <p className="mt-3 text-zinc-300">{report.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-zinc-500">Category</dt><dd className="text-white">{report.category}</dd></div>
            <div><dt className="text-zinc-500">Source</dt><dd className="text-white">{report.source}</dd></div>
            <div><dt className="text-zinc-500">Status</dt><dd className="text-white">{report.status}</dd></div>
            <div><dt className="text-zinc-500">Confidence</dt><dd className="text-white">{Math.round(report.confidence * 100)}%</dd></div>
            <div><dt className="text-zinc-500">Confirmations</dt><dd className="text-white">{report.confirmations}</dd></div>
            <div><dt className="text-zinc-500">Blocking</dt><dd className="text-white">{report.blocking ? "Yes" : "No"}</dd></div>
            <div><dt className="text-zinc-500">Position</dt><dd className="text-white">{report.latitude ?? "Unavailable"}, {report.longitude ?? "Unavailable"}</dd></div>
            {report.cameraId && (
              <div><dt className="text-zinc-500">Camera</dt><dd className="text-white">{report.cameraId}</dd></div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}