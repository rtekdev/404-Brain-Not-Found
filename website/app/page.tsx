import { MessageSquare, Phone, Send, Siren } from "lucide-react";
import HelpChat from "@/components/HelpChat";
import { APP_FULL_NAME, CONTACT, telHref } from "@/lib/meta";

const linkClass =
  "flex items-center gap-2 rounded-lg border border-line bg-panel-solid px-3 py-2 hover:bg-panel-hover";


export default function Home() {
  return (
    <main className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4">
        <h1 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">{APP_FULL_NAME}</h1>

        <a
          href={telHref(CONTACT.phone)}
          className="flex items-center justify-center gap-3 rounded-xl bg-accent px-5 py-4 text-2xl font-semibold text-white hover:bg-accent-soft sm:text-3xl"
        >
          <Phone size={28} aria-hidden />
          <span>
            <span className="sr-only">Zadzwoń: </span>
            {CONTACT.phone}
          </span>
        </a>

        <ul className="grid gap-2 text-sm sm:grid-cols-3">
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
              <Siren size={16} className="text-rose-400" aria-hidden /> Zagrożenie życia: {CONTACT.emergency}
            </a>
          </li>
        </ul>

        <HelpChat />
      </div>
    </main>
  );
}
