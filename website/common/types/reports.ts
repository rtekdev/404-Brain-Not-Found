export interface Report {
  id: number;
  title: string;
  location: string;
  priority: string;
  metadata: Record<string, string | number>;
};