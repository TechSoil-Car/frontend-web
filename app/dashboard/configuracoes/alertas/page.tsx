import type { Metadata } from "next";
import { AlertSettingsScreen } from "@/features/sensors";

export const metadata: Metadata = {
  title: "Configuração de alertas | TechSoil Systems",
  description: "Configure limites operacionais e agronômicos por plantação.",
};

export default function AlertSettingsPage() {
  return <AlertSettingsScreen />;
}
