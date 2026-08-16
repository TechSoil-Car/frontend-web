import type { Metadata } from "next";
import { DashboardOverview } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Visão geral | TechSoil Systems",
  description: "Acompanhe a saúde do solo, dispositivos e operações da sua plantação.",
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
