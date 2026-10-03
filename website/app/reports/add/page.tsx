import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { connection } from "next/server";
import { getCameras } from "@/lib/reports";
import ReportForm from "./report-form";

export default async function NewReportPage() {
  await connection();
  const cameras = await getCameras();

  return (
    <main className="scroll-thin flex flex-1 flex-col overflow-y-auto px-4 py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Link href="/reports" className="flex w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft size={16} aria-hidden /> Wszystkie zgłoszenia
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Nowe zgłoszenie</h1>
        <ReportForm cameras={cameras} />
      </div>
    </main>
  );
}