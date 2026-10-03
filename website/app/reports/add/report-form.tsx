"use client";

import { useActionState, useState, type ReactNode } from "react";
import { createReport, type FormState } from "./actions";
import { CATEGORY_LABELS, SOURCE_LABELS, STATUS_LABELS, type Camera } from "@/lib/types";

const input =
  "w-full rounded-lg border border-line bg-black/20 px-3 py-2 text-sm text-foreground " +
  "placeholder:text-subtle focus:border-accent focus:outline-none";

function Field({ label, error, children }: { label: string; error?: string[]; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-subtle">{label}</span>
      {children}
      {error?.[0] && <span className="text-xs text-rose-400">{error[0]}</span>}
    </label>
  );
}

function Options<T extends string>({ items }: { items: Record<T, string> }) {
  return (Object.entries(items) as [T, string][]).map(([value, label]) => (
    <option key={value} value={value}>{label}</option>
  ));
}

export default function ReportForm({ cameras }: { cameras: Camera[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createReport, {});
  const [confidence, setConfidence] = useState(0.7);
  const e = state.errors ?? {};
  const v = state.values ?? {};

  const [cameraId, setCameraId] = useState(v.cameraId ?? "");
  const camera = cameras.find((c) => c.id === cameraId);

  const readonly = input + " cursor-not-allowed opacity-60";

  return (
    <form
      action={action}
      className="flex flex-col gap-4 rounded-xl border border-line bg-panel-solid p-4 sm:p-5"
    >
      <Field label="Tytuł" error={e.title}>
        <input name="title" required defaultValue={v.title} placeholder="np. Dziura w jezdni" className={input} />
      </Field>

      <Field label="Opis" error={e.description}>
        <textarea name="description" required rows={4} defaultValue={v.description}
          placeholder="Co się dzieje i gdzie dokładnie?" className={input} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
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

      {/* Z kamerą położenie zgłoszenia to położenie kamery (tylko do odczytu); bez kamery — wpisane ręcznie. */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Długość geogr. (lng)" error={e.longitude}>
          <input
            name="longitude" type="number" step="any" required
            key={`lng-${cameraId}`}
            defaultValue={camera ? camera.position[0] : (v.longitude ?? "19.9373")}
            readOnly={!!camera}
            className={camera ? readonly : input}
          />
        </Field>
        <Field label="Szerokość geogr. (lat)" error={e.latitude}>
          <input
            name="latitude" type="number" step="any" required
            key={`lat-${cameraId}`}
            defaultValue={camera ? camera.position[1] : (v.latitude ?? "50.0617")}
            readOnly={!!camera}
            className={camera ? readonly : input}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kamera (opcjonalnie)" error={e.cameraId}>
          <select
            name="cameraId"
            value={cameraId}
            onChange={(ev) => setCameraId(ev.target.value)}
            className={input}
          >
            <option value="">— brak —</option>
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>{c.id} · {c.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Potwierdzenia" error={e.confirmations}>
          <input name="confirmations" type="number" min={1} defaultValue={v.confirmations ?? 1} className={input} />
        </Field>
      </div>

      <Field label={`Pewność: ${Math.round(confidence * 100)}%`} error={e.confidence}>
        <input name="confidence" type="range" min={0} max={1} step={0.01}
          value={confidence} onChange={(ev) => setConfidence(Number(ev.target.value))}
          className="accent-[var(--accent)]" />
      </Field>

      <label className="flex items-center gap-3 text-sm">
        <input name="blocking" type="checkbox" defaultChecked={v.blocking === "on"}
          className="size-4 accent-[var(--accent)]" />
        Blokuje ruch / przejście
      </label>

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-accent text-sm font-medium text-white enabled:hover:bg-accent/85 disabled:opacity-40"
      >
        {pending ? "Zapisywanie…" : "Dodaj zgłoszenie"}
      </button>
    </form>
  );
}