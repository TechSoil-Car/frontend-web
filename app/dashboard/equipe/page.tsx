import type { Metadata } from "next";
import { TeamScreen } from "@/features/organizations";

export const metadata: Metadata = {
  title: "Equipe | TechSoil Systems",
  description: "Gerencie organizações, participantes, papéis e convites.",
};

export default function TeamPage() {
  return <TeamScreen />;
}
