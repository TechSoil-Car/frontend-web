import type { Metadata } from "next";
import { PlantationsScreen } from "@/features/plantations";

export const metadata: Metadata = {
  title: "Plantações | TechSoil Systems",
  description: "Gerencie suas propriedades, setores e dispositivos vinculados.",
};

export default function PlantationsPage() {
  return <PlantationsScreen />;
}
