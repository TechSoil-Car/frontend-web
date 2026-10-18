import type { Metadata } from "next";
import { AlertsScreen } from "@/features/alerts";

export const metadata: Metadata = {
  title: "Alertas ativos | TechSoil Systems",
  description:
    "Acompanhe alertas atuais da plantação por sensor, tipo e gravidade.",
};
export default function AlertsPage() {
  return <AlertsScreen />;
}
