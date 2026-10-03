"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
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
  const listRef = useRef<HTMLDivElement>(null);

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
    <section aria-labelledby="chat-title" className="flex min-h-64 flex-1 flex-col rounded-xl border border-line bg-panel-solid">
      <h2 id="chat-title" className="border-b border-line px-4 py-3 font-medium">
        Zapytaj asystenta AI
      </h2>
      <div ref={listRef} role="log" aria-live="polite" className="scroll-thin flex-1 space-y-3 overflow-y-auto p-4">
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
      <form onSubmit={send} className="flex gap-2 border-t border-line p-3">
        <label htmlFor="chat-input" className="sr-only">
          Twoje pytanie
        </label>
        <input
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Napisz pytanie…"
          maxLength={2000}
          className="min-w-0 flex-1 rounded-lg border border-line bg-background px-3 py-2"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="grid place-items-center rounded-lg bg-accent px-4 text-white hover:bg-accent-soft disabled:opacity-50"
        >
          <Send size={18} aria-hidden />
          <span className="sr-only">Wyślij</span>
        </button>
      </form>
    </section>
  );
}
