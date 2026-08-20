import type { Metadata } from "next";
import { SensorsScreen } from "@/features/sensors";

export const metadata: Metadata = {
  title: "Sensores | TechSoil Systems",
  description: "Acompanhe dispositivos, leituras do solo e alertas de conectividade.",
};

export default function SensorsPage() {
  return <SensorsScreen />;
}
