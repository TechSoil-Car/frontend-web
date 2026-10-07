import type { Metadata } from "next";
import { TeamScreen } from "@/features/team/TeamScreen";

export const metadata: Metadata = {
  title: "Equipe | TechSoil Systems",
  description: "Gerencie os participantes e convites da plantação.",
};

export default function TeamPage() {
  return <TeamScreen />;
}
