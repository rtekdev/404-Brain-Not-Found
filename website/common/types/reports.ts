export interface Report {
  id: string;                          // "K01", not a number anymore
  name: string;
  position: [number, number];          // [lng, lat]
  sector: string | null;
  online: boolean;
  webcamId: string | null;
  priority: "high" | "medium" | "low";
  metadata: Record<string, string | number>;
}