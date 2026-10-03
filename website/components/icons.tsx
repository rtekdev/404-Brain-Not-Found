import {
  Accessibility,
  BatteryCharging,
  CircleHelp,
  Construction,
  Container,
  Droplets,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  Phone,
  PlugZap,
  ShieldAlert,
  Smartphone,
  Trash2,
  TreePine,
  TriangleAlert,
  Truck,
  Video,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { AccessKind, AssetKind, Category, Source } from "@/lib/types";

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
};

export const ACCESS_ICON: Record<AccessKind, LucideIcon> = {
  winda: Accessibility,
  podjazd: Accessibility,
  toaleta: Accessibility,
  przeszkoda: TriangleAlert,
};
