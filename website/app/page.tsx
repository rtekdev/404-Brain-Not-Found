import { MessageSquare, Phone, Send, Siren } from "lucide-react";
import HelpChat from "@/components/HelpChat";
import { APP_FULL_NAME, CONTACT, telHref } from "@/lib/meta";

const linkClass =
  "flex h-full items-center justify-center gap-2 rounded-lg border border-line bg-panel-solid px-2 py-2 hover:bg-panel-hover";


export default function Home() {
  return (
    <main className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
      {/* m-auto: całość wyśrodkowana w pionie; przy rozwiniętym czacie strona się przewija. */}
      <div className="m-auto flex w-full max-w-xl flex-col gap-4">
        <h1 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">{APP_FULL_NAME}</h1>

        <a
          href={telHref(CONTACT.phone)}
          className="flex items-center justify-center gap-2.5 whitespace-nowrap rounded-xl bg-accent px-4 py-4 text-[clamp(1.25rem,6.5vw,1.875rem)] font-semibold text-white hover:bg-accent-soft sm:gap-3 sm:px-5"
        >
          <Phone className="size-6 shrink-0 sm:size-7" aria-hidden />
          <span>
            <span className="sr-only">Zadzwoń: </span>
            {CONTACT.phone}
          </span>
        </a>

        <ul className="grid grid-cols-3 gap-2 text-sm">
          <li>
            <a href={`sms:${CONTACT.sms.replace(/[^\d+]/g, "")}`} className={linkClass}>
              <MessageSquare size={16} className="text-cyan" aria-hidden /> SMS
            </a>
          </li>
          <li>
            <a href={`https://t.me/${CONTACT.telegram}`} className={linkClass}>
              <Send size={16} className="text-cyan" aria-hidden /> Telegram
            </a>
          </li>
          <li>
            <a href={telHref(CONTACT.emergency)} className={linkClass}>
              <Siren size={16} className="shrink-0 text-rose-400" aria-hidden />
              <span><span className="hidden sm:inline">Zagrożenie życia: </span>{CONTACT.emergency}</span>
            </a>
          </li>
        </ul>

        <HelpChat />
      </div>
    </main>
  );
}
