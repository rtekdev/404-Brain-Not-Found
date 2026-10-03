"use client";

import { useActionState, useState, type ReactNode } from "react";
import { createReport, type FormState } from "./actions";
import { CATEGORY_LABELS, SOURCE_LABELS, STATUS_LABELS } from "@/lib/types";

const input =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white " +
  "placeholder:text-zinc-500 outline-none transition " +
  "focus:border-cyan-400 focus:shadow-[0_0_12px_rgba(34,211,238,0.45)]";

function Field({ label, error, children }: { label: string; error?: string[]; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{label}</span>
      {children}
      {error?.[0] && <span className="text-xs text-red-400">{error[0]}</span>}
    </label>
  );
}

function Options<T extends string>({ items }: { items: Record<T, string> }) {
  return (Object.entries(items) as [T, string][]).map(([value, label]) => (
    <option key={value} value={value}>{label}</option>
  ));
}

export default function ReportForm({ cameras }: { cameras: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createReport, {});
  const [confidence, setConfidence] = useState(0.7);
  const e = state.errors ?? {};
  const v = state.values ?? {};

  return (
    <form
      action={action}
      className="flex flex-col gap-5 rounded-xl border-2 border-cyan-400/60 bg-zinc-900/60 p-6
                 shadow-[0_0_24px_rgba(34,211,238,0.25)]"
    >
      <Field label="Tytuł" error={e.title}>
        <input name="title" required defaultValue={v.title} placeholder="np. Dziura w jezdni" className={input} />
      </Field>

      <Field label="Opis" error={e.description}>
        <textarea name="description" required rows={4} defaultValue={v.description}
          placeholder="Co się dzieje i gdzie dokładnie?" className={input} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Kategoria" error={e.category}>
          <select name="category" defaultValue={v.category ?? "drogi"} className={input}>
            <Options items={CATEGORY_LABELS} />
          </select>
        </Field>
        <Field label="Źródło" error={e.source}>
          <select name="source" defaultValue={v.source ?? "aplikacja"} className={input}>
            <Options items={SOURCE_LABELS} />
          </select>
        </Field>
        <Field label="Status" error={e.status}>
          <select name="status" defaultValue={v.status ?? "nowe"} className={input}>
            <Options items={STATUS_LABELS} />
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Długość geogr. (lng)" error={e.longitude}>
          <input name="longitude" type="number" step="any" required
            defaultValue={v.longitude ?? "19.9373"} className={input} />
        </Field>
        <Field label="Szerokość geogr. (lat)" error={e.latitude}>
          <input name="latitude" type="number" step="any" required
            defaultValue={v.latitude ?? "50.0617"} className={input} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Kamera (opcjonalnie)" error={e.cameraId}>
          <select name="cameraId" defaultValue={v.cameraId ?? ""} className={input}>
            <option value="">— brak —</option>
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>{c.id} · {c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Potwierdzenia" error={e.confirmations}>
          <input name="confirmations" type="number" min={1} defaultValue={v.confirmations ?? "1"} className={input} />
        </Field>
      </div>

      <Field label={`Pewność: ${Math.round(confidence * 100)}%`} error={e.confidence}>
        <input name="confidence" type="range" min={0} max={1} step={0.01}
          value={confidence} onChange={(ev) => setConfidence(Number(ev.target.value))}
          className="accent-cyan-400" />
      </Field>

      <label className="flex items-center gap-3 text-sm text-zinc-200">
        <input name="blocking" type="checkbox" defaultChecked={v.blocking === "on"}
          className="h-4 w-4 accent-red-500" />
        Blokuje ruch / przejście
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-bold text-black
                   shadow-[0_0_14px_rgba(34,211,238,0.8)] transition hover:bg-cyan-300
                   disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Zapisywanie…" : "Dodaj zgłoszenie"}
      </button>
    </form>
  );
}