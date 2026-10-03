"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronDown, Send, Sparkles } from "lucide-react";
import { CONTACT } from "@/lib/meta";

type Message = { role: "user" | "assistant"; content: string };

const GREETING: Message = {
  role: "assistant",
  content: "Dzień dobry! W czym mogę pomóc? Np. „Gdzie zgłosić dziurę w drodze?”",
};

export default function HelpChat() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  // Zwinięty: jedna linia z polem; rozwija się przy pierwszym kliknięciu albo fokusie.
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Po rozwinięciu (animacja 300 ms) pole wpisywania ma zostać na ekranie.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => formRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 320);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    let reply: string;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.slice(1) }),
      });
      const data = await res.json();
      reply = data.reply ?? `${data.error ?? "Coś poszło nie tak."} Zadzwoń: ${CONTACT.phone}.`;
    } catch {
      reply = `Brak połączenia. Zadzwoń: ${CONTACT.phone}.`;
    }
    setMessages([...next, { role: "assistant", content: reply }]);
    setBusy(false);
  }

  return (
    <section aria-labelledby="chat-title" className="rounded-xl border border-line bg-panel-solid">
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        inert={!open}
      >
        <div className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 id="chat-title" className="flex items-center gap-2 font-medium">
              <Sparkles size={16} className="text-accent-soft" aria-hidden /> Asystent AI
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Zwiń czat"
              className="rounded p-1 text-muted hover:bg-panel-hover hover:text-foreground"
            >
              <ChevronDown size={18} aria-hidden />
            </button>
          </div>
          <div ref={listRef} role="log" aria-live="polite" className="scroll-thin h-[min(22rem,38dvh)] space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <p
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto w-fit max-w-[85%] rounded-lg bg-accent px-3 py-2 text-white"
                    : "w-fit max-w-[85%] whitespace-pre-line rounded-lg bg-panel-hover px-3 py-2"
                }
              >
                <span className="sr-only">{m.role === "user" ? "Ty: " : "Asystent: "}</span>
                {m.content}
              </p>
            ))}
            {busy && <p className="text-sm text-muted">Asystent pisze…</p>}
          </div>
        </div>
      </div>
      <form ref={formRef} onSubmit={send} className={`flex gap-2 p-3 ${open ? "border-t border-line" : ""}`}>
        <label htmlFor="chat-input" className="sr-only">
          Opisz swój problem
        </label>
        <div className="relative min-w-0 flex-1">
          {!open && <Sparkles size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-accent-soft" aria-hidden />}
          <input
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Opisz swój problem, pomogę"
            maxLength={2000}
            className={`w-full rounded-lg border border-line bg-background py-2 pr-3 focus:border-accent focus:outline-none ${open ? "pl-3" : "pl-9"}`}
          />
        </div>
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className={`${open ? "grid" : "hidden"} place-items-center rounded-lg bg-accent px-4 text-white hover:bg-accent-soft disabled:opacity-50`}
        >
          <Send size={18} aria-hidden />
          <span className="sr-only">Wyślij</span>
        </button>
      </form>
    </section>
  );
}
