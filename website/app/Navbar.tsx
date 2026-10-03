import Link from "next/link";
import { Activity } from "lucide-react";
import { APP_NAME } from "@/lib/meta";
import AlarmButton from "@/components/AlarmButton";

const LINKS = [
  { href: "/centrum", label: "Centrum" },
  { href: "/reports", label: "Zgłoszenia" },
];

export default function Navbar() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-panel-solid px-3 sm:gap-6 sm:px-4">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
        <span className="grid size-7 place-items-center rounded-lg bg-accent text-white">
          <Activity size={16} aria-hidden />
        </span>
        {APP_NAME}
      </Link>
      <nav aria-label="Główna nawigacja">
        <ul className="flex gap-0.5 text-sm sm:gap-1">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="rounded-md px-2 py-1.5 text-muted sm:px-3 hover:bg-panel-hover hover:text-foreground"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <AlarmButton />
    </header>
  );
}
