import { reportEvents, startListener } from "@/lib/report-event";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  startListener();
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));

      const ping = setInterval(() => controller.enqueue(enc.encode(": ping\n\n")), 25_000);
      reportEvents.on("new_report", send);

      req.signal.addEventListener("abort", () => {
        clearInterval(ping);
        reportEvents.off("new_report", send);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}