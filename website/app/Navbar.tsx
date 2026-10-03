import Link from "next/link";
import { Activity } from "lucide-react";
import { APP_NAME } from "@/lib/meta";

const LINKS = [
  { href: "/", label: "Mapa" },
  { href: "/reports", label: "Zgłoszenia" },
];

export default function Navbar() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-6 border-b border-line bg-panel-solid px-4">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <span className="grid size-7 place-items-center rounded-lg bg-accent text-white">
          <Activity size={16} aria-hidden />
        </span>
        {APP_NAME}
      </Link>
      <nav aria-label="Główna nawigacja">
        <ul className="flex gap-1 text-sm">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="rounded-md px-3 py-1.5 text-muted hover:bg-panel-hover hover:text-foreground"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="ml-auto flex items-center gap-3 text-sm text-muted">
        <span className="hidden sm:inline">Dyspozytor miejski</span>
        <span className="grid size-8 place-items-center rounded-full bg-panel-hover text-xs font-medium text-foreground">
          DM
        </span>
      </div>
    </header>
  );
}
