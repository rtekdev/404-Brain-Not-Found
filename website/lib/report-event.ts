import "server-only";
import { Client } from "pg";
import { EventEmitter } from "events";

const g = globalThis as unknown as { reportEvents?: EventEmitter; listening?: boolean };

export const reportEvents = (g.reportEvents ??= new EventEmitter());

async function connect() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  const retry = () => setTimeout(connect, 3000);
  client.on("error", () => client.end().catch(() => { }));
  client.on("end", retry);

  client.on("notification", (msg) => {
    if (msg.payload) reportEvents.emit("new_report", msg.payload);
  });

  try {
    await client.connect();
    await client.query("LISTEN new_report");
  } catch {
    retry();
  }
}

export function startListener() {
  if (g.listening) return;
  g.listening = true;
  connect();
}