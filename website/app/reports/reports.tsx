"use client"

import { Report } from "@/lib/types";
import Link from "next/link";

interface ReportsProps { 
  reports: Report[];
};

const styles: Record<
  Report["status"],
  { card: string; badge: string; button: string }
> = {
  nowe: {
    card: "border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.55)] hover:shadow-[0_0_30px_rgba(239,68,68,0.8)]",
    badge: "bg-red-500/15 text-red-400 border-red-500/60",
    button: "bg-red-500 text-black shadow-[0_0_12px_rgba(239,68,68,0.8)] hover:bg-red-400",
  },
  w_realizacji: {
    card: "border-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.5)] hover:shadow-[0_0_30px_rgba(250,204,21,0.8)]",
    badge: "bg-yellow-400/15 text-yellow-300 border-yellow-400/60",
    button: "bg-yellow-400 text-black shadow-[0_0_12px_rgba(250,204,21,0.8)] hover:bg-yellow-300",
  },
  przekazane: {
    card: "border-blue-400 shadow-[0_0_18px_rgba(250,204,21,0.5)] hover:shadow-[0_0_30px_rgba(250,204,21,0.8)]",
    badge: "bg-blue-400/15 text-blue-300 border-blue-400/60",
    button: "bg-blue-400 text-black shadow-[0_0_12px_rgba(250,204,21,0.8)] hover:bg-blue-300",
  },
  zamkniete: {
    card: "border-green-400 shadow-[0_0_18px_rgba(74,222,128,0.5)] hover:shadow-[0_0_30px_rgba(74,222,128,0.8)]",
    badge: "bg-green-400/15 text-green-300 border-green-400/60",
    button: "bg-green-400 text-black shadow-[0_0_12px_rgba(74,222,128,0.8)] hover:bg-green-300",
  },
};

export default function Reports({
  reports,
}: ReportsProps) { 

  if (!reports) return <p>loading...</p>
  return (
    <div>
      {reports.map((report, i) => {
        const s = styles[report.status];

        return (
          <div key={report.id}>
            <div
              className={`flex flex-col gap-3 rounded-xl border-2 bg-zinc-900 p-5 transition-shadow duration-200`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">#{report.id}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${s.badge}`}
                >
                  {report.status}
                </span>
              </div>

              <h2 className="text-lg font-semibold text-white">{report.title}</h2>

              <Link
                href={`/reports/${report.id}`}
                className={`mt-2 rounded-lg px-4 py-2 text-center text-sm font-bold transition ${s.button}`}
              >
                View
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}