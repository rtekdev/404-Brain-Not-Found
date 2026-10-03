"use client";

import { usePathname, useRouter } from "next/navigation";
import { Siren } from "lucide-react";

/** Pokaz: w tej samej chwili wpadają dwa zgłoszenia — krytyczne (wypadek) i zwykłe (dziura). */
export default function AlarmButton() {
  const pathname = usePathname();
  const router = useRouter();

  const run = () => {
    // Mapa sama zapisuje zgłoszenia w bazie, a gdy baza zawiedzie — pokazuje alarm z danych lokalnych.
    if (pathname === "/centrum") window.dispatchEvent(new Event("swimm:simulate-alarm"));
    else router.push("/centrum?alarm=1");
  };

  return (
    <button
      type="button"
      onClick={run}
      title="Pokaz: krytyczne i zwykłe zgłoszenie w tej samej chwili"
      aria-label="Symuluj alarm"
      className="ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-rose-500/50 bg-rose-500/10 px-2 text-sm sm:px-3 font-medium text-rose-300 hover:bg-rose-500/20"
    >
      <Siren size={15} aria-hidden /> <span className="hidden sm:inline">Symuluj alarm</span>
    </button>
  );
}
