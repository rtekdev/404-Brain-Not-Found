import { Camera, Minus, Plus, Waves, Accessibility } from "lucide-react";
import { PRIORITY_COLOR } from "@/lib/meta";

export function Legend() {
  return (
    <div className="glass absolute bottom-3 left-3 z-10 hidden flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-3.5 py-2.5 text-xs text-muted md:flex md:max-w-[calc(100%-440px)]">
      <span className="flex items-center gap-1.5">
        <span className="size-3.5 rounded border-2 border-[#ede9fe]" /> Granica
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-3.5 rounded border-2 border-accent" /> Sektor
      </span>
      <span className="flex items-center gap-1.5">
        <span className="flex -space-x-1">
          {(["krytyczny", "wysoki", "sredni"] as const).map((p) => (
            <span key={p} className="size-3 rounded-full border border-[#15171c]" style={{ background: PRIORITY_COLOR[p] }} />
          ))}
        </span>
        Zgłoszenie
      </span>
      <span className="flex items-center gap-1.5"><Camera size={14} className="text-white" aria-hidden /> Kamera</span>
      <span className="flex items-center gap-1.5"><Waves size={14} className="text-cyan" aria-hidden /> Zasób</span>
      <span className="flex items-center gap-1.5"><Accessibility size={14} className="text-sky-400" aria-hidden /> Dostępność</span>
    </div>
  );
}

export function ZoomControls({ onZoom }: { onZoom: (delta: number) => void }) {
  return (
    <div className="glass absolute bottom-3 right-[404px] z-10 hidden flex-col overflow-hidden rounded-xl sm:flex">
      <button type="button" aria-label="Przybliż" onClick={() => onZoom(1)} className="grid size-10 place-items-center hover:bg-panel-hover">
        <Plus size={18} aria-hidden />
      </button>
      <div className="h-px bg-line" />
      <button type="button" aria-label="Oddal" onClick={() => onZoom(-1)} className="grid size-10 place-items-center hover:bg-panel-hover">
        <Minus size={18} aria-hidden />
      </button>
    </div>
  );
}
