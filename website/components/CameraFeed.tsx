"use client";

import { useEffect, useState } from "react";
import type { Category, LiveSource } from "@/lib/types";

interface Detection {
  label: string;
  confidence: number;
  category: Category;
}

const LABEL: Partial<Record<Category, string>> = {
  drogi: "ubytek nawierzchni",
  zielen: "drzewo / gałęzie",
  woda: "rozlewisko",
  bezpieczenstwo: "zdarzenie drogowe",
};

/**
 * Podgląd kamery. Z `live` pokazuje prawdziwy obraz (odtwarzacz wideo albo
 * odświeżane zdjęcie); bez niego, lub gdy źródło nie odpowiada, stylizowany
 * podgląd (DEMO). Ramki wykryć docelowo z orkiestratora.
 */
export default function CameraFeed({
  seed,
  detection,
  offline,
  live,
}: {
  seed: string;
  detection?: Detection;
  offline?: boolean;
  live?: LiveSource;
}) {
  const [failed, setFailed] = useState(false);
  const label = detection ? (LABEL[detection.category] ?? detection.label) : null;

  if (live && !offline && !failed) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-lg bg-[#0e1016]">
        {live.kind === "embed" ? (
          <iframe
            src={live.src}
            title={`Kamera ${seed} na żywo`}
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : (
          <Snapshot src={live.src} refreshSec={live.refreshSec} onError={() => setFailed(true)} />
        )}
        {detection && (
          <div className="pointer-events-none absolute left-[47%] top-[65%] h-[24%] w-[30%] border-2 border-rose-500">
            <span className="absolute -top-4 left-[-2px] whitespace-nowrap bg-rose-500 px-1 font-mono text-[9px] leading-4 text-white">
              {label} {Math.round(detection.confidence * 100)}%
            </span>
          </div>
        )}
        {live.kind === "snapshot" && (
          <span className="pointer-events-none absolute bottom-1 right-1.5 text-[9px] text-white/70 [text-shadow:0_0_2px_black]">
            © {live.credit}
          </span>
        )}
      </div>
    );
  }

  return <SyntheticFeed seed={seed} label={label} detection={detection} offline={offline || failed} />;
}

/** Zdjęcie z kamery przeładowywane co `refreshSec` (parametr `t` omija cache). */
function Snapshot({ src, refreshSec, onError }: { src: string; refreshSec: number; onError: () => void }) {
  const [tick, setTick] = useState(() => Date.now());
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), refreshSec * 1000);
    return () => clearInterval(id);
  }, [refreshSec]);

  const url = `${src}${src.includes("?") ? "&" : "?"}t=${Math.floor(tick / 1000)}`;

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- zewnętrzne, często zmieniane zdjęcie */}
      <img
        src={url}
        alt="Aktualne zdjęcie z kamery"
        className="absolute inset-0 h-full w-full object-cover"
        onLoad={() => setLoadedAt(new Date())}
        onError={onError}
      />
      <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
        <span className="size-1.5 animate-pulse rounded-full bg-white" /> LIVE
      </span>
      {loadedAt && (
        <span className="absolute right-2 top-2 font-mono text-[10px] text-white/90 [text-shadow:0_0_2px_black]">
          {loadedAt.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
        </span>
      )}
    </>
  );
}

function SyntheticFeed({
  seed,
  label,
  detection,
  offline,
}: {
  seed: string;
  label: string | null;
  detection?: Detection;
  offline?: boolean;
}) {
  const h = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  const buildings = Array.from({ length: 7 }, (_, i) => ({
    x: i * 46 - 10 + ((h * (i + 3)) % 14),
    w: 38 + ((h * (i + 1)) % 18),
    hgt: 40 + ((h * (i + 7)) % 46),
  }));

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-[#0e1016]">
      <svg viewBox="0 0 320 180" className="h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={`sky-${seed}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#3b4a6b" />
            <stop offset="1" stopColor="#8a8fa3" />
          </linearGradient>
        </defs>
        <rect width="320" height="180" fill={`url(#sky-${seed})`} />
        {buildings.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={110 - b.hgt} width={b.w} height={b.hgt} fill={i % 2 ? "#4b4f5f" : "#5d6172"} />
            {Array.from({ length: Math.floor(b.hgt / 14) }, (_, r) => (
              <rect key={r} x={b.x + 6} y={110 - b.hgt + 6 + r * 14} width={b.w - 12} height="5" fill="#c9b98a" opacity={0.35} />
            ))}
          </g>
        ))}
        <polygon points="0,180 320,180 205,110 115,110" fill="#2b2e36" />
        <polygon points="0,180 40,180 125,110 115,110" fill="#3a3d46" />
        <polygon points="320,180 280,180 195,110 205,110" fill="#3a3d46" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={158 - i * 1.5} y={116 + i * 16} width={4 + i * 1.5} height={8 + i * 2} fill="#e5e7eb" opacity={0.7} />
        ))}
        {detection && (
          <g>
            <rect x="150" y="118" width="96" height="44" fill="none" stroke="#f43f5e" strokeWidth="2" />
            <rect x="150" y="104" width={Math.max(96, (label?.length ?? 0) * 5.6 + 34)} height="14" fill="#f43f5e" />
            <text x="154" y="114" fontSize="9" fill="white" fontFamily="monospace">
              {label} {Math.round(detection.confidence * 100)}%
            </text>
          </g>
        )}
      </svg>
      {offline && (
        <div className="absolute inset-0 grid place-items-center bg-black/70 text-xs text-muted">Kamera offline</div>
      )}
      <span className="absolute left-2 top-2 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
        DEMO
      </span>
      {!offline && (
        <span className="absolute right-2 top-2 flex items-center gap-1 font-mono text-[10px] text-white/80">
          <span className="size-1.5 rounded-full bg-rose-500" /> REC
        </span>
      )}
    </div>
  );
}
