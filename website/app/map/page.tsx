import { redirect } from "next/navigation";

// Stara trasa mapy — mapa dyspozytora jest pod /centrum.
export default function MapPage() {
  redirect("/centrum");
}
