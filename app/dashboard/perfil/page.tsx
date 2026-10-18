import type { Metadata } from "next";
import { ProfileScreen } from "@/features/profile";

export const metadata: Metadata = { title: "Meu perfil | TechSoil Systems" };

export default function ProfilePage() {
  return <ProfileScreen />;
}
