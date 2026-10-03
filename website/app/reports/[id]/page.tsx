import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft, Map, Sparkles } from "lucide-react";
import { CATEGORY_ICON, SOURCE_ICON } from "@/components/icons";
import {
  CATEGORY_LABEL,
  PRIORITY_COLOR,
  PRIORITY_LABEL,
  SOURCE_LABEL,
  STATUS_LABEL,
  timeAgo,
  unitById,
  unitForCategory,
} from "@/lib/meta";
import { scoreReport } from "@/lib/priority";
import { getReportById } from "@/lib/reports";

/** Strona renderuje się na żądanie (connection()), więc czas żądania jest stały dla całego renderu. */
const requestTime = () => Date.now();

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const r = await getReportById(decodeURIComponent(id));
  if (!r) notFound();

  const now = requestTime();
  const priority = scoreReport(r, now);
  const color = PRIORITY_COLOR[priority.level];
  const Icon = CATEGORY_ICON[r.category];
  const SourceIcon = SOURCE_ICON[r.source];
  const fields: [string, ReactNode][] = [
    ["Źródło", <span key="src" className="flex items-center gap-1.5"><SourceIcon size={14} aria-hidden />{SOURCE_LABEL[r.source]}</span>],
    ["Kategoria", CATEGORY_LABEL[r.category]],
    ["Status", STATUS_LABEL[r.status]],
    ["Jednostka", unitById(r.unitId)?.name ?? "nieprzypisane"],
    ["Miejsce", r.cityName ? `${r.cityName}${r.sectorName ? `, ${r.sectorName}` : ""}` : "poza sektorami"],
    ["Zgłoszono", timeAgo(r.createdAt, now)],
    ["Potwierdzenia", r.confirmations],
    ["Współrzędne", <span key="pos" className="font-mono text-xs">
      {r.latitude ? r.latitude.toFixed(5) : "Brak"},{" "}
      {r.longitude ? r.longitude.toFixed(5) : "Brak"}
    </span>],
  ];

  return (
    <main className="scroll-thin flex flex-1 flex-col overflow-y-auto px-4 py-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Link href="/reports" className="flex w-fit items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft size={16} aria-hidden /> Wszystkie zgłoszenia
        </Link>

        <article className="rounded-xl border border-line bg-panel-solid">
          <header className="flex items-start gap-3 border-b border-line p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-lg" style={{ background: `${color}22`, color }}>
              <Icon size={22} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono text-subtle">{r.id}</span>
                <span className="rounded-md px-1.5 py-0.5 font-semibold" style={{ background: `${color}22`, color }}>
                  {PRIORITY_LABEL[priority.level]} · {priority.score}
                </span>
                {r.blocking && (
                  <span className="rounded-md bg-rose-500/15 px-1.5 py-0.5 font-semibold text-rose-300">blokuje przejście</span>
                )}
              </div>
              <h1 className="mt-1 text-xl font-semibold leading-snug">{r.title}</h1>
              {r.description !== r.title && <p className="mt-1 text-sm text-muted">{r.description}</p>}
              {r.handledBy && <p className="mt-2 text-sm text-rose-300">Przejęte: {r.handledBy}</p>}
            </div>
          </header>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm sm:grid-cols-4">
            {fields.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-subtle">{k}</dt>
                <dd className="mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>

          <section className="mx-4 mb-4 rounded-lg border border-accent/40 bg-accent/10 p-3">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent-soft">
              <Sparkles size={13} aria-hidden /> Ocena AI
            </h2>
            <p className="mt-2 text-sm">
              Kategoria: <strong>{CATEGORY_LABEL[r.category]}</strong>{" "}
              <span className="text-muted">(pewność {Math.round(r.confidence * 100)}%)</span> · sugerowana jednostka:{" "}
              <strong>{unitForCategory(r.category).name}</strong>
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {priority.reasons.map((x) => (
                <li key={x} className="rounded-md bg-black/25 px-2 py-0.5 text-xs text-accent-ink">{x}</li>
              ))}
            </ul>
          </section>
        </article>

        {r.citySlug && (
          <Link
            href={`/centrum?miasto=${r.citySlug}`}
            className="flex h-10 w-fit items-center gap-1.5 rounded-lg border border-line px-4 text-sm hover:bg-panel-hover"
          >
            <Map size={16} aria-hidden /> Otwórz mapę: {r.cityName}
          </Link>
        )}
      </div>
    </main>
  );
}
