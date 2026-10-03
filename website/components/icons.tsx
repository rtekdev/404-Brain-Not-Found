import {
  Accessibility,
  BatteryCharging,
  CircleHelp,
  Construction,
  Container,
  Droplets,
  Factory,
  Flame,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  Phone,
  PlugZap,
  ShieldAlert,
  SunMedium,
  Smartphone,
  Trash2,
  TreePine,
  TriangleAlert,
  Truck,
  Video,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { AccessKind, AssetKind, Category, Metric, Source } from "@/lib/types";

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  drogi: Construction,
  zielen: TreePine,
  woda: Droplets,
  odpady: Trash2,
  oswietlenie: Lightbulb,
  dostepnosc: Accessibility,
  bezpieczenstwo: ShieldAlert,
  inne: CircleHelp,
};

export const SOURCE_ICON: Record<Source, LucideIcon> = {
  kamera: Video,
  telefon: Phone,
  sms: MessageSquare,
  aplikacja: Smartphone,
  messenger: MessageCircle,
};

export const ASSET_ICON: Record<AssetKind, LucideIcon> = {
  zbiornik: Waves,
  przepompownia: Droplets,
  kontenery: Container,
  trafostacja: PlugZap,
  ladowarka: BatteryCharging,
  sprzet: Truck,
  fotowoltaika: SunMedium,
  elektrocieplownia: Factory,
  spalarnia: Flame,
};

export const METRIC_ICON: Record<Metric, LucideIcon> = {
  energia: Zap,
  woda: Droplets,
  odpady: Trash2,
  cieplo: Flame,
};

export const ACCESS_ICON: Record<AccessKind, LucideIcon> = {
  winda: Accessibility,
  podjazd: Accessibility,
  toaleta: Accessibility,
  przeszkoda: TriangleAlert,
};
