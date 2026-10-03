"use client"; // Granice błędów muszą być komponentami klienckimi.

import { useEffect } from "react";
import { RotateCw, TriangleAlert } from "lucide-react";
import { CONTACT } from "@/lib/meta";

/** Błąd strony (np. brak połączenia z bazą) — komunikat w wyglądzie aplikacji zamiast pustego ekranu. */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-6">
      <div className="w-full max-w-md rounded-xl border border-line bg-panel-solid p-6 text-center">
        <TriangleAlert size={28} className="mx-auto text-amber-400" aria-hidden />
        <h1 className="mt-3 text-lg font-semibold">Nie udało się wczytać tej strony</h1>
        <p className="mt-1 text-sm text-muted">
          Serwer albo baza danych chwilowo nie odpowiada. Pilne sprawy: {CONTACT.phone}, zagrożenie życia: {CONTACT.emergency}.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:bg-accent/85"
        >
          <RotateCw size={15} aria-hidden /> Spróbuj ponownie
        </button>
      </div>
    </main>
  );
}
