import Anthropic from "@anthropic-ai/sdk";
import { APP_FULL_NAME, APP_NAME, CONTACT } from "@/lib/meta";

// Klient tworzony przy pierwszym zapytaniu — brak klucza nie może wysadzić modułu przy starcie ani przy buildzie.
let client: Anthropic | undefined;

const SYSTEM = `Jesteś asystentem ${APP_NAME} (${APP_FULL_NAME}) — miejskiego systemu Krakowa do zgłaszania problemów i kontaktu z miastem.
Odpowiadasz po polsku, krótko i prostym językiem, tak żeby zrozumiał każdy.

Kanały kontaktu:
- telefon: ${CONTACT.phone} (całą dobę, rozmowa zamienia się w zgłoszenie),
- SMS: ${CONTACT.sms} (opis problemu i adres),
- Telegram: @${CONTACT.telegram},
- zagrożenie życia, pożar, wypadek: zawsze najpierw ${CONTACT.emergency}.

Pomagasz: wybrać kanał kontaktu, opisać problem (co, gdzie, od kiedy), zrozumieć, co dzieje się dalej ze zgłoszeniem.
Nie wymyślaj faktów, których nie znasz (godzin otwarcia urzędów, terminów naprawy) — powiedz, że nie wiesz, i wskaż telefon.`;

const MAX_MESSAGES = 12;
const MAX_CHARS = 2000;

function parseMessages(body: unknown): Anthropic.MessageParam[] | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as { messages?: unknown }).messages)) return null;
  const raw = (body as { messages: unknown[] }).messages.slice(-MAX_MESSAGES);
  const out: Anthropic.MessageParam[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    out.push({ role, content: content.slice(0, MAX_CHARS) });
  }
  while (out.length && out[0].role !== "user") out.shift();
  return out.length && out[out.length - 1].role === "user" ? out : null;
}

export async function POST(request: Request) {
  const messages = parseMessages(await request.json().catch(() => null));
  if (!messages) return Response.json({ error: "Nieprawidłowe zapytanie." }, { status: 400 });

  try {
    client ??= new Anthropic();
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 2000,
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages,
    });
    if (response.stop_reason === "refusal") {
      return Response.json({ reply: `Nie mogę pomóc w tej sprawie. Zadzwoń: ${CONTACT.phone}.` });
    }
    const reply = response.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("")
      .trim();
    return Response.json({ reply: reply || `Nie mam odpowiedzi. Zadzwoń: ${CONTACT.phone}.` });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Chat: brak lub zły klucz ANTHROPIC_API_KEY");
    } else if (error instanceof Anthropic.RateLimitError) {
      console.error("Chat: limit zapytań");
    } else if (error instanceof Anthropic.APIError) {
      console.error(`Chat: błąd API ${error.status}`, error.message);
    } else {
      console.error("Chat:", error);
    }
    return Response.json({ error: "Czat jest chwilowo niedostępny." }, { status: 503 });
  }
}
