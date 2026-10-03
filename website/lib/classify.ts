import type { Category } from "./types";

// Klasyfikator słów kluczowych — zastępstwo modelu językowego na etapie MVP.
// Docelowo: ta sama sygnatura, wywołanie LM po stronie serwera.

const KEYWORDS: Record<Exclude<Category, "inne">, string[]> = {
  drogi: ["dziur", "asfalt", "krawężnik", "znak", "sygnaliz", "światła", "nawierzchni", "ubytek", "zapadl"],
  zielen: ["drzew", "konar", "gałę", "krzew", "trawnik", "park", "liści", "korzeń"],
  woda: ["wod", "wyciek", "rur", "kanaliz", "zalan", "zalew", "hydrant", "ściek", "powódź", "kałuż"],
  odpady: ["śmieci", "smieci", "odpad", "kontener", "kosz", "wysypisk", "gruz", "worki"],
  oswietlenie: ["lamp", "oświetl", "oswietl", "latarni", "ciemno", "prąd", "kabel", "zasilan"],
  dostepnosc: ["wind", "wózk", "wozk", "podjazd", "niepełnospr", "niepelnospr", "schod", "niewidom", "barier", "rampa"],
  bezpieczenstwo: ["wypad", "kolizj", "pożar", "pozar", "dym", "zagroż", "zagroz", "niebezpie", "ranny", "awaria gaz", "gaz"],
};

// Słowa opisujące miejsce, a nie problem — ważą mniej niż obiekt zgłoszenia.
const LOCATION_HINTS: Partial<Record<Category, string[]>> = {
  drogi: ["jezdni", "chodnik", "ulic", "drog", "przejści"],
};

const BLOCKING = ["blokuj", "zablok", "nieprzejezd", "nie da się przejść", "nie da sie przejsc", "zamknięt", "całą jezdni", "cala jezdni", "na jezdnię", "na jezdni"];

export interface Classification {
  category: Category;
  confidence: number;
  blocking: boolean;
  matched: string[];
}

export function classify(text: string): Classification {
  const t = text.toLowerCase();
  let best: Category = "inne";
  let bestHits: string[] = [];
  let bestScore = 0;
  for (const [cat, words] of Object.entries(KEYWORDS) as [Category, string[]][]) {
    const hits = words.filter((w) => t.includes(w));
    const hints = (LOCATION_HINTS[cat] ?? []).filter((w) => t.includes(w));
    const score = hits.length + hints.length * 0.4;
    if (score > bestScore) {
      best = cat;
      bestHits = [...hits, ...hints];
      bestScore = score;
    }
  }
  const confidence = bestScore === 0 ? 0.3 : Math.min(0.95, 0.5 + bestScore * 0.18);
  return {
    category: best,
    confidence,
    blocking: BLOCKING.some((w) => t.includes(w)),
    matched: bestHits,
  };
}
