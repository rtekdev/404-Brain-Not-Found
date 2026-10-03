"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Film, Maximize2, X } from "lucide-react";

// Nagranie zdarzenia z kamery: miniatura w komunikacie, po kliknięciu powiększenie z paskiem klatek.
// Plik: public/clips/<id kamery>.mp4 — dopóki go nie ma, widać miejsce na nagranie i puste klatki.

const FRAMES = 6;

type Frame = { t: number; url?: string };

const fmtTime = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/** Klatki rozłożone równo po nagraniu, wycięte w przeglądarce (canvas). */
async function extractFrames(src: string, n: number): Promise<Frame[]> {
  const v = document.createElement("video");
  v.src = src;
  v.muted = true;
  v.preload = "auto";
  await new Promise((ok, no) => {
    v.onloadeddata = ok;
    v.onerror = no;
  });
  const c = document.createElement("canvas");
  c.width = 320;
  c.height = Math.round((320 * v.videoHeight) / v.videoWidth) || 180;
  const out: Frame[] = [];
  for (let i = 0; i < n; i++) {
    const t = (v.duration * (i + 0.5)) / n;
    v.currentTime = t;
    await new Promise((ok) => (v.onseeked = ok));
    c.getContext("2d")?.drawImage(v, 0, 0, c.width, c.height);
    out.push({ t, url: c.toDataURL("image/jpeg", 0.75) });
  }
  return out;
}

function Placeholder({ big }: { big?: boolean }) {
  return (
    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#1f2230] to-[#121319] text-subtle">
      <span className="flex flex-col items-center gap-1">
        <Film size={big ? 32 : 16} aria-hidden />
        {big && <span className="text-sm">Miejsce na nagranie z kamery</span>}
      </span>
    </div>
  );
}

export default function ClipPreview({ cameraId, label }: { cameraId: string; label: string }) {
  const src = `/clips/${cameraId}.mp4`;
  const [status, setStatus] = useState<"loading" | "ok" | "missing">("loading");
  const [open, setOpen] = useState(false);
  const [frames, setFrames] = useState<Frame[]>(() => Array.from({ length: FRAMES }, (_, i) => ({ t: i * 5 })));
  const [active, setActive] = useState<number | null>(null);
  const big = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (status !== "ok") return;
    let alive = true;
    extractFrames(src, FRAMES)
      .then((f) => alive && setFrames(f))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [src, status]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open]);

  const seek = (i: number) => {
    setActive(i);
    const v = big.current;
    if (v && status === "ok") {
      v.currentTime = frames[i].t;
      v.pause();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Powiększ nagranie: ${label}`}
        className="group relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg border border-white/15 sm:w-28"
      >
        {status !== "missing" && (
          <video
            src={src}
            muted
            loop
            autoPlay
            playsInline
            onLoadedData={() => setStatus("ok")}
            onError={() => setStatus("missing")}
            className={`h-full w-full object-cover ${status === "ok" ? "" : "hidden"}`}
          />
        )}
        {status !== "ok" && <Placeholder />}
        <span className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
          <Maximize2 size={16} className="text-white" aria-hidden />
        </span>
        <span className="absolute bottom-0.5 left-1 rounded bg-black/60 px-1 font-mono text-[9px] text-white/90">{cameraId}</span>
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Nagranie: ${label}`}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-3 backdrop-blur-sm"
          >
            <div onClick={(e) => e.stopPropagation()} className="animate-slide-in w-full max-w-3xl rounded-xl border border-line bg-panel-solid">
              <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                <Film size={16} className="text-accent-soft" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
                <span className="font-mono text-xs text-subtle">{cameraId}</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Zamknij nagranie"
                  className="rounded p-1 text-muted hover:bg-panel-hover hover:text-foreground"
                >
                  <X size={18} aria-hidden />
                </button>
              </div>

              <div className="aspect-video bg-black">
                {status === "ok" ? (
                  <video ref={big} src={src} controls autoPlay muted playsInline className="h-full w-full" />
                ) : (
                  <Placeholder big />
                )}
              </div>

              <div className="p-3">
                <h3 className="mb-2 text-xs text-subtle">Klatki</h3>
                <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {frames.map((f, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => seek(i)}
                        aria-label={`Klatka ${i + 1}, ${fmtTime(f.t)}`}
                        className={`relative block aspect-video w-full overflow-hidden rounded-md border ${active === i ? "border-accent" : "border-line hover:border-accent/60"}`}
                      >
                        {f.url ? (
                          // eslint-disable-next-line @next/next/no-img-element -- klatka wycięta w przeglądarce (data URL)
                          <img src={f.url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="grid h-full w-full place-items-center bg-black/30 text-xs text-subtle">{i + 1}</span>
                        )}
                        <span className="absolute bottom-0.5 right-1 rounded bg-black/60 px-1 font-mono text-[9px] text-white/90">{fmtTime(f.t)}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
